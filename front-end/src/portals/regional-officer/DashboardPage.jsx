import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { Hospitals } from '../../api';
import { useAuth } from '../../context/AuthContext';
import {
  DetailsLink, Hero, ICONS, SeverityBadge, StatCard, Stars, StatusBadge, formatINR, useRegionalCss,
} from './roShared';

// regional-officer/dashboard.html + dashboard.js: the overview from
// GET /hospitals/regional/overview plus the top four performance alerts.

const QUICK_ACTIONS = [
  { to: '/regional-officer/performance-alerts', bg: 'bg-orange', icon: ICONS.triangle(), title: 'Performance Alerts', text: 'Underperforming hospitals & issues' },
  { to: '/regional-officer/hospital-comparison', bg: 'bg-blue', icon: ICONS.bars(), title: 'Compare Hospitals', text: 'Side-by-side metrics in your area' },
  { to: '/regional-officer/complaints', bg: 'bg-red', icon: ICONS.chat('#DC2626', 22), title: 'Patient Complaints', text: 'Track feedback & resolution status' },
  { to: '/regional-officer/hospital-approvals', bg: 'bg-green', icon: ICONS.homeCheck(), title: 'Hospital Approvals', text: 'Review pending registrations' },
];

const occupancyClass = (rate) => (rate >= 90 ? 'bad' : rate >= 80 ? 'warn' : 'good');

