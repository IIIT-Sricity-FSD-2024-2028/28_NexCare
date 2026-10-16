import { Link } from 'react-router-dom';
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
  const { user, role } = useAuth();
  const label = roleText || roleLabel(role);

  const profileRoute = role === ROLES.SUPERUSER ? '/superuser/profile' :
                       role === ROLES.REGIONAL_MANAGER ? '/regional-officer/profile' :
                       role === ROLES.DOCTOR ? '/doctor/profile' :
                       role === ROLES.PATIENT ? '/patient/profile' :
                       role === ROLES.AMBULANCE ? '/ambulance/profile' : null;

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
      </div>
    </header>
  );
}
