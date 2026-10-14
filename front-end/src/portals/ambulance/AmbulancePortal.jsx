import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import useStylesheet from '../../hooks/useStylesheet';
import ambulanceCss from '../../styles/ambulance.css?url';
import { AmbulanceProvider } from './AmbulanceContext';

export const SECTIONS = [
  { slug: 'dashboard', label: 'Dashboard' },
  { slug: 'ambulance-requests', label: 'Incoming Requests' },
  { slug: 'assigned-dispatch', label: 'Assigned Dispatch' },
  { slug: 'active-transport', label: 'Active Transport' },
  { slug: 'completed-transports', label: 'Completed Transports' },
  { slug: 'profile', label: 'Profile' },
];

/** ArrowUp / ArrowDown moves between the nav links when focus is not in a field. */
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
      document.querySelector(`.nav-item[href*="${next.slug}"]`)?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate]);
}

function Shell() {
  useArrowNavigation();
  return (
    <div className="portal-layout ambulance-portal">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
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
