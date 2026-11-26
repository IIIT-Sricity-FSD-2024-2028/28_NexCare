import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchStaffUsers,
  selectStaffUsers,
  fetchStaffAppointments,
  selectStaffAppointments,
  createStaffAppointment,
  editStaffAppointment,
  deleteStaffAppointment,
} from '../../store/staffSlice';
import { useNotify } from '../../hooks/useNotify';
import { errorMessage, useStaffActivity } from './staffData';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

// administrative_staff/manage_appointments.html + manage_appointments.js.
//
// Fixed on port: the HTML form could never save. It POSTed `patientName`
// (the ValidationPipe runs with forbidNonWhitelisted, so any key outside
// CreateAppointmentDto is a 400 — the backend resolves the name from
// patientId itself) and offered statuses ("Scheduled", "Waiting", "In
// Progress") that are not in the AppointmentStatus enum. The form now sends
// exactly the DTO's fields and the real statuses; the filter lists the same.
const STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'No Show'];
// The seed also carries legacy lowercase `scheduled` rows; they can be filtered, not saved.
const FILTER_STATUSES = ['Pending', 'Confirmed', 'Scheduled', 'Completed', 'Cancelled', 'No Show'];
const DEPARTMENTS = ['Cardiology', 'Orthopaedics', 'Paediatrics', 'Neurology', 'General Medicine', 'Dermatology', 'Emergency'];

const EMPTY_FORM = { id: '', patientName: '', patientId: '', doctor: '', dept: '', date: '', time: '', status: 'Pending' };

