import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

/**
 * Sidebar + the routed page. Each page renders its own <Header title /> so the
 * title is per-route (the header also carries the back button). Portals with their own chrome (patient, staff, ambulance,
 * hospital manager) wrap this with their stylesheet via `className`.
 */
export default function PortalLayout({ className }) {
  return (
    <div className={className}>
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
