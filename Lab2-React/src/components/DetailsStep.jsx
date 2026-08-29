export default function DetailsStep({ booking, error, submitting, onChangeReason, onBack, onConfirm }) {
  return (
    <div className="panel">
      <h2 className="panel-title">Confirm Your Details</h2>
      <p className="panel-sub">Check everything below before you book.</p>

      <dl className="summary">
        <div><dt>Hospital</dt><dd>{booking.hospital?.name}</dd></div>
        <div><dt>Department</dt><dd>{booking.department?.name}</dd></div>
        <div><dt>Consultant</dt><dd>{booking.doctor?.name}</dd></div>
        <div><dt>Date</dt><dd>{booking.date}</dd></div>
        <div><dt>Time</dt><dd>{booking.time}</dd></div>
      </dl>

      <label className="field">
        <span className="field-label">Reason for visit</span>
        <textarea
          className="input textarea"
          rows={3}
          maxLength={300}
          placeholder="e.g. Routine follow-up after last month's consultation"
          value={booking.reason}
          onChange={(e) => onChangeReason(e.target.value)}
        />
      </label>

      {error && <p className="alert error">{error}</p>}

      <div className="panel-actions">
        <button className="btn ghost" onClick={onBack} disabled={submitting}>Back</button>
        <button className="btn primary" onClick={onConfirm} disabled={submitting}>
          {submitting ? 'Booking…' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  );
}
