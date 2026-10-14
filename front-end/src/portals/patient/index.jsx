import { Navigate, Route, Routes } from 'react-router-dom';
import PatientPortal from './PatientPortal';
import DashboardPage from './DashboardPage';
import AppointmentsPage from './AppointmentsPage';
import BillingPage from './BillingPage';
import AmbulancePage from './AmbulancePage';
import FeedbackPage from './FeedbackPage';
import MembershipPage from './MembershipPage';
import ProfilePage from './ProfilePage';

/**
 * One route per HTML page in front-end/patient/. Mounted under /patient by
 * App.jsx. `hospital-search` is NOT here: its page was reachable without a
 * login, so it is mounted outside the role guard (App.jsx) and brings its own
 * copy of this shell when a patient opens it.
 */
export const patientRoutes = (
  <Route element={<PatientPortal />}>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<DashboardPage />} />
    <Route path="appointments" element={<AppointmentsPage />} />
    <Route path="billing" element={<BillingPage />} />
    <Route path="ambulance" element={<AmbulancePage />} />
    <Route path="feedback" element={<FeedbackPage />} />
    <Route path="membership" element={<MembershipPage />} />
    <Route path="profile" element={<ProfilePage />} />
  </Route>
);

/**
 * The portal's whole route table as one component, so App.jsx can pull it in
 * with React.lazy — this module and everything it imports are the portal's own
 * chunk (plan.md Phase 8, "React.lazy per portal layout route").
 */
export default function PatientRoutes() {
  return (
    <Routes>
      {patientRoutes}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
