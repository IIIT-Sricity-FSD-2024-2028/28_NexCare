import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '../../components/layout/Header';
import { Panel, StatusPill, EmptyRow, PageHeader } from '../../components/ui';
import AppointmentActions from '../../features/appointments/AppointmentActions';
import ReferPatientModal from '../../features/appointments/ReferPatientModal';
import PatientInfoModal from '../../features/appointments/PatientInfoModal';
import { useAppointmentActions } from '../../features/appointments/useAppointmentActions';
import { Appointments } from '../../api';
import { money, appointmentTime } from '../../utils/format';

const TABS = ['', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

// doctor/appointments.html + appointments.js.
//
// Fetched once and filtered in the browser: the list is per-doctor and small,
// and filtering locally keeps the status counts consistent while an action is
// in flight. `activeStatus` and `search` were module-level lets; now state.
export default function AppointmentsPage() {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStatus, setActiveStatus] = useState('');
  const [search, setSearch] = useState('');
  const [referTarget, setReferTarget] = useState(null);
  const [patientId, setPatientId] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await Appointments.mine();
      const list = Array.isArray(res?.data) ? res.data : [];
      setAll(list.sort((a, b) => appointmentTime(b) - appointmentTime(a)));
    } catch (err) {
      setError(err.message || 'Could not load your appointments. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const { act, busyId } = useAppointmentActions(load);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return all.filter((a) => {
      if (activeStatus && String(a.status).toLowerCase() !== activeStatus.toLowerCase()) return false;
      if (!term) return true;
      return `${a.patientName} ${a.reason} ${a.department}`.toLowerCase().includes(term);
    });
  }, [all, activeStatus, search]);

  return (
    <>
      <Header title="My Appointments" />
      <div className="page-body">
        <PageHeader
          title="My appointments"
          subtitle="Every slot booked with you. Confirm a request, or mark a consultation complete once the patient has been seen."
        >
          <input
            placeholder="Search patient or reason…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ height: 38, border: '1px solid #E5E7EB', borderRadius: 8, padding: '0 12px', fontSize: 13, minWidth: 240 }}
          />
        </PageHeader>

        <div className="tab-container">
          {TABS.map((s) => (
            <button key={s || 'all'} type="button" className={`tab-btn${activeStatus === s ? ' active' : ''}`} onClick={() => setActiveStatus(s)}>
              {s || 'All'}
            </button>
          ))}
        </div>

        <Panel title={activeStatus ? `${activeStatus} appointments` : 'All appointments'} hint={`${rows.length} of ${all.length}`} flush>
          <table className="rev">
            <thead>
              <tr>
                <th>Date</th><th>Time</th><th>Patient</th><th>Department</th>
                <th>Reason</th><th>Status</th><th className="num">Fee</th><th />
              </tr>
            </thead>
            <tbody>
              {error && <EmptyRow colSpan={8} error>{error}</EmptyRow>}
              {!error && loading && <EmptyRow colSpan={8}>Loading…</EmptyRow>}
              {!error && !loading && rows.length === 0 && <EmptyRow colSpan={8}>Nothing matches that filter.</EmptyRow>}
              {!error && rows.map((a) => (
                <tr key={a.id}>
                  <td>{a.dateLabel}</td>
                  <td>{a.timeLabel}</td>
                  <td>
                    <a href="#" onClick={(e) => { e.preventDefault(); setPatientId(a.patientId); }} style={{ color: '#2563EB', textDecoration: 'none' }}>
                      <strong>{a.patientName}</strong>
                    </a>
                    <br /><span className="muted">{a.patientId}</span>
                  </td>
                  <td>{a.department}</td>
                  <td className="muted">{a.reason || '—'}</td>
                  <td><StatusPill status={a.status} /></td>
                  <td className="num">{money(a.fee)}</td>
                  <td className="num" style={{ whiteSpace: 'nowrap' }}>
                    <AppointmentActions apt={a} onAct={act} onRefer={setReferTarget} busy={busyId === a.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <ReferPatientModal apt={referTarget} onClose={() => setReferTarget(null)} onCreated={load} />
      <PatientInfoModal patientId={patientId} appointments={all} onClose={() => setPatientId(null)} />
    </>
  );
}
