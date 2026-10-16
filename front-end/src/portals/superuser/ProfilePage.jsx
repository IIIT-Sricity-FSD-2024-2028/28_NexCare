import { useState } from 'react';
import { Auth } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SuPage } from './suShared';

export default function ProfilePage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  async function changePassword(e) {
    e.preventDefault();
    if (!pw.current || !pw.next) {
      return notify('Please fill in both current and new password fields', 'warning');
    }
    if (pw.next.length < 6) {
      return notify('New password must be at least 6 characters long', 'warning');
    }
    if (pw.next !== pw.confirm) {
      return notify('New password and confirm password do not match', 'warning');
    }

    setSaving(true);
    try {
      await Auth.changePassword(pw.current, pw.next);
      notify('Administrator password updated successfully', 'success');
      setPw({ current: '', next: '', confirm: '' });
    } catch (err) {
      notify(`Failed to update password: ${err?.message || 'Unknown error'}`, 'error');
    } finally {
      setSaving(false);
    }
  }

  const u = user || {};
  const nameStr = u.name || 'Super User';
  const joinedDate = u.createdAt
    ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  // Only what the account record actually holds — the seeded superuser has no
  // phone or createdAt, so those rows are left out rather than filled in.
  const profileFields = [
    ['Full Name', nameStr],
    ['Admin ID', u.id],
    ['Official Email', u.email],
    ['Contact Phone', u.phone],
    ['System Role', 'Super User'],
    ['Visibility', 'All regions & hospitals'],
    ['Account Status', u.status || 'Active'],
    ['Sign-in', 'Email + password (JWT session)'],
    ['Member Since', joinedDate],
  ].filter(([, value]) => value);

  const permissions = [
    { title: 'Hospital Network Onboarding', desc: 'Final review and verification of hospitals; auto-generates manager credentials' },
    { title: 'Regional Officer Assignment', desc: 'Assign a regional officer to each new hospital registration for review' },
    { title: 'User & Role Administration', desc: 'Create and update accounts for administrative staff, ambulance crews, regional officers and doctors, plus nurse directory records' },
    { title: 'Revenue & Pricing Controls', desc: 'Set platform fees, reprice hospital plans and Care+ tiers, and review the revenue ledger' },
    { title: 'System Settings & Audit Log', desc: 'Patient-registration and maintenance-mode switches, support email and ambulance hotline, and the activity log in Reports' },
  ];

  return (
    <SuPage className="su-page su-profile" title="Administrator Profile">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#101828' }}>System Administrator Profile</h1>
          <p style={{ margin: '6px 0 0', color: '#6A7282', fontSize: 14 }}>
            Your account details and password.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#DCFCE7', color: '#15803D', padding: '6px 14px', borderRadius: 9999, fontSize: 13, fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A' }}></span>
            {u.status || 'Active'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, marginBottom: 24 }}>
        {/* Profile Card */}
        <div className="table-card" style={{ padding: 24, margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #E5E7EB' }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}>
              {nameStr.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>{nameStr}</h2>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#2563EB', fontWeight: 600 }}>Super User</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {profileFields.map(([label, value]) => (
              <div key={label} style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 3 }}>
                  {label}
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0F172A', wordBreak: 'break-word' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Change Password Card */}
        <div className="table-card" style={{ padding: 24, margin: 0 }}>
          <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #E5E7EB' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Security &amp; Password</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6A7282' }}>Change your sign-in password</p>
          </div>

          <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Current Password <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter current password"
                value={pw.current}
                onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', fontSize: 13 }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                New Password <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="At least 6 characters"
                value={pw.next}
                onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', fontSize: 13 }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Confirm New Password <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="Re-enter new password"
                value={pw.confirm}
                onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', fontSize: 13 }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: 8,
                padding: '12px 20px',
                background: '#2563EB',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background 0.2s',
              }}
            >
              {saving ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Privileges Matrix Card */}
      <div className="table-card" style={{ padding: 24 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#111827' }}>System Administrative Scope</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {permissions.map((p, idx) => (
            <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ color: '#2563EB', fontSize: 16 }}>🛡️</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{p.title}</span>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: '#64748B', lineHeight: 1.45 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </SuPage>
  );
}
