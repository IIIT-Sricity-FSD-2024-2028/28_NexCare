import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  registerStaff,
  selectRegisterStaff,
  selectStaffRegister,
  setStaffRegisterField,
  setStaffRegisterMessage,
  setStaffRegisterStatus,
} from '../../store/uiSlice';
import { ROLES } from '../../utils/roles';
import { AuthShell, SubmitButton, FormMessage, Field, RoleGrid, validateSignupBasics, describeError } from './AuthShell';

const ROLE_OPTIONS = [
  { value: ROLES.STAFF, label: 'Administrative Staff' },
  { value: ROLES.AMBULANCE, label: 'Ambulance' },
  { value: ROLES.DOCTOR, label: 'Doctor' },
];

// front-end/auth/staff-register.html — self-registration for administrative
// staff, ambulance crew and doctors via /auth/register-staff. A doctor must
// give a specialisation: patients book by department, so without one the
// account could never be booked.
export default function StaffRegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const registerState = useAppSelector(selectRegisterStaff);
  const { fields: form, message, redirecting, busyLabel } = useAppSelector(selectStaffRegister);
  const busy = registerState.loading || redirecting;
  const set = (k) => (e) => dispatch(setStaffRegisterField({ key: k, value: e.target.value }));
  const isDoctor = form.role === ROLES.DOCTOR;

  async function handleSubmit(e) {
    e.preventDefault();
    const t = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, typeof v === 'string' && !/password/i.test(k) ? v.trim() : v]));
    if (!t.role) {
      dispatch(setStaffRegisterMessage({ text: 'Please select a role.', tone: 'error' }));
      return;
    }
    const problem = validateSignupBasics(t);
    if (problem) {
      dispatch(setStaffRegisterMessage({ text: problem, tone: 'error' }));
      return;
    }
    if (isDoctor && !t.specialization) {
      dispatch(setStaffRegisterMessage({ text: 'Please enter your specialisation — patients book by department.', tone: 'error' }));
      return;
    }
    dispatch(setStaffRegisterStatus({ busyLabel: 'Creating account…' }));
    try {
      const payload = { fullName: t.fullName, email: t.email, phone: t.phone, password: t.password, role: t.role, hospitalId: t.hospitalId };
      if (t.department) payload.dept = t.department;
      if (isDoctor) {
        payload.specialization = t.specialization;
        if (t.registrationNo) payload.registrationNo = t.registrationNo;
        if (t.consultationFee !== '') payload.consultationFee = Number(t.consultationFee);
      }
      await dispatch(registerStaff(payload)).unwrap();
      dispatch(setStaffRegisterMessage({ text: 'Registration successful! Redirecting to login...', tone: 'success' }));
      dispatch(setStaffRegisterStatus({ busyLabel: 'Redirecting…', redirecting: true }));
      setTimeout(() => navigate(isDoctor ? '/login/doctor' : '/login/staff'), 1500);
    } catch (err) {
      dispatch(setStaffRegisterMessage({ text: describeError(err) || 'Registration failed. Please try again.', tone: 'error' }));
      dispatch(setStaffRegisterStatus({ redirecting: false }));
    }
  }

  return (
    <AuthShell reverse>
      <h2>STAFF SIGN UP</h2>
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
        <RoleGrid options={ROLE_OPTIONS} value={form.role} onChange={(v) => dispatch(setStaffRegisterField({ key: 'role', value: v }))} style={{ marginBottom: 15 }} />
        {isDoctor && (
          <>
            <Field label="Specialisation">
              <input type="text" className="form-control" placeholder="e.g. Cardiology" required value={form.specialization} onChange={set('specialization')} />
            </Field>
            <Field label="Medical council registration no.">
              <input type="text" className="form-control" placeholder="e.g. APMC-45219" value={form.registrationNo} onChange={set('registrationNo')} />
            </Field>
            <Field label="Consultation fee (₹)">
              <input type="number" className="form-control" min="0" step="50" placeholder="e.g. 600" value={form.consultationFee} onChange={set('consultationFee')} />
            </Field>
          </>
        )}
        <Field label="Hospital ID">
          <input type="text" className="form-control" required placeholder="e.g. H001" value={form.hospitalId} onChange={set('hospitalId')} />
        </Field>
        <Field label="Department (Optional)">
          <input type="text" className="form-control" placeholder="e.g. Cardiology" value={form.department} onChange={set('department')} />
        </Field>
        <Field label="Password">
          <input type="password" className="form-control" required value={form.password} onChange={set('password')} autoComplete="new-password" />
        </Field>
        <Field label="Confirm Password">
          <input type="password" className="form-control" required value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" />
        </Field>
        <FormMessage message={message.text} tone={message.tone} />
        <SubmitButton busy={busy} busyLabel={busyLabel}>Sign up</SubmitButton>
        <div className="auth-links">
          Already have an account? <Link to="/login/staff">Sign in</Link>
        </div>
      </form>
    </AuthShell>
  );
}
