import { Navigate, Route, Routes } from 'react-router-dom';
import PortalLayout from '../../components/layout/PortalLayout';
import DashboardPage from './DashboardPage';
import HierarchyPage from './HierarchyPage';
import HospitalRegistrationsPage from './HospitalRegistrationsPage';
import PatientDirectoryPage from './PatientDirectoryPage';
import ManageUsersPage from './ManageUsersPage';
import SystemSettingsPage from './SystemSettingsPage';
import FeedbackPage from './FeedbackPage';
import RevenuePage from './RevenuePage';
import ReportsPage from './ReportsPage';
import '../../styles/superuser.css';

/**
 * One route per HTML page in front-end/superuser/. Mounted under /superuser
 * by App.jsx. As with the regional officer portal, the shell is the shared
 * PortalLayout: every superuser page used nav.js's injected sidebar. The
 * pages' inline <style> blocks are bundled as styles/superuser.css.
 */
export const superuserRoutes = (
  <Route element={<PortalLayout className="su-portal" />}>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<DashboardPage />} />
    <Route path="hierarchy" element={<HierarchyPage />} />
    <Route path="hospital-registrations" element={<HospitalRegistrationsPage />} />
    <Route path="patient-directory" element={<PatientDirectoryPage />} />
    <Route path="manage-users" element={<ManageUsersPage />} />
    <Route path="system-settings" element={<SystemSettingsPage />} />
    <Route path="feedback" element={<FeedbackPage />} />
    <Route path="revenue" element={<RevenuePage />} />
    <Route path="reports" element={<ReportsPage />} />
  </Route>
);

/**
 * The portal's whole route table as one component, so App.jsx can pull it in
 * with React.lazy — this module and everything it imports are the portal's own
 * chunk (plan.md Phase 8, "React.lazy per portal layout route").
 */
export default function SuperuserRoutes() {
  return (
    <Routes>
      {superuserRoutes}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
