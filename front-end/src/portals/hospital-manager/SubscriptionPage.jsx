import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addToast } from '../../store/toastSlice';
import { selectUser } from '../../store/authSlice';
import {
  fetchHmRevenue,
  openRenewalModal,
  selectHmRevenue,
  selectHmSubscription,
  updateSubscription,
} from '../../store/hospitalManagerSlice';
import useConfirm from '../../hooks/useConfirm';
import { Badge, LoadingCell, isoDay, money } from './hmShared';

// TAB 6 — Subscription & Renewal: loadSubscription() (the registration
// licence hero + renewal history) and the "What this hospital owes NexCare"
// card that loadRevenue() painted into #revenuePlatformBody — which, because
// the HTML repeated that id, landed on this tab.
//
// The platform plan itself (§5A: one monthly plan per hospital, priced by
// staff seats) is the part plan.md put in this section: the catalogue from
// GET /revenue/hospital-plans and a plan change through
// PATCH /revenue/hospital-subscriptions/:hospitalId, which the backend scopes
// to the manager's own hospital.

/** "What this hospital owes NexCare" — shared with the Revenue section in the HTML. */
export function PlatformCharges({ pc }) {
  if (!pc) return <p>No active subscription for this hospital.</p>;
  const seats = pc.includedSeats === null
    ? `${pc.staffSeats} staff accounts · unlimited on this plan`
    : `${pc.staffSeats} staff accounts · ${pc.includedSeats} included`;
  return (
    <>
      <p style={{ fontSize: 13, marginBottom: 4 }}>Subscription plan: <strong>{pc.planName}</strong></p>
      <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>{seats}</p>
      <table className="data-table" style={{ width: '100%' }}>
        <tbody>
          <tr><td>Monthly plan fee</td><td style={{ textAlign: 'right' }}>{money(pc.baseFee)}</td></tr>
          <tr><td>Extra staff seats</td><td style={{ textAlign: 'right' }}>{pc.extraSeatFee ? money(pc.extraSeatFee) : '—'}</td></tr>
          <tr><td>Bill payment processing</td><td style={{ textAlign: 'right' }}>{money(pc.processingFees)}</td></tr>
          <tr><td style={{ fontWeight: 700 }}>Total this cycle</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{money(pc.total)}</td></tr>
        </tbody>
      </table>
      <p style={{ fontSize: 12, color: '#6B7280', marginTop: 12 }}>
        NexCare takes no share of what you collect — your subscription is the same
        whatever kind of month you have.
      </p>
    </>
  );
}

const messageOf = (err, fallback) => (typeof err === 'string' && err) || err?.message || fallback;

