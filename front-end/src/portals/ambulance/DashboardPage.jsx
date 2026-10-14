import { isAssigned, isCompleted, isInTransit, isPending, requestTime } from '../../features/ambulance/transportSteps';
import { useAmbulance } from './AmbulanceContext';
import { PriorityBadge, StatusBadge, locationOf, patientOf } from './ambulanceShared';

// #dashboard-page: renderDashboard() + DynamicRenderer.renderRecentRequests().
// Both wrote the recent table; the DynamicRenderer ran last, so what showed
// was the newest ten requests of any status, sorted by createdAt.
const svg = (d) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{d}</svg>;
const STATS = [
  { key: 'pending', label: 'Pending Requests', tone: 'orange-gradient', test: isPending, icon: svg(<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>) },
  { key: 'assigned', label: 'Assigned Requests', tone: 'blue-gradient', test: isAssigned, icon: svg(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>) },
  { key: 'active', label: 'Active Transport', tone: 'teal-gradient', test: isInTransit, icon: svg(<><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>) },
  { key: 'completed', label: 'Completed Today', tone: 'green-gradient', test: isCompleted, icon: svg(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></>) },
];

export default function DashboardPage() {
  const { user, profile, requests, loaded } = useAmbulance();
  const recent = [...requests].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 10);

  return (
    <div className="page active" id="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">Welcome, <span id="dashboard-user-name">{profile.name || user?.name || 'Ambulance Staff'}</span></h1>
        <p className="page-subtitle">Here's your ambulance operations overview for today</p>
      </div>

      <div className="stats-grid">
        {STATS.map((s) => (
          <div key={s.key} className="stat-card">
            <div className="stat-header"><div className={`stat-icon ${s.tone}`}>{s.icon}</div></div>
            <h3 className="stat-label">{s.label}</h3>
            <p className="stat-value" id={`stat-${s.key}`}>{requests.filter(s.test).length}</p>
          </div>
        ))}
      </div>

      <div className="content-card">
        <div className="card-header">
          <h2 className="card-title">Recent Ambulance Requests</h2>
          <p className="card-subtitle">Latest requests from the dispatch center</p>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Request ID</th><th>Patient Name</th><th>Pickup Location</th><th>Request Time</th><th>Priority Level</th><th>Status</th></tr>
            </thead>
            <tbody id="dashboard-recent-tbody">
              {!loaded && <tr><td colSpan={6} className="text-gray">Loading requests…</td></tr>}
              {loaded && recent.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                    <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>No ambulance requests found</p>
                    <p style={{ fontSize: 14 }}>New requests will appear here when they are created.</p>
                  </td>
                </tr>
              )}
              {recent.map((r) => (
                <tr key={r.id}>
                  <td><span className="request-id">{r.id}</span></td>
                  <td><span className="patient-name">{patientOf(r)}</span></td>
                  <td><span className="text-gray">{locationOf(r)}</span></td>
                  <td><span className="text-gray">{requestTime(r)}</span></td>
                  <td><PriorityBadge request={r} /></td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
