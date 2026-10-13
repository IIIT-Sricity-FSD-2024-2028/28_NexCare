// Staff Scheduling - Weekly Department Schedule with Leaves & Deletion Support
const DEPTS = ['Cardiology', 'Orthopedics', 'Neurology', 'General Medicine', 'ER', 'Pathology', 'Paediatrics', 'Dermatology', 'Gynaecology'];
const SHIFTS = [
    { label: 'Morning (08:00 - 16:00)', startTime: '08:00', endTime: '16:00' },
    { label: 'Afternoon (14:00 - 22:00)', startTime: '14:00', endTime: '22:00' },
    { label: 'Night (20:00 - 08:00)', startTime: '20:00', endTime: '08:00' }
];

const DEPT_ICONS = {
    'cardiology': '🫀',
    'orthopedics': '🦴',
    'orthopaedics': '🦴',
    'neurology': '🧠',
    'general medicine': '🩺',
    'er': '🚨',
    'emergency': '🚨',
    'emergency medicine': '🚨',
    'pathology': '🔬',
    'paediatrics': '👶',
    'pediatrics': '👶',
    'dermatology': '🧴',
    'gynaecology': '🤰',
    'gynecology': '🤰'
};

const DAYS_OF_WEEK = [
    { key: 'monday', label: 'Mon', shortName: 'Mon' },
    { key: 'tuesday', label: 'Tue', shortName: 'Tue' },
    { key: 'wednesday', label: 'Wed', shortName: 'Wed' },
    { key: 'thursday', label: 'Thu', shortName: 'Thu' },
    { key: 'friday', label: 'Fri', shortName: 'Fri' },
    { key: 'saturday', label: 'Sat', shortName: 'Sat' },
    { key: 'sunday', label: 'Sun', shortName: 'Sun' }
];

let currentWeekStartDate = getStartOfWeek(new Date(2026, 8, 1)); // Default around 01 Sep 2026
let expandedDepartments = new Set(['Cardiology', 'Orthopedics', 'Orthopaedics', 'Neurology', 'General Medicine']);
let cachedDoctors = [];
let cachedSchedules = [];
let cachedLeaves = [];

function currentUser() {
    try {
        return JSON.parse(sessionStorage.getItem('nexcare_user_data') || localStorage.getItem('nexcare_user_data') || '{}');
    } catch {
        return {};
    }
}

function hospitalId() {
    const hid = currentUser().hospitalId;
    if (!hid) {
        alert("Error: You are not assigned to a hospital.");
        return '';
    }
    return hid;
}

function apiGet(path) {
    return window.NexCareAPI.get(path);
}

async function apiPost(path, body) {
    return await window.NexCareAPI.post(path, body);
}

async function apiDelete(path) {
    return await window.NexCareAPI.delete(path);
}



// --- DATE HELPERS ---
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0 is Sunday, 1 is Monday...
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function formatDisplayDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

function formatShortDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    return `${day} ${month}`;
}

