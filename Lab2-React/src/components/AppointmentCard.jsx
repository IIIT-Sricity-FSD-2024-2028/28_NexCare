export default function AppointmentCard({ appointment, onCancel }) {
  const status = appointment.status || 'Pending';
  const cancellable = status === 'Pending' || status === 'Confirmed';

  return (
    <article className="appt">
      <div className="appt-main">
        <h3 className="appt-title">{appointment.department}</h3>
        <p className="appt-sub">{appointment.doctor}</p>
        <p className="appt-when">
          {appointment.dateLabel} · {appointment.timeLabel}
        </p>
        {appointment.reason && <p className="appt-reason">{appointment.reason}</p>}
      </div>

      <div className="appt-side">
        <span className={`badge ${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>
        <span className="mono tiny">{appointment.token || appointment.id}</span>
        {cancellable && (
          <button className="btn danger sm" onClick={() => onCancel(appointment.id)}>
            Cancel
          </button>
        )}
      </div>
    </article>
  );
}
