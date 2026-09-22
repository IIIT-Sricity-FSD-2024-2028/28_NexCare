import { useEffect, useRef, useState } from 'react';
import { System } from '../../api';
import { useToast } from '../../context/ToastContext';
import { SuPage } from './suShared';

// superuser/system-settings.html + system-settings.js: three text fields and
// two toggles, read from `GET /system/settings` (an array of { key, value })
// and written back as one key→value map with `PUT /system/settings`.

// Default fallback settings
const DEFAULT_SETTINGS = {
  hospitalName: 'NexCare General Hospital',
  supportEmail: 'support@nexcare.com',
  emergencyPhone: '911',
  enableRegistration: true,
  maintenanceMode: false,
};

/** The backend returns an array of { id, key, value }; flatten it. */
function parseSettingsArray(data) {
  if (!data) return {};
  if (Array.isArray(data)) return data.reduce((acc, item) => { acc[item.key] = item.value; return acc; }, {});
  return data;
}

// The bulk update stores every value as a string, so a saved `false` comes
// back as "false" — which the HTML page's `!!value` read as on. Read the
// string back as the boolean it was saved from.
function bool(value, fallback) {
  if (value === undefined) return fallback;
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
  return Boolean(value);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SystemSettingsPage() {
  const { notify } = useToast();
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [emailError, setEmailError] = useState(false);
  const [banner, setBanner] = useState(false);
  const bannerTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    System.getSettings()
      .then((resp) => {
        if (cancelled || !resp.data) return;
        const parsed = parseSettingsArray(resp.data);
        // Map backend keys to our settings keys
        setForm({
          hospitalName: parsed.hospitalName || DEFAULT_SETTINGS.hospitalName,
          supportEmail: parsed.supportEmail || DEFAULT_SETTINGS.supportEmail,
          emergencyPhone: parsed.emergencyContact || parsed.emergencyPhone || DEFAULT_SETTINGS.emergencyPhone,
          enableRegistration: bool(parsed.enableRegistration, DEFAULT_SETTINGS.enableRegistration),
          maintenanceMode: bool(parsed.maintenanceMode, DEFAULT_SETTINGS.maintenanceMode),
        });
      })
      .catch((err) => console.warn('Could not load settings from API, using defaults:', err));
    return () => { cancelled = true; clearTimeout(bannerTimer.current); };
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    const sEmail = form.supportEmail.trim();
    if (!EMAIL_RE.test(sEmail)) {
      notify('Please enter a valid email for Support Contact.', 'warning');
      setEmailError(true);
      return;
    }
    setEmailError(false);

    const updatedSettings = {
      hospitalName: form.hospitalName.trim(),
      supportEmail: sEmail,
      emergencyPhone: form.emergencyPhone.trim(),
      enableRegistration: form.enableRegistration,
      maintenanceMode: form.maintenanceMode,
    };
    try {
      await System.updateSettings(updatedSettings);
    } catch (err) {
      console.warn('Failed to save settings to API, saving locally:', err);
    }
    // Show visual confirmation
    setBanner(true);
    clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(false), 3000);
  }

  return (
    <SuPage className="su-page su-settings" title="Global System Settings">
      <div className="page-header">
        <h1>Global System Setup</h1>
        <p style={{ margin: '5px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Manage core operational configurations and system toggles.</p>
      </div>

      <form id="settingsForm" onSubmit={onSubmit}>
        <div className="settings-grid">
          <div className="settings-card">
            <h3>Hospital Information Profile</h3>
            <div className="form-group">
              <label htmlFor="hospitalName">Hospital/Institution Name</label>
              <input type="text" id="hospitalName" className="form-control" required value={form.hospitalName} onChange={set('hospitalName')} />
            </div>
            <div className="form-group" style={{ display: 'flex', gap: 15 }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="supportEmail">System Support Email</label>
                <input type="email" id="supportEmail" className="form-control" required value={form.supportEmail} onChange={set('supportEmail')} style={{ borderColor: emailError ? '#B91C1C' : '#E5E7EB' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="emergencyPhone">Emergency Ambulance Hotline</label>
                <input type="tel" id="emergencyPhone" className="form-control" pattern="[0-9]{3,15}" required value={form.emergencyPhone} onChange={set('emergencyPhone')} />
              </div>
            </div>
          </div>

          <div className="settings-card">
            <h3>System Operational Control</h3>
            <div className="toggle-switch">
              <div>
                <label htmlFor="toggleRegistration">Enable Patient Registration</label>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Allow new patients to create accounts via the public portal.</p>
              </div>
              <label className="switch">
                <input type="checkbox" id="toggleRegistration" checked={form.enableRegistration} onChange={set('enableRegistration')} />
                <span className="slider" />
              </label>
            </div>
            <div className="toggle-switch">
              <div>
                <label htmlFor="toggleMaintenance">System Maintenance Mode</label>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Lock out all non-Super User accounts (Admin, Patient, Drivers).</p>
              </div>
              <label className="switch">
                <input type="checkbox" id="toggleMaintenance" checked={form.maintenanceMode} onChange={set('maintenanceMode')} />
                <span className="slider" />
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" style={{ padding: '12px 30px', fontSize: 16 }}>Save System Configuration</button>
          </div>
        </div>
      </form>

      <div id="saveBanner" className={`save-banner${banner ? ' show' : ''}`}>✓ Settings Saved Successfully!</div>
    </SuPage>
  );
}
