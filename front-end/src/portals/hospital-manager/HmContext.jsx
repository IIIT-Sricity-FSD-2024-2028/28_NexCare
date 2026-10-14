import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Ambulance, Hospitals, Inventory, Leaves } from '../../api';
import { useAuth } from '../../context/AuthContext';

// The module-level state hospital_manager/dashboard.js shared between its
// sections (managerProfile, subscriptionData, the nav badge counts) and the
// two modals the header opens from any section. Sections load their own
// lists; what lives here is only what more than one of them reads.
const HmContext = createContext(null);

const isPendingLeave = (l) => (l.status || '').toLowerCase() === 'pending';
const isPendingReq = (r) => ['PENDING', 'PENDING_APPROVAL'].includes((r.status || '').toUpperCase());
const isOnDuty = (a) => ['dispatched', 'en route', 'pending'].includes((a.status || '').toLowerCase());

export function HmProvider({ children }) {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId || '';
  const [hospitalName, setHospitalName] = useState(user?.hospitalName || '');
  const [subscription, setSubscription] = useState(null);
  const [counts, setCounts] = useState({ pendingLeaves: 0, pendingReqs: 0, onDutyAmbulances: 0 });
  const [staffModal, setStaffModal] = useState(false);
  const [renewalModal, setRenewalModal] = useState(false);
  // The credentials card shown after a registration (from the modal or the Setup page form).
  const [registered, setRegistered] = useState(null);
  // Bumped after any write so a section that is mounted can reload its list.
  const [version, setVersion] = useState(0);

  // initManagerInfo(): the name came from the stored login user; a manager
  // whose account has no hospitalName gets it from GET /hospitals/:id.
  useEffect(() => {
    let cancelled = false;
    if (user?.hospitalName) { setHospitalName(user.hospitalName); return undefined; }
    if (!hospitalId) return undefined;
    Hospitals.getById(hospitalId)
      .then((res) => { if (!cancelled) setHospitalName(res.data?.name || ''); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [hospitalId, user?.hospitalName]);

  const reloadSubscription = useCallback(async () => {
    if (!hospitalId) return null;
    try {
      const res = await Hospitals.getSubscription(hospitalId);
      setSubscription(res.data || null);
      return res.data || null;
    } catch (err) {
      console.error('Error loading subscription:', err);
      return null;
    }
  }, [hospitalId]);

  // loadOverview() + updateAmbulanceKpis(): the three sidebar counters.
  const reloadCounts = useCallback(async () => {
    if (!hospitalId) return;
    const [leaves, reqs, fleet] = await Promise.all([
      Leaves.getAll({ hospitalId }).then((r) => (Array.isArray(r.data) ? r.data : [])).catch(() => []),
      Inventory.getRequirements({ hospitalId }).then((r) => (Array.isArray(r.data) ? r.data : [])).catch(() => []),
      Ambulance.getAll().then((r) => (Array.isArray(r.data) ? r.data : [])).catch(() => []),
    ]);
    setCounts({
      pendingLeaves: leaves.filter(isPendingLeave).length,
      pendingReqs: reqs.filter(isPendingReq).length,
      onDutyAmbulances: fleet.filter(isOnDuty).length,
    });
  }, [hospitalId]);

  useEffect(() => { reloadSubscription(); reloadCounts(); }, [reloadSubscription, reloadCounts]);

  /** Call after any approval / registration / dispatch so the counters and the mounted section refresh. */
  const refresh = useCallback(() => {
    setVersion((v) => v + 1);
    reloadCounts();
  }, [reloadCounts]);

  const value = useMemo(() => ({
    hospitalId,
    hospitalName,
    regionId: user?.regionId || '',
    regionName: user?.regionName || '',
    manager: user,
    subscription,
    reloadSubscription,
    counts,
    reloadCounts,
    refresh,
    version,
    staffModal,
    openStaffModal: () => setStaffModal(true),
    closeStaffModal: () => setStaffModal(false),
    renewalModal,
    openRenewalModal: () => setRenewalModal(true),
    closeRenewalModal: () => setRenewalModal(false),
    registered,
    setRegistered,
  }), [hospitalId, hospitalName, user, subscription, reloadSubscription, counts, reloadCounts, refresh, version, staffModal, renewalModal, registered]);

  return <HmContext.Provider value={value}>{children}</HmContext.Provider>;
}

export function useHm() {
  const ctx = useContext(HmContext);
  if (!ctx) throw new Error('useHm must be used inside <HmProvider>');
  return ctx;
}

export { isPendingLeave, isPendingReq, isOnDuty };
