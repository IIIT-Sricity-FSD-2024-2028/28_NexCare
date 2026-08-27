/**
 * Doctor Portal JavaScript Logic
 */
let allAppointments = [];
let doctorProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
    initDoctorInfo();
    await loadAppointments();
    await loadLeaves();
});

function initDoctorInfo() {
    const rawUser = sessionStorage.getItem('nexcare_user_data') || localStorage.getItem('nexcare_user_data');
    if (rawUser) {
        try {
            doctorProfile = JSON.parse(rawUser);
            if (document.getElementById('doctorName')) document.getElementById('doctorName').textContent = doctorProfile.name || 'Dr. Sarah Smith';
            if (document.getElementById('doctorDept')) document.getElementById('doctorDept').textContent = doctorProfile.dept || doctorProfile.department || 'Cardiology';
            if (document.getElementById('doctorHospital')) document.getElementById('doctorHospital').textContent = `🏥 ${doctorProfile.hospitalName || doctorProfile.hospital || 'NexCare AIIMS Super Speciality Hospital'}`;
            
            const initials = (doctorProfile.name || 'DR')
                .replace('Dr. ', '')
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
            if (document.getElementById('doctorAvatar')) document.getElementById('doctorAvatar').textContent = initials || 'DR';
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

function switchTab(tabName, event) {
    if (event) event.preventDefault();
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active-tab'));
    
    if (tabName === 'appointments') {
        document.querySelector('a[href="#appointments"]').classList.add('active');
        document.getElementById('appointmentsTab').classList.add('active-tab');
        document.getElementById('pageTitle').textContent = 'My Patient Appointments';
        document.getElementById('pageSubtitle').textContent = 'Manage patient consultations and update status';
    } else if (tabName === 'leaves') {
        document.querySelector('a[href="#leaves"]').classList.add('active');
        document.getElementById('leavesTab').classList.add('active-tab');
        document.getElementById('pageTitle').textContent = 'Apply for Duty Leave';
        document.getElementById('pageSubtitle').textContent = 'Submit leave requests and check approval status';
    }
}

async function loadAppointments() {
    const tbody = document.getElementById('appointmentsTableBody');
    try {
        const response = await window.NexCareAPI.Appointments.getAll();
        if (response && response.success && Array.isArray(response.data)) {
            allAppointments = response.data;
            renderAppointments(allAppointments);
            updateStats();
        } else {
            tbody.innerHTML = '<tr><td colspan="8" class="loading-cell">No appointments found.</td></tr>';
        }
    } catch (err) {
        console.error('Failed to load appointments:', err);
        tbody.innerHTML = '<tr><td colspan="8" class="loading-cell" style="color:#ef4444;">Failed to load appointments. Make sure backend is running.</td></tr>';
    }
}

function renderAppointments(list) {
    const tbody = document.getElementById('appointmentsTableBody');
    if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading-cell">No matching appointments found.</td></tr>';
        return;
    }

    tbody.innerHTML = list.map(apt => {
        const dateStr = apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleString() : (apt.dateLabel || apt.date || 'N/A');
        const statusBadge = getStatusBadge(apt.status);
        const priorityBadge = apt.priority === 'Emergency' || apt.urgency === 'High' ? 
            '<span class="badge badge-rejected">High</span>' : 
            '<span class="badge badge-confirmed">Normal</span>';
        const hospName = escapeHtml(apt.hospitalName || apt.hospital || (doctorProfile && doctorProfile.hospitalName) || 'NexCare AIIMS Super Speciality Hospital');

        return `
            <tr>
                <td><strong>${escapeHtml(apt.emrToken || apt.token || apt.id)}</strong></td>
                <td>${escapeHtml(apt.patientName || apt.patientId || 'Patient')}</td>
                <td>${escapeHtml(apt.department || 'General')}</td>
                <td>🏥 ${hospName}</td>
                <td>${escapeHtml(dateStr)}</td>
                <td>${priorityBadge}</td>
                <td>${statusBadge}</td>
                <td>
                    ${apt.status !== 'COMPLETED' && apt.status !== 'Completed' ? `
                        <button onclick="completeAppointment('${apt.id}')" style="padding:4px 8px; font-size:12px; border-radius:4px; background:#10B981; color:#fff; border:none; cursor:pointer;">
                            Complete
                        </button>
                    ` : '<span style="color:#10B981; font-weight:600;">Completed</span>'}
                </td>
            </tr>
        `;
    }).join('');
}

function getStatusBadge(status) {
    const s = String(status || '').toUpperCase();
    if (s === 'CONFIRMED') return '<span class="badge badge-confirmed">Confirmed</span>';
    if (s === 'COMPLETED') return '<span class="badge badge-approved">Completed</span>';
    if (s === 'CANCELLED') return '<span class="badge badge-rejected">Cancelled</span>';
    return '<span class="badge badge-pending">Pending</span>';
}

function filterAppointments() {
    const query = document.getElementById('appointmentSearch').value.toLowerCase().trim();
    const statusVal = document.getElementById('statusFilter').value;

    const filtered = allAppointments.filter(apt => {
        const matchesQuery = !query || 
            (apt.emrToken && apt.emrToken.toLowerCase().includes(query)) ||
            (apt.patientName && apt.patientName.toLowerCase().includes(query)) ||
            (apt.id && apt.id.toLowerCase().includes(query));
        const matchesStatus = !statusVal || apt.status === statusVal;
        return matchesQuery && matchesStatus;
    });

    renderAppointments(filtered);
}

async function completeAppointment(id) {
    if (!confirm('Mark this appointment as completed?')) return;
    try {
        const response = await window.NexCareAPI.Appointments.update(id, { status: 'COMPLETED' });
        if (response && response.success) {
            alert('Appointment marked as COMPLETED.');
            await loadAppointments();
        } else {
            alert('Failed to update appointment: ' + (response.message || 'Error'));
        }
    } catch (err) {
        alert('Error completing appointment: ' + err.message);
    }
}

async function loadLeaves() {
    const tbody = document.getElementById('leavesTableBody');
    try {
        const doctorId = doctorProfile ? doctorProfile.id : null;
        const response = await window.NexCareAPI.Leaves.getAll(doctorId ? { doctorId } : {});
        if (response && response.success && Array.isArray(response.data)) {
            renderLeaves(response.data);
            document.getElementById('statLeaves').textContent = response.data.length;
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="loading-cell">No leave requests found.</td></tr>';
        }
    } catch (err) {
        console.error('Failed to load leaves:', err);
        tbody.innerHTML = '<tr><td colspan="4" class="loading-cell">No leave history found.</td></tr>';
    }
}

function renderLeaves(leaves) {
    const tbody = document.getElementById('leavesTableBody');
    if (!leaves || leaves.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading-cell">No leave requests submitted yet.</td></tr>';
        return;
    }

    tbody.innerHTML = leaves.map(l => {
        const statusBadge = l.status === 'APPROVED' ? '<span class="badge badge-approved">APPROVED</span>' :
            l.status === 'REJECTED' ? '<span class="badge badge-rejected">REJECTED</span>' :
            '<span class="badge badge-pending">PENDING</span>';
        
        const dates = `${l.startDate || ''} to ${l.endDate || ''}`;
        return `
            <tr>
                <td><strong>${l.leaveType || 'Casual Leave'}</strong></td>
                <td>${dates}</td>
                <td>${l.reason || 'N/A'}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    }).join('');
}

async function handleLeaveSubmit(event) {
    event.preventDefault();
    const btn = document.getElementById('submitLeaveBtn');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    const leaveType = document.getElementById('leaveType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const reason = document.getElementById('reason').value.trim();

    try {
        const payload = {
            doctorId: doctorProfile ? doctorProfile.id : 'D001',
            doctorName: doctorProfile ? doctorProfile.name : 'Dr. Sarah Smith',
            department: doctorProfile ? doctorProfile.dept : 'Cardiology',
            hospitalId: doctorProfile ? (doctorProfile.hospitalId || 'H001') : 'H001',
            leaveType,
            startDate,
            endDate,
            reason,
            status: 'PENDING'
        };

        const response = await window.NexCareAPI.Leaves.create(payload);
        if (response && response.success) {
            alert('Leave request submitted successfully!');
            document.getElementById('leaveForm').reset();
            await loadLeaves();
        } else {
            alert('Failed to submit leave request: ' + (response.message || 'Error'));
        }
    } catch (err) {
        console.error('Leave submission error:', err);
        alert('Leave submission error: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Submit Leave Request';
    }
}

function updateStats() {
    document.getElementById('statTotal').textContent = allAppointments.length;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = allAppointments.filter(a => {
        const dateStr = a.appointmentDate || a.date;
        return dateStr && String(dateStr).includes(todayStr);
    }).length;

    document.getElementById('statToday').textContent = todayCount;
}
