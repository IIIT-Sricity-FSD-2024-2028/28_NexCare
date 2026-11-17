import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import usePolling from '../../hooks/usePolling';
import {
  CHECKLIST_ITEMS,
  CHECKLIST_KEY,
  PROFILE_KEY,
  REFRESH_MS,
  checklistToggled,
  fetchAmbulanceRequests,
  fetchHospitalName,
  profileSaved,
  selectActiveTransport,
  selectAmbulanceChecklist,
  selectAmbulanceHospitalName,
  selectAmbulanceProfile,
  selectAmbulanceRequests,
  selectChecklistComplete,
} from '../../store/ambulanceSlice';
import { isInTransit } from '../../features/ambulance/transportSteps';

// Phase 1 shim: request state, polling and the sessionStorage-backed
// checklist/profile now live in store/ambulanceSlice. This file keeps the
// useAmbulance() contract for the portal's pages; it is deleted in Phase 2.
export { CHECKLIST_ITEMS, REFRESH_MS };

const AmbulanceContext = createContext(null);

const writeJson = (key, value) => {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
};

export function AmbulanceProvider({ children }) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { notify } = useToast();
  const requests = useAppSelector(selectAmbulanceRequests);
  const hospitalName = useAppSelector(selectAmbulanceHospitalName);
  const checklist = useAppSelector(selectAmbulanceChecklist);
  const profile = useAppSelector(selectAmbulanceProfile);
  const checklistComplete = useAppSelector(selectChecklistComplete);
  const activeTransport = useAppSelector(selectActiveTransport);
  const warned = useRef(false);

  const reload = useCallback(() => {
    dispatch(fetchAmbulanceRequests());
  }, [dispatch]);

  usePolling(reload, REFRESH_MS);

  useEffect(() => {
    dispatch(fetchHospitalName());
  }, [dispatch, user?.hospitalId, user?.hospitalName]);

  useEffect(() => {
    if (requests.error && !warned.current) {
      warned.current = true;
      notify('Failed to load ambulance requests. Please check your connection.', 'error');
    }
    if (!requests.error) warned.current = false;
  }, [requests.error, notify]);

  const toggleChecklist = useCallback((index) => {
    dispatch(checklistToggled(index));
    // The slice stays serializable; persistence is a side effect of the UI.
    const key = `checklist-${index}`;
    writeJson(CHECKLIST_KEY, { ...checklist, [key]: !checklist[key] });
  }, [dispatch, checklist]);

  const saveProfile = useCallback((patch) => {
    const next = { ...profile, ...patch, updatedAt: new Date().toISOString() };
    dispatch(profileSaved(next));
    writeJson(PROFILE_KEY, next);
  }, [dispatch, profile]);

  const value = useMemo(() => ({
    user,
    hospitalName,
    requests: requests.list,
    loaded: requests.loaded,
    failed: Boolean(requests.error),
    reload,
    activeTransport,
    checklist,
    checklistComplete,
    toggleChecklist,
    profile,
    saveProfile,
  }), [user, hospitalName, requests, reload, activeTransport, checklist, checklistComplete, toggleChecklist, profile, saveProfile]);

  return <AmbulanceContext.Provider value={value}>{children}</AmbulanceContext.Provider>;
}

export function useAmbulance() {
  const ctx = useContext(AmbulanceContext);
  if (!ctx) throw new Error('useAmbulance must be used inside <AmbulanceProvider>');
  return ctx;
}

// Re-exported for pages that import the transport helpers through this file.
export { isInTransit };