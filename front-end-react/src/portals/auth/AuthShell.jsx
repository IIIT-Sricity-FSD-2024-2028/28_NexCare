import { Link } from 'react-router-dom';
import NexCareLogo from '../../components/NexCareLogo';

/** The auth.css page frame every login / sign-up page shares: logo header, card, wave image. */
export function AuthShell({ reverse, noImage, wrapperStyle, cardStyle, sectionStyle, children }) {
  return (
    <div className="auth-page">
      <div className="auth-wrapper" style={wrapperStyle}>
        <header className="auth-header">
          <Link to="/" style={{ textDecoration: 'none' }}><NexCareLogo /></Link>
        </header>
        <div className={`auth-card${reverse ? ' reverse' : ''}`} style={cardStyle}>
          <div className="auth-form-section" style={sectionStyle}>{children}</div>
          {!noImage && <div className="auth-image-section" />}
        </div>
      </div>
    </div>
  );
}

/** The primary button with the ECG-line logo the HTML forms used. */
export function SubmitButton({ busy, busyLabel, children, style }) {
  return (
    <button type="submit" className="btn-primary" disabled={busy} style={style}>
      {busy ? busyLabel : children}
      {!busy && (
        <svg className="nexcare-logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <polyline points="0,60 25,60 40,25 55,60 70,90 85,60 100,60" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

/** The inline red (or green, for success) line the HTML pages inserted above the button. */
export function FormMessage({ message, tone = 'error' }) {
  if (!message) return null;
  return <p className="login-error" style={tone === 'success' ? { color: 'green' } : undefined}>{message}</p>;
}

/** A labelled input with the form-control class. */
export function Field({ label, children }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      {children}
    </div>
  );
}

/** The role radio grid used by the login hub, the staff login and the staff sign-up. */
export function RoleGrid({ options, value, onChange, style }) {
  return (
    <>
      <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 5, display: 'block' }}>Role</label>
      <div className="role-grid" style={style}>
        {options.map((o) => (
          <label key={o.value} className="role-option">
            <input type="radio" name="role" value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} required /> {o.label}
          </label>
        ))}
      </div>
    </>
  );
}

// The client-side checks the HTML sign-up forms shared.
export const NAME_RE = /^[A-Za-z\s]+$/;
export const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PHONE_RE = /^\d{10}$/;

export function validateSignupBasics({ fullName, email, phone, password, confirmPassword }) {
  if (!NAME_RE.test(fullName)) return 'Name must only contain letters and spaces.';
  if (!EMAIL_RE.test(email)) return 'Please enter a valid email address (e.g., name@example.com).';
  if (!PHONE_RE.test(phone) || phone === '0000000000') return 'Phone number must be exactly 10 digits and cannot be all zeros.';
  if (password !== confirmPassword) return 'Passwords do not match.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return '';
}

/** The HTML pages' catch-all: a fetch failure names the backend host. */
export function describeError(err) {
  if (err?.status === 0 || /fetch/i.test(err?.message || '')) {
    return `Cannot reach the backend server at ${window.location.hostname}:3001. Make sure the backend is running (npm run start:dev).`;
  }
  return err?.message || 'An unexpected error occurred.';
}
