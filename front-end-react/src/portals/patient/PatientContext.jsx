import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Patients, Revenue } from '../../api';
import { useAuth } from '../../context/AuthContext';

// What every patient page needed from NexCareStore.getActivePatient() and
// Revenue.getMyMembership(): the patient record (GET /patients/:id, the id
// from the login payload) and the Care+ membership, fetched once per portal
// mount and shared. `refreshPatient()` re-reads after the profile is saved.
const PatientContext = createContext(null);

/** Whether a membership is a paid plan rather than pay-as-you-go. */
export function isPaidMembership(m) {
  return Boolean(m && m.monthlyFee > 0 && m.planId !== 'CARE-PAYG');
}

export function PatientProvider({ children }) {
  const { user, updateUser } = useAuth();
  const patientId = user?.patientId || user?.id || '';
  const [patient, setPatient] = useState(null);
  const [membership, setMembership] = useState(null);

  const refreshPatient = useCallback(async () => {
    if (!patientId) return null;
    try {
      const res = await Patients.getById(patientId);
      setPatient(res.data || null);
      return res.data || null;
    } catch (err) {
      console.warn('Could not fetch the patient profile:', err.message);
      return null;
    }
  }, [patientId]);

  const refreshMembership = useCallback(async () => {
    try {
      const res = await Revenue.getMyMembership();
      setMembership(res.data || null);
      return res.data || null;
    } catch (err) {
      console.warn('Could not load membership:', err.message);
      return null;
    }
  }, []);

  useEffect(() => { refreshPatient(); refreshMembership(); }, [refreshPatient, refreshMembership]);

  // The session's user, overlaid with the fresher patient record (dashboard.js activePatientContext).
  const profile = useMemo(() => ({ ...(user || {}), ...(patient || {}) }), [user, patient]);
  const displayName = patient?.fullName || patient?.name || user?.name || String(user?.email || '').split('@')[0] || 'Patient';
  const displayId = patient?.patientId || patient?.patientIdDisplay || patient?.id || patientId;

  const value = useMemo(
    () => ({ patientId, patient, profile, displayName, displayId, membership, refreshPatient, refreshMembership, updateUser }),
    [patientId, patient, profile, displayName, displayId, membership, refreshPatient, refreshMembership, updateUser],
  );
  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}

export function usePatient() {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error('usePatient must be used inside <PatientProvider>');
  return ctx;
}
