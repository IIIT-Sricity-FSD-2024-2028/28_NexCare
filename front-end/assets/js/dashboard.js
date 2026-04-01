// ---------------- MENU ACTIVE ----------------
document.querySelectorAll('.menu li').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelector('.menu .active')?.classList.remove('active');
        item.classList.add('active');
    });
});


// ---------------- MOCK DATA FROM JSON appointments.json ----------------
let appointments = [];
let filteredAppointments = [];


// ---------------- FETCH DATA ----------------
async function loadAppointments() {
    try {
        const res = await fetch("../assets/data/appointments.json");
        appointments = await res.json();
        filteredAppointments = [...appointments];
        render();
    } catch (err) {
        console.error("Error loading appointments:", err);
    }
}

function getStatusClass(status) {
    switch (status) {
        case "Completed": return "success";
        case "In Progress": return "info";
        case "Waiting": return "warning";
        default: return "";
    }
}

// ---------------- RENDER ----------------
function render() {
    const container = document.getElementById("appointmentsList");

    container.innerHTML = filteredAppointments.map(a => `
        <div class="appointment">
            <div class="avatar">⚕</div>
            <div class="info">
                <strong>${a.name}</strong>
                <div class="small">${a.doctor} • ${a.dept}</div>
            </div>
            <div class="time">${a.time}</div>
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
        return (
            a.name.toLowerCase().includes(search) ||
            a.doctor.toLowerCase().includes(search) ||
            a.dept.toLowerCase().includes(search)
        );
    });

    render();
}


// ---------------- EVENTS ----------------
document.getElementById("searchInput")?.addEventListener("input", applyFilters);


// ---------------- INIT ----------------
loadAppointments();
