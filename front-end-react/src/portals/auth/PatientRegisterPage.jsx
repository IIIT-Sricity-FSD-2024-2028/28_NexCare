import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Auth } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { AuthShell, SubmitButton, FormMessage, Field, validateSignupBasics, describeError } from './AuthShell';

// front-end/auth/patient-register.html (with city + PIN, then back to the
// patient login) and auth/signup.html (no city/PIN; signs the new patient in
// and goes straight to their dashboard). Same form, two exits.
export default function PatientRegisterPage({ variant = 'patient' }) {
  const isSignup = variant === 'signup';
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', city: '', pincode: '', password: '', confirmPassword: '' });
  const [message, setMessage] = useState({ text: '', tone: 'error' });
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState('Creating account…');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = { ...form, fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim(), city: form.city.trim(), pincode: form.pincode.trim() };
    const problem = validateSignupBasics(trimmed);
    if (problem) {
      setMessage({ text: problem, tone: 'error' });
      return;
    }
    setBusy(true);
    setBusyLabel('Creating account…');
    try {
      const payload = { fullName: trimmed.fullName, email: trimmed.email, phone: trimmed.phone, password: trimmed.password };
      if (!isSignup) {
        payload.city = trimmed.city;
        payload.pincode = trimmed.pincode;
      }
      await Auth.register(payload);
      if (isSignup) {
        // signup.html stored the returned session itself; going through login()
        // stores the same keys and gets a token the guard will accept.
        await login(trimmed.email, trimmed.password, 'patient');
        setBusyLabel('Redirecting…');
        navigate('/patient/dashboard', { replace: true });
        return;
      }
      setMessage({ text: 'Registration successful! Redirecting to login...', tone: 'success' });
      setBusyLabel('Redirecting…');
      setTimeout(() => navigate('/login/patient'), 1500);
    } catch (err) {
      setMessage({ text: describeError(err) || 'Registration failed. Please try again.', tone: 'error' });
      setBusy(false);
    }
  }

  return (
    <AuthShell reverse>
      <h2>{isSignup ? 'SIGN UP' : 'PATIENT SIGN UP'}</h2>
      <form onSubmit={handleSubmit}>
        <Field label="Full Name">
          <input type="text" className="form-control" pattern="[A-Za-z ]+" title="Only letters and spaces allowed" required value={form.fullName} onChange={set('fullName')} />
        </Field>
        <Field label="Email">
          <input type="email" className="form-control" required value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Phone">
          <input type="tel" className="form-control" pattern="[0-9]{10}" title="Please enter exactly 10 digits" required value={form.phone} onChange={set('phone')} />
        </Field>
        {!isSignup && (
          <>
            <Field label="City">
              <input type="text" className="form-control" required value={form.city} onChange={set('city')} />
            </Field>
            <Field label="PIN Code">
              <input type="text" className="form-control" pattern="[0-9]{6}" title="Please enter exactly 6 digits" required value={form.pincode} onChange={set('pincode')} />
            </Field>
          </>
        )}
        <Field label="Password">
          <input type="password" className="form-control" required value={form.password} onChange={set('password')} autoComplete="new-password" />
        </Field>
        <Field label="Confirm Password">
          <input type="password" className="form-control" required value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" />
        </Field>
        <FormMessage message={message.text} tone={message.tone} />
        <SubmitButton busy={busy} busyLabel={busyLabel}>Sign up</SubmitButton>
        <div className="auth-links">
          Already have an account? <Link to={isSignup ? '/login' : '/login/patient'}>Sign in</Link>
        </div>
      </form>
    </AuthShell>
  );
}
