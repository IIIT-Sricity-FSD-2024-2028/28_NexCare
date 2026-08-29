import { useState } from 'react';
import AppointmentCard from './AppointmentCard.jsx';

export default function MyAppointments({ appointments, onCancel, onBook }) {
  const [filter, setFilter] = useState('upcoming');
  const [error, setError] = useState(null);

  const upcoming = appointments.filter(
    (a) => a.status === 'Pending' || a.status === 'Confirmed'
  );
  const past = appointments.filter(
    (a) => a.status === 'Completed' || a.status === 'Cancelled'
  );
  const shown = filter === 'upcoming' ? upcoming : past;

  const handleCancel = async (id) => {
    const message = await onCancel(id);
    setError(message);
  };

  return (
    <section>
      <div className="list-head">
        <h1>My Appointments</h1>
        <button className="btn primary" onClick={onBook}>Book New</button>
      </div>

      <div className="tabs">
        <button
          className={filter === 'upcoming' ? 'tab active' : 'tab'}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming <span className="pill">{upcoming.length}</span>
        </button>
        <button
          className={filter === 'past' ? 'tab active' : 'tab'}
          onClick={() => setFilter('past')}
        >
          Past <span className="pill">{past.length}</span>
        </button>
      </div>

      {error && <p className="alert error">{error}</p>}

      {shown.length === 0 ? (
        <div className="panel center">
          <p className="muted">
            {filter === 'upcoming'
              ? 'No upcoming appointments.'
              : 'Nothing in your history yet.'}
          </p>
          {filter === 'upcoming' && (
            <button className="btn primary" onClick={onBook}>Book an Appointment</button>
          )}
        </div>
      ) : (
        <div className="appt-list">
          {shown.map((a) => (
            <AppointmentCard key={a.id} appointment={a} onCancel={handleCancel} />
          ))}
        </div>
      )}
    </section>
  );
}
