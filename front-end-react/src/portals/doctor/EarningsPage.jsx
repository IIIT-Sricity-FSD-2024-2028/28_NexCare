import { useCallback, useEffect, useState } from 'react';
import Header from '../../components/layout/Header';
import { KpiTile, Panel, PageHeader } from '../../components/ui';
import { Revenue } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { money, plural } from '../../utils/format';

// doctor/earnings.html + earnings.js.
//
// NexCare charges a doctor nothing: the hospital's staff-count subscription
// covers the seat, so there is no tier to choose and no commission to deduct.
export default function EarningsPage() {
  const { updateUser } = useAuth();
  const { notify } = useToast();
  const [earnings, setEarnings] = useState(null);
  const [error, setError] = useState('');
  const [fee, setFee] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await Revenue.myEarnings();
      setEarnings(res?.data || null);
      setFee(String(res?.data?.consultationFee ?? ''));
    } catch (err) {
      setError(err.message || 'Could not load your earnings. Check that the backend is running.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveFee(e) {
    e.preventDefault();
    const consultationFee = Number(fee);
    if (!Number.isFinite(consultationFee) || consultationFee < 0) {
      notify('Enter a valid consultation fee', 'error');
      return;
    }
    setSaving(true);
    try {
      await Revenue.updateMyConsultationFee(consultationFee);
      updateUser({ consultationFee });
      notify('Consultation fee updated', 'success');
      await load();
    } catch (err) {
      notify(err.message || 'Could not save your fee', 'error');
    } finally {
      setSaving(false);
    }
  }

  const months = earnings?.byMonth || [];
  const peak = Math.max(1, ...months.map((m) => Math.abs(m.gross)));

  return (
    <>
      <Header title="Earnings" />
      <div className="page-body">
        <PageHeader
          title="Consultation earnings"
          subtitle="What your completed consultations were worth, and the fee a patient is quoted when they book with you."
        />

        <div className="note">
          <strong>No platform fees.</strong> Your hospital's subscription covers your account. NexCare takes 0% commission on
          consultations — 100% goes to your hospital. Cancelled appointments are excluded.
        </div>

        <div className="kpi-grid">
          <KpiTile tone="accent" label="Consultation revenue" value={earnings ? money(earnings.grossEarnings) : '—'} sub={earnings ? `${earnings.appointmentsCompleted} completed of ${earnings.appointmentsBooked} booked` : 'from completed consultations'} />
          <KpiTile label="Consultations completed" value={earnings?.appointmentsCompleted ?? '—'} sub={earnings ? `${earnings.appointmentsCancelled} cancelled` : '—'} />
          <KpiTile label="Your consultation fee" value={earnings ? money(earnings.consultationFee) : '—'} sub="per booking, set by you" />
          <KpiTile tone="good" label="Deducted by NexCare" value={money(0)} sub="no listing fee, no commission" />
        </div>

        <Panel title="Month by month" hint="Last six months">
          {error && <p className="empty" style={{ color: '#B91C1C' }}>{error}</p>}
          {!error && !earnings && <p className="empty">Loading…</p>}
          {!error && earnings && months.length === 0 && <p className="empty">No consultations yet.</p>}
          {!error && months.map((m) => (
            <div key={m.month}>
              <div className="bar-row">
                <span className="name">{m.month}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(Math.abs(m.gross) / peak) * 100}%` }} />
                </div>
                <span className="amt">{money(m.gross)}</span>
              </div>
              <div className="muted" style={{ margin: '-4px 0 12px 202px' }}>{plural(m.completed, 'consultation')}</div>
            </div>
          ))}
        </Panel>

        <Panel title="Consultation fee" hint="What a patient is quoted when they book with you">
          <form onSubmit={saveFee} className="field-grid" style={{ maxWidth: 520 }}>
            <div className="field">
              <label htmlFor="feeInput">Fee per consultation (₹)</label>
              <input id="feeInput" type="number" min="0" step="50" value={fee} onChange={(e) => setFee(e.target.value)} />
            </div>
            <div className="field">
              <label>&nbsp;</label>
              <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving…' : 'Save fee'}</button>
            </div>
          </form>
          <p className="muted" style={{ marginTop: 12 }}>
            This is what the patient is quoted at booking and what the hospital bills. NexCare takes no share of it.
          </p>
        </Panel>
      </div>
    </>
  );
}
