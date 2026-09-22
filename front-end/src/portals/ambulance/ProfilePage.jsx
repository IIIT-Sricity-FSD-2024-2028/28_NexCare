import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { isAssigned, isCompleted, isInTransit } from '../../features/ambulance/transportSteps';
import { initials } from '../../utils/format';
import { useAmbulance } from './AmbulanceContext';
import { PageHeader } from './ambulanceShared';

// #profile-page: initProfile() / initializeProfile(). The HTML page showed a
// hard-coded "Alex Martinez / +1 (555) 987-6543 / AMB-05 / EMP-AMB-2024-142"
// whoever was signed in; the SPA starts from the login user (name, phone,
// employee id, vehicle, licence, joining date) and keeps the edits where the
// page kept them — sessionStorage `ambulanceProfile` — because there is no
// route an ambulance account may call to update its own record
// (PUT /users/:id is staff/manager/superuser only, so the page's "sync with
// backend" was a 403 every time).
const STATUSES = ['Available', 'On Duty', 'Off Duty'];
const STATUS_BADGE = { Available: 'badge-green', 'On Duty': 'badge-blue', 'Off Duty': 'badge-gray' };
const icon = (d) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{d}</svg>;
const ICON = {
  user: icon(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>),
  phone: icon(<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />),
  truck: icon(<><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>),
  power: icon(<><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></>),
};

