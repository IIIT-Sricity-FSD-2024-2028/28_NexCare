// Small presentational pieces that map 1:1 onto portal.css classes.

export function KpiTile({ label, value, sub, tone }) {
  return (
    <div className={`kpi${tone ? ` ${tone}` : ''}`}>
      <p className="label">{label}</p>
      <p className="value">{value ?? '—'}</p>
      {sub != null && <p className="sub">{sub}</p>}
    </div>
  );
}

export function Panel({ title, hint, flush, children, style }) {
  return (
    <div className="panel" style={style}>
      {(title || hint) && (
        <div className="panel-head">
          <h2>{title}</h2>
          {hint != null && <span className="hint">{hint}</span>}
        </div>
      )}
      <div className={`panel-body${flush ? ' flush' : ''}`}>{children}</div>
    </div>
  );
}

export function StatusPill({ status }) {
  return <span className={`pill ${String(status || '')}`}>{status}</span>;
}

export function EmptyRow({ colSpan, children, error }) {
  return (
    <tr>
      <td colSpan={colSpan} className="empty" style={error ? { color: '#B91C1C' } : undefined}>
        {children}
      </td>
    </tr>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children && <div className="btn-row">{children}</div>}
    </div>
  );
}

/** A centred overlay dialog. Escape or a backdrop click closes it. */
export function Modal({ open, onClose, title, maxWidth = 480, children }) {
  if (!open) return null;
  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', zIndex: 9999, inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{ background: '#fff', borderRadius: 12, maxWidth, width: '90%', padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', border: '1px solid #E2E8F0', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#64748B', lineHeight: 1 }}>
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const fieldLabel = { display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 };
export const fieldInput = { width: '100%', height: 38, border: '1px solid #CBD5E1', borderRadius: 8, padding: '0 10px', fontSize: 13, background: '#fff', fontFamily: 'inherit' };

/** Status-filter tabs: `tabs` is [{ key, label, count? }]. */
export function Tabs({ tabs, active, onChange, className = 'tab-container' }) {
  return (
    <div className={className} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={t.key === active}
          className={`tab-btn${t.key === active ? ' active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
          {t.count != null && <span className="tab-count"> {t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** A yes/no dialog for the `if (!confirm('…')) return;` pattern the HTML pages used. */
export function ConfirmDialog({ open, title = 'Are you sure?', message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger, busy, onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} maxWidth={420}>
      {message && <p style={{ margin: '0 0 16px', color: '#475569', fontSize: 14, lineHeight: 1.5 }}>{message}</p>}
      <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
        <button type="button" className={`btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm} disabled={busy}>
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
