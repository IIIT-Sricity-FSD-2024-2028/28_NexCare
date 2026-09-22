import { Navigate, Route, Routes } from 'react-router-dom';
import DoctorPortal from './DoctorPortal';
import DashboardPage from './DashboardPage';
import AppointmentsPage from './AppointmentsPage';
import EarningsPage from './EarningsPage';
import LeavesPage from './LeavesPage';
import ProfilePage from './ProfilePage';

/** One route per HTML page in front-end/doctor/. Mounted under /doctor by App.jsx. */
export const doctorRoutes = (
  <Route element={<DoctorPortal />}>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<DashboardPage />} />
    <Route path="appointments" element={<AppointmentsPage />} />
    <Route path="earnings" element={<EarningsPage />} />
    <Route path="leaves" element={<LeavesPage />} />
    <Route path="profile" element={<ProfilePage />} />
  </Route>
);

/**
 * The portal's whole route table as one component, so App.jsx can pull it in
 * with React.lazy — this module and everything it imports are the portal's own
 * chunk (plan.md Phase 8, "React.lazy per portal layout route").
 */
export default function DoctorRoutes() {
  return (
    <Routes>
      {doctorRoutes}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
