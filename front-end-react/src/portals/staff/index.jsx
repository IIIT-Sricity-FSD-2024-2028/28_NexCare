import { Navigate, Route, Routes } from 'react-router-dom';
import StaffPortal from './StaffPortal';
import DashboardPage from './DashboardPage';
import PatientCheckinPage from './PatientCheckinPage';
import PatientDirectoryPage from './PatientDirectoryPage';
import ManageAppointmentsPage from './ManageAppointmentsPage';
import BedAllocationPage from './BedAllocationPage';
import GenerateBillPage from './GenerateBillPage';
import InventoryPage from './InventoryPage';
import StaffSchedulingPage from './StaffSchedulingPage';
import LeaveRequestsPage from './LeaveRequestsPage';
import FeedbackPage from './FeedbackPage';

/**
 * One route per HTML page in front-end/administrative_staff/. Mounted under
 * /staff by App.jsx. `system-logs` keeps its HTML behaviour: system-logs.html
 * was a redirect to the dashboard ("System logs are not available on the
 * administrative staff portal"), so the route redirects too.
 */
export const staffRoutes = (
  <Route element={<StaffPortal />}>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<DashboardPage />} />
    <Route path="patient-checkin" element={<PatientCheckinPage />} />
    <Route path="patient-directory" element={<PatientDirectoryPage />} />
    <Route path="manage-appointments" element={<ManageAppointmentsPage />} />
    <Route path="bed-allocation" element={<BedAllocationPage />} />
    <Route path="generate-bill" element={<GenerateBillPage />} />
    <Route path="inventory" element={<InventoryPage />} />
    <Route path="staff-scheduling" element={<StaffSchedulingPage />} />
    <Route path="leave-requests" element={<LeaveRequestsPage />} />
    <Route path="feedback" element={<FeedbackPage />} />
    <Route path="system-logs" element={<Navigate to="../dashboard" replace />} />
  </Route>
);

/**
 * The portal's whole route table as one component, so App.jsx can pull it in
 * with React.lazy — this module and everything it imports are the portal's own
 * chunk (plan.md Phase 8, "React.lazy per portal layout route").
 */
export default function StaffRoutes() {
  return (
    <Routes>
      {staffRoutes}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
