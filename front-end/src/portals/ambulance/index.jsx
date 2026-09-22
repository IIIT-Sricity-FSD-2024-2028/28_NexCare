import { Navigate, Route, Routes } from 'react-router-dom';
import AmbulancePortal from './AmbulancePortal';
import DashboardPage from './DashboardPage';
import RequestsPage from './RequestsPage';
import AssignedDispatchPage from './AssignedDispatchPage';
import ActiveTransportPage from './ActiveTransportPage';
import CompletedTransportsPage from './CompletedTransportsPage';
import ProfilePage from './ProfilePage';

/**
 * One route per `.page` block of ambulance/index.html (the `data-page` /
 * hash names, so `ambulance/index.html#active-transport` →
 * /ambulance/active-transport through api/links.js). Mounted under
 * /ambulance by App.jsx.
 */
export const ambulanceRoutes = (
  <Route element={<AmbulancePortal />}>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<DashboardPage />} />
    <Route path="ambulance-requests" element={<RequestsPage />} />
    <Route path="assigned-dispatch" element={<AssignedDispatchPage />} />
    <Route path="active-transport" element={<ActiveTransportPage />} />
    <Route path="completed-transports" element={<CompletedTransportsPage />} />
    <Route path="profile" element={<ProfilePage />} />
  </Route>
);

/**
 * The portal's whole route table as one component, so App.jsx can pull it in
 * with React.lazy — this module and everything it imports are the portal's own
 * chunk (plan.md Phase 8, "React.lazy per portal layout route").
 */
export default function AmbulanceRoutes() {
  return (
    <Routes>
      {ambulanceRoutes}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
