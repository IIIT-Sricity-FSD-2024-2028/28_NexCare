import { useEffect, useState } from 'react';
import { Modal, StatusPill } from '../../components/ui';
import { Patients } from '../../api';
import { appointmentTime } from '../../utils/format';

const sectionStyle = { marginBottom: 20, padding: 16, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' };
const h4Style = { margin: '0 0 12px 0', fontSize: 14, color: '#334155', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 };

/**
 * Who the patient is (contact, insurance) and every appointment they have had
 * with this doctor. History is filtered from the list the page already holds —
 * no second round trip.
 */
export default function PatientInfoModal({ patientId, appointments, onClose }) {
  const fromAppointment = (appointments || []).find((a) => a.patientId === patientId);
  const [patient, setPatient] = useState(null);
  const [state, setState] = useState('idle'); // idle | loading | ok | error

  useEffect(() => {
    if (!patientId) return undefined;
    let cancelled = false;
    setState('loading');
    setPatient(null);
    Patients.byId(patientId)
      .then((res) => { if (!cancelled) { setPatient(res?.data || null); setState(res?.data ? 'ok' : 'error'); } })
      .catch(() => { if (!cancelled) setState('error'); });
    return () => { cancelled = true; };
  }, [patientId]);

  const history = (appointments || [])
    .filter((a) => a.patientId === patientId)
    .sort((a, b) => appointmentTime(b) - appointmentTime(a));

  const ins = patient?.insurance;

  return (
    <Modal open={!!patientId} onClose={onClose} title={patient?.fullName || patient?.name || fromAppointment?.patientName || 'Patient Information'} maxWidth={600}>
      <div style={sectionStyle}>
        <h4 style={h4Style}>Demographics &amp; Contact</h4>
        {state === 'loading' && <div>Loading…</div>}
        {state === 'error' && (
          <div style={{ fontSize: 13, color: '#475569' }}>
            <div><strong>Patient ID:</strong> {patientId}</div>
            <div style={{ marginTop: 6 }} className="muted">
              Contact details are held by the front desk — a doctor's account only sees the booking.
            </div>
          </div>
        )}
        {state === 'ok' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, color: '#475569' }}>
            <div><strong>Email:</strong> {patient.email || 'N/A'}</div>
            <div><strong>Phone:</strong> {patient.phone || 'N/A'}</div>
            <div><strong>Age:</strong> {patient.age || 'N/A'}</div>
            <div><strong>Blood Group:</strong> {patient.bloodGroup || 'N/A'}</div>
          </div>
        )}
      </div>

      <div style={sectionStyle}>
        <h4 style={h4Style}>Insurance Details</h4>
        {state === 'ok' && !ins && <div style={{ fontSize: 13, color: '#475569' }}>No insurance details on file.</div>}
        {state === 'ok' && ins && (
          <div style={{ fontSize: 13, color: '#475569' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <strong>Status:</strong>
              <span style={{ marginLeft: 4 }}>{ins.verificationStatus || 'Unknown'}</span>
              {ins.verificationStatus === 'mock_verified' && (
                <span style={{ display: 'inline-block', padding: '4px 8px', background: '#FEF3C7', color: '#D97706', borderRadius: 4, fontSize: 11, fontWeight: 700, marginLeft: 8 }}>
                  ⚠️ MOCK / PENDING REAL VERIFICATION
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><strong>Provider:</strong> {ins.provider || 'N/A'}</div>
              <div><strong>Policy #:</strong> {ins.policyNumber || 'N/A'}</div>
              <div><strong>Group #:</strong> {ins.groupNumber || 'N/A'}</div>
              <div><strong>Verified At:</strong> {ins.verifiedAt ? new Date(ins.verifiedAt).toLocaleString() : 'N/A'}</div>
            </div>
          </div>
        )}
        {state !== 'ok' && <div style={{ fontSize: 13, color: '#475569' }}>{state === 'loading' ? 'Loading…' : 'Not visible to a doctor account.'}</div>}
      </div>

      <div>
        <h4 style={h4Style}>Appointment History</h4>
        <table className="rev">
          <thead>
            <tr><th>Date</th><th>Time</th><th>Status</th></tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr><td colSpan={3} className="empty">No past records found.</td></tr>
            ) : history.map((a) => (
              <tr key={a.id}>
                <td>{a.dateLabel}</td>
                <td>{a.timeLabel}</td>
                <td><StatusPill status={a.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <button type="button" className="btn" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}
