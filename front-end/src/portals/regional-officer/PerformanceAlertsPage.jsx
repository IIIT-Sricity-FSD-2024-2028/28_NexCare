import { useEffect, useMemo, useState } from 'react';
import Header from '../../components/layout/Header';
import { Hospitals } from '../../api';
import { DetailsLink, Hero, ICONS, SeverityBadge, StatCard, useRegionalCss } from './roShared';

// regional-officer/performance-alerts.html + performance-alerts.js:
// GET /hospitals/regional/performance-alerts, filtered client-side.

export default function PerformanceAlertsPage() {
  useRegionalCss();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [severity, setSeverity] = useState('all');
  const [category, setCategory] = useState('all');
  const [hospital, setHospital] = useState('all');
  const [term, setTerm] = useState('');

  useEffect(() => {
    let cancelled = false;
    Hospitals.getPerformanceAlerts()
      .then((res) => { if (!cancelled) setData(res.data || { alerts: [] }); })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError('Could not load performance alerts.');
      });
    return () => { cancelled = true; };
  }, []);

  const alerts = data?.alerts || [];
  const categories = useMemo(() => [...new Set(alerts.map((a) => a.category))].sort(), [alerts]);
  const hospitals = useMemo(() => {
    const names = {};
    alerts.forEach((a) => { names[a.hospitalId] = a.hospitalName; });
    return [...new Set(alerts.map((a) => a.hospitalId))].map((id) => [id, names[id] || id]);
  }, [alerts]);

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    return alerts.filter((a) => {
      if (severity !== 'all' && a.severity !== severity) return false;
      if (category !== 'all' && a.category !== category) return false;
      if (hospital !== 'all' && a.hospitalId !== hospital) return false;
      if (t) {
        const hay = `${a.title} ${a.message} ${a.hospitalName} ${a.category}`.toLowerCase();
        if (!hay.includes(t)) return false;
      }
      return true;
    });
  }, [alerts, severity, category, hospital, term]);

  return (
    <>
      <Header title="Performance Alerts" />
      <div className="page-body">
        <Hero title="Underperforming Hospitals">
          Automated notifications for capacity, inventory, patient satisfaction, and complaints across your assigned hospitals.
        </Hero>

        <div className="stats-grid" role="region" aria-label="Alert summary">
          <StatCard label="Total Alerts" value={data ? data.total ?? 0 : '—'} icon={ICONS.triangle('#EA580C', 24)} tone="orange" />
          <StatCard label="Critical" value={data ? data.critical ?? 0 : '—'} icon={ICONS.circleAlert()} tone="red" />
          <StatCard label="Warnings" value={data ? data.warning ?? 0 : '—'} icon={ICONS.exclaim()} tone="orange" />
          <StatCard label="Hospitals Affected" value={data ? new Set(alerts.map((a) => a.hospitalId)).size : '—'} icon={ICONS.home()} tone="blue" />
        </div>

        <section className="panel" aria-labelledby="filters-title">
          <h2 className="sr-only" id="filters-title">Filter alerts</h2>
          <div className="filter-bar">
            <label htmlFor="severityFilter">Severity</label>
            <select id="severityFilter" aria-label="Filter by severity" value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="all">All severities</option>
              <option value="critical">Critical only</option>
              <option value="warning">Warnings only</option>
            </select>
            <label htmlFor="categoryFilter">Category</label>
            <select id="categoryFilter" aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <label htmlFor="hospitalFilter">Hospital</label>
            <select id="hospitalFilter" aria-label="Filter by hospital" value={hospital} onChange={(e) => setHospital(e.target.value)}>
              <option value="all">All hospitals</option>
              {hospitals.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
            <label htmlFor="searchInput" className="sr-only">Search alerts</label>
            <input type="search" id="searchInput" placeholder="Search alerts…" aria-label="Search alerts" value={term} onChange={(e) => setTerm(e.target.value)} />
          </div>
        </section>

        <section className="panel" aria-labelledby="alerts-list-title">
          <h2 className="section-title" id="alerts-list-title">Active Alerts</h2>
          <div id="alertsList" className="alert-list" aria-live="polite">
            {error ? (
              <p className="empty-state" style={{ color: '#DC2626' }}>{error}</p>
            ) : !data ? (
              <p className="empty-state">Loading alerts…</p>
            ) : !filtered.length ? (
              <p className="empty-state">No alerts match your filters.</p>
            ) : filtered.map((a, i) => (
              <article className={`alert-item ${a.severity}`} key={`${a.hospitalId}-${a.category}-${i}`}>
                <div className="alert-body" style={{ flex: 1 }}>
                  <h4>{a.title} <SeverityBadge severity={a.severity} /></h4>
                  <p>{a.message}</p>
                  <p className="alert-meta">
                    {a.hospitalName} · {a.category}
                    {a.metric != null && <> · Metric: {a.metric}{a.threshold != null && <> (threshold: {a.threshold})</>}</>}
                  </p>
                </div>
                <DetailsLink id={a.hospitalId}>View hospital</DetailsLink>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
