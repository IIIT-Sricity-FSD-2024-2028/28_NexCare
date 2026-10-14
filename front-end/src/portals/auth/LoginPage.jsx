import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { homeFor, ROLES } from '../../utils/roles';
import { AuthShell, SubmitButton, FormMessage, Field, RoleGrid, describeError } from './AuthShell';

// front-end/auth/login.html plus the six per-role login pages. They were the
// same form with a different heading, a fixed role (or a role picker) and a
// different set of footer links — that difference is the table below. Footer
// links between login pages carry the router state along so a visit that
// RequireAuth redirected still returns to where it was going.
const muted = { fontSize: 12, color: '#64748B' };

const PAGES = {
  hub: {
    title: 'LOGIN',
    roles: [
      { value: ROLES.PATIENT, label: 'Patient' },
      { value: ROLES.STAFF, label: 'Administrative Staff' },
      { value: ROLES.HOSPITAL_MANAGER, label: 'Hospital Manager' },
      { value: ROLES.AMBULANCE, label: 'Ambulance Staff' },
      { value: ROLES.DOCTOR, label: 'Doctor' },
    ],
    button: 'Sign in',
    links: (state) => (
      <div className="auth-links" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', marginTop: 16 }}>
        <div>New Patient? <Link to="/register/patient" style={{ fontWeight: 600 }}>Register Patient</Link></div>
        <div>Hospital Manager? <Link to="/hospital-registration" style={{ fontWeight: 600 }}>Register Your Hospital</Link></div>
        <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
          <Link to="/login/regional-officer" state={state} style={muted}>Regional Officer Login</Link>
          <Link to="/login/superuser" state={state} style={muted}>Super User Login</Link>
        </div>
      </div>
    ),
  },
  patient: {
    title: 'PATIENT LOGIN',
    role: ROLES.PATIENT,
    button: 'Sign in',
    links: () => <div className="auth-links">Don't have an account? <Link to="/register/patient">Register here</Link></div>,
  },
  doctor: {
    title: 'DOCTOR LOGIN',
    subtitle: 'Your schedule, your patients, your earnings',
    role: ROLES.DOCTOR,
    emailPlaceholder: 'doctor@nexcare.com',
    passwordPlaceholder: '••••••••',
    button: 'Sign in as Doctor',
    links: (state) => (
      <div className="auth-links" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', marginTop: 16 }}>
        <Link to="/register/staff" style={{ fontSize: 13 }}>New to NexCare? Register your practice</Link>
        <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
          <Link to="/login" state={state} style={muted}>Back to All Logins</Link>
          <Link to="/login/staff" state={state} style={muted}>Staff Login</Link>
        </div>
      </div>
    ),
  },
  staff: {
    title: 'STAFF LOGIN',
    roles: [
      { value: ROLES.STAFF, label: 'Administrative Staff' },
      { value: ROLES.AMBULANCE, label: 'Ambulance Staff' },
    ],
    button: 'Sign in',
    links: () => <div className="auth-links">Don't have an account? <Link to="/register/staff">Register Staff</Link></div>,
  },
  'hospital-manager': {
    title: 'HOSPITAL MANAGER LOGIN',
    subtitle: 'Manage hospital operations, staff, and approvals',
    role: ROLES.HOSPITAL_MANAGER,
    emailPlaceholder: 'manager@hospital.com',
    passwordPlaceholder: '••••••••',
    button: 'Sign in as Hospital Manager',
    links: (state) => (
      <div className="auth-links" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', marginTop: 16 }}>
        <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
          <Link to="/login/regional-officer" state={state} style={muted}>Regional Officer Login</Link>
          <Link to="/login/superuser" state={state} style={muted}>Super User Login</Link>
        </div>
      </div>
    ),
  },
  'regional-officer': { title: 'REGIONAL OFFICER LOGIN', role: ROLES.REGIONAL_MANAGER, button: 'Sign in' },
  superuser: { title: 'SUPER USER LOGIN', role: ROLES.SUPERUSER, button: 'Sign in' },
};

export default function LoginPage() {
  const { role: slug } = useParams();
  const page = PAGES[slug || 'hub'];
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(page?.role || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!page) return <Navigate to="/login" replace />;
  // The HTML login pages never bounced a signed-in visitor (they may be here to
  // switch role); a `from` means RequireAuth sent them, so honour that one.
  if (user && location.state?.from) return <Navigate to={location.state.from} replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const chosen = page.role || role;
    if (!chosen) {
      setError('Please select a role before signing in.');
      return;
    }
    setBusy(true);
    try {
      const u = await login(email.trim(), password, chosen);
      if (u.mustChangePassword) {
        navigate('/change-password', { replace: true });
        return;
      }
      navigate(location.state?.from || homeFor(u.role), { replace: true });
    } catch (err) {
      setError(describeError(err) || 'Authentication failed. Check your credentials.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <h2>{page.title}</h2>
      {page.subtitle && <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>{page.subtitle}</p>}
      <form onSubmit={handleSubmit}>
        <Field label="Email">
          <input type="email" className="form-control" placeholder={page.emailPlaceholder} required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        </Field>
        <Field label="Password">
          <input type="password" className="form-control" placeholder={page.passwordPlaceholder} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </Field>
        <div className="form-actions-row">
          <label style={{ fontWeight: 'normal', fontSize: 14, color: '#666' }}>
            <input type="checkbox" /> Remember me
          </label>
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>
        <FormMessage message={error} />
        {page.roles && <RoleGrid options={page.roles} value={role} onChange={setRole} />}
        <SubmitButton busy={busy} busyLabel="Signing in…">{page.button}</SubmitButton>
        {page.links && page.links(location.state)}
      </form>
    </AuthShell>
  );
}
