import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Auth } from '../../api';
import '../../styles/forgot-password.css';

// front-end/auth/forgot-password.html — two steps: verify the email exists,
// then set a new password. The HTML page called a hard-coded localhost URL;
// this goes through the shared client so it works from any host.
const LEVELS = [
  { pct: '0%', color: '#E2E8F0', label: '' },
  { pct: '25%', color: '#EF4444', label: 'Weak' },
  { pct: '50%', color: '#F59E0B', label: 'Fair' },
  { pct: '75%', color: '#3B82F6', label: 'Good' },
  { pct: '100%', color: '#10B981', label: 'Strong' },
];

function strength(val) {
  let score = 0;
  if (val.length >= 8) score += 1;
  if (/[A-Z]/.test(val)) score += 1;
  if (/[0-9]/.test(val)) score += 1;
  if (/[^A-Za-z0-9]/.test(val)) score += 1;
  return LEVELS[score] || LEVELS[0];
}

const EyeIcon = ({ off }) => off ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
);

const ErrorBox = ({ text }) => text ? (
  <div className="msg-box msg-error visible">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
    <span>{text}</span>
  </div>
) : null;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1 verify, 2 reset, 3 success
  const [email, setEmail] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [confirmError, setConfirmError] = useState(false);
  const [busy, setBusy] = useState(false);

  const masked = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(b.length) + c);
  const lvl = strength(newPwd);

  async function verify(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await Auth.forgotPasswordVerify(email.trim());
      setStep(2);
    } catch (err) {
      setError(err.status === 0 ? 'Unable to reach NexCare server. Please try again.' : err.message || 'No account found with this email address.');
    } finally {
      setBusy(false);
    }
  }

  async function reset(e) {
    e.preventDefault();
    setError('');
    if (newPwd.length < 8) return setError('Password must be at least 8 characters.');
    if (newPwd !== confirmPwd) {
      setConfirmError(true);
      return setError('Passwords do not match.');
    }
    setConfirmError(false);
    setBusy(true);
    try {
      await Auth.forgotPasswordReset(email.trim(), newPwd);
      setStep(3);
    } catch (err) {
      setError(err.status === 0 ? 'Unable to reach NexCare server. Please try again.' : err.message || 'Password reset failed. Please try again.');
    } finally {
      setBusy(false);
    }
    return undefined;
  }

  return (
    <div className="fp-page">
      <div className="page-wrapper">
        <div className="logo-area">
          <Link to="/">
            <svg width="36" height="36" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <polyline points="0,60 25,60 40,25 55,60 70,90 85,60 100,60" fill="none" stroke="#2563EB" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="logo-text">NexCare</span>
          </Link>
        </div>

        <div className="card">
          <div className="steps">
            <div className={`step-dot ${step > 1 ? 'completed' : 'active'}`}>1</div>
            <div className={`step-line${step > 1 ? ' completed' : ''}`} />
            <div className={`step-dot ${step === 3 ? 'completed' : step === 2 ? 'active' : 'inactive'}`}>2</div>
          </div>
          <div className="step-labels">
            <span className={step === 1 ? 'active' : ''}>Verify Account</span>
            <span className={step === 2 ? 'active' : ''}>New Password</span>
          </div>

          {step === 1 && (
            <div>
              <div className="section-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
              </div>
              <h2>Forgot Password?</h2>
              <p className="subtitle">Enter your registered email address. We'll verify your account before allowing a password reset.</p>
              <ErrorBox text={error} />
              <form onSubmit={verify}>
                <div className="form-group">
                  <label htmlFor="emailInput">Email Address</label>
                  <input type="email" id="emailInput" placeholder="e.g. priya.sharma@email.com" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <p className="field-hint">Enter the email linked to your NexCare account.</p>
                </div>
                <button type="submit" className="btn-primary" disabled={busy}>
                  {busy && <div className="spinner" />}<span>{busy ? 'Verifying…' : 'Verify Account'}</span>
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="section-icon" style={{ background: '#ECFDF5' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </div>
              <h2>Set New Password</h2>
              <p className="subtitle">Setting new password for {masked}</p>
              <ErrorBox text={error} />
              <form onSubmit={reset}>
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <div className="input-group">
                    <input type={showNew ? 'text' : 'password'} id="newPassword" placeholder="Min. 8 characters" required autoComplete="new-password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
                    <button type="button" className="toggle-password" title="Show/hide password" onClick={() => setShowNew((v) => !v)}><EyeIcon off={showNew} /></button>
                  </div>
                  <div className="strength-bar"><div className="strength-fill" style={{ width: lvl.pct, background: lvl.color }} /></div>
                  <div className="strength-text" style={{ color: lvl.color }}>{lvl.label}</div>
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="input-group">
                    <input type={showConfirm ? 'text' : 'password'} id="confirmPassword" className={confirmError ? 'error' : undefined} placeholder="Re-enter new password" required autoComplete="new-password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
                    <button type="button" className="toggle-password" title="Show/hide password" onClick={() => setShowConfirm((v) => !v)}><EyeIcon off={showConfirm} /></button>
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={busy}>
                  {busy && <div className="spinner" />}<span>{busy ? 'Updating Password…' : 'Reset Password'}</span>
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="success-screen visible">
              <div className="success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h3>Password Reset!</h3>
              <p>Your password has been updated successfully.<br />Log in with your new credentials.</p>
              <Link to="/login" className="btn-go-login">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                Go to Login
              </Link>
            </div>
          )}

          {step !== 3 && (
            <div>
              <Link to="/login" className="back-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
