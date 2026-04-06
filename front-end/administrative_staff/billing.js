import { validateBillForm } from "./validation.js";

// ---------------- STATE ----------------
const WARD_RATES = {
    "Emergency": { service: "Emergency Ward Care & Monitoring", amount: 5000 },
    "General": { service: "General Ward Stay", amount: 1500 },
    "Pediatrics": { service: "Pediatric Care & Ward Services", amount: 2500 },
    "Maternity": { service: "Maternity Ward Services", amount: 4000 }
};

let bills = [];

let filteredBills = [];

// ---------------- LOAD MOCK DATA FROM bills.json ----------------

async function loadBills() {
    try {
        const res = await fetch("./bills.json");
        bills = await res.json();
        filteredBills = [...bills];

        render();
    } catch (err) {
        console.error("Failed to load bills:", err);
    }
}

function render() {
    const table = document.getElementById("bills");
    table.innerHTML = "";

    filteredBills.forEach(b => {
        table.innerHTML += `
        <tr>
            <td>${b.id}</td>
            <td>${b.patient}</td>
            <td>${b.date}</td>
            <td>${b.services}</td>
            <td>₹${b.amount}</td>
            <td><span class="status ${b.status.toLowerCase()}">${b.status}</span></td>
            <td>${b.payment}</td>

            <td>
                <div class="actions">

                    <!-- VIEW -->
                    <button class="icon-btn" title="View" onclick="viewBill('${b.id}')">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>

                    <!-- PRINT -->
                    <button class="icon-btn" title="Print" onclick="printBill('${b.id}')">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path d="M6 9V4h12v5M6 18h12v-5H6v5z"/>
                            <rect x="6" y="13" width="12" height="5"/>
                        </svg>
                    </button>

                    <!-- DOWNLOAD -->
                    <button class="icon-btn" title="Download" onclick="downloadBill('${b.id}')">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path d="M12 3v12"/>
                            <path d="M8 11l4 4 4-4"/>
                            <path d="M4 21h16"/>
                        </svg>
                    </button>

                </div>
            </td>
        </tr>`;
    });

    updateStats();
}

function updateStats() {
    const total = bills.length;
    const revenue = bills
        .filter(b => b.status === "Paid")
        .reduce((sum, b) => sum + Number(b.amount), 0);

    const pending = bills
        .filter(b => b.status !== "Paid")
        .reduce((sum, b) => sum + Number(b.amount), 0);

    const paidCount = bills.filter(b => b.status === "Paid").length;

    document.getElementById("totalBills").innerText = total;
    document.getElementById("revenue").innerText = `₹${revenue.toFixed(2)}`;
    document.getElementById("pending").innerText = `₹${pending.toFixed(2)}`;
    document.getElementById("paid").innerText = paidCount;
}

/* ---------------- SEARCH + FILTER ---------------- */

function applyFilters() {
    const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const status = document.getElementById("statusFilter")?.value || "";

    filteredBills = bills.filter(b => {
        const matchesSearch =
            b.patient.toLowerCase().includes(search) ||
            b.id.toLowerCase().includes(search);

        const matchesStatus = status ? b.status === status : true;

        return matchesSearch && matchesStatus;
    });

    render();
}

document.getElementById("searchInput")?.addEventListener("input", applyFilters);
document.getElementById("statusFilter")?.addEventListener("change", applyFilters);

/* ---------------- MODAL ---------------- */

window.openModal = () => {
    document.getElementById("modal").style.display = "flex";
};

window.closeModal = () => {
    document.getElementById("modal").style.display = "none";
};

window.fetchPatientDetails = () => {
    const patientId = document.getElementById("patientId").value.trim();
    if (!patientId) {
        alert("Please enter a Patient ID first.");
        return;
    }

    if (!window.NexCareDB) {
        alert("Database connection not found.");
        return;
    }

    // 1. Fetch patient name
    const patients = window.NexCareDB.getTable('patients');
    const patient = patients.find(p => p.id === patientId || p.patientIdDisplay === patientId);

    if (!patient) {
        alert("Patient not found. Please check the ID.");
        return;
    }

    document.getElementById("name").value = patient.fullName;

    // 2. Fetch bed allocation
    const beds = window.NexCareDB.getTable('beds');
    const bed = beds.find(b => b.patient === patient.fullName);

    if (bed && bed.ward && WARD_RATES[bed.ward]) {
        document.getElementById("services").value = WARD_RATES[bed.ward].service;
        document.getElementById("amount").value = WARD_RATES[bed.ward].amount;
    } else {
        alert("No active bed allocation found for this patient. Please enter services and amount manually.");
        document.getElementById("services").value = "";
        document.getElementById("amount").value = "";
    }
};

