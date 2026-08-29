import { useCallback, useEffect, useState } from 'react';
import StepIndicator from './components/StepIndicator.jsx';
import BookingWizard from './components/BookingWizard.jsx';
import MyAppointments from './components/MyAppointments.jsx';
import LoginPanel from './components/LoginPanel.jsx';
import { AppointmentsAPI, AuthAPI, HospitalsAPI, getBookedSlots, getSessionUser } from './api.js';

const EMPTY_BOOKING = {
  hospital: null,
  department: null,
  doctor: null,
  date: '',
  time: '',
  reason: '',
};

export default function App() {
  const [view, setView] = useState('landing');
  const [step, setStep] = useState(0);
  const [booking, setBooking] = useState(EMPTY_BOOKING);
  const [appointments, setAppointments] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [bookedSlots, setBookedSlots] = useState(new Set());
  const [status, setStatus] = useState({ loading: true, source: null, error: null });
  const [confirmed, setConfirmed] = useState(null);
  const [session, setSession] = useState(() => getSessionUser());
  const [authError, setAuthError] = useState(null);

  const patientId = session?.patientId || session?.id || 'P001';

  useEffect(() => {
    let cancelled = false;
    setStatus((s) => ({ ...s, loading: true }));
    HospitalsAPI.list().then((res) => {
      if (cancelled) return;
      setHospitals(res.hospitals);
      setStatus((s) => ({ ...s, loading: false, source: res.source }));
    });
    return () => { cancelled = true; };
  }, [session]);

  const refreshAppointments = useCallback(async () => {
    if (!session) return;
    const res = await AppointmentsAPI.list(patientId);
    if (res.success && Array.isArray(res.data)) {
      setAppointments(res.data.filter((a) => a.patientId === patientId));
    }
  }, [patientId, session]);

  useEffect(() => { refreshAppointments(); }, [refreshAppointments]);

  useEffect(() => {
    let cancelled = false;
    if (!booking.doctor || !booking.date) {
      setBookedSlots(new Set());
      return;
    }
    getBookedSlots(booking.doctor.name, toDateLabel(booking.date)).then((taken) => {
      if (!cancelled) setBookedSlots(taken);
    });
    return () => { cancelled = true; };
  }, [booking.doctor, booking.date]);

  const handleSelectHospital = useCallback((hospital) => {
    setBooking((prev) =>
      prev.hospital?.id === hospital.id
        ? prev
        : { ...EMPTY_BOOKING, hospital }
    );
    setStep(1);
  }, []);

  const handleSelectDepartment = useCallback((department) => {
    setBooking((prev) => ({ ...prev, department, doctor: null, time: '' }));
    setStep(2);
  }, []);

  const handleSelectDoctor = useCallback((doctor) => {
    setBooking((prev) => ({ ...prev, doctor, time: '' }));
  }, []);

  const handleSelectDate = useCallback((date) => {
    setBooking((prev) => ({ ...prev, date, doctor: null, time: '' }));
  }, []);

  const handleSelectSlot = useCallback((time) => {
    setBooking((prev) => ({ ...prev, time }));
  }, []);

  const handleChangeReason = useCallback((reason) => {
    setBooking((prev) => ({ ...prev, reason }));
  }, []);

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const handleNext = useCallback(() => {
    setStep((s) => Math.min(4, s + 1));
  }, []);

  const handleConfirmBooking = useCallback(async () => {
    setStatus((s) => ({ ...s, error: null }));

    const payload = {
      patientId,
      department: booking.department.name,
      doctor: booking.doctor.name,
      dateLabel: toDateLabel(booking.date),
      timeLabel: booking.time,
      fee: booking.department.fee ?? 500,
      reason: booking.reason || 'General consultation',
    };

    const res = await AppointmentsAPI.create(payload);

    if (res.success) {
      setConfirmed(res.data);
      setAppointments((prev) => [res.data, ...prev]);
      setStep(4);
      return;
    }

    if (res.offline) {
      const local = {
        ...payload,
        id: `APT-LOCAL-${Date.now()}`,
        token: `TKN-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'Pending',
        patientName: session?.name || 'Demo Patient',
        createdAt: new Date().toISOString(),
        local: true,
      };
      setConfirmed(local);
      setAppointments((prev) => [local, ...prev]);
      setStep(4);
      return;
    }

    setStatus((s) => ({ ...s, error: res.message }));
  }, [booking, patientId, session]);

  const handleCancelAppointment = useCallback(async (id) => {
    const res = await AppointmentsAPI.cancel(id);
    const applied = res.success || res.offline;
    if (applied) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'Cancelled' } : a))
      );
    }
    return applied ? null : res.message;
  }, []);

  const handleLogin = useCallback(async (email, password) => {
    setAuthError(null);
    const res = await AuthAPI.login(email, password);
    if (res.success) {
      setSession(getSessionUser());
      return;
    }
    setAuthError(res.offline
      ? 'Backend not reachable on :3001. You can still browse offline.'
      : res.message);
  }, []);

  const handleLogout = useCallback(() => {
    AuthAPI.logout();
    setSession(null);
    setAppointments([]);
    setView('landing');
  }, []);

  const startBooking = useCallback(() => {
    setBooking(EMPTY_BOOKING);
    setConfirmed(null);
    setStatus((s) => ({ ...s, error: null }));
    setStep(0);
    setView('book');
  }, []);

  const finishBooking = useCallback(() => {
    setBooking(EMPTY_BOOKING);
    setConfirmed(null);
    setStep(0);
    setView('mine');
    refreshAppointments();
  }, [refreshAppointments]);

  const upcoming = appointments.filter(
    (a) => a.status === 'Pending' || a.status === 'Confirmed'
  ).length;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">✚</span>
          <span className="brand-name">NexCare</span>
          <span className="brand-tag">Patient Portal · React</span>
        </div>
        <nav className="topnav">
          <button
            className={view === 'landing' ? 'navlink active' : 'navlink'}
            onClick={() => setView('landing')}
          >
            Overview
          </button>
          <button
            className={view === 'book' ? 'navlink active' : 'navlink'}
            onClick={startBooking}
          >
            Book Appointment
          </button>
          <button
            className={view === 'mine' ? 'navlink active' : 'navlink'}
            onClick={() => setView('mine')}
          >
            My Appointments <span className="pill">{appointments.length}</span>
          </button>
          {session && (
            <span className="who">
              {session.name}
              <button className="btn ghost sm" onClick={handleLogout}>Sign out</button>
            </span>
          )}
        </nav>
      </header>

      <div className={`data-source ${status.source === 'live' ? 'live' : 'offline'}`}>
        {status.loading
          ? 'Connecting to the NexCare API…'
          : status.source === 'live'
            ? 'Connected to the NexCare backend on :3001 — bookings are saved server-side.'
            : session
              ? 'Backend reachable but the live catalogue was empty — using the bundled hospital list.'
              : 'Not signed in — using the bundled hospital catalogue. The flow still works; bookings are kept in memory.'}
      </div>

      <main className="content">
        {view === 'landing' && (
          <section className="landing">
            <h1>Appointments</h1>
            <p className="lede">
              Book a consultation slot at a NexCare hospital, or review the visits you
              already have scheduled.
            </p>

            <div className="stat-row">
              <div className="stat">
                <span className="stat-value">{upcoming}</span>
                <span className="stat-label">Upcoming</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  {appointments.filter((a) => a.status === 'Completed').length}
                </span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat">
                <span className="stat-value">{appointments.length}</span>
                <span className="stat-label">Total</span>
              </div>
            </div>

            <div className="landing-actions">
              <button className="btn primary lg" onClick={startBooking}>
                Book a New Appointment
              </button>
              <button className="btn ghost lg" onClick={() => setView('mine')}>
                View My Appointments
              </button>
            </div>

            {!session && (
              <div className="login-wrap">
                <LoginPanel onLogin={handleLogin} error={authError} />
              </div>
            )}
          </section>
        )}

        {view === 'book' && (
          <section>
            <StepIndicator
              currentStep={step}
              labels={['Hospital', 'Department', 'Date & Doctor', 'Details']}
            />
            <BookingWizard
              step={step}
              booking={booking}
              hospitals={hospitals}
              bookedSlots={bookedSlots}
              confirmed={confirmed}
              error={status.error}
              loading={status.loading}
              onSelectHospital={handleSelectHospital}
              onSelectDepartment={handleSelectDepartment}
              onSelectDoctor={handleSelectDoctor}
              onSelectDate={handleSelectDate}
              onSelectSlot={handleSelectSlot}
              onChangeReason={handleChangeReason}
              onBack={handleBack}
              onNext={handleNext}
              onConfirm={handleConfirmBooking}
              onDone={finishBooking}
            />
          </section>
        )}

        {view === 'mine' && (
          <MyAppointments
            appointments={appointments}
            onCancel={handleCancelAppointment}
            onBook={startBooking}
          />
        )}
      </main>
    </div>
  );
}

export function toDateLabel(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return isoDate;
  return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
