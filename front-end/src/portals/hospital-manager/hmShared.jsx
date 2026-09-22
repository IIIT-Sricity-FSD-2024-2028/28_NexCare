// Small pieces every hospital-manager section shares: the dashboard.css
// modal shell, the badge/status helpers and the money/date formats that
// dashboard.js inlined into its template strings.

export const money = (v) => '₹' + (Number(v) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
export const isoDay = (v) => (v ? String(v).split('T')[0] : '--');
export const initialsOf = (name) => (name || 'HM').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'HM';

export const ROLE_LABELS = {
  doctor: 'Doctor',
  administrative_staff: 'Administrative Staff',
  ambulance: 'Ambulance Staff',
  hospital_manager: 'Hospital Manager',
};
export const roleLabel = (role) => ROLE_LABELS[role] || role;

/** <span class="badge badge-…"> */
export function Badge({ tone, children, style }) {
  return <span className={`badge badge-${tone}`} style={style}>{children}</span>;
}

/** The "Loading…" / "No rows" cell every table used. */
export function LoadingCell({ colSpan, children, tone }) {
  const cls = tone === 'success' ? 'loading-cell text-success' : tone === 'danger' ? 'loading-cell text-danger' : 'loading-cell';
  return <tr><td colSpan={colSpan} className={cls}>{children}</td></tr>;
}

/**
 * The .modal-backdrop / .modal-container dialog from dashboard.html.
 * `size` is small | medium | large (the modal-* width classes).
 */
export function HmModal({ open, onClose, title, size = 'small', children, footer, style, bodyStyle, as: Tag = 'div', onSubmit }) {
  if (!open) return null;
  const body = (
    <>
      {title != null && (
        <div className="modal-header">
          <h3>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
      )}
      <div className="modal-body" style={bodyStyle}>{children}</div>
      {footer && <div className="modal-footer">{footer}</div>}
    </>
  );
  return (
    <div className="modal-backdrop" style={{ display: 'flex' }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal-container modal-${size}`} style={style} role="dialog" aria-modal="true">
        {Tag === 'form'
          ? <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(90vh - 70px)', overflow: 'hidden' }}>{body}</form>
          : body}
      </div>
    </div>
  );
}

/** The one-textarea prompt used for rejection reasons and approval remarks. */
export function ReasonModal({ open, onClose, title, prompt, label, placeholder, confirmLabel, danger, required, busy, onConfirm, value, onChange }) {
  return (
    <HmModal
      open={open}
      onClose={onClose}
      title={title}
      footer={(
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      )}
    >
      <p className="text-secondary mb-12">{prompt}</p>
      <div className="form-group">
        {label && <label>{label}</label>}
        <textarea className="form-control" rows={label ? 3 : 4} placeholder={placeholder} required={required} value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </HmModal>
  );
}

/** Field + label inside .form-row / .form-group, for the staff forms. */
export function Field({ label, required, hint, className = 'form-group flex-1', children }) {
  return (
    <div className={className}>
      {label && <label>{label}{required && <span className="required"> *</span>}</label>}
      {children}
      {hint && <small className="form-hint">{hint}</small>}
    </div>
  );
}
