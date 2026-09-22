import { useToast } from '../../context/ToastContext';
import { isCompleted, isHistory, isPending, priorityOf } from '../../features/ambulance/transportSteps';
import { useAmbulance } from './AmbulanceContext';
import { EmptyState, ICON_PATH, PageHeader, PriorityBadge, StatusBadge, locationOf, patientOf } from './ambulanceShared';

// #completed-transports-page: the three counters, the history table and the
// CSV export. app.js listed Cancelled requests here as "Completed"; they are
// shown with their own badge. Its "Delete" button called
// PATCH /ambulance/:id/cancel, which refuses a completed request (the
// record is the history), so every click failed — there is no delete here.
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default function CompletedTransportsPage() {
  const { notify } = useToast();
  const { requests, loaded } = useAmbulance();
  const history = requests.filter(isHistory).sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  const completed = history.filter(isCompleted);
  const pendingCount = requests.filter(isPending).length;
  const latest = completed[0];
  const completedAt = (t) => (t.completedDate && t.completedTime ? `${t.completedDate} at ${t.completedTime}` : t.completedDate || t.completedTime || '');

  function exportCsv() {
    if (completed.length === 0) { notify('No completed transports to export', 'warning'); return; }
    const headers = ['Transport ID', 'Patient Name', 'Pickup Location', 'Completed Date', 'Completed Time', 'Priority Level', 'Status'];
    const rows = completed.map((t) => [t.id, patientOf(t), locationOf(t), t.completedDate || '', t.completedTime || '', priorityOf(t), t.status].map(csvCell).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const filename = `completed-transports-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.csv`;
    try {
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      notify(`Exported ${completed.length} transports to ${filename}`, 'success');
    } catch (err) {
      console.error(err);
      notify('Failed to download CSV file. Please try again.', 'error');
    }
  }

  return (
    <div className="page active" id="completed-transports-page">
      <PageHeader title="Completed Transports">
        <button type="button" className="btn btn-primary btn-with-icon" onClick={exportCsv}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Export
        </button>
      </PageHeader>

      <div className="stats-grid-3">
        <div className="stat-card">
          <div className="stat-row"><h3 className="stat-label">Total Completed</h3><svg className="stat-icon-small" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg></div>
          <p className="stat-value" id="stat-total-completed">{completed.length}</p>
          <p className="stat-change" id="stat-completed-sub">{completed.length === 0 ? 'No transports yet' : completed.length === 1 ? '1 transport done' : `${completed.length} transports done`}</p>
        </div>
        <div className="stat-card">
          <div className="stat-row"><h3 className="stat-label">Pending Requests</h3><svg className="stat-icon-small" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg></div>
          <p className="stat-value" id="stat-pending-count">{pendingCount}</p>
          <p className="stat-change" id="stat-pending-sub">{pendingCount === 0 ? 'No pending requests' : pendingCount === 1 ? '1 request awaiting acceptance' : `${pendingCount} requests awaiting acceptance`}</p>
        </div>
        <div className="stat-card">
          <div className="stat-row"><h3 className="stat-label">Latest Transport</h3><svg className="stat-icon-small" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></div>
          <p className="stat-value" id="stat-latest-patient" style={{ fontSize: 16, fontWeight: 600 }}>{latest ? patientOf(latest) : '—'}</p>
          <p className="stat-change" id="stat-latest-time">{latest ? (completedAt(latest) || 'Time not recorded') : 'No completed transport yet'}</p>
        </div>
      </div>

      <div className="content-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Transport ID</th><th>Patient Name</th><th>Pickup Location</th><th>Completed At</th><th>Priority Level</th><th>Status</th></tr>
            </thead>
            <tbody id="completed-transports-tbody">
              {!loaded && <tr><td colSpan={6} className="text-gray">Loading…</td></tr>}
              {loaded && history.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={6}>
                    <EmptyState icon={ICON_PATH.check} title="No Completed Transports" description="No ambulance transports have been completed yet. Completed transports will appear here with detailed information." />
                  </td>
                </tr>
              )}
              {history.map((t) => (
                <tr key={t.id}>
                  <td><span className="request-id">{t.id}</span></td>
                  <td><span className="patient-name">{patientOf(t)}</span></td>
                  <td><span className="text-gray">{locationOf(t)}</span></td>
                  <td><span className="text-gray">{completedAt(t) || '—'}</span></td>
                  <td><PriorityBadge request={t} /></td>
                  <td><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
