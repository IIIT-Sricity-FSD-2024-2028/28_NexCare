import { useCallback, useEffect, useMemo, useState } from 'react';
import useConfirm from '../../hooks/useConfirm';
import { errorMessage } from './staffData';
import { createStaffFeedback, editStaffFeedback, deleteStaffFeedback } from '../../store/feedbackSlice';
import { useNotify } from '../../hooks/useNotify';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchStaffFeedback, selectStaffFeedback,
} from '../../store/staffSlice';

const EMPTY_FORM = { patientId: '', sender: '', category: 'service', subject: '', summary: '', rating: 5 };

function Stars({ rating }) {
  return <span className="stars">{Array.from({ length: 5 }, (_, i) => (i < rating ? '★' : '☆')).join('')}</span>;
}

export default function FeedbackPage() {
  const notify = useNotify();
  const dispatch = useAppDispatch();
  const { list } = useAppSelector(selectStaffFeedback);
  const [term, setTerm] = useState('');
  const [type, setType] = useState('All');
  const [view, setView] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const { ask, dialog } = useConfirm();

  const rows = useMemo(() => list.map((f) => ({
    id: f.id,
    date: f.createdAt ? f.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
    type: f.type || 'Patient',
    sender: f.sender || 'Anonymous',
    rating: f.rating || 0,
    subject: f.subject || 'Feedback',
    comment: f.summary || f.description || '',
  })), [list]);

  const load = useCallback(
    () => dispatch(fetchStaffFeedback()).unwrap()
      .catch(() => notify('Failed to load feedback. Please check your connection and try again.', 'error')),
    [dispatch, notify],
  );

  useEffect(() => { load(); }, [load]);

  function openEdit(id) {
    const record = list.find((row) => row.id === id);
    if (!record) return;
    const { category, subject, summary, description, rating } = record;
    setForm({ id, category: category || 'service', subject: subject || '', summary: summary || description || '', rating: rating || 5 });
  }

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    const { id, patientId, sender, category, subject, summary, rating } = form;
    const data = { category: category.trim(), subject: subject.trim(), summary: summary.trim(), rating: Number(rating) };
    setSaving(true);
    try {
      if (id) await dispatch(editStaffFeedback({ id, data })).unwrap();
      else await dispatch(createStaffFeedback({ ...data, patientId: patientId.trim(), sender: sender.trim() || undefined, type: 'Patient' })).unwrap();
      notify(id ? 'Feedback updated' : 'Feedback recorded', 'success');
      setForm(null);
    } catch (err) {
      notify(errorMessage(err, 'Failed to save feedback'), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!(await ask('Delete this feedback entry?', { title: 'Delete feedback', confirmLabel: 'Delete', danger: true }))) return;
    try {
      await dispatch(deleteStaffFeedback(id)).unwrap();
      notify('Feedback deleted', 'success');
    } catch (err) {
      notify(errorMessage(err, 'Failed to delete feedback'), 'error');
    }
  }

  const q = term.toLowerCase();
  const filtered = rows.filter((f) =>
    (f.sender.toLowerCase().includes(q) || f.subject.toLowerCase().includes(q) || f.id.toLowerCase().includes(q))
    && (type === 'All' || f.type === type));

  return (
    <div className="sp-feedback">
      <div className="header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Feedback &amp; Reports</h1>
          <div className="sub">Record and manage feedback from patients and staff.</div>
        </div>
        <button type="button" className="btn-dark" onClick={() => setForm({ ...EMPTY_FORM })}>+ Record Feedback</button>
      </div>

      <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
        <input type="text" id="searchTable" className="form-input" placeholder="Search by sender or subject..." style={{ width: 300 }} value={term} onChange={(e) => setTerm(e.target.value)} />
        <select className="form-select" id="filterType" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="All">All Types</option>
          <option value="Patient">Patient</option>
          <option value="Staff">Staff</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Feedback ID</th><th>Date</th><th>Sender Type</th><th>Sender Name</th><th>Subject</th><th>Rating</th><th>Actions</th></tr>
            </thead>
            <tbody id="feedbackTableBody">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>No feedback entries found.</td></tr>
              ) : filtered.map((f) => (
                <tr key={f.id}>
                  <td><strong>{f.id}</strong></td>
                  <td>{f.date}</td>
                  <td><span className={`status-badge ${f.type === 'Patient' ? 'status-patient' : 'status-staff'}`}>{f.type}</span></td>
                  <td>{f.sender}</td>
                  <td>{f.subject}</td>
                  <td><Stars rating={f.rating} /></td>
                  <td>
                    <div className="action-buttons">
                      <button type="button" className="action-btn" onClick={() => setView(f)} title="Read Feedback">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      </button>
                      <button type="button" className="action-btn" onClick={() => openEdit(f.id)}>Edit</button>
                      <button type="button" className="action-btn" onClick={() => remove(f.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {dialog}
      {form && (
        <div className="modal active">
          <form className="card modal-card" onSubmit={save}>
            <h3>{form.id ? 'Edit Feedback' : 'Record Feedback'}</h3>
            {!form.id && <>
              <label htmlFor="feedbackPatient">Patient ID</label>
              <input id="feedbackPatient" className="input" value={form.patientId} required onChange={(e) => setForm({ ...form, patientId: e.target.value })} />
              <label htmlFor="feedbackSender">Sender name</label>
              <input id="feedbackSender" className="input" value={form.sender} onChange={(e) => setForm({ ...form, sender: e.target.value })} />
            </>}
            <label htmlFor="feedbackCategory">Category</label>
            <input id="feedbackCategory" className="input" value={form.category} required onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <label htmlFor="feedbackSubject">Subject</label>
            <input id="feedbackSubject" className="input" value={form.subject} required onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <label htmlFor="feedbackSummary">Feedback</label>
            <textarea id="feedbackSummary" className="input" value={form.summary} required onChange={(e) => setForm({ ...form, summary: e.target.value })} />
            <label htmlFor="feedbackRating">Rating</label>
            <input id="feedbackRating" className="input" type="number" min="1" max="5" value={form.rating} required onChange={(e) => setForm({ ...form, rating: e.target.value })} />
            <div className="modal-actions">
              <button className="btn" disabled={saving}>Save Feedback</button>
              <button type="button" className="btn-outline" onClick={() => setForm(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      {view && (
        <div className="modal active" id="viewFeedbackModal" onMouseDown={(e) => { if (e.target === e.currentTarget) setView(null); }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Feedback Details</h2>
              <button type="button" className="modal-close" onClick={() => setView(null)}>&times;</button>
            </div>
            <div className="feedback-details-box" id="feedbackDetailsContainer">
              <div><strong>ID:</strong> {view.id}</div>
              <div><strong>Date:</strong> {view.date}</div>
              <div><strong>Type:</strong> {view.type}</div>
              <div><strong>Sender:</strong> {view.sender}</div>
              <hr style={{ border: 0, borderTop: '1px solid #e5e7eb', margin: '10px 0' }} />
              <div><strong>Subject:</strong> {view.subject}</div>
              <div><strong>Rating:</strong> <Stars rating={view.rating} /> ({view.rating}/5)</div>
              <div style={{ marginTop: 10 }}><strong>Feedback Body:</strong><br /> <span style={{ display: 'block', marginTop: 5 }}>{view.comment}</span></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button type="button" className="btn-light" onClick={() => setView(null)}>Close View</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
