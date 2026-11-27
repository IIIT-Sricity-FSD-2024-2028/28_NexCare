import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addToast } from '../../store/toastSlice';
import { selectUser } from '../../store/authSlice';
import {
  dispatchAmbulance,
  fetchAmbulanceRequests,
  selectAmbulanceRequests,
  selectChecklistComplete,
  selectPendingRequests,
} from '../../store/ambulanceSlice';
import { isPending, requestTime } from '../../features/ambulance/transportSteps';
import { EmptyState, ICON_PATH, PageHeader, PriorityBadge, contactOf, locationOf, patientOf } from './ambulanceShared';

const PAGE_SIZE = 10;

// #ambulance-requests-page: renderAmbulanceRequests() + the delegated Accept
// handler. Accepting is PATCH /ambulance/:id/dispatch with this crew member
// as `assignedTo` (app.js sent a bare PUT { status: 'Dispatched' }, which
// left the request attributed to nobody); the outcome — status Dispatched,
// the request on the Assigned Dispatch page — is the same. Accept stays
// disabled until the pre-departure checklist is complete, as it did.
// The backend stamps this crew's own vehicle and driver on the request and
// refuses it when the crew is already out on another transport.
const messageOf = (err, fallback) => (typeof err === 'string' && err) || err?.message || fallback;

export default function RequestsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const requestsState = useAppSelector(selectAmbulanceRequests);
  const pending = useAppSelector(selectPendingRequests);
  const checklistComplete = useAppSelector(selectChecklistComplete);
  const [busy, setBusy] = useState('');
  const [page, setPage] = useState(1);
  const loaded = requestsState.loaded;
  const notify = (message, type) => dispatch(addToast({ message, type }));

  const totalPages = Math.max(1, Math.ceil(pending.length / PAGE_SIZE));
  const paginatedPending = pending.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function accept(r) {
    if (!isPending(r)) { notify('This request is no longer pending', 'warning'); dispatch(fetchAmbulanceRequests()); return; }
    setBusy(r.id);
    try {
      await dispatch(dispatchAmbulance({
        id: r.id,
        assignedTo: user.id,
      })).unwrap();
      notify(`Accepted request ${r.id} - ${patientOf(r)}`, 'success');
      navigate('/ambulance/assigned-dispatch');
    } catch (err) {
      console.error('Error accepting request:', err);
      notify(messageOf(err, 'Failed to accept request. Please try again.'), 'error');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="page active" id="ambulance-requests-page">
      <PageHeader title="Incoming Requests" subtitle="Review and accept emergency ambulance dispatch requests" />
      <div className="content-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Request ID</th><th>Patient Name</th><th>Pickup Location</th><th>Contact Number</th><th>Request Time</th><th>Priority Level</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody id="ambulance-requests-tbody">
              {!loaded && <tr><td colSpan={8} className="text-gray">Loading requests…</td></tr>}
              {loaded && paginatedPending.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={8}>
                    <EmptyState icon={ICON_PATH.inbox} title="No Pending Requests" description="There are no pending ambulance requests from dispatch at the moment. New requests will appear here automatically." />
                  </td>
                </tr>
              )}
              {paginatedPending.map((r) => (
                <tr key={r.id}>
                  <td><span className="request-id">{r.id}</span></td>
                  <td><span className="patient-name">{patientOf(r)}</span></td>
                  <td><span className="text-gray">{locationOf(r)}</span></td>
                  <td><span className="text-gray">{contactOf(r)}</span></td>
                  <td><span className="text-gray">{requestTime(r)}</span></td>
                  <td><PriorityBadge request={r} /></td>
                  <td><span className="badge badge-orange">Pending</span></td>
                  <td>
                    {!checklistComplete && <div className="checklist-warning" style={{ color: '#DC2626', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>CHECKLIST REQUIRED</div>}
                    <button type="button" className="btn btn-primary btn-sm accept-btn" disabled={!checklistComplete || busy === r.id} title={checklistComplete ? undefined : 'Complete safety checklist to accept'} onClick={() => accept(r)}>
                      {busy === r.id ? 'Accepting…' : 'Accept'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, alignItems: 'center' }}>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Prev
            </button>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              Page {page} of {totalPages} ({pending.length} total)
            </span>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
