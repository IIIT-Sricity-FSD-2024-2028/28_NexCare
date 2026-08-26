// NexCare Doctor Portal - Dynamic Patient Appointments Script
// Handles doctor-specific specialty appointment filtering & consultation actions

const DOCTORS_MAP = {
    'U005': { id: 'U005', name: 'Dr. Sarah Smith', specialty: 'Cardiology', hospital: 'NexCare AIIMS Super Speciality Hospital' },
    'U006': { id: 'U006', name: 'Dr. Vikram Patel', specialty: 'Orthopaedics', hospital: 'NexCare AIIMS Super Speciality Hospital' },
    'U007': { id: 'U007', name: 'Dr. Anjali Desai', specialty: 'General Medicine', hospital: 'NexCare Central Hospital' },
    'U010': { id: 'U010', name: 'Dr. Priya Nair', specialty: 'Paediatrics', hospital: 'NexCare AIIMS Super Speciality Hospital' },
    'U011': { id: 'U011', name: 'Dr. Rajesh Khanna', specialty: 'Neurology', hospital: 'NexCare Specialty Care Center' }
};

// Seed mock appointments specifically grouped and tagged by Doctor & Specialty
const MOCK_SPECIALTY_APPOINTMENTS = [
    // Cardiology (Dr. Sarah Smith)
    {
        id: 'APT-101',
        token: 'TKN-8821',
        doctorId: 'U005',
        doctorName: 'Dr. Sarah Smith',
        department: 'Cardiology',
        patientId: 'P001',
        patientName: 'John Anderson',
        age: 45,
        gender: 'Male',
        phone: '+1 (555) 123-4567',
        dateLabel: 'March 15, 2026',
        timeLabel: '10:00 AM',
        status: 'Confirmed',
        reason: 'Routine chest pain assessment & ECG review'
    },
    {
        id: 'APT-102',
        token: 'TKN-6869',
        doctorId: 'U005',
        doctorName: 'Dr. Sarah Smith',
        department: 'Cardiology',
        patientId: 'P008',
        patientName: 'Kavita Sundaram',
        age: 62,
        gender: 'Female',
        phone: '+91 98765 43210',
        dateLabel: 'March 15, 2026',
        timeLabel: '11:30 AM',
        status: 'Pending',
        reason: 'Hypertension evaluation and lipid profile discussion'
    },
    {
        id: 'APT-103',
        token: 'TKN-3507',
        doctorId: 'U005',
        doctorName: 'Dr. Sarah Smith',
        department: 'Cardiology',
        patientId: 'P012',
        patientName: 'Ramesh Verma',
        age: 58,
        gender: 'Male',
        phone: '+91 98123 45678',
        dateLabel: 'March 10, 2026',
        timeLabel: '02:00 PM',
        status: 'Completed',
        reason: 'Post-angioplasty follow-up'
    },

    // Orthopaedics (Dr. Vikram Patel)
    {
        id: 'APT-201',
        token: 'TKN-5678',
        doctorId: 'U006',
        doctorName: 'Dr. Vikram Patel',
        department: 'Orthopaedics',
        patientId: 'P002',
        patientName: 'Maria Garcia',
        age: 38,
        gender: 'Female',
        phone: '+1 (555) 987-6543',
        dateLabel: 'April 02, 2026',
        timeLabel: '02:30 PM',
        status: 'Pending',
        reason: 'Severe right knee joint pain & ligament MRI consultation'
    },
    {
        id: 'APT-202',
        token: 'TKN-1949',
        doctorId: 'U006',
        doctorName: 'Dr. Vikram Patel',
        department: 'Orthopaedics',
        patientId: 'P015',
        patientName: 'Suresh Kumar',
        age: 50,
        gender: 'Male',
        phone: '+91 97654 32109',
        dateLabel: 'April 05, 2026',
        timeLabel: '09:30 AM',
        status: 'Confirmed',
        reason: 'Lumbar spine stiffness assessment'
    },

    // General Medicine (Dr. Anjali Desai)
    {
        id: 'APT-301',
        token: 'TKN-9012',
        doctorId: 'U007',
        doctorName: 'Dr. Anjali Desai',
        department: 'General Medicine',
        patientId: 'P001',
        patientName: 'John Anderson',
        age: 45,
        gender: 'Male',
        phone: '+1 (555) 123-4567',
        dateLabel: 'March 01, 2026',
        timeLabel: '11:00 AM',
        status: 'Completed',
        reason: 'Annual physical health checkup'
    },
    {
        id: 'APT-302',
        token: 'TKN-3911',
        doctorId: 'U007',
        doctorName: 'Dr. Anjali Desai',
        department: 'General Medicine',
        patientId: 'P018',
        patientName: 'Deepak Sharma',
        age: 29,
        gender: 'Male',
        phone: '+91 95432 10987',
        dateLabel: 'March 18, 2026',
        timeLabel: '03:00 PM',
        status: 'Confirmed',
        reason: 'Seasonal allergy & persistent viral fever'
    },

    // Paediatrics (Dr. Priya Nair)
    {
        id: 'APT-401',
        token: 'TKN-7788',
        doctorId: 'U010',
        doctorName: 'Dr. Priya Nair',
        department: 'Paediatrics',
        patientId: 'P022',
        patientName: 'Aarav Mehta (Child)',
        age: 6,
        gender: 'Male',
        phone: '+91 94321 09876',
        dateLabel: 'February 12, 2026',
        timeLabel: '09:30 AM',
        status: 'Completed',
        reason: 'Childhood vaccination & growth milestone tracking'
    },
    {
        id: 'APT-402',
        token: 'TKN-4112',
        doctorId: 'U010',
        doctorName: 'Dr. Priya Nair',
        department: 'Paediatrics',
        patientId: 'P025',
        patientName: 'Ananya Gupta (Child)',
        age: 4,
        gender: 'Female',
        phone: '+91 93210 98765',
        dateLabel: 'April 10, 2026',
        timeLabel: '10:15 AM',
        status: 'Confirmed',
        reason: 'Recurrent ear infection & fever review'
    },

    // Neurology (Dr. Rajesh Khanna)
    {
        id: 'APT-501',
        token: 'TKN-3344',
        doctorId: 'U011',
        doctorName: 'Dr. Rajesh Khanna',
        department: 'Neurology',
        patientId: 'P030',
        patientName: 'Robert Taylor',
        age: 52,
        gender: 'Male',
        phone: '+1 (555) 345-6789',
        dateLabel: 'April 18, 2026',
        timeLabel: '04:15 PM',
        status: 'Confirmed',
        reason: 'Chronic migraine evaluation & neurological reflex testing'
    }
];

