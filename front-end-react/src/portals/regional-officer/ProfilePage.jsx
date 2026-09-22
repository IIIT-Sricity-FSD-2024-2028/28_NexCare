import { useEffect, useState } from 'react';
import Header from '../../components/layout/Header';
import { Panel, PageHeader } from '../../components/ui';
import { Auth, Hospitals } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// regional-officer/profile.html + profile.js: the login user's regional
// profile (read-only) and a change-password form.

const REGION_NAMES = {
  'REG-AP-SOUTH': 'Andhra Pradesh South',
  'REG-KA-SOUTH': 'Karnataka South',
  'REG-MH-CENTRAL': 'Maharashtra Central',
  'REG-TN-NORTH': 'Tamil Nadu North',
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [hospitalCount, setHospitalCount] = useState(0);
  const [pw, setPw] = useState({ current: '', next: '' });
  const [saving, setSaving] = useState(false);

  // Assigned hospitals count from the regional overview.
  useEffect(() => {
    let cancelled = false;
    Hospitals.getRegionalOverview()
      .then((res) => {
        if (cancelled) return;
        setHospitalCount(res.data?.summary?.assignedHospitals || res.data?.hospitals?.length || 0);
      })
      .catch((e) => console.warn('Could not fetch regional overview count:', e));
    return () => { cancelled = true; };
  }, []);

  async function changePassword(e) {
    e.preventDefault();
    if (!pw.current || !pw.next) return notify('Please fill in both password fields', 'warning');
    if (pw.next.length < 6) return notify('New password must be at least 6 characters', 'warning');
    setSaving(true);
    try {
      await Auth.changePassword(pw.current, pw.next);
      notify('Password updated successfully', 'success');
      setPw({ current: '', next: '' });
    } catch (err) {
      notify(`Failed to update password: ${err?.message || 'Unknown error'}`, 'error');
    } finally {
      setSaving(false);
    }
  }

  const u = user || {};
  const nameStr = u.name || 'Regional Officer';
  const regionName = u.regionName || REGION_NAMES[u.regionId] || u.regionId || 'N/A';
  const joined = u.createdAt
    ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '01 Jan 2026';

  const fields = [
    ['Full Name', nameStr],
    ['Employee ID', u.employeeId || u.id || 'EMP-RO-001'],
    ['Email Address', u.email || 'N/A'],
    ['Phone Number', u.phone || '+91 98480 00111'],
    ['Role', 'Regional Officer'],
    ['Region Name', regionName],
    ['Region ID', u.regionId || 'REG-001'],
    ['State / Area', Array.isArray(u.areas) ? u.areas.join(', ') : (u.areas || 'N/A')],
    ['Number of Hospitals Managed', `${hospitalCount} Hospitals`],
    ['Account Status', u.status || 'Active'],
    ['Date Joined', joined],
  ];

  return (
    <>
      <Header title="My Profile" />
      <div className="page-body">
        <PageHeader title={nameStr} subtitle={`${u.regionName || u.regionId || 'Regional'} Management Profile`} />

        <Panel title="Profile details">
          <div className="field-grid" id="profileFields" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {fields.map(([label, value]) => (
              <div className="field" key={label} style={{ background: '#F9FAFB', padding: '12px 16px', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>{label}</label>
                <div className="field-value" style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{value}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Change password" hint="At least 6 characters">
          <form onSubmit={changePassword} className="field-grid" style={{ maxWidth: 700 }}>
            <div className="field">
              <label htmlFor="currentPassword">Current password</label>
              <input id="currentPassword" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="newPassword">New password</label>
              <input id="newPassword" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} />
            </div>
            <div className="field">
              <label>&nbsp;</label>
              <button type="submit" className="btn primary" id="changePasswordBtn" disabled={saving}>{saving ? 'Updating…' : 'Update password'}</button>
            </div>
          </form>
        </Panel>
      </div>
    </>
  );
}
