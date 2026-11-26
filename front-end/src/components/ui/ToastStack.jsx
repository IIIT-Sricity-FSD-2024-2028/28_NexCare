import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { hideToast, removeToast, selectNotifications, showToast } from '../../store/toastSlice';

const ICONS = {
  success: <polyline points="20 6 9 17 4 12" />,
  error: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
  warning: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
};

export default function ToastStack() {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector(selectNotifications);
  const timers = useRef(new Map());

  useEffect(() => {
    toasts.forEach((toast) => {
      if (timers.current.has(toast.id)) return;
      const toastTimers = [
        setTimeout(() => dispatch(showToast(toast.id)), 10),
        setTimeout(() => dispatch(hideToast(toast.id)), toast.duration),
        setTimeout(() => dispatch(removeToast(toast.id)), toast.duration + 300),
      ];
      timers.current.set(toast.id, toastTimers);
    });
  }, [dispatch, toasts]);

  useEffect(() => {
    const scheduled = timers.current;
    return () => {
      scheduled.forEach((toastTimers) => toastTimers.forEach(clearTimeout));
      scheduled.clear();
    };
  }, []);

  useEffect(() => {
    const activeIds = new Set(toasts.map((toast) => toast.id));
    timers.current.forEach((toastTimers, id) => {
      if (activeIds.has(id)) return;
      toastTimers.forEach(clearTimeout);
      timers.current.delete(id);
    });
  }, [toasts]);

  return (
    <div className="nexcare-toast-stack">
      {toasts.map((toast) => (
        <div key={toast.id} role="status" className={`nexcare-toast nexcare-toast-${toast.type}${toast.show ? ' nexcare-toast-show' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{ICONS[toast.type]}</svg>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