let activeDoctorId = 'U005';
let doctorAppointmentsList = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Check logged-in user to default active doctor
    detectCurrentDoctor();

    // Event Listeners
    const doctorSelect = document.getElementById('doctorSelect');
    if (doctorSelect) {
        doctorSelect.value = activeDoctorId;
        doctorSelect.addEventListener('change', (e) => {
            activeDoctorId = e.target.value;
            updateActiveDoctorView();
        });
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', renderAppointmentsTable);
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', renderAppointmentsTable);
    }

    await loadAppointmentsData();
});

function detectCurrentDoctor() {
    try {
        const stored = sessionStorage.getItem('nexcare_currentUser') || localStorage.getItem('nexcare_currentUser');
        if (stored) {
            const user = JSON.parse(stored);
            if (user && user.id && DOCTORS_MAP[user.id]) {
                activeDoctorId = user.id;
            }
        }
    } catch(e) {}
}

async function loadAppointmentsData() {
    let apiAppts = [];
    try {
        if (window.NexCareAPI && window.NexCareAPI.Appointments) {
            const res = await window.NexCareAPI.Appointments.getAll();
            if (res && res.success && Array.isArray(res.data)) {
                apiAppts = res.data;
            }
        }
    } catch(e) {
        console.warn('API error fetching appointments, using local mock store:', e);
    }

    // Merge API data with seed mock appointments
    doctorAppointmentsList = [...MOCK_SPECIALTY_APPOINTMENTS];
    if (apiAppts.length > 0) {
        apiAppts.forEach(item => {
            if (!doctorAppointmentsList.some(m => m.id === item.id)) {
                doctorAppointmentsList.push(item);
            }
        });
    }

    updateActiveDoctorView();
}

