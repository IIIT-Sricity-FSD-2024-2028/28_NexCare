import { validateBedUpdate } from "./validation.js";

// ---------------- STATE ----------------
let view = "grid";
let selectedWard = "ALL";

// ---------------- VARIABLES ----------------
let beds = [];
let filteredBeds = [];

// ---------------- LOAD MOCK DATA FROM beds.json ----------------
async function loadBeds() {
    try {
        const res = await fetch("beds.json");
        beds = await res.json();
        filteredBeds = [...beds];

        renderWards();
        render();
    } catch (err) {
        console.error("Failed to load beds:", err);
    }
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

    document.getElementById("modal").style.display = "flex";
    document.getElementById("patientName").value = selectedBed.patient || "";
    document.getElementById("status").value = selectedBed.status;
};

window.closeModal = () => {
    document.getElementById("modal").style.display = "none";
};

// ---------------- SAVE ----------------
window.saveBed = () => {
    const name = document.getElementById("patientName").value.trim();
    let status = document.getElementById("status").value;

    const error = validateBedUpdate({ name, status });
    if (error) {
        alert(error);
        return;
    }

    if (status === "available") {
        selectedBed.patient = "";
    } else {
        selectedBed.patient = name;
    }

    selectedBed.status = status;

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
};

window.admitPatient = () => {
    const name = document.getElementById("admitName").value.trim();
    const ward = document.getElementById("admitWard").value;

    // 🚨 HARD BLOCK (independent of import)
    if (!/^[A-Za-z]+( [A-Za-z]+)*$/.test(name) || name.length < 3) {
        alert("Valid patient name required (only letters, min 3 chars)");
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
    bed.status = "occupied";

    closeAdmitModal();
    applyFilters();
    renderWards();
};

// ---------------- EVENTS ----------------
document.getElementById("searchInput")?.addEventListener("input", applyFilters);

// ---------------- INIT ----------------
loadBeds();

