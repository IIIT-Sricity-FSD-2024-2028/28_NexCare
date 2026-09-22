import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Appointments } from '../../../api';
import { useToast } from '../../../context/ToastContext';
import { availableDoctorsForDate, departmentsOf, slotsForDoctor, weekdayOfDate } from '../../../features/doctor-directory/catalogue';
import { loadPublishedSchedules, publishedWindows } from '../../../features/doctor-directory/hospitalSchedule';
import { DEFAULT_CONSULTATION_FEE } from '../../../utils/format';
import { isPaidMembership, usePatient } from '../PatientContext';
import { bookedSlotsForDoctor } from './bookedSlots';
import { deptInfo } from './DEPT_INFO';
import StepIndicator from './StepIndicator';

// The four-step booking flow from patient/appointments/appointments.js
// (renderStep0..3 + renderConfirmation). `booking` / `setBooking` live in the
// page so a reschedule can prefill them; `catalogue` is the live directory.
//
// Steps: 0 hospital · 1 department · 2 date, doctor & slot · 3 summary · 4 done.

export const EMPTY_BOOKING = { hospital: null, department: null, doctorId: null, doctor: null, fee: null, date: null, time: null, lastToken: null };

export default function BookingWizard({ catalogue, catalogueError, booking, setBooking, onBackToLanding, onViewAppointments }) {
  const [step, setStep] = useState(booking.hospital ? 1 : 0);

  if (step === 0) return <StepHospital catalogue={catalogue} catalogueError={catalogueError} booking={booking} setBooking={setBooking} onBack={onBackToLanding} onNext={() => setStep(1)} />;
  if (step === 1) return <StepDepartment booking={booking} setBooking={setBooking} onBack={() => setStep(0)} onNext={() => setStep(2)} />;
  if (step === 2) return <StepDateDoctor catalogue={catalogue} booking={booking} setBooking={setBooking} onBack={() => setStep(1)} onNext={() => setStep(3)} />;
  if (step === 3) return <StepSummary booking={booking} setBooking={setBooking} onBack={() => setStep(2)} onSlotTaken={() => setStep(2)} onDone={() => setStep(4)} />;
  return <Confirmation booking={booking} onViewAppointments={onViewAppointments} />;
}

