import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addToast } from '../../store/toastSlice';
import { selectUser } from '../../store/authSlice';
import { assignCrew, createTransport, fetchFleet, fetchHmOverview, selectHmAmbulance } from '../../store/hospitalManagerSlice';
import { Field, HmModal, LoadingCell } from './hmShared';

// TAB — Ambulance Status & Fleet.
//
// The fleet is real: one ambulance-crew login of this hospital is one
// ambulance (its vehicle + its driver), read from GET /ambulance/fleet with
// each unit's live state (free, out on a transport, off duty, no vehicle).
// Requests are a separate table; a waiting one is handed to a FREE crew of
// this hospital with PATCH /ambulance/:id/dispatch, and the backend refuses a
// busy crew or one from another hospital. Vehicles are assigned when a crew is
// registered (Staff → Register), not typed in here.
//
// (Before this, the page listed transport requests as if they were vehicles,
// offered a hard-coded vehicle list and let the driver be typed in freely.)
const svg = (d) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{d}</svg>;
const ICON = {
  fleet: svg(<><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M10 10v4" /><path d="M8 12h4" /></>),
  check: svg(<polyline points="20 6 9 17 4 12" />),
  bolt: svg(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />),
  cog: svg(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></>),
};
const UNIT_BADGE = {
  available: { bg: '#dcfce7', color: '#15803d', text: '🟢 Available' },
  on_transport: { bg: '#dbeafe', color: '#1d4ed8', text: '🔵 On Transport' },
  off_duty: { bg: '#f1f5f9', color: '#475569', text: '⚪ Off Duty' },
  no_vehicle: { bg: '#fee2e2', color: '#b91c1c', text: '🔴 No Vehicle' },
};
const REQUEST_BADGE = {
  pending: { bg: '#fee2e2', color: '#b91c1c', text: '🔴 Waiting for Crew' },
  dispatched: { bg: '#dbeafe', color: '#1d4ed8', text: '🔵 Dispatched' },
  'en route': { bg: '#fef3c7', color: '#b45309', text: '🟡 En Route' },
  'picked up': { bg: '#fef3c7', color: '#b45309', text: '🟡 Picked Up' },
  'at hospital': { bg: '#e0f2fe', color: '#0369a1', text: '🏥 At Hospital' },
  completed: { bg: '#e0f2fe', color: '#0369a1', text: '✅ Completed' },
  cancelled: { bg: '#f1f5f9', color: '#475569', text: '⚪ Cancelled' },
};
const SERVICE_TYPES = ['Advanced Life Support (ALS)', 'Basic Life Support (BLS)', 'ICU on Wheels (Cardiac Mobile Unit)', 'Neonatal / Pediatric ICU Transport', 'Patient Transport Service (PTS)'];
const blankRequest = { patientId: '', patientName: '', contact: '', pickupLocation: '', type: SERVICE_TYPES[0], crewId: '', notes: '' };

function Badge({ map, status }) {
  const b = map[(status || '').toLowerCase()];
  if (!b) return <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>{status || 'Unknown'}</span>;
  return <span className="badge" style={{ background: b.bg, color: b.color, fontWeight: 700 }}>{b.text}</span>;
}

const messageOf = (err, fallback) => (typeof err === 'string' && err) || err?.message || fallback;
const crewLabel = (c) => `${c.vehicleNumber} — ${c.driverName} (${c.unit})`;

export default function AmbulancePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const { fleet, requests, loading, error } = useAppSelector(selectHmAmbulance);
  const hospitalId = user?.hospitalId || '';
  const [term, setTerm] = useState('');
  const [status, setStatus] = useState('active');
  const [pick, setPick] = useState({}); // requestId → crewId chosen in its row
  const [create, setCreate] = useState(null);
  const [busy, setBusy] = useState('');

  const reload = () => { dispatch(fetchFleet()); dispatch(fetchHmOverview()); };
  useEffect(() => { dispatch(fetchFleet()); }, [dispatch]);

  const crews = fleet?.crews || [];
  const freeCrews = crews.filter((c) => c.status === 'available');
  const failed = Boolean(error);
  const firstLoad = loading && !fleet;

  const lower = (r) => (r.status || '').toLowerCase();
  const ACTIVE = ['pending', 'dispatched', 'en route', 'picked up', 'at hospital'];
  const q = term.trim().toLowerCase();
  const shown = requests
    .filter((r) => (status === 'all' ? true : status === 'active' ? ACTIVE.includes(lower(r)) : lower(r) === status))
    .filter((r) => !q || [r.id, r.vehicleNumber, r.driverName, r.patientName, r.pickupLocation, r.type].some((v) => (v || '').toLowerCase().includes(q)))
    .sort((a, b) => (lower(a) === 'pending' ? -1 : 0) - (lower(b) === 'pending' ? -1 : 0) || new Date(b.createdAt) - new Date(a.createdAt));

  async function assign(request, crewId) {
    if (!crewId) { dispatch(addToast({ message: 'Choose a free ambulance first', type: 'warning' })); return; }
    setBusy(request.id);
    try {
      const res = await dispatch(assignCrew({ id: request.id, crewId })).unwrap();
      dispatch(addToast({ message: `${request.id} assigned to ${res?.driverName || 'the crew'} in ${res?.vehicleNumber || 'the ambulance'}`, type: 'success' }));
      setPick((p) => ({ ...p, [request.id]: '' }));
      reload();
    } catch (err) {
      dispatch(addToast({ message: messageOf(err, 'Could not assign the ambulance'), type: 'error' }));
    } finally {
      setBusy('');
    }
  }

  async function submitCreate(e) {
    e.preventDefault();
    const f = create;
    setBusy('create');
    try {
      const created = await dispatch(createTransport({
        patientId: f.patientId.trim(),
        patientName: f.patientName.trim(),
        contact: f.contact.trim(),
        pickupLocation: f.pickupLocation.trim(),
        type: f.type,
        notes: f.notes.trim() || `Emergency ${f.type} requested by manager`,
        hospitalId,
      })).unwrap();
      if (f.crewId && created?.id) {
        const res = await dispatch(assignCrew({ id: created.id, crewId: f.crewId })).unwrap();
        dispatch(addToast({ message: `Transport ${created.id} dispatched: ${res?.driverName} in ${res?.vehicleNumber}`, type: 'success' }));
      } else {
        dispatch(addToast({ message: `Transport ${created?.id || ''} created — waiting for a crew of this hospital to accept.`, type: 'success' }));
      }
      setCreate(null);
      reload();
    } catch (err) {
      // The validator answers with a list of field errors; show the first one.
      const detail = Array.isArray(err?.data?.errors) ? err.data.errors[0] : null;
      dispatch(addToast({ message: detail || messageOf(err, 'Error creating the transport'), type: 'error' }));
      reload();
    } finally {
      setBusy('');
    }
  }

  const stat = (onClick, icon, tone, value, label, sub, valueCls) => (
    <button type="button" className="stat-card" onClick={onClick} style={{ textAlign: 'left', border: '1px solid var(--border)', font: 'inherit', cursor: 'pointer' }}>
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <div className="stat-data"><span className={`stat-value ${valueCls || ''}`}>{value}</span><span className="stat-label">{label}</span><span className="stat-subtext">{sub}</span></div>
    </button>
  );
  const n = (v) => (fleet ? v : '—');

  return (
    <>
      <div className="stats-grid mb-24">
        {stat(() => setStatus('all'), ICON.fleet, 'icon-blue', n(fleet?.total), 'Total Ambulances', 'One crew login per vehicle')}
        {stat(() => setStatus('active'), ICON.check, 'icon-green', n(fleet?.available), 'Available', 'Free for the next request', 'text-success')}
        {stat(() => setStatus('active'), ICON.bolt, 'icon-amber', n(fleet?.onTransport), 'On Transport', 'Out on an emergency run', 'text-amber')}
        {stat(() => setStatus('pending'), ICON.cog, 'icon-purple', n(fleet?.waiting), 'Waiting Requests', 'No crew assigned yet')}
      </div>

      <div className="card mb-24">
        <div className="card-header flex-between">
          <div>
            <h2>Hospital Ambulance Fleet</h2>
            <p className="card-subtitle">Each ambulance is one crew account of this hospital, with its vehicle and driver. Add one from Staff → Register (Ambulance Staff).</p>
          </div>
          <button type="button" className="btn-secondary" onClick={reload} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
        </div>
        <div className="table-responsive">
          <table className="data-table" id="hmFleetTable">
            <thead><tr><th>Vehicle</th><th>Crew Unit</th><th>Driver &amp; Contact</th><th>Status</th><th>Current Transport</th></tr></thead>
            <tbody>
              {failed && <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#64748B' }}>Failed to load the ambulance fleet.</td></tr>}
              {!failed && firstLoad && <LoadingCell colSpan={5}>Loading ambulance fleet...</LoadingCell>}
              {!failed && fleet && crews.length === 0 && <tr><td colSpan={5} style={{ padding: 28, textAlign: 'center', color: '#64748B' }}>This hospital has no ambulance crews yet — patients cannot request an ambulance from it.</td></tr>}
              {crews.map((c) => (
                <tr key={c.id} data-crew={c.id}>
                  <td><div style={{ fontWeight: 700, color: '#0f172a' }}>{c.vehicleNumber || '—'}</div></td>
                  <td><div style={{ fontWeight: 600 }}>{c.unit}</div><small style={{ color: '#64748b', fontSize: 11.5 }}>{c.id}</small></td>
                  <td><div style={{ fontWeight: 600, color: '#1e293b' }}>{c.driverName}</div>{c.phone && <small style={{ color: '#64748b', fontSize: 12 }}>📞 {c.phone}</small>}</td>
                  <td><Badge map={UNIT_BADGE} status={c.status} /></td>
                  <td>{c.currentRequest
                    ? <><div style={{ fontWeight: 600 }}>{c.currentRequest.patientName}</div><small style={{ color: '#64748b' }}>{c.currentRequest.id} · {c.currentRequest.status}</small></>
                    : <span style={{ color: '#94a3b8' }}>—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex-between">
          <div>
            <h2>Transport Requests</h2>
            <p className="card-subtitle">Waiting requests can be accepted by any free crew in their portal, or assigned here to a free ambulance.</p>
          </div>
          <div className="filters-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input type="text" className="input-search" placeholder="Search request, patient, vehicle, driver..." value={term} onChange={(e) => setTerm(e.target.value)} />
            <select className="select-filter" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">Active (waiting + on the road)</option>
              <option value="pending">🔴 Waiting for Crew</option>
              <option value="dispatched">🔵 Dispatched</option>
              <option value="en route">🟡 En Route</option>
              <option value="completed">✅ Completed</option>
              <option value="cancelled">⚪ Cancelled</option>
              <option value="all">All Requests</option>
            </select>
            <button type="button" className="btn-primary" onClick={() => setCreate({ ...blankRequest })}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              <span>+ New Transport</span>
            </button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="data-table" id="hmRequestsTable">
            <thead><tr><th>Request</th><th>Patient</th><th>Pickup Location</th><th>Status</th><th>Ambulance &amp; Driver</th><th>Action</th></tr></thead>
            <tbody>
              {!failed && !firstLoad && shown.length === 0 && <tr><td colSpan={6} style={{ padding: 28, textAlign: 'center', color: '#64748B' }}>No transport requests matching criteria.</td></tr>}
              {shown.map((r) => (
                <tr key={r.id} data-id={r.id}>
                  <td><div style={{ fontWeight: 700, color: '#0f172a' }}>{r.id}</div><small style={{ color: '#64748b', fontSize: 11.5 }}>{r.type || 'Emergency'}</small></td>
                  <td><div style={{ fontWeight: 600 }}>{r.patientName}</div><small style={{ color: '#64748b' }}>{r.contact}</small></td>
                  <td><div style={{ color: '#334155', fontSize: 13 }}>📍 {r.pickupLocation}</div></td>
                  <td><Badge map={REQUEST_BADGE} status={r.status} /></td>
                  <td>{r.assignedTo
                    ? <><div style={{ fontWeight: 600 }}>{r.driverName}</div><small style={{ color: '#64748b' }}>🚑 {r.vehicleNumber}{r.driverPhone ? ` · 📞 ${r.driverPhone}` : ''}</small></>
                    : <span style={{ color: '#94a3b8' }}>Not assigned</span>}</td>
                  <td>
                    {lower(r) === 'pending' ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <select className="form-control" style={{ minWidth: 200 }} value={pick[r.id] || ''} onChange={(e) => setPick((p) => ({ ...p, [r.id]: e.target.value }))} disabled={freeCrews.length === 0}>
                          <option value="">{freeCrews.length ? 'Choose a free ambulance' : 'No ambulance free'}</option>
                          {freeCrews.map((c) => <option key={c.id} value={c.id}>{crewLabel(c)}</option>)}
                        </select>
                        <button type="button" className="btn-action-sm btn-action-view" disabled={busy === r.id || !pick[r.id]} onClick={() => assign(r, pick[r.id])}>{busy === r.id ? 'Assigning…' : 'Assign'}</button>
                      </div>
                    ) : <span style={{ color: '#94a3b8' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <HmModal open={Boolean(create)} onClose={() => setCreate(null)} title="New Emergency Transport" size="medium" as="form" onSubmit={submitCreate}
        footer={(<><button type="button" className="btn-secondary" onClick={() => setCreate(null)} disabled={busy === 'create'}>Cancel</button><button type="submit" className="btn-primary" disabled={busy === 'create'}>{busy === 'create' ? 'Saving...' : create?.crewId ? 'Create & Dispatch' : 'Create Request'}</button></>)}>
        {create && (
          <>
            <div className="form-row">
              <Field label="Patient ID" required><input className="form-control" placeholder="e.g. P001" required value={create.patientId} onChange={(e) => setCreate({ ...create, patientId: e.target.value })} /></Field>
              <Field label="Patient / Requester Name" required><input className="form-control" placeholder="e.g. S. Murthy" required value={create.patientName} onChange={(e) => setCreate({ ...create, patientName: e.target.value })} /></Field>
            </div>
            <div className="form-row mt-12">
              <Field label="Emergency Contact Phone" required><input type="tel" className="form-control" placeholder="+91 98480 12345" required value={create.contact} onChange={(e) => setCreate({ ...create, contact: e.target.value })} /></Field>
              <Field label="Pickup Location / Address" required><input className="form-control" placeholder="e.g. RTC Bus Stand Road, Tirupati" required value={create.pickupLocation} onChange={(e) => setCreate({ ...create, pickupLocation: e.target.value })} /></Field>
            </div>
            <div className="form-row mt-12">
              <Field label="Service Type" required>
                <select className="form-control" required value={create.type} onChange={(e) => setCreate({ ...create, type: e.target.value })}>{SERVICE_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
              </Field>
              <Field label="Ambulance" hint={freeCrews.length ? `${freeCrews.length} of ${crews.length} free` : 'All ambulances are on a transport'}>
                <select className="form-control" value={create.crewId} onChange={(e) => setCreate({ ...create, crewId: e.target.value })}>
                  <option value="">Leave for the first free crew to accept</option>
                  {freeCrews.map((c) => <option key={c.id} value={c.id}>{crewLabel(c)}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Notes" className="form-group mt-12"><textarea className="form-control" rows={2} placeholder="e.g. Oxygen cylinder required on standby" value={create.notes} onChange={(e) => setCreate({ ...create, notes: e.target.value })} /></Field>
          </>
        )}
      </HmModal>
    </>
  );
}
