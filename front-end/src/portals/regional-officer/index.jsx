import { Navigate, Route, Routes } from 'react-router-dom';
import PortalLayout from '../../components/layout/PortalLayout';
import DashboardPage from './DashboardPage';
import HospitalApprovalsPage from './HospitalApprovalsPage';
import HospitalDetailsPage from './HospitalDetailsPage';
import HospitalComparisonPage from './HospitalComparisonPage';
import PerformanceAlertsPage from './PerformanceAlertsPage';
import ComplaintsPage from './ComplaintsPage';
import RevenuePage from './RevenuePage';
import HierarchyPage from './HierarchyPage';
import ProfilePage from './ProfilePage';

/**
 * One route per HTML page in front-end/regional-officer/. Mounted under
 * /regional-officer by App.jsx. The shell is the shared PortalLayout — these
 * pages used nav.js's injected sidebar, not an inline one — and each page
 * mounts the stylesheet its HTML loaded (see roShared.jsx).
 */
export const regionalOfficerRoutes = (
  <Route element={<PortalLayout className="ro-portal" />}>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<DashboardPage />} />
    <Route path="hospital-approvals" element={<HospitalApprovalsPage />} />
    <Route path="hospital-details" element={<HospitalDetailsPage />} />
    <Route path="hospital-comparison" element={<HospitalComparisonPage />} />
    <Route path="performance-alerts" element={<PerformanceAlertsPage />} />
    <Route path="complaints" element={<ComplaintsPage />} />
    <Route path="revenue" element={<RevenuePage />} />
    <Route path="hierarchy" element={<HierarchyPage />} />
    <Route path="profile" element={<ProfilePage />} />
  </Route>
);

/**
 * The portal's whole route table as one component, so App.jsx can pull it in
 * with React.lazy — this module and everything it imports are the portal's own
 * chunk (plan.md Phase 8, "React.lazy per portal layout route").
 */
export default function RegionalOfficerRoutes() {
  return (
    <Routes>
      {regionalOfficerRoutes}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
