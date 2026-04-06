import { validateBedUpdate } from "./validation.js";

// ---------------- STATE ----------------
let view = "grid";
let selectedWard = "ALL";

// ---------------- VARIABLES ----------------
let beds = [];
let filteredBeds = [];

// ---------------- LOAD DATA FROM NexCareDB ----------------
function loadBeds() {
    if (window.NexCareDB) {
        beds = window.NexCareDB.getTable('beds');
        // If DB table is empty, fall back to initial seeded data
        if (beds.length === 0) {
            beds = [
                { "id": "E1", "ward": "Emergency", "status": "occupied", "patient": "Ravi Kumar" },
                { "id": "E2", "ward": "Emergency", "status": "critical", "patient": "Anita Sharma" },
                { "id": "E3", "ward": "Emergency", "status": "available", "patient": "" }
                // ... (simplified fallback for robustness)
            ];
        }
    }
    filteredBeds = [...beds];
    renderWards();
    render();
}

let selectedBed = null;

// ---------------- WARD META ----------------
const wardMeta = {
    Emergency: "Ground Floor • Nurse Sarah • Ext 1234",
    General: "2nd Floor • Nurse John • Ext 2345",
    Pediatrics: "3rd Floor • Nurse Mary • Ext 3456",
    Maternity: "3rd Floor • Nurse Anna • Ext 4567"
};


// ---------------- COMPUTE WARDS ----------------
function computeWardStats() {
    const wards = {};

    // group beds by ward
    beds.forEach(b => {
        if (!wards[b.ward]) {
            wards[b.ward] = { total: 0, occupied: 0 };
        }

        wards[b.ward].total++;

        if (b.status !== "available") {
            wards[b.ward].occupied++;
        }
    });

    // convert to array
    let result = Object.entries(wards).map(([name, data]) => {
        const percent = Math.round((data.occupied / data.total) * 100);

        let status = "Good";
        let color = "green";

        if (percent >= 85) {
            status = "Critical";
            color = "red";
        } else if (percent >= 70) {
            status = "High";
            color = "yellow";
        } else if (percent >= 60) {
            status = "Moderate";
            color = "blue";
        }

        if (name === "Emergency") {
            status = "Critical";
            color = "red";
        }
        return { name, ...data, percent, status, color };
    });

    // ADD ALL WARDS SUMMARY (correct way)
    const total = beds.length;
    const occupied = beds.filter(b => b.status !== "available").length;

    result.unshift({
        name: "ALL",
        total,
        occupied,
        percent: Math.round((occupied / total) * 100),
        status: "Overall",
        color: "blue"
    });

    return result;
}

// ---------------- RENDER WARDS ----------------
function renderWards() {
    const container = document.getElementById("wardCards");
    const wards = computeWardStats();

    container.innerHTML = wards.map(w => `
        <div class="ward-card" onclick="selectWard('${w.name}')">
            <div class="ward-title">${w.name} Ward</div>
            <div class="small">Occupied: ${w.occupied}/${w.total}</div>

            <div class="progress ${w.color}">
                <div class="progress-bar ${w.color}" style="width:${w.percent}%"></div>
            </div>

            <div class="small">${w.percent}% • ${w.status}</div>
        </div>
    `).join("");
}

// ---------------- UPDATE HEADER ----------------
function updateWardHeader() {
    let wardBeds =
        selectedWard === "ALL"
            ? beds
            : beds.filter(b => b.ward === selectedWard);

    const total = wardBeds.length;
    const occupied = wardBeds.filter(b => b.status !== "available").length;
    const available = total - occupied;

    document.getElementById("wardTitle").innerText =
        selectedWard === "ALL" ? "All Wards" : `${selectedWard} Ward`;

    document.getElementById("availableCount").innerText = available;
    document.getElementById("occupiedInfo").innerText = `Occupied: ${occupied}/${total}`;

    document.getElementById("wardMeta").innerText =
        selectedWard === "ALL" ? "All hospital wards overview" : wardMeta[selectedWard];
}

// ---------------- RENDER ----------------
function render() {
    updateWardHeader();

    const grid = document.getElementById("bedsGrid");

    const bedsToShow =
    selectedWard === "ALL"
        ? filteredBeds
        : filteredBeds.filter(b => b.ward === selectedWard);

    grid.className = view === "list" ? "beds-list" : "beds-grid";

    grid.innerHTML = bedsToShow.map(b => `
        <div class="bed ${b.status}" onclick="openModal('${b.id}')">
            <div>🛏 <strong>${b.id}</strong></div>
            <div class="small">${b.patient || "Empty"}</div>
        </div>
    `).join("");
}

// ---------------- SEARCH ----------------
function applyFilters() {
    const value = document.getElementById("searchInput")?.value.toLowerCase() || "";

    filteredBeds = beds.filter(b =>
        b.id.toLowerCase().includes(value) ||
        (b.patient && b.patient.toLowerCase().includes(value)) ||
        b.status.toLowerCase().includes(value)
    );

    render();
}

