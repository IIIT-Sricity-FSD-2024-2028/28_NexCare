import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import NexCareLogo from '../../components/NexCareLogo';
import { useAuth } from '../../context/AuthContext';
import useConfirm from '../../hooks/useConfirm';
import useStylesheet from '../../hooks/useStylesheet';
import ambulanceCss from '../../styles/ambulance.css?url';
import { AmbulanceProvider, useAmbulance } from './AmbulanceContext';

// ambulance/index.html: one page whose six `.page` blocks were switched by
// SessionManager.navigateToPage(); each is a nested route now. The shell is
// the <aside class="sidebar"> (logo, hospital name, six links, logout) and
// <main class="main-content"> that scrolls.
const I = (d, box = '0 0 21.8182 21.8182') => <svg className="nav-icon" fill="none" viewBox={box} aria-hidden="true">{d}</svg>;
const sw = { strokeWidth: 1.81818, strokeLinecap: 'round', strokeLinejoin: 'round' };
export const SECTIONS = [
  { slug: 'dashboard', label: 'Dashboard', icon: I(<><path {...sw} d="M8.18173 2.72798H3.63627C3.1342 2.72798 2.72718 3.135 2.72718 3.63707V10.0007C2.72718 10.5028 3.1342 10.9098 3.63627 10.9098H8.18173C8.68381 10.9098 9.09082 10.5028 9.09082 10.0007V3.63707C9.09082 3.135 8.68381 2.72798 8.18173 2.72798Z" /><path {...sw} d="M18.1821 2.72798H13.6366C13.1346 2.72798 12.7275 3.135 12.7275 3.63707V6.36435C12.7275 6.86642 13.1346 7.27344 13.6366 7.27344H18.1821C18.6842 7.27344 19.0912 6.86642 19.0912 6.36435V3.63707C19.0912 3.135 18.6842 2.72798 18.1821 2.72798Z" /><path {...sw} d="M18.1821 10.9098H13.6366C13.1346 10.9098 12.7275 11.3168 12.7275 11.8189V18.1825C12.7275 18.6846 13.1346 19.0916 13.6366 19.0916H18.1821C18.6842 19.0916 19.0912 18.6846 19.0912 18.1825V11.8189C19.0912 11.3168 18.6842 10.9098 18.1821 10.9098Z" /><path {...sw} d="M8.18173 14.5469H3.63627C3.1342 14.5469 2.72718 14.9539 2.72718 15.456V18.1832C2.72718 18.6853 3.1342 19.0923 3.63627 19.0923H8.18173C8.68381 19.0923 9.09082 18.6853 9.09082 18.1832V15.456C9.09082 14.9539 8.68381 14.5469 8.18173 14.5469Z" /></>) },
  { slug: 'ambulance-requests', label: 'Incoming Requests', icon: I(<><path {...sw} d="M9.08976 9.09109H5.45339" /><path {...sw} d="M12.7275 16.3638V5.45472C12.7275 4.97251 12.536 4.51005 12.195 4.16907C11.854 3.8281 11.3916 3.63654 10.9094 3.63654H3.63663C3.15442 3.63654 2.69196 3.8281 2.35098 4.16907C2.01001 4.51005 1.81845 4.97251 1.81845 5.45472V15.4547C1.81845 15.6958 1.91423 15.9271 2.08471 16.0975C2.2552 16.268 2.48643 16.3638 2.72754 16.3638H4.54572" /><path {...sw} d="M17.273 16.3624H19.0912C19.3323 16.3624 19.5635 16.2666 19.734 16.0961C19.9045 15.9256 20.0003 15.6944 20.0003 15.4533V12.4715C20.0001 12.2808 19.94 12.0949 19.8284 11.9403C19.7168 11.7856 19.5594 11.6699 19.3784 11.6097L17.6303 11.0269C17.517 10.9891 17.4123 10.9293 17.3221 10.851C17.232 10.7727 17.1581 10.6774 17.1048 10.5706L15.7057 7.77421C15.6303 7.62323 15.5143 7.49623 15.3707 7.40744C15.2272 7.31865 15.0618 7.27157 14.893 7.27148H12.7275" /><path {...sw} d="M7.27299 7.27148V10.9078" /><path {...sw} d="M8.18173 16.3631H13.6363" /><path {...sw} d="M15.4545 18.182C16.4586 18.182 17.2726 17.368 17.2726 16.3638C17.2726 15.3597 16.4586 14.5456 15.4545 14.5456C14.4503 14.5456 13.6363 15.3597 13.6363 16.3638C13.6363 17.368 14.4503 18.182 15.4545 18.182Z" /><path {...sw} d="M6.3639 18.182C7.36806 18.182 8.18208 17.368 8.18208 16.3638C8.18208 15.3597 7.36806 14.5456 6.3639 14.5456C5.35975 14.5456 4.54572 15.3597 4.54572 16.3638C4.54572 17.368 5.35975 18.182 6.3639 18.182Z" /></>) },
  { slug: 'assigned-dispatch', label: 'Assigned Dispatch', icon: I(<><path {...sw} d="M13.6366 1.81765H8.18208C7.68001 1.81765 7.27299 2.22466 7.27299 2.72674V4.54492C7.27299 5.047 7.68001 5.45401 8.18208 5.45401H13.6366C14.1387 5.45401 14.5457 5.047 14.5457 4.54492V2.72674C14.5457 2.22466 14.1387 1.81765 13.6366 1.81765Z" /><path {...sw} d="M14.545 3.63725H16.3632C16.8454 3.63725 17.3079 3.82881 17.6488 4.16978C17.9898 4.51076 18.1814 4.97322 18.1814 5.45543V18.1827C18.1814 18.6649 17.9898 19.1274 17.6488 19.4684C17.3079 19.8093 16.8454 20.0009 16.3632 20.0009H5.4541C4.97189 20.0009 4.50943 19.8093 4.16845 19.4684C3.82748 19.1274 3.63592 18.6649 3.63592 18.1827V5.45543C3.63592 4.97322 3.82748 4.51076 4.16845 4.16978C4.50943 3.82881 4.97189 3.63725 5.4541 3.63725H7.27228" /><path {...sw} d="M10.909 9.99947H14.5454" /><path {...sw} d="M10.909 14.5463H14.5454" /><path {...sw} d="M7.27299 9.99947H7.28133" /><path {...sw} d="M7.27299 14.5463H7.28133" /></>) },
  { slug: 'active-transport', label: 'Active Transport', icon: I(<><path {...sw} d="M12.7275 16.3631V5.45401C12.7275 4.9718 12.536 4.50934 12.195 4.16836C11.854 3.82739 11.3916 3.63583 10.9094 3.63583H3.63663C3.15442 3.63583 2.69196 3.82739 2.35098 4.16836C2.01001 4.50934 1.81845 4.9718 1.81845 5.45401V15.454C1.81845 15.6951 1.91423 15.9263 2.08471 16.0968C2.2552 16.2673 2.48643 16.3631 2.72754 16.3631H4.54572" /><path {...sw} d="M13.6363 16.3624H8.18173" /><path {...sw} d="M17.273 16.3617H19.0912C19.3323 16.3617 19.5635 16.2659 19.734 16.0954C19.9045 15.9249 20.0003 15.6937 20.0003 15.4526V12.1344C19.9999 11.9281 19.9294 11.7281 19.8003 11.5671L16.6366 7.61259C16.5516 7.50612 16.4437 7.42012 16.321 7.36095C16.1983 7.30179 16.0638 7.27097 15.9275 7.27077H12.7275" /><path {...sw} d="M15.4545 18.1813C16.4586 18.1813 17.2726 17.3673 17.2726 16.3631C17.2726 15.3589 16.4586 14.5449 15.4545 14.5449C14.4503 14.5449 13.6363 15.3589 13.6363 16.3631C13.6363 17.3673 14.4503 18.1813 15.4545 18.1813Z" /><path {...sw} d="M6.3639 18.1813C7.36806 18.1813 8.18208 17.3673 8.18208 16.3631C8.18208 15.3589 7.36806 14.5449 6.3639 14.5449C5.35975 14.5449 4.54572 15.3589 4.54572 16.3631C4.54572 17.3673 5.35975 18.1813 6.3639 18.1813Z" /></>) },
  { slug: 'completed-transports', label: 'Completed Transports', icon: I(<><path {...sw} d="M19.8194 9.09081C20.2345 11.1284 19.9386 13.2466 18.981 15.0924C18.0234 16.9382 16.462 18.3999 14.5571 19.2338C12.6522 20.0677 10.519 20.2233 8.51327 19.6748C6.50752 19.1262 4.75044 17.9066 3.53506 16.2194C2.31969 14.5321 1.71947 12.4792 1.83451 10.403C1.94955 8.32675 2.77289 6.35271 4.16722 4.81006C5.56156 3.2674 7.44261 2.24938 9.49669 1.92577C11.5508 1.60215 13.6537 1.9925 15.4548 3.03172" /><path {...sw} d="M8.18173 10.0004L10.909 12.7276L19.9999 3.63672" /></>) },
  { slug: 'profile', label: 'Profile', icon: I(<><path {...sw} d="M17.273 19.0913V17.2731C17.273 16.3087 16.8899 15.3837 16.2079 14.7018C15.526 14.0198 14.6011 13.6367 13.6366 13.6367H8.18208C7.21766 13.6367 6.29274 14.0198 5.61079 14.7018C4.92884 15.3837 4.54572 16.3087 4.54572 17.2731V19.0913" /><path {...sw} d="M10.9094 10.0004C12.9177 10.0004 14.5457 8.3723 14.5457 6.36399C14.5457 4.35568 12.9177 2.72763 10.9094 2.72763C8.90105 2.72763 7.27299 4.35568 7.27299 6.36399C7.27299 8.3723 8.90105 10.0004 10.9094 10.0004Z" /></>) },
];

