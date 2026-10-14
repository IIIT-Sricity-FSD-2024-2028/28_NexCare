import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Feedback, Patients, System, Users } from '../../api';
import usePolling from '../../hooks/usePolling';
import { pageLink } from '../../api/links';
import { SuPage } from './suShared';

// superuser/dashboard.html + dashboard.js: four platform-wide counts, the
// quick-action cards and the last ten audit rows, refreshed every 30 seconds
// (the page's bare setInterval, as a hook with cleanup).

const stroke = (color, size, children, extra = {}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" {...extra}>{children}</svg>
);
const usersPath = <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>;
const patientsPath = <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>;
const chatPath = <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />;

const STATS = [
  { key: 'staff', label: 'Staff Users', trend: '↑ Manage Users', trendClass: 'trend-up', tone: 'blue',
    icon: stroke('#2563EB', 26, usersPath, { strokeLinecap: 'round', strokeLinejoin: 'round' }) },
  { key: 'patients', label: 'Total Patients', trend: '↑ Hospital Registry', trendClass: 'trend-up', tone: 'green',
    icon: stroke('#059669', 26, patientsPath) },
  { key: 'doctors', label: 'Active Doctors', trend: '↓ Registered Specialists', trendClass: 'trend-up', tone: 'purple',
    icon: stroke('#7C3AED', 26, <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM9 19c-1.3 0-2.4-.4-3.1-.9-.8-.5-1.4-1.2-1.9-2.1L2 21h14l-2-5c-.5.9-1.1 1.6-1.9 2.1-.7.5-1.8.9-3.1.9zm13-8h-3V8a2 2 0 0 0-2-2h-3a2 2 0 0 0-2 2v3h-3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2v-3h3a2 2 0 0 0 2 2v-3a2 2 0 0 0-2-2z" fill="#7C3AED" />) },
  { key: 'feedback', label: 'Pending Feedback', trend: '↓ Needs Review', trendClass: 'trend-down', tone: 'orange',
    icon: stroke('#EA580C', 26, chatPath) },
];

const ACTIONS = [
  { to: 'superuser/manage-users', title: 'Add User', sub: 'Create new account', tone: 'bg-blue',
    icon: stroke('#2563EB', 24, <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></>) },
  { to: 'superuser/patient-directory', title: 'Patient Directory', sub: 'View all registrations', tone: 'bg-green',
    icon: stroke('#059669', 24, patientsPath) },
  { to: 'superuser/system-settings', title: 'Settings', sub: 'Platform configuration', tone: 'bg-purple',
    icon: stroke('#7C3AED', 24, <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></>) },
  { to: 'superuser/feedback', title: 'Feedback Review', sub: 'Patient & Staff reports', tone: 'bg-pink',
    icon: stroke('#DB2777', 24, chatPath) },
  { to: 'superuser/reports', title: 'Reports & Analytics', sub: 'Portal performance metrics', tone: 'bg-orange',
    icon: stroke('#EA580C', 24, <><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></>) },
];

function badgeClass(action) {
  const a = String(action).toLowerCase();
  return a === 'create' ? 'badge-create' : a === 'delete' ? 'badge-delete' : 'badge-update';
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null); // null = '--', 'N/A' on failure
  const [activity, setActivity] = useState({ state: 'loading', rows: [] });

  const load = useCallback(() => {
    Promise.all([Users.getAll(), Patients.getAll(), Feedback.getAll()])
      .then(([usersRes, patientsRes, feedbackRes]) => {
        const users = usersRes.data || [];
        const patients = patientsRes.data || [];
        const feedback = feedbackRes.data || [];
        setStats({
          // Staff users only (exclude patients — they have their own Patient Directory)
          staff: users.filter((u) => u.role !== 'patient').length,
          patients: patients.length,
          doctors: users.filter((u) => u.role === 'doctor' && u.status === 'Active').length,
          feedback: feedback.filter((f) => f.status === 'Open' || f.status === 'Pending' || !f.resolved).length,
        });
      })
      .catch((err) => {
        console.error('Failed to load dashboard stats:', err);
        setStats({ staff: 'N/A', patients: 'N/A', doctors: 'N/A', feedback: 'N/A' });
      });

    System.getRecentActivity()
      .then((res) => setActivity({ state: 'ready', rows: (res.data || []).slice(0, 10) }))
      .catch((err) => {
        console.error('Failed to load activity log:', err);
        setActivity({ state: 'error', rows: [] });
      });
  }, []);

  // Auto-refresh every 30 seconds
  usePolling(load, 30000);

  return (
    <SuPage className="su-page su-dashboard" title="System Command Center">
      <div className="hero">
        <h1>Welcome back, System Administrator</h1>
        <p>Hospital management and platform diagnostic command center.</p>
      </div>

      <div className="stats-grid">
        {STATS.map((s) => (
          <div className="stat-card" key={s.key}>
            <div className="stat-info">
              <p className="stat-label">{s.label}</p>
              <p className="stat-value" id={`${s.key}Count`}>{stats ? stats[s.key] : '--'}</p>
              <span className={`stat-trend ${s.trendClass}`}>{s.trend}</span>
            </div>
            <div className={`stat-icon ${s.tone}`}>{s.icon}</div>
          </div>
        ))}
      </div>

      <h2 className="section-title">Quick Actions</h2>
      <div className="quick-actions-grid">
        {ACTIONS.map((a) => (
          <Link to={pageLink(a.to)} className="action-card" key={a.to}>
            <div className={`action-icon ${a.tone}`}>{a.icon}</div>
            <div className="action-info">
              <h3>{a.title}</h3>
              <p>{a.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="activity-card">
        <div className="activity-header">
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#101828', margin: 0 }}>Recent System Activity</h2>
          <Link to={pageLink('superuser/reports', { tab: 'security' })} className="btn-outline" style={{ fontSize: 13, padding: '8px 16px', textDecoration: 'none' }}>Full Log →</Link>
        </div>
        <table className="activity-table">
          <thead>
            <tr><th>Date</th><th>Actor</th><th>Action</th><th>Module</th><th>Details</th></tr>
          </thead>
          <tbody id="activityTableBody">
            {activity.state === 'loading' ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#6A7282' }}>Loading activity...</td></tr>
            ) : activity.state === 'error' ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#dc2626' }}>Could not load activity log. Backend may be unavailable.</td></tr>
            ) : !activity.rows.length ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#6A7282' }}>No system activity recorded yet.</td></tr>
            ) : activity.rows.map((act, i) => {
              const date = act.timestamp || act.createdAt || act.date || '';
              const action = act.action || act.type || '—';
              return (
                <tr key={act.id || i}>
                  <td>{date ? new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</td>
                  <td className="actor-cell">{String(act.actor || act.userId || 'System')}</td>
                  <td><span className={`badge-action ${badgeClass(action)}`}>{String(action)}</span></td>
                  <td>{String(act.module || act.resource || '—')}</td>
                  <td className="details-cell">{String(act.details || act.description || '—')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SuPage>
  );
}
