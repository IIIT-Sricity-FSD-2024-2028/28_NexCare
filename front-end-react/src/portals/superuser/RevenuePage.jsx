import { useCallback, useEffect, useState } from 'react';
import { Revenue } from '../../api';
import { useToast } from '../../context/ToastContext';
import { money, shortDate, SuPage } from './suShared';

// superuser/revenue.html + revenue.js — NexCare's own revenue model.
//
// The platform has two payers and five streams. Hospitals buy the platform on
// a subscription priced by how many staff accounts they run; patients buy
// convenience, per booking or with a Care+ membership. On top sit small
// per-transaction fees. A hospital's own patient billing is its revenue, not
// ours, and is shown in that hospital's manager portal instead.
//
// Doctors are NOT a payer. They are hospital staff, and the hospital's
// subscription already covers their seat.
//
// One load() fetches everything and each tab renders from that snapshot, so
// the totals on "All streams" and the per-payer tabs are guaranteed to agree.

const TABS = [
  ['streams', 'All streams'], ['hospitals', 'Hospitals'], ['plans', 'Hospital plans'],
  ['patients', 'Patients'], ['regions', 'Regional officers'], ['fees', 'Pricing controls'],
];

// Rates are stored as fractions but edited as percentages — a superuser types
// "1.9", not "0.019".
const FEE_FIELDS = [
  ['patientBookingFee', 'Booking convenience fee (₹)', 'rupees', 'Charged to the patient on each appointment booked.'],
  ['ambulanceDispatchFee', 'Ambulance dispatch fee (₹)', 'rupees', 'Charged on each completed dispatch.'],
  ['paymentGatewayRate', 'Payment processing (%)', 'percent', 'Taken on every bill settled through NexCare.'],
  ['extraStaffSeatFee', 'Extra staff seat (₹/month)', 'rupees', 'Per seat beyond the plan allowance.'],
  ['notificationCreditFee', 'Notification credit (₹)', 'rupees', 'Per SMS or WhatsApp sent on a hospital’s behalf.'],
];

const LOAD_ERROR = 'Could not load revenue data. Check that the backend is running.';
const pillFor = (status) => `pill ${String(status || '')}`;
const unscore = (s) => String(s).replace(/_/g, ' ');

function Kpi({ label, value, sub, accent, valueClass, id, subId }) {
  return (
    <div className={`kpi${accent ? ' accent' : ''}`}>
      <p className="label">{label}</p>
      <p className={`value${valueClass ? ` ${valueClass}` : ''}`} id={id}>{value ?? '—'}</p>
      <p className="sub" id={subId}>{sub ?? ' '}</p>
    </div>
  );
}

function Panel({ title, hint, hintId, flush, children }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
        <span className="hint" id={hintId}>{hint}</span>
      </div>
      <div className={`panel-body${flush ? ' flush' : ''}`}>{children}</div>
    </div>
  );
}

