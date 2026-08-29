export default function Confirmation({ appointment, onDone }) {
  if (!appointment) return null;

  return (
    <div className="panel center">
      <div className="tick" aria-hidden="true">✓</div>
      <h2 className="panel-title">Appointment Requested</h2>
      <p className="panel-sub">
        Your booking is <strong>{appointment.status || 'Pending'}</strong>. Hospital
        staff will confirm it shortly.
      </p>

      <dl className="summary boxed">
        <div><dt>Token</dt><dd className="mono">{appointment.token}</dd></div>
        <div><dt>Reference</dt><dd className="mono">{appointment.id}</dd></div>
        <div><dt>Department</dt><dd>{appointment.department}</dd></div>
        <div><dt>Consultant</dt><dd>{appointment.doctor}</dd></div>
        <div><dt>When</dt><dd>{appointment.dateLabel} at {appointment.timeLabel}</dd></div>
        {appointment.fee != null && <div><dt>Fee</dt><dd>₹{appointment.fee}</dd></div>}
      </dl>

      {appointment.local && (
        <p className="alert warn">
          Saved locally only — the backend was not reachable, so this booking will
          disappear on reload.
        </p>
      )}

      <button className="btn primary lg" onClick={onDone}>
        View My Appointments
      </button>
    </div>
  );
}
