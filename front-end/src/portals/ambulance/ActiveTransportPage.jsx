import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ambulance } from '../../api';
import { useToast } from '../../context/ToastContext';
import { TRANSPORT_STEPS, completionStamps, isFinalStep, nextStatus, stepIndexOf } from '../../features/ambulance/transportSteps';
import useTransportEta from '../../features/ambulance/useTransportEta';
import { useAmbulance } from './AmbulanceContext';
import { PageHeader, contactOf, locationOf, patientOf } from './ambulanceShared';

// #active-transport-page: the ETA banner, patient details, the vertical
// progress tracker and the step buttons. "Update to Next Step" is
// PATCH /:id/status with the next AmbulanceStatus; "Complete Transport"
// (shown at Reached Hospital) is PATCH /:id/complete, which also raises the
// transport charge on the patient's pending bill — once, keyed on the
// request id.
const svg = (d) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{d}</svg>;
const STEP_ICONS = [
  svg(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>),
  svg(<polygon points="3 11 22 2 13 21 11 13 3 11" />),
  svg(<><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></>),
  svg(<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>),
  svg(<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></>),
];

function ProgressTracker({ status }) {
  const cur = stepIndexOf(status);
  const maxIdx = TRANSPORT_STEPS.length - 1;
  const percent = maxIdx > 0 ? (cur / maxIdx) * 100 : 100;
  return (
    <div className="progress-tracker" id="progress-tracker">
      <div className="progress-line"><div className="progress-line-fill" style={{ height: `${percent}%` }} /></div>
      <div className="progress-steps">
        {TRANSPORT_STEPS.map((step, i) => {
          const cls = i < cur ? 'completed' : i === cur ? 'current' : 'pending';
          return (
            <div key={step.status} className="progress-step">
              <div className={`step-icon ${cls}`}>{STEP_ICONS[i]}</div>
              <div className="step-content">
                <h3 className={cls}>{step.label}</h3>
                {cls === 'completed' && <p className="step-status completed">Completed</p>}
                {cls === 'current' && <p className="step-status current">In Progress</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ActiveTransportPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const { activeTransport: active, loaded, reload } = useAmbulance();
  const [busy, setBusy] = useState(false);
  const eta = useTransportEta(active?.id, active?.status);

  async function nextStep() {
    const next = nextStatus(active.status);
    if (!next) return;
    setBusy(true);
    try {
      await Ambulance.updateStatus(active.id, next);
      await reload();
    } catch (err) {
      notify(err?.message || 'Failed to update the transport step. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function complete() {
    setBusy(true);
    try {
      // The completion stamps app.js wrote on the record, then the completion itself.
      await Ambulance.update(active.id, completionStamps());
      await Ambulance.complete(active.id);
      // app.js also called NexCareStore.logActivity() here; POST /system/activity
      // is staff/superuser-only, so for this role it was always a 403 — dropped.
      notify(`Transport for ${patientOf(active)} completed successfully!`, 'success');
      await reload();
      navigate('/ambulance/completed-transports');
    } catch (err) {
      console.error('Error completing transport:', err);
      notify(err?.message || 'Failed to complete transport. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  }

  function callPatient() {
    notify(`Calling ${patientOf(active)} at ${contactOf(active)}...`, 'info');
    setTimeout(() => notify(`Call initiated to ${patientOf(active)}`, 'success'), 1500);
  }

  const info = (id, tone, icon, label, value) => (
    <div className="info-item">
      <div className={`info-icon ${tone}`}>{icon}</div>
      <div><p className="info-label">{label}</p><p className="info-value" id={id}>{value}</p></div>
    </div>
  );

  return (
    <div className="page active" id="active-transport-page">
      <PageHeader title="Active Transport" />

      {loaded && !active && (
        <div className="content-card" id="active-transport-empty">
          <p className="page-subtitle" style={{ margin: 0, padding: 24 }}>No active transport. Accept a dispatch and choose <strong>Start transport</strong> from Assigned Dispatch.</p>
        </div>
      )}

      {active && (
        <div id="active-transport-panel">
          <div className="eta-banner" id="eta-banner" style={{ display: 'flex' }}>
            <div className="eta-info">
              <div>
                <h3 style={{ margin: '0 0 4px 0' }}>Real-time ETA</h3>
                <p style={{ margin: 0, opacity: 0.9, fontSize: 14 }}>Estimated time to next step</p>
              </div>
              <div id="eta-display" className={eta === 'Completed' ? 'eta-completed' : 'eta-live eta-pulse'}>
                {eta === 'Completed' ? '✓ Step Completed' : `⏱️ ETA: ${eta || '--:--'}`}
              </div>
            </div>
            <div id="eta-step-info" style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, opacity: 0.9 }}>Current Step</div>
              <div id="eta-current-step" style={{ fontWeight: 600 }}>{TRANSPORT_STEPS[stepIndexOf(active.status)]?.label || '--'}</div>
            </div>
          </div>

          <div className="content-card">
            <h2 className="card-title">Patient Details</h2>
            <div className="info-grid">
              {info('active-patient-name', 'blue-bg', <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>, 'Patient Name', patientOf(active))}
              {info('active-patient-phone', 'teal-bg', <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>, 'Contact Number', contactOf(active))}
              {info('active-patient-location', 'orange-bg', <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>, 'Pickup Location', locationOf(active))}
            </div>
          </div>

          <div className="content-card">
            <h2 className="card-title">Transport Progress</h2>
            <ProgressTracker status={active.status} />
          </div>

          <div className="action-buttons" id="active-transport-actions" style={{ display: 'flex' }}>
            {!isFinalStep(active.status) && <button type="button" id="next-step-btn" className="btn btn-primary" disabled={busy} onClick={nextStep}>Update to Next Step</button>}
            {isFinalStep(active.status) && <button type="button" id="complete-transport-btn" className="btn btn-success" disabled={busy} onClick={complete}>{busy ? 'Completing…' : 'Complete Transport'}</button>}
            <button type="button" id="call-patient-btn" className="btn-call" onClick={callPatient}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
              Call Patient
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
