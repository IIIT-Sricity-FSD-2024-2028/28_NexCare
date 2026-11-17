import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useAuth } from '../../context/AuthContext';
import {
  closeRenewalModal,
  closeStaffModal,
  fetchHmOverview,
  fetchSubscription,
  isOnDuty,
  isPendingLeave,
  isPendingReq,
  openRenewalModal,
  openStaffModal,
  setRegistered,
} from '../../store/hospitalManagerSlice';

// Phase 1 shim: the shared HM state now lives in store/hospitalManagerSlice.
// This file keeps the useHm() contract the 17 sections were written against
// while they are migrated; it is deleted in Phase 2.
export { isPendingLeave, isPendingReq, isOnDuty };

const HmContext = createContext(null);

export function HmProvider({ children }) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const hospitalId = user?.hospitalId || '';
  const hospital = useAppSelector((s) => s.hospitalManager.hospital);
  const counts = useAppSelector((s) => s.hospitalManager.counts);
  const ui = useAppSelector((s) => s.hospitalManager.ui);
  const subscription = useAppSelector((s) => s.hospitalManager.subscription.plan);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!hospitalId) return;
    dispatch(fetchHmOverview());
    dispatch(fetchSubscription());
  }, [dispatch, hospitalId]);

  const reloadSubscription = useCallback(async () => {
    if (!hospitalId) return null;
    try {
      const action = await dispatch(fetchSubscription());
      return action.payload?.plan || null;
    } catch {
      return null;
    }
  }, [dispatch, hospitalId]);

  const reloadCounts = useCallback(async () => {
    if (!hospitalId) return;
    dispatch(fetchHmOverview());
  }, [dispatch, hospitalId]);

  const refresh = useCallback(() => {
    setVersion((v) => v + 1);
    dispatch(fetchHmOverview());
  }, [dispatch]);

  const value = useMemo(() => ({
    hospitalId,
    hospitalName: hospital.name || user?.hospitalName || '',
    regionId: user?.regionId || '',
    regionName: user?.regionName || '',
    manager: user,
    subscription,
    reloadSubscription,
    counts,
    reloadCounts,
    refresh,
    version,
    staffModal: ui.staffModalOpen,
    openStaffModal: () => dispatch(openStaffModal()),
    closeStaffModal: () => dispatch(closeStaffModal()),
    renewalModal: ui.renewalModalOpen,
    openRenewalModal: () => dispatch(openRenewalModal()),
    closeRenewalModal: () => dispatch(closeRenewalModal()),
    registered: ui.registered,
    setRegistered: (creds) => dispatch(setRegistered(creds)),
  }), [hospitalId, hospital.name, user, subscription, reloadSubscription, counts, reloadCounts, refresh, version, ui, dispatch]);

  return <HmContext.Provider value={value}>{children}</HmContext.Provider>;
}

export function useHm() {
  const ctx = useContext(HmContext);
  if (!ctx) throw new Error('useHm must be used inside <HmProvider>');
  return ctx;
}