import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectUser } from '../../store/authSlice';
import { addToast } from '../../store/toastSlice';
import {
  openRenewalModal,
  openStaffModal,
  selectHmHospital,
  selectHmOverview,
  selectHmSubscription,
  fetchHmOverview,
} from '../../store/hospitalManagerSlice';
import { Badge, LoadingCell, isoDay } from './hmShared';
import useApprovals from './useApprovals';
import { leaveDays } from './LeavesPage';

const svg = (d) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{d}</svg>;
const ICON = {
  doctors: svg(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
  admin: svg(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" /></>),
  inventory: svg(<><path d="M21 8l-9-4-9 4 9 4 9-4z" /><path d="M3 8v8l9 4 9-4V8" /><path d="M12 12v8" /></>),
  card: svg(<><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></>),
  addUser: svg(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></>),
  calendar: svg(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></>),
  ambulance: svg(<><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M10 10v4" /><path d="M8 12h4" /></>),
};

function StatCard({ to, icon, tone, value, label, sub, iconStyle }) {
  return (
    <Link to={to} className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className={`stat-icon ${tone || ''}`} style={iconStyle}>{icon}</div>
      <div className="stat-data">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
        <span className="stat-subtext">{sub}</span>
      </div>
    </Link>
  );
}

function QuickAction({ to, onClick, icon, tone, style, title, text }) {
  const inner = (
    <>
      <div className={`action-btn-icon ${tone || ''}`} style={style}>{icon}</div>
      <div className="action-btn-text"><strong>{title}</strong><span>{text}</span></div>
    </>
  );
  return to
    ? <Link to={to} className="quick-action-btn" style={{ textDecoration: 'none', color: 'inherit' }}>{inner}</Link>
    : <button type="button" className="quick-action-btn" onClick={onClick}>{inner}</button>;
}

export default function OverviewPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const hospital = useAppSelector(selectHmHospital);
  const overview = useAppSelector(selectHmOverview);
  const subscription = useAppSelector(selectHmSubscription).plan;
  const hospitalId = user?.hospitalId || '';
  const hospitalName = hospital.name || user?.hospitalName || '';
  const data = overview.stats; // { doctors, adminStaff, pendingLeaves, urgentReqs, pendingReqs }
  const failed = Boolean(overview.error);

  const { approveLeave, rejectLeave, approveReq, rejectReq, dialogs } = useApprovals();

  const sub = subscription;
  const subBadge = sub?.status === 'EXPIRED' ? 'rejected' : sub?.status === 'DUE_SOON' ? 'pending' : 'active';
  const nLeaves = data?.pendingLeaves.length ?? 0;
  const nUrgent = data?.urgentReqs ?? 0;
  const partialFailures = overview.partialFailures || [];

  useEffect(() => {
    if (partialFailures.length > 0) {
      dispatch(addToast({ message: `Some overview data failed to load: ${partialFailures.join(', ')}`, type: 'warning' }));
    }
  }, [dispatch, partialFailures]);

  const queue = data ? [
    ...data.pendingLeaves.map((l) => ({
      type: 'LEAVE', id: l.id,
      title: `Doctor Leave: ${l.doctorName || 'Doctor'} (${l.leaveType || l.type || 'General'})`,
      requester: `${l.doctorName || 'Doctor'} • ${l.department || 'Clinical'}`,
      date: `${l.startDate} to ${l.endDate} (${leaveDays(l)}d)`,
      reason: l.reason || 'Medical / Personal reason',
      priority: 'MEDIUM',
    })),
    ...data.pendingReqs.map((r) => ({
      type: 'INVENTORY', id: r.id,
      title: `Inventory: ${r.itemName} (${r.requestedQuantity} ${r.unit})`,
      requester: `${r.requestedBy || 'Staff'} • ${r.department}`,
      date: `Req Date: ${r.requestDate || isoDay(r.createdAt)}`,
      reason: r.reason || 'Restock requisition',
      priority: r.priority || 'MEDIUM',
    })),
  ] : null;

  return (
    <>
      <div className="stats-grid" style={{ position: 'relative' }}>
        <StatCard to="/hospital-manager/leaves" icon={ICON.doctors} tone="icon-blue" value={data?.doctors ?? 0} label="Active Doctors" sub={`${nLeaves} pending leave request${nLeaves === 1 ? '' : 's'}`} />
        <StatCard to="/hospital-manager/supervision" icon={ICON.admin} tone="icon-purple" value={data?.adminStaff ?? 0} label="Administrative Staff" sub="Operations & Front Desk" />
        <StatCard to="/hospital-manager/inventory-approvals" icon={ICON.inventory} tone="icon-amber" value={data?.pendingReqs.length ?? 0} label="Inventory Approvals" sub={`${nUrgent} urgent requisition${nUrgent === 1 ? '' : 's'}`} />
        <StatCard to="/hospital-manager/subscription" icon={ICON.card} tone="icon-green" value={sub?.daysRemaining ?? '--'} label="Days to Renewal" sub={`License ${sub?.status || 'Active'}`} />
        <button
          type="button"
          className="btn-secondary"
          style={{ position: 'absolute', top: -8, right: 0, padding: '6px 12px', fontSize: 12 }}
          onClick={() => dispatch(fetchHmOverview())}
          disabled={overview.loading}
          title="Refresh overview data"
        >
          {overview.loading ? '⟳ Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      <div className="grid-2-col">
        <div className="card">
          <div className="card-header"><h2>Hospital Quick Actions</h2></div>
          <div className="quick-actions-grid">
            <QuickAction onClick={() => dispatch(openStaffModal())} icon={ICON.addUser} tone="bg-blue" title="Register Staff" text="Add doctor, admin, or ambulance staff" />
            <QuickAction to="/hospital-manager/leaves" icon={ICON.calendar} tone="bg-amber" title="Review Doctor Leaves" text="Approve or reject doctor leave requests" />
            <QuickAction to="/hospital-manager/inventory-approvals" icon={ICON.inventory} tone="bg-cyan" title="Inventory Approvals" text="Approve replenishment requisitions" />
            <QuickAction to="/hospital-manager/ambulance" icon={ICON.ambulance} style={{ background: '#fee2e2', color: '#dc2626' }} title="Ambulance Fleet Status" text="Monitor live readiness & emergencies" />
            <QuickAction onClick={() => dispatch(openRenewalModal())} icon={ICON.card} tone="bg-green" title="Renew License (+12 Mo)" text="Extend annual registration license" />
          </div>
        </div>

        <div className="card subscription-summary-card">
          <div className="card-header">
            <h2>Hospital Registration Status</h2>
            <Badge tone={subBadge}>{sub?.status || 'Active License'}</Badge>
          </div>
          <div className="sub-hero-details">
            <div className="sub-hero-item"><span className="sub-hero-label">Hospital Name</span><strong className="sub-hero-val">{sub?.hospitalName || hospitalName || '--'}</strong></div>
            <div className="sub-hero-item"><span className="sub-hero-label">Hospital ID</span><strong className="sub-hero-val">{sub?.hospitalId || hospitalId || '--'}</strong></div>
            <div className="sub-hero-item"><span className="sub-hero-label">Current Expiry</span><strong className="sub-hero-val text-primary">{sub?.subscriptionExpiryDate || '--'}</strong></div>
            <div className="sub-hero-item"><span className="sub-hero-label">Days Remaining</span><strong className="sub-hero-val text-large">{sub ? `${sub.daysRemaining} Days` : '--'}</strong></div>
          </div>
          <div className="card-footer-action">
            <button type="button" className="btn-primary btn-block" onClick={() => dispatch(openRenewalModal())}>Renew Subscription (12-Month Extension)</button>
          </div>
        </div>
      </div>

      <div className="card mt-24">
        <div className="card-header">
          <h2>Pending Approvals Queue</h2>
          <span className="card-subtitle">Urgent requisitions and leaves requiring your decision</span>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr><th>Type</th><th>Subject / Details</th><th>Requested By / Department</th><th>Date / Duration</th><th>Priority / Reason</th><th>Quick Actions</th></tr>
            </thead>
            <tbody>
              {failed && <LoadingCell colSpan={6} tone="danger">Failed to load the pending approval queue.</LoadingCell>}
              {!failed && !queue && <LoadingCell colSpan={6}>Loading pending approval queue...</LoadingCell>}
              {queue && queue.length === 0 && <LoadingCell colSpan={6} tone="success">✨ No pending approvals! All doctor leaves and inventory requisitions are up-to-date.</LoadingCell>}
              {queue && queue.map((item) => (
                <tr key={`${item.type}-${item.id}`}>
                  <td><Badge tone={item.type === 'LEAVE' ? 'role' : 'approved'}>{item.type === 'LEAVE' ? '🩺 Doctor Leave' : '📦 Inventory'}</Badge></td>
                  <td><strong>{item.title}</strong></td>
                  <td>{item.requester}</td>
                  <td>{item.date}</td>
                  <td>
                    <Badge tone={item.priority.toLowerCase()}>{item.priority}</Badge>
                    <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>{item.reason}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className="btn-action-sm btn-action-approve" onClick={() => (item.type === 'LEAVE' ? approveLeave(item.id) : approveReq(item.id))}>Approve</button>
                      <button type="button" className="btn-action-sm btn-action-reject" onClick={() => (item.type === 'LEAVE' ? rejectLeave(item.id) : rejectReq(item.id))}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {dialogs}
    </>
  );
}
