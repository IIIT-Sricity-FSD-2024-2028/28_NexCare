// ---------------- API HELPER ----------------
function getHospitalId() {
    try {
        const user = JSON.parse(sessionStorage.getItem('nexcare_user_data') || localStorage.getItem('nexcare_user_data') || '{}');
        return user.hospitalId || '';
    } catch { return ''; }
}

function apiGet(path) {
    return window.NexCareAPI.get(path);
}

async function apiRequest(method, path, body) {
    const apiMethod = window.NexCareAPI[method.toLowerCase()];
    if (!apiMethod) throw new Error(`Unsupported method: ${method}`);
    return await apiMethod(path, body);
}

// ---------------- STATE ----------------
const WARD_RATES = {
    "Emergency": { service: "Emergency Ward Care & Monitoring", amount: 5000 },
    "General": { service: "General Ward Stay", amount: 1500 },
    "Pediatrics": { service: "Pediatric Care & Ward Services", amount: 2500 },
    "Maternity": { service: "Maternity Ward Services", amount: 4000 }
};

let bills = [];
let filteredBills = [];
let patientsCache = [];

// ---------------- LOAD DATA FROM API ----------------
async function loadBills() {
    try {
        const hid = getHospitalId();
        const hidQuery = hid ? `?hospitalId=${encodeURIComponent(hid)}` : '';
        const [billsResp, patientsResp] = await Promise.all([
            apiGet(`/billing${hidQuery}`),
            apiGet('/users?role=patient')
        ]);

        patientsCache = patientsResp.data || [];
        const dbBills = billsResp.data || [];

        bills = dbBills.map(db => {
            const patient = patientsCache.find(p => p.id === db.patientId);
            return {
                id: db.id,
                patient: patient ? patient.fullName : (db.patientName || "Unknown Patient"),
                date: db.visitDate || db.date || '',
                services: db.items && db.items.length > 0 ? db.items[0].description : "Medical Services",
                amount: db.subtotal || db.amount || 0,
                status: db.status || 'Pending',
                payment: db.payments && db.payments.length > 0 ? "Paid" : "-"
            };
        });

        filteredBills = [...bills];
        render();
    } catch (err) {
        console.error("Error loading bills:", err);
        alert('Failed to load bills. Please check your connection and try again.');
        const table = document.getElementById("bills");
        if (table) table.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:20px;color:#dc2626;">Failed to load bills. Backend may be offline.</td></tr>`;
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
    const revenue = bills.filter(b => b.status === "Paid").reduce((sum, b) => sum + Number(b.amount), 0);
    const pending = bills.filter(b => b.status !== "Paid").reduce((sum, b) => sum + Number(b.amount), 0);
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
        const matchesSearch = b.patient.toLowerCase().includes(search) || b.id.toLowerCase().includes(search);
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

let currentLineItems = [];

window.renderLineItems = () => {
    const container = document.getElementById("lineItemsList");
    if (!container) return;
    container.innerHTML = "";
    let total = 0;
    currentLineItems.forEach((item, index) => {
        total += Number(item.amount) || 0;
        container.innerHTML += `
            <div style="display: flex; gap: 10px; align-items: center;">
                <input class="input" style="flex: 2; margin-bottom: 0;" placeholder="Description" value="${item.description}" onchange="updateLineItem(${index}, 'description', this.value)">
                <input class="input" style="flex: 1; margin-bottom: 0;" type="number" placeholder="Amount" value="${item.amount}" onchange="updateLineItem(${index}, 'amount', this.value)">
                <button class="btn-outline" style="color: red; border-color: red; padding: 4px 8px;" onclick="removeLineItem(${index})">X</button>
            </div>
        `;
    });
    const totalEl = document.getElementById("billTotalAmount");
    if (totalEl) totalEl.innerText = total.toFixed(2);
};

window.addLineItem = () => {
    currentLineItems.push({ description: "", amount: 0 });
    window.renderLineItems();
};

window.updateLineItem = (index, field, value) => {
    currentLineItems[index][field] = field === 'amount' ? Number(value) : value;
    window.renderLineItems();
};

window.removeLineItem = (index) => {
    currentLineItems.splice(index, 1);
    window.renderLineItems();
};

window.fetchPatientDetails = async () => {
    const patientId = document.getElementById("patientId").value.trim();
    if (!patientId) {
        alert("Please enter a Patient ID first.");
        return;
    }

    try {
        const pResp = await apiGet('/users?role=patient');
        const patients = pResp.data || [];
        const searchId = patientId.toLowerCase();
        const patient = patients.find(p => 
            (p.id && p.id.toLowerCase() === searchId) || 
            (p.patientId && p.patientId.toLowerCase() === searchId) || 
            (p.patientIdDisplay && p.patientIdDisplay.toLowerCase() === searchId)
        );

        if (!patient) {
            alert("Patient not found. Please check the ID.");
            return;
        }

        document.getElementById("name").value = patient.name || patient.fullName || "Unknown";
        currentLineItems = [];

        // Fetch items based on hospital
        const hid = getHospitalId();
        const hidQuery = hid ? `?hospitalId=${encodeURIComponent(hid)}` : '';

        // 1. Beds
        try {
            const bedsResp = await apiGet(`/beds${hidQuery}`);
            const beds = bedsResp.data || [];
            const pName = patient.name || patient.fullName;
            const bed = beds.find(b => b.patientId === patient.id || (b.patient && b.patient === pName));
            if (bed && bed.ward && WARD_RATES[bed.ward]) {
                currentLineItems.push({ description: WARD_RATES[bed.ward].service, amount: WARD_RATES[bed.ward].amount });
            }
        } catch (e) { console.warn("Failed fetching beds", e); }

        // 2. Appointments
        try {
            const apptsResp = await apiGet(`/appointments${hidQuery}`);
            const appts = apptsResp.data || [];
            const patientAppts = appts.filter(a => (a.patientId === patient.id || a.patientId === patient.patientId) && a.status !== 'Cancelled');
            patientAppts.forEach(a => {
                currentLineItems.push({
                    description: `Consultation: Dr. ${a.doctor || 'Unknown'} (${a.department || 'General'})`,
                    amount: a.amount || 500
                });
            });
        } catch (e) { console.warn("Failed fetching appts", e); }

        // 3. Ambulance
        try {
            const ambResp = await apiGet('/ambulance'); 
            const ambs = ambResp.data || [];
            const pName = patient.name || patient.fullName;
            const patientAmbs = ambs.filter(a => a.patientName === pName);
            patientAmbs.forEach(a => {
                currentLineItems.push({
                    description: `Ambulance Transport: ${a.type || 'Standard'}`,
                    amount: a.amount || 1200
                });
            });
        } catch (e) { console.warn("Failed fetching ambulance", e); }

        if (currentLineItems.length === 0) {
            alert("No active charges found for this patient. Please enter items manually.");
            window.addLineItem();
        } else {
            window.renderLineItems();
        }
    } catch (err) {
        console.error("fetchPatientDetails error:", err);
        alert("Failed to fetch patient details. Backend may be offline.");
    }
};

window.save = async () => {
    const patientId = document.getElementById("patientId").value.trim();
    const name = document.getElementById("name").value;
    
    if (!patientId) {
        alert("Patient ID is required.");
        return;
    }

    if (currentLineItems.length === 0) {
        alert("Please add at least one line item.");
        return;
    }

    for (let item of currentLineItems) {
        if (!item.description.trim() || item.amount <= 0) {
            alert("All line items must have a valid description and amount greater than 0.");
            return;
        }
    }

    try {
        const pResp = await apiGet('/users?role=patient');
        const patients = pResp.data || [];
        const searchId = patientId.toLowerCase();
        const patient = patients.find(p => 
            (p.id && p.id.toLowerCase() === searchId) || 
            (p.patientId && p.patientId.toLowerCase() === searchId) || 
            (p.patientIdDisplay && p.patientIdDisplay.toLowerCase() === searchId)
        );

        if (!patient) {
            alert("Patient not found. Please verify the Patient ID.");
            return;
        }

        const subtotal = currentLineItems.reduce((sum, item) => sum + Number(item.amount), 0);
        const dateStr = new Date().toISOString().split("T")[0];
        
        const payload = {
            patientId: patient.id,
            visitDate: dateStr,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            status: "Pending",
            currency: "₹",
            subtotal: subtotal,
            cgstRate: 0.09,
            sgstRate: 0.09,
            items: currentLineItems.map(item => ({
                description: item.description,
                department: "Administrative",
                amount: Number(item.amount)
            })),
            payments: []
        };

        const hid = getHospitalId();
        if (hid) payload.hospitalId = hid;

        await apiRequest('POST', '/billing', payload);

        if (window.NexCareStore) {
            window.NexCareStore.logActivity('Create', 'Billing', `Admin generated new bill for ${name} (ID: ${patient.id})`);
        }
    } catch (err) {
        console.error("Save bill error:", err);
        alert("Failed to save bill. Please try again.");
        return;
    }

    document.getElementById("modal").style.display = "none";
    document.getElementById("patientId").value = "";
    document.getElementById("name").value = "";
    currentLineItems = [];
    window.renderLineItems();

    loadBills();
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

window.printBill = (id) => { viewBill(id); };

window.printBillContent = () => {
    const content = document.getElementById("billContent").innerHTML;
    const win = window.open("", "", "width=600,height=600");
    win.document.write(`<html><head><title>Print Bill</title></head><body>${content}</body></html>`);
    win.document.close();
    win.print();
};

window.downloadBill = (id) => { viewBill(id); };

window.downloadPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const content = document.getElementById("billContent").innerText;
    doc.text(content, 10, 10);
    doc.save("bill.pdf");
};
