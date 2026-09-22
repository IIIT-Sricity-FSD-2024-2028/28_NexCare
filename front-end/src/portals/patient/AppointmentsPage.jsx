import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Appointments } from '../../api';
import { ConfirmDialog } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import useDoctorDirectory from '../../features/doctor-directory/useDoctorDirectory';
import { findHospital } from '../../features/doctor-directory/catalogue';
import BookingWizard, { EMPTY_BOOKING } from './booking/BookingWizard';

// patient/appointments/appointments.html + appointments.js.
//
// One page, three views — landing, "my appointments", and the booking wizard —
// which the HTML switched by toggling display on three sections. Here they are
// a `view` state, seeded from the query string exactly as the original did
// (?view=book|my, or ?hospitalId=… from a hospital card, which opens booking).

const badgeClass = (status) => ({
  Confirmed: 'badge-confirmed',
  Pending: 'badge-pending',
  Completed: 'badge-completed',
  Cancelled: 'badge-canceled',
}[status] || 'badge-gray');

export default function AppointmentsPage() {
  const [params, setParams] = useSearchParams();
  const { notify } = useToast();
  const { catalogue, loading: catalogueLoading, error: catalogueError } = useDoctorDirectory();

  const [view, setView] = useState('landing'); // landing | my | book
  const [booking, setBooking] = useState(EMPTY_BOOKING);
  const [appointments, setAppointments] = useState([]);
  const [confirm, setConfirm] = useState(null); // { title, message, onConfirm }
  const [seeded, setSeeded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await Appointments.getAll();
      setAppointments(Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.warn('Could not load appointments:', err.message);
      setAppointments([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // The wizard's catalogue has to be in before a deep link can pick its hospital,
  // so the query string is read once the directory has settled.
  useEffect(() => {
    if (seeded || catalogueLoading) return;
    const viewParam = params.get('view') || params.get('mode');
    const hospitalId = params.get('hospitalId');
    if (hospitalId) {
      setBooking({ ...EMPTY_BOOKING, hospital: findHospital(catalogue, hospitalId) });
      setView('book');
    } else if (viewParam === 'book') {
      setView('book');
    } else if (viewParam === 'view' || viewParam === 'my' || viewParam === 'appointments') {
      setView('my');
    }
    setSeeded(true);
  }, [seeded, catalogueLoading, catalogue, params]);

  /** Leaving a view drops the query string so a refresh does not reopen it. */
  function go(next) {
    setView(next);
    if (params.toString()) setParams({}, { replace: true });
  }

  function startBooking(prefill) {
    setBooking(prefill || EMPTY_BOOKING);
    go('book');
  }

  function showMine() {
    load();
    go('my');
  }

  function reschedule(appt) {
    startBooking({
      ...EMPTY_BOOKING,
      hospital: findHospital(catalogue, appt.hospitalId || appt.hospitalName),
      department: appt.department || null,
      doctor: appt.doctor || null,
    });
  }

  async function cancelAppt(id) {
    try {
      await Appointments.update(id, { status: 'Cancelled' });
      await load();
    } catch (err) {
      notify(err.message || 'Could not cancel the appointment', 'error');
    }
  }

  async function deleteAppt(id) {
    try {
      await Appointments.delete(id);
      await load();
    } catch (err) {
      notify(err.message || 'Could not delete the appointment', 'error');
    }
  }

  const upcoming = appointments.filter((a) => a.status !== 'Cancelled' && a.status !== 'Completed');
  const past = appointments.filter((a) => a.status === 'Completed' || a.status === 'Cancelled');
  const completedCount = appointments.filter((a) => a.status === 'Completed').length;

  return (
    <main className="main-content" id="appointmentsPage">
      {view === 'landing' && <Landing onBook={() => startBooking(null)} onView={showMine} />}

      {view === 'my' && (
        <section id="myAppointments" className="my-appointments">
          <div className="appointments-header">
            <div className="appointments-title">
              <div className="title-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M8 2v4M16 2v4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="white" strokeWidth="2" />
                  <path d="M3 10h18" stroke="white" strokeWidth="2" />
                </svg>
              </div>
              <div>
                <h1>My Appointments</h1>
                <p>NexCare - Patient Portal</p>
              </div>
            </div>
            <div className="appointments-actions">
              <button type="button" className="btn-primary" onClick={() => startBooking(null)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3.333v9.334M3.333 8h9.334" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Book New Appointment
              </button>
            </div>
          </div>

          <div className="appointment-stats">
            <StatCard tone="green" label="Upcoming Appointments" value={upcoming.length} icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M8 2v4M16 2v4" stroke="#008236" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="#008236" strokeWidth="2" />
                <path d="M3 10h18" stroke="#008236" strokeWidth="2" />
              </svg>
            } />
            <StatCard tone="blue" label="Completed" value={completedCount} icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#1447E6" strokeWidth="2" />
                <path d="M8 12l3 3 6-6" stroke="#1447E6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            } />
            <StatCard tone="purple" label="Total Appointments" value={appointments.length} icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M8 2v4M16 2v4M3 10h18" stroke="#8200DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20 6a2 2 0 012 2v3M4 6a2 2 0 00-2 2v10a2 2 0 002 2h7" stroke="#8200DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 21a5 5 0 100-10 5 5 0 000 10z" stroke="#8200DB" strokeWidth="2" />
              </svg>
            } />
          </div>

          <div className="appointments-section">
            <div className="section-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M8 2v4M16 2v4" stroke="#00A63E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="#00A63E" strokeWidth="2" />
                <path d="M3 10h18" stroke="#00A63E" strokeWidth="2" />
              </svg>
              <div>
                <h2>Upcoming Appointments</h2>
                <p>Your scheduled appointments</p>
              </div>
              <span className="badge badge-green-lg" id="upcomingBadge">{upcoming.length} Scheduled</span>
            </div>
            <div className="appointments-list">
              {upcoming.length === 0
                ? <EmptyItem>No upcoming appointments found</EmptyItem>
                : upcoming.map((a) => <AppointmentItem key={a.id} appt={a} onReschedule={reschedule} onCancel={setConfirm} onDelete={setConfirm} cancelAppt={cancelAppt} deleteAppt={deleteAppt} />)}
            </div>
          </div>

          <div className="appointments-section">
            <div className="section-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#1447E6" strokeWidth="2" />
                <path d="M8 12l3 3 6-6" stroke="#1447E6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <h2>Past Appointments</h2>
                <p>Your appointment history</p>
              </div>
              <span className="badge badge-gray" id="pastBadge">{past.length} Records</span>
            </div>
            <div className="appointments-list">
              {past.length === 0
                ? <EmptyItem>No past appointments found</EmptyItem>
                : past.map((a) => <AppointmentItem key={a.id} appt={a} onReschedule={reschedule} onCancel={setConfirm} onDelete={setConfirm} cancelAppt={cancelAppt} deleteAppt={deleteAppt} />)}
            </div>
          </div>

          <button type="button" className="btn-back" onClick={() => go('landing')}>← Back to Appointments</button>
        </section>
      )}

      {view === 'book' && (
        <div id="bookingFlow" className="booking-flow">
          <BookingWizard
            catalogue={catalogue}
            catalogueError={catalogueLoading ? '' : catalogueError}
            booking={booking}
            setBooking={setBooking}
            onBackToLanding={() => go('landing')}
            onViewAppointments={showMine}
          />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={async () => { const c = confirm; setConfirm(null); await c.onConfirm(); }}
      />
    </main>
  );
}

function StatCard({ tone, label, value, icon }) {
  return (
    <div className={`stat-card ${tone}-stat`}>
      <div className="stat-header">
        <div className="stat-details">
          <p>{label}</p>
          <h2>{value}</h2>
        </div>
        <div className={`stat-icon-rounded ${tone}`}>{icon}</div>
      </div>
    </div>
  );
}

function EmptyItem({ children }) {
  return (
    <div className="appointment-item">
      <div className="appointment-details"><h3>{children}</h3></div>
    </div>
  );
}

function AppointmentItem({ appt, onReschedule, onCancel, cancelAppt, deleteAppt }) {
  const hospital = appt.hospitalName || appt.hospital || 'NexCare Hospital';
  const doctor = appt.doctor && appt.doctor.startsWith('Dr.') ? appt.doctor : appt.doctorName || `Dr. ${appt.department || 'General'} Specialist`;
  const active = appt.status === 'Confirmed' || appt.status === 'Pending';

  return (
    <div className={`appointment-item${appt.status === 'Completed' ? ' completed' : ''}`}>
      <div className="appointment-emoji">🗓️</div>
      <div className="appointment-details">
        <div className="appointment-header">
          <h3>{appt.department}</h3>
          <span className={`badge ${badgeClass(appt.status)}`}>{appt.status}</span>
        </div>
        <div className="appointment-info-grid">
          <div className="info-item"><span>🏥 <strong>Hospital:</strong> {hospital}</span></div>
          <div className="info-item"><span>👨‍⚕️ <strong>Doctor:</strong> {doctor}</span></div>
          <div className="info-item"><span>📅 {appt.dateLabel}</span></div>
          <div className="info-item"><span>🕒 {appt.timeLabel}</span></div>
        </div>
        <div className="appointment-meta">
          <span className="token">Token / ID: {appt.token || appt.id}</span>
        </div>
      </div>
      <div className="appointment-actions" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {active && (
          <>
            <button type="button" className="btn-outline-sm" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => onReschedule(appt)}>🔄 Reschedule</button>
            <button
              type="button"
              className="btn-outline-sm"
              style={{ padding: '6px 12px', fontSize: 13, color: '#DC2626', borderColor: '#FCA5A5' }}
              title="Cancel"
              onClick={() => onCancel({ title: 'Cancel appointment', message: 'Are you sure you want to cancel this appointment?', confirmLabel: 'Cancel appointment', onConfirm: () => cancelAppt(appt.id) })}
            >
              🚫 Cancel
            </button>
          </>
        )}
        {appt.status === 'Cancelled' && (
          <button
            type="button"
            className="btn-outline-sm"
            style={{ padding: '6px 12px', fontSize: 13, color: '#DC2626' }}
            title="Delete"
            onClick={() => onCancel({ title: 'Delete appointment', message: 'Are you sure you want to delete this appointment?', confirmLabel: 'Delete', onConfirm: () => deleteAppt(appt.id) })}
          >
            ❌ Delete
          </button>
        )}
        {appt.status === 'Completed' && <span className="badge badge-completed">Completed</span>}
      </div>
    </div>
  );
}

function Landing({ onBook, onView }) {
  return (
    <section id="appointmentLanding" className="appointment-landing">
      <div className="landing-header">
        <h1>Appointment Management</h1>
        <p>Manage your healthcare appointments with ease. Book new appointments or view your existing schedule.</p>
      </div>

      <div className="landing-options">
        <div className="option-card" onClick={onBook}>
          <div className="option-icon blue">
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
              <path d="M12.667 3.167v6.5M25.333 3.167v6.5" stroke="#155DFC" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="4.75" y="6.333" width="28.5" height="28.5" rx="3" stroke="#155DFC" strokeWidth="3" />
              <path d="M4.75 15.833h28.5" stroke="#155DFC" strokeWidth="3" />
            </svg>
          </div>
          <h2>Book Appointment</h2>
          <p>Schedule a new appointment with our expert medical professionals. Choose your preferred department, date, and time slot.</p>
          <ul>
            <li><span className="bullet" />Select from 6 specialized departments</li>
            <li><span className="bullet" />Choose your preferred date and time</li>
            <li><span className="bullet" />Instant confirmation with appointment token</li>
          </ul>
          <button type="button" className="btn-link blue">
            Book Now
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="option-card" onClick={onView}>
          <div className="option-icon green">
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
              <path d="M12.667 3.167v6.5M25.333 3.167v6.5" stroke="#00A63E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="4.75" y="6.333" width="28.5" height="28.5" rx="3" stroke="#00A63E" strokeWidth="3" />
              <path d="M4.75 15.833h28.5M14 22l3 3 7-7" stroke="#00A63E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2>View Appointments</h2>
          <p>Access your appointment history and upcoming visits. Manage, reschedule, or cancel your existing appointments.</p>
          <ul>
            <li><span className="bullet green" />View all upcoming appointments</li>
            <li><span className="bullet green" />Check appointment status and details</li>
            <li><span className="bullet green" />Reschedule or cancel appointments</li>
          </ul>
          <button type="button" className="btn-link green">
            View Now
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="info-box">
        <div className="info-icon">
          <svg width="29" height="29" viewBox="0 0 29 29" fill="none">
            <circle cx="14.5" cy="14.5" r="12" stroke="#D08700" strokeWidth="2.5" />
            <path d="M14.5 8v6.5l4 2" stroke="#D08700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="info-content">
          <h3>Important Information</h3>
          <ul>
            <li>• Please arrive 15 minutes before your scheduled appointment time</li>
            <li>• Bring a valid ID and insurance card (if applicable)</li>
            <li>• Cancellations must be made at least 24 hours in advance</li>
            <li>• For emergency services, please call 911 immediately</li>
          </ul>
        </div>
      </div>

      <div className="stats-footer">
        <div className="stat-box blue"><h3>24/7</h3><p>Available Service</p></div>
        <div className="stat-box green"><h3>6</h3><p>Departments</p></div>
        <div className="stat-box purple"><h3>100+</h3><p>Expert Doctors</p></div>
      </div>
    </section>
  );
}
