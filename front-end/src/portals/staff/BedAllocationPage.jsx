import { useCallback, useEffect, useMemo, useState } from 'react';
import { Beds, Users } from '../../api';
import { useToast } from '../../context/ToastContext';
import { errorMessage, findPatient, patientName, useHospitalId } from './staffData';

// administrative_staff/bed-allocation.html + bed.js.

// Mirrors BedStatusChangeMiddleware on the backend — shown as a hint only.
// The API remains the authority and rejects illegal transitions with a 400.
const ALLOWED_TRANSITIONS = {
  available: ['occupied', 'maintenance'],
  occupied: ['critical', 'available'],
  critical: ['occupied', 'available'],
  maintenance: ['available'],
};

const countByStatus = (beds, status) => beds.filter((b) => (b.status || 'available').toLowerCase() === status).length;

function displayBedName(b) {
  if (b.bedNumber) return `Bed ${b.bedNumber.replace(/^[A-Z]+-0*/i, '')}`;
  const m = String(b.id || '').match(/(\d+)$/);
  return m ? `Bed ${parseInt(m[1], 10)}` : `Bed ${b.id || '1'}`;
}

/**
 * Send a status change through the dedicated bed endpoints so it passes
 * BedStatusChangeMiddleware: allocate → occupied, release → available,
 * everything else via /status. (bed.js applyStatusChange, call for call.)
 */
async function applyStatusChange(bed, target, patient) {
  const id = bed.id;
  const current = (bed.status || 'available').toLowerCase();

  if (target === current) {
    if ((target === 'occupied' || target === 'critical') && patient && patient !== bed.patient) {
      await Beds.update(id, { status: target, patient });
    }
    return;
  }
  if (target === 'available') {
    if (current === 'occupied' || current === 'critical') await Beds.release(id);
    else await Beds.updateStatus(id, 'available');
    return;
  }
  if (target === 'occupied' || target === 'critical') {
    // No patient on the bed yet: allocate first, then escalate if needed.
    // From maintenance the allocate call is what the middleware rejects,
    // and its message explains the required maintenance -> available step.
    if (!bed.patient) {
      await Beds.allocate(id, { patientId: patient });
      if (target === 'critical') await Beds.updateStatus(id, 'critical');
      return;
    }
    if (patient && patient !== bed.patient) await Beds.update(id, { status: current, patient });
    await Beds.updateStatus(id, target);
    return;
  }
  // maintenance (rejected by the middleware while a patient is assigned)
  await Beds.updateStatus(id, target);
}

