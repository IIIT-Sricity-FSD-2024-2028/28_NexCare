import { useEffect, useState } from 'react';
import Header from '../../components/layout/Header';
import { Hospitals } from '../../api';
import { useToast } from '../../context/ToastContext';
import { DetailsLink, Hero, metricClass, useRegionalCss } from './roShared';

// regional-officer/hospital-comparison.html + hospital-comparison.js:
// GET /hospitals/regional/comparison, all assigned hospitals first, then the
// selection the officer picks from the multi-select.

const METRICS = [
  { key: 'bedOccupancyRate', label: 'Bed Occupancy', suffix: '%', thresholds: { bad: 90, warn: 80 } },
  { key: 'appointmentCompletionRate', label: 'Appointment Completion', suffix: '%', thresholds: { lowBad: 50, lowWarn: 70 } },
  { key: 'patientSatisfactionScore', label: 'Patient Satisfaction', suffix: '/5', thresholds: { lowBad: 2.5, lowWarn: 3.5 } },
  { key: 'doctorCount', label: 'Doctors', suffix: '' },
  { key: 'availableBeds', label: 'Available Beds', suffix: '' },
  { key: 'lowStockItems', label: 'Low Stock Items', suffix: '', thresholds: { bad: 5, warn: 2 } },
  { key: 'openComplaints', label: 'Open Complaints', suffix: '', thresholds: { bad: 3, warn: 1 } },
];

// hospital-comparison.js passed `m.thresholds` straight to metricClass(), which
// looks the metric up *inside* the map it is handed — so it found nothing and
// no value on the HTML page was ever coloured. Handed the map it expects.
const cls = (m, val) => (m.thresholds ? metricClass(m.key, val, { [m.key]: m.thresholds }) : '');

export default function HospitalComparisonPage() {
  useRegionalCss();
  const { notify } = useToast();
  const [all, setAll] = useState([]);
  const [selected, setSelected] = useState([]);
  const [shown, setShown] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Hospitals.getComparison()
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.hospitals || [];
        setAll(list);
        setSelected(list.map((h) => h.hospitalId));
        setShown(list);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError('Could not load hospital comparison data.');
      });
    return () => { cancelled = true; };
  }, []);

  async function run(ids) {
    if (!ids.length) {
      notify('Please select at least one hospital to compare.', 'warning');
      return;
    }
    try {
      const res = await Hospitals.getComparison(ids);
      setShown(res.data?.hospitals || []);
    } catch (err) {
      console.error(err);
      notify('Could not run comparison. Please try again.', 'error');
    }
  }

  function compareAll() {
    const ids = all.map((h) => h.hospitalId);
    setSelected(ids);
    run(ids);
  }

  const hospitals = shown || [];

  return (
    <>
      <Header title="Hospital Comparison" />
      <div className="page-body">
        <Hero title="Compare Hospitals in Your Area">
          Side-by-side comparison of bed capacity, staffing, patient satisfaction, inventory, and operational metrics across your assigned hospitals.
        </Hero>

        <section className="panel" aria-labelledby="compare-filters">
          <h2 className="sr-only" id="compare-filters">Select hospitals to compare</h2>
          <div className="filter-bar">
            <label htmlFor="hospitalSelect">Hospitals to compare</label>
            <select
              id="hospitalSelect"
              multiple
              size={4}
              aria-label="Select hospitals to compare"
              style={{ minWidth: 280, minHeight: 100 }}
              value={selected}
              onChange={(e) => setSelected([...e.target.selectedOptions].map((o) => o.value))}
            >
              {all.map((h) => <option key={h.hospitalId} value={h.hospitalId}>{h.hospitalName} ({h.city})</option>)}
            </select>
            <button type="button" id="compareBtn" className="btn-primary" style={{ padding: '10px 20px' }} onClick={() => run(selected)}>Compare Selected</button>
            <button type="button" id="compareAllBtn" className="btn-link" style={{ border: 'none', background: 'transparent' }} onClick={compareAll}>Compare all</button>
          </div>
        </section>

        <section className="panel" aria-labelledby="cards-title">
          <h2 className="section-title" id="cards-title">Hospital Metrics</h2>
          <div id="comparisonCards" className="comparison-grid" aria-live="polite">
            {error ? (
              <p className="empty-state" style={{ color: '#DC2626' }}>{error}</p>
            ) : shown === null ? (
              <p className="empty-state">Loading comparison data…</p>
            ) : !hospitals.length ? (
              <p className="empty-state">No hospitals to compare.</p>
            ) : hospitals.map((h) => (
              <article className="compare-card" key={h.hospitalId}>
                <h3>{h.hospitalName}</h3>
                <p className="city">{h.city} · {h.type || ''}</p>
                {METRICS.map((m) => {
                  const val = h[m.key] ?? 0;
                  return (
                    <div className="metric-row" key={m.key}>
                      <span className="label">{m.label}</span>
                      <span className={`value ${cls(m, val)}`}>{val}{m.suffix}</span>
                    </div>
                  );
                })}
                <div style={{ marginTop: 12 }}>
                  <DetailsLink id={h.hospitalId}>View details</DetailsLink>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel" aria-labelledby="chart-title">
          <h2 className="section-title" id="chart-title">Bed Occupancy Comparison</h2>
          <div id="occupancyChart" className="bar-chart" aria-live="polite">
            {shown !== null && !hospitals.length && <p className="empty-state">No data available.</p>}
            {hospitals.map((h) => {
              const pct = h.bedOccupancyRate || 0;
              const fillClass = pct >= 90 ? 'bad' : pct >= 80 ? 'warn' : '';
              return (
                <div className="bar-row" key={h.hospitalId}>
                  <span>{String(h.hospitalName || '').split(' ')[0]}</span>
                  <div className="bar-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${h.hospitalName} occupancy`}>
                    <div className={`bar-fill ${fillClass}`} style={{ width: `${pct}%` }} />
                  </div>
                  <strong>{pct}%</strong>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel" aria-labelledby="table-title">
          <h2 className="section-title" id="table-title">Detailed Comparison Table</h2>
          <div className="table-wrap">
            <table className="data-table" id="comparisonTable">
              <caption className="sr-only">Detailed metrics comparison across selected hospitals</caption>
              <thead id="comparisonTableHead">
                {hospitals.length > 0 && (
                  <tr>
                    <th scope="col">Metric</th>
                    {hospitals.map((h) => <th scope="col" key={h.hospitalId}>{h.hospitalName}</th>)}
                  </tr>
                )}
              </thead>
              <tbody id="comparisonTableBody">
                {shown !== null && !hospitals.length ? (
                  <tr><td className="empty-state">No data</td></tr>
                ) : METRICS.map((m) => (
                  <tr key={m.key}>
                    <th scope="row">{m.label}</th>
                    {hospitals.map((h) => {
                      const val = h[m.key] ?? 0;
                      return <td key={h.hospitalId}><span className={`value ${cls(m, val)}`} style={{ fontWeight: 700 }}>{val}{m.suffix}</span></td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
