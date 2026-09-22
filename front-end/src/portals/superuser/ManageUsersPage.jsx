import { useCallback, useEffect, useState } from 'react';
import { Users } from '../../api';
import { useToast } from '../../context/ToastContext';
import useConfirm from '../../hooks/useConfirm';
import logActivity from '../../features/activity/logActivity';
import { MessageRow, SuPage } from './suShared';

// superuser/manage-users.html + manage-users.js: every non-patient login
// account, with an add/edit modal (POST / PUT /users) and a delete. New
// accounts get the platform's default password, exactly as the page sent it.

// Keyed by the canonical UserRole values from the backend enum. Doctors are
// login actors with their own portal; 'nurse' is still a directory-only record
// with no portal, created here and referenced by rosters and leave calendars.
const ROLE_DEPARTMENTS = {
  administrative_staff: ['Management', 'Front Desk', 'Billing'],
  ambulance: ['Transport', 'Maintenance'],
  regional_manager: ['Regional Oversight'],
  doctor: ['Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'General Medicine', 'Dermatology', 'Emergency'],
  nurse: ['ER', 'ICU', 'General Ward', 'Pediatrics'],
};

const ROLE_OPTIONS = [
  ['administrative_staff', 'Administrative Staff'],
  ['ambulance', 'Ambulance Staff'],
  ['regional_manager', 'Regional Officer'],
  // Directory-only records: clinical staff cannot log in to NexCare.
  ['doctor', 'Doctor'],
  ['nurse', 'Nurse (directory record)'],
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY = { id: '', name: '', email: '', role: '', dept: '', region: '', status: 'Active' };

export default function ManageUsersPage() {
  const { notify } = useToast();
  const { ask, dialog } = useConfirm();
  const [users, setUsers] = useState(null);
  const [modal, setModal] = useState(null); // form values while open
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const renderTable = useCallback(async () => {
    setUsers(null);
    try {
      const resp = await Users.getAll();
      setUsers(resp.data || []);
    } catch (e) {
      console.error('Failed to load users from API:', e);
      setUsers([]);
    }
  }, []);

  useEffect(() => { renderTable(); }, [renderTable]);

  // Staff management: exclude patients (they are in Patient Directory)
  const staffList = (users || []).filter((u) => u.role !== 'patient');

  function openUserModal() {
    setErrors({});
    setModal({ ...EMPTY });
  }

  function editUser(user) {
    setErrors({});
    setModal({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      dept: user.dept || '',
      region: Array.isArray(user.areas) ? user.areas.join(', ') : '',
      status: user.status || 'Active',
    });
  }

  const set = (key) => (e) => setModal((m) => ({ ...m, [key]: e.target.value }));
  // Changing the role empties the department list, as updateDeptDropdown() did.
  const setRole = (e) => setModal((m) => ({ ...m, role: e.target.value, dept: '' }));

  async function handleSaveUser(e) {
    e.preventDefault();
    const name = modal.name.trim();
    const email = modal.email.trim();
    const { role, dept, status } = modal;
    const areas = modal.region.split(',').map((a) => a.trim()).filter(Boolean);

    // Strict Client-Side Validation
    const errs = {};
    if (name.length < 2) errs.name = true;
    if (!EMAIL_RE.test(email)) errs.email = true;
    if (!role) errs.role = true;
    if (!dept) errs.dept = true;
    if (role === 'regional_manager' && !areas.length) errs.region = true;
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      if (modal.id === '') {
        await Users.create({ name, email, role, dept, status, areas: role === 'regional_manager' ? areas : undefined, password: 'Password123' });
        notify(`Successfully created ${role} account for ${name}`, 'success');
        logActivity('Create', 'Users', `New ${role} account created: ${name} (${dept})`);
      } else {
        await Users.update(modal.id, { name, email, role, dept, status, areas: role === 'regional_manager' ? areas : undefined });
        notify(`Successfully updated user details for ${name}`, 'success');
        logActivity('Update', 'Users', `Updated user details for ${name} (ID: ${modal.id})`);
      }
    } catch (err) {
      console.error('Save user failed:', err);
      notify(err?.message || 'Failed to save user. Please try again.', 'error');
      setSaving(false);
      return;
    }
    setSaving(false);
    renderTable();
    setModal(null);
  }

  async function deleteUser(id) {
    if (!(await ask('Are you sure you want to delete this user? This action cannot be undone.', { title: 'Delete user', confirmLabel: 'OK', danger: true }))) return;
    try {
      await Users.delete(id);
    } catch (e) {
      console.warn('Delete API call failed, removing from local cache only:', e);
    }
    renderTable();
  }

  const errorStyle = (key) => ({ borderColor: errors[key] ? 'var(--danger)' : 'var(--border-color)' });
  const errorMsg = (key, text) => <span className="error-message" style={{ display: errors[key] ? 'block' : 'none' }}>{text}</span>;

  return (
    <SuPage className="su-page su-users" title="System User Management">
      <div className="page-header">
        <div>
          <h1>System User Management</h1>
          <p style={{ margin: '5px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Manage system access, roles, and profiles for hospital staff.</p>
        </div>
        <div className="action-row">
          <button type="button" className="btn-primary" onClick={openUserModal}>+ Add New User</button>
        </div>
      </div>

      <div className="table-card">
        <table className="data-table" id="usersTable">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody id="usersTableBody">
            {users === null ? (
              <MessageRow colSpan={6}>Loading users…</MessageRow>
            ) : !staffList.length ? (
              <MessageRow colSpan={6} padding={30} color="var(--text-muted)">No users found. Add one to get started.</MessageRow>
            ) : staffList.map((user) => (
              <tr key={user.id}>
                <td style={{ fontWeight: 500 }}>{user.name}</td>
                <td style={{ color: 'var(--text-muted)' }}>{user.email}</td>
                <td>{user.dept || '-'}</td>
                <td><span className={`badge ${user.role}`}>{String(user.role).replace('_', ' ').toUpperCase()}</span></td>
                <td>
                  <span style={{ color: user.status === 'Active' ? 'var(--success)' : 'var(--danger)' }}>• {user.status || 'Active'}</span>
                </td>
                <td>
                  <button type="button" className="btn-secondary btn-icon" onClick={() => editUser(user)}>Edit</button>
                  <button type="button" className="btn-danger btn-icon" onClick={() => deleteUser(user.id)} title="Delete user">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 16h10l1-16" />
                      </svg>
                      Delete
                    </span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* User Form Modal — global.css's .modal-overlay / .modal-content, as the page used. */}
        {modal && (
          <div className="modal-overlay active" id="userModalOverlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
            <div className="modal-content">
              <h2 id="modalTitle" style={{ marginTop: 0 }}>{modal.id === '' ? 'Add New User' : 'Edit User'}</h2>
              <form id="userForm" onSubmit={handleSaveUser} noValidate>
                <div className="form-group">
                  <label htmlFor="userName">Full Name</label>
                  <input type="text" id="userName" className="form-control" value={modal.name} onChange={set('name')} style={errorStyle('name')} />
                  {errorMsg('name', 'Name is required.')}
                </div>
                <div className="form-group">
                  <label htmlFor="userEmail">Email Address</label>
                  <input type="email" id="userEmail" className="form-control" value={modal.email} onChange={set('email')} style={errorStyle('email')} />
                  {errorMsg('email', 'Valid email is required.')}
                </div>
                <div className="form-group" style={{ display: 'flex', gap: 15 }}>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="userRole">Role</label>
                    <select id="userRole" className="form-control" value={modal.role} onChange={setRole} style={errorStyle('role')}>
                      <option value="">Select Role...</option>
                      {ROLE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    {errorMsg('role', 'Role is required.')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="userDept">Department</label>
                    <select id="userDept" className="form-control" value={modal.dept} onChange={set('dept')} style={errorStyle('dept')}>
                      <option value="">Select Department...</option>
                      {(ROLE_DEPARTMENTS[modal.role] || []).map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {errorMsg('dept', 'Dept is required.')}
                  </div>
                </div>
                <div className="form-group" id="regionGroup" style={{ display: modal.role === 'regional_manager' ? 'block' : 'none' }}>
                  <label htmlFor="userRegion">Assigned Hospital Areas / Cities</label>
                  <input type="text" id="userRegion" className="form-control" placeholder="e.g. Tirupati, Renigunta" value={modal.region} onChange={set('region')} style={errorStyle('region')} />
                  {errorMsg('region', 'At least one local area is required for a regional officer.')}
                </div>
                <div className="form-group">
                  <label htmlFor="userStatus">Status</label>
                  <select id="userStatus" className="form-control" value={modal.status} onChange={set('status')}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 30 }}>
                  <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={saving}>{saving ? (modal.id === '' ? 'Creating user...' : 'Updating user...') : 'Save User'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      {dialog}
    </SuPage>
  );
}
