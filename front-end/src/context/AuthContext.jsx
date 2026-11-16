import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  loginUser,
  logoutUser,
  selectRole,
  selectUser,
  sessionCleared,
  UNAUTHORIZED_EVENT,
  userUpdated,
  wipeSession,
} from '../store/authSlice';

export function AuthProvider({ children }) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const role = useAppSelector(selectRole);

  const login = useCallback(
    (email, password, requestedRole) => dispatch(loginUser({ email, password, role: requestedRole })).unwrap(),
    [dispatch],
  );
  const logout = useCallback(() => dispatch(logoutUser()).unwrap(), [dispatch]);
  const clearSession = useCallback(() => {
    wipeSession();
    dispatch(sessionCleared());
  }, [dispatch]);
  const updateUser = useCallback((patch) => {
    if (user) {
      const next = { ...user, ...patch };
      sessionStorage.setItem('nexcare_user_data', JSON.stringify(next));
      dispatch(userUpdated(patch));
    }
  }, [dispatch, user]);

  useEffect(() => {
    const onUnauthorized = () => {
      wipeSession();
      dispatch(sessionCleared());
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [dispatch]);

  const value = useMemo(
    () => ({ user, role, login, logout, clearSession, updateUser }),
    [user, role, login, logout, clearSession, updateUser],
  );
  return <>{children}</>;
}

export function useAuth() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const role = useAppSelector(selectRole);
  const login = useCallback(
    (email, password, requestedRole) => dispatch(loginUser({ email, password, role: requestedRole })).unwrap(),
    [dispatch],
  );
  const logout = useCallback(() => dispatch(logoutUser()).unwrap(), [dispatch]);
  const clearSession = useCallback(() => {
    wipeSession();
    dispatch(sessionCleared());
  }, [dispatch]);
  const updateUser = useCallback((patch) => {
    if (!user) return;
    sessionStorage.setItem('nexcare_user_data', JSON.stringify({ ...user, ...patch }));
    dispatch(userUpdated(patch));
  }, [dispatch, user]);
  return { user, role, login, logout, clearSession, updateUser };
}
