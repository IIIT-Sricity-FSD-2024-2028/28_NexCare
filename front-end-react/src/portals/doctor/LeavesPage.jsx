import { useCallback, useEffect, useState } from 'react';
import Header from '../../components/layout/Header';
import { Panel, StatusPill, EmptyRow, PageHeader } from '../../components/ui';
import { Leaves } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useConfirm from '../../hooks/useConfirm';
import { formatDate, isoDate, plural } from '../../utils/format';

// doctor/leaves.html + leaves.js.
//
// A doctor files their own request; approving it is the hospital manager's
// call. An approved leave stops the booking wizard offering those dates.
export default function LeavesPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const { ask, dialog } = useConfirm();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ startDate: '', endDate: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const today = isoDate();

  const load = useCallback(async () => {
    if (!user) return;
    setError('');
    try {
      const res = await Leaves.list({ doctorId: user.id });
      const list = Array.isArray(res?.data) ? res.data : [];
      setLeaves(list.sort((a, b) => String(b.startDate).localeCompare(String(a.startDate))));
    } catch (err) {
      setError(err.message || 'Could not load your leave requests. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const { startDate, endDate } = form;
    const reason = form.reason.trim();
    if (!startDate || !endDate) return notify('Pick both a start and an end date', 'error');
    if (endDate < startDate) return notify('The end date cannot be before the start date', 'error');
    if (!reason) return notify('Give a reason — your manager approves against it', 'error');

    setSubmitting(true);
    try {
      await Leaves.create({
        doctorId: user.id,
        doctorName: user.name,
        hospitalId: user.hospitalId || '',
        startDate, endDate, reason,
      });
      notify('Leave request submitted — your manager will review it', 'success');
      setForm({ startDate: '', endDate: '', reason: '' });
      await load();
    } catch (err) {
      // The guard returns 409 when an approved leave already covers these dates.
      notify(err.message || 'Could not submit the request', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function withdraw(id) {
    // The rest of the app asks through the shared ConfirmDialog; this page was
    // the last one still raising a native window.confirm.
    if (!(await ask('Withdraw this leave request?', { title: 'Withdraw leave', confirmLabel: 'Withdraw', danger: true }))) return;
    try {
      await Leaves.remove(id);
      notify('Leave request withdrawn', 'success');
      await load();
    } catch (err) {
      notify(err.message || 'Could not withdraw the request', 'error');
    }
  }

  return (
    <>
      <Header title="Leave Calendar" />
      <div className="page-body">
        <PageHeader
          title="Leave calendar"
          subtitle="Request time off. Your hospital manager approves it — an approved leave blocks new bookings for those dates."
        />

        <Panel title="Request leave">
          <form onSubmit={submit} className="field-grid">
            <div className="field">
              <label htmlFor="startDate">From</label>
              <input id="startDate" type="date" min={today} value={form.startDate} onChange={set('startDate')} />
            </div>
            <div className="field">
              <label htmlFor="endDate">To</label>
              <input id="endDate" type="date" min={form.startDate || today} value={form.endDate} onChange={set('endDate')} />
            </div>
            <div className="field">
              <label htmlFor="reason">Reason</label>
              <input id="reason" type="text" placeholder="Conference, personal leave…" value={form.reason} onChange={set('reason')} />
            </div>
            <div className="field">
              <label>&nbsp;</label>
              <button type="submit" className="btn primary" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit request'}</button>
            </div>
          </form>
        </Panel>

        <Panel title="My leave requests" hint={plural(leaves.length, 'request')} flush>
          <table className="rev">
            <thead>
              <tr><th>From</th><th>To</th><th>Reason</th><th>Status</th><th>Approved by</th><th /></tr>
            </thead>
            <tbody>
              {error && <EmptyRow colSpan={6} error>{error}</EmptyRow>}
              {!error && loading && <EmptyRow colSpan={6}>Loading…</EmptyRow>}
              {!error && !loading && leaves.length === 0 && <EmptyRow colSpan={6}>No leave requested yet.</EmptyRow>}
              {!error && leaves.map((l) => (
                <tr key={l.id}>
                  <td>{formatDate(l.startDate)}</td>
                  <td>{formatDate(l.endDate)}</td>
                  <td className="muted">{l.reason || '—'}</td>
                  <td><StatusPill status={String(l.status).toLowerCase()} /></td>
                  <td className="muted">{l.approvedBy || '—'}</td>
                  <td className="num">
                    {String(l.status).toLowerCase() === 'pending'
                      ? <button type="button" className="btn danger" onClick={() => withdraw(l.id)}>Withdraw</button>
                      : <span className="muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
      {dialog}
    </>
  );
}