function toInputDate(label) {
  const d = new Date(label);
  if (Number.isNaN(d.getTime())) return label;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function toInputTime(label) {
  if (!label || !label.toLowerCase().includes('m')) return label;
  let [time, modifier] = label.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') hours = '00';
  if (modifier && modifier.toUpperCase() === 'PM') hours = parseInt(hours, 10) + 12;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
function toDateLabel(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
function toTimeLabel(value) {
  if (!value || !value.includes(':')) return value;
  const [hh, mm] = value.split(':');
  let h = parseInt(hh, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mm} ${ampm}`;
}

export default function ManageAppointmentsPage() {
  const notify = useNotify();
  const logActivity = useStaffActivity();
  const dispatch = useAppDispatch();
  const { list } = useAppSelector(selectStaffAppointments);
  const [term, setTerm] = useState('');
  const [status, setStatus] = useState('All');
  const [pendingDelete, setPendingDelete] = useState(null); // id whose row shows confirm/cancel
  const [fading, setFading] = useState(null);
  const [modal, setModal] = useState(null); // { title, form }
  const directory = useAppSelector(selectStaffUsers);
  const department = modal?.form.dept;
  const departments = [...new Set([...DEPARTMENTS, ...directory.list.filter((user) => user.role === 'doctor').map((user) => user.dept).filter(Boolean), department].filter(Boolean))];
  const doctors = {
    state: department ? directory.status : 'idle',
    list: directory.list.filter((u) => u.role?.toLowerCase() === 'doctor' && u.dept === department && u.status === 'Active'),
  };
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => list.map((a) => ({
    id: a.id,
    patient: a.patientName || 'Unknown Patient',
    patientId: a.patientId || 'N/A',
    doctor: a.doctor || 'TBD',
    dept: a.department || 'General',
    date: a.dateLabel || 'Unscheduled',
    time: a.timeLabel || 'TBD',
    status: a.status || 'Pending',
  })), [list]);

  const load = useCallback(
    () => dispatch(fetchStaffAppointments()).unwrap()
      .catch(() => notify('Failed to load appointments. Please check your connection and try again.', 'error')),
    [dispatch, notify],
  );

  useEffect(() => { load(); dispatch(fetchStaffUsers()); }, [dispatch, load]);

  const q = term.toLowerCase();
  const filtered = rows.filter((a) => {
    const matchesTerm = a.patient.toLowerCase().includes(q) || a.patientId.toLowerCase().includes(q) || a.doctor.toLowerCase().includes(q) || a.id.toLowerCase().includes(q);
    const matchesStatus = status === 'All' || a.status.toLowerCase() === status.toLowerCase();
    return matchesTerm && matchesStatus;
  });

  function openNew() {
    setModal({ title: 'New Appointment', form: { ...EMPTY_FORM } });
  }

  function openEdit(apt) {
    setModal({
      title: 'Edit Appointment',
      form: { id: apt.id, patientName: apt.patient, patientId: apt.patientId, doctor: apt.doctor, dept: apt.dept, date: toInputDate(apt.date), time: toInputTime(apt.time), status: apt.status },
    });
  }

  const setField = (k, v) => setModal((m) => ({ ...m, form: { ...m.form, [k]: v } }));

  async function save(e) {
    e.preventDefault();
    const f = modal.form;
    if (!f.patientName.trim() || !f.patientId.trim() || !f.doctor.trim() || !f.dept || !f.date || !f.time) {
      notify('Please fill all required fields correctly.', 'warning');
      return;
    }
    const selectedDoctor = doctors.list.find((doctor) => doctor.name === f.doctor);
    const payload = {
      doctorId: selectedDoctor?.id,
      department: f.dept,
      doctor: f.doctor.trim(),
      dateLabel: toDateLabel(f.date),
      timeLabel: toTimeLabel(f.time),
      status: f.status,
    };
    setSaving(true);
    try {
      if (f.id) {
        await dispatch(editStaffAppointment({ id: f.id, data: payload })).unwrap();
        logActivity('Update', 'Appointments', `Updated appointment to ${f.status} for ${f.patientName} (Dr. ${f.doctor})`);
      } else {
        await dispatch(createStaffAppointment({ ...payload, patientId: f.patientId.trim(), fee: 100 })).unwrap();
        logActivity('Create', 'Appointments', `New appointment: ${f.patientName} with Dr. ${f.doctor} (${f.dept})`);
      }
      setModal(null);
      await load();
    } catch (err) {
      console.error(err);
      notify(errorMessage(err, 'Failed to save appointment. Please try again.'), 'error');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(id) {
    setFading(id);
    setTimeout(async () => {
      try {
        await dispatch(deleteStaffAppointment(id)).unwrap();
        logActivity('Delete', 'Appointments', `Cancelled appointment (ID: ${id})`);
      } catch (err) {
        notify(errorMessage(err, 'Could not delete appointment'), 'error');
      }
      setFading(null);
      setPendingDelete(null);
      await load();
    }, 500);
  }

  return (
    <div className="sp-appointments">
      <div className="header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Manage Appointments</h1>
          <div className="sub">View, edit, and schedule patient appointments.</div>
        </div>
        <button type="button" className="btn-dark" onClick={openNew}>+ New Appointment</button>
      </div>

      <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
        <input type="text" id="searchTable" className="form-input" placeholder="Search by patient, ID, or doctor..." style={{ width: 300 }} value={term} onChange={(e) => setTerm(e.target.value)} />
        <select className="form-select" id="filterStatus" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="All">All Status</option>
          {FILTER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Appt ID</th><th>Patient Info</th><th>Doctor</th><th>Department</th><th>Date &amp; Time</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody id="appointmentsTableBody">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>No appointments found.</td></tr>
              ) : filtered.map((apt) => (
                <tr key={apt.id} id={`row-${apt.id}`} className={fading === apt.id ? 'row-fade-out' : undefined}>
                  <td><strong>{apt.id}</strong></td>
                  <td><div><strong style={{ color: '#111827' }}>{apt.patient}</strong><br /><small style={{ color: '#6b7280' }}>{apt.patientId}</small></div></td>
                  <td>{apt.doctor}</td>
                  <td>{apt.dept}</td>
                  <td><div><strong style={{ color: '#111827' }}>{apt.date}</strong><br /><small style={{ color: '#6b7280' }}>{apt.time}</small></div></td>
                  <td><span className={`status-badge status-${apt.status.toLowerCase().replace(' ', '')}`}>{apt.status}</span></td>
                  <td>
                    <div className="action-buttons">
                      {pendingDelete === apt.id ? (
                        <>
                          <button type="button" className="action-btn confirm" onClick={() => confirmDelete(apt.id)} title="Confirm Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          </button>
                          <button type="button" className="action-btn cancel" onClick={() => setPendingDelete(null)} title="Cancel">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="action-btn edit" onClick={() => openEdit(apt)} title="Edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                          <button type="button" className="action-btn delete" onClick={() => setPendingDelete(apt.id)} title="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal active" id="appointmentModal" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 id="modalTitle">{modal.title}</h2>
              <button type="button" className="modal-close" onClick={() => setModal(null)}>&times;</button>
            </div>
            <form id="appointmentForm" onSubmit={save}>
              <div className="form-group">
                <label>Patient Name &amp; ID</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input type="text" id="patientName" className="form-input" style={{ flex: 2 }} placeholder="Patient Name" required value={modal.form.patientName} onChange={(e) => setField('patientName', e.target.value)} />
                  <input type="text" id="patientId" className="form-input" style={{ flex: 1 }} placeholder="ID" required value={modal.form.patientId} onChange={(e) => setField('patientId', e.target.value)} readOnly={Boolean(modal.form.id)} />
                </div>
              </div>
              <div className="form-group">
                <label>Doctor</label>
                <select id="doctorName" className="form-select" required value={modal.form.doctor} onChange={(e) => setField('doctor', e.target.value)}>
                  {doctors.state === 'idle' && <option value="" disabled>Select Dept First</option>}
                  {doctors.state === 'loading' && <option value="" disabled>Loading doctors...</option>}
                  {doctors.state === 'error' && <option value="" disabled>Failed to load</option>}
                  {doctors.state === 'ready' && doctors.list.length === 0 && <option value="" disabled>No doctors available</option>}
                  {doctors.state === 'ready' && doctors.list.length > 0 && <option value="" disabled>Select Doctor</option>}
                  {doctors.list.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Department</label>
                <select id="deptName" className="form-select" required value={modal.form.dept} onChange={(e) => { setModal((m) => ({ ...m, form: { ...m.form, dept: e.target.value, doctor: '' } }));}}>
                  <option value="" disabled>Select Dept</option>
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Date &amp; Time</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input type="date" id="apptDate" className="form-input" required value={modal.form.date} onChange={(e) => setField('date', e.target.value)} />
                  <input type="time" id="apptTime" className="form-input" required value={modal.form.time} onChange={(e) => setField('time', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select id="apptStatus" className="form-select" value={modal.form.status} onChange={(e) => setField('status', e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn-light" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn-dark" disabled={saving}>Save Appointment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
