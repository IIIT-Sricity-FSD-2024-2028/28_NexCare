import { useState } from 'react';
import { Users } from '../../api';
import { useToast } from '../../context/ToastContext';
import { findPatient, logActivity, patientName } from './staffData';

// administrative_staff/patient_checkin.html + patient_checkin.js.
//
// Check-ins are runtime-only: the HTML page kept them in sessionStorage under
// `nexcare_checkins_session` and never sent them to the backend. Same key
// here, so a tab that checked patients in on the HTML page still lists them.
const CHECKIN_KEY = 'nexcare_checkins_session';

function readCheckins() {
  try { return JSON.parse(sessionStorage.getItem(CHECKIN_KEY) || '[]'); } catch { return []; }
}
function writeCheckins(list) {
  sessionStorage.setItem(CHECKIN_KEY, JSON.stringify(list));
}
const timeNow = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function PatientCheckinPage() {
  const { notify } = useToast();
  const [checkins, setCheckins] = useState(readCheckins);
  const [patientId, setPatientId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [busy, setBusy] = useState(false);
  // The `prompt()` for a new location, as a small dialog.
  const [locationPrompt, setLocationPrompt] = useState(null); // { checkinId, name, value }

  function save(list) {
    writeCheckins(list);
    setCheckins(list);
  }

  async function handleCheckin() {
    const id = patientId.trim();
    const why = purpose.trim();
    if (!id || !why) { notify('Please fill in both Patient ID and Visit Purpose to check them in.', 'warning'); return; }
    if (id.length < 2 || id.length > 32) { notify('Patient ID must be between 2 and 32 characters.', 'warning'); return; }
    if (!/^[A-Za-z0-9-]+$/.test(id)) { notify('Patient ID can only contain letters, numbers, and hyphens (e.g., P001 or PAT-2026-001).', 'warning'); return; }
    if (why.length < 3 || why.length > 80) { notify('Visit purpose must be between 3 and 80 characters.', 'warning'); return; }

    setBusy(true);
    try {
      // Validate the patient exists; on a lookup failure the typed id is used as-is.
      let displayName = id;
      let foundId = id;
      try {
        const resp = await Users.getAll({ role: 'patient' });
        const found = findPatient(resp.data || [], id);
        if (found) { displayName = patientName(found); foundId = found.id; }
      } catch (err) {
        console.warn('Patient lookup failed, proceeding with input ID:', err);
      }

      const current = readCheckins();
      const existing = current.find((c) =>
        String(c.patientId || '').toLowerCase() === foundId.toLowerCase()
        && String(c.status || '').toLowerCase() !== 'completed');
      if (existing) { notify(`This patient is already checked in (Check-in ID: ${existing.id}).`, 'warning'); return; }

      const now = timeNow();
      const entry = {
        id: `C${Math.floor(Math.random() * 9000 + 1000)}`,
        patientId: foundId,
        name: displayName,
        status: 'Waiting',
        statusClass: 'status-waiting',
        time: now,
        location: 'Reception',
        history: [{ label: 'Reception', time: now, state: 'completed' }],
      };
      save([entry, ...current]);
      logActivity('Create', 'Patient Check-in', `Patient ${displayName} checked in for: ${why}`);
      notify(`Successfully checked in patient ${displayName} for ${why}`, 'success');
      setPatientId('');
      setPurpose('');
    } finally {
      setBusy(false);
    }
  }

  function applyLocation() {
    const loc = (locationPrompt?.value || '').trim();
    const target = locationPrompt?.checkinId;
    setLocationPrompt(null);
    if (!loc || !target) return;
    const current = readCheckins();
    const idx = current.findIndex((c) => c.id === target);
    if (idx < 0) return;
    const p = current[idx];
    const history = p.history.map((h) => (h.state === 'waiting' ? { ...h, state: 'completed' } : h));
    history.push({ label: loc, time: timeNow(), state: 'waiting' });
    let status = 'Moving';
    let statusClass = 'status-waiting';
    if (loc.toLowerCase().includes('consultation')) { status = 'In Consultation'; statusClass = 'status-consultation'; }
    if (loc.toLowerCase().includes('er')) { status = 'In ER'; statusClass = 'status-er'; }
    current[idx] = { ...p, location: loc, history, status, statusClass };
    save(current);
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
          <input type="text" id="patientIdInput" className="form-input" placeholder="Enter Patient ID or Name" style={{ width: 250 }} required value={patientId} onChange={(e) => setPatientId(e.target.value)} />
          <input type="text" id="visitPurposeInput" className="form-input" placeholder="Visit Purpose" style={{ width: 200 }} required value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          <button type="button" className="btn-dark" onClick={handleCheckin} disabled={busy}>Check-in Patient</button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 15 }}>Patients in Facility</h3>
        <div id="patientsContainer">
          {checkins.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>No patients currently checked in today.</div>
          ) : checkins.map((p) => (
            <div className="card" key={p.id} style={{ marginBottom: 24, border: '1px solid #E5E7EB', padding: 20, borderRadius: 12, background: '#FFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#111827' }}>{p.name}</div>
                  <span className={`status-badge ${p.statusClass}`}>{p.status}</span>
                </div>
                <button
                  type="button"
                  className="update-btn"
                  onClick={() => setLocationPrompt({ checkinId: p.id, name: p.name, value: '' })}
                  style={{ background: 'transparent', color: '#155DFC', border: '1.5px solid #155DFC', padding: '6px 16px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
                >
                  Update Location
                </button>
              </div>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 20, fontFamily: "'JetBrains Mono', monospace" }}>
                ID: {p.id} &bull; Checked in: {p.time} &bull; 📍 {p.location}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: '#374151', letterSpacing: 0.5, textTransform: 'uppercase' }}>Movement History</div>
                <div className="movement-timeline" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {p.history.map((h, i) => (
                    <div key={`${h.label}-${i}`} style={{ display: 'contents' }}>
                      <div className="movement-step" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div className={`step-icon ${h.state}`}>
                          {h.state === 'completed'
                            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#155DFC" strokeWidth="3"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                        </div>
                        <div className="step-label" style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{h.label}</div>
                        <div className="step-time" style={{ fontSize: 11, color: '#6B7280' }}>{h.time}</div>
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
              <button type="button" className="btn" onClick={applyLocation}>OK</button>
              <button type="button" className="btn-outline" onClick={() => setLocationPrompt(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