export default function DashboardPage() {
  useRegionalCss();
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [hospitals, setHospitals] = useState(null);
  const [revenueList, setRevenueList] = useState([]);
  const [alerts, setAlerts] = useState({ total: 0, alerts: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // The alerts call failing must not take the overview down with it (the
      // HTML fell back to zero alerts when that response was not a success).
      const [overviewRes, alertsRes] = await Promise.all([
        Hospitals.getRegionalOverview().catch((err) => { console.error('Dashboard initialization error:', err); return null; }),
        Hospitals.getPerformanceAlerts().catch(() => null),
      ]);
      if (cancelled) return;
      if (!overviewRes) {
        setError('Could not load regional overview. Check that the backend is running.');
        return;
      }
      const data = overviewRes.data || {};
      setSummary(data.summary || {});
      setHospitals(data.hospitals || []);
      setRevenueList(data.hospitalRevenueList || []);
      setAlerts(alertsRes?.data || { total: 0, alerts: [] });
    })();
    return () => { cancelled = true; };
  }, []);

  const s = summary || {};
  const top = (alerts.alerts || []).slice(0, 4);

  return (
    <>
      <Header title="Regional Overview" />
      <div className="page-body">
        <Hero title={`Welcome back, ${user?.name || 'Regional Officer'}`}>
          Regional hospitals summary — capacity, staffing, inventory, and patient feedback.
        </Hero>

        <div className="stats-grid" role="region" aria-label="Regional summary statistics">
          <StatCard label="Assigned Hospitals" value={summary ? s.assignedHospitals ?? 0 : '—'}
            sub={summary ? `${s.verifiedHospitals ?? 0} verified · ${s.pendingVerifications ?? 0} pending` : '— verified'}
            icon={ICONS.home()} tone="blue" />
          <StatCard label="Total Doctors" value={summary ? s.totalDoctors ?? 0 : '—'} sub="Across your hospitals" icon={ICONS.users()} tone="purple" />
          <StatCard label="Available Beds" value={summary ? s.availableBeds ?? 0 : '—'}
            sub={summary ? `${s.averageOccupancy ?? 0}% avg occupancy` : '— avg occupancy'} icon={ICONS.bed()} tone="green" />
          <StatCard label="Active Alerts" value={summary ? alerts.total ?? 0 : '—'}
            sub={summary ? `${alerts.critical ?? 0} critical · ${alerts.warning ?? 0} warning` : 'Performance issues'}
            icon={ICONS.warning()} tone="orange" />
          <StatCard label="Open Complaints" value={summary ? s.openComplaints ?? 0 : '—'}
            sub={summary ? `${s.averageSatisfaction ?? 0}/5 avg satisfaction` : '— avg satisfaction'} icon={ICONS.chat()} tone="red" />
          <StatCard label="Low Stock Items" value={summary ? s.lowStockItems ?? 0 : '—'} sub="Items below reorder level" icon={ICONS.box()} tone="orange" />
        </div>

        <section className="panel" aria-labelledby="quick-actions-title">
          <h2 className="section-title" id="quick-actions-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            {QUICK_ACTIONS.map((a) => (
              <Link to={a.to} className="action-card" key={a.to}>
                <div className={`action-icon ${a.bg}`} aria-hidden="true">{a.icon}</div>
                <div className="action-info">
                  <h3>{a.title}</h3>
                  <p>{a.text}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="panel" aria-labelledby="hospitals-title">
          <div className="panel-header">
            <h2 className="section-title" id="hospitals-title" style={{ margin: 0 }}>Hospitals Under Your Oversight</h2>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">List of hospitals assigned to you with key performance indicators</caption>
              <thead>
                <tr>
                  <th scope="col">Hospital</th>
                  <th scope="col">City</th>
                  <th scope="col">Occupancy</th>
                  <th scope="col">Doctors</th>
                  <th scope="col">Satisfaction</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody id="hospitalsTableBody">
                {error ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#DC2626' }}>{error}</td></tr>
                ) : hospitals === null ? (
                  <tr><td colSpan={7} className="empty-state">Loading hospitals…</td></tr>
                ) : !hospitals.length ? (
                  <tr><td colSpan={7} className="empty-state">No hospitals assigned to you yet.</td></tr>
                ) : hospitals.map((h) => (
                  <tr key={h.hospitalId}>
                    <td>
                      <strong>{h.hospitalName}</strong>
                      <div style={{ fontSize: 12, color: '#6A7282', marginTop: 2 }}>{h.type || ''} · {h.totalBeds} beds</div>
                    </td>
                    <td>{h.city || '—'}</td>
                    <td>
                      <span className={`value ${occupancyClass(h.bedOccupancyRate)}`} style={{ fontWeight: 700 }}>
                        {h.bedOccupancyRate}%
                      </span>
                    </td>
                    <td>{h.doctorCount}</td>
                    <td>{h.patientSatisfactionScore > 0 ? <Stars rating={h.patientSatisfactionScore} /> : '—'}</td>
                    <td><StatusBadge status={h.verificationStatus} /></td>
                    <td><DetailsLink id={h.hospitalId} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel" aria-labelledby="revenue-title">
          <div className="panel-header">
            <h2 className="section-title" id="revenue-title" style={{ margin: 0 }}>Regional Subscription Revenue</h2>
          </div>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
            <StatCard label="Total Regional Revenue" value={summary ? formatINR(s.totalRegionalRevenue ?? 0) : '—'} sub="Cumulative subscription income" />
            <StatCard label="Revenue This Month" value={summary ? formatINR(s.revenueThisMonth ?? 0) : '—'} sub="Monthly collected" />
            <StatCard label="Revenue This Year" value={summary ? formatINR(s.revenueThisYear ?? 0) : '—'} sub="YTD collected" />
            <StatCard label="Active Paid Hospitals" value={summary ? s.activePaidHospitals ?? 0 : '—'} sub="Current active subscriptions" />
            <StatCard label="Pending Renewals" value={summary ? s.pendingRenewals ?? 0 : '—'} sub="Awaiting payment" />
            <StatCard label="Expired Subscriptions" value={summary ? s.expiredSubscriptions ?? 0 : '—'} sub="Lapsed contracts" />
            <StatCard label="Renewals Due Soon" value={summary ? s.renewalsDueSoon ?? 0 : '—'} sub="Due in next 60 days" />
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hospital</th>
                  <th>Subscription Plan</th>
                  <th>Last Payment</th>
                  <th>Amount</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="revenueTableBody">
                {hospitals === null && !error ? (
                  <tr><td colSpan={6} className="empty-state">Loading subscription revenue data…</td></tr>
                ) : !revenueList.length ? (
                  <tr><td colSpan={6} className="empty-state">No subscription revenue data found for this region.</td></tr>
                ) : revenueList.map((item) => (
                  <tr key={item.hospitalId}>
                    <td><strong>{item.hospitalName}</strong><div style={{ fontSize: 11, color: '#6B7280' }}>{item.hospitalId}</div></td>
                    <td><span className="badge badge-info">{item.subscriptionPlan}</span></td>
                    <td>{item.lastPaymentDate}</td>
                    <td style={{ fontWeight: 700, color: '#059669' }}>{formatINR(item.amountPaid)}</td>
                    <td>{item.subscriptionExpiryDate}</td>
                    <td><span className="badge badge-success">{item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel" aria-labelledby="alerts-preview-title">
          <div className="panel-header">
            <h2 className="section-title" id="alerts-preview-title" style={{ margin: 0 }}>Recent Performance Alerts</h2>
            <Link to="/regional-officer/performance-alerts" className="btn-link">View all alerts</Link>
          </div>
          <div id="alertsPreview" className="alert-list" aria-live="polite">
            {error ? (
              <p className="empty-state" style={{ color: '#DC2626' }}>{error}</p>
            ) : hospitals === null ? (
              <p className="empty-state">Loading alerts…</p>
            ) : !top.length ? (
              <p className="empty-state">No performance alerts — all hospitals are within normal thresholds.</p>
            ) : top.map((a, i) => (
              <article className={`alert-item ${a.severity}`} aria-label={a.title} key={`${a.hospitalId}-${a.category}-${i}`}>
                <div className="alert-body">
                  <h4>{a.title} <SeverityBadge severity={a.severity} /></h4>
                  <p>{a.message}</p>
                  <p className="alert-meta">{a.hospitalName} · {a.category}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
