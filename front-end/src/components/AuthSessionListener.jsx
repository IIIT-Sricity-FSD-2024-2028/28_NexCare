import { useEffect } from 'react';
import { UNAUTHORIZED_EVENT } from '../api/client';
import { sessionCleared, wipeSession } from '../store/authSlice';
import { useAppDispatch } from '../store/hooks';

/** Clears the Redux session when the API client reports a 401. */
export default function AuthSessionListener() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const onUnauthorized = () => {
      wipeSession();
      dispatch(sessionCleared());
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [dispatch]);
  return null;
}
