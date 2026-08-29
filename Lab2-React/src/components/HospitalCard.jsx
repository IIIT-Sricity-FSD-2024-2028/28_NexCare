export default function HospitalCard({ hospital, isSelected, onSelect }) {
  const doctorCount = (hospital.departments || []).reduce(
    (total, d) => total + (d.doctors?.length || 0),
    0
  );

  return (
    <button
      type="button"
      className={`card selectable ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(hospital)}
      aria-pressed={isSelected}
    >
      <div className="card-icon">🏥</div>
      <h3 className="card-title">{hospital.name}</h3>
      <p className="card-sub">
        {hospital.city}
        {hospital.address ? ` · ${hospital.address}` : ''}
      </p>

      <div className="chip-row">
        {(hospital.specialities || []).slice(0, 3).map((s) => (
          <span className="chip" key={s}>{s}</span>
        ))}
      </div>

      <p className="card-meta">
        {hospital.departments?.length || 0} departments · {doctorCount} consultants
      </p>

      <span className={`card-cta ${isSelected ? 'is-selected' : ''}`}>
        {isSelected ? 'Selected' : 'Select Hospital'}
      </span>
    </button>
  );
}
