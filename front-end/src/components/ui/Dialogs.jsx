// The "premium" success / error modals and the loading overlay from
// front-end/shared/ui-components.js (window.NexCareUI), as a context:
//
//   const { showSuccess, showError, showLoading } = useDialogs();
//   showSuccess({ title, message, details, onClose })
//   showError({ title, message, details, onClose, onRetry })
//   const hide = showLoading('Saving…'); … hide();
//
// `details` was an HTML string in the original; here it may be a string or a
// React node. The CSS (.nexcare-modal-*) is in styles/app.css.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const DialogContext = createContext(null);

function ResultDialog({ dialog, onDismiss }) {
  const [closing, setClosing] = useState(false);
  const isError = dialog.kind === 'error';

  // Lock body scroll while open, as the original did.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  function close(then) {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      onDismiss();
      if (then) then();
    }, 300);
  }

  return (
    <div
      className="nexcare-modal-overlay"
      style={closing ? { opacity: 0 } : undefined}
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(dialog.onClose); }}
    >
      <div className={`nexcare-modal-container${isError ? ' nexcare-error-modal' : ''}`} style={closing ? { transform: 'scale(0.9)' } : undefined} role="alertdialog" aria-modal="true">
        <div className={`modal-icon-container${isError ? ' error' : ''}`}>
          {isError ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          )}
        </div>
        <h2 className="nexcare-modal-title">{dialog.title}</h2>
        <p className="nexcare-modal-message">{dialog.message}</p>
        {dialog.details != null && dialog.details !== '' && (
          typeof dialog.details === 'string'
            ? <div className="modal-details-box" dangerouslySetInnerHTML={{ __html: dialog.details }} />
            : <div className="modal-details-box">{dialog.details}</div>
        )}
        <div className="modal-button-container">
          {isError && dialog.onRetry && (
            <button type="button" className="btn-modal-retry" onClick={() => close(dialog.onRetry)}>Try Again</button>
          )}
          <button type="button" className="btn-modal-close" onClick={() => close(dialog.onClose)}>
            {isError ? (dialog.onRetry ? 'Cancel' : 'OK') : 'Awesome, thanks!'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [loading, setLoading] = useState(null); // { message } | null

  const showSuccess = useCallback((opts) => setDialog({ kind: 'success', ...opts }), []);
  const showError = useCallback((opts) => setDialog({ kind: 'error', ...opts }), []);
  const showLoading = useCallback((message = 'Loading...') => {
    setLoading({ message });
    return () => setLoading(null);
  }, []);

  const value = useMemo(() => ({ showSuccess, showError, showLoading }), [showSuccess, showError, showLoading]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      {dialog && <ResultDialog key={dialog.title + dialog.message} dialog={dialog} onDismiss={() => setDialog(null)} />}
      {loading && (
        <div className="nexcare-loading-overlay" role="status" aria-live="polite">
          <div className="nexcare-loading-spinner" />
          <div className="nexcare-loading-message">{loading.message}</div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialogs() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialogs must be used inside <DialogProvider>');
  return ctx;
}
