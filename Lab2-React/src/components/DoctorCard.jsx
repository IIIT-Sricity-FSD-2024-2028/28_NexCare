export default function DoctorCard({ doctor, isSelected, onSelect }) {
  return (
    <button
      type="button"
      className={`card selectable compact ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(doctor)}
      aria-pressed={isSelected}
    >
      <h3 className="card-title">{doctor.name}</h3>
      <p className="card-sub">{doctor.qualification}</p>
      <p className="card-meta">{doctor.experience} years experience</p>
      <div className="chip-row">
        {(doctor.availableDays || []).map((d) => (
          <span className="chip small" key={d}>{d.slice(0, 3)}</span>
        ))}
      </div>
    </button>
  );
}
