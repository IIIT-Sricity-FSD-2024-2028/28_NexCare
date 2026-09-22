import { useCallback, useEffect, useState } from 'react';
import { Users } from '../../api';
import { useToast } from '../../context/ToastContext';
import useConfirm from '../../hooks/useConfirm';
import { useHm } from './HmContext';
import { Badge, LoadingCell, initialsOf, roleLabel } from './hmShared';

// TAB 3 — Staff Directory: loadStaff() / filterStaff() /
// promptToggleStaffStatus(). The HTML's Activate/Deactivate button opened a
// #staffStatusModal that dashboard.html never contained (a TypeError in the
// console, nothing on screen); the SPA uses the shared confirm dialog and
// PATCH /users/:id/status as executeToggleStaffStatus() intended.
export default function StaffPage() {
  const { hospitalId, openStaffModal, version } = useHm();
  const { notify } = useToast();
  const { ask, dialog } = useConfirm();
  const [staff, setStaff] = useState(null);
  const [failed, setFailed] = useState(false);
  const [term, setTerm] = useState('');
  const [role, setRole] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  const load = useCallback(async () => {
    try {
      const res = await Users.getAll();
      const users = Array.isArray(res.data) ? res.data : [];
      setStaff(users.filter((u) => u.hospitalId === hospitalId));
      setFailed(false);
    } catch (e) {
      console.error('Error loading staff:', e);
      setFailed(true);
      setStaff([]);
    }
  }, [hospitalId]);
  useEffect(() => { load(); }, [load, version]);

  const q = term.trim().toLowerCase();
  const filtered = (staff || []).filter((s) =>
    (role === 'ALL' || (s.role || '').toLowerCase() === role.toLowerCase())
    && (status === 'ALL' || (s.status || '').toLowerCase() === status.toLowerCase())
    && (!q || [s.name, s.email, s.employeeId, s.designation].some((v) => (v || '').toLowerCase().includes(q))));

  async function toggleStatus(member) {
    const isActive = (member.status || 'Active').toLowerCase() === 'active';
    const next = isActive ? 'Inactive' : 'Active';
    const ok = await ask(`Are you sure you want to mark ${member.name} as ${next}?`, {
      title: `${next === 'Active' ? 'Activate' : 'Deactivate'} Staff Member`,
      confirmLabel: next === 'Active' ? 'Activate' : 'Deactivate',
      danger: next !== 'Active',
    });
    if (!ok) return;
    try {
      await Users.updateStatus(member.id, next);
      notify(`Staff member marked as ${next}`, 'success');
      await load();
    } catch (err) {
      notify(err?.message || 'Error updating staff status', 'error');
    }
  }

  return (
    <div className="card">
      <div className="card-header flex-between">
        <div>
          <h2>Hospital Staff Directory</h2>
          <p className="card-subtitle">Manage doctors, administrative staff, and ambulance drivers for this hospital</p>
        </div>
        <div className="filter-toolbar">
          <button type="button" className="btn-primary" onClick={openStaffModal}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            <span>Register New Staff</span>
          </button>
          <input type="text" className="input-search" placeholder="Search by name, ID, or email..." value={term} onChange={(e) => setTerm(e.target.value)} />
          <select className="select-filter" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="ALL">All Roles</option>
            <option value="doctor">Doctors</option>
            <option value="administrative_staff">Administrative Staff</option>
            <option value="ambulance">Ambulance Staff</option>
          </select>
          <select className="select-filter" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>
      </div>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr><th>Employee ID & Name</th><th>Role & Department</th><th>Contact Info</th><th>Specialization / Details</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {failed && <LoadingCell colSpan={6} tone="danger">Failed to load staff directory.</LoadingCell>}
            {!failed && staff === null && <LoadingCell colSpan={6}>Loading staff directory...</LoadingCell>}
            {!failed && staff && filtered.length === 0 && <LoadingCell colSpan={6}>No staff members found matching your search.</LoadingCell>}
            {filtered.map((s) => {
              const isActive = (s.status || 'Active').toLowerCase() === 'active';
              const resps = Array.isArray(s.responsibilities) ? s.responsibilities : ['Bed Allocation', 'Inventory'];
              return (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="user-avatar" style={{ width: 34, height: 34, fontSize: 12 }}>{initialsOf(s.name)}</div>
                      <div><strong>{s.name}</strong><div style={{ fontSize: 11, color: '#64748B' }}>ID: {s.employeeId || s.id}</div></div>
                    </div>
                  </td>
                  <td>
                    <Badge tone={s.role === 'doctor' ? 'role' : 'approved'}>{roleLabel(s.role)}</Badge>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginTop: 3 }}>{s.designation || s.dept || 'General'}</div>
                  </td>
                  <td><div>{s.email}</div><div style={{ fontSize: 11, color: '#64748B' }}>{s.phone || '+91 98480 00000'}</div></td>
                  <td>
                    {s.role === 'doctor' && (<><div><strong>MRN:</strong> {s.medicalRegNumber || 'MCI-REG'}</div><div style={{ fontSize: 11, color: '#64748B' }}><strong>OPD:</strong> {s.consultationTiming || 'Regular Hours'}</div></>)}
                    {s.role === 'administrative_staff' && (<div className="resp-tags-container" style={{ marginTop: 2 }}>{resps.slice(0, 2).map((r) => <span key={r} className="resp-tag">{r}</span>)}</div>)}
                    {s.role === 'ambulance' && (<><div><strong>Veh:</strong> {s.assignedVehicle || 'AP-03-AX-1001'}</div><div style={{ fontSize: 11, color: '#64748B' }}>{s.shift || 'Day Shift'}</div></>)}
                  </td>
                  <td><Badge tone={isActive ? 'active' : 'inactive'}>{s.status || 'Active'}</Badge></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className={`btn-action-sm ${isActive ? 'btn-action-reject' : 'btn-action-approve'}`} onClick={() => toggleStatus(s)}>
                        {isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
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
