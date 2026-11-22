import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addToast } from '../../store/toastSlice';
import { decideSchedule, fetchHmSchedules, selectHmSchedules } from '../../store/hospitalManagerSlice';
import useConfirm from '../../hooks/useConfirm';
import { LoadingCell } from './hmShared';

// TAB — Schedule Approvals: loadSchedules() / renderSchedules() /
// approveSchedule() / rejectSchedule(). The native confirm() became the
// shared ConfirmDialog; the two toasts the HTML fired per decision (its own
// and NexCareUI's, same text) are one.
const BADGE = {
  approved: { cls: 'badge-active', text: 'APPROVED' },
  rejected: { cls: 'badge-suspended', text: 'REJECTED', style: { background: '#FEE2E2', color: '#B91C1C' } },
  pending: { cls: 'badge-inactive', text: 'PENDING' },
};

export default function SchedulesPage() {
  const dispatch = useAppDispatch();
  const schedules = useAppSelector(selectHmSchedules);
  const { ask, dialog } = useConfirm();
  const [status, setStatus] = useState('');

  useEffect(() => { dispatch(fetchHmSchedules()); }, [dispatch]);

  const rows = schedules.list;
  const failed = Boolean(schedules.error);
  const loading = schedules.loading && rows.length === 0;

  async function decide(id, decision) {
    const question = decision === 'approved' ? 'Approve and publish this hospital schedule?' : 'Reject this hospital schedule?';
    if (!(await ask(question, { title: decision === 'approved' ? 'Approve schedule' : 'Reject schedule', confirmLabel: decision === 'approved' ? 'Approve' : 'Reject', danger: decision === 'rejected' }))) return;
    try {
      await dispatch(decideSchedule({ id, status: decision })).unwrap();
      dispatch(addToast({ message: decision === 'approved' ? 'Schedule approved and published!' : 'Schedule rejected', type: decision === 'approved' ? 'success' : 'warning' }));
    } catch (err) {
      dispatch(addToast({ message: typeof err === 'string' ? err : err?.message || (decision === 'approved' ? 'Could not approve schedule' : 'Could not reject schedule'), type: 'error' }));
    }
  }

  const filtered = rows.filter((s) => !status || s.status === status);
  const btn = (bg) => ({ padding: '4px 8px', fontSize: 12, borderRadius: 4, background: bg, color: '#fff', border: 'none', cursor: 'pointer' });

  return (
    <div className="card">
      <div className="card-header">
        <h2>Hospital-wide Schedule Requests</h2>
        <div className="search-filter-box">
          <select className="select-filter" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      <div className="table-responsive">
        <table className="data-table">
          <thead><tr><th>Valid</th><th>Coverage</th><th>Notes</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {failed && <LoadingCell colSpan={5}><span style={{ color: '#ef4444' }}>Failed to load schedules.</span></LoadingCell>}
            {!failed && loading && <LoadingCell colSpan={5}>Loading schedules...</LoadingCell>}
            {!failed && !loading && filtered.length === 0 && <LoadingCell colSpan={5}>No schedules found.</LoadingCell>}
            {filtered.map((s) => {
              const b = BADGE[s.status] || BADGE.pending;
              return (
                <tr key={s.id}>
                  <td>{(s.validFrom || '') + ' to ' + (s.validTo || '')}</td>
                  <td>{(s.slots || []).map((sl) => `${sl.department} · ${sl.shift}`).join('; ') || '—'}</td>
                  <td>{s.notes || '—'}</td>
                  <td><span className={`badge ${b.cls}`} style={b.style}>{b.text}</span></td>
                  <td>
                    {s.status === 'pending' ? (
                      <>
                        <button type="button" style={{ ...btn('#10B981'), marginRight: 4 }} onClick={() => decide(s.id, 'approved')}>Approve</button>
                        <button type="button" style={btn('#EF4444')} onClick={() => decide(s.id, 'rejected')}>Reject</button>
                      </>
                    ) : <span style={{ color: '#6A7282', fontSize: 12 }}>Processed</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {dialog}
    </div>
  );
}
