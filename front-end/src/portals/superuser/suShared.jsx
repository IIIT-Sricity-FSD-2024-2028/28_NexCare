// Bits the superuser pages share: the page wrapper that scopes superuser.css,
// the header with the role line every page printed, and the small formatters
// the scripts each re-declared.
import Header from '../../components/layout/Header';

/** Every superuser page's header said "System Administrator" on the role line. */
export const ROLE_TEXT = 'System Administrator';

/**
 * The page root + the shared header. `className` is the CSS scope from
 * styles/superuser.css: "su-page su-<page>" for the seven pages that carried
 * the common chrome, "su-revenue" for revenue, nothing for hierarchy (it
 * renders at portal.css's values, as its HTML did).
 */
export function SuPage({ className, title, children }) {
  return (
    <div className={className}>
      <Header title={title} roleText={ROLE_TEXT} />
      <div className="page-body">{children}</div>
    </div>
  );
}

/** '₹' + Indian grouping, no decimals (revenue.js money()). */
export function money(value) {
  const n = Number(value) || 0;
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

/** revenue.js shortDate(): "21 Sept 2026", or the raw value when unparseable. */
export function shortDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? String(value || '—')
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** ★★★☆☆ — feedback.js renderRatings(). */
export function Stars({ rating }) {
  const n = Math.max(0, Math.min(5, Number(rating) || 0));
  return <span className="stars">{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>;
}

/** Centred one-cell table message (the pages' "Loading…" / "No … found." rows). */
export function MessageRow({ colSpan, color = '#6b7280', padding = 20, children }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ textAlign: 'center', padding, color }}>{children}</td>
    </tr>
  );
}

const TRASH = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const EYE = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
export const ICONS = { trash: TRASH, eye: EYE };
