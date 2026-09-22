import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ambulance } from '../../api';
import { useToast } from '../../context/ToastContext';
import { isPending, requestTime } from '../../features/ambulance/transportSteps';
import { useAmbulance } from './AmbulanceContext';
import { EmptyState, ICON_PATH, PageHeader, PriorityBadge, contactOf, locationOf, patientOf } from './ambulanceShared';

// #ambulance-requests-page: renderAmbulanceRequests() + the delegated Accept
// handler. Accepting is PATCH /ambulance/:id/dispatch with this crew member
// as `assignedTo` (app.js sent a bare PUT { status: 'Dispatched' }, which
// left the request attributed to nobody); the outcome — status Dispatched,
// the request on the Assigned Dispatch page — is the same. Accept stays
// disabled until the pre-departure checklist is complete, as it did.
export default function RequestsPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const { user, profile, requests, loaded, checklistComplete, reload } = useAmbulance();
  const [busy, setBusy] = useState('');
  const pending = requests.filter(isPending);

  async function accept(r) {
    if (!isPending(r)) { notify('This request is no longer pending', 'warning'); reload(); return; }
    setBusy(r.id);
    try {
      await Ambulance.dispatch(r.id, user.id, profile.vehicle || user.assignedVehicle || undefined);
      notify(`Accepted request ${r.id} - ${patientOf(r)}`, 'success');
      await reload();
      navigate('/ambulance/assigned-dispatch');
    } catch (err) {
      console.error('Error accepting request:', err);
      notify(err?.message || 'Failed to accept request. Please try again.', 'error');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="page active" id="ambulance-requests-page">
      <PageHeader title="Incoming Requests" />
      <div className="content-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Request ID</th><th>Patient Name</th><th>Pickup Location</th><th>Contact Number</th><th>Request Time</th><th>Priority Level</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody id="ambulance-requests-tbody">
              {!loaded && <tr><td colSpan={8} className="text-gray">Loading requests…</td></tr>}
              {loaded && pending.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={8}>
                    <EmptyState icon={ICON_PATH.inbox} title="No Pending Requests" description="There are no pending ambulance requests from dispatch at the moment. New requests will appear here automatically." />
                  </td>
                </tr>
              )}
              {pending.map((r) => (
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
      </div>
    </div>
  );
}
