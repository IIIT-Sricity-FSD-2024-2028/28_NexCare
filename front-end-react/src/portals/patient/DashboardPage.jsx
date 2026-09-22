import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ambulance, Appointments, Billing, Hospitals } from '../../api';
import { useToast } from '../../context/ToastContext';
import InvoiceModal from '../../features/invoice/InvoiceModal';
import { downloadInvoicePDF } from '../../features/invoice/invoice';
import PatientHeader from './PatientHeader';
import SystemModal from './SystemModal';
import { isPaidMembership, usePatient } from './PatientContext';

// patient/dashboard.html + dashboard.js + script.js.
//
// Every NexCareStore call is now a direct API call scoped by the backend to the
// signed-in patient. The "medical records" grid is what the HTML showed:
// completed appointments, with canned "record" text — nothing clinical is stored.

const contains = (q, ...parts) => !q || parts.join(' ').toLowerCase().includes(q);

export default function DashboardPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const { profile, displayName, membership, patient } = usePatient();
  const [appointments, setAppointments] = useState([]);
  const [bills, setBills] = useState([]);
  const [ambulanceCount, setAmbulanceCount] = useState(0);
  const [hospitals, setHospitals] = useState(null); // null = loading, [] = unavailable
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // { title, message, onConfirm? }
  const [invoiceBill, setInvoiceBill] = useState(null);
  const recordsRef = useRef(null);

  const firstName = displayName.split(' ')[0];

  const loadAppointments = useCallback(async () => {
    try { setAppointments((await Appointments.getAll()).data || []); } catch { setAppointments([]); }
  }, []);
  const loadBills = useCallback(async () => {
    try { setBills((await Billing.getAll()).data || []); } catch { setBills([]); }
  }, []);
  const loadAmbulance = useCallback(async () => {
    try {
      const reqs = (await Ambulance.getAllRequests()).data || [];
      setAmbulanceCount(reqs.filter((r) => r.status !== 'Completed').length);
    } catch { setAmbulanceCount(0); }
  }, []);

  useEffect(() => { loadAppointments(); loadBills(); loadAmbulance(); }, [loadAppointments, loadBills, loadAmbulance]);

  // The hospital network, ranked by proximity to the patient's own address.
  // Waits for the patient record so the ranking uses their city/PIN.
  const patientPincode = String(profile.pincode || '').trim();
  const patientCity = String(profile.city || '').trim();
  const patientState = String(profile.state || '').trim();
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let list = [];
      try {
        let res;
        try { res = await Hospitals.getNearby(patientCity, patientState, patientPincode); } catch { res = null; }
        if (!res) res = await Hospitals.getAll();
        const raw = res.data;
        list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.hospitals) ? raw.hospitals : [];
      } catch (err) {
        console.error('Backend unavailable or returned error for hospitals:', err);
        list = [];
      }
      if (!cancelled) setHospitals(list);
    })();
    return () => { cancelled = true; };
  }, [patientCity, patientState, patientPincode, patient]);

  const upcoming = appointments.filter((a) => a.status !== 'Completed' && a.status !== 'Cancelled');
  const completed = appointments.filter((a) => a.status === 'Completed');
  const pendingBills = bills.filter((b) => b.status === 'Pending');
  const q = search.toLowerCase().trim();

  async function cancelAppointment(id) {
    try {
      await Appointments.update(id, { status: 'Cancelled' });
      loadAppointments();
    } catch (err) {
      notify(err.message || 'Could not cancel the appointment', 'error');
    }
  }

  function payBill(id) {
    // Pay Now on the dashboard hands off to Billing & Payments with the bill preselected.
    navigate(`/patient/billing?bill=${encodeURIComponent(id)}`);
  }

  function bookAt(hospitalId) {
    navigate(hospitalId ? `/patient/appointments?hospitalId=${encodeURIComponent(hospitalId)}` : '/patient/appointments');
  }

  const proximityScore = (h) => {
    let score = 0;
    if (patientPincode && String(h.pincode || '').trim() === patientPincode) score += 3;
    if (patientCity && String(h.city || '').trim().toLowerCase() === patientCity.toLowerCase()) score += 2;
    if (patientState && String(h.state || '').trim().toLowerCase() === patientState.toLowerCase()) score += 1;
    return score;
  };
  const verified = (hospitals || []).filter((h) => !h.verificationStatus || h.verificationStatus === 'verified');
  const rankedHospitals = [...(verified.length ? verified : hospitals || [])].sort((a, b) => proximityScore(b) - proximityScore(a));
  const location = [patientCity, patientState, patientPincode].filter(Boolean).join(' • ');

  const doctorName = (appt) => (appt.doctor && appt.doctor.startsWith('Dr.') ? appt.doctor : appt.doctorName || `Dr. ${appt.department || 'General'} Specialist`);
  const paidMember = isPaidMembership(membership);

  const eyeIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="#4A5565" strokeWidth="1.5" /><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="#4A5565" strokeWidth="1.5" /></svg>
  );

  return (
    <main className="main-content">
      <PatientHeader searchPlaceholder="Search appointments, doctors, records..." search={search} onSearch={setSearch} />

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          {membership && (
            <div
              id="heroMembershipBadge"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, marginBottom: 12, background: paidMember ? '#DCFCE7' : '#F1F5F9', color: paidMember ? '#166534' : '#475569', border: paidMember ? '1px solid #86EFAC' : '1px solid #CBD5E1' }}
            >
              <span>{paidMember ? '⭐' : '📋'}</span>
              <span>{membership.planName || 'Care+ Member'}</span>
              <Link to="/patient/membership" style={{ color: 'inherit', textDecoration: 'underline', fontSize: 11.5, marginLeft: 4 }}>{paidMember ? 'View Benefits →' : 'Upgrade →'}</Link>
            </div>
          )}
          <h1>Welcome Back, {firstName}!</h1>
          <p>Manage your healthcare services, appointments, and billing in one place.</p>
          <button type="button" className="btn-primary" onClick={() => navigate('/patient/appointments')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M6.667 1.667V5M13.333 1.667V5" stroke="currentColor" strokeWidth="1.667" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="2.5" y="3.333" width="15" height="15" rx="2" stroke="currentColor" strokeWidth="1.667" />
              <path d="M2.5 8.333h15M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.667" strokeLinecap="round" strokeLinejoin="round" />
            </svg>{' '}
            Book Appointment
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-grid">
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/patient/appointments?view=my')}>
          <div className="stat-content">
            <div className="stat-info"><p className="stat-label">Upcoming Appointments</p><h3 className="stat-value" id="statAppointments">{upcoming.length}</h3></div>
            <div className="stat-icon blue">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M8.667 2.167V6.5M17.333 2.167V6.5" stroke="#155DFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="3.25" y="4.333" width="19.5" height="19.5" rx="2" stroke="#155DFC" strokeWidth="2" />
                <path d="M3.25 10.833h19.5" stroke="#155DFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => recordsRef.current?.scrollIntoView({ behavior: 'smooth' })}>
          <div className="stat-content">
            <div className="stat-info"><p className="stat-label">Medical Records</p><h3 className="stat-value" id="statRecords">{completed.length}</h3></div>
            <div className="stat-icon green">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <rect x="6.5" y="2.167" width="13" height="21.667" rx="2" stroke="#009689" strokeWidth="2" />
                <path d="M10.833 9.75H8.667M17.333 14.083H8.667M17.333 18.417H8.667" stroke="#009689" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/patient/ambulance')}>
          <div className="stat-content">
            <div className="stat-info"><p className="stat-label">Ambulance Requests</p><h3 className="stat-value" id="statAmbulance">{ambulanceCount}</h3></div>
            <div className="stat-icon red">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M10.833 10.833H6.5M8.667 8.667V13" stroke="#E7000B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9.75 19.5h6.5M16.25 19.5a2.167 2.167 0 104.333 0 2.167 2.167 0 00-4.333 0zM5.417 19.5a2.167 2.167 0 104.333 0 2.167 2.167 0 00-4.333 0z" stroke="#E7000B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2.167 6.5h8.666v13H2.167zM10.833 10.833h4.334l3.25 3.25v5.417h-7.584" stroke="#E7000B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/patient/billing')}>
          <div className="stat-content">
            <div className="stat-info"><p className="stat-label">Pending Bills</p><h3 className="stat-value" id="statBills">{pendingBills.length}</h3></div>
            <div className="stat-icon orange">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <rect x="2.167" y="4.333" width="21.667" height="17.333" rx="2" stroke="#F54900" strokeWidth="2" />
                <path d="M2.167 10.833h21.667" stroke="#F54900" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section className="content-sections">
        {/* Hospital network */}
        <div className="section-card">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>All NexCare Hospitals</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link to="/patient/hospital-search" className="btn-outline-sm" style={{ textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Search Hospitals</Link>
              <span id="patientLocationBadge" style={{ fontSize: 13, color: '#1D4ED8', background: '#EFF6FF', padding: '4px 10px', borderRadius: 6, fontWeight: 500 }}>
                {location ? `All hospitals • nearest to ${location}` : 'All verified NexCare hospitals'}
              </span>
            </div>
          </div>
          <div id="nearbyHospitalsGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
            {hospitals === null && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 24, color: '#6A7282' }}>Loading the NexCare hospital network...</div>}
            {hospitals !== null && hospitals.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 24, color: '#6A7282' }}>Hospital information is temporarily unavailable. Please try again.</div>}
            {rankedHospitals.map((h) => {
              const pin = String(h.pincode || '').trim();
              const city = String(h.city || '').trim();
              const fullAddr = `${h.address ? `${h.address}, ` : ''}${city}${pin ? ` - ${pin}` : ''}`;
              let tag;
              if (patientPincode && pin === patientPincode) tag = <span style={{ background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Same PIN ({patientPincode})</span>;
              else if (patientCity && city.toLowerCase() === patientCity.toLowerCase()) tag = <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>In Your City</span>;
              else if (patientState && String(h.state || '').trim().toLowerCase() === patientState.toLowerCase()) tag = <span style={{ background: '#F5F3FF', color: '#6D28D9', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>In Your State</span>;
              else tag = <span style={{ background: '#F3F4F6', color: '#4B5563', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>NexCare Network</span>;
              const bedsAvail = typeof h.availableBeds === 'number' ? h.availableBeds : h.icuBeds || 0;
              const bedsTotal = typeof h.totalBeds === 'number' ? h.totalBeds : 0;
              const emergency = h.emergencyAvailable || h.emergency24x7 ? 'Available 24x7' : 'Not Available';
              return (
                <div key={h.id || h.name} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8, marginBottom: 8 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>{h.name || 'Hospital'}</h3>
                    </div>
                    <div style={{ marginBottom: 10 }}>{tag}</div>
                    <p style={{ fontSize: 12, color: '#6A7282', margin: '0 0 6px' }}>📍 {fullAddr}</p>
                    <p style={{ fontSize: 12, color: '#4B5563', margin: '0 0 4px' }}>🛏️ Beds: <strong>{bedsAvail} available</strong> / {bedsTotal} total</p>
                    <p style={{ fontSize: 12, color: '#4B5563', margin: '0 0 12px' }}>🚨 Emergency: <strong>{emergency}</strong>{h.phone ? ` • 📞 ${h.phone}` : ''}</p>
                  </div>
                  <button type="button" className="btn-primary-sm" onClick={() => bookAt(h.id)} style={{ width: '100%', textAlign: 'center' }}>Book Appointment</button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming appointments */}
        <div className="section-card">
          <div className="section-header"><h2>Upcoming Appointments</h2></div>
          <div className="appointments-table">
            <table id="appointmentsTable">
              <thead>
                <tr><th>Hospital</th><th>Doctor</th><th>Department</th><th>Date</th><th>Time</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {upcoming.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#6A7282', padding: 20 }}>No upcoming appointments found.</td></tr>}
                {upcoming.map((appt) => {
                  const hosp = appt.hospitalName || appt.hospital || 'NexCare General Hospital';
                  const doc = doctorName(appt);
                  if (!contains(q, hosp, doc, appt.department, appt.dateLabel, appt.timeLabel, appt.status)) return null;
                  return (
                    <tr key={appt.id}>
                      <td><strong>{hosp}</strong></td>
                      <td>{doc}</td>
                      <td>{appt.department}</td>
                      <td>{appt.dateLabel}</td>
                      <td>{appt.timeLabel}</td>
                      <td><span className={`badge ${appt.status === 'Confirmed' ? 'badge-confirmed' : 'badge-pending'}`}>{appt.status}</span></td>
                      <td>
                        <button type="button" className="btn-icon" title="View" onClick={() => setModal({ title: 'Appointment Details', message: `Viewing details for Appointment: ${appt.token || appt.id}\nHospital: ${hosp}\nDoctor: ${doc}\nReason: ${appt.reason || 'N/A'}` })}>
                          {eyeIcon}
                        </button>
                        <button type="button" className="btn-icon" title="Cancel" onClick={() => setModal({ title: 'Cancel Appointment', message: `Are you sure you want to cancel this appointment with ${doc} at ${hosp}?`, onConfirm: () => cancelAppointment(appt.id) })}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="#E7000B" strokeWidth="1.33" strokeLinecap="round" /></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Billing */}
        <div className="section-card">
          <div className="section-header"><h2>Billing &amp; Payments</h2></div>
          <div className="billing-table">
            <table id="billingTable">
              <thead>
                <tr><th>Bill ID</th><th>Service</th><th>Date</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {bills.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#6A7282', padding: 20 }}>No bills found.</td></tr>}
                {bills.map((bill) => {
                  const service = bill.items && bill.items[0] ? bill.items[0].description : 'General Services';
                  if (!contains(q, bill.id, service, bill.visitDate, bill.dueDate, bill.status)) return null;
                  return (
                    <tr key={bill.id}>
                      <td><strong>{bill.id}</strong></td>
                      <td>{service}</td>
                      <td>{bill.visitDate || bill.dueDate}</td>
                      <td><strong>{bill.currency}{bill.total || bill.subtotal}</strong></td>
                      <td><span className={`badge ${bill.status === 'Paid' ? 'badge-paid' : 'badge-pending'}`}>{bill.status}</span></td>
                      <td style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
                        {bill.status === 'Pending' ? (
                          <button type="button" className="btn-primary-sm" onClick={() => setModal({ title: 'Confirm Payment', message: `Proceed to pay ${bill.currency}${bill.subtotal} for ${bill.id}?`, onConfirm: () => payBill(bill.id) })}>Pay Now</button>
                        ) : (
                          <button type="button" className="btn-icon" title="Download PDF" onClick={() => downloadInvoicePDF(bill, patient, (m) => notify(m, 'warning'))}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 10v3.333A1.333 1.333 0 0112.667 14.667H3.333A1.333 1.333 0 012 13.333V10" stroke="#4A5565" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" /><path d="M4.667 6.667L8 10l3.333-3.333M8 10V1.333" stroke="#4A5565" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </button>
                        )}
                        <button type="button" className="btn-icon" title="View Breakdown" onClick={() => setInvoiceBill(bill)}>{eyeIcon}</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Medical records */}
        <div className="section-card">
          <div className="section-header"><h2>Medical Records</h2></div>
          <div className="records-grid" id="recordsGrid" ref={recordsRef}>
            {completed.length === 0 && <p style={{ color: '#6A7282', padding: 20, gridColumn: '1 / -1' }}>No medical records found.</p>}
            {completed.map((appt, index) => {
              const title = appt.reason || `Visit Diagnostics #${index + 1}`;
              if (!contains(q, title, appt.doctor, appt.department, appt.dateLabel)) return null;
              return (
                <div className="record-card" key={appt.id}>
                  <div className="record-icon blue">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#155DFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#155DFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="record-info">
                    <h3>{title}</h3>
                    <p>{appt.doctor} - {appt.department}</p>
                    <p className="record-date">{appt.dateLabel}</p>
                  </div>
                  <div className="record-actions">
                    <button type="button" className="btn-primary-sm" onClick={() => setModal({ title: 'Medical Record', message: `Opening Medical Record:\nPatient: ${appt.patientName}\nDoctor: ${appt.doctor}\nDepartment: ${appt.department}\nDate: ${appt.dateLabel}\n\nNotes: Patient is fully recovered and cleared.` })}>View</button>
                    <button type="button" className="btn-outline-sm" onClick={() => setModal({ title: 'Download Document', message: `Downloading standard medical release form for ${appt.dateLabel}...` })}>Download</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <SystemModal open={Boolean(modal)} title={modal?.title} message={modal?.message} onConfirm={modal?.onConfirm} onClose={() => setModal(null)} />
      <InvoiceModal bill={invoiceBill} patient={patient} onClose={() => setInvoiceBill(null)} onPay={invoiceBill ? () => payBill(invoiceBill.id) : undefined} />
    </main>
  );
}
