import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '../../components/layout/Header';
import { Feedback, Hospitals } from '../../api';
import { useToast } from '../../context/ToastContext';
import { FeedbackStatusBadge, Hero, ICONS, StatCard, Stars, formatDate, useRegionalCss } from './roShared';

// regional-officer/complaints.html + complaints.js: GET /feedback/regional
// (items + stats), hospital names from GET /hospitals/regional/my-hospitals,
// and a status-update modal on every row (PATCH /feedback/:id/status).

const STATUSES = ['Open', 'In Progress', 'Resolved'];

export default function ComplaintsPage() {
  useRegionalCss();
  const { notify } = useToast();
  const [items, setItems] = useState(null);
  const [stats, setStats] = useState({});
  const [names, setNames] = useState({});
  const [error, setError] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [hospital, setHospital] = useState('all');
  const [term, setTerm] = useState('');
  const [editing, setEditing] = useState(null); // { id, subject, status }
  const [saving, setSaving] = useState(false);

  const loadComplaints = useCallback(async () => {
    try {
      const res = await Feedback.getRegional();
      setItems(res.data?.items || []);
      setStats(res.data?.stats || {});
      setError('');
    } catch (err) {
      console.error(err);
      setError('Could not load complaints.');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Hospitals.getMyHospitals()
      .then((res) => {
        if (cancelled) return;
        const map = {};
        (res.data || []).forEach((h) => { map[h.id] = h.name; });
        setNames(map);
      })
      .catch((err) => console.warn('Hospital names unavailable:', err));
    loadComplaints();
    return () => { cancelled = true; };
  }, [loadComplaints]);

  const all = items || [];
  const categories = useMemo(() => [...new Set(all.map((i) => i.category))].sort(), [all]);
  const hospitalIds = useMemo(() => [...new Set(all.map((i) => i.hospitalId).filter(Boolean))], [all]);

  const rows = useMemo(() => {
    const t = term.trim().toLowerCase();
    return all.filter((item) => {
      if (status !== 'all' && item.status !== status) return false;
      if (category !== 'all' && item.category !== category) return false;
      if (hospital !== 'all' && item.hospitalId !== hospital) return false;
      if (t) {
        const hay = `${item.subject} ${item.summary} ${item.sender} ${item.category}`.toLowerCase();
        if (!hay.includes(t)) return false;
      }
      return true;
    });
  }, [all, status, category, hospital, term]);

  async function saveStatus() {
    if (!editing) return;
    setSaving(true);
    try {
      await Feedback.updateStatus(editing.id, editing.status);
      setEditing(null);
      await loadComplaints();
    } catch (err) {
      console.error(err);
      notify(err?.message || 'Could not update status. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Header title="Patient Complaints" />
      <div className="page-body">
        <Hero title="Complaints & Patient Feedback">
          Track patient complaints and feedback across hospitals in your region. Review ratings, categories, and resolution status.
        </Hero>

        <div className="stats-grid" role="region" aria-label="Complaint statistics">
          <StatCard label="Total Feedback" value={items ? stats.total ?? 0 : '—'} icon={ICONS.chat('#2563EB')} tone="blue" />
          <StatCard label="Open" value={items ? stats.open ?? 0 : '—'} icon={ICONS.circle()} tone="red" />
          <StatCard label="In Progress" value={items ? stats.inProgress ?? 0 : '—'} icon={ICONS.clock()} tone="orange" />
          <StatCard label="Avg. Rating" value={items ? stats.averageRating ?? '—' : '—'} icon={ICONS.star()} tone="purple" />
        </div>

        <section className="panel">
          <div className="filter-bar">
            <label htmlFor="statusFilter">Status</label>
            <select id="statusFilter" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <label htmlFor="categoryFilter">Category</label>
            <select id="categoryFilter" aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <label htmlFor="hospitalFilter">Hospital</label>
            <select id="hospitalFilter" aria-label="Filter by hospital" value={hospital} onChange={(e) => setHospital(e.target.value)}>
              <option value="all">All hospitals</option>
              {hospitalIds.map((id) => <option key={id} value={id}>{names[id] || id}</option>)}
            </select>
            <label htmlFor="searchInput" className="sr-only">Search complaints</label>
            <input type="search" id="searchInput" placeholder="Search complaints…" aria-label="Search complaints" value={term} onChange={(e) => setTerm(e.target.value)} />
          </div>
        </section>

        <section className="panel" aria-labelledby="complaints-title">
          <h2 className="section-title" id="complaints-title">Feedback & Issues</h2>
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Patient complaints and feedback for your assigned hospitals</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Hospital</th>
                  <th scope="col">Patient</th>
                  <th scope="col">Subject</th>
                  <th scope="col">Category</th>
                  <th scope="col">Rating</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody id="complaintsTableBody">
                {error ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: '#DC2626' }}>{error}</td></tr>
                ) : items === null ? (
                  <tr><td colSpan={8} className="empty-state">Loading complaints…</td></tr>
                ) : !rows.length ? (
                  <tr><td colSpan={8} className="empty-state">No complaints match your filters.</td></tr>
                ) : rows.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>{names[item.hospitalId] || item.hospitalId || '—'}</td>
                    <td>
                      <strong>{item.sender}</strong>
                      <div style={{ fontSize: 12, color: '#6A7282' }}>{item.type}</div>
                    </td>
                    <td>
                      <strong>{item.subject}</strong>
                      <div style={{ fontSize: 12, color: '#6A7282', maxWidth: 240 }}>{item.summary}</div>
                    </td>
                    <td><span className="badge badge-neutral">{item.category}</span></td>
                    <td>{item.rating ? <Stars rating={item.rating} /> : '—'}</td>
                    <td><FeedbackStatusBadge status={item.status} /></td>
                    <td>
                      <button type="button" className="btn-link" onClick={() => setEditing({ id: item.id, subject: item.subject, status: item.status })}>Update</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Status update modal — the inline-styled overlay from complaints.html. */}
      {editing && (
        <div
          id="statusModal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalTitle"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setEditing(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, maxWidth: 420, width: '90%' }}>
            <h3 id="modalTitle" style={{ margin: '0 0 8px', fontSize: 18 }}>Update Complaint Status</h3>
            <p id="modalSubject" style={{ margin: '0 0 16px', fontSize: 14, color: '#6A7282' }}>{editing.subject}</p>
            <label htmlFor="modalStatus" style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>New status</label>
            <select
              id="modalStatus"
              value={editing.status}
              onChange={(e) => setEditing((s) => ({ ...s, status: e.target.value }))}
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 8, marginBottom: 16 }}
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" id="modalCancel" className="btn-link" style={{ background: '#F3F4F6', borderColor: '#E5E7EB', color: '#374151' }} onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
              <button type="button" id="modalSave" className="btn-primary" style={{ padding: '8px 16px' }} onClick={saveStatus} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
