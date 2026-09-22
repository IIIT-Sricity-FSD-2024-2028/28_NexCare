import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Hospitals } from '../../api';
import NexCareLogo from '../../components/NexCareLogo';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useStylesheet from '../../hooks/useStylesheet';
import patientCss from '../../styles/patient.css?url';
import { ROLES } from '../../utils/roles';
import PatientPortal from './PatientPortal';

// patient/hospital-search.html + hospital-search.js.
//
// The HTML page had no auth guard: a visitor from the landing page could search
// and was asked to log in only when booking. The SPA keeps that — a signed-in
// patient gets the portal sidebar, anyone else the page's own three-item one.

const SPECIALITIES = [
  'General Medicine', 'Cardiology', 'Neurology', 'Orthopaedics', 'Orthopedics', 'Paediatrics', 'Pediatrics',
  'Dermatology', 'Gynaecology', 'Gynecology', 'Emergency Medicine', 'Oncology',
];

/** Deterministic "distance" from the filters (the HTML page invented one the same way). */
function calculateDistance(h, userCity, userPin) {
  const hPin = String(h.pincode || '').trim();
  const hCity = String(h.city || '').trim().toLowerCase();
  const targetCity = (userCity || '').trim().toLowerCase();
  const targetPin = (userPin || '').trim();
  const seed = (h.id || h.name || '0').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const offset = parseFloat(((seed % 20) / 10).toFixed(1));
  if (targetPin && hPin === targetPin) return { km: (0.8 + offset).toFixed(1), badge: 'Same PIN Area' };
  if (targetCity && hCity === targetCity) return { km: (2.2 + offset * 2).toFixed(1), badge: 'In Your City' };
  if (targetPin && targetPin.substring(0, 2) === hPin.substring(0, 2)) return { km: (7.5 + offset * 3).toFixed(1), badge: 'Nearby Zone' };
  return { km: (15.0 + offset * 5).toFixed(1), badge: 'NexCare Network' };
}

function GuestSidebar() {
  return (
    <aside className="sidebar">
      <Link className="sidebar-brand" to="/" aria-label="NexCare Home">
        <NexCareLogo />
        <span className="sidebar-brand-subtitle">Patient Portal</span>
      </Link>
      <nav className="nav-menu">
        <Link to="/" className="nav-item">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 9l7-6 7 6v8a1 1 0 01-1 1h-4v-5H8v5H4a1 1 0 01-1-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          <span>Home</span>
        </Link>
        <NavLink to="/patient/hospital-search" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>Search Hospitals</span>
        </NavLink>
        <Link to="/login" className="nav-item">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 5l-5 5 5 5M2 10h10M8 15v.5a2 2 0 002 2h6a2 2 0 002-2v-11a2 2 0 00-2-2h-6a2 2 0 00-2 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Login to Book</span>
        </Link>
      </nav>
    </aside>
  );
}