/* ── Step 0: hospital ─────────────────────────────────────────────────────── */
function StepHospital({ catalogue, catalogueError, booking, setBooking, onBack, onNext }) {
  const [q, setQ] = useState('');
  const query = q.toLowerCase();
  const list = catalogue.filter((h) => !query
    || (h.name && h.name.toLowerCase().includes(query))
    || (h.city && h.city.toLowerCase().includes(query))
    || (h.address && h.address.toLowerCase().includes(query))
    || (h.specialities && h.specialities.some((s) => s.toLowerCase().includes(query))));

  function choose(h) {
    if (booking.hospital?.id !== h.id) setBooking({ ...booking, hospital: h, department: null, date: null, doctor: null, doctorId: null, time: null });
    onNext();
  }

  return (
    <>
      <div className="booking-header">
        <button type="button" className="btn-outline-sm" style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={onBack}>← Back to Appointments Landing</button>
        <h1>Book an Appointment</h1>
        <p>Select a hospital to proceed with booking.</p>
      </div>
      <StepIndicator step={0} />
      <div className="booking-card">
        <h2>Select Hospital</h2>
        <div style={{ marginBottom: 20 }}>
          <input type="text" id="hospitalSearchInput" className="form-control" placeholder="Search hospitals by name, city, area or specialty..." value={q} onChange={(e) => setQ(e.target.value)} style={{ width: '100%', maxWidth: 500, padding: 10, borderRadius: 6, border: '1px solid #ccc' }} />
        </div>
        <div className="hospital-results-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 20 }}>
          {catalogueError && !catalogue.length && (
            <p style={{ padding: 16, color: '#B91C1C', textAlign: 'center', gridColumn: '1 / -1' }}>The hospital directory is unavailable — check that the backend is running.</p>
          )}
          {!catalogueError && !list.length && (
            <p style={{ padding: 16, color: '#6B7280', textAlign: 'center', gridColumn: '1 / -1' }}>No hospitals match your search criteria.</p>
          )}
          {list.map((h) => {
            const selected = booking.hospital && (booking.hospital.id === h.id || booking.hospital.name === h.name);
            return (
              <div
                key={h.id}
                className={`hospital-card${selected ? ' selected' : ''}`}
                onClick={() => choose(h)}
                style={{ border: selected ? '2px solid #155DFC' : '1px solid #E5E7EB', background: selected ? '#EFF6FF' : '#FFFFFF', borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>🏥</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{h.name}</h3>
                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>📍 {h.city} • {h.address || ''}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {(h.specialities || []).slice(0, 3).map((s) => <span key={s} className="badge" style={{ background: '#F3F4F6', color: '#374151', fontSize: 11 }}>{s}</span>)}
                </div>
                <button type="button" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontSize: 13 }}>{selected ? 'Selected' : 'Select Hospital'}</button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ── Step 1: department ───────────────────────────────────────────────────── */
function StepDepartment({ booking, setBooking, onBack, onNext }) {
  const hosp = booking.hospital;
  const hospName = hosp ? hosp.name : 'Hospital';
  const depts = departmentsOf(hosp);

  function pick(name) {
    if (booking.department !== name) setBooking({ ...booking, department: name, date: null, doctor: null, doctorId: null, time: null });
  }

  return (
    <>
      <div className="booking-header">
        <h1>Book an Appointment — {hospName}</h1>
        <p>Select an available department offered at {hospName}.</p>
      </div>
      <StepIndicator step={1} />
      <div className="booking-card">
        <h2>Select Department</h2>
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Selected Hospital:</span>
            <span style={{ fontSize: 14, color: '#111827', fontWeight: 700, marginLeft: 8 }}>🏥 {hospName}</span>
          </div>
          <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', color: '#155DFC', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Change Hospital</button>
        </div>
        <div className="department-grid">
          {depts.map((d) => {
            const name = typeof d === 'string' ? d : d.name || d;
            const info = deptInfo(name);
            return (
              <button type="button" key={name} className={`department-btn${booking.department === name ? ' selected' : ''}`} onClick={() => pick(name)}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{info.icon}</div>
                <h3>{name}</h3>
                <p>{info.desc}</p>
              </button>
            );
          })}
        </div>
        <div className="booking-actions">
          <button type="button" className="btn-back-booking" onClick={onBack}>← Back to Hospitals</button>
          <button type="button" className="btn-continue" disabled={!booking.department} onClick={() => booking.department && onNext()}>Continue</button>
        </div>
      </div>
    </>
  );
}

/* ── Step 2: date, doctor, slot ───────────────────────────────────────────── */
function StepDateDoctor({ catalogue, booking, setBooking, onBack, onNext }) {
  const hosp = booking.hospital;
  const hospId = hosp ? hosp.id : 'apollo';
  const hospName = hosp ? hosp.name : 'Hospital';
  const dept = booking.department || 'General Medicine';

  const [date, setDate] = useState(booking.date || '');
  const [doctorId, setDoctorId] = useState(booking.doctorId || '');
  const [time, setTime] = useState(booking.time || null);
  const [booked, setBooked] = useState(new Set());
  // The hospital's published rosters: `undefined` while loading, `null` when
  // the request failed (slots are then offered untrimmed and the server has
  // the final say), else the approved rows for this hospital.
  const [schedules, setSchedules] = useState(undefined);
  const latest = useRef(0);

  const todayStr = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  // One GET /schedules per hospital — the wizard only ever offers slots inside
  // the published roster, which is what the server checks a booking against.
  useEffect(() => {
    let cancelled = false;
    setSchedules(undefined);
    loadPublishedSchedules(hospId)
      .then((rows) => { if (!cancelled) setSchedules(rows); })
      .catch((err) => {
        console.warn('[NexCare] Published hospital schedule could not be loaded:', err.message);
        if (!cancelled) setSchedules(null);
      });
    return () => { cancelled = true; };
  }, [hospId]);

  const doctors = useMemo(() => (date ? availableDoctorsForDate(catalogue, hospId, dept, date) : []), [catalogue, hospId, dept, date]);
  const selectedDoc = doctors.find((d) => (d.id && d.id === doctorId) || d.name === doctorId) || doctors[0] || null;
  const slots = selectedDoc && schedules !== undefined
    ? slotsForDoctor(catalogue, hospId, dept, selectedDoc.id || selectedDoc.name, date, schedules)
    : [];
  const rosterOpen = !Array.isArray(schedules) || publishedWindows(schedules, dept, date).length > 0;

  // When the date changes, keep the previously chosen doctor if they work that
  // day, else fall back to the first available (handleDateChange).
  useEffect(() => {
    if (!date) return;
    const keep = doctors.find((d) => d.name === booking.doctor || d.id === booking.doctorId);
    setDoctorId(keep ? keep.id || keep.name : doctors[0] ? doctors[0].id || doctors[0].name : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, doctors]);

  // Booked slots for the chosen doctor on the chosen date.
  useEffect(() => {
    if (!date || !selectedDoc) { setBooked(new Set()); return undefined; }
    const id = ++latest.current;
    bookedSlotsForDoctor(selectedDoc.name, date).then((set) => { if (id === latest.current) setBooked(set); });
    return undefined;
  }, [date, selectedDoc]);

  // A previously selected slot that is no longer offered or is now taken is
  // dropped — once the roster is known, so a time carried back from the
  // summary survives the load.
  useEffect(() => {
    if (schedules === undefined) return;
    if (time && (!slots.includes(time) || booked.has(time))) setTime(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots.join('|'), booked, schedules]);

  const availableCount = slots.filter((s) => !booked.has(s)).length;
  let alert = '';
  if (date && doctors.length === 0) alert = 'No doctors are available for this department on the selected date. Please choose another date.';
  else if (date && Array.isArray(schedules) && schedules.length === 0) alert = 'No hospital schedule has been published yet. Wait for the hospital manager to approve the roster.';
  else if (date && !rosterOpen) alert = `${hospName} has not published ${dept} hours for this date. Please choose another date.`;
  else if (date && selectedDoc && schedules !== undefined && slots.length === 0) alert = `${selectedDoc.name}'s hours fall outside the published ${dept} roster on this date. Please choose another date or doctor.`;
  else if (date && selectedDoc && slots.length > 0 && availableCount === 0) alert = `All time slots for ${selectedDoc.name} on this date are fully booked. Please choose another date or doctor.`;

  const canContinue = Boolean(date && selectedDoc && time && !booked.has(time));

  function next() {
    if (!canContinue) return;
    setBooking({ ...booking, date, doctorId: selectedDoc.id, doctor: selectedDoc.name, fee: selectedDoc.consultationFee || null, time });
    onNext();
  }

  const labelStyle = { display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 };
  const fieldStyle = { width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 };
  const weekday = date ? weekdayOfDate(date) : '';

  return (
    <>
      <div className="booking-header">
        <h1>Select Date &amp; Doctor</h1>
        <p>Choose your preferred date, doctor, and time slot for <strong>{dept}</strong> at {hospName}.</p>
      </div>
      <StepIndicator step={2} />
      <div className="booking-card">
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="step2DatePicker" style={labelStyle}>📅 1. Select Appointment Date *</label>
          <input type="date" id="step2DatePicker" className="form-input" style={fieldStyle} min={todayStr} max={maxDate.toISOString().split('T')[0]} value={date} onChange={(e) => { setDate(e.target.value); setTime(null); }} />
        </div>

        {alert && <div style={{ padding: '14px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#991B1B', fontSize: 13, marginBottom: 20 }}>{alert}</div>}

        <div style={{ marginBottom: 20 }}>
          <label htmlFor="step2DoctorSelect" style={labelStyle}>👨‍⚕️ 2. Select Available Doctor *</label>
          <select id="step2DoctorSelect" style={fieldStyle} disabled={!date || doctors.length === 0} value={selectedDoc ? selectedDoc.id || selectedDoc.name : ''} onChange={(e) => { setDoctorId(e.target.value); setTime(null); }}>
            {!date ? <option value="">Select Date First...</option> : <option value="">Select Doctor...</option>}
            {doctors.map((d) => (
              <option key={d.id || d.name} value={d.id || d.name}>{d.name} — {d.qualification} ({d.experience} yrs exp)</option>
            ))}
          </select>
        </div>

        {date && selectedDoc && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ color: '#1E3A8A', fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>👨‍⚕️ {selectedDoc.name}</h4>
                  <p style={{ color: '#1D4ED8', fontSize: 13, fontWeight: 600, margin: 0 }}>{dept} • {selectedDoc.qualification}</p>
                </div>
                <span className="badge" style={{ background: '#DBEAFE', color: '#1E40AF', padding: '4px 8px', fontSize: 11, fontWeight: 600, borderRadius: 20 }}>Available</span>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#4B5563', marginTop: 8 }}>
                <span>⭐ <strong>{selectedDoc.experience} Yrs Exp</strong></span>
                <span>🏥 <strong>{hospName}</strong></span>
                <span>📅 <strong>{weekday}</strong></span>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <label style={{ ...labelStyle, marginBottom: 8 }}>🕒 3. Available Time Slots *</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
            {date && selectedDoc && slots.map((s) => {
              const isBooked = booked.has(s);
              const isSelected = time === s && !isBooked;
              const base = { padding: '8px 12px', borderRadius: 6, fontWeight: 600, fontSize: 13, transition: 'all 0.2s' };
              return isBooked ? (
                <button type="button" key={s} disabled title="This slot has already been booked by another patient" style={{ ...base, border: '1px solid #E5E7EB', background: '#F3F4F6', color: '#9CA3AF', cursor: 'not-allowed' }}>
                  <span style={{ textDecoration: 'line-through' }}>{s}</span>
                  <span style={{ display: 'block', fontSize: 10, color: '#DC2626', fontWeight: 700 }}>Booked</span>
                </button>
              ) : (
                <button type="button" key={s} onClick={() => setTime(s)} style={{ ...base, border: isSelected ? '2px solid #155DFC' : '1px solid #D1D5DB', background: isSelected ? '#155DFC' : '#FFFFFF', color: isSelected ? '#FFFFFF' : '#1F2937', cursor: 'pointer' }}>{s}</button>
              );
            })}
          </div>
        </div>

        <div className="booking-actions">
          <button type="button" className="btn-back-booking" onClick={onBack}>← Back to Department</button>
          <button type="button" className="btn-continue" disabled={!canContinue} onClick={next}>Continue</button>
        </div>
      </div>
    </>
  );
}

/* ── Step 3: summary + confirm ────────────────────────────────────────────── */
function StepSummary({ booking, setBooking, onBack, onSlotTaken, onDone }) {
  const { notify } = useToast();
  const { membership, patientId } = usePatient();
  const [busy, setBusy] = useState(false);
  const hosp = booking.hospital;
  const hospName = hosp ? hosp.name : 'Hospital';
  const paid = isPaidMembership(membership);

  const items = [
    ['Hospital', hospName],
    ['Department', booking.department],
    ['Doctor', booking.doctor],
    ['Appointment Date', booking.date],
    ['Time Slot', booking.time],
    ['Consultation Fee', booking.fee ? `₹${booking.fee}` : '₹800'],
  ];

  async function confirm() {
    setBusy(true);
    try {
      // Guard: the slot may have been taken since step 2.
      const fresh = await bookedSlotsForDoctor(booking.doctor, booking.date);
      if (fresh.has(booking.time)) {
        notify(`Slot "${booking.time}" on ${booking.date} was just booked. Please choose another slot.`, 'error');
        onSlotTaken();
        return;
      }
      // Exactly the fields CreateAppointmentDto declares, no more and no less —
      // the ValidationPipe runs with forbidNonWhitelisted, so an extra key is a
      // 400, and `patientId` is @IsNotEmpty even though the controller then
      // overwrites it with the caller's own id. appointments.js built a wider
      // object and db.js whitelisted it down to this before POSTing.
      const res = await Appointments.create({
        patientId,
        hospitalId: hosp ? hosp.id : undefined,
        hospitalName: hospName,
        department: booking.department,
        doctor: booking.doctor,
        doctorId: booking.doctorId || undefined,
        dateLabel: booking.date,
        timeLabel: booking.time,
        reason: '',
        fee: booking.fee || DEFAULT_CONSULTATION_FEE,
      });
      const result = res.data;
      if (!result || !result.id) throw new Error('The hospital did not create an appointment record.');
      setBooking({ ...booking, lastToken: result.token || result.id });
      onDone();
    } catch (err) {
      console.error('Error confirming appointment:', err);
      notify(err?.message || 'Failed to confirm appointment', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="booking-header">
        <h1>Patient Details &amp; Summary</h1>
        <p>Review your appointment details before confirming.</p>
      </div>
      <StepIndicator step={3} />
      <div className="booking-card">
        <h2>Appointment Summary</h2>
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          {items.map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
              <span style={{ color: '#6B7280' }}>{label}:</span>
              <span style={{ fontWeight: 700, color: '#111827' }}>{val || 'Not selected'}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px dashed #D1D5DB', paddingTop: 12, marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13.5 }}>
            <span style={{ color: '#4B5563' }}>Platform Convenience Fee:</span>
            <span id="bookingConvenienceFee" style={{ fontWeight: 700, color: '#059669' }}>
              {membership && !paid
                ? <><span style={{ color: '#111827' }}>₹39</span> <span style={{ fontSize: 11, color: '#6B7280' }}>(Pay As You Go)</span></>
                : <><span style={{ textDecoration: 'line-through', color: '#9CA3AF', marginRight: 4 }}>₹39</span> FREE ({membership?.planName || 'Care+ Benefit'})</>}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13.5, marginTop: 8 }}>
            <span style={{ color: '#4B5563' }}>Queue Priority:</span>
            <span id="bookingQueuePriority" style={{ fontWeight: 700 }}>
              {membership && !paid
                ? <span style={{ color: '#4B5563' }}>Standard Queue</span>
                : <span style={{ color: '#2563EB' }}>⚡ Priority Queue ({membership?.planName || 'Care+'})</span>}
            </span>
          </div>
        </div>
        <div className="booking-actions">
          <button type="button" className="btn-back-booking" onClick={onBack}>← Back to Date &amp; Doctor</button>
          <button type="button" className="btn-continue" disabled={busy} onClick={confirm}>{busy ? 'Processing...' : 'Confirm Appointment'}</button>
        </div>
      </div>
    </>
  );
}

/* ── Step 4: confirmation ─────────────────────────────────────────────────── */
function Confirmation({ booking, onViewAppointments }) {
  const navigate = useNavigate();
  const hospName = booking.hospital ? booking.hospital.name : 'Hospital';
  const items = [
    ['Appointment Token', booking.lastToken || 'APT-1024'],
    ['Hospital', hospName],
    ['Department', booking.department],
    ['Doctor', booking.doctor],
    ['Date', booking.date],
    ['Time Slot', booking.time],
    ['Status', 'Confirmed'],
  ];
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16, padding: '40px 24px', textAlign: 'center', maxWidth: 550, margin: '40px auto', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
      <h2 style={{ color: '#00A63E', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Appointment Confirmed!</h2>
      <p style={{ color: '#4B5563', fontSize: 14, marginBottom: 24 }}>Your appointment has been successfully scheduled. Present your appointment token at the reception.</p>
      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 24, textAlign: 'left' }}>
        {items.map(([label, val]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
            <span style={{ color: '#6B7280' }}>{label}:</span>
            <span style={{ fontWeight: 600, color: '#111827' }}>{val}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={() => navigate('/patient/dashboard')}>Go to Dashboard</button>
        <button type="button" className="btn-outline-sm" style={{ flex: 1, padding: '10px 16px' }} onClick={onViewAppointments}>View My Appointments</button>
      </div>
    </div>
  );
}
