export default function SlotPicker({ slots, bookedSlots, selected, onSelect }) {
  if (!slots.length) {
    return <p className="muted">This consultant has no slots on the selected day.</p>;
  }

  return (
    <div className="slot-grid">
      {slots.map((time) => {
        const taken = bookedSlots.has(time);
        return (
          <button
            type="button"
            key={time}
            className={`slot ${selected === time ? 'selected' : ''} ${taken ? 'taken' : ''}`}
            disabled={taken}
            onClick={() => onSelect(time)}
            title={taken ? 'Already booked' : `Book ${time}`}
          >
            {time}
            {taken && <span className="slot-note">Booked</span>}
          </button>
        );
      })}
    </div>
  );
}
