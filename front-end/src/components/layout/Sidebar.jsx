import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import NexCareLogo from '../NexCareLogo';
import { LogoutIcon } from '../icons';
import { logoutUser, selectRole, selectUser } from '../../store/authSlice';
import { Hospitals } from '../../api';
import { roleLabel } from '../../utils/roles';
import { menuFor } from './navigation';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectSidebarOpen } from '../../store/uiSlice';

// front-end/shared/nav.js as a component: the role picks the menu, NavLink
// handles the "active" class nav.js computed from window.location, and the
// hospital name under the role tag is fetched once for anyone with a hospitalId.
export default function Sidebar() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const role = useAppSelector(selectRole);
  const sidebarOpen = useAppSelector(selectSidebarOpen);
  const navigate = useNavigate();
  const [hospitalName, setHospitalName] = useState(user?.hospitalName || '');

  useEffect(() => {
    let cancelled = false;
    if (!user?.hospitalId || user.hospitalName) return undefined;
    Hospitals.getById(user.hospitalId)
      .then((res) => { if (!cancelled && res?.data?.name) setHospitalName(res.data.name); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  async function handleLogout() {
    await dispatch(logoutUser()).unwrap();
    navigate('/', { replace: true });
  }

  return (
    <div className={`sidebar${sidebarOpen ? '' : ' sidebar-collapsed'}`}>
      <div className="sidebar-brand">
        <NexCareLogo scale={0.62} />
        <span className="sidebar-role-tag">{roleLabel(role)}</span>
        {hospitalName && (
          <div id="sidebarHospitalName" style={{ marginTop: 8, fontSize: 13, color: '#374151', fontWeight: 600, paddingLeft: 8, lineHeight: 1.3 }}>
            {hospitalName}
          </div>
        )}
      </div>

      <nav className="nav-menu">
        {menuFor(role).map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="logout-btn" onClick={handleLogout} title="Sign Out of NexCare">
          <LogoutIcon />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
