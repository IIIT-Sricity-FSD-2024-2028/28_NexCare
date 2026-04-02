// ---------------- MENU ACTIVE ----------------
document.querySelectorAll('.menu li').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelector('.menu .active')?.classList.remove('active');
        item.classList.add('active');
    });
});


// ---------------- DATA FROM NexCareDB ----------------
let appointments = [];
let filteredAppointments = [];


// ---------------- FETCH DATA ----------------
function loadDashboardData() {
    if (!window.NexCareDB) return;

    // 1. Sync Stats
    const patients = window.NexCareDB.getTable('patients');
    const allAppointments = window.NexCareDB.getTable('appointments');

    document.getElementById('totalPatientsCount').textContent = patients.length;
    document.getElementById('todayApptCount').textContent = allAppointments.length; // Simplified for "System Total"

    // 2. Load Appointments List
    appointments = allAppointments;
    filteredAppointments = [...appointments];
    render();
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
        container.innerHTML = `<div style="padding:20px; text-align:center; color:#666;">No recent appointments found in database.</div>`;
        return;
    }

    container.innerHTML = filteredAppointments.map(a => `
        <div class="appointment">
            <div class="avatar">⚕</div>
            <div class="info">
                <strong>${a.patientName || a.name}</strong>
                <div class="small">${a.doctor} • ${a.department || a.dept}</div>
            </div>
            <div class="time">${a.timeLabel || a.time}</div>
            <div class="status-wrap">
                <span class="badge ${getStatusClass(a.status)}">${a.status}</span>
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
