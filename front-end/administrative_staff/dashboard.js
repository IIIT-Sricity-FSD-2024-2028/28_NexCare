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

// ---------------- FETCH DATA ----------------
async function loadDashboardData() {
    try {
        const [patientsResp, apptResp] = await Promise.all([
            apiGet('/patients'),
            apiGet('/appointments')
        ]);

        const patients = patientsResp.data || [];
        const allAppointments = apptResp.data || [];

        document.getElementById('totalPatientsCount').textContent = patients.length;
        document.getElementById('todayApptCount').textContent = allAppointments.length;

        appointments = allAppointments;
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
