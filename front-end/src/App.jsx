import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import RequireAuth from './components/RequireAuth';
import LandingPage from './portals/public/LandingPage';
import HospitalRegistrationPage from './portals/public/HospitalRegistrationPage';
import LoginPage from './portals/auth/LoginPage';
import PatientRegisterPage from './portals/auth/PatientRegisterPage';
import StaffRegisterPage from './portals/auth/StaffRegisterPage';
import ForgotPasswordPage from './portals/auth/ForgotPasswordPage';
import ChangePasswordPage from './portals/auth/ChangePasswordPage';
import { ROLES } from './utils/roles';

// The full route tree from plan.md §2. Every portal is a layout route behind
// RequireAuth with its own sidebar; role → home redirects and cross-portal
// links all resolve here.
//
// The seven portals are React.lazy (plan.md Phase 8): each one's route table,
// pages and stylesheets are a chunk of their own, fetched the first time a
// visitor enters that portal. The public site and the auth pages stay in the
// entry chunk — they are what an anonymous visitor loads first, and putting
// them behind a second request would only add a waterfall.
const DoctorRoutes = lazy(() => import('./portals/doctor'));
const PatientRoutes = lazy(() => import('./portals/patient'));
const StaffRoutes = lazy(() => import('./portals/staff'));
const HospitalManagerRoutes = lazy(() => import('./portals/hospital-manager'));
const AmbulanceRoutes = lazy(() => import('./portals/ambulance'));
const RegionalOfficerRoutes = lazy(() => import('./portals/regional-officer'));
const SuperuserRoutes = lazy(() => import('./portals/superuser'));
const HospitalSearchPage = lazy(() => import('./portals/patient/HospitalSearchPage'));

/** Shown while a portal chunk is in flight (a blank frame on a fast network). */
function ChunkLoading() {
  return <div className="chunk-loading" aria-busy="true" aria-live="polite">Loading…</div>;
}

/** Mount a portal at its base path behind the role guard. */
function portal(base, roles, Element) {
  return (
    <Route
      path={`${base}/*`}
      element={
        <RequireAuth roles={roles}>
          <Suspense fallback={<ChunkLoading />}><Element /></Suspense>
        </RequireAuth>
      }
    />
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public site + auth (plan.md Phase 1) */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/hospital-registration" element={<HospitalRegistrationPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/:role" element={<LoginPage />} />
      <Route path="/register/patient" element={<PatientRegisterPage variant="patient" />} />
      <Route path="/signup" element={<PatientRegisterPage variant="signup" />} />
      <Route path="/register/staff" element={<StaffRegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/change-password" element={<RequireAuth><ChangePasswordPage /></RequireAuth>} />

      {/* patient/hospital-search.html had no auth guard — anyone could search,
          and only booking asked for a login. Mounted before the guarded portal
          so that stays true. */}
      <Route
        path="/patient/hospital-search"
        element={<Suspense fallback={<ChunkLoading />}><HospitalSearchPage /></Suspense>}
      />

      {portal('/doctor', [ROLES.DOCTOR], DoctorRoutes)}
      {portal('/patient', [ROLES.PATIENT], PatientRoutes)}
      {portal('/staff', [ROLES.STAFF], StaffRoutes)}
      {portal('/hospital-manager', [ROLES.HOSPITAL_MANAGER], HospitalManagerRoutes)}
      {portal('/ambulance', [ROLES.AMBULANCE], AmbulanceRoutes)}
      {portal('/regional-officer', [ROLES.REGIONAL_MANAGER], RegionalOfficerRoutes)}
      {portal('/superuser', [ROLES.SUPERUSER], SuperuserRoutes)}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