function updateActiveDoctorView() {
    const docInfo = DOCTORS_MAP[activeDoctorId] || DOCTORS_MAP['U005'];

    // Update Header Banner
    const activeDeptBadge = document.getElementById('activeDeptBadge');
    const activeDoctorName = document.getElementById('activeDoctorName');
    const activeDoctorHospital = document.getElementById('activeDoctorHospital');

    if (activeDeptBadge) activeDeptBadge.textContent = `${docInfo.specialty.toUpperCase()} SPECIALTY`;
    if (activeDoctorName) activeDoctorName.textContent = docInfo.name;
    if (activeDoctorHospital) activeDoctorHospital.textContent = `${docInfo.hospital} — Outpatient Consultation Department`;

    renderAppointmentsTable();
}

function getFilteredAppointments() {
    const docInfo = DOCTORS_MAP[activeDoctorId] || DOCTORS_MAP['U005'];
    const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const statusVal = document.getElementById('statusFilter')?.value || 'all';

    return doctorAppointmentsList.filter(a => {
        // Match doctor or specialty department
        const matchesDoc = (a.doctorId === activeDoctorId) || 
                           (a.department && a.department.toLowerCase() === docInfo.specialty.toLowerCase()) ||
                           (a.doctorName && a.doctorName.toLowerCase().includes(docInfo.name.toLowerCase()));

        if (!matchesDoc) return false;

        // Match status filter
        if (statusVal !== 'all' && a.status !== statusVal) return false;

        // Match search query
        if (searchTerm) {
            const text = `${a.patientName} ${a.token} ${a.reason} ${a.phone}`.toLowerCase();
            if (!text.includes(searchTerm)) return false;
        }

        return true;
    });
}

