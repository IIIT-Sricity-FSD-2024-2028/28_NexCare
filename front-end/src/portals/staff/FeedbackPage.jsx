import { useCallback, useEffect, useState } from 'react';
import { Feedback } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useHospitalId } from './staffData';

// administrative_staff/feedback.html + feedback.js: read-only feedback list
// with a details modal.

function Stars({ rating }) {
  return <span className="stars">{Array.from({ length: 5 }, (_, i) => (i < rating ? '★' : '☆')).join('')}</span>;
}

export default function FeedbackPage() {
  const hospitalId = useHospitalId();
  const { notify } = useToast();
  const [rows, setRows] = useState([]);
  const [term, setTerm] = useState('');
  const [type, setType] = useState('All');
  const [view, setView] = useState(null);

  const load = useCallback(async () => {
    try {
      const resp = await Feedback.getAll({ hospitalId });
      setRows((resp.data || []).map((f) => ({
        id: f.id,
        date: f.createdAt ? f.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        type: f.type || 'Patient',
        sender: f.sender || 'Anonymous',
        rating: f.rating || 0,
        subject: f.subject || 'Feedback',
        comment: f.summary || f.description || '',
      })));
    } catch (err) {
      console.error('Failed to load feedback:', err);
      notify('Failed to load feedback. Please check your connection and try again.', 'error');
      setRows([]);
    }
  }, [hospitalId, notify]);

  useEffect(() => { load(); }, [load]);

  const q = term.toLowerCase();
  const filtered = rows.filter((f) =>
    (f.sender.toLowerCase().includes(q) || f.subject.toLowerCase().includes(q) || f.id.toLowerCase().includes(q))
    && (type === 'All' || f.type === type));

  return (
    <div className="sp-feedback">
      <div className="header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Feedback &amp; Reports</h1>
          <div className="sub">View feedback from patients and staff.</div>
        </div>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
