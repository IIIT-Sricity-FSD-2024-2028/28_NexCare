import { useEffect, useMemo, useState } from 'react';
import { Modal, fieldLabel, fieldInput } from '../../components/ui';
import { Appointments, Users } from '../../api';
import { useToast } from '../../context/ToastContext';
import { DEFAULT_CONSULTATION_FEE, isoDate } from '../../utils/format';

const FALLBACK_DEPTS = ['Cardiology', 'Neurology', 'Orthopaedics', 'General Medicine', 'Dermatology', 'Paediatrics'];

/**
 * Refer a patient to another doctor: department → doctor → date/time → reason.
 * Creates a Pending appointment with `parentAppointmentId` pointing at the one
 * the referral came from. Form state is all local; the parent only learns the
 * outcome through onCreated().
 */
export default function ReferPatientModal({ apt, onClose, onCreated }) {
  const { notify } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [department, setDepartment] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00 AM');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  // Reset the form and load the referable doctors whenever a new appointment is opened.
  useEffect(() => {
    if (!apt) return undefined;
    let cancelled = false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDepartment('');
    setDoctorId('');
    setDate(isoDate(tomorrow));
    setTime('10:00 AM');
    setReason('');
    setDoctors([]);
    Users.doctors()
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res?.data) ? res.data : [];
        // Same hospital only — a referral stays inside the hospital that owns the booking.
        setDoctors(apt.hospitalId ? list.filter((d) => !d.hospitalId || d.hospitalId === apt.hospitalId) : list);
      })
      .catch(() => { if (!cancelled) setDoctors([]); });
    return () => { cancelled = true; };
  }, [apt]);

  const departments = useMemo(() => {
    const set = Array.from(new Set(doctors.map((d) => d.dept).filter(Boolean)));
    return set.length ? set : FALLBACK_DEPTS;
  }, [doctors]);

  const matching = useMemo(
    () => doctors.filter((d) => !department || d.dept === department),
    [doctors, department],
  );

  async function handleSubmit(e) {
    e.preventDefault();
    const doctor = doctors.find((d) => String(d.id) === String(doctorId));
    if (!doctor) {
      notify('Pick a doctor to refer to', 'error');
      return;
    }
    setBusy(true);
    try {
      const d = new Date(date);
      const dateLabel = isNaN(d.getTime())
        ? date
        : d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
      await Appointments.create({
        patientId: apt.patientId,
        patientName: apt.patientName,
        department,
        doctor: doctor.name,
        doctorId: doctor.id,
        hospitalId: apt.hospitalId || undefined,
        hospitalName: apt.hospitalName || undefined,
        dateLabel,
        timeLabel: time,
        fee: Number(doctor.consultationFee) || DEFAULT_CONSULTATION_FEE,
        reason: reason ? `Referral: ${reason}` : 'Referred follow-up consultation',
        parentAppointmentId: apt.id,
        status: 'Pending',
      });
      notify('Referral appointment created (billed on completion)', 'success');
      onCreated?.();
      onClose();
    } catch (err) {
      notify(err.message || 'Failed to create referral appointment', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={!!apt} onClose={onClose} title="Refer Patient">
      {apt && (
        <form onSubmit={handleSubmit}>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
            Referring <strong>{apt.patientName}</strong> ({apt.patientId}) for a follow-up consultation.
          </p>

          <div style={{ marginBottom: 14 }}>
            <label style={fieldLabel} htmlFor="referDepartment">Department</label>
            <select id="referDepartment" required style={fieldInput} value={department} onChange={(e) => { setDepartment(e.target.value); setDoctorId(''); }}>
              <option value="">Select Department…</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={fieldLabel} htmlFor="referDoctor">Doctor</label>
            <select id="referDoctor" required style={fieldInput} value={doctorId} onChange={(e) => setDoctorId(e.target.value)} disabled={!department}>
              <option value="">{!department ? 'Pick a department first' : matching.length ? 'Select Doctor…' : 'No doctors available in this department'}</option>
              {matching.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.dept}) — ₹{d.consultationFee || DEFAULT_CONSULTATION_FEE}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={fieldLabel} htmlFor="referDate">Date</label>
              <input id="referDate" type="date" required style={fieldInput} min={isoDate()} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label style={fieldLabel} htmlFor="referTime">Time</label>
              <input id="referTime" type="text" required placeholder="e.g. 10:00 AM" style={fieldInput} value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={fieldLabel} htmlFor="referReason">Reason for referral</label>
            <textarea id="referReason" rows={2} placeholder="Why the patient should see this department…" style={{ ...fieldInput, height: 'auto', padding: '8px 10px', resize: 'vertical' }} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Submitting…' : 'Create Referral'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
