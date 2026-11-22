import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import useStylesheet from '../../hooks/useStylesheet';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchMembership, fetchPatientProfile, selectPatientId } from '../../store/patientSlice';
import patientCss from '../../styles/patient.css?url';
import PatientSidebar from './PatientSidebar';

// The patient portal shell: patient/styles.css (a verbatim copy, route-mounted
// because of its body/table/input element rules) and the patient sidebar. On
// mount it loads the patient record and the Care+ membership into the patient
// slice, which every page beneath reads with useAppSelector.
// `children` lets a route outside the guarded portal (the public hospital
// search) reuse the shell for a signed-in patient.
export default function PatientPortal({ children }) {
  useStylesheet(patientCss);
  const dispatch = useAppDispatch();
  const patientId = useAppSelector(selectPatientId);

  useEffect(() => {
    if (patientId) dispatch(fetchPatientProfile(patientId));
    dispatch(fetchMembership());
  }, [dispatch, patientId]);

  return (
    <>
      <PatientSidebar />
      {/* each page renders its own <main class="main-content …"> — the class differs per page */}
      {children ?? <Outlet />}
    </>
  );
}
