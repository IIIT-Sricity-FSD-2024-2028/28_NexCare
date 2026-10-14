import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hospitals } from '../../api';
import '../../styles/hospital-registration.css';

// front-end/landing/hospital-registration.html — the public "Register Your
// Hospital" form (the one the landing page and login hub link to). Submits to
// POST /hospitals/register; validation and duplicate checks are server-side,
// the only client rule is ICU beds ≤ total beds.
const EMPTY = {
  name: '', registrationNumber: '', type: '', ownershipType: '', address: '', city: '', state: '', pincode: '',
  phone: '', email: '', totalBeds: '', icuBeds: '', emergency24x7: false, ambulanceService: false,
  adminName: '', adminEmail: '', adminPhone: '',
};

export default function HospitalRegistrationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [alert, setAlert] = useState(null); // { type: 'success'|'error', html }
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!e.currentTarget.reportValidity()) return;
    setAlert(null);
    const data = {
      ...form,
      totalBeds: parseInt(form.totalBeds, 10),
      icuBeds: parseInt(form.icuBeds, 10),
      emergency24x7: Boolean(form.emergency24x7),
      ambulanceService: Boolean(form.ambulanceService),
      specialities: ['General'], // Simplified for this demo
    };
    if (data.icuBeds > data.totalBeds) {
      setAlert({ type: 'error', text: 'ICU beds cannot exceed total beds.' });
      return;
    }
    setBusy(true);
    try {
      await Hospitals.register(data);
      setAlert({ type: 'success', strong: 'Success!', text: ' Your hospital registration request has been submitted. It is now Pending Verification. Redirecting to login...' });
      setForm(EMPTY);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setAlert({ type: 'error', strong: 'Error:', text: ` ${err.message || 'Network error. Please try again later.'}` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="hosp-reg-page">
      <nav id="navbar">
        <div className="container">
          <div className="nav-content">
            <Link to="/" style={{ textDecoration: 'none', color: '#2c3e50', fontSize: 24, fontWeight: 'bold' }}>NexCare</Link>
            <div className="nav-links">
              <Link to="/" className="nav-link">Home</Link>{' '}
              <Link to="/login" className="nav-link">Sign In</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="registration-container">
        <h2>Register Your Hospital</h2>
        <p>Join the NexCare network to manage your hospital operations efficiently.</p>

        {alert && (
          <div className={`alert ${alert.type}`}>
            {alert.strong && <strong>{alert.strong}</strong>}{alert.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <h3 className="section-title">Hospital Details</h3>
          <div className="form-group">
            <label htmlFor="hospitalName">Hospital Name *</label>
            <input type="text" id="hospitalName" required value={form.name} onChange={set('name')} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="regNumber">Registration Number *</label>
              <input type="text" id="regNumber" minLength="4" maxLength="50" required value={form.registrationNumber} onChange={set('registrationNumber')} />
            </div>
            <div className="form-group">
              <label htmlFor="hospitalType">Hospital Type *</label>
              <select id="hospitalType" required value={form.type} onChange={set('type')}>
                <option value="">Select Type</option>
                <option value="Multi-Speciality">Multi-Speciality</option>
                <option value="Super-Speciality">Super-Speciality</option>
                <option value="General Hospital">General Hospital</option>
                <option value="Clinic">Clinic</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="ownershipType">Ownership Type *</label>
              <select id="ownershipType" required value={form.ownershipType} onChange={set('ownershipType')}>
                <option value="">Select Ownership</option>
                <option value="Public">Public/Government</option>
                <option value="Private">Private</option>
                <option value="Trust/NGO">Trust/NGO</option>
              </select>
            </div>
          </div>

          <h3 className="section-title">Contact & Location</h3>
          <div className="form-group">
            <label htmlFor="address">Address *</label>
            <input type="text" id="address" required value={form.address} onChange={set('address')} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City *</label>
              <input type="text" id="city" required value={form.city} onChange={set('city')} />
            </div>
            <div className="form-group">
              <label htmlFor="state">State *</label>
              <input type="text" id="state" required value={form.state} onChange={set('state')} />
            </div>
            <div className="form-group">
              <label htmlFor="pincode">PIN Code *</label>
              <input type="text" id="pincode" inputMode="numeric" pattern="[0-9]{6}" title="Enter a 6-digit PIN code" required value={form.pincode} onChange={set('pincode')} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Official Phone *</label>
              <input type="tel" id="phone" inputMode="tel" pattern="\+?[0-9][0-9\s\(\)\-]{8,14}" title="Enter a valid 10 to 15 digit phone number" required value={form.phone} onChange={set('phone')} />
            </div>
            <div className="form-group">
              <label htmlFor="email">Official Email *</label>
              <input type="email" id="email" required value={form.email} onChange={set('email')} />
            </div>
          </div>

          <h3 className="section-title">Capacity & Facilities</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="totalBeds">Total Beds *</label>
              <input type="number" id="totalBeds" min="1" required value={form.totalBeds} onChange={set('totalBeds')} />
            </div>
            <div className="form-group">
              <label htmlFor="icuBeds">ICU Beds *</label>
              <input type="number" id="icuBeds" min="0" required value={form.icuBeds} onChange={set('icuBeds')} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="checkbox-label">
                <input type="checkbox" checked={form.emergency24x7} onChange={set('emergency24x7')} /> 24/7 Emergency Available
              </label>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input type="checkbox" checked={form.ambulanceService} onChange={set('ambulanceService')} /> Ambulance Service Available
              </label>
            </div>
          </div>

          <h3 className="section-title">Hospital Manager</h3>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 15 }}>This person will receive the verification updates and manage the hospital team once verified.</p>
          <div className="form-group">
            <label htmlFor="adminName">Manager Name *</label>
            <input type="text" id="adminName" required value={form.adminName} onChange={set('adminName')} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="adminEmail">Manager Email *</label>
              <input type="email" id="adminEmail" required value={form.adminEmail} onChange={set('adminEmail')} />
            </div>
            <div className="form-group">
              <label htmlFor="adminPhone">Manager Phone *</label>
              <input type="tel" id="adminPhone" inputMode="tel" pattern="\+?[0-9][0-9\s\(\)\-]{8,14}" title="Enter a valid 10 to 15 digit phone number" required value={form.adminPhone} onChange={set('adminPhone')} />
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={busy}>{busy ? 'Submitting...' : 'Submit Registration Request'}</button>
        </form>
      </div>
    </div>
  );
}
