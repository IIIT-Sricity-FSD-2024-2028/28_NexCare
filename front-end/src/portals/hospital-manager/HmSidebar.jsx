import { NavLink, useNavigate } from 'react-router-dom';
import NexCareLogo from '../../components/NexCareLogo';
import { useAuth } from '../../context/AuthContext';
import { useHm } from './HmContext';
import { initialsOf } from './hmShared';

// <aside class="sidebar"> from hospital_manager/dashboard.html: the section
// switcher (now <NavLink>s), the three live counters and the subscription
// pill, then the manager card and logout.
const I = (d) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{d}</svg>;
const ICONS = {
  overview: I(<><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>),
  leaves: I(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /><path d="M9 16h6" /></>),
  schedules: I(<><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>),
  staff: I(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
  setup: I(<><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></>),
  inventory: I(<><path d="M21 8l-9-4-9 4 9 4 9-4z" /><path d="M3 8v8l9 4 9-4V8" /><path d="M12 12v8" /></>),
  ambulance: I(<><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M10 10v4" /><path d="M8 12h4" /></>),
  subscription: I(<><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></>),
  revenue: I(<><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>),
  supervision: I(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" /></>),
  chat: I(<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />),
};

export const SECTIONS = [
  { slug: 'overview', label: 'Overview', icon: 'overview' },
  { slug: 'leaves', label: 'Doctor Leaves', icon: 'leaves', counter: 'pendingLeaves' },
  { slug: 'schedules', label: 'Schedule Approvals', icon: 'schedules' },
  { slug: 'staff', label: 'Staff Directory', icon: 'staff' },
  { slug: 'setup', label: 'Registration, Setup & Assets', icon: 'setup' },
  { slug: 'inventory-approvals', label: 'Inventory Approvals', icon: 'inventory', counter: 'pendingReqs' },
  { slug: 'ambulance', label: 'Ambulance Status', icon: 'ambulance', counter: 'onDutyAmbulances' },
  { slug: 'subscription', label: 'Subscription & Renewal', icon: 'subscription', pill: true },
  { slug: 'revenue', label: 'Revenue', icon: 'revenue' },
  { slug: 'supervision', label: 'Admin Supervision', icon: 'supervision' },
  { slug: 'support', label: 'Support Requests', icon: 'chat' },
  { slug: 'feedback', label: 'Patient Feedback', icon: 'chat' },
];

export function subscriptionPill(sub) {
  if (!sub) return { text: 'Active', danger: false };
  if (sub.status === 'EXPIRED') return { text: 'Expired', danger: true };
  if (sub.status === 'DUE_SOON') return { text: 'Due Soon', danger: false };
  return { text: 'Active', danger: false };
}

export default function HmSidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { hospitalName, hospitalId, counts, subscription } = useHm();
  const pill = subscriptionPill(subscription);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <NexCareLogo />
        <div className="portal-badge">Hospital Administration</div>
      </div>

      <nav className="sidebar-nav">
        {SECTIONS.map((s) => {
          const n = s.counter ? counts[s.counter] : 0;
          return (
            <NavLink key={s.slug} to={`/hospital-manager/${s.slug}`} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={onNavigate}>
              {ICONS[s.icon]}
              <span>{s.label}</span>
              {s.counter && n > 0 && <span className="nav-counter">{n}</span>}
              {s.pill && <span className={`nav-pill${pill.danger ? ' bg-danger text-white' : ''}`} style={pill.danger ? { background: '#EF4444', color: '#fff' } : undefined}>{pill.text}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initialsOf(user?.name)}</div>
          <div className="user-details">
            <span className="user-name">{user?.name || 'Hospital Manager'}</span>
            <span className="user-role">🏥 {hospitalName || 'Hospital'}</span>
            <span className="hospital-id-badge">ID: {hospitalId || 'H001'}</span>
          </div>
        </div>
        <button type="button" className="logout-btn" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
