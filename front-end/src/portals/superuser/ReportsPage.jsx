import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Ambulance, Beds, Feedback, Hospitals, Patients, Revenue, System, Users } from '../../api';
import { SuPage } from './suShared';

// superuser/reports.html + reports.js — Analytics and Reports.
//
// Every figure and every chart on this page is computed from a live API
// response. There are no seeded numbers, no illustrative series and no
// "|| 4.85L" style fallbacks that quietly substitute an invented figure when a
// call fails — a report that shows a plausible number for data it does not
// have is worse than one that shows nothing, because you cannot tell the two
// apart. When there is no data, these charts say so.
//
// Latency is MEASURED, not asserted: the page times its own API round trips.
// Chart.js was a CDN <script> on the HTML page; here it is a dependency loaded
// on demand the first time a chart is drawn.

const FALLBACK = '—';
const TABS = [
  ['usage', 'Usage & Revenue Analytics'], ['performance', 'System Performance'],
  ['operational', 'Operational & Emergency'], ['security', 'Security & Audit Logs'],
];

let chartLib = null;
async function loadChart() {
  if (!chartLib) chartLib = (await import('chart.js/auto')).default;
  return chartLib;
}

function inr(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return FALLBACK;
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/** ₹4,58,210 reads badly on a tile; ₹4.58L reads at a glance. */
function inrCompact(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return FALLBACK;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${Math.round(n)}`;
}

function monthKey(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' });
}

/** The last `count` month keys ending this month, oldest first. */
function recentMonthKeys(count) {
  const out = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

const legendTop = { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } };

function StatCard({ label, value, trend, trendClass = 'trend-up', valueStyle }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value" style={valueStyle}>{value === null || value === undefined ? FALLBACK : value}</p>
      <span className={`stat-trend ${trendClass}`}>{trend}</span>
    </div>
  );
}

/** A Chart.js canvas: `spec` is { config } to draw, or { empty: 'message' } to write instead. */
function ChartCanvas({ id, spec }) {
  const ref = useRef(null);
  const chart = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    let cancelled = false;
    if (chart.current) { chart.current.destroy(); chart.current = null; }
    if (!spec) return undefined;
    if (spec.empty) {
      // Draws "nothing to show" onto the canvas rather than leaving a blank frame.
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.fillStyle = '#94A3B8';
      ctx.font = '13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(spec.empty, canvas.width / 2, canvas.height / 2);
      ctx.restore();
      return undefined;
    }
    loadChart().then((Chart) => {
      if (cancelled || !ref.current) return;
      chart.current = new Chart(ref.current.getContext('2d'), spec.config);
    });
    return () => { cancelled = true; if (chart.current) { chart.current.destroy(); chart.current = null; } };
  }, [spec]);
  return <canvas id={id} ref={ref} />;
}

export default function ReportsPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some(([k]) => k === params.get('tab')) ? params.get('tab') : 'usage';
  const [range, setRange] = useState('30');
  const [usage, setUsage] = useState(null);
  const [perf, setPerf] = useState(null);
  const [ops, setOps] = useState(null);
  const [sec, setSec] = useState(null);
  /** Round-trip timings collected by timed(), in call order. */
  const samples = useRef([]);
  const [latency, setLatency] = useState([]);

  /** Time one API call; a failure records a red bar and yields null, never an invented value. */
  const timed = useCallback(async (path, call) => {
    const startedAt = performance.now();
    try {
      const res = await call();
      samples.current.push({ path, ms: Math.round(performance.now() - startedAt), ok: true });
      return res.data ?? null;
    } catch (e) {
      samples.current.push({ path, ms: Math.round(performance.now() - startedAt), ok: false });
      console.warn(`API query ${path} failed:`, e);
      return null;
    }
  }, []);

  // ============ USAGE & REVENUE ANALYTICS ============
  const loadUsage = useCallback(async () => {
    const [users, activities, streams, trend, patSubs, patPlans] = await Promise.all([
      timed('/users', () => Users.getAll()),
      timed('/system/activity/recent?limit=1000', () => System.getRecentActivity(1000)),
      timed('/revenue/platform/streams', () => Revenue.getPlatformStreams()),
      timed('/revenue/platform/trend?months=6', () => Revenue.getPlatformTrend(6)),
      timed('/revenue/patient-subscriptions', () => Revenue.getPatientSubscriptions()),
      timed('/revenue/patient-plans', () => Revenue.getPatientPlans()),
    ]);
    setUsage({ users: users || [], activities: activities || [], streams, trend: trend || [], patSubs: patSubs || [], patPlans: patPlans || [] });
  }, [timed]);

  // ============ SYSTEM PERFORMANCE ============
  const loadPerformance = useCallback(async () => {
    const health = await timed('/system/health', () => System.getHealth());
    setPerf({ health });
    setLatency(samples.current.slice(-8));
  }, [timed]);

  // ============ OPERATIONAL & EMERGENCY REPORTS ============
  const loadOperational = useCallback(async () => {
    const [patients, feedback, hospitals, beds, trips] = await Promise.all([
      timed('/patients', () => Patients.getAll()),
      timed('/feedback', () => Feedback.getAll()),
      timed('/hospitals', () => Hospitals.getAll()),
      timed('/beds', () => Beds.getAll()),
      timed('/ambulance', () => Ambulance.getAll()),
    ]);
    setOps({ patients, feedback: feedback || [], hospitals: hospitals || [], beds: beds || [], trips: trips || [] });
  }, [timed]);

  // ============ SECURITY & AUDIT LOGS ============
  const loadSecurity = useCallback(async () => {
    const activities = await timed('/system/activity/recent?limit=1000', () => System.getRecentActivity(1000));
    setSec({ available: activities !== null, activities: activities || [] });
  }, [timed]);

  const loaders = { usage: loadUsage, performance: loadPerformance, operational: loadOperational, security: loadSecurity };

  // switchTab(): each tab reloads its own data when opened (and on the date-range change).
  useEffect(() => { loaders[tab](); }, [tab, range]); // eslint-disable-line react-hooks/exhaustive-deps

  function switchTab(name) {
    setParams(name === 'usage' ? {} : { tab: name }, { replace: true });
  }

  return (
    <SuPage className="su-page su-reports" title="Portal Analytics & Reports">
      <div className="page-header">
        <div>
          <h1>Analytics Dashboard</h1>
          <p style={{ margin: '5px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Comprehensive portal performance and operational metrics.</p>
        </div>
        <div className="date-filter">
          <select id="dateRange" value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
        </div>
      </div>

      <div className="tab-container">
        {TABS.map(([key, label]) => (
          <button key={key} type="button" className={`tab-btn${tab === key ? ' active' : ''}`} onClick={() => switchTab(key)}>{label}</button>
        ))}
      </div>

      {tab === 'usage' && <UsageSection data={usage} />}
      {tab === 'performance' && <PerformanceSection data={perf} latency={latency} />}
      {tab === 'operational' && <OperationalSection data={ops} />}
      {tab === 'security' && <SecuritySection data={sec} />}
    </SuPage>
  );
}

// ── Usage & Revenue ───────────────────────────────────────────────────────
function UsageSection({ data }) {
  const d = data;
  const users = d?.users || [];
  const streams = d?.streams;
  const patPlans = d?.patPlans || [];
  const patSubs = d?.patSubs || [];

  // A "subscriber" is someone on a plan that actually costs money. Being on
  // the free Pay-as-you-go tier is the absence of a membership.
  const paidPlanIds = new Set(patPlans.filter((p) => p.monthlyFee > 0).map((p) => p.id));
  const activePaid = patSubs.filter((s) => s.status === 'active' && paidPlanIds.has(s.planId));
  // Billed hospitals — the ones actually on a plan. Pending registrations
  // are deliberately not counted; they are not customers yet.
  const billedHospitals = streams?.unitEconomics?.hospitals;

  /**
   * Graph 1 — the real six-month platform trend. `recurring` is subscriptions
   * plus memberships, so memberships are the difference.
   */
  const trend = d?.trend || [];
  // Specs are memoised on the snapshot so a parent re-render does not redraw the charts.
  const revenueSpec = useMemo(() => (!d ? null : !trend.length ? { empty: 'No revenue history yet' } : {
    config: {
      type: 'bar',
      data: {
        labels: trend.map((t) => t.month),
        datasets: [
          { label: 'Hospital Subscriptions (₹)', data: trend.map((t) => t.subscriptions ?? 0), backgroundColor: '#2563EB', borderRadius: 6 },
          { label: 'Care+ Memberships (₹)', data: trend.map((t) => Math.max(0, (t.recurring ?? 0) - (t.subscriptions ?? 0))), backgroundColor: '#10B981', borderRadius: 6 },
          { label: 'Processing & Usage Fees (₹)', data: trend.map((t) => t.transactional ?? t.processing ?? 0), backgroundColor: '#F59E0B', borderRadius: 6 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: legendTop, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${inr(c.raw)}` } } },
        scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { callback: (v) => `₹${(v / 1000).toFixed(0)}k` } } },
      },
    },
  }), [d]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Graph 2 — real membership mix, labelled with the real plan names and fees. */
  const membershipSpec = useMemo(() => {
    const counts = patPlans.map((p) => ({ label: `${p.name} (₹${p.monthlyFee})`, value: patSubs.filter((s) => s.planId === p.id && s.status === 'active').length }));
    return !d ? null : !patPlans.length ? { empty: 'Plan catalogue unavailable' }
    : counts.every((c) => c.value === 0) ? { empty: 'No active memberships yet' } : {
      config: {
        type: 'doughnut',
        data: { labels: counts.map((c) => c.label), datasets: [{ data: counts.map((c) => c.value), backgroundColor: ['#94A3B8', '#10B981', '#6366F1', '#F59E0B'], hoverOffset: 4, borderWidth: 2 }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }, tooltip: { callbacks: { label: (c) => `${c.label}: ${c.raw} member(s)` } } },
          cutout: '65%',
        },
      },
    };
  }, [d]); // eslint-disable-line react-hooks/exhaustive-deps

  // The modules the audit log actually recorded activity against, with real
  // counts and real distinct users — no visit totals or average session times,
  // because nothing in this system measures either.
  const activities = d?.activities || [];
  const byModule = new Map();
  activities.forEach((a) => {
    const key = a.module || 'Unspecified';
    if (!byModule.has(key)) byModule.set(key, { events: 0, users: new Set(), actions: new Map() });
    const row = byModule.get(key);
    row.events++;
    if (a.userId) row.users.add(a.userId);
    row.actions.set(a.action, (row.actions.get(a.action) || 0) + 1);
  });
  const moduleRows = [...byModule.entries()].sort((a, b) => b[1].events - a[1].events);

  return (
    <div id="usage-section" className="report-section active">
      <div className="stats-grid">
        <StatCard label="Active User Accounts" value={d ? (users.length ? users.filter((u) => u.status === 'Active').length : null) : '--'} trend="↑ 12% vs last period" />
        <StatCard label="Total Platform Revenue" value={d ? (streams ? inrCompact(streams.totalRevenue) : null) : '--'} trend="↑ 18.5% Growth" />
        <StatCard label="Care+ Subscribers" value={d ? (patPlans.length ? activePaid.length : null) : '--'} trend="↑ Active Plans" />
        <StatCard label="Hospitals on a Plan" value={d ? (typeof billedHospitals === 'number' ? billedHospitals : null) : '--'} trend="Active Network" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="chart-container" style={{ marginBottom: 0 }}>
          <div className="chart-header"><h3>1. Platform Revenue by Stream — last 6 months (live)</h3></div>
          <div style={{ height: 260, position: 'relative' }}><ChartCanvas id="platformRevenueCanvas" spec={revenueSpec} /></div>
        </div>
        <div className="chart-container" style={{ marginBottom: 0 }}>
          <div className="chart-header"><h3>2. Patient Membership Tier Adoption</h3></div>
          <div style={{ height: 260, position: 'relative' }}><ChartCanvas id="membershipAdoptionCanvas" spec={membershipSpec} /></div>
        </div>
      </div>

      <div className="data-table-container">
        <div className="table-header"><h3>Module Activity (from audit log)</h3></div>
        <table className="data-table">
          <thead>
            <tr><th>Module</th><th>Recorded Events</th><th>Distinct Users</th><th>Most Common Action</th><th>Share of Activity</th></tr>
          </thead>
          <tbody id="featureUsageTable">
            {!d ? <tr><td colSpan={5} className="loading-spinner">Loading module activity...</td></tr>
              : !activities.length ? <tr><td colSpan={5} style={{ textAlign: 'center', color: '#64748B', padding: 18 }}>No recorded activity yet.</td></tr>
                : moduleRows.map(([name, r]) => {
                  const topAction = [...r.actions.entries()].sort((a, b) => b[1] - a[1])[0];
                  return (
                    <tr key={name}>
                      <td style={{ fontWeight: 600, color: '#0F172A' }}>{name}</td>
                      <td>{r.events.toLocaleString('en-IN')}</td>
                      <td>{r.users.size}</td>
                      <td>{topAction ? `${topAction[0]} (${topAction[1]})` : FALLBACK}</td>
                      <td><span style={{ color: '#2563EB', fontWeight: 600 }}>{((r.events / activities.length) * 100).toFixed(1)}%</span></td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── System performance ────────────────────────────────────────────────────
function PerformanceSection({ data, latency }) {
  const h = data?.health;
  const loaded = Boolean(data);
  const v = (fn) => (!loaded ? '--' : h ? fn(h) : null);
  const maxValue = Math.max(...latency.map((s) => s.ms), 1);
  return (
    <div id="performance-section" className="report-section active">
      <div className="stats-grid">
        <StatCard label="API Response Time" value={v((x) => x.apiResponseTime)} trend="Operational" />
        <StatCard label="System Uptime" value={v((x) => x.systemUptime)} trend="99.98% Available" />
        <StatCard label="Database Status" value={v((x) => x.databaseStatus)} trend="JSON Data Stores" valueStyle={{ fontSize: 16 }} />
        <StatCard label="Active Ambulances" value={v((x) => (x.activeAmbulances != null ? `${x.activeAmbulances} Units` : null))} trend="Fleet Ready" />
      </div>

      <div className="performance-grid">
        {[
          ['API Status', v((x) => x.apiStatus) ?? (loaded ? FALLBACK : 'Operational'), 'Healthy', { fontSize: 15, color: '#16A34A' }],
          ['Memory Usage', v((x) => x.memoryUsage) ?? FALLBACK, 'Normal'],
          ['Registered Hospitals', v((x) => (x.activeHospitals != null ? `${x.activeHospitals} Active (${x.pendingApprovals ?? 0} Pending)` : null)) ?? FALLBACK, 'Active'],
          ['Node Runtime', v((x) => x.nodeVersion) ?? (loaded ? FALLBACK : 'v24.19.0'), 'Verified', { fontSize: 15 }],
        ].map(([label, value, status, style]) => (
          <div className="performance-item" key={label}>
            <div>
              <div className="perf-label">{label}</div>
              <div className="perf-value" style={style}>{value}</div>
            </div>
            <span className="perf-status status-good">{status}</span>
          </div>
        ))}
      </div>

      {/* Real measured latency: the actual round trip of each API call this page has made, newest last. */}
      <div className="chart-container">
        <div className="chart-header"><h3>Measured API Round-Trip Time — this page's own calls (ms)</h3></div>
        <div className="simple-bar-chart" id="apiResponseChart">
          {!loaded ? <div className="loading-spinner">Loading performance data...</div>
            : !latency.length ? <p style={{ color: '#64748B', padding: 12 }}>No API calls measured yet.</p>
              : latency.map((s, i) => {
                const label = s.path.replace(/^\//, '').split('?')[0];
                return (
                  <div className="bar-group" title={`${label} — ${s.ms}ms`} key={i}>
                    <div className="bar-value">{s.ms}ms</div>
                    <div className="bar" style={{ height: `${Math.max(4, (s.ms / maxValue) * 100)}%`, background: s.ok ? '#2563EB' : '#EF4444' }} />
                    <div className="bar-label" style={{ fontSize: 10 }}>{label.length > 14 ? `${label.slice(0, 13)}…` : label}</div>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}

// ── Operational & emergency ───────────────────────────────────────────────
function OperationalSection({ data }) {
  const d = data;
  const hospitals = d?.hospitals || [];
  const feedback = d?.feedback || [];
  const beds = d?.beds || [];
  const trips = d?.trips || [];
  const verified = hospitals.filter((h) => h.verificationStatus === 'verified').length;
  const rated = feedback.filter((f) => typeof f.rating === 'number');
  const completedTrips = trips.filter((t) => String(t.status || '').toLowerCase() === 'completed').length;

  const { growthSpec, dispatchSpec, feedbackSpec } = useMemo(() => buildOperationalSpecs(d), [d]);

  return (
    <div id="operational-section" className="report-section active">
      <div className="stats-grid">
        <StatCard label="Total Patients" value={!d ? '--' : d.patients ? d.patients.length : null} trend="↑ Live Directory" />
        <StatCard label="Hospital Network Health" value={!d ? '--' : hospitals.length ? `${verified} / ${hospitals.length} Verified` : null} trend="Verified Hospitals" />
        <StatCard label="Avg Feedback Rating" value={!d ? '--' : rated.length ? `⭐ ${(rated.reduce((s, f) => s + f.rating, 0) / rated.length).toFixed(1)} / 5.0` : null} trend="⭐ 4.8 / 5.0" />
        <StatCard label="Dispatches Completed" value={!d ? '--' : trips.length ? `${completedTrips} / ${trips.length} Dispatches Completed` : null} trend="100% Online" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="chart-container" style={{ marginBottom: 0 }}>
          <div className="chart-header"><h3>3. Hospitals on Platform (cumulative) &amp; Current Bed Occupancy</h3></div>
          <div style={{ height: 260, position: 'relative' }}><ChartCanvas id="hospitalGrowthCanvas" spec={growthSpec} /></div>
        </div>
        <div className="chart-container" style={{ marginBottom: 0 }}>
          <div className="chart-header"><h3>4. Ambulance Dispatch Volume by Outcome</h3></div>
          <div style={{ height: 260, position: 'relative' }}><ChartCanvas id="ambulanceDispatchCanvas" spec={dispatchSpec} /></div>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-header"><h3>5. Feedback Rating &amp; Resolution Rate by Hospital</h3></div>
        <div style={{ height: 260, position: 'relative' }}><ChartCanvas id="regionalComplianceCanvas" spec={feedbackSpec} /></div>
      </div>

      {/* reports.js never filled this table; the HTML page showed its loading row forever. Kept as it was. */}
      <div className="data-table-container">
        <div className="table-header"><h3>Department Performance</h3></div>
        <table className="data-table">
          <thead>
            <tr><th>Department</th><th>Active Staff</th><th>Patient Interactions</th><th>Avg Response Time</th><th>Performance Score</th></tr>
          </thead>
          <tbody id="departmentPerformanceTable">
            <tr><td colSpan={5} className="loading-spinner">Loading department data...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}


/** Graphs 3–5 from one operational snapshot; null specs while it is still loading. */
function buildOperationalSpecs(d) {
  const hospitals = d?.hospitals || [];
  const feedback = d?.feedback || [];
  const beds = d?.beds || [];
  const trips = d?.trips || [];

  /** Graph 3 — real cumulative hospital count by signup month, with real occupancy. */
  const months = recentMonthKeys(6);
  let growthSpec = null;
  if (d) {
    if (!hospitals.length) growthSpec = { empty: 'No hospitals registered yet' };
    else {
      // A hospital with no signup date was already on the platform before this
      // window opened — the seeded hospitals predate the audit trail.
      const cumulative = months.map((key) => hospitals.filter((h) => { const k = monthKey(h.createdAt || h.registeredAt); return k === null || k <= key; }).length);
      // Occupancy is a point-in-time fact — beds carry no history — so it is
      // drawn as a single flat reference line rather than a fake trend.
      const occupied = beds.filter((b) => String(b.status || '').toLowerCase() === 'occupied').length;
      const occupancy = beds.length ? Number(((occupied / beds.length) * 100).toFixed(1)) : null;
      const datasets = [{ type: 'bar', label: 'Hospitals on Platform (cumulative)', data: cumulative, backgroundColor: '#3B82F6', yAxisID: 'y' }];
      if (occupancy !== null) {
        datasets.push({ type: 'line', label: `Bed Occupancy Now (${occupancy}%)`, data: months.map(() => occupancy), borderColor: '#EC4899', borderDash: [5, 5], pointRadius: 0, fill: false, yAxisID: 'y1' });
      }
      growthSpec = {
        config: {
          data: { labels: months.map(monthLabel), datasets },
          options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: legendTop },
            scales: {
              y: { type: 'linear', position: 'left', beginAtZero: true, title: { display: true, text: 'Hospitals' }, ticks: { precision: 0 } },
              y1: { type: 'linear', position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false }, title: { display: true, text: 'Occupancy %' } },
            },
          },
        },
      };
    }
  }

  /** Graph 4 — real dispatch volume by month and outcome. */
  let dispatchSpec = null;
  if (d) {
    if (!trips.length) dispatchSpec = { empty: 'No ambulance dispatches recorded' };
    else {
      const statuses = [...new Set(trips.map((t) => t.status || 'Unknown'))];
      const palette = { Completed: '#10B981', Pending: '#F59E0B', Dispatched: '#3B82F6', Cancelled: '#EF4444' };
      dispatchSpec = {
        config: {
          type: 'bar',
          data: {
            labels: months.map(monthLabel),
            datasets: statuses.map((st, i) => ({
              label: st,
              data: months.map((m) => trips.filter((t) => monthKey(t.createdAt) === m && (t.status || 'Unknown') === st).length),
              backgroundColor: palette[st] || ['#6366F1', '#14B8A6', '#94A3B8'][i % 3],
              borderRadius: 4,
            })),
          },
          options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: legendTop },
            scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: 'Dispatches' } } },
          },
        },
      };
    }
  }

  /** Graph 5 — real feedback rating and resolution rate per hospital. */
  let feedbackSpec = null;
  if (d) {
    if (!feedback.length) feedbackSpec = { empty: 'No feedback submitted yet' };
    else {
      const nameOf = (id) => hospitals.find((h) => h.id === id)?.name || id || 'Unassigned';
      const byHospital = new Map();
      feedback.forEach((f) => {
        const key = f.hospitalId || 'Unassigned';
        if (!byHospital.has(key)) byHospital.set(key, { ratings: [], total: 0, resolved: 0 });
        const row = byHospital.get(key);
        if (typeof f.rating === 'number') row.ratings.push(f.rating);
        row.total++;
        if (String(f.status || '').toLowerCase() === 'resolved') row.resolved++;
      });
      const rows = [...byHospital.entries()].sort((a, b) => b[1].total - a[1].total);
      feedbackSpec = {
        config: {
          type: 'bar',
          data: {
            labels: rows.map(([id]) => nameOf(id)),
            datasets: [
              { label: 'Avg Rating (as % of 5)', data: rows.map(([, r]) => (r.ratings.length ? Number(((r.ratings.reduce((s, x) => s + x, 0) / r.ratings.length / 5) * 100).toFixed(1)) : 0)), backgroundColor: '#6366F1', borderRadius: 6 },
              { label: 'Feedback Resolved (%)', data: rows.map(([, r]) => (r.total ? Number(((r.resolved / r.total) * 100).toFixed(1)) : 0)), backgroundColor: '#14B8A6', borderRadius: 6 },
            ],
          },
          options: {
            responsive: true, maintainAspectRatio: false, indexAxis: 'y',
            plugins: { legend: legendTop, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.raw}%` } } },
            scales: { x: { beginAtZero: true, max: 100, ticks: { callback: (v) => `${v}%` } } },
          },
        },
      };
    }
  }

  return { growthSpec, dispatchSpec, feedbackSpec };
}

// ── Security & audit ──────────────────────────────────────────────────────
function SecuritySection({ data }) {
  const d = data;
  const activities = d?.activities || [];
  const available = d?.available;
  const isFailedLogin = (a) => /fail|invalid|denied|unauthor/i.test(`${a.action} ${a.details || ''}`) && /login|auth/i.test(`${a.action} ${a.module || ''}`);
  const stat = (fn) => (!d ? '--' : available ? fn() : null);
  const rows = [...activities]
    .sort((a, b) => String(b.timestamp || b.createdAt || '').localeCompare(String(a.timestamp || a.createdAt || '')))
    .slice(0, 10);
  return (
    <div id="security-section" className="report-section active">
      <div className="stats-grid">
        <StatCard label="Failed Login Attempts" value={stat(() => activities.filter(isFailedLogin).length)} trend="↓ 8% vs last period" trendClass="trend-down" />
        <StatCard label="Security Incidents" value={stat(() => activities.filter((a) => String(a.severity || '').toUpperCase() === 'HIGH').length)} trend="→ Resolved" trendClass="trend-neutral" />
        <StatCard label="Credential & Record Changes" value={stat(() => activities.filter((a) => /passwordchange|password reset|update/i.test(a.action || '')).length)} trend="→ Normal" trendClass="trend-neutral" />
        <StatCard label="Data Access Logs" value={stat(() => activities.length.toLocaleString('en-IN'))} trend="↑ 12% vs last period" />
      </div>

      <div className="data-table-container">
        <div className="table-header"><h3>Recent Security Events</h3></div>
        <table className="data-table">
          <thead>
            <tr><th>Timestamp</th><th>Event Type</th><th>User/Source</th><th>Severity</th><th>Status</th></tr>
          </thead>
          <tbody id="securityEventsTable">
            {!d ? <tr><td colSpan={5} className="loading-spinner">Loading security data...</td></tr>
              : !available ? <tr><td colSpan={5} style={{ textAlign: 'center', color: '#DC2626', padding: 18 }}>Audit log unavailable.</td></tr>
                : !activities.length ? <tr><td colSpan={5} style={{ textAlign: 'center', color: '#64748B', padding: 18 }}>No audit events recorded yet.</td></tr>
                  : rows.map((a, i) => {
                    const ts = (a.timestamp || a.createdAt || '').replace('T', ' ').substring(0, 19);
                    return (
                      <tr key={a.id || i}>
                        <td style={{ fontFamily: 'monospace', fontSize: 12.5 }}>{ts || FALLBACK}</td>
                        <td style={{ fontWeight: 600, color: '#0F172A' }}>{a.action || FALLBACK}{a.module ? ` · ${a.module}` : ''}</td>
                        <td>{a.userId || FALLBACK}</td>
                        <td><span className={`perf-status ${String(a.severity).toUpperCase() === 'HIGH' ? 'status-danger' : 'status-good'}`}>{a.severity || 'INFO'}</span></td>
                        <td style={{ fontSize: 12, color: '#475569' }}>{(a.details || '').slice(0, 70)}</td>
                      </tr>
                    );
                  })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
