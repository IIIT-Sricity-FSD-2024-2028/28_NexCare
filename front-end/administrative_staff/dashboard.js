// ---------------- MENU ACTIVE ----------------
document.querySelectorAll('.menu li').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelector('.menu .active')?.classList.remove('active');
        item.classList.add('active');
    });
});

// ---------------- STATE ----------------
let appointments = [];
let filteredAppointments = [];

// ---------------- API HELPER ----------------
function apiGet(path) {
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    const host = window.location.hostname || 'localhost';
    return fetch(`http://${host}:3001/api${path}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    }).then(r => r.json());
}

async function loadDashboardData() {
    try {
        const [patientsResp, apptResp, bedsResp, feedbackResp] = await Promise.all([
            apiGet('/patients').catch(() => ({ data: [] })),
            apiGet('/appointments').catch(() => ({ data: [] })),
            apiGet('/beds').catch(() => ({ data: [] })),
            apiGet('/feedback').catch(() => ({ data: [] }))
        ]);

        const patients = patientsResp.data || [];
        const allAppointments = apptResp.data || [];
        const beds = bedsResp.data || [];
        const feedbacks = feedbackResp.data || [];

        // 1. Total Patients
        document.getElementById('totalPatientsCount').textContent = patients.length;

        // 2. Today's Appointments
        // Get today's date string in a format that might match dateLabel (e.g., 'May 06, 2026')
        // Or just count all appointments for now if filtering is too strict, but let's try to filter by current month/year
        const now = new Date();
        const currentYear = now.getFullYear().toString();
        const currentMonth = now.toLocaleString('default', { month: 'long' });
        
        const todaysAppointments = allAppointments.filter(a => {
            if (!a.dateLabel) return false;
            return a.dateLabel.includes(currentYear) && a.dateLabel.includes(currentMonth);
        });
        document.getElementById('todayApptCount').textContent = todaysAppointments.length;

        // 3. Available Beds
        if (beds.length > 0) {
            const availableBeds = beds.filter(b => b.status && b.status.toLowerCase() === 'available').length;
            const totalBeds = beds.length;
            const bedsPercent = Math.round((availableBeds / totalBeds) * 100);
            const bedsEl = document.getElementById('availableBedsCount');
            if (bedsEl) bedsEl.textContent = `${availableBeds}/${totalBeds}`;
            const bedsTrend = document.getElementById('bedsTrend');
            if (bedsTrend) {
                bedsTrend.textContent = `${bedsPercent}% available`;
                bedsTrend.className = bedsPercent > 20 ? 'trend success' : 'trend down';
            }
        }

        // 4. Pending Feedback (Replacing Critical Alerts)
        const criticalAlerts = feedbacks.filter(f => f.status === 'Open' || !f.status).length;
        const alertsEl = document.getElementById('criticalAlertsCount');
        if (alertsEl) alertsEl.textContent = criticalAlerts;
        const alertsTrend = document.getElementById('alertsTrend');
        if (alertsTrend) {
            alertsTrend.textContent = criticalAlerts > 0 ? 'Needs Attention' : 'All clear';
            alertsTrend.className = criticalAlerts > 0 ? 'trend down' : 'trend success';
        }

        // Map proper patient names to appointments
        appointments = allAppointments.map(appt => {
            // Find actual patient record to get the true full name
            const patientRecord = patients.find(p => p.id === appt.patientId);
            return {
                ...appt,
                patientName: patientRecord ? patientRecord.fullName : (appt.patientName || 'Unknown')
            };
        });

        // Sort appointments by creation date (newest first)
        appointments.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        filteredAppointments = [...appointments];
        render();
    } catch (err) {
        console.error('Dashboard load failed:', err);
        document.getElementById('totalPatientsCount').textContent = 'N/A';
        document.getElementById('todayApptCount').textContent = 'N/A';
    }
}

function getStatusClass(status) {
    const s = status ? status.toLowerCase() : "";
    if (s.includes("completed")) return "success";
    if (s.includes("progress")) return "info";
    if (s.includes("waiting") || s.includes("pending")) return "warning";
    return "";
}

// ---------------- RENDER ----------------
function render() {
    const container = document.getElementById("appointmentsList");
    if (!container) return;

    if (filteredAppointments.length === 0) {
        container.innerHTML = `<div style="padding:20px; text-align:center; color:#666;">No recent appointments found.</div>`;
        return;
    }

    container.innerHTML = filteredAppointments.map(a => `
        <div class="appointment">
            <div class="avatar">⚕</div>
            <div class="info">
                <strong>${a.patientName || a.name || 'Unknown'}</strong>
                <div class="small">${a.doctor || 'TBD'} • ${a.department || a.dept || 'General'}</div>
            </div>
            <div class="time">${a.timeLabel || a.time || ''}</div>
            <div class="status-wrap">
                <span class="badge ${getStatusClass(a.status)}">${a.status || 'Pending'}</span>
            </div>
        </div>
    `).join("");
}

// ---------------- SEARCH ----------------
function applyFilters() {
    const search = document.getElementById("searchInput")?.value.toLowerCase() || "";

    filteredAppointments = appointments.filter(a => {
        const pName = (a.patientName || a.name || "").toLowerCase();
        const dName = (a.doctor || "").toLowerCase();
        const deptName = (a.department || a.dept || "").toLowerCase();
        return pName.includes(search) || dName.includes(search) || deptName.includes(search);
    });

    render();
}

// ---------------- EVENTS ----------------
document.getElementById("searchInput")?.addEventListener("input", applyFilters);

// ---------------- INIT ----------------
loadDashboardData();
