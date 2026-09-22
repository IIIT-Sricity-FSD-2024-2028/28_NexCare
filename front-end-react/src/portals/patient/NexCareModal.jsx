import { useEffect, useState } from 'react';

// The glassmorphic popup from patient/ambulance.js (showNexCareModal): a tick,
// a cross or a question mark, then either "Great, Thanks!" or No/Yes.
// The .nexcare-modal-* classes come from patient/styles.css.
export default function NexCareModal({ open, title, message, details, isError, isConfirm, onConfirm, onClose }) {
  const [closing, setClosing] = useState(false);

  useEffect(() => { if (open) setClosing(false); }, [open]);

  if (!open) return null;

  function close(then) {
    if (closing) return;
    setClosing(true);
    setTimeout(() => { onClose(); if (then) then(); }, 200);
  }

  return (
    <div
      className="nexcare-modal-overlay"
      style={closing ? { opacity: 0 } : undefined}
      onMouseDown={(e) => { if (e.target === e.currentTarget && !isConfirm) close(); }}
    >
      <div className="nexcare-modal-container" style={closing ? { transform: 'scale(0.9)' } : undefined} role="alertdialog" aria-modal="true">
        <div className={`modal-icon-container${isError ? ' error' : ''}`}>{isError ? '✕' : isConfirm ? '❓' : '✓'}</div>
        <h2 className="nexcare-modal-title">{title}</h2>
        <p className="nexcare-modal-message">{message}</p>
        {details != null && details !== '' && <div className="modal-details-box">{details}</div>}
        <div style={{ display: 'flex', gap: 12 }}>
          {isConfirm ? (
            <>
              <button type="button" className="btn-modal-close" style={{ background: '#E2E8F0', color: '#475569' }} onClick={() => close()}>No, Back</button>
              <button type="button" className="btn-modal-close" autoFocus onClick={() => close(onConfirm)}>Yes, Proceed</button>
            </>
          ) : (
            <button type="button" className="btn-modal-close" autoFocus onClick={() => close()}>Great, Thanks!</button>
          )}
        </div>
      </div>
    </div>
  );
}
