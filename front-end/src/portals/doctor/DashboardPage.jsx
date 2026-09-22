import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { KpiTile, Panel, StatusPill, EmptyRow, PageHeader } from '../../components/ui';
import AppointmentActions from '../../features/appointments/AppointmentActions';
import ReferPatientModal from '../../features/appointments/ReferPatientModal';
import { useAppointmentActions } from '../../features/appointments/useAppointmentActions';
import { Appointments, Revenue } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { money, todayLabel, appointmentTime, plural } from '../../utils/format';


export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [referTarget, setReferTarget] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const [statsRes, listRes] = await Promise.all([Appointments.myStats(), Appointments.mine()]);
      setStats(statsRes?.data || {});
      setAppointments(Array.isArray(listRes?.data) ? listRes.data : []);
    } catch (err) {
      setError(err.message || 'Could not load your schedule. Check that the backend is running.');
    }
    // Earnings is its own call so a failure there never blanks the schedule.
    try {
      const res = await Revenue.myEarnings();
      setEarnings(res?.data || null);
    } catch {
      setEarnings(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const { act, busyId } = useAppointmentActions(load);

  const today = todayLabel();
  const todayRows = useMemo(
    () => appointments
      .filter((a) => a.dateLabel === today && a.status !== 'Cancelled')
      .sort((a, b) => appointmentTime(a) - appointmentTime(b)),
    [appointments, today],
  );
  const upcoming = useMemo(() => {
    const now = Date.now();
    return appointments
      .filter((a) => ['Pending', 'Confirmed'].includes(a.status) && appointmentTime(a) >= now)
      .sort((a, b) => appointmentTime(a) - appointmentTime(b))
      .slice(0, 8);
  }, [appointments]);

  const fee = user?.consultationFee ?? earnings?.consultationFee;

  return (
    <>
      <Header title="My Practice" />
      <div className="page-body">
        <PageHeader
          title={`Welcome back, ${user?.name || 'Doctor'}`}
          subtitle={loading ? 'Loading your practice…' : `${plural(appointments.length, 'appointment')} booked with you across NexCare.`}
        >
          <Link className="btn" to="/doctor/appointments">All appointments</Link>
          <Link className="btn primary" to="/doctor/earnings">Earnings</Link>
        </PageHeader>

        <Panel title="Doctor Profile Summary" style={{ marginBottom: 20 }}>
          <div className="summary-grid">
            <SummaryCell label="Doctor Name" value={user?.name || 'Dr. Doctor'} />
            <SummaryCell label="Employee ID" value={user?.employeeId || user?.id || '—'} />
            <SummaryCell label="Hospital" value={user?.hospitalName || user?.hospitalId || '—'} />
            <SummaryCell label="Department" value={user?.dept || user?.department || '—'} />
            <SummaryCell label="Specialization" value={user?.specialization || user?.dept || 'Consultant Specialist'} />
            <SummaryCell label="Qualification" value={user?.qualification || 'MBBS, MD'} />
            <SummaryCell label="Experience" value={user?.experienceYears ? `${user.experienceYears} Years` : '10 Years'} />
            <SummaryCell label="Consultation Fee" value={fee != null ? money(fee) : '—'} good />
            <SummaryCell label="Today's Schedule" value={user?.consultationTiming || '09:00 AM - 05:00 PM (Mon - Sat)'} wide />
          </div>
        </Panel>

        <div className="kpi-grid">
          <KpiTile tone="accent" label="Today" value={stats?.today ?? '—'} sub="appointments scheduled today" />
          <KpiTile label="Awaiting confirmation" value={stats?.pending ?? '—'} sub="patients waiting on you" />
          <KpiTile label="Completed" value={stats?.completed ?? '—'} sub={stats ? `of ${stats.total ?? 0} booked` : 'consultations to date'} />
          <KpiTile label="Patients seen" value={stats?.uniquePatients ?? '—'} sub="distinct patients" />
          <KpiTile
            tone="good"
            label="Consultation revenue"
            value={earnings ? money(earnings.grossEarnings) : '—'}
            sub={earnings ? `${earnings.appointmentsCompleted} completed · ${money(earnings.consultationFee)} per consultation` : 'nothing deducted by NexCare'}
          />
        </div>

        <Panel title="Today’s schedule" hint={today} flush>
          <table className="rev">
            <thead>
              <tr>
                <th>Time</th><th>Patient</th><th>Department</th>
                <th>Reason</th><th>Status</th><th className="num">Fee</th><th />
              </tr>
            </thead>
            <tbody>
              {error && <EmptyRow colSpan={7} error>{error}</EmptyRow>}
              {!error && loading && <EmptyRow colSpan={7}>Loading…</EmptyRow>}
              {!error && !loading && todayRows.length === 0 && <EmptyRow colSpan={7}>Nothing scheduled today.</EmptyRow>}
              {!error && todayRows.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.timeLabel}</strong></td>
                  <td>{a.patientName}</td>
                  <td>{a.department}</td>
                  <td className="muted">{a.reason || '—'}</td>
                  <td><StatusPill status={a.status} /></td>
                  <td className="num">{money(a.fee)}</td>
                  <td className="num" style={{ whiteSpace: 'nowrap' }}>
                    <AppointmentActions apt={a} onAct={act} onRefer={setReferTarget} busy={busyId === a.id} completeLabel="Mark complete" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Next up" hint="Upcoming confirmed and pending appointments" flush>
          <table className="rev">
            <thead>
              <tr><th>Date</th><th>Time</th><th>Patient</th><th>Reason</th><th>Status</th></tr>
            </thead>
            <tbody>
              {error && <EmptyRow colSpan={5}>—</EmptyRow>}
              {!error && loading && <EmptyRow colSpan={5}>Loading…</EmptyRow>}
              {!error && !loading && upcoming.length === 0 && <EmptyRow colSpan={5}>No upcoming appointments.</EmptyRow>}
              {!error && upcoming.map((a) => (
                <tr key={a.id}>
                  <td>{a.dateLabel}</td>
                  <td>{a.timeLabel}</td>
                  <td>{a.patientName}</td>
                  <td className="muted">{a.reason || '—'}</td>
                  <td><StatusPill status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <ReferPatientModal apt={referTarget} onClose={() => setReferTarget(null)} onCreated={load} />
    </>
  );
}

function SummaryCell({ label, value, good, wide }) {
  return (
    <div className={`summary-cell${wide ? ' wide' : ''}`}>
      <label>{label}</label>
      <span className={good ? 'good' : undefined}>{value}</span>
    </div>
  );
}
