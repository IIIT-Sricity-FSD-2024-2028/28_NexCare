import { useCallback, useEffect, useState } from 'react';
import { Ambulance } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useHm } from './HmContext';
import { Field, HmModal, LoadingCell } from './hmShared';

// TAB — Ambulance Status & Fleet: loadAmbulanceFleet() / updateAmbulanceKpis()
// / renderAmbulances() / the status modal (PUT /ambulance/:id) and the
// "+ New Transport" modal (POST /ambulance).
//
// dashboard.html carried two #newAmbulanceModal blocks; the first (the one
// getElementById found) is the one ported. Its form never collected a
// patient id, and the backend's validator refuses a request without one
// ("Patient ID is required"), so every dispatch from the HTML page was a
// 400 — the SPA form asks for it.
const svg = (d) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{d}</svg>;
const ICON = {
  fleet: svg(<><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M10 10v4" /><path d="M8 12h4" /></>),
  check: svg(<polyline points="20 6 9 17 4 12" />),
  bolt: svg(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />),
  cog: svg(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></>),
};
const STATUS_BADGE = {
  available: { bg: '#dcfce7', color: '#15803d', text: '🟢 Available' },
  dispatched: { bg: '#dbeafe', color: '#1d4ed8', text: '🔵 Dispatched' },
  'en route': { bg: '#fef3c7', color: '#b45309', text: '🟡 En Route' },
  pending: { bg: '#fee2e2', color: '#b91c1c', text: '🔴 Pending Dispatch' },
  maintenance: { bg: '#f3e8ff', color: '#7e22ce', text: '⚙️ Maintenance' },
  completed: { bg: '#e0f2fe', color: '#0369a1', text: '✅ Completed' },
};
const SERVICE_TYPES = ['Advanced Life Support (ALS)', 'Basic Life Support (BLS)', 'ICU on Wheels (Cardiac Mobile Unit)', 'Neonatal / Pediatric ICU Transport', 'Patient Transport Service (PTS)'];
const VEHICLES = [['AP-03-AX-1001', 'ALS - Bay 1'], ['AP-03-AX-1002', 'BLS - Bay 2'], ['AP-03-AX-1003', 'ICU Mobile - Bay 3'], ['AP-03-AX-1004', 'ALS - Bay 4'], ['AP-03-AX-1006', 'NICU - Bay 5']];
const blankRequest = { patientId: '', patientName: '', contact: '', pickupLocation: '', type: SERVICE_TYPES[0], vehicleNumber: VEHICLES[0][0], notes: '' };

function StatusBadge({ status }) {
  const b = STATUS_BADGE[(status || '').toLowerCase()];
  if (!b) return <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>{status || 'Unknown'}</span>;
  return <span className="badge" style={{ background: b.bg, color: b.color, fontWeight: 700 }}>{b.text}</span>;
}

export default function AmbulancePage() {
  const { hospitalId, refresh } = useHm();
  const { notify } = useToast();
  const [fleet, setFleet] = useState(null);
  const [failed, setFailed] = useState(false);
  const [term, setTerm] = useState('');
  const [status, setStatus] = useState('all');
  const [edit, setEdit] = useState(null); // { id, vehicle, status, driver, eta, notes }
  const [create, setCreate] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await Ambulance.getAll();
      setFleet(Array.isArray(res.data) ? res.data : []);
      setFailed(false);
    } catch (err) {
      console.error('Error loading ambulance fleet:', err);
      setFailed(true);
      setFleet([]);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const list = fleet || [];
  const lower = (a) => (a.status || '').toLowerCase();
  const kpi = {
    total: list.length,
    available: list.filter((a) => lower(a) === 'available').length,
    onDuty: list.filter((a) => ['dispatched', 'en route', 'pending'].includes(lower(a))).length,
    maintenance: list.filter((a) => ['maintenance', 'unavailable'].includes(lower(a))).length,
  };
  const q = term.trim().toLowerCase();
  const filtered = list.filter((a) =>
    (status === 'all' || lower(a) === status.toLowerCase())
    && (!q || [a.id, a.vehicleNumber, a.driverName, a.patientName, a.pickupLocation, a.type].some((v) => (v || '').toLowerCase().includes(q))));

  const openEdit = (item) => setEdit({
    id: item.id,
    vehicle: `${item.vehicleNumber || item.id} (${item.type || 'Ambulance'})`,
    status: item.status || 'Available',
    driver: item.driverName ? `${item.driverName} (${item.driverPhone || ''})` : '',
    eta: item.eta || '',
    notes: item.notes || '',
  });

  async function saveStatus(e) {
    e.preventDefault();
    let driverName = edit.driver.trim();
    let driverPhone = '';
    if (driverName.includes('(')) {
      const [n, p] = driverName.split('(');
      driverName = n.trim();
      driverPhone = p.replace(')', '').trim();
    }
    setBusy(true);
    try {
      await Ambulance.update(edit.id, {
        status: edit.status,
        driverName,
        driverPhone: driverPhone || undefined,
        eta: edit.eta.trim() || (edit.status === 'Available' ? 'Ready' : '--'),
        notes: edit.notes.trim() || undefined,
      });
      notify(`Ambulance ${edit.id} status updated to ${edit.status}`, 'success');
      setEdit(null);
      await load();
      refresh();
    } catch (err) {
      notify(err?.message || 'Error updating ambulance status', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function dispatch(e) {
    e.preventDefault();
    const f = create;
    setBusy(true);
    try {
      await Ambulance.create({
        patientId: f.patientId.trim(),
        patientName: f.patientName.trim(),
        contact: f.contact.trim(),
        pickupLocation: f.pickupLocation.trim(),
        type: f.type,
        vehicleNumber: f.vehicleNumber,
        notes: f.notes.trim() || `Emergency ${f.type} requested by manager`,
        status: 'Dispatched',
        eta: '8 mins',
        hospitalId,
      });
      // dashboard.js said "dispatched", but the backend records every new
      // request as Pending until the ambulance desk dispatches it.
      notify(`Transport request for ${f.patientName.trim()} created on ${f.vehicleNumber} — pending dispatch.`, 'success');
      setCreate(null);
      await load();
      refresh();
    } catch (err) {
      // The validator answers with a list of field errors; show the first one.
      const detail = Array.isArray(err?.data?.errors) ? err.data.errors[0] : null;
      notify(detail || err?.message || 'Error dispatching ambulance', 'error');
    } finally {
      setBusy(false);
    }
  }

  const stat = (filterTo, icon, tone, value, label, sub, valueCls) => (
    <button type="button" className="stat-card" onClick={() => setStatus(filterTo)} style={{ textAlign: 'left', border: '1px solid var(--border)', font: 'inherit', cursor: 'pointer' }}>
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <div className="stat-data"><span className={`stat-value ${valueCls || ''}`}>{value}</span><span className="stat-label">{label}</span><span className="stat-subtext">{sub}</span></div>
    </button>
  );

  return (
    <>
      <div className="stats-grid mb-24">
        {stat('all', ICON.fleet, 'icon-blue', kpi.total, 'Total Fleet Units', 'Hospital Assigned Fleet')}
        {stat('Available', ICON.check, 'icon-green', kpi.available, 'Available / Standby', 'Ready for Emergency Dispatch', 'text-success')}
        {stat('Dispatched', ICON.bolt, 'icon-amber', kpi.onDuty, 'Dispatched / En Route', 'Active Emergency Runs', 'text-amber')}
        {stat('Maintenance', ICON.cog, 'icon-purple', kpi.maintenance, 'In Maintenance', 'Workshop Servicing')}
      </div>

      <div className="card">
        <div className="card-header flex-between">
          <div>
            <h2>Hospital Ambulance Fleet & Live Status</h2>
            <p className="card-subtitle">Real-time status tracking, driver contact, vehicle readiness, and active emergency transport oversight</p>
          </div>
          <div className="filters-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input type="text" className="input-search" placeholder="Search vehicle, driver, patient..." value={term} onChange={(e) => setTerm(e.target.value)} />
            <select className="select-filter" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="Available">🟢 Available</option>
              <option value="Dispatched">🔵 Dispatched</option>
              <option value="En Route">🟡 En Route</option>
              <option value="Pending">🔴 Pending Dispatch</option>
              <option value="Completed">✅ Completed</option>
              <option value="Maintenance">⚙️ Maintenance</option>
            </select>
            <button type="button" className="btn-primary" onClick={() => setCreate({ ...blankRequest })}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              <span>+ New Transport</span>
            </button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr><th>Unit ID & Vehicle</th><th>Service Type</th><th>Driver & Contact</th><th>Mission / Patient</th><th>Pickup Location</th><th>Live Status</th><th>ETA / Standby</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {failed && <tr><td colSpan={8} className="text-center text-muted" style={{ padding: 24, textAlign: 'center', color: '#64748B' }}>Failed to load ambulance records.</td></tr>}
              {!failed && fleet === null && <LoadingCell colSpan={8}>Loading ambulance status records...</LoadingCell>}
              {!failed && fleet && filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 28, textAlign: 'center', color: '#64748B' }}>No ambulance fleet records matching criteria.</td></tr>}
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td><div style={{ fontWeight: 700, color: '#0f172a' }}>{item.vehicleNumber || item.id}</div><small style={{ color: '#64748b', fontSize: 11.5 }}>Unit ID: {item.id}</small></td>
                  <td><span className="badge" style={{ background: '#f1f5f9', color: '#334155', fontSize: 12, fontWeight: 600 }}>{item.type || 'Emergency Ambulance'}</span></td>
                  <td><div style={{ fontWeight: 600, color: '#1e293b' }}>{item.driverName || item.assignedDriver?.name || 'Assigned Fleet Driver'}</div><small style={{ color: '#64748b', fontSize: 12 }}>📞 {item.driverPhone || item.assignedDriver?.phone || item.contact || '+91 98765 43210'}</small></td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.patientName || 'Standby / Fleet Unit'}</div>
                    <small style={{ color: '#64748b', display: 'block', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.notes || ''}>{item.notes || 'Emergency standby ready'}</small>
                  </td>
                  <td><div style={{ color: '#334155', fontSize: 13 }}>📍 {item.pickupLocation || 'Central Hospital Bay'}</div></td>
                  <td><StatusBadge status={item.status} /></td>
                  <td><span style={{ fontWeight: 700, color: '#0284c7', fontSize: 13 }}>{item.eta || 'Ready'}</span></td>
                  <td><button type="button" className="btn-action-sm btn-action-view" title="Update Status" onClick={() => openEdit(item)}>✏️ Update</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <HmModal open={Boolean(edit)} onClose={() => setEdit(null)} title="Update Ambulance Live Status" as="form" onSubmit={saveStatus}
        footer={(<><button type="button" className="btn-secondary" onClick={() => setEdit(null)} disabled={busy}>Cancel</button><button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save Status'}</button></>)}>
        {edit && (
          <>
            <Field label="Unit / Vehicle" className="form-group"><input className="form-control input-readonly" readOnly value={edit.vehicle} style={{ background: '#f8fafc', fontWeight: 700, color: '#1e40af' }} /></Field>
            <Field label="Live Status" required className="form-group mt-12">
              <select className="form-control" required value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                <option value="Available">🟢 Available / Ready on Standby</option>
                <option value="Dispatched">🔵 Dispatched (En Route to Patient)</option>
                <option value="En Route">🟡 En Route to Hospital</option>
                <option value="Completed">✅ Mission Completed</option>
                <option value="Maintenance">⚙️ In Workshop / Maintenance</option>
                <option value="Unavailable">🔴 Unavailable / Off Duty</option>
              </select>
            </Field>
            <Field label="Assigned Driver" className="form-group mt-12"><input className="form-control" placeholder="e.g. Ravi Teja (+91 98480 55001)" value={edit.driver} onChange={(e) => setEdit({ ...edit, driver: e.target.value })} /></Field>
            <Field label="ETA / Standby Bay" className="form-group mt-12"><input className="form-control" placeholder="e.g. 5 mins or Emergency Bay 1" value={edit.eta} onChange={(e) => setEdit({ ...edit, eta: e.target.value })} /></Field>
            <Field label="Status Notes / Instructions" className="form-group mt-12"><textarea className="form-control" rows={2} placeholder="e.g. Patient stabilized, en route to trauma center." value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} /></Field>
          </>
        )}
      </HmModal>

      <HmModal open={Boolean(create)} onClose={() => setCreate(null)} title="New Emergency Transport / Dispatch" size="medium" as="form" onSubmit={dispatch}
        footer={(<><button type="button" className="btn-secondary" onClick={() => setCreate(null)} disabled={busy}>Cancel</button><button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Dispatching...' : 'Dispatch Ambulance'}</button></>)}>
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
              <Field label="Assign Vehicle">
                <select className="form-control" value={create.vehicleNumber} onChange={(e) => setCreate({ ...create, vehicleNumber: e.target.value })}>{VEHICLES.map(([v, bay]) => <option key={v} value={v}>{v} ({bay})</option>)}</select>
              </Field>
            </div>
            <Field label="Emergency Notes / Clinical Triage" className="form-group mt-12"><textarea className="form-control" rows={2} placeholder="e.g. Chest pain, oxygen cylinder required on standby" value={create.notes} onChange={(e) => setCreate({ ...create, notes: e.target.value })} /></Field>
          </>
        )}
      </HmModal>
    </>
  );
}
