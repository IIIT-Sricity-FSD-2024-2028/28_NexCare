import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { http } from '../../api/client';
import { Hospitals } from '../../api';
import '../../styles/regional-details.css';

// regional-officer/hospital-details.html + hospital-details.js: one hospital,
// reached as hospital-details?id=H001 from the dashboard, comparison and
// alerts pages. The overview loads with the page; the other four tabs load
// (and reload) each time they are opened, as the HTML did.

const TABS = [
  ['overview', 'Overview'], ['staff', 'Staff & Doctors'], ['beds', 'Beds & Wards'],
  ['inventory', 'Inventory'], ['ambulances', 'Ambulances'],
];

const enc = encodeURIComponent;
const lower = (v) => String(v || '').toLowerCase();
const na = (v) => (v === undefined || v === null || v === '' ? 'N/A' : v);

/** Rows of one sub-resource, or null when the record lacks a hospital id. */
function forHospital(list, hospitalId) {
  return (list || []).filter((r) => {
    if (!r) return false;
    const hid = r.hospitalId || r.hospital_id;
    return !hid || hid === hospitalId;
  });
}

function bedCounts(beds) {
  return {
    total: beds.length,
    available: beds.filter((b) => lower(b.status) === 'available').length,
    occupied: beds.filter((b) => lower(b.status) === 'occupied').length,
    maintenance: beds.filter((b) => lower(b.status) === 'maintenance').length,
    icu: beds.filter((b) => lower(b.ward) === 'icu').length,
  };
}

const isLow = (i) => {
  const s = lower(i.status);
  return s.includes('low') || s.includes('out') || s === 'critical';
};

