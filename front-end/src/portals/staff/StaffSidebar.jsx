import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Hospitals } from '../../api';
import NexCareLogo from '../../components/NexCareLogo';
import { useAuth } from '../../context/AuthContext';

// The <div class="sidebar"> from the staff HTML pages: the <nex-care-logo>
// block logo.js rendered (logo, "Administrative Staff", hospital name), the
// ten menu items in the dashboard's order with their own icons, and the
// logout button. system-logs.html is not in the menu — it only redirected to
// the dashboard.
const ITEMS = [
  { to: '/staff/dashboard', label: 'Dashboard', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
  ) },
  { to: '/staff/patient-checkin', label: 'Patient Check-in', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-8 0v2" /><circle cx="12" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
  ) },
  { to: '/staff/patient-directory', label: 'Patient Directory', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ) },
  { to: '/staff/manage-appointments', label: 'Manage Appointments', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
  ) },
  { to: '/staff/bed-allocation', label: 'Bed Allocation', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="10" width="18" height="5" rx="1" /><rect x="4" y="7" width="4" height="3" rx="1" /><line x1="3" y1="7" x2="3" y2="15" /><line x1="21" y1="10" x2="21" y2="15" /></svg>
  ) },
  { to: '/staff/inventory', label: 'Inventory', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3 8 12 13 21 8" /></svg>
  ) },
  { to: '/staff/staff-scheduling', label: 'Staff Scheduling', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="7" r="4" /><path d="M17 11a4 4 0 1 0-4-4" /><path d="M3 21v-2a4 4 0 0 1 6-3.46" /><path d="M16 21v-2a4 4 0 0 0-3-3.87" /></svg>
  ) },
  { to: '/staff/leave-requests', label: 'Leave Requests', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /><path d="M9 16h6" /></svg>
  ) },
  { to: '/staff/generate-bill', label: 'Generate Bill', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V8z" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="9" x2="8" y2="9" /></svg>
  ) },
  { to: '/staff/feedback', label: 'Feedback', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /></svg>
  ) },
];

export default function StaffSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [hospitalName, setHospitalName] = useState('');

  // logo.js: GET /hospitals/:id for the name under the logo.
  useEffect(() => {
    let cancelled = false;
    if (!user?.hospitalId) { setHospitalName(''); return undefined; }
    Hospitals.getById(user.hospitalId)
      .then((res) => { if (!cancelled) setHospitalName(res.data?.name || ''); })
      .catch((err) => console.error('Failed to fetch hospital name:', err));
    return () => { cancelled = true; };
  }, [user?.hospitalId]);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="sidebar">
      <div className="logo-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 20 }}>
        <div className="logo" style={{ padding: 0 }}>
          <NexCareLogo />
        </div>
        <div className="portal-subtitle" style={{ marginTop: 10, fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, paddingLeft: 2 }}>Administrative Staff</div>
        <div id="logoHospitalName" style={{ marginTop: 8, fontSize: 12, color: '#374151', fontWeight: 600, paddingLeft: 2, lineHeight: 1.3 }}>{hospitalName}</div>
      </div>

      <ul className="menu">
        {ITEMS.map(({ to, label, icon }) => (
          // styles.css styles `.menu li.active a`, so the class goes on the <li>.
          <li key={to} className={pathname.startsWith(to) ? 'active' : undefined}>
            <Link to={to}>{icon}{label}</Link>
          </li>
        ))}
      </ul>

      <div className="logout">
        <button type="button" className="logout-btn" onClick={handleLogout}>
          <svg className="logout-icon" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