window.save = () => {

    const patientId = document.getElementById("patientId").value.trim();
    const name = document.getElementById("name").value;
    const amount = document.getElementById("amount").value;
    const services = document.getElementById("services").value;

    const error = validateBillForm({ name, amount, services });

    if (!patientId) {
        alert("Patient ID is required.");
        return;
    }

    if (error) {
        alert(error);
        return;
    }

    const billId = "B00" + (bills.length + 1);
    const dateStr = new Date().toISOString().split("T")[0];

    const newBill = {
        id: billId,
        patient: name,
        date: dateStr,
        services: services || "Medical Services",
        amount: Number(amount),
        status: "Pending",
        payment: "-"
    };

    // Update Admin View local state
    bills.push(newBill);

    // Sync to NexCareDB for Patient Portal
    if (window.NexCareDB) {
        const patients = window.NexCareDB.getTable('patients');
        const patient = patients.find(p => p.id === patientId || p.patientIdDisplay === patientId);
        
        if (patient) {
            window.NexCareDB.addRow('bills', {
                id: "BILL-" + Math.floor(Math.random() * 9000 + 1000),
                patientId: patient.id,
                visitDate: dateStr,
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB'),
                status: "Pending",
                currency: "₹",
                subtotal: Number(amount),
                cgstRate: 0.09,
                sgstRate: 0.09,
                items: [
                    { description: services, department: "Administrative", amount: Number(amount) }
                ],
                payments: []
            });
            window.NexCareDB.logActivity('Create', 'Billing', `Admin generated new bill for ${name} (ID: ${patient.id})`);
        }
    }

    document.getElementById("modal").style.display = "none";

    // reset form
    document.getElementById("patientId").value = "";
    document.getElementById("name").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("services").value = "";

    applyFilters();
};

/* ---------------- EXPORT ---------------- */

window.exportData = () => {
    let csv = "ID,Patient,Date,Services,Amount,Status,Payment\n";

    bills.forEach(b => {
        csv += `${b.id},${b.patient},${b.date},${b.services},${b.amount},${b.status},${b.payment}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "bills.csv";
    a.click();
};

/* ---------------- INIT ---------------- */

loadBills();

window.viewBill = (id) => {
    const bill = bills.find(b => b.id === id);

    const html = `
        <div>
            <p><strong>Bill ID:</strong> ${bill.id}</p>
            <p><strong>Patient:</strong> ${bill.patient}</p>
            <p><strong>Date:</strong> ${bill.date}</p>
            <p><strong>Services:</strong> ${bill.services}</p>
            <p><strong>Amount:</strong> ₹${bill.amount}</p>
            <p><strong>Status:</strong> ${bill.status}</p>
            <p><strong>Payment:</strong> ${bill.payment}</p>
        </div>
    `;

    document.getElementById("billContent").innerHTML = html;
    document.getElementById("viewModal").style.display = "flex";
};

window.closeViewModal = () => {
    document.getElementById("viewModal").style.display = "none";
};

window.printBill = (id) => {
    viewBill(id);
};

window.printBillContent = () => {
    const content = document.getElementById("billContent").innerHTML;

    const win = window.open("", "", "width=600,height=600");

    win.document.write(`
        <html>
        <head><title>Print Bill</title></head>
        <body>${content}</body>
        </html>
    `);

    win.document.close();
    win.print();
};

window.downloadBill = (id) => {
    viewBill(id);
};

window.downloadPDF = () => {
    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();

    const content = document.getElementById("billContent").innerText;

    doc.text(content, 10, 10);
    doc.save("bill.pdf");
};