export default function HospitalDetailsPage() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const [tab, setTab] = useState('overview');
  const [hospital, setHospital] = useState(null);
  const [headline, setHeadline] = useState({ name: 'Loading...', address: '--' });
  const [counts, setCounts] = useState(null); // { beds:{…}, inventory:n }
  // Per-tab state: { loading, error, rows }
  const [tabs, setTabs] = useState({});

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    (async () => {
      let h;
      try {
        const res = await Hospitals.getById(id);
        h = res.data;
        if (!h) throw new Error(res.message || 'Hospital Not Found');
      } catch (err) {
        console.error(err);
        if (!cancelled) setHeadline({ name: err?.message || 'Hospital Not Found', address: err?.message || 'Unable to load this hospital.' });
        return;
      }
      if (cancelled) return;
      setHospital(h);
      setHeadline({
        name: h.name,
        address: `${h.address || ''}, ${h.city || ''}, ${h.state || ''} - ${h.pincode || ''}`,
      });

      // Actual bed and inventory counts from the database rather than the static hospital record.
      const [beds, inventory] = await Promise.all([
        http.get(`/hospitals/${enc(id)}/beds`).then((r) => r.data || []).catch((e) => { console.warn('Failed to load beds data:', e); return []; }),
        http.get(`/hospitals/${enc(id)}/inventory`).then((r) => r.data || []).catch((e) => { console.warn('Failed to load inventory data:', e); return []; }),
      ]);
      if (cancelled) return;
      setCounts({ beds: bedCounts(beds), inventory: inventory.length });
    })();
    return () => { cancelled = true; };
  }, [id]);

  // The four lazy tabs: fetch when opened, every time.
  useEffect(() => {
    if (!id || tab === 'overview') return undefined;
    let cancelled = false;
    setTabs((t) => ({ ...t, [tab]: { loading: true } }));
    const path = { staff: 'doctors', beds: 'beds', inventory: 'inventory', ambulances: 'ambulances' }[tab];
    http.get(`/hospitals/${enc(id)}/${path}`)
      .then((res) => {
        if (cancelled) return;
        let rows = forHospital(res.data, id);
        if (tab === 'staff') rows = rows.filter((u) => lower(u.role) === 'doctor');
        setTabs((t) => ({ ...t, [tab]: { rows } }));
        // Keep the overview counts consistent with what the tab shows.
        if (tab === 'beds') setCounts((c) => ({ ...(c || { inventory: 0 }), beds: bedCounts(rows) }));
        if (tab === 'inventory') setCounts((c) => ({ ...(c || { beds: bedCounts([]) }), inventory: rows.length }));
      })
      .catch((err) => {
        if (!cancelled) setTabs((t) => ({ ...t, [tab]: { error: err?.message || `Failed to load ${path}.` } }));
      });
    return () => { cancelled = true; };
  }, [id, tab]);

  // Reached without ?id= — go back to the dashboard rather than trapping the user.
  if (!id) return <Navigate to="/regional-officer/dashboard" replace />;

  const specs = hospital
    ? (Array.isArray(hospital.specialities) ? hospital.specialities.join(', ') : (hospital.speciality || 'N/A'))
    : '';
  const b = counts?.beds;
  const snapshot = counts
    ? `${b.total} Total Beds · ${b.icu} ICU · ${b.available} Available · ${counts.inventory} Inventory Items · ${specs}`
    : 'Loading...';

  const staff = tabs.staff;
  const beds = tabs.beds;
  const inv = tabs.inventory;
  const amb = tabs.ambulances;
  const onLeave = (staff?.rows || []).filter((d) => ['on leave', 'on_leave'].includes(lower(d.status))).length;
  const bedRows = beds?.rows ? bedCounts(beds.rows) : null;

  const body = (state, colSpan, loadingText, emptyText, render) => {
    if (!state || state.loading) return <tr className="empty-state"><td colSpan={colSpan}>{state ? loadingText : 'Loading...'}</td></tr>;
    if (state.error) return <tr className="empty-state"><td colSpan={colSpan}>{state.error}</td></tr>;
    if (!state.rows.length) return <tr className="empty-state"><td colSpan={colSpan}>{emptyText}</td></tr>;
    return state.rows.map(render);
  };

  return (
    <div className="ro-details">
      <Header title="Regional Overview" />
      <div className="page-body">
        <div className="hospital-header">
          <h1 id="hospitalName">{headline.name}</h1>
          <p id="hospitalAddress">{headline.address}</p>
          <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
            <span id="hospitalType" style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
              {hospital ? (hospital.type || 'N/A') : '--'}
            </span>
            <span id="hospitalStatus" style={{ background: '#DCFCE7', color: '#15803D', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
              {hospital ? (hospital.verificationStatus === 'verified' ? 'Verified' : 'Pending') : '--'}
            </span>
          </div>
        </div>

        <div className="tabs" role="tablist">
          {TABS.map(([key, lbl]) => (
            <button type="button" key={key} role="tab" aria-selected={tab === key} className={`tab${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>
              {lbl}
            </button>
          ))}
        </div>

        <div id="overview" className={`tab-content${tab === 'overview' ? ' active' : ''}`}>
          <div className="tab-stats">
            <div className="stat-card"><span>Hospital Snapshot</span><div id="overviewStatsSummary">{hospital ? snapshot : 'Loading...'}</div></div>
          </div>
          <table className="data-table">
            <tbody>
              <tr><th>Registration Number</th><td>{hospital ? (hospital.registrationNumber || 'N/A') : '--'}</td></tr>
              <tr><th>Phone</th><td>{hospital ? (hospital.phone || 'N/A') : '--'}</td></tr>
              <tr><th>Email</th><td>{hospital ? (hospital.email || 'N/A') : '--'}</td></tr>
              <tr><th>Admin Name</th><td>{hospital ? (hospital.adminName || 'N/A') : '--'}</td></tr>
              <tr><th>Total Beds</th><td>{counts ? b.total : '--'}</td></tr>
              <tr><th>Available Beds</th><td>{counts ? b.available : '--'}</td></tr>
              <tr><th>ICU Beds</th><td>{counts ? b.icu : '--'}</td></tr>
              <tr><th>Inventory Items</th><td>{counts ? counts.inventory : '--'}</td></tr>
              <tr><th>24x7 Emergency</th><td>{hospital ? (hospital.emergency24x7 ? 'Yes' : 'No') : '--'}</td></tr>
              <tr><th>Accreditation</th><td>{hospital ? na(hospital.accreditation) : '--'}</td></tr>
              <tr><th>Established</th><td>{hospital ? na(hospital.establishedYear) : '--'}</td></tr>
              <tr><th>Departments</th><td>{hospital ? na(hospital.departmentsCount) : '--'}</td></tr>
              <tr><th>Operation Theatres</th><td>{hospital ? na(hospital.operationTheatres) : '--'}</td></tr>
              <tr><th>Ambulances</th><td>{hospital ? na(hospital.ambulanceCount) : '--'}</td></tr>
            </tbody>
          </table>
        </div>

        <div id="staff" className={`tab-content${tab === 'staff' ? ' active' : ''}`}>
          <div className="tab-stats">
            <div className="stat-card"><span>Doctors</span><div id="staffStatsSummary">
              {staff?.rows ? `${staff.rows.length} Doctors · ${onLeave} On Leave` : staff?.error ? 'Unable to load doctors' : 'Open this tab to load'}
            </div></div>
          </div>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Role</th><th>Status</th></tr></thead>
            <tbody id="staffTable">
              {body(staff, 3, 'Loading doctors...', 'No doctors found for this hospital.', (s) => (
                <tr key={s.id}><td>{s.name || 'N/A'}</td><td>{s.dept || s.department || s.speciality || 'Doctor'}</td><td>{s.status || 'Active'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div id="beds" className={`tab-content${tab === 'beds' ? ' active' : ''}`}>
          <div className="tab-stats">
            <div className="stat-card"><span>Bed Availability</span><div id="bedsStatsSummary">
              {bedRows ? `${bedRows.total} Beds · ${bedRows.available} Available · ${bedRows.occupied} Occupied · ${bedRows.maintenance} Maintenance` : beds?.error ? 'Unable to load beds' : 'Open this tab to load'}
            </div></div>
          </div>
          <table className="data-table">
            <thead><tr><th>Ward</th><th>Bed Number</th><th>Status</th></tr></thead>
            <tbody id="bedsTable">
              {body(beds, 3, 'Loading beds...', 'No beds configured.', (bed) => (
                <tr key={bed.id || bed.bedNumber}><td>{bed.ward || bed.wardId || 'General'}</td><td>{bed.bedNumber || bed.id || 'N/A'}</td><td>{bed.status || 'N/A'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div id="inventory" className={`tab-content${tab === 'inventory' ? ' active' : ''}`}>
          <div className="tab-stats">
            <div className="stat-card"><span>Inventory Status</span><div id="inventoryStatsSummary">
              {inv?.rows ? `${inv.rows.length} Items · ${inv.rows.filter(isLow).length} Low / Out of Stock` : inv?.error ? 'Unable to load inventory' : 'Open this tab to load'}
            </div></div>
          </div>
          <table className="data-table">
            <thead><tr><th>Item</th><th>Category</th><th>Quantity</th><th>Status</th></tr></thead>
            <tbody id="inventoryTable">
              {body(inv, 4, 'Loading inventory...', 'No inventory data.', (i) => (
                <tr key={i.id}><td>{i.itemName || i.name || 'N/A'}</td><td>{i.category || 'N/A'}</td><td>{i.quantity ?? 0}</td><td>{i.status || 'N/A'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div id="ambulances" className={`tab-content${tab === 'ambulances' ? ' active' : ''}`}>
          <div className="tab-stats">
            <div className="stat-card"><span>Ambulances</span><div id="ambulanceStatsSummary">
              {amb?.rows ? `${amb.rows.length} Ambulance Records` : amb?.error ? 'Unable to load ambulances' : 'Open this tab to load'}
            </div></div>
          </div>
          <table className="data-table">
            <thead><tr><th>Vehicle ID</th><th>Driver Name</th><th>Status</th></tr></thead>
            <tbody id="ambulanceTable">
              {body(amb, 3, 'Loading ambulances...', 'No ambulances assigned.', (a) => (
                <tr key={a.id}><td>{a.vehicleNumber || a.id || 'N/A'}</td><td>{a.driverName || a.patientName || 'N/A'}</td><td>{a.status || 'N/A'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