export default function BedAllocationPage() {
  const hospitalId = useHospitalId();
  const { notify } = useToast();
  const [beds, setBeds] = useState([]);
  const [patients, setPatients] = useState([]);
  const [ward, setWard] = useState('Emergency');
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');
  const [update, setUpdate] = useState(null); // { bedId, patientId, patientName, status, error }
  const [admit, setAdmit] = useState(null); // { patientId, name, ward }

  const load = useCallback(async () => {
    try {
      const [bedsResp, patientsResp] = await Promise.all([Beds.getAll({ hospitalId }), Users.getAll({ role: 'patient' })]);
      const list = bedsResp.data || [];
      setBeds(list);
      setPatients(patientsResp.data || []);
      const wards = [...new Set(list.map((b) => b.ward))];
      setWard((w) => (wards.length && !wards.includes(w) ? wards[0] : w));
    } catch (err) {
      console.error('Failed to load bed allocation data:', err);
      notify('Failed to load bed data. Please check your connection and try again.', 'error');
    }
  }, [hospitalId, notify]);

  useEffect(() => { load(); }, [load]);

  const wards = useMemo(() => [...new Set(beds.map((b) => b.ward))], [beds]);
  const wardBeds = beds.filter((b) => b.ward === ward);

  const stats = useMemo(() => {
    const total = beds.length;
    const available = countByStatus(beds, 'available');
    const occupied = countByStatus(beds, 'occupied');
    const critical = countByStatus(beds, 'critical');
    const maintenance = countByStatus(beds, 'maintenance');
    const occupancyRate = total > 0 ? Math.round(((occupied + critical) / total) * 100) : 0;
    return [
      { label: 'Total Beds', value: total, note: `${occupancyRate}% occupancy`, trend: 'neutral' },
      { label: 'Available', value: available, note: 'Ready for admission', trend: available > 0 ? 'up' : 'down' },
      { label: 'Occupied', value: occupied, note: 'Patients admitted', trend: 'neutral' },
      { label: 'Critical', value: critical, note: 'Needs intensive care', trend: critical > 0 ? 'down' : 'neutral' },
      { label: 'Maintenance', value: maintenance, note: 'Out of service', trend: 'neutral' },
    ];
  }, [beds]);

  const wardAvailable = countByStatus(wardBeds, 'available');
  const wardMaintenance = countByStatus(wardBeds, 'maintenance');
  const wardOccupied = countByStatus(wardBeds, 'occupied') + countByStatus(wardBeds, 'critical');

  const q = search.toLowerCase();
  const visible = q
    ? wardBeds.filter((b) => (b.patient || '').toLowerCase().includes(q) || (b.id || '').toLowerCase().includes(q))
    : wardBeds;

  function openUpdate(bedId) {
    const bed = beds.find((b) => b.id === bedId);
    if (!bed) return;
    const current = (bed.status || 'available').toLowerCase();
    const allowed = ALLOWED_TRANSITIONS[current] || [];
    setUpdate({
      bedId,
      patientId: '',
      patientName: bed.patient || '',
      status: current,
      hint: `Bed ${bed.id} is currently ${current}. Allowed next: ${allowed.join(', ') || 'none'}.`,
      error: '',
    });
  }

  // Auto-fetch the patient's name as the id is typed (both modals).
  const lookupName = (pid) => patientName(findPatient(patients, pid));

  async function saveBed() {
    if (!update) return;
    const bed = beds.find((b) => b.id === update.bedId);
    if (!bed) return;
    const name = update.patientName.trim();
    if ((update.status === 'occupied' || update.status === 'critical') && !name) {
      setUpdate({ ...update, error: 'Occupied or Critical beds must have a patient assigned.' });
      return;
    }
    try {
      await applyStatusChange(bed, update.status, name);
      await load();
      setUpdate(null);
    } catch (err) {
      console.error('Failed to update bed:', err);
      // Surfaces the middleware's transition message, e.g.
      // "Illegal bed status transition: maintenance -> occupied. ..."
      setUpdate((u) => (u ? { ...u, error: errorMessage(err, 'Failed to update bed. Please try again.') } : u));
      await load();
    }
  }

  async function admitPatient() {
    const name = admit.name.trim();
    if (!name) { notify('Please fetch a valid patient first.', 'warning'); return; }
    const availableBed = beds.find((b) => b.ward === admit.ward && b.status && b.status.toLowerCase() === 'available');
    if (!availableBed) { notify(`No available beds in ${admit.ward} Ward.`, 'warning'); return; }
    try {
      await Beds.allocate(availableBed.id, { patientId: name });
      await load();
      setAdmit(null);
      notify(`Successfully admitted ${name} to Bed ${availableBed.id} in ${admit.ward} Ward.`, 'success');
    } catch (err) {
      console.error('Failed to admit patient:', err);
      notify(errorMessage(err, 'Failed to admit patient. Please try again.'), 'error');
    }
  }

  const statusMeta = (b) => {
    const status = (b.status || 'available').toLowerCase();
    if (status === 'occupied') return { status, color: 'blue', text: 'Stable' };
    if (status === 'critical') return { status, color: 'red', text: 'Critical' };
    if (status === 'maintenance') return { status, color: 'gray', text: 'Maintenance' };
    return { status, color: 'green', text: 'Available' };
  };
  const listBadge = {
    available: { background: '#dcfce7', color: '#166534' },
    occupied: { background: '#dbeafe', color: '#1e40af' },
    critical: { background: '#fee2e2', color: '#991b1b' },
    maintenance: { background: '#f3f4f6', color: '#374151' },
  };
  const badgeStyle = (status) => ({ padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, ...listBadge[status] });
  const cell = { padding: 10, borderBottom: '1px solid #e5e7eb' };

  return (
    <div className="sp-beds">
      <div className="header-row">
        <div>
          <h2>Patient Bed Management</h2>
          <div className="sub">💖 Compassionate care for every patient</div>
        </div>
        <button type="button" className="btn" onClick={() => setAdmit({ patientId: '', name: '', ward: wards[0] || '' })}>+ Admit Patient</button>
      </div>

      <div id="bedStats" className="cards">
        {stats.map((c) => (
          <div className="card stat" key={c.label}>
            <p>{c.label}</p>
            <h3>{c.value}</h3>
            <span className={`trend ${c.trend}`}>{c.note}</span>
          </div>
        ))}
      </div>

      <div id="wardCards" className="cards">
        {wards.map((w) => {
          const wb = beds.filter((b) => b.ward === w);
          const available = countByStatus(wb, 'available');
          const occupied = countByStatus(wb, 'occupied') + countByStatus(wb, 'critical');
          return (
            <div key={w} className="card stat" style={{ cursor: 'pointer', border: w === ward ? '2px solid #2563EB' : '1px solid #E5E7EB' }} onClick={() => setWard(w)}>
              <p>{w} Ward</p>
              <h3>{wb.length} Beds</h3>
              <span className={`trend ${available > 0 ? 'up' : 'down'}`}>{available} Available • {occupied} Occupied</span>
            </div>
          );
        })}
      </div>

      <div className="filters">
        <input id="searchInput" className="search" placeholder="Search by bed ID or patient..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 id="wardTitle">{ward} Ward</h3>
            <div className="small" id="wardMeta">Total Beds: {wardBeds.length}{wardMaintenance ? ` • ${wardMaintenance} under maintenance` : ''}</div>
            <div className="small" id="occupiedInfo">Occupied/Critical: {wardOccupied}/{wardBeds.length}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="small">Available</div>
            <h2 id="availableCount" style={{ color: wardAvailable > 0 ? '#22c55e' : '#ef4444' }}>{wardAvailable}</h2>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <div>
            <button type="button" className="btn-outline" onClick={() => setView('grid')}>Grid</button>
            <button type="button" className="btn-outline" onClick={() => setView('list')}>List</button>
          </div>
          <div className="legend">
            <span className="legend-item"><span className="dot green" /> Available</span>
            <span className="legend-item"><span className="dot blue" /> Stable</span>
            <span className="legend-item"><span className="dot red" /> Critical</span>
            <span className="legend-item"><span className="dot gray" /> Maintenance</span>
          </div>
        </div>

        <div id="bedsGrid" className="beds-grid" style={view === 'grid' ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 15 } : { display: 'block' }}>
          {visible.length === 0 ? (
            <div style={{ padding: 20, color: '#666' }}>No beds found for {ward}.</div>
          ) : view === 'grid' ? visible.map((b) => {
            const m = statusMeta(b);
            return (
              <div key={b.id} className="card" style={{ padding: 15, borderLeft: `4px solid var(--${m.color}-500)`, cursor: 'pointer' }} onClick={() => openUpdate(b.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <strong>{displayBedName(b)}</strong>
                  <span className={`dot ${m.color}`} title={m.text} />
                </div>
                <div className="small" style={{ color: '#4b5563', minHeight: 20 }}>
                  {b.patient ? b.patient : <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Empty</span>}
                </div>
              </div>
            );
          }) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr><th style={cell}>Bed Number</th><th style={cell}>Status</th><th style={cell}>Patient</th><th style={cell}>Actions</th></tr>
              </thead>
              <tbody>
                {visible.map((b) => {
                  const m = statusMeta(b);
                  return (
                    <tr key={b.id}>
                      <td style={cell}><strong>{displayBedName(b)}</strong></td>
                      <td style={cell}><span style={badgeStyle(m.status)}>{m.status.toUpperCase()}</span></td>
                      <td style={cell}>{b.patient || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>None</span>}</td>
                      <td style={cell}><button type="button" className="btn-outline" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => openUpdate(b.id)}>Manage</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {update && (
        <div id="modal" className="modal active">
          <div className="card modal-card">
            <h3>Update Bed</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input id="patientId" className="input" placeholder="Patient ID (e.g. P001)" style={{ flex: 1, margin: 0 }} value={update.patientId} onChange={(e) => setUpdate({ ...update, patientId: e.target.value, patientName: lookupName(e.target.value) })} />
              <button type="button" className="btn-outline" style={{ padding: '0 12px', height: 38 }} onClick={() => setUpdate({ ...update, patientName: lookupName(update.patientId) })}>Fetch</button>
            </div>
            <input id="patientName" className="input" placeholder="Patient Name" readOnly style={{ background: '#f3f4f6' }} value={update.patientName} />
            <select id="status" className="input" value={update.status} onChange={(e) => setUpdate({ ...update, status: e.target.value })}>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="critical">Critical</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <div id="bedModalHint" className="small" style={{ color: '#6b7280', marginTop: 6 }}>{update.hint}</div>
            {update.error && <div id="bedModalError" className="small" style={{ color: '#b91c1c', marginTop: 6 }}>{update.error}</div>}
            <div className="modal-actions">
              <button type="button" className="btn" onClick={saveBed}>Save</button>
              <button type="button" className="btn-outline" onClick={() => setUpdate(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {admit && (
        <div id="admitModal" className="modal active">
          <div className="card modal-card">
            <h3>Admit Patient</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input id="admitPatientId" className="input" placeholder="Patient ID" style={{ flex: 1, margin: 0 }} value={admit.patientId} onChange={(e) => setAdmit({ ...admit, patientId: e.target.value, name: lookupName(e.target.value) })} />
              <button type="button" className="btn-outline" style={{ padding: '0 12px', height: 38 }} onClick={() => setAdmit({ ...admit, name: lookupName(admit.patientId) })}>Fetch</button>
            </div>
            <input id="admitName" className="input" placeholder="Patient Name" readOnly style={{ background: '#f3f4f6' }} value={admit.name} />
            <select id="admitWard" className="input" value={admit.ward} onChange={(e) => setAdmit({ ...admit, ward: e.target.value })}>
              {wards.map((w) => <option key={w} value={w}>{w} Ward</option>)}
            </select>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={admitPatient}>Admit</button>
              <button type="button" className="btn-outline" onClick={() => setAdmit(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
