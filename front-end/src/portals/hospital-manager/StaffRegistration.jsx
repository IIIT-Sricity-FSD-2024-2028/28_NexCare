import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useHm } from './HmContext';
import { Field, HmModal, roleLabel } from './hmShared';

// The two "Register Hospital Staff Member" forms from dashboard.html — the
// header modal (#staffForm) and the longer one on the Setup page
// (#dedicatedStaffForm) — plus the credentials card both showed afterwards.
// Both POST the same shape to /users; the backend forces hospitalId to the
// manager's own and refuses any role but doctor / staff / ambulance.

const MODAL_DEPTS = ['Cardiology', 'Neurology', 'General Medicine', 'Orthopaedics', 'Paediatrics', 'Dermatology', 'Front Desk', 'Emergency Transport'];
const PAGE_DEPTS = ['Cardiology', 'Neurology', 'General Medicine', 'Orthopaedics', 'Paediatrics', 'Dermatology', 'Emergency Medicine', 'Front Desk', 'Emergency Transport'];
const DEPT_LABELS = { 'Front Desk': 'Front Desk / Operations', 'Emergency Transport': 'Emergency Transport' };
const EMPLOYMENT = ['Full-time', 'Part-time', 'Consultant', 'Contract'];
const SHIFTS = ['Day Shift (08:00 - 16:00)', 'Evening Shift (16:00 - 00:00)', 'Night Shift (00:00 - 08:00)', 'Rotational'];
const RESPONSIBILITIES = [
  { value: 'Bed Allocation & Patient Check-in', label: 'Bed Allocation & Check-in' },
  { value: 'Inventory Requisition & Tracking', label: 'Inventory Requisition & Tracking' },
  { value: 'Billing & Discharge Administration', label: 'Billing & Discharge Admin' },
  { value: 'Appointment Queue Management', label: 'Appointment Queue Management' },
];
const today = () => new Date().toISOString().split('T')[0];

const blank = (variant) => ({
  role: 'doctor', name: '', phone: '', dob: '', gender: 'Female', address: '', dept: 'Cardiology', designation: '',
  qualification: '', joiningDate: today(), employmentType: 'Full-time',
  specialization: '', medicalRegNumber: '', experienceYears: '', consultationTiming: '', consultationFee: '',
  // The modal ticked three of the four; the Setup form ticked all four.
  responsibilities: RESPONSIBILITIES.map((r) => r.value).filter((v) => variant === 'page' || v !== 'Appointment Queue Management'),
  driverLicense: '', assignedVehicle: '', shift: SHIFTS[0],
});

/** Users.previewEmail(name) 250 ms after the last keystroke, as both forms did. */
function useEmailPreview(name) {
  const [email, setEmail] = useState('');
  const timer = useRef(null);
  useEffect(() => {
    clearTimeout(timer.current);
    if (!name.trim()) { setEmail(''); return undefined; }
    timer.current = setTimeout(() => {
      Users.previewEmail(name.trim())
        .then((res) => { if (res.data?.email) setEmail(res.data.email); })
        .catch((e) => console.error('Email preview error:', e));
    }, 250);
    return () => clearTimeout(timer.current);
  }, [name]);
  return email;
}

