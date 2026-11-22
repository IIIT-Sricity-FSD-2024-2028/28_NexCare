import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import { useAppSelector } from '../../store/hooks';
import { selectSidebarOpen } from '../../store/uiSlice';

/**
 * Sidebar + the routed page. Each page renders its own <Header title /> so the
 * title is per-route (the header also carries the back button). Portals with their own chrome (patient, staff, ambulance,
 * hospital manager) wrap this with their stylesheet via `className`.
 */
export default function PortalLayout({ className }) {
  const sidebarOpen = useAppSelector(selectSidebarOpen);

  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', !sidebarOpen);
    return () => document.body.classList.remove('sidebar-collapsed');
  }, [sidebarOpen]);

  return (
    <div className={className}>
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