// ---------------- SELECT WARD ----------------
window.selectWard = (ward) => {
    selectedWard = ward;
    render();
};

// ---------------- VIEW TOGGLE ----------------
window.setView = (type) => {
    view = type;

    document.querySelectorAll(".btn-outline").forEach(btn => btn.classList.remove("active"));
    event.target.classList.add("active");

    render();
};

// ---------------- MODAL ----------------
window.openModal = (id) => {
    selectedBed = beds.find(b => b.id === id);

    const modal = document.getElementById("modal");
    modal.style.display = "flex";
    
    // Auto-populate patient record from DB if possible
    let currentId = "";
    if (selectedBed.patient) {
        // Reverse lookup if ID is missing (legacy support)
        const patients = window.NexCareDB ? window.NexCareDB.getTable('patients') : [];
        const patient = patients.find(p => p.fullName === selectedBed.patient);
        currentId = patient ? patient.id : "";
    }

    document.getElementById("patientId").value = selectedBed.patientId || currentId;
    document.getElementById("patientName").value = selectedBed.patient || "";
    document.getElementById("status").value = selectedBed.status;
};

window.fetchPatientForUpdate = () => {
    const id = document.getElementById("patientId").value.trim();
    const patient = window.NexCareDB.getTable('patients').find(p => p.id === id || p.patientIdDisplay === id);
    if (patient) {
        document.getElementById("patientName").value = patient.fullName;
    } else {
        alert("Patient ID not found.");
        document.getElementById("patientName").value = "";
    }
};

window.fetchPatientForAdmit = () => {
    const id = document.getElementById("admitPatientId").value.trim();
    const patient = window.NexCareDB.getTable('patients').find(p => p.id === id || p.patientIdDisplay === id);
    if (patient) {
        document.getElementById("admitName").value = patient.fullName;
    } else {
        alert("Patient ID not found.");
        document.getElementById("admitName").value = "";
    }
};

window.closeModal = () => {
    document.getElementById("modal").style.display = "none";
};

// ---------------- SAVE ----------------
window.saveBed = () => {
    const patientId = document.getElementById("patientId").value.trim();
    const name = document.getElementById("patientName").value.trim();
    let status = document.getElementById("status").value;

    const error = validateBedUpdate({ name, status });
    if (error) {
        alert(error);
        return;
    }

    if (status === "available") {
        selectedBed.patient = "";
        selectedBed.patientId = "";
    } else {
        selectedBed.patient = name;
        selectedBed.patientId = patientId;
    }

    selectedBed.status = status;
    
    if (window.NexCareDB) {
        window.NexCareDB.updateRow('beds', selectedBed.id, {
            patient: selectedBed.patient,
            patientId: selectedBed.patientId,
            status: selectedBed.status
        });
    }

    closeModal();
    applyFilters();
    renderWards();
};

// ---------------- ADMIT ----------------
window.openAdmitModal = () => {
    const modal = document.getElementById("admitModal");
    const select = document.getElementById("admitWard");

    // get wards with at least 1 empty bed
    const wardSet = {};

    beds.forEach(b => {
        if (b.status === "available") {
            wardSet[b.ward] = true;
        }
    });

    const availableWards = Object.keys(wardSet);

    select.innerHTML = availableWards.map(w =>
        `<option value="${w}">${w} Ward</option>`
    ).join("");

    modal.style.display = "flex";
};

window.closeAdmitModal = () => {
    document.getElementById("admitModal").style.display = "none";
    document.getElementById("admitName").value = "";
    document.getElementById("admitPatientId").value = "";
};

window.admitPatient = () => {
    const patientId = document.getElementById("admitPatientId").value.trim();
    const name = document.getElementById("admitName").value.trim();
    const ward = document.getElementById("admitWard").value;

    if (!patientId || !name) {
        alert("Please select a valid patient using ID.");
        return;
    }

    // Optional validator (if import works)
    if (typeof validateBedUpdate === "function") {
        const error = validateBedUpdate({ name, status: "occupied" });
        if (error) {
            alert(error);
            return;
        }
    }

    const bed = beds.find(b => b.ward === ward && b.status === "available");

    if (!bed) {
        alert("No available beds in this ward");
        return;
    }

    bed.patient = name;
    bed.patientId = patientId;
    bed.status = "occupied";
    
    if (window.NexCareDB) {
        window.NexCareDB.updateRow('beds', bed.id, {
            patient: bed.patient,
            patientId: bed.patientId,
            status: bed.status
        });
    }

    closeAdmitModal();
    applyFilters();
    renderWards();
};

// ---------------- EVENTS ----------------
document.getElementById("searchInput")?.addEventListener("input", applyFilters);

// ---------------- INIT ----------------
loadBeds();

