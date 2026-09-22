import { useEffect, useMemo, useState } from 'react';
import Header from '../../components/layout/Header';
import { Modal } from '../../components/ui';
import { Hospitals } from '../../api';
import { useToast } from '../../context/ToastContext';
import useConfirm from '../../hooks/useConfirm';
import '../../styles/regional-console.css';

// regional-officer/hospital-approvals.html + hospital-approvals.js.
//
// A regional manager sees only their assigned registrations and records a
// due-diligence recommendation. The superuser remains the final approver.

function normalise(status) {
  const s = String(status || '').toLowerCase();
  return s === 'pending' ? 'pending_verification' : s;
}

function label(status) {
  return status === 'pending_verification' ? 'awaiting review' : status.replace(/_/g, ' ');
}

const reviewNote = (h) => (
  h.regionalReviewStatus === 'cleared' ? 'Sent to superuser for final approval'
    : h.regionalReviewStatus === 'rejected' ? 'Review rejected; awaiting superuser decision'
      : 'No action needed'
);

export default function HospitalApprovalsPage() {
  const { notify } = useToast();
  const { ask, dialog } = useConfirm();
  const [hospitals, setHospitals] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('pending_verification');
  const [term, setTerm] = useState('');
  const [busyId, setBusyId] = useState(null);
  // The `prompt()` for a rejection reason, as a small dialog.
  const [reject, setReject] = useState(null); // { hospital, notes }

  useEffect(() => {
    let cancelled = false;
    Hospitals.getReviewQueue()
      .then((res) => { if (!cancelled) setHospitals(res.data || []); })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError('Could not load registrations. Check that the backend is running.');
      });
    return () => { cancelled = true; };
  }, []);

  const count = (st) => (hospitals || []).filter((h) => normalise(h.verificationStatus) === st).length;

  const rows = useMemo(() => {
    const t = term.trim().toLowerCase();
    return (hospitals || []).filter((h) => {
      const matchesStatus = status === 'all' || normalise(h.verificationStatus) === status;
      const haystack = `${h.name || ''} ${h.city || ''} ${h.registrationNumber || ''}`.toLowerCase();
      return matchesStatus && (!t || haystack.includes(t));
    });
  }, [hospitals, status, term]);

  async function decide(hospital, action, notes = '') {
    const name = hospital.name || hospital.id;
    setBusyId(hospital.id);
    try {
      await Hospitals.regionalReview(hospital.id, action, notes);
      setHospitals((list) => list.map((h) => (h.id === hospital.id ? { ...h, regionalReviewStatus: action } : h)));
      notify(`${name} ${action === 'cleared' ? 'sent to the superuser for final approval' : 'review rejected'} successfully`, 'success');
    } catch (err) {
      console.error(err);
      notify(err?.message || `Failed to ${action} registration. Please try again.`, 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function onClear(hospital) {
    if (!(await ask(`Clear for final approval the registration for ${hospital.name || hospital.id}?`, { title: 'Clear for final approval', confirmLabel: 'OK' }))) return;
    decide(hospital, 'cleared');
  }

  function onReject(hospital) {
    setReject({ hospital, notes: '' });
  }

  function submitReject() {
    const { hospital, notes } = reject;
    setReject(null);
    decide(hospital, 'rejected', notes);
  }

  return (
    <div className="ro-console">
      <Header title="Hospital Approvals" />
      <div className="page-body">
        <div className="hero">
          <h1>Hospital Registration Approvals</h1>
          <p>Review hospitals awaiting verification and approve or reject their registration.</p>
        </div>

        <div className="stats-grid">
          {[['Awaiting Review', 'pending_verification'], ['Verified', 'verified'], ['Rejected', 'rejected']].map(([lbl, st]) => (
            <div className="stat-card" key={st}>
              <div className="stat-info">
                <p className="stat-label">{lbl}</p>
                <p className="stat-value">{hospitals ? count(st) : '--'}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="activity-card">
          <div className="activity-header">
            <h2 className="section-title" style={{ margin: 0 }}>Registrations</h2>
          </div>
          <div className="toolbar" style={{ padding: '0 20px' }}>
            <select id="statusFilter" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="pending_verification">Awaiting review</option>
              <option value="all">All statuses</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
            <input type="text" id="searchInput" placeholder="Search by name, city or registration no." value={term} onChange={(e) => setTerm(e.target.value)} />
          </div>
          <table className="activity-table">
            <thead>
              <tr>
                <th>Hospital</th>
                <th>Location</th>
                <th>Capacity</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="approvalsTableBody">
              {error ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#DC2626' }}>{error}</td></tr>
              ) : hospitals === null ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#6A7282' }}>Loading registrations...</td></tr>
              ) : !rows.length ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#6A7282' }}>No registrations match this filter.</td></tr>
              ) : rows.map((h) => {
                const st = normalise(h.verificationStatus);
                const pending = st === 'pending_verification' && h.regionalReviewStatus !== 'cleared' && h.regionalReviewStatus !== 'rejected';
                return (
                  <tr key={h.id}>
                    <td className="actor-cell">
                      {h.name}
                      <div className="muted">{h.registrationNumber || 'No reg. number'} · {h.type || 'N/A'}</div>
                    </td>
                    <td>
                      {h.city || 'N/A'}
                      <div className="muted">{h.state || ''}{h.pincode ? ` - ${h.pincode}` : ''}</div>
                    </td>
                    <td>
                      {h.totalBeds || 0} beds
                      <div className="muted">{h.icuBeds || 0} ICU{h.emergency24x7 ? ' · 24x7 ER' : ''}</div>
                    </td>
                    <td>
                      {h.adminName || 'N/A'}
                      <div className="muted">{h.adminPhone || h.phone || ''}</div>
                    </td>
                    <td><span className={`pill ${st === 'verified' ? 'resolved' : st === 'rejected' ? 'urgent' : 'open'}`}>{label(st)}</span></td>
                    <td>
                      {pending ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button type="button" className="btn-sm btn-approve" disabled={busyId === h.id} onClick={() => onClear(h)}>Clear for approval</button>
                          <button type="button" className="btn-sm btn-reject" disabled={busyId === h.id} onClick={() => onReject(h)}>Reject</button>
                        </div>
                      ) : (
                        <span className="muted">{reviewNote(h)}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {dialog}
      <Modal open={Boolean(reject)} onClose={() => setReject(null)} title="Reject registration" maxWidth={440}>
        {reject && (
          <form onSubmit={(e) => { e.preventDefault(); submitReject(); }}>
            <label htmlFor="rejectNotes" style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Please provide a reason for rejecting {reject.hospital.name || reject.hospital.id}:
            </label>
            <input
              id="rejectNotes"
              autoFocus
              value={reject.notes}
              onChange={(e) => setReject((r) => ({ ...r, notes: e.target.value }))}
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 8, marginBottom: 16, fontSize: 14 }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn-sm btn-neutral" onClick={() => setReject(null)}>Cancel</button>
              <button type="submit" className="btn-sm btn-reject">OK</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
