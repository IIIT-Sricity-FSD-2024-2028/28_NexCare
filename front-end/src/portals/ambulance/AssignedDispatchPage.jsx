import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ambulance } from '../../api';
import { useToast } from '../../context/ToastContext';
import useConfirm from '../../hooks/useConfirm';
import { isAssigned } from '../../features/ambulance/transportSteps';
import { CHECKLIST_ITEMS, useAmbulance } from './AmbulanceContext';
import { EmptyState, ICON_PATH, PageHeader, PriorityBadge, contactOf, locationOf, patientOf } from './ambulanceShared';

// #assigned-dispatch-page: the three counters, the pre-departure checklist
// (sessionStorage-backed, gates Accept and Start Transport) and one card per
// Dispatched request. Start Transport → PATCH /:id/status { En Route }; only
// one transport can be active at a time, as the page enforced. Cancel
// Assignment → PUT { status: 'Pending' } after the confirm.
export default function AssignedDispatchPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const { ask, dialog } = useConfirm();
  const { requests, loaded, activeTransport, checklist, checklistComplete, toggleChecklist, reload } = useAmbulance();
  const [busy, setBusy] = useState('');
  const assigned = requests.filter(isAssigned);

  async function start(r) {
    setBusy(r.id);
    try {
      await Ambulance.updateStatus(r.id, 'En Route');
      notify(`Transport started for ${patientOf(r)}`, 'success');
      await reload();
      navigate('/ambulance/active-transport');
    } catch (err) {
      console.error('Error starting transport:', err);
      notify(err?.message || 'Failed to start transport. Please try again.', 'error');
    } finally {
      setBusy('');
    }
  }

  async function cancel(r) {
    if (!(await ask(`Cancel assignment for ${patientOf(r)}?`, { title: 'Cancel assignment', confirmLabel: 'Cancel assignment', danger: true }))) return;
    setBusy(r.id);
    try {
      await Ambulance.update(r.id, { status: 'Pending' });
      await reload();
      notify(`Assignment canceled for ${patientOf(r)}`, 'info');
    } catch (err) {
      console.error('Error canceling assignment:', err);
      notify(err?.message || 'Failed to cancel assignment. Please try again.', 'error');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="page active" id="assigned-dispatch-page">
      <PageHeader title="Assigned Dispatch" />

      <div className="stats-grid-3">
        <div className="stat-card"><h3 className="stat-label">Total Assigned</h3><p className="stat-value" id="dispatch-stat-total">{assigned.length + (activeTransport ? 1 : 0)}</p></div>
        <div className="stat-card"><h3 className="stat-label">Ready to Start</h3><p className="stat-value stat-value-blue" id="dispatch-stat-ready">{assigned.length}</p></div>
        <div className="stat-card"><h3 className="stat-label">In Progress</h3><p className="stat-value stat-value-teal" id="dispatch-stat-progress">{activeTransport ? 1 : 0}</p></div>
      </div>

      <div className="content-card">
        <h2 className="card-title">Pre-Departure Checklist</h2>
        <div className="checklist-grid">
          {CHECKLIST_ITEMS.map((item, i) => (
            <label key={item} className="checkbox-label">
              <input type="checkbox" className="checkbox" checked={Boolean(checklist[`checklist-${i}`])} onChange={() => toggleChecklist(i)} />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>

      <div id="assigned-requests-container" className="dispatch-cards">
        {!loaded && <p className="text-gray">Loading…</p>}
        {loaded && assigned.length === 0 && (
          <EmptyState
            icon={ICON_PATH.clipboard}
            title="No Assigned Dispatches"
            description="You don't have any assigned ambulance requests. Accept pending requests from the Incoming Requests page to see them here."
            action={<Link to="/ambulance/ambulance-requests" className="btn btn-primary">View Incoming Requests</Link>}
          />
        )}
        {assigned.map((r) => {
          const blocked = activeTransport ? 'Finish current transport first' : !checklistComplete ? 'Complete ALL pre-departure checklist items to start' : '';
          return (
            <div key={r.id} className="dispatch-card">
              <div className="dispatch-card-header">
                <div>
                  <h3 className="dispatch-patient">{patientOf(r)}</h3>
                  <span className="dispatch-id">{r.id}</span>
                </div>
                <div className="dispatch-badges">
                  <span className="badge badge-green">Ready to Start</span>
                  <PriorityBadge request={r} />
                </div>
              </div>
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-icon blue-bg"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg></div>
                  <div><p className="info-label">Pickup Address</p><p className="info-value">{locationOf(r)}</p></div>
                </div>
                <div className="info-item">
                  <div className="info-icon teal-bg"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg></div>
                  <div><p className="info-label">Contact Number</p><p className="info-value">{contactOf(r)}</p></div>
                </div>
              </div>
              <div className="dispatch-actions">
                {!checklistComplete && <div className="checklist-warning" style={{ color: '#DC2626', fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>📋 Checklist Required</div>}
                <button type="button" className="btn btn-teal start-transport-btn" disabled={Boolean(blocked) || busy === r.id} title={blocked || undefined} onClick={() => start(r)}>
                  {busy === r.id ? 'Starting…' : 'Start Transport'}
                </button>
                <button type="button" className="btn-cancel cancel-assignment-btn" disabled={busy === r.id} onClick={() => cancel(r)}>Cancel Assignment</button>
              </div>
            </div>
          );
        })}
      </div>
      {dialog}
    </div>
  );
}
