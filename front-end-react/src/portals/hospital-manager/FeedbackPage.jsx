import { useCallback, useEffect, useState } from 'react';
import { Feedback } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useHm } from './HmContext';
import { Badge, Field, HmModal, LoadingCell, isoDay } from './hmShared';

// TAB — Patient Feedback & Issues: loadHmFeedback() / hmRenderFeedback() /
// openHmFeedbackModal() / saveHmFeedbackStatus(). The "Update Status" button
// opened #hmFeedbackStatusModal, which dashboard.html never contained, and
// PATCH /feedback/:id/status did not admit hospital managers at all — both
// are fixed (the modal here; the route now allows a manager for their own
// hospital's feedback).
const STATUSES = ['Open', 'In Progress', 'Resolved'];

export default function FeedbackPage() {
  const { hospitalId } = useHm();
  const { notify } = useToast();
  const [rows, setRows] = useState(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState('all');
  const [edit, setEdit] = useState(null); // { id, current, next }
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!hospitalId) return;
    try {
      const res = await Feedback.getAll({ hospitalId });
      setRows(Array.isArray(res.data) ? res.data : []);
      setFailed(false);
    } catch (err) {
      console.error('Failed to load feedback:', err);
      setFailed(true);
      setRows([]);
    }
  }, [hospitalId]);
  useEffect(() => { load(); }, [load]);

  const filtered = (rows || []).filter((f) => filter === 'all' || f.status === filter);

  async function save() {
    setBusy(true);
    try {
      await Feedback.updateStatus(edit.id, edit.next);
      setRows((prev) => prev.map((f) => (f.id === edit.id ? { ...f, status: edit.next } : f)));
      notify('Feedback status updated', 'success');
      setEdit(null);
    } catch (err) {
      notify(err?.message || 'Could not update status. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="card-header flex-between">
        <div>
          <h2>Patient Feedback & Issues</h2>
          <p className="card-subtitle">Manage patient complaints directly for your hospital.</p>
          <p style={{ color: '#d97706', fontSize: 12, marginTop: 4, fontWeight: 600 }}>Note: Complaints left "Open" for &gt; 3 days may be escalated to your Regional Officer.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="form-control" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="table-responsive">
        <table className="data-table">
          <thead><tr><th>Date</th><th>Patient</th><th>Subject / Summary</th><th>Category</th><th>Rating</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {failed && <LoadingCell colSpan={7}><span style={{ color: 'red' }}>Error loading feedback.</span></LoadingCell>}
            {!failed && rows === null && <LoadingCell colSpan={7}>Loading feedback...</LoadingCell>}
            {!failed && rows && rows.length === 0 && <LoadingCell colSpan={7}>No feedback found.</LoadingCell>}
            {!failed && rows && rows.length > 0 && filtered.length === 0 && <LoadingCell colSpan={7}>No feedback matches this filter.</LoadingCell>}
            {filtered.map((f) => {
              const rating = Math.max(0, Math.min(5, Number(f.rating) || 0));
              return (
                <tr key={f.id}>
                  <td>{f.createdAt ? isoDay(new Date(f.createdAt).toISOString()) : 'N/A'}</td>
                  <td style={{ fontWeight: 500 }}>{f.sender || 'Anonymous'}</td>
                  <td><div style={{ fontWeight: 600 }}>{f.subject || 'N/A'}</div><div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{f.summary || f.description || ''}</div></td>
                  <td>{f.category || 'General'}</td>
                  <td style={{ color: '#F59E0B', fontSize: 14 }}>{'⭐'.repeat(rating)}{'☆'.repeat(5 - rating)}</td>
                  <td><Badge tone={f.status === 'Resolved' ? 'active' : f.status === 'In Progress' ? 'pending' : 'rejected'}>{f.status || 'Open'}</Badge></td>
                  <td><button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setEdit({ id: f.id, current: f.status || 'Open', next: f.status || 'Open' })}>Update Status</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <HmModal open={Boolean(edit)} onClose={() => setEdit(null)} title="Update Feedback Status"
        footer={(<><button type="button" className="btn-secondary" onClick={() => setEdit(null)} disabled={busy}>Cancel</button><button type="button" className="btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving...' : 'Save Status'}</button></>)}>
        {edit && (
          <>
            <p className="text-secondary mb-12">Current status: <strong>{edit.current}</strong></p>
            <Field label="New Status" className="form-group">
              <select className="form-control" value={edit.next} onChange={(e) => setEdit({ ...edit, next: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
            </Field>
          </>
        )}
      </HmModal>
    </div>
  );
}
