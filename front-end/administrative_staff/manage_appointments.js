let appointments = [
    {id: 'APT001', patient: 'Sarah Johnson', patientId: 'PT2301', doctor: 'Dr. Robert Smith', dept: 'Cardiology', date: '2026-03-08', time: '09:00', status: 'Completed'},
    {id: 'APT002', patient: 'Michael Chen', patientId: 'PT2302', doctor: 'Dr. Emily Williams', dept: 'Orthopedics', date: '2026-03-08', time: '10:30', status: 'In Progress'},
    {id: 'APT003', patient: 'Emily Davis', patientId: 'PT2303', doctor: 'Dr. James Brown', dept: 'Neurology', date: '2026-03-08', time: '13:30', status: 'Waiting'},
    {id: 'APT004', patient: 'Robert Wilson', patientId: 'PT2304', doctor: 'Dr. Maria Martinez', dept: 'General Medicine', date: '2026-03-09', time: '09:00', status: 'Scheduled'}
];

function renderAppointments(data = appointments) {
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
        appointments = appointments.filter(a => a.id !== id);
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
    const apt = appointments.find(a => a.id === id);
    if(!apt) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Appointment';
    document.getElementById('apptId').value = apt.id;
    document.getElementById('patientName').value = apt.patient;
    document.getElementById('patientId').value = apt.patientId;
    document.getElementById('doctorName').value = apt.doctor;
    document.getElementById('deptName').value = apt.dept;
    document.getElementById('apptDate').value = apt.date;
    document.getElementById('apptTime').value = apt.time;
    document.getElementById('apptStatus').value = apt.status;
    
    document.getElementById('appointmentModal').classList.add('active');
}

function saveAppointment(e) {
    e.preventDefault();
    
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

    if (id) {
        // Edit
        const idx = appointments.findIndex(a => a.id === id);
        if (idx !== -1) {
            appointments[idx] = { id, patient: patientName, patientId, doctor: doctorName, dept: deptName, date: apptDate, time: apptTime, status: apptStatus };
        }
    } else {
        // Add
        const newId = 'APT' + String(Math.floor(Math.random() * 900) + 100);
        appointments.unshift({ id: newId, patient: patientName, patientId, doctor: doctorName, dept: deptName, date: apptDate, time: apptTime, status: apptStatus });
    }
    
    closeAppointmentModal();
    applyFilters();
}

function applyFilters() {
    const term = document.getElementById('searchTable').value.toLowerCase();
    const stat = document.getElementById('filterStatus').value;
    
    const filtered = appointments.filter(a => {
        const matchesTerm = a.patient.toLowerCase().includes(term) || a.patientId.toLowerCase().includes(term) || a.doctor.toLowerCase().includes(term) || a.id.toLowerCase().includes(term);
        const matchesStat = (stat === 'All' || a.status === stat);
        return matchesTerm && matchesStat;
    });
    
    renderAppointments(filtered);
}

document.addEventListener('DOMContentLoaded', () => {
    applyFilters();
    
    document.getElementById('searchTable').addEventListener('input', applyFilters);
    document.getElementById('filterStatus').addEventListener('change', applyFilters);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target == document.getElementById('appointmentModal')) {
            closeAppointmentModal();
        }
    });
});
