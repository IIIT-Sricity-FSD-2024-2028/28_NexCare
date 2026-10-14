import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Appointments, Beds, Feedback, Users } from '../../api';
import { useDialogs } from '../../components/ui/Dialogs';
import { useToast } from '../../context/ToastContext';
import { useHospitalId } from './staffData';

// administrative_staff/dashboard.html + dashboard.js.

function statusClass(status) {
  const s = status ? status.toLowerCase() : '';
  if (s.includes('completed')) return 'success';
  if (s.includes('progress')) return 'info';
  if (s.includes('waiting') || s.includes('pending')) return 'warning';
  return '';
}

export default function DashboardPage() {
  const hospitalId = useHospitalId();
  const { showLoading } = useDialogs();
  const { notify } = useToast();
  const [stats, setStats] = useState({ patients: '--', todayAppts: '--', beds: null, alerts: null });
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    const hideLoading = showLoading('Loading dashboard data...');
    (async () => {
      try {
        const [patientsResp, apptResp, bedsResp, feedbackResp] = await Promise.all([
          Users.getAll({ role: 'patient' }).catch(() => ({ data: [] })),
          Appointments.getAll({ hospitalId }).catch(() => ({ data: [] })),
          Beds.getAll({ hospitalId }).catch(() => ({ data: [] })),
          Feedback.getAll({ hospitalId }).catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;
        const patients = patientsResp.data || [];
        const all = apptResp.data || [];
        const beds = bedsResp.data || [];
        const feedbacks = feedbackResp.data || [];

        // "Today's" appointments — dashboard.js matched the current month and
        // year inside dateLabel, not the day.
        const now = new Date();
        const year = String(now.getFullYear());
        const month = now.toLocaleString('default', { month: 'long' });
        const todays = all.filter((a) => a.dateLabel && a.dateLabel.includes(year) && a.dateLabel.includes(month));

        let bedStat = null;
        if (beds.length > 0) {
          const available = beds.filter((b) => b.status && b.status.toLowerCase() === 'available').length;
          const percent = Math.round((available / beds.length) * 100);
          bedStat = { text: `${available}/${beds.length}`, trend: `${percent}% available`, cls: percent > 20 ? 'trend success' : 'trend down' };
        }

        const open = feedbacks.filter((f) => {
          const status = (f.status || '').toLowerCase();
          return status === 'open' || status === 'pending' || !f.status;
        }).length;

        setStats({
          patients: patients.length,
          todayAppts: todays.length,
          beds: bedStat,
          alerts: { count: open, trend: open > 0 ? 'Needs Attention' : 'All clear', cls: open > 0 ? 'trend down' : 'trend success' },
        });

        // The real full name from the patient record, newest first.
        const rows = all.map((appt) => {
          const record = patients.find((p) => p.id === appt.patientId);
          return { ...appt, patientName: record ? record.fullName : (appt.patientName || 'Unknown') };
        });
        rows.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setAppointments(rows);
      } catch (err) {
        console.error('Dashboard load failed:', err);
        if (!cancelled) {
          notify('Failed to load dashboard data. Please refresh the page.', 'error');
          setStats((s) => ({ ...s, patients: 'N/A', todayAppts: 'N/A' }));
        }
      } finally {
        hideLoading();
      }
    })();
    return () => { cancelled = true; hideLoading(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalId]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return appointments.filter((a) => {
      const pName = (a.patientName || a.name || '').toLowerCase();
      const dName = (a.doctor || '').toLowerCase();
      const dept = (a.department || a.dept || '').toLowerCase();
      return pName.includes(term) || dName.includes(term) || dept.includes(term);
    });
  }, [appointments, search]);

  return (
    <div className="sp-dashboard">
      <div className="header-row" style={{ display: 'flex', alignItems: 'flex-start' }}>
        <button
          type="button"
          className="btn-icon"
          onClick={() => document.body.classList.toggle('sidebar-collapsed')}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-main)', marginRight: 16, marginTop: 4 }}
          title="Toggle Sidebar"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>
        <div>
          <h1>Dashboard</h1>
          <div className="sub">Welcome back! Here's what's happening today.</div>
        </div>
      </div>

      <div className="cards">
        <div className="card stat">
          <p>Total Patients</p>
          <h3 id="totalPatientsCount">{stats.patients}</h3>
          <span className="trend up">+12%</span>
        </div>
        <div className="card stat">
          <p>Today's Appointments</p>
          <h3 id="todayApptCount">{stats.todayAppts}</h3>
          <span className="trend up">+5%</span>
        </div>
        <div className="card stat">
          <p>Available Beds</p>
          <h3 id="availableBedsCount">{stats.beds ? stats.beds.text : '--'}</h3>
          <span id="bedsTrend" className={stats.beds ? stats.beds.cls : 'trend neutral'}>{stats.beds ? stats.beds.trend : '--%'}</span>
        </div>
        <div className="card stat">
          <p>Pending Feedback</p>
          <h3 id="criticalAlertsCount">{stats.alerts ? stats.alerts.count : '--'}</h3>
          <span id="alertsTrend" className={stats.alerts ? stats.alerts.cls : 'trend down'}>{stats.alerts ? stats.alerts.trend : '--'}</span>
        </div>
      </div>

      <div className="filters" style={{ marginBottom: 10 }}>
        <input id="searchInput" className="search" placeholder="Search appointments..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card">
        <h3>Recent Appointments</h3>
        <div id="appointmentsList">
          {filtered.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>No recent appointments found.</div>
          ) : filtered.map((a) => (
            <div className="appointment" key={a.id}>
              <div className="avatar">⚕</div>
              <div className="info">
                <strong>{a.patientName || a.name || 'Unknown'}</strong>
                <div className="small">{a.doctor || 'TBD'} • {a.department || a.dept || 'General'}</div>
              </div>
              <div className="time">{a.timeLabel || a.time || ''}</div>
              <div className="status-wrap">
                <span className={`badge ${statusClass(a.status)}`}>{a.status || 'Pending'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>Quick Actions</h3>
        <div className="quick-actions">
          <Link to="/staff/manage-appointments" className="quick-action-card">
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            <span>Schedule Appointment</span>
          </Link>
          <Link to="/staff/patient-checkin" className="quick-action-card">
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-8 0v2" /><circle cx="12" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
            <span>Register Patient</span>
          </Link>
          <Link to="/staff/bed-allocation" className="quick-action-card">
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="10" width="18" height="5" rx="1" /><rect x="4" y="7" width="4" height="3" rx="1" /><line x1="3" y1="7" x2="3" y2="15" /><line x1="21" y1="10" x2="21" y2="15" /></svg>
            <span>Assign Bed</span>
          </Link>
          <Link to="/staff/feedback" className="quick-action-card">
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            <span>View Alerts</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