export default function SubscriptionPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const sub = useAppSelector(selectHmSubscription).plan;
  const plans = useAppSelector(selectHmSubscription).plans;
  const revenue = useAppSelector(selectHmRevenue);
  const { ask, dialog } = useConfirm();
  const [switching, setSwitching] = useState('');

  const hospitalId = user?.hospitalId || '';
  const hospitalName = sub?.hospitalName || user?.hospitalName || '';

  useEffect(() => { dispatch(fetchHmRevenue()); }, [dispatch]);

  const d = revenue.data;
  const loading = revenue.loading && !d;
  const failed = Boolean(revenue.error) && !d;
  const pc = d?.platformCharges || null;
  const currentPlan = pc ? plans.find((p) => p.name === pc.planName) : null;
  const catalogue = plans.filter((p) => p.status !== 'retired');

  async function switchPlan(plan) {
    const ok = await ask(`Move ${hospitalName || 'this hospital'} onto the ${plan.name} plan (${money(plan.monthlyFee)} / month)?`, { title: 'Change subscription plan', confirmLabel: 'Change plan' });
    if (!ok) return;
    setSwitching(plan.id);
    try {
      await dispatch(updateSubscription({ planId: plan.id })).unwrap();
      dispatch(addToast({ message: `Subscription moved to ${plan.name}`, type: 'success' }));
      dispatch(fetchHmRevenue()); // the owed-this-cycle card is part of the revenue payload
    } catch (err) {
      dispatch(addToast({ message: messageOf(err, 'Could not change the subscription plan'), type: 'error' }));
    } finally {
      setSwitching('');
    }
  }

  const history = Array.isArray(sub?.paymentHistory) ? sub.paymentHistory : [];
  const expired = sub?.status === 'EXPIRED';

  return (
    <>
      <div className="subscription-hero card">
        <div className="sub-hero-grid">
          <div className="sub-hero-info">
            <div className="sub-plan-badge">Annual Operating License</div>
            <h2>{sub ? `${sub.hospitalName} - Annual Operating License` : 'Hospital Annual Operating License'}</h2>
            <p className="sub-plan-desc">Annual registration license covering verification, emergency network access, and hospital operations.</p>
            <div className="sub-meta-grid">
              <div className="sub-meta-box"><span className="sub-meta-label">Hospital ID</span><strong className="sub-meta-val">{sub?.hospitalId || '--'}</strong></div>
              <div className="sub-meta-box"><span className="sub-meta-label">Registration Date</span><strong className="sub-meta-val">{sub?.registrationDate || '--'}</strong></div>
              <div className="sub-meta-box"><span className="sub-meta-label">Subscription Start</span><strong className="sub-meta-val">{sub?.subscriptionStartDate || '--'}</strong></div>
              <div className="sub-meta-box"><span className="sub-meta-label">Subscription Expiry</span><strong className="sub-meta-val highlight-gold">{sub?.subscriptionExpiryDate || '--'}</strong></div>
            </div>
          </div>
          <div className="sub-hero-action-box">
            <div className="countdown-circle">
              <span className="countdown-number">{sub?.daysRemaining ?? '--'}</span>
              <span className="countdown-unit">Days Left</span>
            </div>
            <div className="sub-status-pill" style={{ background: expired ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.2)', color: expired ? '#F87171' : '#34D399' }}>Status: {sub?.status || 'Active'}</div>
            <div className="sub-price-tag">₹50,000 / Year</div>
            <button type="button" className="btn-primary btn-renew-hero" onClick={() => dispatch(openRenewalModal())}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" /></svg>
              <span>Renew License (+12 Months)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="card mt-24">
        <div className="card-header">
          <h2>Monthly Staff Software Plan</h2>
          <span className="card-subtitle">Monthly plan based on your hospital's active staff size.</span>
        </div>
        <div style={{ padding: 20 }}>
          {loading && <p className="loading-cell">Loading…</p>}
          {failed && <p style={{ color: '#DC2626' }}>Could not load the subscription plan.</p>}
          {d && !pc && <p>No active subscription for this hospital.</p>}
          {pc && (
            <>
              <p style={{ fontSize: 13, marginBottom: 14 }}>
                Current plan: <strong>{pc.planName}</strong> · {pc.staffSeats} staff account{pc.staffSeats === 1 ? '' : 's'}
                {pc.includedSeats === null ? ' · unlimited seats' : ` · ${pc.includedSeats} included`}
                {pc.extraSeatFee > 0 && <span style={{ color: '#B45309' }}> · {money(pc.extraSeatFee)} in extra seats this month</span>}
              </p>
              <div className="stats-grid" style={{ marginBottom: 0 }}>
                {catalogue.map((plan) => {
                  const current = currentPlan?.id === plan.id;
                  const range = plan.maxUsers === null ? `${plan.minUsers}+ staff` : `${plan.minUsers} – ${plan.maxUsers} staff`;
                  return (
                    <div key={plan.id} className="stat-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8, cursor: 'default', border: current ? '2px solid var(--primary)' : undefined }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: 15 }}>{plan.name}</strong>
                        {current && <Badge tone="active">CURRENT</Badge>}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>{money(plan.monthlyFee)}<span style={{ fontSize: 12, fontWeight: 500, color: '#64748B' }}> / month</span></div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{range} · {plan.includedStaffSeats === null ? 'unlimited seats' : `${plan.includedStaffSeats} seats included`}</div>
                      {plan.tagline && <div style={{ fontSize: 12, color: '#475569' }}>{plan.tagline}</div>}
                      {!current && (
                        <button type="button" className="btn-secondary" style={{ marginTop: 4 }} disabled={Boolean(switching)} onClick={() => switchPlan(plan)}>
                          {switching === plan.id ? 'Changing…' : 'Switch to this plan'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card mt-24">
        <div className="card-header">
          <h2>Hospital License Payment & Renewal History</h2>
          <span className="card-subtitle">Complete ledger of annual renewal transactions and license terms</span>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead><tr><th>Payment Date</th><th>Transaction ID</th><th>Payment Method</th><th>Amount</th><th>Previous Expiry</th><th>New Extended Expiry</th><th>Status</th></tr></thead>
            <tbody>
              {!sub && <LoadingCell colSpan={7}>Loading payment records...</LoadingCell>}
              {sub && history.length === 0 && <LoadingCell colSpan={7}>No previous renewal transactions recorded yet.</LoadingCell>}
              {history.map((item) => (
                <tr key={item.id || item.transactionId}>
                  <td><strong>{isoDay(item.date)}</strong></td>
                  <td><code>{item.transactionId}</code></td>
                  <td>{item.paymentType || 'UPI'}</td>
                  <td><strong>₹{(Number(item.amount) || 50000).toLocaleString('en-IN')}</strong></td>
                  <td>{item.previousExpiry || '--'}</td>
                  <td className="text-success"><strong>{item.newExpiry}</strong></td>
                  <td><Badge tone="active">{item.status || 'PAID'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header"><h2>What this hospital owes NexCare</h2></div>
        <div style={{ padding: 20 }}>
          {loading && <p className="loading-cell">Loading…</p>}
          {failed && <p style={{ color: '#DC2626' }}>Could not load revenue data.</p>}
          {d && <PlatformCharges pc={pc} />}
        </div>
      </div>
      {dialog}
    </>
  );
}
