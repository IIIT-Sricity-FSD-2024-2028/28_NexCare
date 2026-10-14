import { useCallback, useEffect, useMemo, useState } from 'react';
import { Leaves, Schedules, Users } from '../../api';
import { useToast } from '../../context/ToastContext';
import { errorMessage, useHospitalId } from './staffData';
import useConfirm from '../../hooks/useConfirm';

// administrative_staff/staff_scheduling.html + staff_scheduling.js: the
// weekly department accordion (doctors' saved rosters, approved leaves laid
// over them), the "awaiting approval" table and the submit-roster modal.

const DEPTS = ['Cardiology', 'Orthopedics', 'Neurology', 'General Medicine', 'ER', 'Pathology', 'Paediatrics', 'Dermatology', 'Gynaecology'];
const SHIFTS = [
  { label: 'Morning (08:00 - 16:00)', startTime: '08:00', endTime: '16:00' },
  { label: 'Afternoon (14:00 - 22:00)', startTime: '14:00', endTime: '22:00' },
  { label: 'Night (20:00 - 08:00)', startTime: '20:00', endTime: '08:00' },
];
const DEPT_ICONS = {
  cardiology: '🫀', orthopedics: '🦴', orthopaedics: '🦴', neurology: '🧠', 'general medicine': '🩺',
  er: '🚨', emergency: '🚨', 'emergency medicine': '🚨', pathology: '🔬', paediatrics: '👶', pediatrics: '👶',
  dermatology: '🧴', gynaecology: '🤰', gynecology: '🤰',
};
const DAYS_OF_WEEK = [
  { key: 'monday', shortName: 'Mon' }, { key: 'tuesday', shortName: 'Tue' }, { key: 'wednesday', shortName: 'Wed' },
  { key: 'thursday', shortName: 'Thu' }, { key: 'friday', shortName: 'Fri' }, { key: 'saturday', shortName: 'Sat' }, { key: 'sunday', shortName: 'Sun' },
];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}
const addDays = (date, days) => { const r = new Date(date); r.setDate(r.getDate() + days); return r; };
const pad = (n) => String(n).padStart(2, '0');
const formatDisplayDate = (d) => `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const formatShortDate = (d) => `${pad(d.getDate())} ${MONTHS[d.getMonth()]}`;
const formatYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function normalizeDept(name) {
  if (!name) return '';
  const clean = name.trim().toLowerCase();
  if (clean === 'orthopaedics' || clean === 'orthopedics') return 'Orthopedics';
  if (clean === 'emergency' || clean === 'emergency medicine' || clean === 'er') return 'Emergency';
  if (clean === 'paediatrics' || clean === 'pediatrics') return 'Paediatrics';
  if (clean === 'gynaecology' || clean === 'gynecology') return 'Gynaecology';
  return name.trim();
}
const matchesDepartment = (docDept, target) => Boolean(docDept && target) && normalizeDept(docDept).toLowerCase() === normalizeDept(target).toLowerCase();
const deptIcon = (name) => DEPT_ICONS[(name || '').toLowerCase().trim()] || DEPT_ICONS[normalizeDept(name).toLowerCase()] || '🏥';

/** One cell of the week table: approved leave first, then the saved roster, then the fallbacks. */
function DayTiming({ doctor, dayKey, dateStr, leaves }) {
  if (dateStr && leaves.length > 0) {
    const docId = doctor.id || doctor.employeeId;
    const docName = (doctor.name || '').toLowerCase().trim();
    const active = leaves.find((l) => {
      const matchDoc = (l.doctorId && (l.doctorId === docId || l.doctorId === doctor.id)) || ((l.doctorName || '').toLowerCase().trim() === docName);
      return matchDoc && l.startDate <= dateStr && l.endDate >= dateStr;
    });
    if (active) {
      return <span className="leave-badge" title={`Approved Leave: ${active.leaveType || 'On Leave'} (${active.startDate} to ${active.endDate}) - Not Available`}>🏖️ ON LEAVE</span>;
    }
  }
  const schedule = doctor.schedule || doctor.weeklySchedule;
  if (schedule && typeof schedule === 'object') {
    const entry = schedule[dayKey] || schedule[dayKey.toLowerCase()];
    if (entry) {
      if (typeof entry === 'object' && entry.start && entry.end) return <span className="timing-badge">{entry.start} - {entry.end}</span>;
      if (typeof entry === 'string' && entry.toUpperCase() !== 'OFF') return <span className="timing-badge">{entry}</span>;
    }
    return <span className="off-badge">OFF</span>;
  }
  if (doctor.consultationTiming) {
    if (dayKey === 'sunday') return <span className="off-badge">OFF</span>;
    return <span className="timing-badge">{doctor.consultationTiming.replace(/\s*(AM|PM)/gi, '')}</span>;
  }
  if (dayKey === 'saturday' || dayKey === 'sunday') return <span className="off-badge">OFF</span>;
  return <span className="timing-badge">08:00 - 16:00</span>;
}

export default function StaffSchedulingPage() {
  const hospitalId = useHospitalId();
  const { notify } = useToast();
  const { ask, dialog } = useConfirm();
  const [weekStart, setWeekStart] = useState(() => getStartOfWeek(new Date(2026, 8, 1))); // Default around 01 Sep 2026
  const [expanded, setExpanded] = useState(() => new Set(['Cardiology', 'Orthopedics', 'Orthopaedics', 'Neurology', 'General Medicine']));
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState(null); // { validFrom, validTo, notes, slots: [{department, shift}] }
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hospitalId) notify('Error: You are not assigned to a hospital.', 'error');
  }, [hospitalId, notify]);

  const load = useCallback(async () => {
    try {
      const schedResp = await Schedules.getAll({ hospitalId });
      setSchedules(schedResp.data || []);

      const usersResp = await Users.getAll({ role: 'doctor', hospitalId });
      let list = Array.isArray(usersResp.data) ? usersResp.data : [];
      if (list.length === 0) {
        const all = (await Users.getAll()).data;
        if (Array.isArray(all)) list = all.filter((u) => (u.role || '').toLowerCase() === 'doctor');
      }
      setDoctors(list);

      const leavesResp = await Leaves.getAll({ hospitalId, status: 'approved' });
      setLeaves((Array.isArray(leavesResp.data) ? leavesResp.data : []).filter((l) => l.status === 'approved'));
    } catch (err) {
      console.error('Error fetching scheduling and leaves data:', err);
    } finally {
      setLoaded(true);
    }
  }, [hospitalId]);

  useEffect(() => { load(); }, [load]);

  const weekEnd = addDays(weekStart, 6);
  const approved = useMemo(() => schedules.filter((s) => s.status === 'approved' && s.hospitalId === hospitalId), [schedules, hospitalId]);
  const pending = schedules.filter((s) => s.status === 'pending');
  const hospitalDoctors = useMemo(() => doctors.filter((d) => (d.role || '').toLowerCase() === 'doctor' && d.hospitalId === hospitalId), [doctors, hospitalId]);

  const deptList = useMemo(() => {
    const set = new Set();
    approved.forEach((s) => (s.slots || []).forEach((slot) => { if (slot.department && slot.department !== 'All') set.add(normalizeDept(slot.department)); }));
    hospitalDoctors.forEach((d) => { if (d.dept || d.department) set.add(normalizeDept(d.dept || d.department)); });
    if (set.size === 0) ['Cardiology', 'Orthopedics', 'Neurology', 'General Medicine', 'Emergency', 'Pathology'].forEach((d) => set.add(d));
    return Array.from(set);
  }, [approved, hospitalDoctors]);

  const weekDays = DAYS_OF_WEEK.map((day, idx) => {
    const d = addDays(weekStart, idx);
    return { ...day, dateStr: formatShortDate(d), fullDateStr: formatYMD(d) };
  });

  function toggleDepartment(name) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  async function deleteSchedule(id) {
    if (!(await ask(`Are you sure you want to delete schedule ${id}?`, { title: 'Delete schedule', confirmLabel: 'Delete', danger: true }))) return;
    try {
      await Schedules.delete(id);
      notify('Schedule deleted successfully.', 'success');
      await load();
    } catch (err) {
      console.error('Error deleting schedule:', err);
      notify(errorMessage(err, 'Error occurred while deleting schedule.'), 'error');
    }
  }

  const openModal = () => setModal({ validFrom: '', validTo: '', notes: '', slots: [{ department: DEPTS[0], shift: SHIFTS[0].label }] });
  const setSlot = (i, k, v) => setModal((m) => ({ ...m, slots: m.slots.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)) }));

  async function submitSchedule(e) {
    e.preventDefault();
    const slots = modal.slots.map((row) => {
      const meta = SHIFTS.find((s) => s.label === row.shift) || SHIFTS[0];
      return { department: row.department, shift: row.shift, startTime: meta.startTime, endTime: meta.endTime };
    });
    if (!slots.length) { notify('Add at least one department shift.', 'warning'); return; }
    setSubmitting(true);
    try {
      await Schedules.create({ hospitalId, validFrom: modal.validFrom, validTo: modal.validTo, slots, notes: modal.notes.trim() });
      setModal(null);
      await load();
    } catch (err) {
      notify(errorMessage(err, 'Failed to submit schedule.'), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const slotsSummary = (slots) => (slots && slots.length ? slots.map((s) => `${s.department}: ${s.shift}`).join('; ') : '—');
  const statusClass = (status) => (status === 'approved' ? 'status-approved' : status === 'rejected' ? 'status-rejected' : 'status-pending');

  const weekStartStr = formatYMD(weekStart);
  const weekEndStr = formatYMD(weekEnd);
  const isWeekCovered = approved.some((s) => s.validFrom <= weekEndStr && s.validTo >= weekStartStr);
  const showEmpty = loaded && !isWeekCovered && approved.length === 0;

  return (
    <div className="sp-scheduling">
      <div className="header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Hospital Scheduling</h1>
          <div className="sub">Propose one hospital-wide roster. It is shown only after the hospital manager approves it.</div>
        </div>
        <button type="button" className="btn-dark" onClick={openModal}>+ Submit Schedule</button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>Weekly Department Schedule</h2>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Click any department to expand available doctors and view their day-wise weekly working timings.</p>
          </div>
          <div className="week-selector-bar">
            <button type="button" className="btn-week-nav" onClick={() => setWeekStart((w) => addDays(w, -7))} title="Previous Week">&lt; Previous Week</button>
            <div className="week-label-display">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              <span id="currentWeekRangeDisplay">{formatDisplayDate(weekStart)} – {formatDisplayDate(weekEnd)}</span>
            </div>
            <button type="button" className="btn-week-nav" onClick={() => setWeekStart((w) => addDays(w, 7))} title="Next Week">Next Week &gt;</button>
          </div>
        </div>

        <div id="weeklyScheduleContainer" className="department-schedule-list">
          {!loaded ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#6b7280' }}>Loading weekly department schedule...</div>
          ) : showEmpty ? (
            <div className="schedule-empty-state">
              <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
              <strong style={{ fontSize: 16, color: '#1e293b' }}>No schedule published for this week.</strong>
              <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 13 }}>Submit a hospital roster using "+ Submit Schedule" and await manager approval.</p>
            </div>
          ) : deptList.map((deptName) => {
            const isExpanded = expanded.has(deptName);
            const docs = hospitalDoctors.filter((d) => matchesDepartment(d.dept || d.department, deptName));
            return (
              <div key={deptName} className={`dept-accordion-card${isExpanded ? ' expanded' : ''}`}>
                <div className="dept-accordion-header" onClick={() => toggleDepartment(deptName)}>
                  <div className="dept-title-group">
                    <span className="dept-icon">{deptIcon(deptName)}</span>
                    <span className="dept-name">{deptName}</span>
                    <span className="dept-count-badge">{docs.length} Doctor{docs.length === 1 ? '' : 's'}</span>
                  </div>
                  <div className="dept-expand-indicator"><span>{isExpanded ? '▲' : '▼'}</span></div>
                </div>
                <div className="dept-accordion-body" style={{ display: isExpanded ? 'block' : 'none' }}>
                  {docs.length === 0 ? (
                    <div className="dept-empty-message">No doctors assigned to this department.</div>
                  ) : (
                    <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                      <table className="schedule-week-table">
                        <thead>
                          <tr>
                            <th style={{ minWidth: 200, textAlign: 'left' }}>Doctor</th>
                            {weekDays.map((w) => <th key={w.key}>{w.shortName}<span className="col-date">{w.dateStr}</span></th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {docs.map((doc) => (
                            <tr key={doc.id}>
                              <td className="doctor-meta-cell">
                                <div className="doc-name">{doc.name}</div>
                                <div className="doc-spec">{doc.designation || doc.specialization || 'Specialist'}</div>
                              </td>
                              {weekDays.map((w) => (
                                <td key={w.key}><DayTiming doctor={doc} dayKey={w.key} dateStr={w.fullDateStr} leaves={leaves} /></td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 16, margin: '0 0 12px' }}>Awaiting approval</h2>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Valid</th><th>Departments &amp; shifts</th><th>Status</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
            <tbody id="pendingTableBody">
              {pending.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>No schedules waiting for approval.</td></tr>
              ) : pending.map((s) => (
                <tr key={s.id}>
                  <td>{s.validFrom} – {s.validTo}</td>
                  <td>{slotsSummary(s.slots)}</td>
                  <td><span className={`status-badge ${statusClass(s.status)}`}>{(s.status || 'pending').toUpperCase()}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button type="button" className="btn-delete-schedule" onClick={() => deleteSchedule(s.id)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal active" id="scheduleModal" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Submit hospital schedule</h2>
              <button type="button" className="modal-close" onClick={() => setModal(null)}>&times;</button>
            </div>
            <form id="scheduleForm" onSubmit={submitSchedule}>
              <div className="form-group">
                <label>Valid from</label>
                <input type="date" id="validFrom" className="form-input" required value={modal.validFrom} onChange={(e) => setModal({ ...modal, validFrom: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Valid to</label>
                <input type="date" id="validTo" className="form-input" required value={modal.validTo} onChange={(e) => setModal({ ...modal, validTo: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Department shifts</label>
                <div id="slotRows">
                  {modal.slots.map((row, i) => (
                    <div className="slot-row" key={i}>
                      <select className="form-select slot-dept" value={row.department} onChange={(e) => setSlot(i, 'department', e.target.value)}>
                        {DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select className="form-select slot-shift" value={row.shift} onChange={(e) => setSlot(i, 'shift', e.target.value)}>
                        {SHIFTS.map((s) => <option key={s.label} value={s.label}>{s.label}</option>)}
                      </select>
                      <button type="button" className="btn-light" onClick={() => setModal({ ...modal, slots: modal.slots.filter((_, idx) => idx !== i) })}>Remove</button>
                    </div>
                  ))}
                </div>
                <button type="button" className="btn-light" onClick={() => setModal({ ...modal, slots: [...modal.slots, { department: DEPTS[0], shift: SHIFTS[0].label }] })}>+ Add department shift</button>
              </div>
              <div className="form-group">
                <label>Notes (optional)</label>
                <input type="text" id="scheduleNotes" className="form-input" placeholder="e.g. Festival week coverage" value={modal.notes} onChange={(e) => setModal({ ...modal, notes: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn-light" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn-dark" disabled={submitting}>Send for approval</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {dialog}
    </div>
  );
}
