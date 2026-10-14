import { Outlet } from 'react-router-dom';
import useStylesheet from '../../hooks/useStylesheet';
import patientCss from '../../styles/patient.css?url';
import { PatientProvider } from './PatientContext';
import PatientSidebar from './PatientSidebar';

// The patient portal shell: patient/styles.css (a verbatim copy, route-mounted
// because of its body/table/input element rules), the patient sidebar, and the
// shared patient record + membership for every page beneath.
// `children` lets a route outside the guarded portal (the public hospital
// search) reuse the shell for a signed-in patient.
export default function PatientPortal({ children }) {
  useStylesheet(patientCss);
  return (
    <PatientProvider>
      <PatientSidebar />
      {/* each page renders its own <main class="main-content …"> — the class differs per page */}
      {children ?? <Outlet />}
    </PatientProvider>
  );
}
