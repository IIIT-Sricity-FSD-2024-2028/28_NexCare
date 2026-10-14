import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ambulance, Hospitals } from '../../api';
import NexCareModal from './NexCareModal';
import { usePatient } from './PatientContext';

// patient/ambulance.html + ambulance.js.
//
// The request table in the HTML shipped with three hard-coded demo rows that
// were replaced on load; here it simply renders what GET /ambulance/patient/:id
// returns. Cancel is a soft cancel (PATCH …/cancel) — the row is kept.

const BADGES = {
  Completed: 'badge-completed',
  Pending: 'badge-pending',
  Canceled: 'badge-canceled',
  Cancelled: 'badge-canceled',
  Dispatched: 'badge-dispatched',
  'En Route': 'badge-enroute',
  'Picked Up': 'badge-pickedup',
  'At Hospital': 'badge-athospital',
};

function formatWhen(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
}

export default function AmbulancePage() {
  const { patientId, patient, profile, displayName, membership } = usePatient();
  const [form, setForm] = useState({ hospitalId: '', pickupLocation: '', contact: '', notes: '' });
  const [hospitals, setHospitals] = useState(null); // null = loading
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(null);

  const loadRequests = useCallback(async () => {
    if (!patientId) return;
    try {
      const res = await Ambulance.getByPatient(patientId);
      const list = res.data || [];
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRows(list);
    } catch (err) {
      console.error('Failed to load requests', err);
      setRows([]);
    }
  }, [patientId]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  // Prefill the contact number from the patient's own record.
  useEffect(() => {
    if (patient?.phone) setForm((f) => (f.contact ? f : { ...f, contact: patient.phone }));
  }, [patient]);

  // Hospitals to dispatch from: the patient's own city first, the full verified
  // list as a fallback, so the form is never left unusable.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const city = profile.city || '';
      let list = [];
      try {
        if (city) {
          try { list = (await Hospitals.getNearby(city)).data || []; } catch { list = []; }
        }
        if (!list.length) list = (await Hospitals.getAll()).data || [];
      } catch (err) {
        console.warn('Could not load hospitals for the ambulance form:', err.message);
        list = [];
      }
      list = list.filter((h) => (h.verificationStatus || 'verified') === 'verified');
      if (cancelled) return;
      setHospitals(list);
      setForm((f) => (f.hospitalId || !list.length ? f : { ...f, hospitalId: list[0].id }));
    })();
    return () => { cancelled = true; };
  }, [profile.city]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    const { hospitalId, pickupLocation, contact, notes } = form;

    if (!pickupLocation || !contact) {
      setModal({ title: 'Missing Information', message: 'Please fill in all required fields to request an ambulance.', isError: true });
      return;
    }
    if (!/^\d{10}$/.test(contact)) {
      setModal({ title: 'Invalid Phone Number', message: 'Please enter a valid 10-digit phone number (e.g., 9876543210).', isError: true });
      return;
    }
    if (/^0+$/.test(contact) || /^(\d)\1+$/.test(contact)) {
      setModal({ title: 'Invalid Phone Number', message: 'Please enter a valid phone number (cannot be all the same digit).', isError: true });
      return;
    }
    if (!hospitalId) {
      // The backend requires a hospital — an ambulance is dispatched from one,
      // and the patient is brought there.
      setModal({ title: 'Hospital Required', message: 'Please choose the hospital you want the ambulance from.', isError: true });
      return;
    }

    setModal({
      title: 'Confirm Emergency Request',
      message: <>Are you sure you want to dispatch an ambulance to <strong>{pickupLocation}</strong>?</>,
      isConfirm: true,
      onConfirm: async () => {
        try {
          const res = await Ambulance.createRequest({
            patientId,
            patientName: displayName,
            hospitalId,
            pickupLocation,
            contact,
            notes: notes || '',
          });
          const requestId = res.data?.id || `AMB-2026-${String(Math.floor(Math.random() * 900 + 100)).padStart(3, '0')}`;
          setModal({
            title: 'Ambulance Dispatched!',
            message: 'Your emergency ambulance request has been registered and dispatched.',
            details: <><strong>Request ID:</strong> {requestId}<br /><strong>ETA:</strong> 8-12 minutes<br /><strong>Contact:</strong> {contact}</>,
            onDismiss: () => {
              setForm((f) => ({ hospitalId: f.hospitalId, pickupLocation: '', contact: patient?.phone || '', notes: '' }));
              loadRequests();
            },
          });
        } catch (err) {
          setModal({ title: 'Error', message: err.message || 'Failed to dispatch ambulance.', isError: true });
        }
      },
    });
  }

  function cancelRequest(id) {
    setModal({
      title: 'Cancel Request',
      message: 'Are you sure you want to cancel this ambulance request?',
      isConfirm: true,
      onConfirm: async () => {
        try {
          await Ambulance.cancelRequest(id);
        } catch (err) {
          setModal({ title: 'Could not cancel', message: err.message || 'The request could not be cancelled.' });
        }
        loadRequests();
      },
    });
  }

  const banner = (() => {
    if (!membership) return { style: { background: '#F1F5F9', color: '#475569', borderColor: '#CBD5E1' }, content: 'Standard Dispatch' };
    if (membership.planId === 'CARE-FAMILY') return { style: { background: '#DCFCE7', color: '#15803D', borderColor: '#86EFAC' }, content: <>⭐ <strong>Care+ Family:</strong> 25% Ambulance Discount (₹1,125)</> };
    if (membership.planId === 'CARE-PLUS') return { style: { background: '#DCFCE7', color: '#15803D', borderColor: '#86EFAC' }, content: <>⭐ <strong>Care+ Member:</strong> 20% Ambulance Discount (₹1,200)</> };
    return { style: { background: '#F1F5F9', color: '#475569', borderColor: '#CBD5E1' }, content: <>Standard Rate: ₹1,500 (<Link to="/patient/membership" style={{ color: '#2563EB' }}>Get up to 25% off</Link>)</> };
  })();

  const clockIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }}>
      <circle cx="8" cy="8" r="6" stroke="#6A7282" strokeWidth="1.33" />
      <path d="M8 4v4l2.667 1.333" stroke="#6A7282" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <main className="main-content ambulance-page">
      <div className="ambulance-header">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M10 10H6M8 8v4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 18h6M15 18a2 2 0 104 0 2 2 0 00-4 0zM5 18a2 2 0 104 0 2 2 0 00-4 0z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 6h8v12H2zM10 10h4l3 3v5h-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <h1>Ambulance Request</h1>
          <p>Submit your ambulance request. Our team will respond immediately.</p>
        </div>
      </div>

      <div className="ambulance-content">
        <div className="emergency-alert">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4M12 17h.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <h3>Emergency Service</h3>
            <p>For life-threatening emergencies, please call <strong>108</strong> immediately. This form is for non-critical ambulance service requests.</p>
          </div>
        </div>

        <div className="ambulance-form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>Request Ambulance Service</h2>
            <div id="ambulanceMembershipBanner" style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, border: '1px solid', ...banner.style }}>
              {banner.content}
            </div>
          </div>

          <form id="ambulanceForm" className="ambulance-form" onSubmit={submit}>
            <div className="form-group">
              <label htmlFor="ambulanceHospital">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 10v5M9.5 12.5h5" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
                </svg>{' '}
                Hospital *
              </label>
              <select id="ambulanceHospital" name="ambulanceHospital" required value={form.hospitalId} onChange={set('hospitalId')}>
                {hospitals === null && <option value="" disabled>Loading hospitals…</option>}
                {hospitals !== null && hospitals.length === 0 && <option value="" disabled>No hospitals available</option>}
                {(hospitals || []).map((h) => (
                  <option key={h.id} value={h.id}>{h.name}{h.city ? ` — ${h.city}` : ''}</option>
                ))}
              </select>
              <p className="form-help">The ambulance is dispatched from this hospital and the patient is brought here.</p>
            </div>

            <div className="form-group">
              <label htmlFor="pickupLocation">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M15.75 7.5c0 4.5-6.75 9.75-6.75 9.75S2.25 12 2.25 7.5a6.75 6.75 0 0113.5 0z" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="7.5" r="2.25" stroke="#0F172A" strokeWidth="1.5" />
                </svg>{' '}
                Pickup Location *
              </label>
              <input type="text" id="pickupLocation" name="pickupLocation" placeholder="Enter full address or current location" required value={form.pickupLocation} onChange={set('pickupLocation')} />
              <p className="form-help">Please provide complete address including street, city, and landmark.</p>
            </div>

            <div className="form-group">
              <label htmlFor="contactNumber">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M16.5 12.75v2.25a1.5 1.5 0 01-1.636 1.5 14.994 14.994 0 01-6.543-2.329 14.778 14.778 0 01-4.553-4.552A14.994 14.994 0 011.5 3.136 1.5 1.5 0 013 1.5h2.25a1.5 1.5 0 011.5 1.289 9.638 9.638 0 00.525 2.107 1.5 1.5 0 01-.337 1.584L5.625 7.793a12 12 0 004.553 4.552l1.313-1.313a1.5 1.5 0 011.584-.337 9.638 9.638 0 002.107.525 1.5 1.5 0 011.318 1.53z" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>{' '}
                Contact Phone Number *
              </label>
              <input type="tel" id="contactNumber" name="contactNumber" placeholder="Enter your contact number" required value={form.contact} onChange={set('contact')} />
            </div>

            <div className="form-group">
              <label htmlFor="additionalNotes">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 10H6M12 14H6M8 6H6" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>{' '}
                Additional Notes (Optional)
              </label>
              <textarea id="additionalNotes" name="additionalNotes" rows={4} placeholder="Any special instructions, patient condition, or other important details" value={form.notes} onChange={set('notes')} />
            </div>

            <button type="submit" className="btn-request-ambulance">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 10H6M8 8v4M9 18h6M15 18a2 2 0 104 0 2 2 0 00-4 0zM5 18a2 2 0 104 0 2 2 0 00-4 0z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 6h8v12H2zM10 10h4l3 3v5h-7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>{' '}
              Request Ambulance
            </button>
          </form>
        </div>

        <div className="request-status-card">
          <h2>Request Status</h2>
          <div className="status-table-container">
            <table className="status-table">
              <thead>
                <tr><th>Request ID</th><th>Request Time</th><th>Pickup Location</th><th>Assigned Driver &amp; Vehicle</th><th>Contact</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#6B7280' }}>No ambulance requests found.</td></tr>}
                {rows.map((r) => {
                  const dName = r.driverName || r.assignedDriver?.name;
                  const dPhone = r.driverPhone || r.assignedDriver?.phone;
                  const dVehicle = r.vehicleNumber || r.assignedDriver?.vehicleNumber;
                  const active = r.status === 'Pending' || r.status === 'Dispatched' || r.status === 'En Route';
                  return (
                    <tr key={r.id} data-id={r.id}>
                      <td><strong>{r.id}</strong></td>
                      <td>{clockIcon}{formatWhen(r.createdAt)}</td>
                      <td>{r.pickupLocation}</td>
                      <td>
                        {dName ? (
                          <div style={{ fontSize: 12.5 }}>
                            <strong style={{ color: '#0F172A' }}>👨‍✈️ {dName}</strong><br />
                            <small style={{ color: '#475569' }}>🚑 {dVehicle || 'TN-07-AB-4501'} · 📞 {dPhone || '+91 98765 43210'}</small>
                          </div>
                        ) : (
                          <span style={{ color: '#9CA3AF', fontSize: 12 }}>Awaiting Dispatch</span>
                        )}
                      </td>
                      <td>{r.contact}</td>
                      <td><span className={`badge ${BADGES[r.status] || 'badge-gray'}`}>{r.status}</span></td>
                      <td>
                        {active ? (
                          <button type="button" className="btn-primary-sm" onClick={() => cancelRequest(r.id)}>Cancel</button>
                        ) : (
                          <span className="badge badge-gray" style={{ fontSize: 11 }}>
                            {r.status === 'Completed' ? 'Completed' : r.status === 'Cancelled' ? 'Cancelled' : 'In Progress'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <NexCareModal
        open={Boolean(modal)}
        title={modal?.title}
        message={modal?.message}
        details={modal?.details}
        isError={modal?.isError}
        isConfirm={modal?.isConfirm}
        onConfirm={modal?.onConfirm}
        onClose={() => { const after = modal?.onDismiss; setModal(null); if (after) after(); }}
      />
    </main>
  );
}