/** ValidationUtils from app.js: name letters/spaces, phone 10 digits, vehicle 3–10 chars. */
function validate(f) {
  const errors = {};
  if (!f.name.trim()) errors.name = 'Full name is required';
  else if (!/^[A-Za-z .'-]{2,}$/.test(f.name.trim())) errors.name = 'Full name may only contain letters';
  const digits = f.phone.replace(/\D/g, '');
  if (!digits) errors.phone = 'Phone number is required';
  else if (digits.length !== 10) errors.phone = 'Phone number must be 10 digits';
  if (!f.vehicle.trim()) errors.vehicle = 'Vehicle number is required';
  else if (f.vehicle.trim().length < 3 || f.vehicle.trim().length > 10) errors.vehicle = 'Vehicle number must be 3-10 characters';
  if (!STATUSES.includes(f.status)) errors.status = 'Choose a status';
  return errors;
}

const formatJoined = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export default function ProfilePage() {
  const { notify } = useToast();
  const { user, profile, saveProfile, requests } = useAmbulance();
  const current = {
    name: profile.name || user?.name || '',
    phone: profile.phone || user?.phone || '',
    vehicle: profile.vehicle || user?.assignedVehicle || '',
    status: profile.status || 'Available',
  };
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => ({ ...current, phone: String(current.phone).replace(/\D/g, '').slice(-10) }));
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => {
    let v = e.target.value;
    if (k === 'phone') v = v.replace(/\D/g, '').slice(0, 10);
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const completed = requests.filter(isCompleted);
  const now = new Date();
  const thisMonth = completed.filter((r) => {
    const d = new Date(r.completedDate || r.updatedAt || 0);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const accepted = requests.filter((r) => isAssigned(r) || isInTransit(r) || isCompleted(r)).length;

  // The form's phone field is the 10-digit national number the page enforced.
  const editable = () => ({ ...current, phone: String(current.phone).replace(/\D/g, '').slice(-10) });
  function startEdit() { setForm(editable()); setErrors({}); setEditing(true); }
  function cancel() { setForm(editable()); setErrors({}); setEditing(false); }
  function save() {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    saveProfile({ name: form.name.trim(), phone: form.phone.trim(), vehicle: form.vehicle.trim().toUpperCase(), status: form.status });
    setEditing(false);
    notify('Profile updated successfully!', 'success');
  }

  const field = (key, label, ic, input) => (
    <div className="form-group">
      <label className="form-label">{ic} {label}</label>
      {input}
      {errors[key] && <p className="field-error" style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{errors[key]}</p>}
    </div>
  );

  return (
    <div className="page active" id="profile-page">
      <PageHeader title="Profile" />
      <div className="profile-layout">
        <div className="profile-sidebar">
          <div className="content-card">
            <div className="profile-avatar-section">
              <div className="profile-avatar">{initials(current.name)}</div>
              <h3 className="profile-name" id="profile-display-name">{current.name}</h3>
              <p className="profile-role">Ambulance Staff</p>
              <span className={`badge ${STATUS_BADGE[current.status] || 'badge-green'}`} id="profile-status-badge">{current.status}</span>
            </div>
            <div className="profile-info-section">
              <div className="profile-info-item">{ICON.phone}<span id="profile-display-phone">{current.phone || '—'}</span></div>
              <div className="profile-info-item">{ICON.truck}<span>Vehicle: <span id="profile-display-vehicle">{current.vehicle || '—'}</span></span></div>
            </div>
          </div>
          <div className="content-card">
            <h4 className="card-title">Quick Stats</h4>
            <div className="quick-stats">
              <div className="quick-stat-row"><span className="quick-stat-label">Total Transports</span><span className="quick-stat-value" id="qs-total">{completed.length}</span></div>
              <div className="quick-stat-row"><span className="quick-stat-label">This Month</span><span className="quick-stat-value" id="qs-month">{thisMonth}</span></div>
              <div className="quick-stat-row"><span className="quick-stat-label">Success Rate</span><span className="quick-stat-value quick-stat-success" id="qs-rate">{accepted > 0 ? `${Math.round((completed.length / accepted) * 100)}%` : '—'}</span></div>
            </div>
          </div>
        </div>

        <div className="profile-main">
          <div className="content-card">
            <div className="card-header-row">
              <h2 className="card-title">Personal Information</h2>
              {!editing && <button type="button" id="edit-profile-btn" className="btn btn-primary" onClick={startEdit}>Edit Profile</button>}
            </div>
            <form id="profile-form" className="profile-form" onSubmit={(e) => { e.preventDefault(); save(); }}>
              {field('name', 'Full Name', ICON.user, <input type="text" id="profile-name" className={`form-input${errors.name ? ' input-error' : ''}`} value={form.name} onChange={set('name')} disabled={!editing} />)}
              {field('phone', 'Phone Number', ICON.phone, <input type="tel" id="profile-phone" className={`form-input${errors.phone ? ' input-error' : ''}`} inputMode="numeric" maxLength={10} value={form.phone} onChange={set('phone')} disabled={!editing} />)}
              {field('vehicle', 'Vehicle Number', ICON.truck, <input type="text" id="profile-vehicle" className={`form-input${errors.vehicle ? ' input-error' : ''}`} value={form.vehicle} onChange={set('vehicle')} disabled={!editing} />)}
              {field('status', 'Availability Status', ICON.power, (
                <select id="profile-status" className="form-input" value={form.status} onChange={set('status')} disabled={!editing}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              ))}
              {editing && (
                <div id="profile-actions" className="form-actions" style={{ display: 'flex' }}>
                  <button type="submit" id="save-profile-btn" className="btn btn-primary btn-with-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                    Save Changes
                  </button>
                  <button type="button" id="cancel-profile-btn" className="btn btn-secondary" onClick={cancel}>Cancel</button>
                </div>
              )}
            </form>
          </div>

          <div className="content-card">
            <h3 className="card-title">Account Information</h3>
            <div className="account-info-grid">
              <div><p className="account-info-label">Employee ID</p><p className="account-info-value">{user?.employeeId || user?.id || '—'}</p></div>
              <div><p className="account-info-label">Joined Date</p><p className="account-info-value">{formatJoined(user?.joiningDate)}</p></div>
              <div><p className="account-info-label">License Number</p><p className="account-info-value">{user?.driverLicense || '—'}</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