function HospitalSearch({ isPatient }) {
  const navigate = useNavigate();
  const { notify } = useToast();
  const { user } = useAuth();
  const [filters, setFilters] = useState({ speciality: '', city: '', pincode: '' });
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: '' });

  const fetchHospitals = useCallback(async (f) => {
    setStatus({ loading: true, error: '' });
    let list = [];
    let error = '';
    try {
      const res = await Hospitals.getAll({ speciality: f.speciality.trim(), city: f.city.trim(), pincode: f.pincode.trim() });
      const raw = res.data;
      list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.hospitals) ? raw.hospitals : [];
    } catch (err) {
      console.error('Backend unavailable or returned error for hospital search:', err);
      error = 'Unable to load hospital data. Please check the connection and try again.';
    }
    const userCity = f.city.trim() || sessionStorage.getItem('nexcare_user_city') || 'Hyderabad';
    const userPin = f.pincode.trim() || sessionStorage.getItem('nexcare_user_pincode') || '500033';
    setResults(
      list.map((h) => ({ ...h, distInfo: calculateDistance(h, userCity, userPin) }))
        .sort((a, b) => parseFloat(a.distInfo.km) - parseFloat(b.distInfo.km)),
    );
    setStatus({ loading: false, error });
  }, []);

  useEffect(() => { fetchHospitals({ speciality: '', city: '', pincode: '' }); }, [fetchHospitals]);

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const search = () => fetchHospitals(filters);
  const clear = () => { const empty = { speciality: '', city: '', pincode: '' }; setFilters(empty); fetchHospitals(empty); };

  function book(h) {
    if (!user) {
      notify('Please login to book an appointment', 'warning');
      return;
    }
    navigate(h?.id ? `/patient/appointments?hospitalId=${encodeURIComponent(h.id)}` : '/patient/appointments');
  }

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, outline: 'none', background: '#FFF' };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };

  return (
    <main className="main-content">
      <header className="header" style={{ justifyContent: 'flex-start', gap: 16 }}>
        <Link to={isPatient ? '/patient/dashboard' : '/'} className="btn-outline-sm" id="backToDashboardBtn" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontWeight: 600 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L4 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {isPatient ? 'Back to Dashboard' : 'Back to Home'}
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Search Hospitals</h1>
      </header>

      <div style={{ padding: 32 }}>
        <div className="section-card" style={{ marginBottom: 24, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1F2937' }}>Search &amp; Filter</h2>
          <form id="hospitalSearchForm" onSubmit={(e) => { e.preventDefault(); search(); }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, alignItems: 'end' }}>
            <div>
              <label htmlFor="specialitySelect" style={labelStyle}>Speciality</label>
              <select id="specialitySelect" style={inputStyle} value={filters.speciality} onChange={set('speciality')}>
                <option value="">All Specialities</option>
                {SPECIALITIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="cityInput" style={labelStyle}>City</label>
              <input type="text" id="cityInput" placeholder="Enter city name..." style={inputStyle} value={filters.city} onChange={set('city')} />
            </div>
            <div>
              <label htmlFor="pincodeInput" style={labelStyle}>PIN Code</label>
              <input type="text" id="pincodeInput" placeholder="Enter PIN code..." style={inputStyle} value={filters.pincode} onChange={set('pincode')} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" id="searchBtn" className="btn-primary" style={{ flex: 1, padding: '10px 16px', fontSize: 14, fontWeight: 600, justifyContent: 'center' }}>Search</button>
              <button type="button" id="clearBtn" className="btn-outline-sm" onClick={clear} style={{ padding: '10px 16px', fontSize: 14, fontWeight: 600 }}>Clear Filters</button>
            </div>
          </form>
        </div>

        <div id="statusContainer" style={{ marginBottom: 16, color: status.error ? '#B91C1C' : undefined }}>
          {status.loading && <div style={{ padding: 32, textAlign: 'center', color: '#4B5563', fontSize: 15, fontWeight: 500 }}>Loading matching hospitals...</div>}
          {!status.loading && status.error}
        </div>

        <div id="resultsGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {!status.loading && results.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '40px 20px', textAlign: 'center', background: '#FFFFFF', border: '1px dashed #D1D5DB', borderRadius: 12 }}>
              <h3 style={{ margin: '0 0 8px', color: '#1F2937', fontSize: 16, fontWeight: 600 }}>No hospitals match the selected filters.</h3>
              <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>Try adjusting or clearing your speciality, city, or PIN code filters.</p>
            </div>
          )}
          {!status.loading && results.map((h) => {
            const near = parseFloat(h.distInfo.km) < 5;
            const locParts = [h.address, h.city, h.pincode].filter(Boolean);
            const specs = Array.isArray(h.departments) && h.departments.length
              ? h.departments.map((d) => (typeof d === 'string' ? d : d.name))
              : Array.isArray(h.specialities) ? h.specialities : h.speciality ? [h.speciality] : [];
            const bedsTotal = typeof h.totalBeds === 'number' ? h.totalBeds : 0;
            const bedsAvail = typeof h.availableBeds === 'number' ? h.availableBeds : h.icuBeds || 0;
            const isEmerg = Boolean(h.emergencyAvailable || h.emergency24x7);
            return (
              <div key={h.id || h.name} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>{h.name || 'Hospital'}</h3>
                    <span style={{ background: near ? '#DCFCE7' : '#EFF6FF', color: near ? '#15803D' : '#1D4ED8', fontSize: 11.5, fontWeight: 700, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>📍 {h.distInfo.km} km away</span>
                  </div>
                  {locParts.length > 0 && <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#4B5563' }}>{locParts.join(', ')}</p>}
                  {specs.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {specs.slice(0, 5).filter(Boolean).map((s) => (
                        <span key={s} style={{ background: '#F1F5F9', color: '#334155', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4 }}>{s}</span>
                      ))}
                    </div>
                  )}
                  <p style={{ margin: '0 0 6px', fontSize: 12.5, color: '#374151' }}>🛏️ Beds: <strong>{bedsAvail} available</strong> / {bedsTotal} total</p>
                  <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#4B5563' }}>
                    🚨 Emergency: <strong style={{ color: isEmerg ? '#16A34A' : '#6B7280' }}>{isEmerg ? 'Available 24x7' : 'Standard'}</strong>
                    {h.phone ? ` • 📞 ${h.phone}` : ''}
                  </p>
                </div>
                <button type="button" className="btn-primary-sm" onClick={() => book(h)} style={{ width: '100%', marginTop: 12, textAlign: 'center' }}>Book Appointment</button>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

/** Route entry: the portal shell for a patient, the page's own sidebar for everyone else. */
export default function HospitalSearchPage() {
  const { role } = useAuth();
  if (role === ROLES.PATIENT) {
    return <PatientPortal><HospitalSearch isPatient /></PatientPortal>;
  }
  return <GuestHospitalSearch />;
}

function GuestHospitalSearch() {
  useStylesheet(patientCss);
  return (
    <>
      <GuestSidebar />
      <HospitalSearch isPatient={false} />
    </>
  );
}
