import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Auth } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { homeFor } from '../../utils/roles';
import { AuthShell, describeError } from './AuthShell';

// front-end/auth/change-password.html — the first-login password change for
// accounts created with the temporary default. Requires a session (a login
// with mustChangePassword lands here).
const DEFAULT_PASS = 'NexCare@123';
const ok = { color: '#16a34a' };
const idle = { color: '#64748b' };

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [alert, setAlert] = useState(null); // { type, msg }
  const [busy, setBusy] = useState(false);

  const ruleLength = newPassword.length >= 6;
  const ruleMatch = Boolean(newPassword) && newPassword === confirmPassword;
  const ruleDiff = Boolean(newPassword) && newPassword !== DEFAULT_PASS;

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPassword.length < 6) return setAlert({ type: 'error', msg: 'New password must be at least 6 characters long.' });
    if (newPassword === DEFAULT_PASS) return setAlert({ type: 'error', msg: 'New password cannot be the temporary default password (NexCare@123).' });
    if (newPassword !== confirmPassword) return setAlert({ type: 'error', msg: 'New password and confirm password do not match.' });
    if (currentPassword === newPassword) return setAlert({ type: 'error', msg: 'New password must be different from current password.' });
    setBusy(true);
    try {
      await Auth.changePassword(currentPassword, newPassword);
      setAlert({ type: 'success', msg: 'Password updated successfully! Redirecting to your dashboard...' });
      updateUser({ mustChangePassword: false });
      setTimeout(() => navigate(homeFor(user?.role || 'administrative_staff'), { replace: true }), 1200);
    } catch (err) {
      setAlert({ type: 'error', msg: describeError(err) || 'Failed to update password. Please check your current password.' });
      setBusy(false);
    }
    return undefined;
  }

  return (
    <AuthShell noImage wrapperStyle={{ maxWidth: 540 }} cardStyle={{ minHeight: 'auto', padding: 20 }} sectionStyle={{ padding: '15px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        </div>
        <h2 style={{ margin: '0 0 6px 0', fontSize: 22, color: '#0f172a' }}>Set Your New Password</h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.4 }}>
          Welcome to NexCare! For security, newly registered accounts must change their temporary password on first login.
        </p>
      </div>
      {alert && (
        <div style={{ padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 14, ...(alert.type === 'success' ? { background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' } : { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }) }}>
          {alert.msg}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Current (Temporary) Password *</label>
          <input type="password" className="form-control" placeholder="Enter current / temporary password" required value={currentPassword} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        </div>
        <div className="form-group">
          <label>New Password *</label>
          <input type="password" className="form-control" placeholder="Create a new password (min 6 characters)" required value={newPassword} onChange={(e) => setNew(e.target.value)} autoComplete="new-password" />
          <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>Cannot be the default password (<code>NexCare@123</code>).</div>
        </div>
        <div className="form-group">
          <label>Confirm New Password *</label>
          <input type="password" className="form-control" placeholder="Re-enter new password" required value={confirmPassword} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 14px', marginBottom: 18, fontSize: 12, color: '#475569' }}>
          <div style={ruleLength ? ok : idle}>{ruleLength ? '✓ Minimum 6 characters' : '● Minimum 6 characters'}</div>
          <div style={ruleMatch ? ok : idle}>{ruleMatch ? '✓ Passwords match' : '● Passwords must match'}</div>
          <div style={ruleDiff ? ok : idle}>{ruleDiff ? '✓ Different from default password' : '● Different from temporary default password'}</div>
        </div>
        <button type="submit" className="btn-primary" disabled={busy} style={{ width: '100%', justifyContent: 'center', padding: 12, fontSize: 15 }}>
          {busy ? 'Updating Password...' : 'Update Password & Continue →'}
        </button>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/login" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>Cancel and return to Login</Link>
        </div>
      </form>
    </AuthShell>
  );
}
