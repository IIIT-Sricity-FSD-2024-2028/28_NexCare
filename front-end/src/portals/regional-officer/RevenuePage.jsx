import { useEffect, useState } from 'react';
import Header from '../../components/layout/Header';
import { Revenue } from '../../api';
import { formatINR as money } from './roShared';
import '../../styles/regional-console.css';

// regional-officer/revenue.html + revenue.js — revenue across the hospitals
// the officer oversees.
//
// This is OPERATIONAL revenue: what each hospital collected from patients. What
// NexCare charges those hospitals is the platform's own commercials and is not
// shown here — that lives in the superuser portal.

const rateColour = (rate) => (rate >= 70 ? '#10B981' : rate >= 50 ? '#F59E0B' : '#EF4444');

export default function RevenuePage() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState('');
  const [dept, setDept] = useState({ state: 'idle' }); // idle | loading | error | { data }

  useEffect(() => {
    let cancelled = false;
    Revenue.compareMyHospitals()
      .then((res) => {
        if (cancelled) return;
        const list = res.data || [];
        setRows(list);
        if (list.length) setPicked(list[0].hospitalId);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError('Could not load revenue data.');
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!picked) return undefined;
    let cancelled = false;
    setDept({ state: 'loading' });
    Revenue.getHospitalRevenue(picked)
      .then((res) => { if (!cancelled) setDept({ state: 'ready', data: res.data }); })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setDept({ state: 'error' });
      });
    return () => { cancelled = true; };
  }, [picked]);

  const list = rows || [];
  const collected = list.reduce((t, r) => t + r.collected, 0);
  const outstanding = list.reduce((t, r) => t + r.outstanding, 0);
  const bills = list.reduce((t, r) => t + r.billsIssued, 0);
  const avgRate = list.length ? list.reduce((t, r) => t + r.collectionRate, 0) / list.length : 0;
  const d = dept.data;
  const max = d ? Math.max(...d.byDepartment.map((x) => x.amount), 1) : 1;

  return (
    <div className="ro-console">
      <Header title="Revenue" />
      <div className="page-body">
        <div className="hero">
          <h1>Revenue Across My Hospitals</h1>
          <p>What each hospital you oversee has collected, and current unpaid balance (amount due from patient bills).</p>
        </div>

        <div className="stats-grid">
          {[
            ['Total Collected', rows ? money(collected) : '--'],
            ['Amount Due / Unpaid Balance', rows ? money(outstanding) : '--'],
            ['Bills Issued', rows ? bills : '--'],
            ['Avg Collection Rate', rows ? `${avgRate.toFixed(1)}%` : '--'],
          ].map(([lbl, val]) => (
            <div className="stat-card" key={lbl}>
              <div className="stat-info">
                <p className="stat-label">{lbl}</p>
                <p className="stat-value">{val}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="activity-card">
          <div className="activity-header">
            <h2 className="section-title" style={{ margin: 0 }}>Hospital comparison</h2>
          </div>
          <table className="activity-table">
            <thead>
              <tr>
                <th>Hospital</th>
                <th>Collected</th>
                <th>Unpaid Balance (Amount Due)</th>
                <th>Bills</th>
                <th>Collection rate</th>
              </tr>
            </thead>
            <tbody id="compareTableBody">
              {error ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#DC2626' }}>{error}</td></tr>
              ) : rows === null ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#6A7282' }}>Loading revenue…</td></tr>
              ) : !list.length ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#6A7282' }}>No hospitals assigned to you.</td></tr>
              ) : list.map((r) => (
                <tr key={r.hospitalId}>
                  <td className="actor-cell">{r.hospitalName}<div className="muted">{r.hospitalId}</div></td>
                  <td style={{ fontWeight: 600 }}>{money(r.collected)}</td>
                  <td style={{ color: '#B45309' }}>{money(r.outstanding)}</td>
                  <td>{r.billsIssued}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, maxWidth: 110, height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, r.collectionRate).toFixed(1)}%`, background: rateColour(r.collectionRate) }} />
                      </div>
                      <span style={{ fontSize: 12 }}>{r.collectionRate.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="activity-card" style={{ marginTop: 24 }}>
          <div className="activity-header">
            <h2 className="section-title" style={{ margin: 0 }}>Department breakdown</h2>
            <select
              id="hospitalPicker"
              value={picked}
              onChange={(e) => setPicked(e.target.value)}
              style={{ height: 34, border: '1px solid #E5E7EB', borderRadius: 8, padding: '0 10px', fontSize: 13 }}
            >
              {list.map((r) => <option key={r.hospitalId} value={r.hospitalId}>{r.hospitalName}</option>)}
            </select>
          </div>
          <div style={{ padding: 20 }} id="deptBody">
            {dept.state === 'idle' && <p style={{ color: '#6A7282', fontSize: 13 }}>Select a hospital.</p>}
            {dept.state === 'loading' && <p style={{ color: '#6A7282', fontSize: 13 }}>Loading…</p>}
            {dept.state === 'error' && <p style={{ color: '#DC2626', fontSize: 13 }}>Could not load the department breakdown.</p>}
            {d && !d.byDepartment.length && <p style={{ color: '#6A7282', fontSize: 13 }}>No collected revenue to break down yet.</p>}
            {d && d.byDepartment.length > 0 && (
              <>
                <p style={{ fontSize: 13, color: '#374151', marginBottom: 16 }}>
                  <strong>{d.hospitalName}</strong> — {money(d.collected)} collected across{' '}
                  {d.billsPaid} paid bills · average bill {money(d.averageBillValue)} ·{' '}
                  GST collected {money(d.gstCollected)}
                </p>
                {d.byDepartment.map((x) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }} key={x.department}>
                    <div style={{ width: 150, fontSize: 12, color: '#374151' }}>{x.department}</div>
                    <div style={{ flex: 1, height: 20, background: '#F3F4F6', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${((x.amount / max) * 100).toFixed(1)}%`, background: 'linear-gradient(90deg,#2563EB,#0EA5E9)' }} />
                    </div>
                    <div style={{ width: 130, textAlign: 'right', fontSize: 12, fontWeight: 600 }}>
                      {money(x.amount)} <span style={{ color: '#6A7282', fontWeight: 400 }}>{x.share}%</span>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed #E5E7EB', fontSize: 12, color: '#6A7282' }}>
                  Monthly: {d.byMonth.map((m) => `${m.month} ${money(m.collected)}`).join(' · ')}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
