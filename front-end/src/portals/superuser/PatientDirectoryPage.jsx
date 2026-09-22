import { useCallback, useEffect, useMemo, useState } from 'react';
import { Users } from '../../api';
import { useToast } from '../../context/ToastContext';
import useConfirm from '../../hooks/useConfirm';
import logActivity from '../../features/activity/logActivity';
import { ICONS, MessageRow, SuPage } from './suShared';

// superuser/patient-directory.html + patient-directory.js: every patient
// login account (`GET /users` filtered to role=patient), searchable, with a
// permanent delete of the account (`DELETE /users/:id`) behind a confirm.

function toRow(u) {
  return {
    id: u.patientId || u.id,
    patientIdDisplay: u.patientId || u.id,
    fullName: u.name,
    email: u.email,
    phone: u.phone || '-',
    status: u.status || 'Active',
    _userId: u.id, // keep original user ID for delete
  };
}

export default function PatientDirectoryPage() {
  const { notify } = useToast();
  const { ask, dialog } = useConfirm();
  const [patients, setPatients] = useState(null);
  const [term, setTerm] = useState('');

  const fetchPatients = useCallback(async () => {
    setPatients(null);
    try {
      const res = await Users.getAll();
      setPatients((res.data || []).filter((u) => u.role === 'patient').map(toRow));
    } catch (e) {
      console.error('Failed to fetch patients from API:', e);
      setPatients([]);
    }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const rows = useMemo(() => {
    const t = term.toLowerCase().trim();
    return (patients || []).filter((p) =>
      (p.fullName && p.fullName.toLowerCase().includes(t))
      || (p.email && p.email.toLowerCase().includes(t))
      || (p.patientIdDisplay && p.patientIdDisplay.toLowerCase().includes(t))
      || (p.id && p.id.toLowerCase().includes(t)));
  }, [patients, term]);

  async function deletePatient(p) {
    if (!(await ask('WARNING: Are you sure you want to permanently delete this patient from the NexCare records?', { title: 'Delete patient', confirmLabel: 'OK', danger: true }))) return;
    try {
      // Delete the user account (cascades patient records on backend)
      await Users.delete(p._userId);
      logActivity('Delete', 'Patient Directory', `Full deletion of patient: ${p.fullName} (ID: ${p.id})`);
    } catch (err) {
      console.error('Delete patient failed:', err);
      notify('Failed to delete patient. Please try again.', 'error');
      return;
    }
    fetchPatients();
  }

  return (
    <SuPage className="su-page su-patients" title="System Administrator Portal">
      <div className="page-header">
        <div>
          <h1>Patient Directory</h1>
          <p style={{ margin: '5px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>View and manage registered patients.</p>
        </div>
        <div className="action-row">
          <input type="text" id="searchInput" placeholder="Search Patients..." className="form-control" style={{ width: 250 }} value={term} onChange={(e) => setTerm(e.target.value)} />
        </div>
      </div>

      <div className="table-card">
        <table className="data-table" id="patientsTable">
          <thead>
            <tr>
              <th>Patient ID</th><th>Full Name</th><th>Email Address</th><th>Contact Phone</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody id="patientsTableBody">
            {patients === null ? (
              <MessageRow colSpan={6}>Loading patients…</MessageRow>
            ) : !rows.length ? (
              <MessageRow colSpan={6} padding={30}>No patients found.</MessageRow>
            ) : rows.map((p) => {
              const statusClass = p.status === 'Active' ? 'Active' : (p.status === 'Critical' ? 'Critical' : 'Registered');
              return (
                <tr key={p._userId}>
                  <td style={{ fontWeight: 500, color: '#111827' }}>{p.patientIdDisplay || p.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#e0e7ff', color: '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12 }}>
                        {p.fullName ? p.fullName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      {p.fullName || 'Unknown'}
                    </div>
                  </td>
                  <td>{p.email}</td>
                  <td>{p.phone || '-'}</td>
                  <td><span className={`badge ${statusClass}`}>{p.status || 'Registered'}</span></td>
                  <td>
                    <button type="button" className="btn-icon danger" onClick={() => deletePatient(p)} title="Delete Patient">{ICONS.trash}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {dialog}
    </SuPage>
  );
}
