import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginUser } from '../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  registerPatient,
  selectPatientRegister,
  selectRegisterPatient,
  setPatientRegisterField,
  setPatientRegisterMessage,
  setPatientRegisterStatus,
} from '../../store/uiSlice';
import { AuthShell, SubmitButton, FormMessage, Field, validateSignupBasics, describeError } from './AuthShell';

// front-end/auth/patient-register.html (with city + PIN, then back to the
// patient login) and auth/signup.html (no city/PIN; signs the new patient in
// and goes straight to their dashboard). Same form, two exits.
export default function PatientRegisterPage({ variant = 'patient' }) {
  const isSignup = variant === 'signup';
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const registerState = useAppSelector(selectRegisterPatient);
  const { fields: form, message, redirecting, busyLabel } = useAppSelector(selectPatientRegister);
  const set = (k) => (e) => dispatch(setPatientRegisterField({ key: k, value: e.target.value }));
  const busy = registerState.loading || redirecting;

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = { ...form, fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim(), city: form.city.trim(), pincode: form.pincode.trim() };
    const problem = validateSignupBasics(trimmed);
    if (problem) {
      dispatch(setPatientRegisterMessage({ text: problem, tone: 'error' }));
      return;
    }
    dispatch(setPatientRegisterStatus({ busyLabel: 'Creating account…' }));
    try {
      const payload = { fullName: trimmed.fullName, email: trimmed.email, phone: trimmed.phone, password: trimmed.password };
      if (!isSignup) {
        payload.city = trimmed.city;
        payload.pincode = trimmed.pincode;
      }
      await dispatch(registerPatient(payload)).unwrap();
      if (isSignup) {
        await dispatch(loginUser({ email: trimmed.email, password: trimmed.password, role: 'patient' })).unwrap();
        dispatch(setPatientRegisterStatus({ busyLabel: 'Redirecting…', redirecting: true }));
        navigate('/patient/dashboard', { replace: true });
        return;
      }
      dispatch(setPatientRegisterMessage({ text: 'Registration successful! Redirecting to login...', tone: 'success' }));
      dispatch(setPatientRegisterStatus({ busyLabel: 'Redirecting…', redirecting: true }));
      setTimeout(() => navigate('/login/patient', { state: location.state }), 1500);
    } catch (err) {
      dispatch(setPatientRegisterMessage({ text: describeError(err) || 'Registration failed. Please try again.', tone: 'error' }));
      dispatch(setPatientRegisterStatus({ redirecting: false }));
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
          Already have an account? <Link to={isSignup ? '/login' : '/login/patient'} state={location.state}>Sign in</Link>
        </div>
      </form>
    </AuthShell>
  );
}
