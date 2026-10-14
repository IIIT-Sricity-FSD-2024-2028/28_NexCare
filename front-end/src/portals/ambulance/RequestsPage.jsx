import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ambulance } from '../../api';
import Header from '../../components/layout/Header';
import { useToast } from '../../context/ToastContext';
import { isPending, requestTime } from '../../features/ambulance/transportSteps';
import { useAmbulance } from './AmbulanceContext';
import { EmptyState, ICON_PATH, PageHeader, PriorityBadge, contactOf, locationOf, patientOf } from './ambulanceShared';

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
      <Header title="Incoming Requests" />
      <div className="page-body">
        <PageHeader
          title="Incoming Requests"
          subtitle="Real-time emergency requests requiring ambulance dispatch response."
        />

        {!checklistComplete && (
          <div className="note warn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <strong>Pre-Departure Safety Checklist Required:</strong> You must complete all safety checklist items in Assigned Dispatch before you can accept new dispatches.
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/ambulance/assigned-dispatch')}
            >
              Go to Safety Checklist →
            </button>
          </div>
        )}

        <div className="content-card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Patient Name</th>
                  <th>Pickup Location</th>
                  <th>Contact Number</th>
                  <th>Request Time</th>
                  <th>Priority Level</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody id="ambulance-requests-tbody">
                {!loaded && <tr><td colSpan={8} className="text-gray" style={{ textAlign: 'center', padding: 28 }}>Loading requests…</td></tr>}
                {loaded && pending.length === 0 && (
                  <tr className="empty-row">
                    <td colSpan={8}>
                      <EmptyState
                        icon={ICON_PATH.inbox}
                        title="No Pending Requests"
                        description="There are no pending ambulance requests from dispatch at the moment. New requests will appear here automatically."
                      />
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
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm accept-btn"
                        disabled={!checklistComplete || busy === r.id}
                        title={checklistComplete ? undefined : 'Complete safety checklist to accept'}
                        onClick={() => accept(r)}
                      >
                        {busy === r.id ? 'Accepting…' : 'Accept Request'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
