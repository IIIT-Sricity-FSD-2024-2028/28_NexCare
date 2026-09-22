import { useAuth } from '../../context/AuthContext';
import { initials } from '../../utils/format';
import { roleLabel } from '../../utils/roles';
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
  return (
    <header className="header">
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <span className="header-title">{title}</span>
      </span>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <NotificationBell />
        <div className="header-user">
          <div className="header-avatar">{initials(user?.name)}</div>
          <div>
            <p className="header-user-name">{user?.name || label}</p>
            <p className="header-user-role">{label}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
