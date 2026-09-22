import { useCallback, useEffect, useState } from 'react';
import { Leaves, Users } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useHospitalId } from './staffData';
import useConfirm from '../../hooks/useConfirm';

// administrative_staff/leave-requests.html + leave-requests.js.
//
// Administrative staff record leave requests on behalf of hospital staff and
// track their status. Approving or rejecting is enforced server-side as
// hospital_manager / superuser only (LeaveRequestGuard), so this page
// deliberately offers no approve/reject action.

function formatDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}
const truncate = (text, max) => (!text ? 'N/A' : text.length <= max ? text : `${text.substring(0, max)}...`);
const today = () => new Date().toISOString().split('T')[0];

export default function LeaveRequestsPage() {
  const hospitalId = useHospitalId();
  const { notify } = useToast();
  const { ask, dialog } = useConfirm();
  const [leaves, setLeaves] = useState([]);
  const [staff, setStaff] = useState(null); // null = loading
  const [status, setStatus] = useState('all');
  const [term, setTerm] = useState('');
  const [form, setForm] = useState(null); // { staffId, startDate, endDate, reason }
  const [view, setView] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadLeaves = useCallback(async () => {
    try {
      const res = await Leaves.getAll(hospitalId ? { hospitalId } : {});
      setLeaves(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.warn('Failed to load leaves from backend:', error);
      notify('Failed to load leave requests. Please check your connection and try again.', 'error');
      setLeaves([]);
    }
  }, [hospitalId, notify]);

  // The staff directory powers the "who is this leave for" dropdown.
  const loadStaff = useCallback(async () => {
    try {
      const res = await Users.getAll();
      const users = Array.isArray(res.data) ? res.data : [];
      setStaff(users.filter((u) =>
        u.role !== 'patient' && u.role !== 'superuser' && u.status === 'Active'
        && (!hospitalId || !u.hospitalId || u.hospitalId === hospitalId)));
    } catch (error) {
      notify('Failed to load staff directory. Please check your connection and try again.', 'error');
      console.warn('Failed to load staff directory:', error);
      setStaff([]);
    }
  }, [hospitalId, notify]);

  useEffect(() => { loadStaff(); loadLeaves(); }, [loadStaff, loadLeaves]);

  const count = (s) => leaves.filter((l) => (l.status || '').toLowerCase() === s).length;
  const q = term.trim().toLowerCase();
  const filtered = leaves.filter((leave) => {
    const matchesStatus = status === 'all' || (leave.status || '').toLowerCase() === status;
    const haystack = `${leave.doctorName || ''} ${leave.id || ''}`.toLowerCase();
    return matchesStatus && (!q || haystack.includes(q));
  });

  async function submit(e) {
    e.preventDefault();
    const { staffId, startDate, endDate } = form;
    const reason = form.reason.trim();
    if (!staffId || !startDate || !endDate || !reason) { notify('Please fill in every field', 'error'); return; }
    if (endDate < startDate) { notify('End date cannot be before the start date', 'error'); return; }
    const member = (staff || []).find((u) => u.id === staffId);
    // The backend leave record keys on doctorId/doctorName — the directory
    // record the leave belongs to.
    const payload = { doctorId: staffId, doctorName: member ? member.name : 'Unknown', hospitalId: hospitalId || undefined, startDate, endDate, reason };
    setSubmitting(true);
    try {
      const res = await Leaves.create(payload);
      if (res.data) setLeaves((prev) => [res.data, ...prev]);
      setForm(null);
      notify('Leave request recorded successfully', 'success');
    } catch (error) {
      // 409 from LeaveRequestGuard = an approved leave already covers these dates.
      const conflict = error?.status === 409 || String(error?.message || '').includes('409') || String(error?.message || '').toLowerCase().includes('overlap');
      notify(conflict ? 'That staff member already has an approved leave covering these dates' : (error?.message || 'Failed to record leave request'), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelLeave(leaveId) {
    if (!(await ask('Withdraw this leave request?', { title: 'Withdraw request', confirmLabel: 'Withdraw', danger: true }))) return;
    try {
      await Leaves.delete(leaveId);
    } catch (error) {
      notify(error?.message || 'Failed to withdraw request', 'error');
      return;
    }
    setLeaves((prev) => prev.filter((l) => l.id !== leaveId));
    notify('Leave request withdrawn', 'success');
  }

  return (
    <div className="sp-leaves">
      <div className="header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Staff Leave Requests</h1>
          <div className="sub">Record and track leave requests for hospital staff.</div>
        </div>
        <button type="button" className="btn-dark" onClick={() => setForm({ staffId: '', startDate: '', endDate: '', reason: '' })}>+ Record Leave Request</button>
      </div>

      <div className="notice">
        Administrative staff record and track leave requests. Approving or rejecting a request
        is reserved for the hospital manager or the system administrator.
      </div>

      <div className="stats-row">
        <div className="stat-box"><div className="label">Pending</div><div className="value" id="pendingCount">{count('pending')}</div></div>
        <div className="stat-box"><div className="label">Approved</div><div className="value" id="approvedCount">{count('approved')}</div></div>
        <div className="stat-box"><div className="label">Rejected</div><div className="value" id="rejectedCount">{count('rejected')}</div></div>
      </div>

      <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
        <input type="text" id="searchTable" className="form-input" placeholder="Search by staff name or leave ID..." style={{ width: 300 }} value={term} onChange={(e) => setTerm(e.target.value)} />
        <select className="form-select" id="statusFilter" style={{ width: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Leave ID</th><th>Staff Member</th><th>Date Range</th><th>Reason</th><th>Status</th><th>Applied On</th><th>Actions</th></tr>
            </thead>
            <tbody id="leavesTableBody">
              {filtered.map((leave) => {
                const s = (leave.status || 'pending').toLowerCase();
                return (
                  <tr key={leave.id}>
                    <td>{leave.id}</td>
                    <td>{leave.doctorName || 'Unknown'}</td>
                    <td>{formatDate(leave.startDate)} &ndash; {formatDate(leave.endDate)}</td>
                    <td>{truncate(leave.reason, 40)}</td>
                    <td><span className={`badge ${s}`}>{s}</span></td>
                    <td>{formatDate(leave.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button type="button" className="action-btn" title="View details" onClick={() => setView(leave)}>&#128065;</button>
                        {s === 'pending' && <button type="button" className="action-btn" title="Withdraw request" onClick={() => cancelLeave(leave.id)}>&#10005;</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div id="noLeavesMessage" style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}><p>No leave requests found.</p></div>
          )}
        </div>
      </div>

      {form && (
        <div className="modal active" id="leaveModal" onMouseDown={(e) => { if (e.target === e.currentTarget) setForm(null); }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Record Leave Request</h2>
              <button type="button" className="modal-close" onClick={() => setForm(null)}>&times;</button>
            </div>
            <form id="leaveForm" onSubmit={submit}>
              <div className="form-group">
                <label htmlFor="staffMember">Staff Member *</label>
                <select id="staffMember" className="form-select" required value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })}>
                  {staff === null ? <option value="" disabled>Loading staff...</option>
                    : staff.length === 0 ? <option value="" disabled>No staff available</option>
                    : <option value="" disabled>Select staff member</option>}
                  {(staff || []).map((u) => <option key={u.id} value={u.id}>{u.name}{u.dept ? ` — ${u.dept}` : ''}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="startDate">Start Date *</label>
                <input type="date" id="startDate" className="form-input" required min={today()} value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: form.endDate && form.endDate < e.target.value ? e.target.value : form.endDate })} />
              </div>
              <div className="form-group">
                <label htmlFor="endDate">End Date *</label>
                <input type="date" id="endDate" className="form-input" required min={form.startDate || today()} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="reason">Reason *</label>
                <textarea id="reason" className="form-textarea" rows={4} required placeholder="Reason for the leave request" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              </div>
              <div className="modal-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
                <button type="button" className="btn-light" onClick={() => setForm(null)}>Cancel</button>
                <button type="submit" className="btn-dark" disabled={submitting}>Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {view && (
        <div className="modal active" id="viewLeaveModal" onMouseDown={(e) => { if (e.target === e.currentTarget) setView(null); }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Leave Details</h2>
              <button type="button" className="modal-close" onClick={() => setView(null)}>&times;</button>
            </div>
            <div id="leaveDetailsContent">
              <div className="detail-row"><strong>Leave ID:</strong> <span>{view.id}</span></div>
              <div className="detail-row"><strong>Staff Member:</strong> <span>{view.doctorName || 'Unknown'}</span></div>
              <div className="detail-row"><strong>Start Date:</strong> <span>{formatDate(view.startDate)}</span></div>
              <div className="detail-row"><strong>End Date:</strong> <span>{formatDate(view.endDate)}</span></div>
              <div className="detail-row"><strong>Reason:</strong> <span>{view.reason || 'N/A'}</span></div>
              <div className="detail-row"><strong>Status:</strong> <span className={`badge ${(view.status || 'pending').toLowerCase()}`}>{(view.status || 'pending').toLowerCase()}</span></div>
              <div className="detail-row"><strong>Applied On:</strong> <span>{formatDate(view.createdAt)}</span></div>
              {view.approvedBy && <div className="detail-row"><strong>Actioned By:</strong> <span>{view.approvedBy}</span></div>}
              {view.approvedAt && <div className="detail-row"><strong>Actioned On:</strong> <span>{formatDate(view.approvedAt)}</span></div>}
              {view.rejectionReason && <div className="detail-row"><strong>Rejection Reason:</strong> <span>{view.rejectionReason}</span></div>}
            </div>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <button type="button" className="btn-light" onClick={() => setView(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {dialog}
    </div>
  );
}
