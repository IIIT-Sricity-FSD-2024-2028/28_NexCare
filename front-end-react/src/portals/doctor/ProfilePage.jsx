import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { Panel, PageHeader } from '../../components/ui';
import { Auth } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { money } from '../../utils/format';

// doctor/profile.html + profile.js.
//
// The directory entry is what the booking wizard shows patients, so every
// field is read-only apart from the password.
export default function ProfilePage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [record, setRecord] = useState(user);
  const [pw, setPw] = useState({ current: '', next: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) return undefined;
    Auth.getCurrentUser(user.id)
      .then((res) => { if (!cancelled && res?.data) setRecord({ ...user, ...res.data }); })
      .catch(() => { /* fall back to the cached session */ });
    return () => { cancelled = true; };
  }, [user]);

  async function changePassword(e) {
    e.preventDefault();
    if (!pw.current || !pw.next) return notify('Enter both your current and your new password', 'error');
    if (pw.next.length < 6) return notify('The new password must be at least 6 characters', 'error');
    setSaving(true);
    try {
      await Auth.changePassword(pw.current, pw.next);
      notify('Password updated', 'success');
      setPw({ current: '', next: '' });
    } catch (err) {
      notify(err.message || 'Could not change your password', 'error');
    } finally {
      setSaving(false);
    }
  }

  const rows = [
    ['Name', record?.name],
    ['Email', record?.email],
    ['Specialisation', record?.dept || record?.specialization || '—'],
    ['Hospital', record?.hospitalName || record?.hospitalId || '—'],
    ['Registration no.', record?.medicalRegNumber || record?.registrationNo || '—'],
    ['Account status', record?.status || '—'],
    ['Consultation fee', record?.consultationFee != null ? money(record.consultationFee) : '—'],
  ];

  return (
    <>
      <Header title="My Profile" />
      <div className="page-body">
        <PageHeader title={record?.name || 'My profile'} subtitle={`Doctor · ${record?.email || ''}`} />

        <Panel title="Practice details">
          <div className="field-grid">
            {rows.map(([label, value]) => (
              <div className="field" key={label}>
                <label>{label}</label>
                <input value={value ?? '—'} readOnly style={{ background: '#F9FAFB', color: '#6B7280' }} />
              </div>
            ))}
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <p className="muted" style={{ margin: 0 }}>
                Specialisation and hospital are set by your hospital's administrator. Your consultation fee is yours to
                change, on the <Link to="/doctor/earnings">Earnings</Link> page.
              </p>
            </div>
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
              <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Updating…' : 'Update password'}</button>
            </div>
          </form>
        </Panel>
      </div>
    </>
  );
}
