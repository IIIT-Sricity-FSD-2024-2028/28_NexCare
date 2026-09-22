import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Auth, Patients } from '../../api';
import { useDialogs } from '../../components/ui/Dialogs';
import { useToast } from '../../context/ToastContext';
import { isPaidMembership, usePatient } from './PatientContext';

// patient/profile.html + profile.js.
//
// Read-only until Edit is pressed. Saving writes the profile through
// PUT /patients/:id and, when the password fields are filled, changes the
// password through PATCH /auth/change-password — which is bound to the
// authenticated user, so no email or id is sent (profile.js hand-rolled that
// fetch against a hard-coded localhost URL).

const PASSWORD_FIELDS = ['currentPassword', 'newPassword', 'confirmPassword'];
const EMPTY_PASSWORDS = { currentPassword: '', newPassword: '', confirmPassword: '' };

/**
 * The stored phone is a display string — every seeded patient carries
 * `+91 98480 33445`. The form (and profile.js before it) validates a bare
 * 10-digit number, so loading the stored value verbatim made *every* save
 * fail on "Phone number must be exactly 10 digits", whatever the patient had
 * actually edited. Load the national 10-digit part and let the same strict
 * rule apply to what the patient types.
 */
function localPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export default function ProfilePage() {
  const { notify } = useToast();
  const { showSuccess } = useDialogs();
  const { patientId, patient, profile, displayId, membership, refreshPatient, updateUser } = usePatient();

  const [edit, setEdit] = useState(false);
  const [fields, setFields] = useState({ fullName: '', phoneNumber: '', emailAddress: '' });
  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS);
  const [snapshot, setSnapshot] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fall back to the session user when the patient record is missing (a brand
  // new registration), as the HTML page did.
  useEffect(() => {
    setFields({
      fullName: patient?.fullName || patient?.name || profile.name || '',
      phoneNumber: localPhone(patient?.phone),
      emailAddress: patient?.email || profile.email || '',
    });
  }, [patient, profile.name, profile.email]);

  const set = (k) => (e) => setFields((f) => ({ ...f, [k]: e.target.value }));
  const setPw = (k) => (e) => setPasswords((p) => ({ ...p, [k]: e.target.value }));

  function startEdit() {
    setSnapshot(fields);
    setEdit(true);
  }

  function cancelEdit() {
    if (snapshot) setFields(snapshot);
    setPasswords(EMPTY_PASSWORDS);
    setEdit(false);
  }

  async function save() {
    const { fullName, phoneNumber, emailAddress } = fields;
    const { currentPassword, newPassword, confirmPassword } = passwords;

    if (!fullName || !phoneNumber || !emailAddress) return notify('Please fill in all required fields in Personal Information', 'error');
    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(emailAddress)) return notify('Please enter a valid email address (e.g. user@example.com)', 'error');
    if (!/^\d{10}$/.test(phoneNumber)) return notify('Phone number must be exactly 10 digits and contain only numbers.', 'error');
    if (/^0+$/.test(phoneNumber) || /^(\d)\1+$/.test(phoneNumber)) return notify('Please enter a valid phone number (cannot be all the same digit).', 'error');

    let passwordChanged = false;
    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword) return notify('Please enter your current password to change it.', 'error');
      if (!newPassword) return notify('Please enter a new password.', 'error');
      if (newPassword.length < 8) return notify('New password must be at least 8 characters long.', 'error');
      if (newPassword === currentPassword) return notify('New password cannot be the same as your current password.', 'error');
      if (newPassword !== confirmPassword) return notify('New passwords do not match.', 'error');
      passwordChanged = true;
    }

    setSaving(true);
    try {
      await Patients.update(patientId, { fullName, phone: phoneNumber, email: emailAddress });
      // Keep the cached session user in step, so the header and sidebar update.
      updateUser({ name: fullName, email: emailAddress });

      if (passwordChanged) {
        try {
          await Auth.changePassword(currentPassword, newPassword);
        } catch (err) {
          notify(err.message || 'Failed to change password. Please check your current password.', 'error');
          setSaving(false);
          return;
        }
        setPasswords(EMPTY_PASSWORDS);
      }

      showSuccess({
        title: 'Profile Updated!',
        message: 'Your profile has been saved successfully.',
        details: (
          <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748B' }}>Name:</span><span style={{ fontWeight: 600 }}>{fullName}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748B' }}>Email:</span><span style={{ fontWeight: 600 }}>{emailAddress}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748B' }}>Phone:</span><span style={{ fontWeight: 600 }}>{phoneNumber}</span></div>
            {passwordChanged && (
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B' }}>Password:</span><span style={{ fontWeight: 600, color: '#16A34A' }}>Changed successfully</span>
              </div>
            )}
          </div>
        ),
        onClose: () => { refreshPatient(); setSnapshot(null); setEdit(false); },
      });
    } catch (err) {
      console.error('Save profile error:', err);
      notify(err.message || 'An error occurred while saving your profile. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }

  const status = patient?.status || 'Active';
  const statusClass = ['active', 'critical', 'emergency', 'pending'].includes(status.toLowerCase())
    ? (status.toLowerCase() === 'emergency' ? 'critical' : status.toLowerCase())
    : 'inactive';
  const paid = isPaidMembership(membership);

  const userIcon = (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3" stroke="#99A1AF" strokeWidth="1.5" />
      <path d="M17 18c0-3.866-3.134-7-7-7s-7 3.134-7 7" stroke="#99A1AF" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  const lockIcon = (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M15.833 9.167H4.167A1.667 1.667 0 002.5 10.833v5.834a1.667 1.667 0 001.667 1.666h11.666a1.667 1.667 0 001.667-1.666v-5.834a1.667 1.667 0 00-1.667-1.666z" stroke="#99A1AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.833 9.167V5.833a4.167 4.167 0 118.334 0v3.334" stroke="#99A1AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <main className="main-content profile-page-new">
      <div className="profile-header">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="2" />
          <path d="M20 21c0-4.418-3.582-8-8-8s-8 3.582-8 8" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <div>
          <h1>My Profile</h1>
          <p>Manage your personal information and account</p>
        </div>
      </div>

      <div className="profile-main-content">
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, margin: '0 0 18px' }}>
          {!edit && <button type="button" className="btn-outline-sm" id="editProfileBtn" onClick={startEdit}>Edit Profile</button>}
          {edit && <button type="button" className="btn-outline-sm" id="cancelProfileBtn" onClick={cancelEdit}>Cancel</button>}
          {edit && <button type="button" className="btn-primary-sm" id="saveProfileBtn" disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Save'}</button>}
        </div>

        <div className="profile-section-card">
          <div className="profile-section-header">
            <h2>Personal Information</h2>
            <p>Update your personal details and contact information</p>
          </div>
          <form id="personalInfoForm" className="profile-form-grid" onSubmit={(e) => e.preventDefault()}>
            <div className="profile-input-group">
              <label htmlFor="fullName">Full Name <span className="required">*</span></label>
              <div className="input-with-icon">
                {userIcon}
                <input type="text" id="fullName" name="fullName" required disabled={!edit} value={fields.fullName} onChange={set('fullName')} />
              </div>
            </div>
            <div className="profile-input-group">
              <label htmlFor="phoneNumber">Phone Number <span className="required">*</span></label>
              <div className="input-with-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M18.333 14.583v2.5a1.667 1.667 0 01-1.817 1.667 18.742 18.742 0 01-8.179-2.908 17.659 17.659 0 01-5.691-5.692A18.742 18.742 0 01.333 1.942 1.667 1.667 0 012 .125h2.5a1.667 1.667 0 011.667 1.434c.084.812.238 1.613.458 2.391a1.667 1.667 0 01-.375 1.759L5.208 6.75a13.333 13.333 0 005.691 5.691l1.042-1.042a1.667 1.667 0 011.759-.375c.778.22 1.579.374 2.391.458a1.667 1.667 0 011.434 1.601z" stroke="#99A1AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input type="tel" id="phoneNumber" name="phoneNumber" required disabled={!edit} maxLength={10} pattern="\d{10}" value={fields.phoneNumber} onChange={set('phoneNumber')} />
              </div>
            </div>
            <div className="profile-input-group">
              <label htmlFor="emailAddress">Email Address <span className="required">*</span></label>
              <div className="input-with-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3.333 3.333h13.334A1.667 1.667 0 0118.334 5v10a1.667 1.667 0 01-1.667 1.667H3.333A1.667 1.667 0 011.667 15V5a1.667 1.667 0 011.666-1.667z" stroke="#99A1AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M18.334 5L10 10.833 1.667 5" stroke="#99A1AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input type="email" id="emailAddress" name="emailAddress" required disabled={!edit} value={fields.emailAddress} onChange={set('emailAddress')} />
              </div>
            </div>
          </form>
        </div>

        <div className="profile-section-card">
          <div className="profile-section-header">
            <h2>Change Password</h2>
            <p>Update your password to keep your account secure</p>
          </div>
          <form id="passwordForm" className="profile-form-grid" onSubmit={(e) => e.preventDefault()}>
            {PASSWORD_FIELDS.map((id) => (
              <div className="profile-input-group" key={id}>
                <label htmlFor={id}>
                  {id === 'currentPassword' ? 'Current Password' : id === 'newPassword' ? 'New Password' : 'Confirm New Password'}
                </label>
                <div className="input-with-icon">
                  {lockIcon}
                  <input
                    type="password"
                    id={id}
                    name={id}
                    disabled={!edit}
                    placeholder={id === 'currentPassword' ? 'Enter current password' : id === 'newPassword' ? 'Enter new password' : 'Confirm new password'}
                    value={passwords[id]}
                    onChange={setPw(id)}
                  />
                </div>
                {id === 'newPassword' && <p className="input-help">Password must be at least 8 characters long</p>}
              </div>
            ))}
          </form>
        </div>

        <div className="profile-section-card">
          <div className="profile-section-header-simple"><h2>Account Information</h2></div>
          <div className="account-details-grid">
            <div className="account-detail-row">
              <span className="detail-label">Patient ID:</span>
              <span className="detail-value" id="profilePatientId">{displayId || '--'}</span>
            </div>
            <div className="account-detail-row">
              <span className="detail-label">Member Since:</span>
              <span className="detail-value" id="profileMemberSince">{patient?.memberSince || '--'}</span>
            </div>
            <div className="account-detail-row">
              <span className="detail-label">Account Status:</span>
              <span className={`status-badge ${statusClass}`} id="profileAccountStatus">{status}</span>
            </div>
            <div className="account-detail-row">
              <span className="detail-label">Care+ Membership:</span>
              <span className="detail-value" id="profileMembershipTier" style={{ fontWeight: 700, color: paid ? '#15803D' : '#475569' }}>
                {paid ? '⭐ ' : ''}<strong>{membership?.planName || 'Pay As You Go'}</strong>
                <Link to="/patient/membership" style={{ fontSize: 12, fontWeight: 600, textDecoration: 'underline', marginLeft: 6, color: '#2563EB' }}>Manage</Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