function renderAppointmentsTable() {
    const filtered = getFilteredAppointments();

    // Update Stat Cards
    const totalEl = document.getElementById('statTotal');
    const confirmedEl = document.getElementById('statConfirmed');
    const completedEl = document.getElementById('statCompleted');
    const pendingEl = document.getElementById('statPending');

    if (totalEl) totalEl.textContent = String(filtered.length);
    if (confirmedEl) confirmedEl.textContent = String(filtered.filter(a => a.status === 'Confirmed').length);
    if (completedEl) completedEl.textContent = String(filtered.filter(a => a.status === 'Completed').length);
    if (pendingEl) pendingEl.textContent = String(filtered.filter(a => a.status === 'Pending').length);

    // Render Table Rows
    const tbody = document.getElementById('doctorAppointmentsTbody');
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:40px; color:#6B7280;">
                    <div style="font-size:32px; margin-bottom:8px;">🩺</div>
                    <div style="font-weight:600; font-size:16px; color:#374151;">No appointments found for this filter</div>
                    <div style="font-size:13px; margin-top:4px;">Try selecting a different status or doctor specialty from the dropdown.</div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(a => `
        <tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 14px;">
                <span style="background: #F3F4F6; color: #1F2937; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 12px; border: 1px solid #E5E7EB;">
                    ${escapeHtml(a.token || a.id)}
                </span>
            </td>
            <td style="padding: 14px;">
                <div style="font-weight: 700; color: #111827;">${escapeHtml(a.patientName || 'Patient')}</div>
                <div style="font-size: 12px; color: #6B7280;">${a.age ? a.age + ' yrs, ' + (a.gender || '') : ''} ${a.phone ? '• ' + escapeHtml(a.phone) : ''}</div>
            </td>
            <td style="padding: 14px;">
                <span style="background: #EFF6FF; color: #1D4ED8; padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                    ${escapeHtml(a.department || 'General')}
                </span>
                <div style="font-size: 12px; color: #4B5563; margin-top: 4px;">${escapeHtml(a.doctorName || 'Doctor')}</div>
            </td>
            <td style="padding: 14px;">
                <div style="font-weight: 600; color: #111827;">📅 ${escapeHtml(a.dateLabel || 'TBD')}</div>
                <div style="font-size: 12px; color: #2563EB; font-weight: 600;">🕒 ${escapeHtml(a.timeLabel || 'TBD')}</div>
            </td>
            <td style="padding: 14px; max-width: 220px;">
                <div style="font-size: 13px; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(a.reason || 'General Consultation')}">
                    ${escapeHtml(a.reason || 'General Consultation')}
                </div>
            </td>
            <td style="padding: 14px;">
                <span class="status-badge status-${(a.status || 'pending').toLowerCase()}" style="padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                    ${escapeHtml(a.status || 'Pending')}
                </span>
            </td>
            <td style="padding: 14px; text-align: center;">
                <div style="display: flex; justify-content: center; gap: 6px;">
                    ${a.status !== 'Completed' ? `
                        <button onclick="markCompleted('${a.id}')" style="background: #059669; color: #FFF; border: none; padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;" title="Mark Consultation Completed">
                            ✓ Complete
                        </button>
                    ` : ''}
                    <button onclick="openConsultModal('${a.id}')" style="background: #F3F4F6; color: #374151; border: 1px solid #D1D5DB; padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;" title="View Consultation Details">
                        👁️ Details
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.markCompleted = function(id) {
    const item = doctorAppointmentsList.find(a => a.id === id);
    if (item) {
        item.status = 'Completed';
        renderAppointmentsTable();
    }
};

window.openConsultModal = function(id) {
    const item = doctorAppointmentsList.find(a => a.id === id);
    if (!item) return;

    const modalBody = document.getElementById('consultModalBody');
    const modal = document.getElementById('consultModal');

    if (modalBody && modal) {
        modalBody.innerHTML = `
            <div style="background: #F9FAFB; padding: 16px; border-radius: 10px; margin-bottom: 16px; border: 1px solid #E5E7EB;">
                <div style="font-size: 16px; font-weight: 700; color: #111827;">${escapeHtml(item.patientName)}</div>
                <div style="font-size: 13px; color: #6B7280; margin-top: 2px;">Token: <strong>${escapeHtml(item.token || item.id)}</strong> | Contact: ${escapeHtml(item.phone || 'N/A')}</div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                <div>
                    <label style="font-size: 12px; color: #6B7280; font-weight: 600; display: block;">SPECIALITY / DEPT</label>
                    <div style="font-weight: 600; color: #111827;">${escapeHtml(item.department)}</div>
                </div>
                <div>
                    <label style="font-size: 12px; color: #6B7280; font-weight: 600; display: block;">ASSIGNED DOCTOR</label>
                    <div style="font-weight: 600; color: #111827;">${escapeHtml(item.doctorName)}</div>
                </div>
                <div>
                    <label style="font-size: 12px; color: #6B7280; font-weight: 600; display: block;">DATE</label>
                    <div style="font-weight: 600; color: #111827;">${escapeHtml(item.dateLabel)}</div>
                </div>
                <div>
                    <label style="font-size: 12px; color: #6B7280; font-weight: 600; display: block;">TIME SLOT</label>
                    <div style="font-weight: 600; color: #2563EB;">${escapeHtml(item.timeLabel)}</div>
                </div>
            </div>

            <div>
                <label style="font-size: 12px; color: #6B7280; font-weight: 600; display: block; margin-bottom: 4px;">CHIEF COMPLAINT / REASON FOR VISIT</label>
                <div style="background: #EFF6FF; border: 1px solid #BFDBFE; padding: 12px; border-radius: 8px; font-size: 14px; color: #1E3A8A; line-height: 1.5;">
                    ${escapeHtml(item.reason || 'No specific symptoms described.')}
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    }
};

window.closeConsultModal = function() {
    const modal = document.getElementById('consultModal');
    if (modal) modal.style.display = 'none';
};

function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