function Sidebar() {
  const { logout } = useAuth();
  const { hospitalName } = useAmbulance();
  const navigate = useNavigate();
  const { ask, dialog } = useConfirm();

  async function handleLogout() {
    if (!(await ask('Are you sure you want to logout?', { title: 'Log out', confirmLabel: 'Logout', danger: true }))) return;
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="sidebar">
      <div className="logo-container" style={{ padding: 24, paddingBottom: 12, display: 'flex', flexDirection: 'column' }}>
        <div style={{ transform: 'scale(0.65)', transformOrigin: 'left top', marginBottom: -10, height: 35 }}>
          <NexCareLogo />
        </div>
        <p className="subtitle" style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginTop: 10, marginLeft: 2 }}>Ambulance Portal</p>
        <div id="logoHospitalName" style={{ marginTop: 8, fontSize: 13, color: '#374151', fontWeight: 600, paddingLeft: 2, lineHeight: 1.3 }}>{hospitalName}</div>
      </div>
      <nav className="nav" aria-label="Main">
        <ul className="nav-list">
          {SECTIONS.map((s) => (
            <li key={s.slug} className="nav-item">
              <NavLink to={`/ambulance/${s.slug}`} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} data-page={s.slug}>
                {s.icon}
                <span>{s.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        <button type="button" className="logout-btn" onClick={handleLogout}>
          <svg className="logout-icon" fill="none" viewBox="0 0 23.5688 23.5688" aria-hidden="true">
            <path strokeWidth="1.96407" strokeLinecap="round" strokeLinejoin="round" d="M8.83831 20.6226H4.91018C4.38927 20.6226 3.8897 20.4156 3.52137 20.0473C3.15304 19.679 2.94611 19.1794 2.94611 18.6585V4.91002C2.94611 4.38912 3.15304 3.88955 3.52137 3.52122C3.8897 3.15288 4.38927 2.94596 4.91018 2.94596H8.83831" />
            <path strokeWidth="1.96407" strokeLinecap="round" strokeLinejoin="round" d="M15.7127 16.6946L20.6229 11.7844L15.7127 6.87428" />
            <path strokeWidth="1.96407" strokeLinecap="round" strokeLinejoin="round" d="M20.6227 11.7843H8.83831" />
          </svg>
          <span>Logout</span>
        </button>
      </nav>
      {dialog}
    </aside>
  );
}

/** ArrowUp / ArrowDown moved between the nav links when focus was not in a field. */
function useArrowNavigation() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const current = useRef(pathname);
  current.current = pathname;
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const t = e.target;
      const tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
      const slug = current.current.split('/').filter(Boolean)[1];
      const i = SECTIONS.findIndex((s) => s.slug === slug);
      if (i === -1) return;
      e.preventDefault();
      const next = SECTIONS[(i + (e.key === 'ArrowDown' ? 1 : SECTIONS.length - 1)) % SECTIONS.length];
      navigate(`/ambulance/${next.slug}`);
      document.querySelector(`.nav-link[data-page="${next.slug}"]`)?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate]);
}

function Shell() {
  useArrowNavigation();
  return (
    <div className="portal-shell ambulance-portal">
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function AmbulancePortal() {
  useStylesheet(ambulanceCss);
  return (
    <AmbulanceProvider>
      <Shell />
    </AmbulanceProvider>
  );
}
