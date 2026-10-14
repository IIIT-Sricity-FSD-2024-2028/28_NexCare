import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Appointments, Billing } from '../../api';
import { usePatient } from './PatientContext';
import SystemModal from './SystemModal';

// The <header class="header"> on the patient pages: a search box, the bell and
// the profile button (→ profile page). The bell opens dashboard.js's
// "Notifications Center": upcoming appointments and pending bills.
export default function PatientHeader({ searchPlaceholder = 'Search...', search, onSearch }) {
  const navigate = useNavigate();
  const { displayName, displayId } = usePatient();
  const [notifications, setNotifications] = useState(null); // null = closed
  const initials = displayName.split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase();

  async function showNotifications() {
    let appointments = [];
    let bills = [];
    try { appointments = (await Appointments.getAll()).data || []; } catch { /* shown as none */ }
    try { bills = (await Billing.getAll()).data || []; } catch { /* shown as none */ }
    const upcoming = appointments.filter((a) => a.status === 'Confirmed' || a.status === 'Pending');
    const pending = bills.filter((b) => b.status === 'Pending');
    setNotifications({ upcoming, pending });
  }

  return (
    <>
      <header className="header">
        <div className="search-bar">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="#6A7282" strokeWidth="2" />
            <path d="M14 14l4 4" stroke="#6A7282" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search ?? ''}
            onChange={(e) => onSearch && onSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape' && onSearch) onSearch(''); }}
            readOnly={!onSearch}
          />
        </div>
        <div className="header-actions">
          <button type="button" className="notification-btn" onClick={showNotifications} aria-label="Notifications">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="#6A7282" />
            </svg>
            <span className="notification-badge" />
          </button>
          <button type="button" className="profile-btn" onClick={() => navigate('/patient/profile')}>
            <div className="profile-avatar" id="header-avatar">{initials}</div>
            <div className="profile-info">
              <p className="profile-name" id="header-name">{displayName}</p>
              <p className="profile-id" id="header-id">Patient ID: {displayId}</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="#99A1AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      <SystemModal
        open={Boolean(notifications)}
        title="Notifications Center"
        onClose={() => setNotifications(null)}
        message={notifications && (notifications.upcoming.length + notifications.pending.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#6A7282', fontStyle: 'italic' }}>You have caught up on all alerts.<br />There are no new notifications.</div>
        ) : (
          <div style={{ maxHeight: 350, overflowY: 'auto', paddingRight: 8 }}>
            {notifications.upcoming.map((appt) => (
              <div key={appt.id} style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', background: '#F8FAFC', borderLeft: '4px solid #155DFC', marginBottom: 8, borderRadius: 4 }}>
                <div style={{ fontWeight: 600, color: '#1E293B', marginBottom: 4 }}>Appointment {appt.status}</div>
                <div style={{ fontSize: 14, color: '#4A5565' }}>{appt.doctor} ({appt.department}) on {appt.dateLabel} at {appt.timeLabel}.</div>
              </div>
            ))}
            {notifications.pending.map((bill) => (
              <div key={bill.id} style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', background: '#FFF7ED', borderLeft: '4px solid #F59E0B', marginBottom: 8, borderRadius: 4 }}>
                <div style={{ fontWeight: 600, color: '#9A3412', marginBottom: 4 }}>Payment Required</div>
                <div style={{ fontSize: 14, color: '#4A5565' }}>Invoice {bill.id} for {bill.currency}{bill.subtotal} is due on {bill.dueDate || bill.visitDate}.</div>
              </div>
            ))}
          </div>
        ))}
      />
    </>
  );
}
