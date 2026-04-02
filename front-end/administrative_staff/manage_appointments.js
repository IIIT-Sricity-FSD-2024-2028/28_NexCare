let appointmentsCache = [];

function getAppointments() {
    if (!window.NexCareDB) return [];
    appointmentsCache = window.NexCareDB.getTable('appointments').map(a => ({
        id: a.id,
        patient: a.patientName || 'Unknown Patient',
        patientId: a.patientId || 'N/A',
        doctor: a.doctor || 'TBD',
        dept: a.department || 'General',
        date: a.dateLabel || 'Unscheduled',
        time: a.timeLabel || 'TBD',
        status: a.status || 'Pending'
    }));
    return appointmentsCache;
}

function renderAppointments(data = getAppointments()) {
    const tbody = document.getElementById('appointmentsTableBody');
    tbody.innerHTML = data.map(apt => `
        <tr>
            <td><strong>${apt.id}</strong></td>
            <td><div><strong style="color: #111827;">${apt.patient}</strong><br><small style="color:#6b7280;">${apt.patientId}</small></div></td>
            <td>${apt.doctor}</td>
            <td>${apt.dept}</td>
            <td><div><strong style="color: #111827;">${apt.date}</strong><br><small style="color:#6b7280;">${apt.time}</small></div></td>
            <td><span class="status-badge status-${apt.status.toLowerCase().replace(' ', '')}">${apt.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn" onclick="editAppt('${apt.id}')" title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="action-btn" onclick="deleteAppt('${apt.id}')" title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function deleteAppt(id) {
    if (confirm('Are you sure you want to delete appointment: ' + id + '?')) {
        const apt = getAppointments().find(a => a.id === id);
        const patientName = apt ? apt.patient : id;
        
        if(window.NexCareDB) window.NexCareDB.deleteRow('appointments', id);
        
        if (window.NexCareStore) {
            window.NexCareStore.logActivity('Delete', 'Appointments', `Cancelled appointment for ${patientName} (ID: ${id})`);
        }
        applyFilters();
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
    const apt = getAppointments().find(a => a.id === id);
    if(!apt) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Appointment';
    document.getElementById('apptId').value = apt.id;
    document.getElementById('patientName').value = apt.patient;
    document.getElementById('patientId').value = apt.patientId;
    document.getElementById('deptName').value = apt.dept;
    
    // Update doctor dropdown dynamically based on department
    updateDoctorsDropdown(apt.dept, apt.doctor);
    
    // Parse date for HTML5 Date Input
    let rawDate = apt.date;
    try {
        const d = new Date(apt.date);
        if(!isNaN(d)) {
            const yy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            rawDate = `${yy}-${mm}-${dd}`;
        }
    } catch(e) {}
    
    // Parse time for HTML5 Time Input
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

function saveAppointment(e) {
    e.preventDefault();
    if(!window.NexCareDB) { alert("Database offline"); return; }
    
    const id = document.getElementById('apptId').value;
    const patientName = document.getElementById('patientName').value.trim();
    const patientId = document.getElementById('patientId').value.trim();
    const doctorName = document.getElementById('doctorName').value.trim();
    const deptName = document.getElementById('deptName').value;
    const apptDate = document.getElementById('apptDate').value;
    const apptTime = document.getElementById('apptTime').value;
    const apptStatus = document.getElementById('apptStatus').value;
    
    if(!patientName || !patientId || !doctorName || !deptName || !apptDate || !apptTime) {
        alert("Please fill all required fields correctly.");
        return;
    }

    // Format Date beautifully
    let formattedDate = apptDate;
    if (apptDate) {
        const d = new Date(apptDate);
        if (!isNaN(d)) formattedDate = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    
    // Format Time beautifully
    let formattedTime = apptTime;
    if (apptTime && apptTime.includes(':')) {
        let [hh, mm] = apptTime.split(':');
        let h = parseInt(hh, 10);
        let ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        formattedTime = `${h}:${mm} ${ampm}`;
    }

    const payload = {
        patientName: patientName,
        patientId: patientId,
        doctor: doctorName,
        department: deptName,
        dateLabel: formattedDate || apptDate,
        timeLabel: formattedTime || apptTime,
        status: apptStatus
    };

    if (id) {
        window.NexCareDB.updateRow('appointments', id, payload);
        if (window.NexCareStore) {
            window.NexCareStore.logActivity('Update', 'Appointments', `Updated appointment status to ${apptStatus} for ${patientName} (Dr. ${doctorName})`);
        }
    } else {
        payload.id = window.NexCareDB.generateId("APT");
        payload.fee = 100;
        payload.createdAt = new Date().toISOString();
        window.NexCareDB.addRow('appointments', payload);
        
        if (window.NexCareStore) {
            window.NexCareStore.logActivity('Create', 'Appointments', `New appointment scheduled: ${patientName} with Dr. ${doctorName} (${deptName})`);
        }
    }
    
    closeAppointmentModal();
    applyFilters();
}

function applyFilters() {
    const term = document.getElementById('searchTable').value.toLowerCase();
    const stat = document.getElementById('filterStatus').value;
    
    const filtered = getAppointments().filter(a => {
        const matchesTerm = a.patient.toLowerCase().includes(term) || a.patientId.toLowerCase().includes(term) || a.doctor.toLowerCase().includes(term) || a.id.toLowerCase().includes(term);
        const matchesStat = (stat === 'All' || a.status === stat);
        return matchesTerm && matchesStat;
    });
    
    renderAppointments(filtered);
}

function updateDoctorsDropdown(selectedDept, selectedDoctor = null) {
    const doctorSelect = document.getElementById('doctorName');
    doctorSelect.innerHTML = '<option value="" disabled selected>Choosing doctor...</option>';
    if (!window.NexCareDB) return;

    const allUsers = window.NexCareDB.getTable('users');
    const doctors = allUsers.filter(u => u.role && u.role.toLowerCase() === 'doctor' && u.dept === selectedDept && u.status === 'Active');

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
}

document.addEventListener('DOMContentLoaded', () => {
    applyFilters();
    
    document.getElementById('searchTable').addEventListener('input', applyFilters);
    document.getElementById('filterStatus').addEventListener('change', applyFilters);

    document.getElementById('deptName').addEventListener('change', (e) => {
        updateDoctorsDropdown(e.target.value);
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target == document.getElementById('appointmentModal')) {
            closeAppointmentModal();
        }
    });
});