/** Shared submit: build the CreateUserDto the HTML built, POST it, hand the credentials card the result. */
export function useRegisterStaff(variant) {
  const { hospitalId, hospitalName, setRegistered, refresh } = useHm();
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);

  async function submit(form) {
    const name = form.name.trim();
    if (!name) { notify('Please enter staff full name', 'error'); return false; }
    const role = form.role;
    const payload = {
      name,
      phone: form.phone.trim() || '+91 98480 12345',
      gender: form.gender || 'Other',
      dept: form.dept || 'General Medicine',
      designation: form.designation.trim() || 'Staff Member',
      employmentType: form.employmentType || 'Full-time',
      role,
      hospitalId,
      hospitalName,
      status: 'Active',
    };
    if (variant === 'page') {
      payload.dob = form.dob || undefined;
      payload.address = form.address.trim() || undefined;
      payload.qualification = form.qualification.trim() || undefined;
      payload.joiningDate = form.joiningDate || today();
    }
    if (role === 'doctor') {
      payload.specialization = form.specialization.trim() || 'General Medicine';
      payload.medicalRegNumber = form.medicalRegNumber.trim() || 'MCI-00000';
      payload.experienceYears = Number(form.experienceYears) || 5;
      payload.consultationTiming = form.consultationTiming.trim() || (variant === 'page' ? '09:00 AM - 01:00 PM (Mon-Fri)' : '09:00 AM - 01:00 PM');
      if (variant === 'page') payload.consultationFee = Number(form.consultationFee) || 500;
      else payload.qualification = form.qualification.trim() || 'MBBS, MD';
    } else if (role === 'administrative_staff') {
      payload.responsibilities = form.responsibilities.length ? form.responsibilities
        : (variant === 'page' ? ['Bed Allocation & Patient Check-in', 'Inventory Requisition & Tracking'] : ['Bed Allocation & Patient Check-in']);
    } else if (role === 'ambulance') {
      payload.driverLicense = form.driverLicense.trim() || 'DL-AP-TEMP';
      payload.assignedVehicle = form.assignedVehicle.trim() || 'AP-03-AX-1001';
      payload.shift = form.shift || SHIFTS[0];
    }

    setBusy(true);
    try {
      const res = await Users.create(payload);
      if (!res.data) throw new Error(res.message || 'Staff registration failed');
      if (variant === 'page') notify(`Staff member ${name} registered successfully!`, 'success');
      setRegistered(res.data);
      refresh();
      return true;
    } catch (err) {
      const msg = Array.isArray(err?.message) ? err.message.join(', ') : (err?.message || 'Server error');
      notify(`${variant === 'page' ? 'Error registering staff member' : 'Error creating staff record'}: ${msg}`, 'error');
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { submit, busy };
}

function RoleFields({ variant, form, set }) {
  const page = variant === 'page';
  if (form.role === 'doctor') {
    return page ? (
      <div style={{ marginTop: 20, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 16 }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1e40af', fontSize: 14 }}>Doctor Clinical Directory Attributes</h4>
        <div className="form-row">
          <Field label="Specialization" required><input className="form-control" placeholder="e.g. Pediatric Cardiology" value={form.specialization} onChange={set('specialization')} /></Field>
          <Field label="Medical Registration Number (MRN)" required><input className="form-control" placeholder="e.g. MCI-99881" value={form.medicalRegNumber} onChange={set('medicalRegNumber')} /></Field>
        </div>
        <div className="form-row mt-12">
          <Field label="Years of Experience"><input type="number" className="form-control" min="0" max="60" placeholder="8" value={form.experienceYears} onChange={set('experienceYears')} /></Field>
          <Field label="Consultation Timing / Hours"><input className="form-control" placeholder="e.g. 09:00 AM - 01:00 PM (Mon-Fri)" value={form.consultationTiming} onChange={set('consultationTiming')} /></Field>
          <Field label="Consultation Fee (₹)"><input type="number" className="form-control" min="0" placeholder="500" value={form.consultationFee} onChange={set('consultationFee')} /></Field>
        </div>
      </div>
    ) : (
      <div className="conditional-section mt-16">
        <h4 className="section-divider-title">Doctor Clinical Details (Non-Clinical System Record)</h4>
        <div className="form-row mt-8">
          <Field label="Specialization" required><input className="form-control" placeholder="e.g. Interventional Cardiology" value={form.specialization} onChange={set('specialization')} /></Field>
          <Field label="Medical Registration Number (MRN)" required><input className="form-control" placeholder="e.g. MCI-88492 / AP-10293" value={form.medicalRegNumber} onChange={set('medicalRegNumber')} /></Field>
        </div>
        <div className="form-row mt-8">
          <Field label="Qualifications" required><input className="form-control" placeholder="e.g. MBBS, MD (Cardiology), DM" value={form.qualification} onChange={set('qualification')} /></Field>
          <Field label="Experience (Years)"><input type="number" className="form-control" min="0" max="60" placeholder="10" value={form.experienceYears} onChange={set('experienceYears')} /></Field>
        </div>
        <Field label="Consultation Timing / OPD Hours" className="form-group mt-8"><input className="form-control" placeholder="e.g. 09:00 AM - 01:00 PM (Mon-Fri)" value={form.consultationTiming} onChange={set('consultationTiming')} /></Field>
      </div>
    );
  }
  if (form.role === 'administrative_staff') {
    const toggle = (v) => () => set('responsibilities')({ target: { value: form.responsibilities.includes(v) ? form.responsibilities.filter((x) => x !== v) : [...form.responsibilities, v] } });
    const boxes = RESPONSIBILITIES.map((r) => (
      <label key={r.value} className={page ? undefined : 'checkbox-label'} style={page ? { fontSize: 13, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 } : undefined}>
        <input type="checkbox" checked={form.responsibilities.includes(r.value)} onChange={toggle(r.value)} /> {page ? r.label : ({ 'Inventory Requisition & Tracking': 'Inventory Requisitions', 'Billing & Discharge Administration': 'Billing & Discharge', 'Appointment Queue Management': 'Appointment Queue' }[r.value] || r.label)}
      </label>
    ));
    return page ? (
      <div style={{ marginTop: 20, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#166534', fontSize: 14 }}>Administrative Responsibilities</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{boxes}</div>
      </div>
    ) : (
      <div className="conditional-section mt-16">
        <h4 className="section-divider-title">Administrative Staff Responsibilities</h4>
        <div className="checkbox-group-grid mt-8">{boxes}</div>
      </div>
    );
  }
  const shifts = page ? SHIFTS : SHIFTS.slice(0, 3);
  return page ? (
    <div style={{ marginTop: 20, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 16 }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#92400e', fontSize: 14 }}>Ambulance Driver & Transport Details</h4>
      <div className="form-row">
        <Field label="Driver License Number" required><input className="form-control" placeholder="e.g. DL-AP-2019-88391" value={form.driverLicense} onChange={set('driverLicense')} /></Field>
        <Field label="Assigned Vehicle Registration"><input className="form-control" placeholder="e.g. AP-03-AX-1001" value={form.assignedVehicle} onChange={set('assignedVehicle')} /></Field>
        <Field label="Shift Schedule"><select className="form-control" value={form.shift} onChange={set('shift')}>{shifts.map((s) => <option key={s}>{s}</option>)}</select></Field>
      </div>
    </div>
  ) : (
    <div className="conditional-section mt-16">
      <h4 className="section-divider-title">Ambulance Service Details</h4>
      <div className="form-row mt-8">
        <Field label="Driver License Number"><input className="form-control" placeholder="e.g. DL-AP-2020-99882" value={form.driverLicense} onChange={set('driverLicense')} /></Field>
        <Field label="Assigned Vehicle Number"><input className="form-control" placeholder="e.g. AP-03-AX-1001" value={form.assignedVehicle} onChange={set('assignedVehicle')} /></Field>
      </div>
      <Field label="Duty Shift" className="form-group mt-8"><select className="form-control" value={form.shift} onChange={set('shift')}>{shifts.map((s) => <option key={s}>{s}</option>)}</select></Field>
    </div>
  );
}

/** The header's "Register Hospital Staff Member" modal. */
export function StaffRegisterModal() {
  const { staffModal, closeStaffModal, hospitalId, hospitalName } = useHm();
  const [form, setForm] = useState(() => blank('modal'));
  const email = useEmailPreview(form.name);
  const { submit, busy } = useRegisterStaff('modal');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // openStaffModal() reset the form every time.
  useEffect(() => { if (staffModal) setForm(blank('modal')); }, [staffModal]);

  async function onSubmit(e) {
    e.preventDefault();
    if (await submit(form)) closeStaffModal();
  }

  return (
    <HmModal
      open={staffModal}
      onClose={closeStaffModal}
      title="Register Hospital Staff Member"
      size="large"
      as="form"
      onSubmit={onSubmit}
      bodyStyle={{ overflowY: 'auto', flex: 1, padding: 24 }}
      footer={(
        <>
          <button type="button" className="btn-secondary" onClick={closeStaffModal} disabled={busy}>Cancel</button>
          <button type="submit" className="btn-primary" style={{ padding: '10px 24px', fontSize: 14, fontWeight: 700 }} disabled={busy}>
            {busy ? 'Registering Staff...' : 'Submit Registration'}
          </button>
        </>
      )}
    >
      <div className="form-row hospital-readonly-bar">
        <Field label="Hospital ID (Auto-assigned)"><input className="input-readonly" readOnly value={hospitalId || 'H001'} /></Field>
        <Field label="Hospital Name (Auto-assigned)" className="form-group flex-2"><input className="input-readonly" readOnly value={hospitalName || ''} /></Field>
      </div>

      <Field label="Staff Role" required className="form-group mt-12" hint="Note: Super Users, Regional Officers, and Hospital Managers can only be created by system administrators.">
        <select className="form-control" required value={form.role} onChange={set('role')}>
          <option value="doctor">Doctor (Clinical Directory Record)</option>
          <option value="administrative_staff">Administrative Staff</option>
          <option value="ambulance">Ambulance Staff / Driver</option>
        </select>
      </Field>

      <div className="form-row mt-12">
        <Field label="Full Name" required><input className="form-control" placeholder="e.g. Ananya Sharma" required value={form.name} onChange={set('name')} /></Field>
        <Field label="Phone Number" required><input type="tel" className="form-control" placeholder="+91 98480 12345" required value={form.phone} onChange={set('phone')} /></Field>
      </div>

      <div className="form-row mt-12">
        <Field label="Staff Email (Auto-generated on registration)" hint="Generated automatically from staff name (firstname.lastname@nexcare.in)">
          <input className="form-control input-readonly" readOnly placeholder="Auto-generated (e.g. ananya.sharma@nexcare.in)" value={email} style={{ background: '#f8fafc', color: '#0284c7', fontWeight: 600 }} />
        </Field>
        <Field label="Employee ID (Auto-generated)" hint="Auto-assigned by hospital and role">
          <input className="form-control input-readonly" readOnly placeholder="Auto-generated (e.g. DOC-H001-024)" value="" style={{ background: '#f8fafc', color: '#0284c7', fontWeight: 600 }} />
        </Field>
      </div>

      <div className="form-row mt-12">
        <Field label="Department" required>
          <select className="form-control" required value={form.dept} onChange={set('dept')}>
            {MODAL_DEPTS.map((d) => <option key={d} value={d}>{d === 'Front Desk' ? 'Front Desk / Admissions' : d}</option>)}
          </select>
        </Field>
        <Field label="Designation" required><input className="form-control" placeholder="e.g. Senior Consultant Cardiologist" required value={form.designation} onChange={set('designation')} /></Field>
      </div>

      <div className="form-row mt-12">
        <Field label="Gender"><select className="form-control" value={form.gender} onChange={set('gender')}><option>Female</option><option>Male</option><option>Other</option></select></Field>
        <Field label="Employment Type"><select className="form-control" value={form.employmentType} onChange={set('employmentType')}>{EMPLOYMENT.map((e) => <option key={e}>{e}</option>)}</select></Field>
      </div>

      <RoleFields variant="modal" form={form} set={set} />
    </HmModal>
  );
}

/** The dedicated form at the top of the Setup page. */
export function StaffRegisterForm() {
  const navigate = useNavigate();
  const { hospitalId, hospitalName, regionId, regionName } = useHm();
  const [form, setForm] = useState(() => blank('page'));
  const email = useEmailPreview(form.name);
  const { submit, busy } = useRegisterStaff('page');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const h3 = { fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 14px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: 6 };
  const scopeLabel = { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' };
  const scopeVal = { fontWeight: 700, color: '#0f172a', fontSize: 14, marginTop: 2 };

  async function onSubmit(e) {
    e.preventDefault();
    if (await submit(form)) setForm(blank('page'));
  }

  return (
    <div className="card" style={{ maxWidth: 960, margin: '0 auto' }}>
      <div className="card-header flex-between">
        <div>
          <h2>Register Hospital Staff Member</h2>
          <p className="card-subtitle">Add new Doctors, Administrative Staff, or Ambulance Drivers for this hospital</p>
        </div>
      </div>

      <form className="setup-form" onSubmit={onSubmit} style={{ padding: '20px 24px' }}>
        <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 140 }}><label style={scopeLabel}>Hospital ID (Auto-assigned)</label><div style={scopeVal}>{hospitalId || 'H001'}</div></div>
          <div style={{ flex: 2, minWidth: 220 }}><label style={scopeLabel}>Hospital Name (Auto-assigned)</label><div style={scopeVal}>{hospitalName}</div></div>
          <div style={{ flex: 1, minWidth: 140 }}><label style={scopeLabel}>Region (Auto-assigned)</label><div style={scopeVal}>{regionName || 'Andhra Pradesh South'} ({regionId || 'R001'})</div></div>
        </div>

        <h3 style={h3}>1. Personal Details</h3>
        <div className="form-row">
          <Field label="Full Name" required><input className="form-control" placeholder="e.g. Ananya Sharma" required value={form.name} onChange={set('name')} /></Field>
          <Field label="Auto-Generated Login Email (Preview)"><input className="form-control" readOnly value={email || 'name@nexcare.in'} style={{ background: '#f8fafc', fontWeight: 600, color: '#2563eb' }} /></Field>
        </div>
        <div className="form-row mt-12">
          <Field label="Phone Number" required><input type="tel" className="form-control" placeholder="+91 98480 12345" required value={form.phone} onChange={set('phone')} /></Field>
          <Field label="Date of Birth"><input type="date" className="form-control" value={form.dob} onChange={set('dob')} /></Field>
          <Field label="Gender"><select className="form-control" value={form.gender} onChange={set('gender')}><option>Female</option><option>Male</option><option>Other</option></select></Field>
        </div>
        <Field label="Residential Address" className="form-group mt-12"><input className="form-control" placeholder="Street Address, City, State" value={form.address} onChange={set('address')} /></Field>

        <h3 style={{ ...h3, margin: '24px 0 14px 0' }}>2. Employment Details</h3>
        <div className="form-row">
          <Field label="Staff Role" required>
            <select className="form-control" required value={form.role} onChange={set('role')}>
              <option value="doctor">Doctor (Clinical Directory Record)</option>
              <option value="administrative_staff">Administrative Staff / Front Desk</option>
              <option value="ambulance">Ambulance Staff / Driver</option>
            </select>
          </Field>
          <Field label="Department" required>
            <select className="form-control" required value={form.dept} onChange={set('dept')}>
              {PAGE_DEPTS.map((d) => <option key={d} value={d}>{DEPT_LABELS[d] || d}</option>)}
            </select>
          </Field>
        </div>
        <div className="form-row mt-12">
          <Field label="Designation"><input className="form-control" placeholder="e.g. Consultant Cardiologist / Operations Lead" value={form.designation} onChange={set('designation')} /></Field>
          <Field label="Qualifications"><input className="form-control" placeholder="e.g. MBBS, MD, DM / MBA Healthcare" value={form.qualification} onChange={set('qualification')} /></Field>
        </div>
        <div className="form-row mt-12">
          <Field label="Joining Date" required><input type="date" className="form-control" required value={form.joiningDate} onChange={set('joiningDate')} /></Field>
          <Field label="Employment Type"><select className="form-control" value={form.employmentType} onChange={set('employmentType')}>{EMPLOYMENT.map((e) => <option key={e}>{e}</option>)}</select></Field>
        </div>

        <RoleFields variant="page" form={form} set={set} />

        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '12px 16px', marginTop: 20, fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>ℹ️</span>
          <div>Newly registered staff will automatically receive default login credentials (<code>NexCare@123</code>) and will be prompted to change their password on first login.</div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}>
          <button type="button" className="btn-secondary" onClick={() => navigate('/hospital-manager/staff')}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={busy} style={{ padding: '12px 28px', fontSize: 15, fontWeight: 700, background: '#2563EB', color: '#fff', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(37,99,235,0.3)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {busy ? 'Registering Staff...' : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" /></svg>
                <span>Submit Registration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/** "Staff Registered Successfully!" — the credentials card with copy / register another / view directory. */
export function RegistrationSuccessModal() {
  const navigate = useNavigate();
  const { registered, setRegistered, hospitalName, openStaffModal } = useHm();
  const { notify } = useToast();
  if (!registered) return null;

  const creds = {
    name: registered.name,
    employeeId: registered.employeeId || registered.id,
    role: roleLabel(registered.role),
    hospital: registered.hospitalName || hospitalName || 'Hospital',
    email: registered.email,
    password: registered.tempPassword || 'NexCare@123',
  };
  const row = { display: 'flex', justifyContent: 'space-between', marginBottom: 6 };
  const key = { color: '#64748b' };

  function copy() {
    const text = `NexCare Staff Credentials:\nName: ${creds.name}\nEmployee ID: ${creds.employeeId}\nRole: ${creds.role}\nHospital: ${creds.hospital}\nEmail: ${creds.email}\nTemporary Password: ${creds.password}\n(Note: Password change required on first login)`;
    navigator.clipboard.writeText(text)
      .then(() => notify('Staff credentials copied to clipboard!', 'success'))
      .catch(() => notify(`Credentials ready: ${creds.email}`, 'info'));
  }

  const close = () => setRegistered(null);

  return (
    <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="modal-container" style={{ maxWidth: 520, textAlign: 'center', padding: 24 }} role="dialog" aria-modal="true">
        <div style={{ width: 56, height: 56, background: '#dcfce7', color: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h3 style={{ margin: '0 0 6px 0', color: '#0f172a', fontSize: 20 }}>Staff Registered Successfully!</h3>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px 0' }}>New employee credentials created and added to the hospital directory.</p>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, textAlign: 'left', marginBottom: 18, fontSize: 13, lineHeight: 1.7 }}>
          <div style={row}><span style={key}>Employee Name:</span><strong style={{ color: '#0f172a' }}>{creds.name}</strong></div>
          <div style={row}><span style={key}>Employee ID:</span><strong style={{ color: '#2563eb' }}>{creds.employeeId}</strong></div>
          <div style={row}><span style={key}>Role:</span><span style={{ fontWeight: 600, color: '#0f172a' }}>{creds.role}</span></div>
          <div style={row}><span style={key}>Hospital:</span><strong style={{ color: '#0f172a' }}>{creds.hospital}</strong></div>
          <hr style={{ border: 'none', borderTop: '1px dashed #cbd5e1', margin: '10px 0' }} />
          <div style={row}><span style={key}>Login Email:</span><code style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{creds.email}</code></div>
          <div style={row}><span style={key}>Temporary Password:</span><code style={{ background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{creds.password}</code></div>
          <div style={{ fontSize: 11.5, color: '#d97706', marginTop: 6 }}>⚠️ Password must be changed during first login.</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button type="button" className="btn-primary" style={{ justifyContent: 'center', width: '100%', fontWeight: 600 }} onClick={copy}>📋 Copy Credentials</button>
          <div style={{ display: 'flex', gap: 10 }}>
            {/* registerAnotherStaff() switched to a tab that did not exist and landed on the overview; the form lives on Setup. */}
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => { close(); if (window.location.pathname.endsWith('/setup')) window.scrollTo({ top: 0, behavior: 'smooth' }); else openStaffModal(); }}>+ Register Another</button>
            <button type="button" className="btn-secondary" style={{ flex: 1, background: '#0f172a', color: '#fff' }} onClick={() => { close(); navigate('/hospital-manager/staff'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>View Directory</button>
          </div>
        </div>
      </div>
    </div>
  );
}
