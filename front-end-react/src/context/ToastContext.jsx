// notify(message, type, duration) — the toast every HTML page called as a
// global (portal.js notify() / NexCareUI.showToast()). Types: success, error,
// warning, info. Also accepts the object form showToast({ message, type, duration }).
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

const ICONS = {
  success: <polyline points="20 6 9 17 4 12" />,
  error: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
  warning: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const notify = useCallback((messageOrOptions, type = 'info', duration = 3500) => {
    const opts = typeof messageOrOptions === 'object' && messageOrOptions !== null
      ? messageOrOptions
      : { message: messageOrOptions, type, duration };
    const id = ++counter.current;
    const toast = { id, message: String(opts.message ?? ''), type: ICONS[opts.type] ? opts.type : 'info', show: false };
    setToasts((t) => [...t, toast]);
    // Animate in on the next tick, out just before removal — same timings as ui-components.js.
    setTimeout(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, show: true } : x))), 10);
    const ttl = opts.duration ?? 3500;
    setTimeout(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, show: false } : x))), ttl);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl + 300);
  }, []);

  const value = useMemo(() => ({ notify, showToast: notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="nexcare-toast-stack">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`nexcare-toast nexcare-toast-${t.type}${t.show ? ' nexcare-toast-show' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{ICONS[t.type]}</svg>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
