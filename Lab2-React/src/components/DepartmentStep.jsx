export default function DepartmentStep({ hospital, selected, onSelect, onBack }) {
  const departments = hospital?.departments || [];

  return (
    <div className="panel">
      <h2 className="panel-title">Select a Department</h2>
      <p className="panel-sub">
        Departments at <strong>{hospital?.name}</strong>
      </p>

      {departments.length === 0 ? (
        <p className="muted">This hospital has no departments listed.</p>
      ) : (
        <div className="card-grid">
          {departments.map((d) => (
            <button
              type="button"
              key={d.id}
              className={`card selectable ${selected?.id === d.id ? 'selected' : ''}`}
              onClick={() => onSelect(d)}
              aria-pressed={selected?.id === d.id}
            >
              <div className="card-icon">🩺</div>
              <h3 className="card-title">{d.name}</h3>
              <p className="card-sub">{d.doctors?.length || 0} consultants available</p>
              <span className={`card-cta ${selected?.id === d.id ? 'is-selected' : ''}`}>
                {selected?.id === d.id ? 'Selected' : 'Select Department'}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="panel-actions">
        <button className="btn ghost" onClick={onBack}>Back</button>
      </div>
    </div>
  );
}
