import { useEffect, useState } from 'react';
import { Revenue } from '../../api';
import { useHm } from './HmContext';
import { money } from './hmShared';
import { PlatformCharges } from './SubscriptionPage';

// TAB — Revenue: loadRevenue(). This hospital's OWN collections from
// GET /revenue/hospital/:id (what NexCare charges across all hospitals is the
// Admin's view). The HTML declared #revenueTab twice; the first — the one
// the switcher showed — had the stat grid and the department split, and the
// platform-charges card was on the second copy (and on the Subscription
// tab). It is shown here too so the section reads whole.
export default function RevenuePage() {
  const { hospitalId, version } = useHm();
  const [data, setData] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    if (!hospitalId) { setData(null); return undefined; }
    Revenue.getHospitalRevenue(hospitalId)
      .then((res) => { if (!cancelled) setData(res.data || null); })
      .catch((err) => { console.error('Revenue load failed:', err); if (!cancelled) setData(null); });
    return () => { cancelled = true; };
  }, [hospitalId, version]);

  const d = data;
  const max = d?.byDepartment?.length ? Math.max(...d.byDepartment.map((x) => x.amount), 1) : 1;

  return (
    <>
      <div className="stats-grid">
        {d && (
          <>
            <div className="stat-card"><div className="stat-data"><div className="stat-label">Collected</div><div className="stat-value">{money(d.collected)}</div></div></div>
            <div className="stat-card"><div className="stat-data"><div className="stat-label">Amount Due / Unpaid</div><div className="stat-value">{money(d.outstanding)}</div></div></div>
            <div className="stat-card"><div className="stat-data"><div className="stat-label">Collection Rate</div><div className="stat-value">{d.collectionRate}%</div></div></div>
            <div className="stat-card"><div className="stat-data"><div className="stat-label">Bills Issued</div><div className="stat-value">{d.billsIssued}</div></div></div>
          </>
        )}
      </div>

      <div className="card">
        <div className="card-header"><h2>Revenue by department</h2></div>
        <div style={{ padding: 20 }}>
          {!hospitalId && <p style={{ color: '#DC2626' }}>No hospital is linked to this account.</p>}
          {hospitalId && d === undefined && <p className="loading-cell">Loading revenue…</p>}
          {hospitalId && d === null && <p style={{ color: '#DC2626' }}>Could not load revenue data.</p>}
          {d && (!d.byDepartment || !d.byDepartment.length) && <p>No collected revenue to break down yet.</p>}
          {d && d.byDepartment?.length > 0 && (
            <>
              {d.byDepartment.map((x) => (
                <div key={x.department} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 150, fontSize: 13 }}>{x.department}</div>
                  <div style={{ flex: 1, height: 20, background: '#F3F4F6', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${((x.amount / max) * 100).toFixed(1)}%`, background: 'linear-gradient(90deg,#2563EB,#0EA5E9)' }} />
                  </div>
                  <div style={{ width: 140, textAlign: 'right', fontSize: 13, fontWeight: 600 }}>
                    {money(x.amount)} <span style={{ color: '#6B7280', fontWeight: 400 }}>{x.share}%</span>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed #E5E7EB', fontSize: 12, color: '#6B7280' }}>
                Monthly: {(d.byMonth || []).map((m) => `${m.month} ${money(m.collected)}`).join(' · ')}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header"><h2>What this hospital owes NexCare</h2></div>
        <div style={{ padding: 20 }}>
          {d === undefined && <p className="loading-cell">Loading…</p>}
          {d && <PlatformCharges pc={d.platformCharges} />}
        </div>
      </div>
    </>
  );
}
