// The helpers every Regional Officer page re-implemented as globals
// (front-end/regional-officer/regional-common.js), plus the page chrome the
// four regional-common.css pages share.
import { Link } from 'react-router-dom';
import useStylesheet from '../../hooks/useStylesheet';
import regionalCss from '../../styles/regional-officer.css?url';
import { pageLink } from '../../api/links';

/**
 * regional-common.css was loaded by dashboard, comparison, alerts and
 * complaints only (the other pages carried their own inline styles or used
 * portal.css), so it is mounted per page, not on the portal shell.
 */
export function useRegionalCss() {
  useStylesheet(regionalCss);
}

export const hospitalDetailsLink = (id) => pageLink('regional-officer/hospital-details', { id });

export function StatusBadge({ status }) {
  const s = String(status || '').toLowerCase();
  if (s === 'verified') return <span className="badge badge-success">Verified</span>;
  if (s.includes('pending')) return <span className="badge badge-warning">Pending</span>;
  if (s === 'rejected') return <span className="badge badge-critical">Rejected</span>;
  return <span className="badge badge-neutral">{status || 'Unknown'}</span>;
}

export function FeedbackStatusBadge({ status }) {
  const s = String(status || '').toLowerCase();
  if (s === 'open') return <span className="badge badge-open">Open</span>;
  if (s.includes('progress')) return <span className="badge badge-progress">In Progress</span>;
  if (s === 'resolved') return <span className="badge badge-resolved">Resolved</span>;
  return <span className="badge badge-neutral">{status || 'Unknown'}</span>;
}

const SEVERITY_CLASS = { critical: 'badge-critical', warning: 'badge-warning', info: 'badge-info' };

export function SeverityBadge({ severity }) {
  return <span className={`badge ${SEVERITY_CLASS[severity] || 'badge-neutral'}`}>{severity}</span>;
}

export function Stars({ rating }) {
  const n = Math.max(0, Math.min(5, Number(rating) || 0));
  return (
    <span className="stars" aria-label={`Rating ${n} out of 5`}>
      {'★'.repeat(n)}{'☆'.repeat(5 - n)}
    </span>
  );
}

/** good / warn / bad for a metric against its thresholds (hospital-comparison.js). */
export function metricClass(metric, value, thresholds) {
  const t = thresholds[metric];
  if (!t) return '';
  if (t.bad && value >= t.bad) return 'bad';
  if (t.warn && value >= t.warn) return 'warn';
  if (t.lowBad && value <= t.lowBad) return 'bad';
  if (t.lowWarn && value <= t.lowWarn) return 'warn';
  return 'good';
}

export function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

/** '₹' + Indian grouping, no decimals (dashboard.js formatINR / revenue.js money). */
export function formatINR(num) {
  return '₹' + (Number(num) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

/** The gradient banner at the top of the regional-common.css pages. */
export function Hero({ title, children }) {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <h1 id="hero-heading">{title}</h1>
      <p>{children}</p>
    </section>
  );
}

/** One .stat-card: label, value, optional sub line and coloured icon box. */
export function StatCard({ label, value, sub, icon, tone }) {
  return (
    <div className="stat-card">
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value ?? '—'}</p>
        {sub != null && <p className="stat-sub">{sub}</p>}
      </div>
      {icon && <div className={`stat-icon ${tone || ''}`} aria-hidden="true">{icon}</div>}
    </div>
  );
}

/** The "Details" / "View hospital" link to hospital-details?id=. */
export function DetailsLink({ id, children = 'Details' }) {
  return <Link to={hospitalDetailsLink(id)} className="btn-link">{children}</Link>;
}

/** The 24px stroked icons the stat cards and quick actions used. */
const svg = (stroke, size, d) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">{d}</svg>
);
export const ICONS = {
  home: (c = '#2563EB', s = 24) => svg(c, s, <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />),
  homeCheck: (c = '#059669', s = 22) => svg(c, s, <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 12 11 14 15 10" /></>),
  users: (c = '#7C3AED', s = 24) => svg(c, s, <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>),
  bed: (c = '#059669', s = 24) => svg(c, s, <rect x="2" y="4" width="20" height="16" rx="2" />),
  warning: (c = '#EA580C', s = 24) => svg(c, s, <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />),
  triangle: (c = '#EA580C', s = 22) => svg(c, s, <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />),
  chat: (c = '#DC2626', s = 24) => svg(c, s, <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />),
  box: (c = '#EA580C', s = 24) => svg(c, s, <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />),
  bars: (c = '#2563EB', s = 22) => svg(c, s, <><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></>),
  circleAlert: (c = '#DC2626', s = 24) => svg(c, s, <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>),
  exclaim: (c = '#F59E0B', s = 24) => svg(c, s, <path d="M12 9v2m0 4h.01" />),
  circle: (c = '#DC2626', s = 24) => svg(c, s, <circle cx="12" cy="12" r="10" />),
  clock: (c = '#EA580C', s = 24) => svg(c, s, <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>),
  star: (c = '#7C3AED', s = 24) => svg(c, s, <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />),
};
