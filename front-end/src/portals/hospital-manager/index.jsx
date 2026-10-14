import { Navigate, Route, Routes } from 'react-router-dom';
import HospitalManagerPortal from './HospitalManagerPortal';
import OverviewPage from './OverviewPage';
import LeavesPage from './LeavesPage';
import SchedulesPage from './SchedulesPage';
import StaffPage from './StaffPage';
import SetupPage from './SetupPage';
import InventoryApprovalsPage from './InventoryApprovalsPage';
import AmbulancePage from './AmbulancePage';
import SubscriptionPage from './SubscriptionPage';
import RevenuePage from './RevenuePage';
import SupervisionPage from './SupervisionPage';
import SupportPage from './SupportPage';
import FeedbackPage from './FeedbackPage';

/**
 * One route per #section of hospital_manager/dashboard.html (the switchTab()
 * names, so `dashboard.html#leaves` → /hospital-manager/leaves through
 * api/links.js). Mounted under /hospital-manager by App.jsx.
 */
export const hospitalManagerRoutes = (
  <Route element={<HospitalManagerPortal />}>
    <Route index element={<Navigate to="overview" replace />} />
    <Route path="overview" element={<OverviewPage />} />
    <Route path="leaves" element={<LeavesPage />} />
    <Route path="schedules" element={<SchedulesPage />} />
    <Route path="staff" element={<StaffPage />} />
    <Route path="setup" element={<SetupPage />} />
    <Route path="inventory-approvals" element={<InventoryApprovalsPage />} />
    <Route path="ambulance" element={<AmbulancePage />} />
    <Route path="subscription" element={<SubscriptionPage />} />
    <Route path="revenue" element={<RevenuePage />} />
    <Route path="supervision" element={<SupervisionPage />} />
    <Route path="support" element={<SupportPage />} />
    <Route path="feedback" element={<FeedbackPage />} />
  </Route>
);

/**
 * The portal's whole route table as one component, so App.jsx can pull it in
 * with React.lazy — this module and everything it imports are the portal's own
 * chunk (plan.md Phase 8, "React.lazy per portal layout route").
 */
export default function HospitalManagerRoutes() {
  return (
    <Routes>
      {hospitalManagerRoutes}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
