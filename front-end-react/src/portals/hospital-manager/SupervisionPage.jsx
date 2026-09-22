import { useEffect, useState } from 'react';
import { Users } from '../../api';
import { useHm } from './HmContext';
import { initialsOf } from './hmShared';

// TAB 6 — Administrative Staff Supervision: loadSupervision(), one card per
// administrative_staff user of this hospital with their responsibilities.
const DEFAULT_RESPS = ['Bed Allocation & Patient Check-in', 'Inventory Requisition & Tracking', 'Billing & Discharge Administration'];

export default function SupervisionPage() {
  const { hospitalId, version } = useHm();
  const [staff, setStaff] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Users.getAll()
      .then((res) => {
        if (cancelled) return;
        const users = Array.isArray(res.data) ? res.data : [];
        setStaff(users.filter((u) => u.role === 'administrative_staff' && u.hospitalId === hospitalId));
      })
      .catch((e) => { console.error('Error loading staff:', e); if (!cancelled) setStaff([]); });
    return () => { cancelled = true; };
  }, [hospitalId, version]);

  return (
    <div className="card">
      <div className="card-header">
        <h2>Administrative Staff Supervision & Responsibilities</h2>
        <span className="card-subtitle">Assigned responsibilities and front-desk operation tracking</span>
      </div>
      <div className="admin-supervision-grid">
        {staff === null && <p className="loading-cell">Loading administrative staff...</p>}
        {staff && staff.length === 0 && <p className="loading-cell">No administrative staff members found for this hospital.</p>}
        {(staff || []).map((s) => {
          const resps = Array.isArray(s.responsibilities) ? s.responsibilities : DEFAULT_RESPS;
          return (
            <div key={s.id} className="admin-card">
              <div className="admin-card-header">
                <div className="admin-avatar">{initialsOf(s.name)}</div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{s.name}</h4>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{s.designation || 'Operations Lead'} • {s.employeeId || s.id}</div>
                  <div style={{ fontSize: 12, color: '#2563EB' }}>{s.email}</div>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: 6, display: 'block' }}>Supervised Responsibilities</label>
                <div className="resp-tags-container">{resps.map((r) => <span key={r} className="resp-tag">✓ {r}</span>)}</div>
              </div>
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#64748B' }}>
                <span>Status: <strong className="text-success">{s.status || 'Active'}</strong></span>
                <span>Joined: {s.joiningDate || '2024-01-15'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