const feeInput = { width: 120, fontSize: 22, fontWeight: 700, color: '#2563EB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '2px 8px' };

export default function RevenuePage() {
  const { notify } = useToast();
  const [tab, setTab] = useState('streams');
  const [data, setData] = useState(null); // the snapshot; null while loading
  const [failed, setFailed] = useState(false);
  const [hospFees, setHospFees] = useState({});
  const [patFees, setPatFees] = useState({});
  const [feeForm, setFeeForm] = useState({});
  const [openRegions, setOpenRegions] = useState({});

  const load = useCallback(async () => {
    const settle = (p) => p.then((r) => r.data).catch(() => null);
    try {
      const [overview, trend, streams, hospitalPlans, hospitalSubs, patientPlans, patientSubs, fees, regions] = await Promise.all([
        Revenue.getPlatformOverview().then((r) => r.data),
        settle(Revenue.getPlatformTrend(6)),
        settle(Revenue.getPlatformStreams()),
        settle(Revenue.getHospitalPlans()),
        settle(Revenue.getHospitalSubscriptions()),
        settle(Revenue.getPatientPlans()),
        settle(Revenue.getPatientSubscriptions()),
        settle(Revenue.getFees()),
        settle(Revenue.getRegionalOfficerOverview()),
      ]);
      const snap = {
        overview, trend: trend || [], streams,
        hospitalPlans: hospitalPlans || [], hospitalSubs: hospitalSubs || [],
        patientPlans: patientPlans || [], patientSubs: patientSubs || [], fees, regions,
      };
      setData(snap);
      setFailed(false);
      setHospFees(Object.fromEntries(snap.hospitalPlans.map((p) => [p.id, String(p.monthlyFee)])));
      setPatFees(Object.fromEntries(snap.patientPlans.map((p) => [p.id, String(p.monthlyFee)])));
      if (fees) {
        setFeeForm(Object.fromEntries(FEE_FIELDS.map(([key, , kind]) =>
          [key, kind === 'percent' ? (fees[key] * 100).toFixed(2) : String(fees[key])])));
      }
    } catch (err) {
      console.error('Revenue load failed:', err);
      setFailed(true);
      setData((d) => d || { overview: null, trend: [], streams: null, hospitalPlans: [], hospitalSubs: [], patientPlans: [], patientSubs: [], fees: null, regions: null });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /** Run a pricing change, report it, and reload every figure on the page. */
  async function apply(action, successMessage) {
    try {
      await action();
      notify(successMessage, 'success');
      await load();
      return true;
    } catch (err) {
      console.error(err);
      notify(err?.message || 'The change could not be saved', 'error');
      return false;
    }
  }

  async function saveHospitalPlanFee(planId) {
    const monthlyFee = Number(hospFees[planId]);
    if (!Number.isFinite(monthlyFee) || monthlyFee < 0) { notify('Enter a valid monthly fee', 'error'); return; }
    await apply(() => Revenue.updateHospitalPlan(planId, { monthlyFee }), 'Hospital plan repriced');
  }

  async function savePatientPlanFee(planId) {
    const monthlyFee = Number(patFees[planId]);
    if (!Number.isFinite(monthlyFee) || monthlyFee < 0) { notify('Enter a valid monthly fee', 'error'); return; }
    await apply(() => Revenue.updatePatientPlan(planId, { monthlyFee }), 'Membership tier repriced');
  }

  async function saveFees() {
    const changes = {};
    for (const [key, label, kind] of FEE_FIELDS) {
      const raw = Number(feeForm[key]);
      if (!Number.isFinite(raw) || raw < 0) { notify(`${label} must be a number that is not negative`, 'error'); return; }
      changes[key] = kind === 'percent' ? raw / 100 : raw;
    }
    await apply(() => Revenue.updateFees(changes), 'Pricing updated — reports re-priced');
  }

  const d = data;
  const s = d?.streams;
  /** Find one stream's figures by its stable machine key. */
  const stream = (key) => ((s && s.byStream) || []).find((x) => x.key === key) || { amount: 0, units: 0, unitLabel: '' };
  const loading = !d;

  // ── All streams ───────────────────────────────────────────────────────
  function StreamsTab() {
    const u = (s && s.unitEconomics) || {};
    const peak = Math.max(1, ...((s && s.byPayer) || []).map((p) => p.amount));
    return (
      <>
        <div className="kpi-grid">
          <Kpi accent label="Total platform revenue" id="sTotal" subId="sTotalSub" value={s ? money(s.totalRevenue) : '—'} sub={s ? `${(s.byStream || []).length} streams, 2 payers` : 'this cycle, all streams'} />
          <Kpi label="Recurring" id="sRecurring" subId="sRecurringSub" value={s ? money(s.recurringRevenue) : '—'} sub={s ? `${u.recurringShare ?? 0}% of total — the stickiness number` : 'subscriptions and memberships'} />
          <Kpi label="Usage-based" id="sUsage" value={s ? money(s.usageRevenue) : '—'} sub="commissions and per-transaction fees" />
          <Kpi label="Revenue per hospital" id="sArpHospital" subId="sHospitalCount" value={s ? money(u.revenuePerHospital) : '—'} sub={s ? `across ${u.hospitals ?? 0} hospitals` : null} />
          <Kpi label="Revenue per staff seat" id="sArpSeat" subId="sSeatCount" value={s ? money(u.revenuePerStaffSeat) : '—'} sub={s ? `across ${u.staffSeats ?? 0} staff accounts` : null} />
          <Kpi label="Revenue per patient" id="sArpPatient" subId="sPatientCount" value={s ? money(u.revenuePerPatient) : '—'} sub={s ? `across ${u.patients ?? 0} patients` : null} />
        </div>

        <Panel title="Where the money comes from" hint="Each stream, who pays it, and what it is charged on" flush>
          <table className="rev">
            <thead>
              <tr><th>Stream</th><th>Payer</th><th>Type</th><th className="num">Units</th><th className="num">Revenue</th><th className="num">Share</th></tr>
            </thead>
            <tbody id="streamBody">
              {failed ? <tr><td colSpan={6} className="empty" style={{ color: '#DC2626' }}>{LOAD_ERROR}</td></tr>
                : loading ? <tr><td colSpan={6} className="empty">Loading…</td></tr>
                  : !(s && s.byStream && s.byStream.length) ? <tr><td colSpan={6} className="empty">No revenue in this period.</td></tr>
                    : s.byStream.map((line) => (
                      <tr key={line.key}>
                        <td><strong>{line.label}</strong><br /><span className="muted">{line.basis}</span></td>
                        <td><span className={`pill ${line.payer === 'hospital' ? 'confirmed' : 'active'}`}>{line.payer}</span></td>
                        <td className="muted">{line.type}</td>
                        <td className="num">{line.units.toLocaleString('en-IN')}<br /><span className="muted">{line.unitLabel}</span></td>
                        <td className="num" style={{ fontWeight: 700 }}>{money(line.amount)}</td>
                        <td className="num">{line.share}%</td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Revenue by payer" hint="Hospitals and patients as a share of the total">
          <div id="payerBody">
            {loading && !failed ? 'Loading…' : ((s && s.byPayer) || []).map((p) => (
              <div className="bar-row" key={p.payer}>
                <span className="name" style={{ textTransform: 'capitalize' }}>{p.payer}s</span>
                <div className="bar-track"><div className={`bar-fill ${p.payer === 'hospital' ? '' : p.payer}`} style={{ width: `${(p.amount / peak) * 100}%` }} /></div>
                <span className="amt">{money(p.amount)}</span>
                <span className="amt">{p.share}%</span>
              </div>
            ))}
          </div>
        </Panel>
      </>
    );
  }

  // ── Hospitals (the original view) ─────────────────────────────────────
  function HospitalsTab() {
    const o = d?.overview;
    const rows = (o && o.byHospital) || [];
    const trend = d?.trend || [];
    const peak = Math.max(1, ...trend.map((t) => t.total));
    return (
      <>
        <div className="note">
          <strong>A hospital pays for seats, not for a share of its takings.</strong>{' '}
          The commission on collections was removed on 2026-09-01: NexCare charges a monthly plan priced by how many staff accounts the hospital runs, which makes its cost fixed and forecastable whatever kind of month it has. The only variable part left is the fee on processing a bill payment, read from the platform ledger at the rate in force when each payment was taken — which is why repricing today does not restate last month.
        </div>

        <div className="kpi-grid">
          <Kpi accent label="Monthly Recurring Revenue" id="kpiMrr" subId="kpiMrrSub" value={o ? money(o.mrr) : '—'} sub="hospital plans + Care+ memberships" />
          <Kpi label="Annual Run Rate" id="kpiArr" value={o ? money(o.arr) : '—'} sub="MRR × 12" />
          <Kpi label="Hospital subscriptions" id="kpiSubscription" subId="kpiSubscriptionSub" value={o ? money(o.subscriptionRevenue) : '—'} sub={o ? `independent of the ${money(o.gatewayVolume)} they collected` : null} />
          <Kpi label="Payment processing" id="kpiProcessing" subId="kpiProcessingSub" value={o ? money(o.processingRevenue) : '—'} sub={o ? `${money(o.outstandingReceivables)} unpaid balance` : null} />
          <Kpi label="Paying hospitals" id="kpiSubs" subId="kpiSubsSub" value={o ? o.earningHospitals : '—'} sub={o ? `of ${o.totalHospitals} hospitals on the platform` : null} />
          <Kpi label="Avg. per earning hospital" id="kpiArpa" value={o ? money(o.averageRevenuePerHospital) : '—'} sub="subscription + processing" />
        </div>

        <Panel title="Revenue trend" hint="Processing comes from the ledger; subscriptions are the current run rate">
          <div id="trendBody">
            {loading && !failed ? 'Loading…' : !trend.length ? <p className="muted">No trend data.</p> : trend.map((t) => (
              <div key={t.month}>
                <div className="bar-row">
                  <span className="name">{t.month}</span>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${(t.total / peak) * 100}%` }} /></div>
                  <span className="amt">{money(t.total)}</span>
                </div>
                <div className="muted" style={{ margin: '-4px 0 12px 202px' }}>
                  {money(t.recurring)} recurring · {money(t.subscriptions)} hospital plans · {money(t.processing)} processing
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Revenue by hospital" hint="Every hospital on the platform, and what it pays" flush>
          <table className="rev">
            <thead>
              <tr>
                <th>Hospital</th><th>Status</th><th>Plan</th><th className="num">Payments</th><th className="num">Collections</th>
                <th className="num">Subscription</th><th className="num">Processing</th><th className="num">Platform revenue</th>
              </tr>
            </thead>
            <tbody id="hospitalTableBody">
              {failed ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: '#DC2626' }}>{LOAD_ERROR}</td></tr>
                : loading ? <tr><td colSpan={8} className="empty">Loading…</td></tr>
                  : !rows.length ? <tr><td colSpan={8} className="empty">No hospital is on the platform in this period.</td></tr>
                    : rows.map((h) => (
                      <tr key={h.hospitalId}>
                        <td><strong>{h.hospitalName}</strong><br /><span className="muted">{h.hospitalId}</span></td>
                        <td><span className={pillFor(h.status)}>{unscore(h.status)}</span></td>
                        <td>{h.planName}<br /><span className="muted">{h.staffSeats} staff</span></td>
                        <td className="num">{h.paymentsProcessed}</td>
                        <td className="num muted">{money(h.collections)}</td>
                        <td className="num">{money(h.subscription)}</td>
                        <td className="num">{money(h.processingFees)}</td>
                        <td className="num" style={{ fontWeight: 700 }}>{money(h.platformRevenue)}</td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </Panel>
      </>
    );
  }

  // ── Hospital plans ────────────────────────────────────────────────────
  function PlansTab() {
    const subscription = stream('hospital_subscription');
    const processing = stream('payment_gateway_fee');
    const plans = d?.hospitalPlans || [];
    const subs = d?.hospitalSubs || [];
    return (
      <>
        <div className="note">
          <strong>The hospital is the customer, so the hospital is billed once.</strong>{' '}
          Doctors, nurses, administrative staff and ambulance staff are all its employees; charging each of them for a tool their employer already pays for made no sense, so none of them is charged. The plan is priced by how many staff accounts the hospital runs — a number NexCare counts for itself out of the staff directory, so it moves when somebody is actually hired, not when a line in a file is edited. A hospital that grows past the seats its plan includes pays the per-seat rate for the overflow until it moves up.
        </div>

        <div className="kpi-grid">
          <Kpi accent label="Hospital revenue" id="hTotal" value={s ? money(subscription.amount + processing.amount) : '—'} sub="subscriptions + payment processing" />
          <Kpi label="Subscriptions" id="hSubscription" subId="hSubscriptionSub" value={s ? money(subscription.amount) : '—'} sub={s ? `${subscription.units} ${subscription.unitLabel}` : null} />
          <Kpi label="Payment processing" id="hProcessing" subId="hProcessingSub" value={s ? money(processing.amount) : '—'} sub={s ? `${processing.units} ${processing.unitLabel}` : null} />
        </div>

        <Panel title="Subscription plans" hint="Edit the monthly fee, then Save">
          <div className="plan-grid" id="hospitalPlanGrid">
            {loading ? 'Loading…' : !plans.length ? <p className="muted">No hospital plans configured.</p> : plans.map((p) => {
              const onPlan = subs.filter((sub) => sub.planId === p.id && sub.status === 'active').length;
              const band = p.maxUsers === null ? `${p.minUsers}+ staff accounts` : `${p.minUsers}–${p.maxUsers} staff accounts`;
              return (
                <div className="plan-card" key={p.id}>
                  <h3>{p.name}</h3>
                  <div className="muted">{p.tagline || ''}</div>
                  <div className="price">
                    ₹<input type="number" min="0" step="500" id={`hfee-${p.id}`} value={hospFees[p.id] ?? ''} onChange={(e) => setHospFees((f) => ({ ...f, [p.id]: e.target.value }))} style={feeInput} />
                    {' '}<span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>/month</span>
                  </div>
                  <div className="muted">{band} · {p.includedStaffSeats === null ? 'unlimited seats' : `${p.includedStaffSeats} seats included`}</div>
                  <ul>{(p.features || []).map((f) => <li key={f}>{f}</li>)}</ul>
                  <div className="meta">{onPlan} hospital{onPlan === 1 ? '' : 's'} on this plan</div>
                  <button type="button" className="btn primary" style={{ marginTop: 12 }} onClick={() => saveHospitalPlanFee(p.id)}>Save</button>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Hospitals on the platform" hint={d ? `${subs.length} subscribed` : ''} hintId="hospitalCount" flush>
          <table className="rev">
            <thead><tr><th>Hospital</th><th className="num">Staff accounts</th><th>Plan</th><th>Status</th><th className="num">This cycle</th></tr></thead>
            <tbody id="hospitalSubBody">
              {loading ? <tr><td colSpan={5} className="empty">Loading…</td></tr>
                : !subs.length ? <tr><td colSpan={5} className="empty">No hospitals subscribed yet.</td></tr>
                  : subs.map((sub) => {
                    // The per-hospital line carries the live seat count; the subscription
                    // row only remembers the headcount it was assigned on.
                    const line = ((d.overview && d.overview.byHospital) || []).find((h) => h.hospitalId === sub.hospitalId);
                    return (
                      <tr key={sub.hospitalId}>
                        <td><strong>{sub.hospitalName}</strong><br /><span className="muted">{sub.hospitalId}</span></td>
                        <td className="num">{line ? line.staffSeats : sub.staffAtSignup}</td>
                        <td><strong>{(plans.find((p) => p.id === sub.planId) || {}).name || sub.planId}</strong></td>
                        <td><span className={pillFor(sub.status)}>{unscore(sub.status)}</span></td>
                        <td className="num">{line ? money(line.subscription) : '—'}</td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </Panel>
      </>
    );
  }

  // ── Patients ──────────────────────────────────────────────────────────
  function PatientsTab() {
    const membership = stream('patient_membership');
    const booking = stream('patient_booking_fee');
    const ambulance = stream('ambulance_dispatch_fee');
    const plans = d?.patientPlans || [];
    const subs = d?.patientSubs || [];
    const active = subs.filter((x) => x.status === 'active');
    return (
      <>
        <div className="note">
          <strong>Patients pay for convenience, never for care.</strong> A booking fee on each appointment, waived by a Care+ membership, plus a dispatch fee on a completed ambulance trip. Hospital bills are the hospital's and are not touched.
        </div>

        <div className="kpi-grid">
          <Kpi accent label="Patient revenue" id="pTotal" value={s ? money(membership.amount + booking.amount + ambulance.amount) : '—'} sub="memberships + booking + dispatch fees" />
          <Kpi label="Memberships" id="pMembership" subId="pMembershipSub" value={s ? money(membership.amount) : '—'} sub={s ? `${membership.units} ${membership.unitLabel}` : null} />
          <Kpi label="Booking fees" id="pBooking" subId="pBookingSub" value={s ? money(booking.amount) : '—'} sub={s ? `${booking.units} ${booking.unitLabel}` : null} />
          <Kpi label="Ambulance dispatch" id="pAmbulance" subId="pAmbulanceSub" value={s ? money(ambulance.amount) : '—'} sub={s ? `${ambulance.units} ${ambulance.unitLabel}` : null} />
        </div>

        <Panel title="Membership tiers" hint="Edit the monthly fee, then Save">
          <div className="plan-grid" id="patientPlanGrid">
            {loading ? 'Loading…' : !plans.length ? <p className="muted">No membership tiers configured.</p> : plans.map((p) => {
              const onPlan = subs.filter((x) => x.planId === p.id && x.status === 'active').length;
              return (
                <div className="plan-card" key={p.id}>
                  <h3>{p.name}</h3>
                  <div className="muted">{p.tagline || ''}</div>
                  <div className="price">
                    ₹<input type="number" min="0" step="50" id={`pfee-${p.id}`} value={patFees[p.id] ?? ''} onChange={(e) => setPatFees((f) => ({ ...f, [p.id]: e.target.value }))} style={{ ...feeInput, width: 100 }} />
                    {' '}<span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>/month</span>
                  </div>
                  <div className="muted">
                    {p.waivesBookingFee ? 'waives the booking fee' : 'pays the booking fee'} · {(p.ambulanceDiscount * 100).toFixed(0)}% off ambulance · covers {p.coversMembers}
                  </div>
                  <ul>{(p.features || []).map((f) => <li key={f}>{f}</li>)}</ul>
                  <div className="meta">{onPlan} active member{onPlan === 1 ? '' : 's'}</div>
                  <button type="button" className="btn primary" style={{ marginTop: 12 }} onClick={() => savePatientPlanFee(p.id)}>Save</button>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Care+ members" hint={d ? `${active.length} active` : ''} hintId="memberCount" flush>
          <table className="rev">
            <thead><tr><th>Patient</th><th>Plan</th><th>Status</th><th>Started</th><th>Renews</th></tr></thead>
            <tbody id="memberBody">
              {loading ? <tr><td colSpan={5} className="empty">Loading…</td></tr>
                : !subs.length ? <tr><td colSpan={5} className="empty">Nobody has taken a membership yet.</td></tr>
                  : subs.map((x) => (
                    <tr key={x.patientId + x.planId}>
                      <td><strong>{x.patientName}</strong><br /><span className="muted">{x.patientId}</span></td>
                      <td>{(plans.find((p) => p.id === x.planId) || {}).name || x.planId}</td>
                      <td><span className={pillFor(x.status)}>{x.status}</span></td>
                      <td className="muted">{shortDate(x.startedAt)}</td>
                      <td className="muted">{shortDate(x.renewsOn)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </Panel>
      </>
    );
  }

  // ── Regional officers ─────────────────────────────────────────────────
  function RegionsTab() {
    const regions = d?.regions;
    const t = (regions && regions.totals) || {};
    const rows = (regions && regions.officers) || [];
    const peak = Math.max(1, ...rows.map((r) => r.platformRevenue));
    const workloadPill = (level) => (level === 'high' ? 'cancelled' : level === 'medium' ? 'pending' : 'active');
    return (
      <>
        <div className="note">
          <strong>What each regional officer's patch is worth, and how much they carry.</strong>{' '}
          Collections belong to the hospitals; platform revenue is NexCare's cut of them. Hospitals with no officer assigned appear as their own row — an unassigned hospital is a gap in the review chain, not missing data.
        </div>

        <div className="kpi-grid">
          <Kpi accent label="Regional officers" id="rTotalOfficers" subId="rTotalHospitals" value={regions ? (t.officers ?? 0) : '—'} sub={regions ? `${t.hospitals ?? 0} hospitals on the platform` : null} />
          <Kpi label="Platform revenue" id="rPlatformRevenue" value={regions ? money(t.platformRevenue) : '—'} sub="across every region" />
          <Kpi label="Hospital collections" id="rCollections" value={regions ? money(t.collections) : '—'} sub="the hospitals’ own money" />
          <Kpi label="Staff overseen" id="rStaff" subId="rDoctors" value={regions ? (t.staff ?? 0) : '—'} sub={regions ? `plus ${t.doctors ?? 0} doctors` : null} />
          {/* Only shown when there is something wrong to look at. */}
          {Boolean(t.unassignedHospitals) && (
            <Kpi label="Unassigned hospitals" id="rUnassigned" valueClass="bad" value={t.unassignedHospitals} sub="no officer — review chain blocked" />
          )}
        </div>

        <Panel title="Revenue by regional officer" hint="Share of total platform revenue">
          <div id="regionBarBody">
            {loading ? 'Loading…' : !rows.length ? <p className="empty">No regional officers configured.</p> : rows.map((r) => (
              <div className="bar-row" key={r.officerId}>
                <span className="name">{r.officerName}</span>
                <div className="bar-track"><div className={`bar-fill ${r.isAssigned ? '' : 'patient'}`} style={{ width: `${(r.platformRevenue / peak) * 100}%` }} /></div>
                <span className="amt">{money(r.platformRevenue)}</span>
                <span className="amt">{r.revenueShare}%</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Regions" hint="Click a row to see the hospitals under it" flush>
          <table className="rev">
            <thead>
              <tr>
                <th>Officer</th><th>Areas</th><th className="num">Hospitals</th><th>Load</th><th className="num">Doctors</th><th className="num">Staff</th>
                <th className="num">Beds free</th><th className="num">Collections</th><th className="num">Platform revenue</th><th className="num">Share</th>
              </tr>
            </thead>
            <tbody id="regionBody">
              {loading ? <tr><td colSpan={10} className="empty">Loading…</td></tr>
                : !regions ? <tr><td colSpan={10} className="empty">Could not load the regional overview.</td></tr>
                  : !rows.length ? <tr><td colSpan={10} className="empty">No regional officers configured.</td></tr>
                    : rows.map((r) => (
                      <RegionRows key={r.officerId} r={r} open={Boolean(openRegions[r.officerId])} onToggle={() => setOpenRegions((o) => ({ ...o, [r.officerId]: !o[r.officerId] }))} workloadPill={workloadPill} />
                    ))}
            </tbody>
          </table>
        </Panel>
      </>
    );
  }

  // ── Pricing controls ──────────────────────────────────────────────────
  function FeesTab() {
    const fees = d?.fees;
    return (
      <>
        <div className="note">
          Rates that are not tied to any one plan. They apply across the whole platform and take effect on the next read — every figure on this page is derived, so changing a rate here re-prices the reports immediately.
        </div>
        <Panel title="Cross-cutting fees" hint={fees && fees.updatedAt ? `last changed ${shortDate(fees.updatedAt)}` : ''} hintId="feeUpdated">
          <div className="field-grid" id="feeFields">
            {loading ? 'Loading…' : !fees ? <p className="muted">Could not load the fee configuration.</p> : FEE_FIELDS.map(([key, label, kind, help]) => (
              <div className="field" key={key}>
                <label htmlFor={`fee-${key}`}>{label}</label>
                <input id={`fee-${key}`} type="number" min="0" step={kind === 'percent' ? '0.1' : '1'} value={feeForm[key] ?? ''} onChange={(e) => setFeeForm((f) => ({ ...f, [key]: e.target.value }))} />
                <span className="muted">{help}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <button type="button" className="btn primary" id="saveFeesBtn" onClick={saveFees}>Save pricing</button>
          </div>
        </Panel>
      </>
    );
  }

  // Plain render functions, called (not mounted as components) so a keystroke
  // in a fee input does not remount the tab and drop focus.
  const renderTab = { streams: StreamsTab, hospitals: HospitalsTab, plans: PlansTab, patients: PatientsTab, regions: RegionsTab, fees: FeesTab }[tab];

  return (
    <SuPage className="su-revenue" title="Revenue Model">
      <div className="note">
        <strong>NexCare makes money in five ways, from two payers.</strong>{' '}
        Hospitals buy the platform on a subscription priced by how many staff accounts they run; patients buy convenience, per booking or with a Care+ membership. Small per-transaction fees sit on top. Doctors, nurses, administrative and ambulance staff are all hospital employees, so none of them is billed separately — their seats are what the hospital's plan is priced on. Everything below is derived at read time from the staff directory, the bills, the appointments and the dispatches, so a total can never drift away from what actually happened. What a hospital collects from its own patients is that <em>hospital's</em> revenue and is shown to its manager, not counted here.
      </div>

      <div className="tab-container" id="revenueTabs">
        {TABS.map(([key, label]) => (
          <button key={key} type="button" className={`tab-btn${tab === key ? ' active' : ''}`} data-tab={key} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      <div className="tab-section active" id={`tab-${tab}`}>
        {renderTab()}
      </div>
    </SuPage>
  );
}

function RegionRows({ r, open, onToggle, workloadPill }) {
  return (
    <>
      <tr style={{ cursor: 'pointer' }} onClick={onToggle}>
        <td>
          <strong>{r.officerName}</strong>
          {!r.isAssigned && <> <span className="pill pending">gap</span></>}
          <br /><span className="muted">{r.officerEmail}</span>
        </td>
        <td className="muted">{r.areas.length ? r.areas.join(', ') : '—'}</td>
        <td className="num">{r.hospitals}{r.pendingVerifications ? <><br /><span className="muted">{r.pendingVerifications} pending</span></> : null}</td>
        <td><span className={`pill ${workloadPill(r.workloadLevel)}`}>{r.workloadLevel}</span></td>
        <td className="num">{r.doctors}</td>
        <td className="num">{r.staff}</td>
        <td className="num">{r.availableBeds}/{r.totalBeds}</td>
        <td className="num muted">{money(r.collections)}</td>
        <td className="num" style={{ fontWeight: 700 }}>{money(r.platformRevenue)}</td>
        <td className="num">{r.revenueShare}%</td>
      </tr>
      <tr id={`region-${r.officerId}`} style={{ display: open ? '' : 'none' }}>
        <td colSpan={10} style={{ background: '#F9FAFB', padding: 0 }}>
          {!r.byHospital || !r.byHospital.length ? <p className="empty">No hospitals in this region yet.</p> : (
            <table className="rev" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Hospital</th><th>City</th><th>Status</th><th className="num">Doctors</th><th className="num">Beds free</th>
                  <th className="num">Collections</th><th className="num">Unpaid Balance</th><th className="num">Platform revenue</th>
                </tr>
              </thead>
              <tbody>
                {r.byHospital.map((h) => (
                  <tr key={h.hospitalId}>
                    <td>{h.hospitalName}<br /><span className="muted">{h.hospitalId}</span></td>
                    <td className="muted">{h.city}</td>
                    <td><span className={pillFor(h.verificationStatus)}>{unscore(h.verificationStatus)}</span></td>
                    <td className="num">{h.doctors}</td>
                    <td className="num">{h.availableBeds}/{h.totalBeds}</td>
                    <td className="num muted">{money(h.collections)}</td>
                    <td className="num muted">{money(h.outstanding)}</td>
                    <td className="num" style={{ fontWeight: 600 }}>{money(h.platformRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </td>
      </tr>
    </>
  );
}
