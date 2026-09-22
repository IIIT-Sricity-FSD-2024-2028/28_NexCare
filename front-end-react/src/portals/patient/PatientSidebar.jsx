import { Link, NavLink, useNavigate } from 'react-router-dom';
import NexCareLogo from '../../components/NexCareLogo';
import { useAuth } from '../../context/AuthContext';

// The <aside class="sidebar"> every patient page carried inline, with the
// original icons. Logout is the last nav item, as in the HTML.
const ITEMS = [
  { to: '/patient/dashboard', label: 'Dashboard', icon: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect width="8" height="8" x="2" y="2" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect width="8" height="8" x="2" y="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect width="8" height="8" x="12" y="2" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect width="8" height="8" x="12" y="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ) },
  { to: '/patient/hospital-search', label: 'Search Hospitals', icon: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ) },
  { to: '/patient/appointments', label: 'Appointments', icon: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M6.667 1.667v3.333M13.333 1.667V5" stroke="currentColor" strokeWidth="1.667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.917 7.5h14.166" stroke="currentColor" strokeWidth="1.667" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="2.5" y="3.333" width="15" height="15" rx="2" stroke="currentColor" strokeWidth="1.667" />
    </svg>
  ) },
  { to: '/patient/ambulance', label: 'Ambulance Request', icon: (
    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 8H15V6C15 4.89543 14.1046 4 13 4H5C3.89543 4 3 4.89543 3 6V16C3 17.1046 3.89543 18 5 18H6.18421C6.58354 19.165 7.69351 20 9 20C10.3065 20 11.4165 19.165 11.8158 18H16.1842C16.5835 19.165 17.6935 20 19 20C20.3065 20 21.4165 19.165 21.8158 18H23V14L20 10V8C20 6.89543 19.1046 6 18 6H17V8Z" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 8V12H20" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 11H11" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 9V13" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9" cy="18" r="2" stroke="#6B7280" strokeWidth="1.5" />
      <circle cx="19" cy="18" r="2" stroke="#6B7280" strokeWidth="1.5" />
    </svg>
  ) },
  { to: '/patient/billing', label: 'Billing & Payments', icon: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 8h16" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ) },
  { to: '/patient/feedback', label: 'Feedback and Complaint', icon: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M14 2v4M2 8h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 12h2M12 12h2M6 15h2M12 15h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ) },
  { to: '/patient/membership', label: 'Care+ Membership', icon: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L2.2 7.7l5.4-.8L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ) },
  { to: '/patient/profile', label: 'Profile', icon: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M17 18c0-3.866-3.134-7-7-7s-7 3.134-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ) },
];

export const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M13 15l5-5-5-5M18 10H8M12 5v-.5a2 2 0 00-2-2H4a2 2 0 00-2 2v11a2 2 0 002 2h6a2 2 0 002-2V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function PatientSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout(e) {
    e.preventDefault();
    await logout();
    navigate('/', { replace: true });
  }

  return (
    <aside className="sidebar">
      <Link className="sidebar-brand" to="/patient/dashboard" aria-label="NexCare Patient Portal Home">
        <NexCareLogo />
        <span className="sidebar-brand-subtitle">Patient Portal</span>
      </Link>
      <nav className="nav-menu">
        {ITEMS.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            {icon}
            <span>{label}</span>
          </NavLink>
        ))}
        <a href="/" onClick={handleLogout} className="nav-item nav-logout">
          <LogoutIcon />
          <span>Logout</span>
        </a>
      </nav>
    </aside>
  );
}
