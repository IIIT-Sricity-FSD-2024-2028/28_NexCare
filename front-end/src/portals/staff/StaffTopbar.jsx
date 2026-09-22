import { useAuth } from '../../context/AuthContext';

// The <div class="topbar"> after logo.js rewrote it: `.user` became a
// `.user-profile` pill with the initial and the name from the JWT.
export default function StaffTopbar() {
  const { user } = useAuth();
  const name = user?.name || 'Admin User';
  return (
    <div className="topbar">
      <div className="user-profile">
        <div className="avatar">{name.charAt(0).toUpperCase()}</div>
        <span className="user-name">{name}</span>
      </div>
    </div>
  );
}
