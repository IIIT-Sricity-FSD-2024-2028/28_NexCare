import HospitalCard from './HospitalCard.jsx';

export default function HospitalStep({ hospitals, selected, loading, onSelect }) {
  if (loading) {
    return <div className="panel"><p className="muted">Loading hospitals…</p></div>;
  }

  if (!hospitals.length) {
    return <div className="panel"><p className="muted">No hospitals available.</p></div>;
  }

  return (
    <div className="panel">
      <h2 className="panel-title">Select a Hospital</h2>
      <p className="panel-sub">Choose where you would like to be seen.</p>

      <div className="card-grid">
        {hospitals.map((h) => (
          <HospitalCard
            key={h.id}
            hospital={h}
            isSelected={selected?.id === h.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
