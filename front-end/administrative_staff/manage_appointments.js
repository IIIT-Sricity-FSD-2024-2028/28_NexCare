// ---------------- API HELPER ----------------
function apiGet(path) {
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    const host = window.location.hostname || 'localhost';
    return fetch(`http://${host}:3001/api${path}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    }).then(r => r.json());
}

function apiRequest(method, path, body) {
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    const host = window.location.hostname || 'localhost';
    return fetch(`http://${host}:3001/api${path}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
    }).then(r => r.json());
}

// ---------------- STATE ----------------
let appointmentsCache = [];

async function loadAppointments() {
    try {
        const resp = await apiGet('/appointments');
        return (resp.data || []).map(a => ({
            id: a.id,
            patient: a.patientName || 'Unknown Patient',
            patientId: a.patientId || 'N/A',
            doctor: a.doctor || 'TBD',
            dept: a.department || 'General',
            date: a.dateLabel || 'Unscheduled',
            time: a.timeLabel || 'TBD',
            status: a.status || 'Pending'
        }));
    } catch (err) {
        console.error('Failed to load appointments:', err);
        alert('Failed to load appointments. Please check your connection and try again.');
        return [];
    }
}

async function renderAppointments(data) {
    if (!data) data = await loadAppointments();
    appointmentsCache = data;
    const tbody = document.getElementById('appointmentsTableBody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#6b7280;">No appointments found.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(apt => `
        <tr id="row-${apt.id}">
            <td><strong>${apt.id}</strong></td>
            <td><div><strong style="color: #111827;">${apt.patient}</strong><br><small style="color:#6b7280;">${apt.patientId}</small></div></td>
            <td>${apt.doctor}</td>
            <td>${apt.dept}</td>
            <td><div><strong style="color: #111827;">${apt.date}</strong><br><small style="color:#6b7280;">${apt.time}</small></div></td>
            <td><span class="status-badge status-${apt.status.toLowerCase().replace(' ', '')}">${apt.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editAppt('${apt.id}')" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="action-btn delete" onclick="deleteAppt('${apt.id}')" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function deleteAppt(id) {
    const row = document.getElementById(`row-${id}`);
    if (row) {
        const actionBtnContainer = row.querySelector('.action-buttons');
        if (actionBtnContainer) {
            actionBtnContainer.setAttribute('data-original-html', actionBtnContainer.innerHTML);
            actionBtnContainer.innerHTML = `
                <button class="action-btn confirm" onclick="confirmDelete('${id}')" title="Confirm Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </button>
                <button class="action-btn cancel" onclick="cancelDelete('${id}')" title="Cancel">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            `;
        }
    }
}

async function confirmDelete(id) {
    const row = document.getElementById(`row-${id}`);
    if (row) {
        row.classList.add('row-fade-out');
        setTimeout(async () => {
            try {
                await apiRequest('DELETE', `/appointments/${id}`);
                if (window.NexCareStore) {
                    window.NexCareStore.logActivity('Delete', 'Appointments', `Cancelled appointment (ID: ${id})`);
                }
            } catch (err) {
                console.error('Delete appointment failed:', err);
            }
            applyFilters();
        }, 500);
    }
}

function cancelDelete(id) {
    const row = document.getElementById(`row-${id}`);
    if (row) {
        const actionBtnContainer = row.querySelector('.action-buttons');
        const originalHtml = actionBtnContainer.getAttribute('data-original-html');
        if (originalHtml) {
            actionBtnContainer.innerHTML = originalHtml;
        } else {
            applyFilters();
        }
    }
}

function openAppointmentModal() {
    document.getElementById('appointmentForm').reset();
    document.getElementById('apptId').value = '';
    document.getElementById('modalTitle').textContent = 'New Appointment';
    document.getElementById('appointmentModal').classList.add('active');
}

function closeAppointmentModal() {
    document.getElementById('appointmentModal').classList.remove('active');
}

function editAppt(id) {
    const apt = appointmentsCache.find(a => a.id === id);
    if (!apt) return;

    document.getElementById('modalTitle').textContent = 'Edit Appointment';
    document.getElementById('apptId').value = apt.id;
    document.getElementById('patientName').value = apt.patient;
    document.getElementById('patientId').value = apt.patientId;
    document.getElementById('deptName').value = apt.dept;

    updateDoctorsDropdown(apt.dept, apt.doctor);

    let rawDate = apt.date;
    try {
        const d = new Date(apt.date);
        if (!isNaN(d)) {
            const yy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            rawDate = `${yy}-${mm}-${dd}`;
        }
    } catch (e) {}

    let rawTime = apt.time;
    if (apt.time && apt.time.toLowerCase().includes('m')) {
        let [time, modifier] = apt.time.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') { hours = '00'; }
        if (modifier && modifier.toUpperCase() === 'PM') { hours = parseInt(hours, 10) + 12; }
        hours = String(hours).padStart(2, '0');
        minutes = String(minutes).padStart(2, '0');
        rawTime = `${hours}:${minutes}`;
    }

    document.getElementById('apptDate').value = rawDate;
    document.getElementById('apptTime').value = rawTime;
    document.getElementById('apptStatus').value = apt.status;

    document.getElementById('appointmentModal').classList.add('active');
}

async function saveAppointment(e) {
    e.preventDefault();

    const id = document.getElementById('apptId').value;
    const patientName = document.getElementById('patientName').value.trim();
    const patientId = document.getElementById('patientId').value.trim();
    const doctorName = document.getElementById('doctorName').value.trim();
    const deptName = document.getElementById('deptName').value;
    const apptDate = document.getElementById('apptDate').value;
    const apptTime = document.getElementById('apptTime').value;
    const apptStatus = document.getElementById('apptStatus').value;

    if (!patientName || !patientId || !doctorName || !deptName || !apptDate || !apptTime) {
        alert("Please fill all required fields correctly.");
        return;
    }

    let formattedDate = apptDate;
    if (apptDate) {
        const d = new Date(apptDate);
        if (!isNaN(d)) formattedDate = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    let formattedTime = apptTime;
    if (apptTime && apptTime.includes(':')) {
        let [hh, mm] = apptTime.split(':');
        let h = parseInt(hh, 10);
        let ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        formattedTime = `${h}:${mm} ${ampm}`;
    }

    const payload = {
        patientName,
        patientId,
        doctor: doctorName,
        department: deptName,
        dateLabel: formattedDate || apptDate,
        timeLabel: formattedTime || apptTime,
        status: apptStatus
    };

    try {
        if (id) {
            await apiRequest('PUT', `/appointments/${id}`, payload);
            if (window.NexCareStore) {
                window.NexCareStore.logActivity('Update', 'Appointments', `Updated appointment to ${apptStatus} for ${patientName} (Dr. ${doctorName})`);
            }
        } else {
            payload.fee = 100;
            await apiRequest('POST', '/appointments', payload);
            if (window.NexCareStore) {
                window.NexCareStore.logActivity('Create', 'Appointments', `New appointment: ${patientName} with Dr. ${doctorName} (${deptName})`);
            }
        }
    } catch (err) {
        alert('Failed to save appointment. Please try again.');
        console.error(err);
        return;
    }

    closeAppointmentModal();
    applyFilters();
}

async function applyFilters() {
    const term = document.getElementById('searchTable').value.toLowerCase();
    const stat = document.getElementById('filterStatus').value;

    const all = await loadAppointments();
    const filtered = all.filter(a => {
        const matchesTerm = a.patient.toLowerCase().includes(term) || a.patientId.toLowerCase().includes(term) || a.doctor.toLowerCase().includes(term) || a.id.toLowerCase().includes(term);
        const matchesStat = (stat === 'All' || a.status === stat);
        return matchesTerm && matchesStat;
    });

    renderAppointments(filtered);
}

async function updateDoctorsDropdown(selectedDept, selectedDoctor = null) {
    const doctorSelect = document.getElementById('doctorName');
    doctorSelect.innerHTML = '<option value="" disabled selected>Loading doctors...</option>';

    try {
        const resp = await apiGet('/users');
        const users = resp.data || [];
        const doctors = users.filter(u => u.role && u.role.toLowerCase() === 'doctor' && u.dept === selectedDept && u.status === 'Active');

        if (doctors.length === 0) {
            doctorSelect.innerHTML = '<option value="" disabled selected>No doctors available</option>';
            return;
        }

        doctorSelect.innerHTML = '<option value="" disabled selected>Select Doctor</option>' + doctors.map(d =>
            `<option value="${d.name}">${d.name}</option>`
        ).join('');

        if (selectedDoctor) {
            doctorSelect.value = selectedDoctor;
        }
    } catch (err) {
        doctorSelect.innerHTML = '<option value="" disabled selected>Failed to load</option>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    applyFilters();

    document.getElementById('searchTable').addEventListener('input', applyFilters);
    document.getElementById('filterStatus').addEventListener('change', applyFilters);

    document.getElementById('deptName').addEventListener('change', (e) => {
        updateDoctorsDropdown(e.target.value);
    });

    window.addEventListener('click', function (event) {
        if (event.target == document.getElementById('appointmentModal')) {
            closeAppointmentModal();
        }
    });
});
