import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Ambulance, Hospitals } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import usePolling from '../../hooks/usePolling';
import { isInTransit } from '../../features/ambulance/transportSteps';

// appState from ambulance/app.js: the hospital's request list (GET /ambulance,
// scoped to the crew's hospital by the backend), re-fetched every 5 seconds
// as the page did (FR-12), plus the two bits of local state the page kept in
// sessionStorage — the pre-departure checklist (`nexcare_checklist_v1`) and
// the profile overrides (`ambulanceProfile`) — under the same keys.
const AmbulanceContext = createContext(null);

export const CHECKLIST_ITEMS = ['Vehicle fuel checked', 'Medical equipment ready', 'Route planned', 'Communication system tested'];
const CHECKLIST_KEY = 'nexcare_checklist_v1';
const PROFILE_KEY = 'ambulanceProfile';
export const REFRESH_MS = 5000;

const readJson = (key) => { try { return JSON.parse(sessionStorage.getItem(key)) || {}; } catch { return {}; } };
const writeJson = (key, value) => { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ } };

export function AmbulanceProvider({ children }) {
  const { user } = useAuth();
  const { notify } = useToast();
  const [requests, setRequests] = useState(null); // null = first load pending
  const [failed, setFailed] = useState(false);
  const [hospitalName, setHospitalName] = useState(user?.hospitalName || '');
  const [checklist, setChecklist] = useState(() => readJson(CHECKLIST_KEY));
  const [profile, setProfile] = useState(() => readJson(PROFILE_KEY));
  const warned = useRef(false);
  // A poll in flight when the portal unmounts (logout, role bounce) rejects
  // as the page navigates away; that is not an outage.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    // A full page load (refresh, typed URL) aborts the poll the same way.
    const onHide = () => { alive.current = false; };
    window.addEventListener('pagehide', onHide);
    return () => { alive.current = false; window.removeEventListener('pagehide', onHide); };
  }, []);

  const reload = useCallback(async () => {
    try {
      const res = await Ambulance.getAll();
      if (!alive.current) return;
      setRequests(Array.isArray(res.data) ? res.data : []);
      setFailed(false);
      warned.current = false;
    } catch (err) {
      if (!alive.current) return;
      console.error('Failed to load ambulance requests from API:', err);
      setFailed(true);
      setRequests((prev) => prev || []);
      // loadAppState() alerted on every failed refresh; once per outage is enough.
      if (!warned.current) {
        warned.current = true;
        notify('Failed to load ambulance requests. Please check your connection.', 'error');
      }
    }
  }, [notify]);

  usePolling(reload, REFRESH_MS);

  // The hospital name under the logo: GET /hospitals/:id, as the page did from the JWT.
  useEffect(() => {
    let cancelled = false;
    if (user?.hospitalName) { setHospitalName(user.hospitalName); return undefined; }
    if (!user?.hospitalId) return undefined;
    Hospitals.getById(user.hospitalId)
      .then((res) => { if (!cancelled) setHospitalName(res.data?.name || ''); })
      .catch((err) => console.error('Failed to fetch hospital name:', err));
    return () => { cancelled = true; };
  }, [user?.hospitalId, user?.hospitalName]);

  const toggleChecklist = useCallback((index) => {
    setChecklist((prev) => {
      const next = { ...prev, [`checklist-${index}`]: !prev[`checklist-${index}`] };
      writeJson(CHECKLIST_KEY, next);
      return next;
    });
  }, []);
  const checklistComplete = CHECKLIST_ITEMS.every((_, i) => checklist[`checklist-${i}`]);

  const saveProfile = useCallback((patch) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
      writeJson(PROFILE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    user,
    hospitalName,
    requests: requests || [],
    loaded: requests !== null,
    failed,
    reload,
    activeTransport: (requests || []).find(isInTransit) || null,
    checklist,
    checklistComplete,
    toggleChecklist,
    profile,
    saveProfile,
  }), [user, hospitalName, requests, failed, reload, checklist, checklistComplete, toggleChecklist, profile, saveProfile]);

  return <AmbulanceContext.Provider value={value}>{children}</AmbulanceContext.Provider>;
}

export function useAmbulance() {
  const ctx = useContext(AmbulanceContext);
  if (!ctx) throw new Error('useAmbulance must be used inside <AmbulanceProvider>');
  return ctx;
}
