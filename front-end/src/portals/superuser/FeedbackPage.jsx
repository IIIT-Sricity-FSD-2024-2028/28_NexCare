import { useEffect, useMemo, useState } from 'react';
import useConfirm from '../../hooks/useConfirm';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  deleteFeedback as deleteFeedbackAction,
  fetchSuFeedback,
  selectSuFeedback,
} from '../../store/superuserSlice';
import { ICONS, MessageRow, Stars, SuPage } from './suShared';

// superuser/feedback.html + feedback.js: every feedback entry on the platform
// with hospital / type / text filters, a read-only details modal and a
// permanent delete. feedback.js re-fetched the list on every filter change;
// the SPA fetches once, filters in memory and re-fetches after a delete.

function toRow(f, hospMap) {
  return {
    id: f.id,
    date: f.createdAt ? f.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
    type: f.type || 'Patient',
    sender: f.sender || 'Anonymous',
    rating: f.rating || 0,
    subject: f.subject || 'Feedback',
    comment: f.summary || f.description || '',
    hospitalName: f.hospitalName || hospMap[f.hospitalId] || f.hospitalId || 'Unknown Hospital',
  };
}

export default function FeedbackPage() {
  const { ask, dialog } = useConfirm();
  const dispatch = useAppDispatch();
  const { list: feedbackRows, loading, error } = useAppSelector(selectSuFeedback);
  const items = useMemo(() => (feedbackRows || []).map((feedback) => toRow(feedback, {})), [feedbackRows]);
  const hospitalOptions = useMemo(
    () => [...new Set(items.map((row) => row.hospitalName))].sort(),
    [items],
  );
  const [term, setTerm] = useState('');
  const [type, setType] = useState('All');
  const [hospital, setHospital] = useState('All');
  const [viewing, setViewing] = useState(null);

  useEffect(() => { dispatch(fetchSuFeedback()); }, [dispatch]);

  const rows = useMemo(() => {
    const t = term.toLowerCase();
    return items.filter((f) => {
      const matchesTerm = f.sender.toLowerCase().includes(t) || f.subject.toLowerCase().includes(t) || f.id.toLowerCase().includes(t);
      const matchesType = type === 'All' || f.type === type;
      const matchesHosp = hospital === 'All' || f.hospitalName === hospital;
      return matchesTerm && matchesType && matchesHosp;
    });
  }, [items, term, type, hospital]);

  async function deleteFeedback(id) {
    if (!(await ask('WARNING: Are you sure you want to permanently delete this feedback?', { title: 'Delete feedback', confirmLabel: 'OK', danger: true }))) return;
    try {
      await dispatch(deleteFeedbackAction(id)).unwrap();
    } catch (err) {
      console.error('Delete feedback failed:', err);
    }
  }

  return (
    <SuPage className="su-page su-feedback" title="Feedback Review">
      <div className="page-header">
        <div>
          <h1>Feedback Review</h1>
          <p style={{ margin: '5px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Review system feedback provided by patients and staff.</p>
        </div>
        <div className="action-row" style={{ display: 'flex', gap: 10 }}>
          <select id="filterHospital" className="form-control" style={{ width: 200 }} value={hospital} onChange={(e) => setHospital(e.target.value)}>
            <option value="All">All Hospitals</option>
            {hospitalOptions.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
          <select id="filterType" className="form-control" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="All">All Types</option>
            <option value="Patient">Patients</option>
            <option value="Staff">Staff</option>
          </select>
          <input type="text" id="searchTable" placeholder="Search Feedback..." className="form-control" style={{ width: 250 }} value={term} onChange={(e) => setTerm(e.target.value)} />
        </div>
      </div>

      <div className="table-card">
        <table className="data-table" id="feedbackTable">
          <thead>
            <tr>
              <th>Feedback ID</th><th>Date</th><th>Hospital</th><th>Type</th><th>Sender</th><th>Subject</th><th>Rating</th><th>Actions</th>
            </tr>
          </thead>
          <tbody id="feedbackTableBody">
            {loading ? (
              <MessageRow colSpan={8}>Loading feedback…</MessageRow>
            ) : error ? (
              <MessageRow colSpan={8} padding={30} color="#DC2626">{error}</MessageRow>
            ) : !rows.length ? (
              <MessageRow colSpan={7} padding={30}>No feedback entries found.</MessageRow>
            ) : rows.map((f) => (
              <tr key={f.id}>
                <td style={{ fontWeight: 500, color: '#111827' }}>{f.id}</td>
                <td>{f.date}</td>
                <td>{f.hospitalName}</td>
                <td><span className={`badge ${f.type === 'Patient' ? 'Patient' : 'Staff'}`}>{f.type}</span></td>
                <td>{f.sender}</td>
                <td>{f.subject}</td>
                <td><Stars rating={f.rating} /></td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn-icon" onClick={() => setViewing(f)} title="Read Feedback">{ICONS.eye}</button>
                    <button type="button" className="btn-icon danger" onClick={() => deleteFeedback(f.id)} title="Delete">{ICONS.trash}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Modal — the page's own overlay, not the shared Modal, so it looks the same. */}
      {viewing && (
        <div className="modal-overlay active" id="viewFeedbackModal" onMouseDown={(e) => { if (e.target === e.currentTarget) setViewing(null); }}>
          <div className="modal-card">
            <div className="modal-header">
              <h2>Feedback Details</h2>
              <button type="button" className="modal-close" onClick={() => setViewing(null)}>&times;</button>
            </div>
            <div className="modal-body" id="feedbackDetailsContainer">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div><strong style={{ color: '#6b7280' }}>ID:</strong> {viewing.id}</div>
                <div><strong style={{ color: '#6b7280' }}>Date:</strong> {viewing.date}</div>
                <div><strong style={{ color: '#6b7280' }}>Type:</strong> {viewing.type}</div>
                <div><strong style={{ color: '#6b7280' }}>Sender:</strong> {viewing.sender}</div>
              </div>
              <hr style={{ border: 0, borderTop: '1px solid #e5e7eb', margin: '15px 0' }} />
              <div style={{ marginBottom: 10 }}><strong style={{ color: '#6b7280' }}>Subject:</strong> {viewing.subject}</div>
              <div style={{ marginBottom: 15 }}><strong style={{ color: '#6b7280' }}>Rating:</strong> <Stars rating={viewing.rating} /> ({viewing.rating}/5)</div>
              <div>
                <strong style={{ color: '#6b7280' }}>Feedback Body:</strong>
                <div style={{ marginTop: 8, padding: 12, background: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb' }}>{viewing.comment}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      {dialog}
    </SuPage>
  );
}
