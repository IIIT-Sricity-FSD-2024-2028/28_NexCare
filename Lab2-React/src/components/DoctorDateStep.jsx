import DoctorCard from './DoctorCard.jsx';
import SlotPicker from './SlotPicker.jsx';

export default function DoctorDateStep({
  hospital,
  department,
  date,
  doctor,
  time,
  bookedSlots,
  onSelectDate,
  onSelectDoctor,
  onSelectSlot,
  onBack,
  onNext,
}) {
  const weekday = weekdayOf(date);
  const doctors = (department?.doctors || []).filter(
    (d) => !weekday || (d.availableDays || []).includes(weekday)
  );
  const slots = doctor && weekday ? doctor.slots?.[weekday] || [] : [];

  return (
    <div className="panel">
      <h2 className="panel-title">Choose a Date &amp; Consultant</h2>
      <p className="panel-sub">
        {department?.name} · {hospital?.name}
      </p>

      <label className="field">
        <span className="field-label">Appointment date</span>
        <input
          type="date"
          className="input"
          value={date}
          min={todayISO()}
          onChange={(e) => onSelectDate(e.target.value)}
        />
      </label>

      {!date && <p className="muted">Pick a date to see who is available.</p>}

      {date && (
        <>
          <h3 className="section-title">
            Available on {weekday}
            {doctors.length === 0 && ' — nobody in this department works that day'}
          </h3>

          <div className="card-grid">
            {doctors.map((d) => (
              <DoctorCard
                key={d.id}
                doctor={d}
                isSelected={doctor?.id === d.id}
                onSelect={onSelectDoctor}
              />
            ))}
          </div>
        </>
      )}

      {doctor && (
        <>
          <h3 className="section-title">Available slots for {doctor.name}</h3>
          <SlotPicker
            slots={slots}
            bookedSlots={bookedSlots}
            selected={time}
            onSelect={onSelectSlot}
          />
        </>
      )}

      <div className="panel-actions">
        <button className="btn ghost" onClick={onBack}>Back</button>
        <button className="btn primary" disabled={!date || !doctor || !time} onClick={onNext}>
          Continue
        </button>
      </div>
    </div>
  );
}

function weekdayOf(isoDate) {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime())
    ? null
    : dt.toLocaleDateString('en-US', { weekday: 'long' });
}

function todayISO() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
