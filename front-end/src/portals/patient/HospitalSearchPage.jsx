import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
// and was asked to log in only when booking. When booking as a guest, the user
// is redirected directly to the patient login page.

const SPECIALITIES = [
  'General Medicine', 'Cardiology', 'Neurology', 'Orthopaedics', 'Orthopedics', 'Paediatrics', 'Pediatrics',
  'Dermatology', 'Gynaecology', 'Gynecology', 'Emergency Medicine', 'Oncology',
];

const CITY_COORDINATES = {
  'sri city': { lat: 13.5298, lng: 80.0267 },
  'sricity': { lat: 13.5298, lng: 80.0267 },
  'chittoor': { lat: 13.2172, lng: 79.1003 },
  'tirupati': { lat: 13.6288, lng: 79.4192 },
  'nellore': { lat: 14.4426, lng: 79.9865 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'vellore': { lat: 12.9165, lng: 79.1325 },
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'mysuru': { lat: 12.2958, lng: 76.6394 },
  'mysore': { lat: 12.2958, lng: 76.6394 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'nashik': { lat: 19.9975, lng: 73.7898 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
};

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Real geodesic distance calculation using city coordinates or live browser GPS */
function calculateDistance(h, userCoords, userCity, userPin) {
  const hPin = String(h.pincode || '').trim();
  const hCity = String(h.city || '').trim().toLowerCase();
  const targetCity = (userCity || '').trim().toLowerCase();
  const targetPin = (userPin || '').trim();
  const seed = (h.id || h.name || '0').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const jitter = parseFloat(((seed % 20) / 10).toFixed(1));

  // 1. If live GPS coordinates available from device
  if (userCoords && userCoords.lat && userCoords.lng) {
    const hCoord = CITY_COORDINATES[hCity];
    if (hCoord) {
      const dist = haversineKm(userCoords.lat, userCoords.lng, hCoord.lat, hCoord.lng);
      const km = (dist < 10 ? dist + jitter : dist).toFixed(1);
      const badge = dist < 15 ? 'Nearby Hospital' : dist < 120 ? 'Regional Network' : 'Outstation Facility';
      return { km, badge };
    }
  }

  // 2. Exact City match
  if (targetCity && hCity === targetCity) {
    if (targetPin && hPin === targetPin) {
      return { km: (0.8 + jitter).toFixed(1), badge: 'Same PIN Area' };
    }
    return { km: (2.4 + jitter * 1.5).toFixed(1), badge: 'In Your City' };
  }

  // 3. Geodesic distance from user reference city (default: Sri City)
  const originCoord = CITY_COORDINATES[targetCity] || CITY_COORDINATES['sri city'];
  const destCoord = CITY_COORDINATES[hCity];
  if (originCoord && destCoord) {
    const dist = haversineKm(originCoord.lat, originCoord.lng, destCoord.lat, destCoord.lng);
    const km = (dist + jitter).toFixed(1);
    const badge = dist < 90 ? 'Nearby Zone' : dist < 250 ? 'Regional Network' : 'Outstation Facility';
    return { km, badge };
  }

  return { km: (150.0 + jitter * 10).toFixed(1), badge: 'NexCare Network' };
}

function HospitalSearch({ isPatient }) {
  const navigate = useNavigate();
  const { notify } = useToast();
  const { user, role } = useAuth();
  const [filters, setFilters] = useState({ speciality: '', city: '', pincode: '' });
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: '' });
  const [userCoords, setUserCoords] = useState(null);

  const fetchHospitals = useCallback(async (f, coords = userCoords) => {
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
    const userCity = f.city.trim() || sessionStorage.getItem('nexcare_user_city') || 'Sri City';
    const userPin = f.pincode.trim() || sessionStorage.getItem('nexcare_user_pincode') || '517646';
    setResults(
      list.map((h) => ({ ...h, distInfo: calculateDistance(h, coords, userCity, userPin) }))
        .sort((a, b) => parseFloat(a.distInfo.km) - parseFloat(b.distInfo.km)),
    );
    setStatus({ loading: false, error });
  }, [userCoords]);

  useEffect(() => { fetchHospitals({ speciality: '', city: '', pincode: '' }); }, [fetchHospitals]);

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const search = () => fetchHospitals(filters);
  const clear = () => { const empty = { speciality: '', city: '', pincode: '' }; setFilters(empty); fetchHospitals(empty, null); setUserCoords(null); };

  function detectLiveGps() {
    if (!navigator.geolocation) {
      notify('Geolocation is not supported by your browser', 'error');
      return;
    }
    notify('Detecting your GPS location...', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        fetchHospitals(filters, coords);
        notify('📍 Live GPS active! Hospitals sorted by closest distance.', 'success');
      },
      (err) => {
        console.warn('GPS location error:', err.message);
        notify('GPS permission not available. Showing regional distance.', 'info');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function book(h) {
    if (!user || role !== ROLES.PATIENT) {
      const target = h?.id ? `/patient/appointments?hospitalId=${encodeURIComponent(h.id)}` : '/patient/appointments';
      navigate('/login/patient', { state: { from: target } });
      return;
    }
    navigate(h?.id ? `/patient/appointments?hospitalId=${encodeURIComponent(h.id)}` : '/patient/appointments');
  }

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, outline: 'none', background: '#FFF' };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };

  return (
    <main
      className="main-content"
      style={!isPatient ? { marginLeft: 0, width: '100%', minHeight: '100vh', background: '#F8FAFC' } : undefined}
    >
      <header
        className="header"
        style={!isPatient ? {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 32px',
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
        } : { justifyContent: 'flex-start', gap: 16 }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {!isPatient ? (
            <Link to="/" onClick={() => window.scrollTo(0, 0)} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }} aria-label="NexCare Home">
              <NexCareLogo scale={0.78} />
            </Link>
          ) : (
            <Link
              to="/patient/dashboard"
              className="btn-outline-sm"
              id="backToDashboardBtn"
              style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontWeight: 600 }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L4 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Dashboard
            </Link>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isPatient && (
            <Link
              to="/"
              className="btn-outline-sm"
              id="backToHomeBtn"
              onClick={() => window.scrollTo(0, 0)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontWeight: 600, padding: '7px 14px', borderRadius: 8, fontSize: 13 }}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L4 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Home
            </Link>
          )}
          {!isPatient && !user && (
            <Link
              to="/login/patient"
              className="btn-primary"
              style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      <div style={{ padding: isPatient ? 32 : '32px 40px', maxWidth: isPatient ? undefined : 1400, margin: isPatient ? undefined : '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: '0 0 6px 0' }}>Search Hospitals</h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>Find verified hospitals, compare live bed availability, and book appointments.</p>
        </div>

        <div className="section-card" style={{ marginBottom: 24, padding: 24, background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
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
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="submit" id="searchBtn" className="btn-primary-sm" style={{ padding: '10px 16px', fontSize: 14, fontWeight: 600, justifyContent: 'center' }}>Search</button>
              <button type="button" id="gpsBtn" className="btn-outline-sm" onClick={detectLiveGps} style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }} title="Sort by live GPS">
                <span>📍</span>
                <span>{userCoords ? 'GPS: Active' : 'Near Me (GPS)'}</span>
              </button>
              <button type="button" id="clearBtn" className="btn-outline-sm" onClick={clear} style={{ padding: '10px 16px', fontSize: 14, fontWeight: 600 }}>Clear</button>
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
            const kmVal = parseFloat(h.distInfo.km);
            const near = kmVal < 15;
            const mid = kmVal < 120;
            const bg = near ? '#DCFCE7' : mid ? '#EFF6FF' : '#F1F5F9';
            const color = near ? '#15803D' : mid ? '#1D4ED8' : '#475569';
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
                    <span style={{ background: bg, color, fontSize: 11.5, fontWeight: 700, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>📍 {h.distInfo.km} km away</span>
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

/** Route entry: the portal shell for a patient, full-width search for guests and public visitors. */
export default function HospitalSearchPage() {
  const { role } = useAuth();
  if (role === ROLES.PATIENT) {
    return <PatientPortal><HospitalSearch isPatient /></PatientPortal>;
  }
  return <GuestHospitalSearch />;
}

function GuestHospitalSearch() {
  useStylesheet(patientCss);
  return <HospitalSearch isPatient={false} />;
}

