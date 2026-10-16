import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { initials } from '../../utils/format';
import { roleLabel, ROLES } from '../../utils/roles';
import NotificationBell from './NotificationBell';
import BackButton from './BackButton';

/**
 * The sticky title bar every portal page shares (portal.js fillHeader()).
 * `roleText` overrides the role line — the superuser pages all printed
 * "System Administrator" where roleLabel() would say "Super User".
 */
export default function Header({ title, roleText }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const label = roleText || roleLabel(role);

  const profileRoute = role === ROLES.SUPERUSER ? '/superuser/profile' :
                       role === ROLES.REGIONAL_MANAGER ? '/regional-officer/profile' :
                       role === ROLES.DOCTOR ? '/doctor/profile' :
                       role === ROLES.PATIENT ? '/patient/profile' :
                       role === ROLES.AMBULANCE ? '/ambulance/profile' : null;

  async function handleLogout() {
    await logout();
    navigate('/', { replace: true });
  }

  return (
    <header className="header">
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <span className="header-title">{title}</span>
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <NotificationBell />
        {profileRoute ? (
          <Link to={profileRoute} className="header-user" title="View Profile" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="header-avatar">{initials(user?.name)}</div>
            <div>
              <p className="header-user-name">{user?.name || label}</p>
              <p className="header-user-role">{label}</p>
            </div>
          </Link>
        ) : (
          <div className="header-user">
            <div className="header-avatar">{initials(user?.name)}</div>
            <div>
              <p className="header-user-name">{user?.name || label}</p>
              <p className="header-user-role">{label}</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="header-logout-btn"
          title="Sign Out of NexCare"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
