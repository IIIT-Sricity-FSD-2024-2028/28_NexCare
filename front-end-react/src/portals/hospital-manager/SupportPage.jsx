import { useCallback, useEffect, useState } from 'react';
import { SupportRequests } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useHm } from './HmContext';
import { Badge, Field, HmModal, LoadingCell, isoDay } from './hmShared';

// TAB 7 — Support Requests: loadSupport(). GET /support-requests is locked to
// the manager's own hospital server-side. The "+ New Support Ticket" button
// called openSupportModal(), which dashboard.js never defined — the modal
// here is what that button promised, posting the CreateSupportRequestDto
// shape (category, subject, description, priority; hospitalId defaults to
// the caller's).
const CATEGORIES = ['Infrastructure', 'Staffing', 'Compliance', 'Billing', 'Technical', 'General'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const blank = { category: 'Infrastructure', subject: '', description: '', priority: 'medium' };

/** Statuses are stored lowercase with underscores (`in_progress`) — the HTML compared against 'Open'. */
const statusText = (s) => String(s || 'open').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const isOpen = (s) => ['open', 'in_progress', 'waiting_for_hospital', 'waiting_for_manager'].includes(String(s || 'open').toLowerCase());

export default function SupportPage() {
  const { notify } = useToast();
  const { version } = useHm();
  const [tickets, setTickets] = useState(null);
  const [failed, setFailed] = useState(false);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await SupportRequests.getAll();
      setTickets(Array.isArray(res.data) ? res.data : []);
      setFailed(false);
    } catch (e) {
      console.error('Error loading support:', e);
      setFailed(true);
      setTickets([]);
    }
  }, []);
  useEffect(() => { load(); }, [load, version]);

  async function submit(e) {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) { notify('Please enter a subject and a description.', 'error'); return; }
    setBusy(true);
    try {
      await SupportRequests.create({ category: form.category, subject: form.subject.trim(), description: form.description.trim(), priority: form.priority });
      notify('Support ticket submitted to your Regional Officer.', 'success');
      setForm(null);
      await load();
    } catch (err) {
      notify(err?.message || 'Failed to submit the support ticket', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="card-header flex-between">
        <div>
          <h2>Hospital Support & Escalation Requests</h2>
          <p className="card-subtitle">Submit support requests to Regional Officers and view ticket statuses</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setForm({ ...blank })}>+ New Support Ticket</button>
      </div>
      <div className="table-responsive">
        <table className="data-table">
          <thead><tr><th>Ticket ID</th><th>Subject / Category</th><th>Priority</th><th>Submitted Date</th><th>Status</th><th>Response / Resolution</th></tr></thead>
          <tbody>
            {failed && <LoadingCell colSpan={6} tone="danger">Failed to load support tickets.</LoadingCell>}
            {!failed && tickets === null && <LoadingCell colSpan={6}>Loading support tickets...</LoadingCell>}
            {!failed && tickets && tickets.length === 0 && <LoadingCell colSpan={6}>No support tickets found for your hospital.</LoadingCell>}
            {(tickets || []).map((t) => (
              <tr key={t.id}>
                <td><strong>{t.id}</strong></td>
                <td><strong>{t.subject || t.title}</strong><div style={{ fontSize: 11, color: '#64748B' }}>{t.category || 'General'}</div></td>
                <td><Badge tone={(t.priority || 'medium').toLowerCase()}>{String(t.priority || 'MEDIUM').toUpperCase()}</Badge></td>
                <td>{isoDay(t.createdAt)}</td>
                <td><Badge tone={isOpen(t.status) ? 'pending' : 'active'}>{statusText(t.status)}</Badge></td>
                <td>{t.response || t.resolution || 'Pending regional review'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <HmModal open={Boolean(form)} onClose={() => setForm(null)} title="New Support Ticket" size="medium" as="form" onSubmit={submit}
        footer={(<><button type="button" className="btn-secondary" onClick={() => setForm(null)} disabled={busy}>Cancel</button><button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Submitting...' : 'Submit Ticket'}</button></>)}>
        {form && (
          <>
            <div className="form-row">
              <Field label="Category" required><select className="form-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
              <Field label="Priority" required><select className="form-control" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}</select></Field>
            </div>
            <Field label="Subject" required className="form-group mt-12"><input className="form-control" placeholder="e.g. ICU air-conditioning unit failure" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
            <Field label="Description" required className="form-group mt-12"><textarea className="form-control" rows={4} placeholder="Describe the issue and what you need from the regional office…" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          </>
        )}
      </HmModal>
    </div>
  );
}
