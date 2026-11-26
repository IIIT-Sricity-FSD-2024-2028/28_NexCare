import { useEffect, useState } from 'react';
import useConfirm from '../../hooks/useConfirm';
import { useNotify } from '../../hooks/useNotify';
import { findPatient, patientName } from './staffData';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchPatientDirectory, selectStaffPatients } from '../../store/staffSlice';
import { createCheckin, deleteCheckin, fetchCheckins, moveCheckin, selectCheckins } from '../../store/checkinsSlice';

const formatTime = (value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function PatientCheckinPage() {
  const notify = useNotify();
  const dispatch = useAppDispatch();
  const { list: checkins, loading, error } = useAppSelector(selectCheckins);
  const { list: patients } = useAppSelector(selectStaffPatients);
  const { ask, dialog } = useConfirm();
  useEffect(() => {
    dispatch(fetchCheckins());
    dispatch(fetchPatientDirectory());
  }, [dispatch]);
  const [patientId, setPatientId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [busy, setBusy] = useState(false);
  // The `prompt()` for a new location, as a small dialog.
  const [locationPrompt, setLocationPrompt] = useState(null); // { checkinId, name, value }

  async function handleCheckin() {
    const id = patientId.trim();
    const why = purpose.trim();
    if (!id || !why) { notify('Please fill in both Patient ID and Visit Purpose to check them in.', 'warning'); return; }
    if (id.length < 2 || id.length > 32) { notify('Patient ID must be between 2 and 32 characters.', 'warning'); return; }
    if (!/^[A-Za-z0-9-]+$/.test(id)) { notify('Patient ID can only contain letters, numbers, and hyphens (e.g., P001 or PAT-2026-001).', 'warning'); return; }
    if (why.length < 3 || why.length > 80) { notify('Visit purpose must be between 3 and 80 characters.', 'warning'); return; }

    setBusy(true);
    try {
      const patient = findPatient(patients, id);
      const name = patientName(patient) || id;
      await dispatch(createCheckin({ patientId: patient?.patientId || patient?.id || id, name, purpose: why })).unwrap();
      notify('Checked in ' + name, 'success');
      setPatientId('');
      setPurpose('');
    } catch (err) {
      notify(err.message || 'Could not check in the patient', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function applyLocation() {
    const location = locationPrompt?.value.trim();
    if (!location || busy) return;
    setBusy(true);
    try {
      await dispatch(moveCheckin({ id: locationPrompt.checkinId, location })).unwrap();
      setLocationPrompt(null);
    } catch (err) {
      notify(err.message || 'Could not update the location', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function checkOut(id) {
    if (!(await ask('Check this patient out of the facility?', { title: 'Check out patient', confirmLabel: 'Check out' }))) return;
    try {
      await dispatch(deleteCheckin(id)).unwrap();
      notify('Patient checked out', 'success');
    } catch (err) {
      notify(err.message || 'Could not check out the patient', 'error');
    }
  }

  return (
    <div className="sp-checkin">
      <div className="header-row">
        <div>
          <h1>Patient Check-in &amp; Movement Tracking</h1>
          <div className="sub">Manage quick check-ins and track patient locations within the facility.</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-8 0v2" /><circle cx="12" cy="7" r="4" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
          Quick Check-in
        </div>
        <div className="checkin-card">
          <input type="text" id="patientIdInput" className="form-input" placeholder="Enter Patient ID" style={{ width: 250 }} required value={patientId} onChange={(e) => setPatientId(e.target.value)} />
          <input type="text" id="visitPurposeInput" className="form-input" placeholder="Visit Purpose" style={{ width: 200 }} required value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          <button type="button" className="btn-dark" onClick={handleCheckin} disabled={busy}>Check-in Patient</button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 15 }}>Patients in Facility</h3>
        <div id="patientsContainer">
          {loading ? <p>Loading check-ins.</p> : error ? <p role="alert">{error}</p> : checkins.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>No patients currently checked in.</div>
          ) : checkins.map((p) => (
            <div className="card" key={p.id} style={{ marginBottom: 24, border: '1px solid #E5E7EB', padding: 20, borderRadius: 12, background: '#FFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#111827' }}>{p.name}</div>
                  <span className={`status-badge ${p.status === 'In ER' ? 'status-er' : p.status === 'In Consultation' ? 'status-consultation' : 'status-waiting'}`}>{p.status}</span>
                </div>
                <button
                  type="button"
                  className="update-btn"
                  onClick={() => setLocationPrompt({ checkinId: p.id, name: p.name, value: '' })}
                  style={{ background: 'transparent', color: '#155DFC', border: '1.5px solid #155DFC', padding: '6px 16px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
                >
                  Update Location
                </button>
                <button type="button" className="btn-outline" onClick={() => checkOut(p.id)}>Check out</button>
              </div>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 20, fontFamily: "'JetBrains Mono', monospace" }}>
                ID: {p.id} &bull; Checked in: {formatTime(p.time)} &bull; 📍 {p.location}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: '#374151', letterSpacing: 0.5, textTransform: 'uppercase' }}>Movement History</div>
                <div className="movement-timeline" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {p.history.map((h, i) => (
                    <div key={`${h.label}-${i}`} style={{ display: 'contents' }}>
                      <div className="movement-step" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div className={`step-icon ${i > 0 && i === p.history.length - 1 ? 'waiting' : 'completed'}`}>
                          {i === 0 || i < p.history.length - 1
                            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#155DFC" strokeWidth="3"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                        </div>
                        <div className="step-label" style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{h.label}</div>
                        <div className="step-time" style={{ fontSize: 11, color: '#6B7280' }}>{formatTime(h.time)}</div>
                      </div>
                      {i < p.history.length - 1 && <div style={{ color: '#D1D5DB', fontSize: 18 }}>&rarr;</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {dialog}
      {locationPrompt && (
        <div className="modal active" onMouseDown={(e) => { if (e.target === e.currentTarget) setLocationPrompt(null); }}>
          <div className="card modal-card">
            <h3>Update Location</h3>
            <div className="small" style={{ margin: '8px 0 10px' }}>Update current location for {locationPrompt.name}:</div>
            <input
              className="input"
              autoFocus
              value={locationPrompt.value}
              onChange={(e) => setLocationPrompt({ ...locationPrompt, value: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') applyLocation(); }}
              placeholder="e.g. Consultation Room 2, ER, Pharmacy"
            />
            <div className="modal-actions">
              <button type="button" className="btn" onClick={applyLocation} disabled={busy}>OK</button>
              <button type="button" className="btn-outline" onClick={() => setLocationPrompt(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
