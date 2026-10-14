import { useCallback, useEffect, useState } from 'react';
import { Leaves } from '../../api';
import { useHm } from './HmContext';
import { Badge, LoadingCell, isoDay } from './hmShared';
import useApprovals from './useApprovals';

// TAB — Doctor Leaves: loadLeaves() / filterLeaves(). The HTML had two
// <section id="leavesTab"> elements and switchTab() showed the first, which
// was empty — so this tab was blank on the HTML page. The second section's
// table is what is rendered here.
//
// Seeded leaves carry `type` (CASUAL) and no `daysCount`; dashboard.js read
// `leaveType` / `daysCount` and printed "Casual Leave" / "1 day" for every
// row, so the SPA reads both spellings and counts the days itself.
export function leaveDays(l) {
  if (l.daysCount) return Number(l.daysCount);
  const a = new Date(l.startDate); const b = new Date(l.endDate);
  if (Number.isNaN(a) || Number.isNaN(b)) return 1;
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}
const typeLabel = (l) => l.leaveType || (l.type ? `${l.type.charAt(0).toUpperCase()}${l.type.slice(1).toLowerCase()} Leave` : 'Casual Leave');

export default function LeavesPage() {
  const { hospitalId, version } = useHm();
  const [leaves, setLeaves] = useState(null);
  const [failed, setFailed] = useState(false);
  const [term, setTerm] = useState('');
  const [status, setStatus] = useState('pending'); // "Pending Only" was preselected
  const [dept, setDept] = useState('ALL');

  const load = useCallback(async () => {
    if (!hospitalId) return;
    try {
      const res = await Leaves.getAll({ hospitalId });
      setLeaves(Array.isArray(res.data) ? res.data : []);
      setFailed(false);
    } catch (e) {
      console.error('Error loading leaves:', e);
      setFailed(true);
      setLeaves([]);
    }
  }, [hospitalId]);
  useEffect(() => { load(); }, [load, version]);

  const { approveLeave, rejectLeave, dialogs } = useApprovals(load);

  const depts = [...new Set((leaves || []).map((l) => l.department).filter(Boolean))];
  const q = term.trim().toLowerCase();
  const filtered = (leaves || []).filter((l) =>
    (status === 'ALL' || (l.status || '').toLowerCase() === status)
    && (dept === 'ALL' || l.department === dept)
    && (!q || (l.doctorName || '').toLowerCase().includes(q) || (l.reason || '').toLowerCase().includes(q) || (l.specialization || '').toLowerCase().includes(q)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div className="card">
        <div className="card-header flex-between">
          <div>
            <h2>Doctor Leave Requests</h2>
            <p className="card-subtitle">Review, approve, or reject doctor leave applications with strict hospital scoping</p>
          </div>
          <div className="filter-toolbar">
            <input type="text" className="input-search" placeholder="Search doctor or reason..." value={term} onChange={(e) => setTerm(e.target.value)} />
            <select className="select-filter" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="pending">Pending Only</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select className="select-filter" value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="ALL">All Departments</option>
              {depts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr><th>Doctor Name</th><th>Department & Specialization</th><th>Leave Type</th><th>Leave Period</th><th>Days</th><th>Reason</th><th>Status & Audit</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {failed && <LoadingCell colSpan={8} tone="danger">Failed to load doctor leaves.</LoadingCell>}
              {!failed && leaves === null && <LoadingCell colSpan={8}>Loading doctor leave requests...</LoadingCell>}
              {leaves && filtered.length === 0 && !failed && <LoadingCell colSpan={8}>No leave requests match the selected criteria.</LoadingCell>}
              {filtered.map((leave) => {
                const st = (leave.status || 'pending').toLowerCase();
                const days = leaveDays(leave);
                return (
                  <tr key={leave.id}>
                    <td><strong>{leave.doctorName || 'Dr. Practitioner'}</strong><div style={{ fontSize: 11, color: '#64748B' }}>ID: {leave.doctorId || 'DOC'}</div></td>
                    <td><strong>{leave.department || 'Clinical'}</strong><div style={{ fontSize: 11, color: '#64748B' }}>{leave.specialization || 'Consultant'}</div></td>
                    <td><Badge tone="role">{typeLabel(leave)}</Badge></td>
                    <td>{leave.startDate} to {leave.endDate}</td>
                    <td><strong>{days} day{days === 1 ? '' : 's'}</strong></td>
                    <td>{leave.reason || 'Personal / Medical'}</td>
                    <td>
                      <Badge tone={st === 'pending' ? 'pending' : st === 'approved' ? 'active' : 'rejected'}>{st.toUpperCase()}</Badge>
                      {st === 'approved' && leave.approvedByName && (
                        <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>Approved by {leave.approvedByName} on {leave.approvedAt ? isoDay(leave.approvedAt) : 'record'}</div>
                      )}
                      {st === 'rejected' && (
                        <div style={{ fontSize: 11, color: '#DC2626', marginTop: 2 }}><strong>Rejected:</strong> {leave.rejectionReason || 'By Manager'}{leave.rejectedByName ? ` (${leave.rejectedByName})` : ''}</div>
                      )}
                    </td>
                    <td>
                      {st === 'pending' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button type="button" className="btn-action-sm btn-action-approve" onClick={() => approveLeave(leave.id)}>Approve</button>
                          <button type="button" className="btn-action-sm btn-action-reject" onClick={() => rejectLeave(leave.id)}>Reject</button>
                        </div>
                      ) : <span style={{ fontSize: 12, color: '#94A3B8' }}>Completed</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {dialogs}
    </div>
  );
}
