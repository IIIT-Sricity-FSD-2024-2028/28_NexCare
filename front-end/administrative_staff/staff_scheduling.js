const DEPTS = ['Cardiology', 'Orthopedics', 'Neurology', 'General Medicine', 'ER', 'Pathology'];
const SHIFTS = [
    { label: 'Morning (08:00 - 16:00)', startTime: '08:00', endTime: '16:00' },
    { label: 'Afternoon (14:00 - 22:00)', startTime: '14:00', endTime: '22:00' },
    { label: 'Night (20:00 - 08:00)', startTime: '20:00', endTime: '08:00' }
];

function currentUser() {
    try {
        return JSON.parse(sessionStorage.getItem('nexcare_user_data') || localStorage.getItem('nexcare_user_data') || '{}');
    } catch {
        return {};
    }
}

function hospitalId() {
    return currentUser().hospitalId || 'H001';
}

function apiGet(path) {
    if (window.NexCareAPI) return window.NexCareAPI.get(path);
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    const host = window.location.hostname || 'localhost';
    return fetch(`http://${host}:3001/api${path}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    }).then(r => r.json());
}

function apiPost(path, body) {
    if (window.NexCareAPI) return window.NexCareAPI.post(path, body);
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    const host = window.location.hostname || 'localhost';
    return fetch(`http://${host}:3001/api${path}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    }).then(r => r.json());
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
    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:20px;color:#6b7280;">${emptyText}</td></tr>`;
        return;
    }
    tbody.innerHTML = rows.map(s => `
        <tr>
            <td>${s.validFrom} – ${s.validTo}</td>
            <td>${slotsSummary(s.slots)}</td>
            <td>${statusBadge(s.status)}</td>
        </tr>
    `).join('');
}

async function loadSchedules() {
    const hid = hospitalId();
    const resp = await apiGet(`/schedules?hospitalId=${encodeURIComponent(hid)}`);
    const all = (resp && resp.data) || [];
    renderTable('publishedTableBody', all.filter(s => s.status === 'approved'), 'No published schedule yet. Submit a roster and wait for hospital manager approval.');
    renderTable('pendingTableBody', all.filter(s => s.status === 'pending'), 'No schedules waiting for approval.');
}

function addSlotRow(department, shiftLabel) {
    const wrap = document.getElementById('slotRows');
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
    document.getElementById('scheduleForm').reset();
    document.getElementById('slotRows').innerHTML = '';
    addSlotRow();
    document.getElementById('scheduleModal').classList.add('active');
}

function closeScheduleModal() {
    document.getElementById('scheduleModal').classList.remove('active');
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
    await loadSchedules();
}

document.addEventListener('DOMContentLoaded', () => {
    loadSchedules();
    window.addEventListener('click', function (event) {
        if (event.target === document.getElementById('scheduleModal')) closeScheduleModal();
    });
});
