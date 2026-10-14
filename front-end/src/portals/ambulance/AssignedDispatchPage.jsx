import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ambulance } from '../../api';
import Header from '../../components/layout/Header';
import { useToast } from '../../context/ToastContext';
import useConfirm from '../../hooks/useConfirm';
import { isAssigned } from '../../features/ambulance/transportSteps';
import { CHECKLIST_ITEMS, useAmbulance } from './AmbulanceContext';
import { EmptyState, ICON_PATH, PageHeader, PriorityBadge, contactOf, locationOf, patientOf } from './ambulanceShared';

export default function AssignedDispatchPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const { ask, dialog } = useConfirm();
  const { requests, loaded, activeTransport, checklist, checklistComplete, toggleChecklist, reload } = useAmbulance();
  const [busy, setBusy] = useState('');
  const assigned = requests.filter(isAssigned);
  const checklistCount = CHECKLIST_ITEMS.filter((_, i) => checklist[`checklist-${i}`]).length;

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
      <Header title="Assigned Dispatch" />
      <div className="page-body">
        <PageHeader
          title="Assigned Dispatch"
          subtitle="Review assigned dispatches, verify safety checklist, and start patient transport."
        />

        <div className="stats-grid-3">
          <div className="stat-card">
            <span className="stat-label">Total Assigned</span>
            <p className="stat-value" id="dispatch-stat-total">{assigned.length + (activeTransport ? 1 : 0)}</p>
            <span className="stat-change">Active in dispatch queue</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Ready to Start</span>
            <p className="stat-value stat-value-blue" id="dispatch-stat-ready">{assigned.length}</p>
            <span className="stat-change">Awaiting transport launch</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">In Progress</span>
            <p className="stat-value stat-value-teal" id="dispatch-stat-progress">{activeTransport ? 1 : 0}</p>
            <span className="stat-change">{activeTransport ? '1 active transit underway' : 'No active transit'}</span>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header-row">
            <div>
              <h2 className="card-title">Pre-Departure Safety Checklist</h2>
              <p className="card-subtitle">Verify all mandatory safety protocols before initiating transport</p>
            </div>
            {checklistComplete ? (
              <span className="badge badge-green">✓ All 4 Checks Complete</span>
            ) : (
              <span className="badge badge-orange">{checklistCount} of 4 Checks Completed</span>
            )}
          </div>
          <div className="checklist-grid">
            {CHECKLIST_ITEMS.map((item, i) => (
              <label key={item} className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={Boolean(checklist[`checklist-${i}`])}
                  onChange={() => toggleChecklist(i)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div id="assigned-requests-container" className="dispatch-cards">
          {!loaded && <p className="text-gray" style={{ textAlign: 'center', padding: 24 }}>Loading dispatches…</p>}
          {loaded && assigned.length === 0 && (
            <div className="content-card">
              <EmptyState
                icon={ICON_PATH.clipboard}
                title="No Assigned Dispatches"
                description="You don't have any assigned ambulance requests right now. Accept pending requests from Incoming Requests to dispatch."
                action={<Link to="/ambulance/ambulance-requests" className="btn btn-primary">View Incoming Requests</Link>}
              />
            </div>
          )}
          {assigned.map((r) => {
            const blocked = activeTransport
              ? 'Finish current active transport first'
              : !checklistComplete
              ? 'Complete ALL pre-departure safety checklist items to start'
              : '';
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
                    <div className="info-icon blue-bg">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div>
                      <p className="info-label">Pickup Address</p>
                      <p className="info-value">{locationOf(r)}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-icon teal-bg">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    <div>
                      <p className="info-label">Contact Number</p>
                      <p className="info-value">{contactOf(r)}</p>
                    </div>
                  </div>
                </div>

                <div className="dispatch-actions">
                  <button
                    type="button"
                    className="btn btn-teal start-transport-btn"
                    disabled={Boolean(blocked) || busy === r.id}
                    title={blocked || undefined}
                    onClick={() => start(r)}
                  >
                    {busy === r.id ? 'Starting…' : 'Start Transport'}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel cancel-assignment-btn"
                    disabled={busy === r.id}
                    onClick={() => cancel(r)}
                  >
                    Cancel Assignment
                  </button>
                  {blocked && <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>{blocked}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {dialog}
    </div>
  );
}
