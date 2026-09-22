// The #systemModal popup from patient/dashboard.html (showSystemModal):
// a gradient header, a message body and either OK or Cancel/Confirm.
// `message` may be a string (newlines become line breaks) or a React node.
export default function SystemModal({ open, title = 'Information', message, onConfirm, confirmLabel = 'Confirm', onClose }) {
  if (!open) return null;
  const body = typeof message === 'string'
    ? message.split(/\\n|\n/).map((line, i, arr) => (i < arr.length - 1 ? <span key={i}>{line}<br /></span> : <span key={i}>{line}</span>))
    : message;

  return (
    <div id="systemModal" className="modal" style={{ display: 'flex' }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: 450, textAlign: 'left', padding: 0, overflow: 'hidden', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, #155DFC 0%, #1C398E 100%)', padding: '18px 24px', borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '16px 16px 0 0', marginBottom: 0 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'white' }}>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close" style={{ color: 'white', opacity: 0.8, fontSize: 28, lineHeight: 1, marginTop: -4 }}>&times;</button>
        </div>
        <div className="modal-body" style={{ padding: 24, fontSize: 15, color: '#4A5565', lineHeight: 1.6, background: '#FFFFFF' }}>{body}</div>
        <div className="modal-actions" style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: 12, background: '#F9FAFB', borderRadius: '0 0 16px 16px' }}>
          {onConfirm ? (
            <>
              <button type="button" className="btn-outline-sm" onClick={onClose}>Cancel</button>
              <button type="button" className="btn-primary-sm" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button>
            </>
          ) : (
            <button type="button" className="btn-primary-sm" onClick={onClose}>OK</button>
          )}
        </div>
      </div>
    </div>
  );
}