function formatYMD(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function normalizeDept(name) {
    if (!name) return '';
    const clean = name.trim().toLowerCase();
    if (clean === 'orthopaedics' || clean === 'orthopedics') return 'Orthopedics';
    if (clean === 'emergency' || clean === 'emergency medicine' || clean === 'er') return 'Emergency';
    if (clean === 'paediatrics' || clean === 'pediatrics') return 'Paediatrics';
    if (clean === 'gynaecology' || clean === 'gynecology') return 'Gynaecology';
    return name.trim();
}

function matchesDepartment(docDept, targetDept) {
    if (!docDept || !targetDept) return false;
    return normalizeDept(docDept).toLowerCase() === normalizeDept(targetDept).toLowerCase();
}

function getDeptIcon(deptName) {
    const key = (deptName || '').toLowerCase().trim();
    return DEPT_ICONS[key] || DEPT_ICONS[normalizeDept(deptName).toLowerCase()] || '🏥';
}

// --- WEEK NAVIGATION ---
function changeWeek(deltaWeeks) {
    currentWeekStartDate = addDays(currentWeekStartDate, deltaWeeks * 7);
    updateWeekDisplay();
    renderWeeklySchedule();
}

function updateWeekDisplay() {
    const weekEndDate = addDays(currentWeekStartDate, 6);
    const labelElem = document.getElementById('currentWeekRangeDisplay');
    if (labelElem) {
        labelElem.textContent = `${formatDisplayDate(currentWeekStartDate)} – ${formatDisplayDate(weekEndDate)}`;
    }
}

// --- WEEKLY SCHEDULE RENDERER ---
function renderWeeklySchedule() {
    const container = document.getElementById('weeklyScheduleContainer');
    if (!container) return;

    const hid = hospitalId();
    const weekStartStr = formatYMD(currentWeekStartDate);
    const weekEndStr = formatYMD(addDays(currentWeekStartDate, 6));

    // Find if an approved schedule covers this week
    const approvedSchedules = cachedSchedules.filter(s => s.status === 'approved' && s.hospitalId === hid);
    const isWeekCovered = approvedSchedules.some(s => s.validFrom <= weekEndStr && s.validTo >= weekStartStr);

    if (!isWeekCovered && approvedSchedules.length === 0) {
        container.innerHTML = `
            <div class="schedule-empty-state">
                <div style="font-size:32px; margin-bottom:8px;">📅</div>
                <strong style="font-size:16px; color:#1e293b;">No schedule published for this week.</strong>
                <p style="margin:8px 0 0; color:#64748b; font-size:13px;">Submit a hospital roster using "+ Submit Schedule" and await manager approval.</p>
            </div>
        `;
        return;
    }

    // Filter doctors strictly for logged-in admin's hospital
    const hospitalDoctors = cachedDoctors.filter(d => {
        const isDoc = (d.role || '').toLowerCase() === 'doctor';
        const isSameHospital = d.hospitalId === hid;
        return isDoc && isSameHospital;
    });

    // Determine list of departments to show
    const deptsSet = new Set();
    // 1. From hospital schedule slots
    approvedSchedules.forEach(s => {
        if (s.slots && Array.isArray(s.slots)) {
            s.slots.forEach(slot => {
                if (slot.department && slot.department !== 'All') {
                    deptsSet.add(normalizeDept(slot.department));
                }
            });
        }
    });
    // 2. From doctors' assigned departments
    hospitalDoctors.forEach(d => {
        if (d.dept || d.department) {
            deptsSet.add(normalizeDept(d.dept || d.department));
        }
    });
    // 3. Fallback standard list
    if (deptsSet.size === 0) {
        ['Cardiology', 'Orthopedics', 'Neurology', 'General Medicine', 'Emergency', 'Pathology'].forEach(d => deptsSet.add(d));
    }

    const deptList = Array.from(deptsSet);

    // Calculate dates for 7 days
    const weekDays = DAYS_OF_WEEK.map((day, idx) => {
        const d = addDays(currentWeekStartDate, idx);
        return {
            ...day,
            dateStr: formatShortDate(d),
            fullDateStr: formatYMD(d)
        };
    });

    let html = '<div class="department-schedule-list">';

    deptList.forEach(deptName => {
        const deptKey = deptName.replace(/[^a-zA-Z0-9]/g, '_');
        const isExpanded = expandedDepartments.has(deptName);
        const docsInDept = hospitalDoctors.filter(d => matchesDepartment(d.dept || d.department, deptName));
        const icon = getDeptIcon(deptName);

        html += `
            <div class="dept-accordion-card ${isExpanded ? 'expanded' : ''}" id="deptCard_${deptKey}">
                <div class="dept-accordion-header" onclick="toggleDepartment('${escapeHtml(deptName)}')">
                    <div class="dept-title-group">
                        <span class="dept-icon">${icon}</span>
                        <span class="dept-name">${escapeHtml(deptName)}</span>
                        <span class="dept-count-badge">${docsInDept.length} Doctor${docsInDept.length === 1 ? '' : 's'}</span>
                    </div>
                    <div class="dept-expand-indicator">
                        <span>${isExpanded ? '▲' : '▼'}</span>
                    </div>
                </div>
                <div class="dept-accordion-body" id="deptBody_${deptKey}" style="display: ${isExpanded ? 'block' : 'none'};">
                    ${renderDoctorWeekTable(docsInDept, weekDays)}
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function renderDoctorWeekTable(doctors, weekDays) {
    if (!doctors || doctors.length === 0) {
        return `<div class="dept-empty-message">No doctors assigned to this department.</div>`;
    }

    return `
        <div class="table-wrapper" style="overflow-x:auto;">
            <table class="schedule-week-table">
                <thead>
                    <tr>
                        <th style="min-width: 200px; text-align: left;">Doctor</th>
                        ${weekDays.map(w => `
                            <th>${w.shortName}<span class="col-date">${w.dateStr}</span></th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${doctors.map(doc => `
                        <tr>
                            <td class="doctor-meta-cell">
                                <div class="doc-name">${escapeHtml(doc.name)}</div>
                                <div class="doc-spec">${escapeHtml(doc.designation || doc.specialization || 'Specialist')}</div>
                            </td>
                            ${weekDays.map(w => `
                                <td>${renderDoctorDayTiming(doc, w.key, w.fullDateStr)}</td>
                            `).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderDoctorDayTiming(doctor, dayKey, dateStr) {
    // 1. Check if doctor is on APPROVED LEAVE for this date
    if (dateStr && cachedLeaves && cachedLeaves.length > 0) {
        const docId = doctor.id || doctor.employeeId;
        const docName = (doctor.name || '').toLowerCase().trim();
        const activeLeave = cachedLeaves.find(l => {
            const matchDoc = (l.doctorId && (l.doctorId === docId || l.doctorId === doctor.id)) ||
                             ((l.doctorName || '').toLowerCase().trim() === docName);
            const inRange = l.startDate <= dateStr && l.endDate >= dateStr;
            return matchDoc && inRange;
        });

        if (activeLeave) {
            const leaveLabel = activeLeave.leaveType || 'On Leave';
            return `<span class="leave-badge" title="Approved Leave: ${escapeHtml(leaveLabel)} (${escapeHtml(activeLeave.startDate)} to ${escapeHtml(activeLeave.endDate)}) - Not Available">🏖️ ON LEAVE</span>`;
        }
    }

    // 2. Check doctor.schedule object (e.g. { monday: { start: "08:00", end: "16:00" }, ... })
    const schedule = doctor.schedule || doctor.weeklySchedule;
    if (schedule && typeof schedule === 'object') {
        const dayEntry = schedule[dayKey] || schedule[dayKey.toLowerCase()];
        if (dayEntry) {
            if (typeof dayEntry === 'object' && dayEntry.start && dayEntry.end) {
                return `<span class="timing-badge">${dayEntry.start} - ${dayEntry.end}</span>`;
            }
            if (typeof dayEntry === 'string' && dayEntry.toUpperCase() !== 'OFF') {
                return `<span class="timing-badge">${dayEntry}</span>`;
            }
        }
        return `<span class="off-badge">OFF</span>`;
    }

    // 3. Fallback to consultationTiming if defined
    if (doctor.consultationTiming) {
        if (dayKey === 'sunday') {
            return `<span class="off-badge">OFF</span>`;
        }
        const cleanTiming = doctor.consultationTiming.replace(/\s*(AM|PM)/gi, '');
        return `<span class="timing-badge">${cleanTiming}</span>`;
    }

    // 4. Fallback default Mon-Fri 08:00 - 16:00, Sat/Sun OFF
    if (dayKey === 'saturday' || dayKey === 'sunday') {
        return `<span class="off-badge">OFF</span>`;
    }
    return `<span class="timing-badge">08:00 - 16:00</span>`;
}

function toggleDepartment(deptName) {
    if (expandedDepartments.has(deptName)) {
        expandedDepartments.delete(deptName);
    } else {
        expandedDepartments.add(deptName);
    }
    const deptKey = deptName.replace(/[^a-zA-Z0-9]/g, '_');
    const card = document.getElementById(`deptCard_${deptKey}`);
    const body = document.getElementById(`deptBody_${deptKey}`);
    if (card && body) {
        const isExp = expandedDepartments.has(deptName);
        card.classList.toggle('expanded', isExp);
        body.style.display = isExp ? 'block' : 'none';
        const ind = card.querySelector('.dept-expand-indicator span');
        if (ind) ind.textContent = isExp ? '▲' : '▼';
    }
}

// --- DATA FETCHING ---
async function loadSchedulesAndDoctors() {
    const hid = hospitalId();

    try {
        // 1. Fetch schedules for this hospital
        const schedResp = await apiGet(`/schedules?hospitalId=${encodeURIComponent(hid)}`);
        cachedSchedules = (schedResp && schedResp.data) || [];

        // 2. Fetch doctors for this hospital
        const usersResp = await apiGet(`/users?role=doctor&hospitalId=${encodeURIComponent(hid)}`);
        const userList = (usersResp && usersResp.data) ? usersResp.data : [];
        cachedDoctors = Array.isArray(userList) ? userList : [];

        if (cachedDoctors.length === 0) {
            const allUsersResp = await apiGet('/users');
            const allUsers = (allUsersResp && allUsersResp.data) ? allUsersResp.data : [];
            if (Array.isArray(allUsers)) {
                cachedDoctors = allUsers.filter(u => (u.role || '').toLowerCase() === 'doctor');
            }
        }

        // 3. Fetch approved leaves for this hospital
        const leavesResp = await apiGet(`/leaves?hospitalId=${encodeURIComponent(hid)}&status=approved`);
        const leavesList = (leavesResp && leavesResp.data) ? leavesResp.data : [];
        cachedLeaves = Array.isArray(leavesList) ? leavesList.filter(l => l.status === 'approved') : [];
    } catch (err) {
        console.error('Error fetching scheduling and leaves data:', err);
    }

    // Render the interactive Weekly Department Schedule
    updateWeekDisplay();
    renderWeeklySchedule();

    // Render Awaiting Approval table with Delete Action
    const pendingSchedules = cachedSchedules.filter(s => s.status === 'pending');
    renderTable('pendingTableBody', pendingSchedules, 'No schedules waiting for approval.');
}

function slotsSummary(slots) {
    if (!slots || !slots.length) return '—';
    return slots.map(s => `${s.department}: ${s.shift}`).join('; ');
}

function statusBadge(status) {
    const cls = status === 'approved' ? 'status-approved' : status === 'rejected' ? 'status-rejected' : 'status-pending';
    return `<span class="status-badge ${cls}">${(status || 'pending').toUpperCase()}</span>`;
}

function renderTable(tbodyId, rows, emptyText) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:#6b7280;">${emptyText}</td></tr>`;
        return;
    }
    tbody.innerHTML = rows.map(s => `
        <tr>
            <td>${escapeHtml(s.validFrom)} – ${escapeHtml(s.validTo)}</td>
            <td>${escapeHtml(slotsSummary(s.slots))}</td>
            <td>${statusBadge(s.status)}</td>
            <td style="text-align:right;">
                <button type="button" class="btn-delete-schedule" onclick="deleteSchedule('${escapeHtml(s.id)}')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// --- DELETE SCHEDULE ---
async function deleteSchedule(id) {
    if (!confirm(`Are you sure you want to delete schedule ${id}?`)) {
        return;
    }
    try {
        const resp = await apiDelete(`/schedules/${id}`);
        if (resp && resp.success) {
            alert('Schedule deleted successfully.');
            await loadSchedulesAndDoctors();
        } else {
            alert((resp && resp.message) || 'Failed to delete schedule.');
        }
    } catch (err) {
        console.error('Error deleting schedule:', err);
        alert('Error occurred while deleting schedule.');
    }
}

// --- SUBMIT SCHEDULE MODAL ---
function addSlotRow(department, shiftLabel) {
    const wrap = document.getElementById('slotRows');
    if (!wrap) return;
    const row = document.createElement('div');
    row.className = 'slot-row';
    const deptOpts = DEPTS.map(d => `<option value="${d}" ${d === department ? 'selected' : ''}>${d}</option>`).join('');
    const shiftOpts = SHIFTS.map(s => `<option value="${s.label}" ${s.label === shiftLabel ? 'selected' : ''}>${s.label}</option>`).join('');
    row.innerHTML = `
        <select class="form-select slot-dept">${deptOpts}</select>
        <select class="form-select slot-shift">${shiftOpts}</select>
        <button type="button" class="btn-light" onclick="this.parentElement.remove()">Remove</button>
    `;
    wrap.appendChild(row);
}

function openScheduleModal() {
    const form = document.getElementById('scheduleForm');
    if (form) form.reset();
    const rows = document.getElementById('slotRows');
    if (rows) rows.innerHTML = '';
    addSlotRow();
    const modal = document.getElementById('scheduleModal');
    if (modal) modal.classList.add('active');
}

function closeScheduleModal() {
    const modal = document.getElementById('scheduleModal');
    if (modal) modal.classList.remove('active');
}

async function submitSchedule(e) {
    e.preventDefault();
    const validFrom = document.getElementById('validFrom').value;
    const validTo = document.getElementById('validTo').value;
    const notes = document.getElementById('scheduleNotes').value.trim();
    const slots = [...document.querySelectorAll('#slotRows .slot-row')].map(row => {
        const shift = row.querySelector('.slot-shift').value;
        const meta = SHIFTS.find(s => s.label === shift) || SHIFTS[0];
        return {
            department: row.querySelector('.slot-dept').value,
            shift,
            startTime: meta.startTime,
            endTime: meta.endTime
        };
    });
    if (!slots.length) {
        alert('Add at least one department shift.');
        return;
    }
    const resp = await apiPost('/schedules', {
        hospitalId: hospitalId(),
        validFrom,
        validTo,
        slots,
        notes
    });
    if (!resp || !resp.success) {
        alert((resp && resp.message) || 'Failed to submit schedule.');
        return;
    }
    closeScheduleModal();
    await loadSchedulesAndDoctors();
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/[&<>"']/g, function (m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
}

function displayLoggedUser() {
    const user = currentUser();
    const nameElem = document.getElementById('displayUserName');
    if (nameElem && user.name) {
        nameElem.textContent = user.name;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    displayLoggedUser();
    loadSchedulesAndDoctors();
    window.addEventListener('click', function (event) {
        if (event.target === document.getElementById('scheduleModal')) closeScheduleModal();
    });
});
