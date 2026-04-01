const fs = require('fs');

const getLayout = (title, activeMenu, content) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Hospital Management System - ${title}</title>
    <meta name="description" content="Hospital Management System - ${title}">
    
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="logo.css">
    <script defer src="logo.js"></script>
    <style>
        /* Specific Styles */
        .checkin-card {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
        }
        .form-input, .form-select {
            height: 38px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 4px 12px;
            font-size: 13px;
        }
        .btn-dark {
            height: 38px;
            background: #0a0a0a;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 20px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            white-space: nowrap;
        }
        .btn-dark:hover { background: #1a1a1a; }
        
        .status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
        }
        .status-consultation { background: #dbeafe; color: #1e40af; }
        .status-er { background: #fee2e2; color: #991b1b; }
        .status-pharmacy { background: #dcfce7; color: #166534; }
        .status-waiting { background: #fef3c7; color: #92400e; }
        .update-btn {
            padding: 6px 12px;
            background: white; border: 1px solid #e5e7eb;
            border-radius: 6px; font-size: 12px; cursor: pointer;
        }
        .update-btn:hover { background: #f9fafb; }
        .movement-timeline { display: flex; align-items: center; gap: 16px; margin-top: 10px; }
        .movement-step { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .step-icon { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .step-icon.completed { background: #dcfce7; color: #16a34a; }
        .step-icon.waiting { background: #dbeafe; color: #2563eb; }
        .step-label { font-size: 11px; color: #374151; }
        .step-time { font-size: 10px; color: #9ca3af; }
        
        /* Table / Modal specific */
        .table-wrapper { overflow-y: auto; max-height: 500px; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th, td { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
        th { background: #f9fafb; color: #6b7280; font-weight: 600; text-transform: uppercase; font-size: 11px; }
        tr:hover { background: #f9fafb; }
        .action-buttons { display: flex; gap: 8px; }
        .action-btn { width: 32px; height: 32px; border: 1px solid #e5e7eb; background: white; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .action-btn:hover { background: #f9fafb; }
    </style>
</head>
<body>
<div class="layout">
    <!-- SIDEBAR -->
    <div class="sidebar">
        <nex-care-logo></nex-care-logo>
        <ul class="menu">
            <li class="${activeMenu === 'Dashboard' ? 'active' : ''}">
                <a href="dashboard.html">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    Dashboard
                </a>
            </li>
            <li class="${activeMenu === 'Checkin' ? 'active' : ''}">
                <a href="patient_checkin.html">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-8 0v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                    Patient Check-in
                </a>
            </li>
            <li class="${activeMenu === 'Appointments' ? 'active' : ''}">
                <a href="manage_appointments.html">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Manage Appointments
                </a>
            </li>
            <li class="${activeMenu === 'Bed' ? 'active' : ''}">
                <a href="bed-allocation.html">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="10" width="18" height="5" rx="1"/><rect x="4" y="7" width="4" height="3" rx="1"/><line x1="3" y1="7" x2="3" y2="15"/><line x1="21" y1="10" x2="21" y2="15"/></svg>
                    Bed Allocation
                </a>
            </li>
            <li class="${activeMenu === 'Inventory' ? 'active' : ''}">
                <a href="inventory.html">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3 8 12 13 21 8"/></svg>
                    Inventory
                </a>
            </li>
            <li class="${activeMenu === 'Staff' ? 'active' : ''}">
                <a href="staff_scheduling.html">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="4"/><path d="M17 11a4 4 0 1 0-4-4"/><path d="M3 21v-2a4 4 0 0 1 6-3.46"/><path d="M16 21v-2a4 4 0 0 0-3-3.87"/></svg>
                    Staff Scheduling
                </a>
            </li>
            <li class="${activeMenu === 'Bill' ? 'active' : ''}">
                <a href="generate-bill.html">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V8z"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="9" x2="8" y2="9"/></svg>
                    Generate Bill
                </a>
            </li>
            <li class="${activeMenu === 'Feedback' ? 'active' : ''}">
                <a href="feedback.html">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>
                    Feedback
                </a>
            </li>
        </ul>
        <div class="logout">
            <button type="button" class="logout-btn">
                <svg class="logout-icon" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 17l5-5-5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12H9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                <span>Logout</span>
            </button>
        </div>
    </div>
    
    <!-- MAIN -->
    <div class="main">
        <div class="topbar">
            <div class="user">Admin User</div>
        </div>
${content}
    </div>
</div>
${activeMenu === 'Checkin' ? '<script src="patient_checkin.js"></script>' : ''}
${activeMenu === 'Appointments' ? '<script src="manage_appointments.js"></script>' : ''}
${activeMenu === 'Staff' ? '<script src="staff_scheduling.js"></script>' : ''}
${activeMenu === 'Feedback' ? '<script src="feedback.js"></script>' : ''}
</body>
</html>`;

const checkinContent = `
        <div class="header-row">
            <div>
                <h1>Patient Check-in & Movement Tracking</h1>
                <div class="sub">Manage quick check-ins and track patient locations within the facility.</div>
            </div>
        </div>

        <div class="card" style="margin-bottom: 20px;">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-8 0v2"/><circle cx="12" cy="7" r="4"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                Quick Check-in
            </div>
            <div class="checkin-card">
                <input type="text" id="patientIdInput" class="form-input" placeholder="Enter Patient ID or Name" style="width: 250px;">
                <input type="text" id="visitPurposeInput" class="form-input" placeholder="Visit Purpose" style="width: 200px;">
                <button class="btn-dark" onclick="handleCheckin()">Check-in Patient</button>
            </div>
        </div>

        <div class="card">
            <h3 style="margin-bottom: 15px;">Patients in Facility</h3>
            <div id="patientsContainer"></div>
        </div>
`;

const checkinJs = \`
const defaultPatients = [
    {
        name: "Sarah Johnson", id: "PT2355", status: "In Consultation", statusClass: "status-consultation",
        time: "09:00 AM", location: "Cardiology - Room 201",
        history: [{label: "Reception", time: "08:15 AM", state: "completed"}, {label: "Waiting Area", time: "08:50 AM", state: "completed"}, {label: "Cardiology - R201", time: "09:10 AM", state: "waiting"}]
    },
    {
        name: "Michael Chen", id: "PT2365", status: "In ER", statusClass: "status-er",
        time: "10:15 AM", location: "X-Ray Lab",
        history: [{label: "Reception", time: "10:07 AM", state: "completed"}, {label: "Waiting Area", time: "10:15 AM", state: "completed"}, {label: "Registration", time: "10:20 AM", state: "completed"}, {label: "X-Ray Lab", time: "10:30 AM", state: "waiting"}]
    }
];

function renderPatients() {
    const container = document.getElementById('patientsContainer');
    container.innerHTML = defaultPatients.map((p, idx) => \\\`
        <div class="card" style="margin-bottom: 15px; border: 1px solid #e5e7eb;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="font-weight: 600; font-size: 15px;">\\\${p.name}</div>
                    <span class="status-badge \\\${p.statusClass}">\\\${p.status}</span>
                </div>
                <button class="update-btn" onclick="updateLocation('\\\${p.name}')">Update Location</button>
            </div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 15px;">
                ID: \\\${p.id} &bull; Checked in: \\\${p.time} &bull; &#128205; \\\${p.location}
            </div>
            <div>
                <div style="font-size: 11px; font-weight: 600; margin-bottom: 10px; color: #6b7280;">Movement History</div>
                <div class="movement-timeline">
                    \\\${p.history.map((h, i) => \\\`
                        <div class="movement-step">
                            <div class="step-icon \\\${h.state}">
                                \\\${h.state === 'completed' ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'}
                            </div>
                            <div class="step-label">\\\${h.label}</div>
                            <div class="step-time">\\\${h.time}</div>
                        </div>
                        \\\${i < p.history.length - 1 ? '<div style="color: #d1d5db;">&rarr;</div>' : ''}
                    \\\`).join('')}
                </div>
            </div>
        </div>
    \\\`).join('');
}

function handleCheckin() {
    const id = document.getElementById('patientIdInput').value;
    const purpose = document.getElementById('visitPurposeInput').value;
    if (id && purpose) {
        alert(\\\`Checked in Patient \\\${id} for \\\${purpose}\\\`);
        document.getElementById('patientIdInput').value = '';
        document.getElementById('visitPurposeInput').value = '';
    } else {
        alert('Please enter Patient ID and Purpose.');
    }
}

function updateLocation(name) {
    const loc = prompt(\\\`Update location for \\\${name}:\\\`);
    if (loc) alert(\\\`Location for \\\${name} updated to \\\${loc}.\\\`);
}

document.addEventListener('DOMContentLoaded', renderPatients);
\`;

const appointmentsContent = `
        <div class="header-row" style="display:flex; justify-content: space-between; align-items:center;">
            <div>
                <h1>Manage Appointments</h1>
                <div class="sub">View, edit, and schedule patient appointments.</div>
            </div>
            <button class="btn-dark" onclick="openNewModal()">+ New Appointment</button>
        </div>
        
        <div class="card" style="margin-bottom: 20px; display: flex; gap: 10px;">
            <input type="text" id="searchTable" class="form-input" placeholder="Search by patient, ID, or doctor..." style="width: 300px;">
            <select class="form-select"><option>All Status</option></select>
            <select class="form-select"><option>All Departments</option></select>
        </div>
        
        <div class="card">
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Appt ID</th>
                            <th>Patient</th>
                            <th>Doctor</th>
                            <th>Department</th>
                            <th>Date & Time</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="appointmentsTableBody"></tbody>
                </table>
            </div>
        </div>
`;

const appointmentsJs = \`
let appointments = [
    {id: 'APT001', patient: 'Sarah Johnson', patientId: 'PT2301', doctor: 'Dr. Robert Smith', dept: 'Cardiology', date: '2026-03-08', time: '09:00 AM', type: 'Follow-up', status: 'Completed'},
    {id: 'APT002', patient: 'Michael Chen', patientId: 'PT2302', doctor: 'Dr. Emily Williams', dept: 'Orthopedics', date: '2026-03-08', time: '10:30 AM', type: 'Consultation', status: 'In Progress'},
    {id: 'APT003', patient: 'Emily Davis', patientId: 'PT2303', doctor: 'Dr. James Brown', dept: 'Neurology', date: '2026-03-08', time: '01:30 PM', type: 'Initial Visit', status: 'Waiting'},
    {id: 'APT004', patient: 'Robert Wilson', patientId: 'PT2304', doctor: 'Dr. Maria Martinez', dept: 'General Medicine', date: '2026-03-09', time: '09:00 AM', type: 'Check-up', status: 'Scheduled'}
];

function renderAppointments(data = appointments) {
    const tbody = document.getElementById('appointmentsTableBody');
    tbody.innerHTML = data.map(apt => \\\`
        <tr>
            <td>\\\${apt.id}</td>
            <td><div><strong>\\\${apt.patient}</strong><br><small style="color:gray;">\\\${apt.patientId}</small></div></td>
            <td>\\\${apt.doctor}</td>
            <td>\\\${apt.dept}</td>
            <td><div><strong>\\\${apt.date}</strong><br><small style="color:gray;">\\\${apt.time}</small></div></td>
            <td>\\\${apt.type}</td>
            <td><span class="status-badge status-\\\${apt.status.toLowerCase().replace(' ', '')}">\\\${apt.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn" onclick="alert('Editing \\\${apt.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button class="action-btn" onclick="deleteAppt('\\\${apt.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                </div>
            </td>
        </tr>
    \\\`).join('');
}

function deleteAppt(id) {
    if (confirm('Delete appointment ' + id + '?')) {
        appointments = appointments.filter(a => a.id !== id);
        renderAppointments();
    }
}
function openNewModal() { alert('Open New Appointment Form'); }

document.addEventListener('DOMContentLoaded', () => {
    renderAppointments();
    document.getElementById('searchTable').addEventListener('input', e => {
        const t = e.target.value.toLowerCase();
        renderAppointments(appointments.filter(a => a.patient.toLowerCase().includes(t) || a.patientId.toLowerCase().includes(t) || a.doctor.toLowerCase().includes(t)));
    });
});
\`;

const staffContent = `
        <div class="header-row" style="display:flex; justify-content: space-between; align-items:center;">
            <div>
                <h1>Staff Scheduling</h1>
                <div class="sub">Manage physician and staff shifts across departments.</div>
            </div>
            <button class="btn-dark" onclick="alert('Add Shift')">+ Add Shift</button>
        </div>
        
        <div class="card" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items:center;">
            <div style="display: flex; gap: 10px;">
                <select class="form-select"><option>All Departments</option><option>Cardiology</option><option>Neurology</option></select>
                <select class="form-select"><option>Today</option><option>This Week</option><option>Next Week</option></select>
            </div>
            <div>
                <input type="month" class="form-input" value="2026-03">
            </div>
        </div>
        
        <div class="card">
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Staff Name</th>
                            <th>Role</th>
                            <th>Department</th>
                            <th>Shift (Time)</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="staffTableBody"></tbody>
                </table>
            </div>
        </div>
`;

const staffJs = \`
const staffData = [
    {name: "Dr. Robert Smith", role: "Sr. Cardiologist", dept: "Cardiology", shift: "Morning (08:00 - 16:00)", status: "On Duty"},
    {name: "Nurse Emily Davis", role: "Head Nurse", dept: "ER", shift: "Night (20:00 - 08:00)", status: "Scheduled"},
    {name: "Dr. James Brown", role: "Neurologist", dept: "Neurology", shift: "Afternoon (14:00 - 22:00)", status: "On Duty"},
    {name: "Tech Sarah Wilson", role: "Lab Technician", dept: "Pathology", shift: "Morning (08:00 - 16:00)", status: "On Leave"}
];

function renderStaff() {
    const tbody = document.getElementById('staffTableBody');
    tbody.innerHTML = staffData.map(s => {
        let badgeColor = s.status === 'On Duty' ? 'status-pharmacy' : s.status === 'On Leave' ? 'status-er' : 'status-waiting';
        return \\\`
        <tr>
            <td><strong>\\\${s.name}</strong></td>
            <td>\\\${s.role}</td>
            <td>\\\${s.dept}</td>
            <td>\\\${s.shift}</td>
            <td><span class="status-badge \\\${badgeColor}">\\\${s.status}</span></td>
            <td>
                <button class="action-btn" onclick="alert('Edit Shift')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            </td>
        </tr>
    \\\`}).join('');
}
document.addEventListener('DOMContentLoaded', renderStaff);
\`;

const feedbackContent = `
        <div class="header-row">
            <div>
                <h1>Feedback & Reports</h1>
                <div class="sub">View and respond to patient and staff feedbacks.</div>
            </div>
        </div>

        <div class="card" style="margin-bottom: 20px; display: flex; gap: 10px;">
            <input type="text" id="searchFeedback" class="form-input" placeholder="Search feedback..." style="width: 300px;">
            <select class="form-select" id="filterType"><option value="all">All Types</option><option value="Patient">Patient</option><option value="Staff">Staff</option></select>
        </div>
        
        <div class="card">
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Sender Type</th>
                            <th>Sender</th>
                            <th>Rating</th>
                            <th>Subject</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="feedbackTableBody"></tbody>
                </table>
            </div>
        </div>
`;

const feedbackJs = \`
const feedbackData = [
    {date: "2026-03-30", type: "Patient", sender: "John Doe", rating: 5, subject: "Excellent Service", comment: "The nursing staff was very attentive."},
    {date: "2026-03-31", type: "Patient", sender: "Jane Smith", rating: 3, subject: "Long wait times", comment: "Wait time at the pharmacy was over an hour."},
    {date: "2026-04-01", type: "Staff", sender: "Dr. Brown", rating: 4, subject: "System Speed", comment: "The new HMS is good but sometimes slow to load patient files."}
];

function renderFeedback(data = feedbackData) {
    const tbody = document.getElementById('feedbackTableBody');
    tbody.innerHTML = data.map(f => \\\`
        <tr>
            <td>\\\${f.date}</td>
            <td><span class="status-badge \\\${f.type === 'Patient' ? 'status-waiting' : 'status-consultation'}">\\\${f.type}</span></td>
            <td><strong>\\\${f.sender}</strong></td>
            <td>\\\${'&#9733;'.repeat(f.rating)}\\\${'&#9734;'.repeat(5-f.rating)}</td>
            <td>\\\${f.subject}</td>
            <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">\\\${f.comment}</td>
            <td>
                <button class="action-btn" onclick="alert('Viewing feedback: \\\${f.subject}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
            </td>
        </tr>
    \\\`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    renderFeedback();
    
    document.getElementById('filterType').addEventListener('change', e => {
        const val = e.target.value;
        const filtered = val === 'all' ? feedbackData : feedbackData.filter(f => f.type === val);
        renderFeedback(filtered);
    });
    document.getElementById('searchFeedback').addEventListener('input', e => {
        const t = e.target.value.toLowerCase();
        renderFeedback(feedbackData.filter(f => f.subject.toLowerCase().includes(t) || f.sender.toLowerCase().includes(t)));
    });
});
\`;

fs.writeFileSync('patient_checkin.html', getLayout('Patient Check-in', 'Checkin', checkinContent));
fs.writeFileSync('patient_checkin.js', checkinJs);
fs.writeFileSync('manage_appointments.html', getLayout('Manage Appointments', 'Appointments', appointmentsContent));
fs.writeFileSync('manage_appointments.js', appointmentsJs);
fs.writeFileSync('staff_scheduling.html', getLayout('Staff Scheduling', 'Staff', staffContent));
fs.writeFileSync('staff_scheduling.js', staffJs);
fs.writeFileSync('feedback.html', getLayout('Feedback', 'Feedback', feedbackContent));
fs.writeFileSync('feedback.js', feedbackJs);

console.log('Successfully generated standardized pages.');
