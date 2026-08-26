// NexCare Doctor Portal Dashboard System
// Focuses exclusively on Appointment Viewing and Leave Applications

const MOCK_DOCTOR_LEAVES = [
    {
        id: 'L001',
        doctorId: 'U007',
        doctorName: 'Dr. Anjali Desai',
        startDate: '2026-08-20',
        endDate: '2026-08-25',
        reason: 'Family vacation',
        status: 'Approved',
        createdAt: '2026-08-15T00:00:00Z'
    },
    {
        id: 'L002',
        doctorId: 'U005',
        doctorName: 'Dr. Sarah Smith',
        startDate: '2026-09-01',
        endDate: '2026-09-03',
        reason: 'Medical conference attendance',
        status: 'Pending',
        createdAt: '2026-08-20T00:00:00Z'
    }
];

const MOCK_DOCTOR_APPOINTMENTS = [
    {
        id: 'APT-001',
        patientName: 'John Anderson',
        department: 'Cardiology',
        doctor: 'Dr. Sarah Smith',
        dateLabel: 'March 15, 2026',
        timeLabel: '10:00 AM',
        status: 'Confirmed'
    },
    {
        id: 'APT-002',
        patientName: 'Maria Garcia',
        department: 'Orthopaedics',
        doctor: 'Dr. Vikram Patel',
        dateLabel: 'April 02, 2026',
        timeLabel: '02:30 PM',
        status: 'Pending'
    },
    {
        id: 'APT-004',
        patientName: 'Robert Taylor',
        department: 'Neurology',
        doctor: 'Dr. Rajesh Khanna',
        dateLabel: 'April 18, 2026',
        timeLabel: '04:15 PM',
        status: 'Confirmed'
    }
];

document.addEventListener('DOMContentLoaded', async () => {
    await initDoctorDashboard();
});

async function initDoctorDashboard() {
    await Promise.all([
        loadAppointments(),
        loadLeaves()
    ]);
}

async function loadAppointments() {
    let appointments = [];

    try {
        const apiService = window.NexCareAPI;
        if (apiService && apiService.Appointments) {
            const res = await apiService.Appointments.getAll();
            if (res && res.success && Array.isArray(res.data)) {
                appointments = res.data;
            }
        }
    } catch (e) {
        console.warn('API error fetching appointments, using mock fallback:', e);
    }

    if (!appointments || appointments.length === 0) {
        appointments = MOCK_DOCTOR_APPOINTMENTS;
    }

    // Filter active/upcoming appointments
    const active = appointments.filter(a => a.status !== 'Cancelled');

    // Update stat card
    const statEl = document.getElementById('statAppointments');
    if (statEl) statEl.textContent = String(active.length);

    // Render table
    const tbody = document.getElementById('appointmentsTableBody');
    if (tbody) {
        if (active.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#6B7280;">No upcoming appointments.</td></tr>`;
        } else {
            tbody.innerHTML = active.map(a => `
                <tr>
                    <td><strong>${escapeHtml(a.patientName || 'Patient')}</strong></td>
                    <td>${escapeHtml(a.department || 'General')}</td>
                    <td>📅 ${escapeHtml(a.dateLabel || 'TBD')}</td>
                    <td>🕒 ${escapeHtml(a.timeLabel || 'TBD')}</td>
                    <td>
                        <span class="status-badge status-${(a.status || 'pending').toLowerCase()}" style="padding:4px 10px; border-radius:12px; font-size:12px; font-weight:600;">
                            ${escapeHtml(a.status || 'Pending')}
                        </span>
                    </td>
                    <td>
                        <a href="appointments.html" class="btn-outline-sm" style="text-decoration:none; padding:4px 10px; font-size:12px;">View</a>
                    </td>
                </tr>
            `).join('');
        }
    }
}

async function loadLeaves() {
    let leaves = [];

    try {
        const apiService = window.NexCareAPI;
        if (apiService && apiService.Leaves) {
            const res = await apiService.Leaves.getAll();
            if (res && res.success && Array.isArray(res.data)) {
                leaves = res.data;
            }
        }
    } catch (e) {
        console.warn('API error fetching leaves, using mock fallback:', e);
    }

    if (!leaves || leaves.length === 0) {
        try {
            const stored = localStorage.getItem('nexcare_mock_leaves');
            if (stored) leaves = JSON.parse(stored);
        } catch(e) {}
    }

    if (!leaves || leaves.length === 0) {
        leaves = MOCK_DOCTOR_LEAVES;
    }

    // Update stat card
    const statEl = document.getElementById('statLeaves');
    if (statEl) statEl.textContent = String(leaves.length);

    // Render table
    const tbody = document.getElementById('leavesTableBody');
    if (tbody) {
        if (leaves.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:#6B7280;">No leave requests found.</td></tr>`;
        } else {
            tbody.innerHTML = leaves.map(l => `
                <tr>
                    <td><span class="badge" style="background:#F3F4F6; padding:4px 8px; border-radius:6px; font-weight:600; font-size:12px; color:#374151;">${escapeHtml(l.id)}</span></td>
                    <td>🗓️ ${formatDate(l.startDate)} - ${formatDate(l.endDate)}</td>
                    <td>${escapeHtml(l.reason || 'N/A')}</td>
                    <td>
                        <span class="status-badge status-${(l.status || 'pending').toLowerCase()}" style="padding:4px 10px; border-radius:12px; font-size:12px; font-weight:600;">
                            ${escapeHtml(l.status || 'Pending')}
                        </span>
                    </td>
                    <td>${formatDate(l.createdAt)}</td>
                </tr>
            `).join('');
        }
    }
}

function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
