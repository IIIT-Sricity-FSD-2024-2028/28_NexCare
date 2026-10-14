import { useNavigate } from 'react-router-dom';
import { BUCKET_BADGE, BUCKET_LABEL, bucketOf, priorityOf } from '../../features/ambulance/transportSteps';

// Pieces the six ambulance pages share: the page header with the Back button
// every page but the dashboard carried, the status/priority badges and the
// empty-state block.

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {children && <div className="page-header-actions">{children}</div>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const b = bucketOf(status);
  return <span className={`badge ${BUCKET_BADGE[b]}`}>{BUCKET_LABEL[b]}</span>;
}

export function PriorityBadge({ request }) {
  const p = priorityOf(request);
  return <span className={`priority-badge priority-${p.toLowerCase()}`}>{p}</span>;
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon-wrap">
        <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">{icon}</svg>
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

export const ICON_PATH = {
  inbox: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />,
  clipboard: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
  check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
};

export const patientOf = (r) => r.patientName || 'Emergency Patient';
export const locationOf = (r) => r.pickupLocation || 'Unknown Location';
export const contactOf = (r) => r.contact || '-';
