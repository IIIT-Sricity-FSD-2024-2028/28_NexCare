let currentHospitalId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentHospitalId = urlParams.get('id');

    if (!currentHospitalId) {
        alert("No hospital ID provided.");
        window.location.href = 'dashboard.html';
        return;
    }

    const userDataStr = sessionStorage.getItem('nexcare_user_data');
    if (userDataStr) {
        const user = JSON.parse(userDataStr);
        document.getElementById('userInitials').textContent = (user.name || 'RO').substring(0, 2).toUpperCase();
        document.getElementById('userNameDisplay').textContent = user.name || 'Regional Officer';
    }

    await loadHospitalDetails();
});

function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');

    // Lazy load tab data
    if (tabId === 'staff' && !window.staffLoaded) loadStaff();
    if (tabId === 'beds' && !window.bedsLoaded) loadBeds();
    if (tabId === 'inventory' && !window.inventoryLoaded) loadInventory();
    if (tabId === 'ambulances' && !window.ambulancesLoaded) loadAmbulances();
}

async function loadHospitalDetails() {
    try {
        const hRes = await window.NexCareAPI.Hospitals.getAll();
        if (!hRes.success) throw new Error("Failed to load hospitals");
        
        const hospital = hRes.data.find(h => h.id === currentHospitalId);
        if (!hospital) {
            document.getElementById('hospitalName').textContent = "Hospital Not Found";
            return;
        }

        document.getElementById('hospitalName').textContent = hospital.name;
        document.getElementById('hospitalAddress').textContent = `${hospital.address || ''}, ${hospital.city || ''}, ${hospital.state || ''} - ${hospital.pincode || ''}`;
        document.getElementById('hospitalType').textContent = hospital.type || 'N/A';
        document.getElementById('hospitalStatus').textContent = hospital.verificationStatus === 'verified' ? 'Verified' : 'Pending';

        document.getElementById('overviewReg').textContent = hospital.registrationNumber || 'N/A';
        document.getElementById('overviewPhone').textContent = hospital.phone || 'N/A';
        document.getElementById('overviewEmail').textContent = hospital.email || 'N/A';
        document.getElementById('overviewAdmin').textContent = hospital.adminName || 'N/A';
        document.getElementById('overviewBeds').textContent = hospital.totalBeds || 0;
        document.getElementById('overviewIcu').textContent = hospital.icuBeds || 0;
        document.getElementById('overviewEmergency').textContent = hospital.emergency24x7 ? 'Yes' : 'No';

    } catch (err) {
        console.error(err);
    }
}

// Dummy loaders to represent fetching filtered data
async function loadStaff() {
    window.staffLoaded = true;
    const res = await window.NexCareAPI.Users.getAll();
    const staff = (res.data || []).filter(u => u.hospitalId === currentHospitalId);
    
    const tbody = document.getElementById('staffTable');
    if (staff.length === 0) {
        tbody.innerHTML = `<tr class="empty-state"><td colspan="3">No staff found for this hospital.</td></tr>`;
    } else {
        tbody.innerHTML = staff.map(s => `<tr><td>${s.name}</td><td>${s.role}</td><td>${s.status || 'Active'}</td></tr>`).join('');
    }
}

async function loadBeds() {
    window.bedsLoaded = true;
    const res = await window.NexCareAPI.Beds.getAll();
    const beds = (res.data || []).filter(b => b.hospitalId === currentHospitalId);
    
    const tbody = document.getElementById('bedsTable');
    if (beds.length === 0) {
        tbody.innerHTML = `<tr class="empty-state"><td colspan="3">No beds configured.</td></tr>`;
    } else {
        tbody.innerHTML = beds.map(b => `<tr><td>${b.wardId || 'General'}</td><td>${b.bedNumber}</td><td>${b.status}</td></tr>`).join('');
    }
}

async function loadInventory() {
    window.inventoryLoaded = true;
    const res = await window.NexCareAPI.Inventory.getAll();
    const inv = (res.data || []).filter(i => i.hospitalId === currentHospitalId);
    
    const tbody = document.getElementById('inventoryTable');
    if (inv.length === 0) {
        tbody.innerHTML = `<tr class="empty-state"><td colspan="4">No inventory data.</td></tr>`;
    } else {
        tbody.innerHTML = inv.map(i => `<tr><td>${i.itemName}</td><td>${i.category}</td><td>${i.quantity}</td><td>${i.status}</td></tr>`).join('');
    }
}

async function loadAmbulances() {
    window.ambulancesLoaded = true;
    const res = await window.NexCareAPI.Ambulance.getAll();
    const ambs = (res.data || []).filter(a => a.hospitalId === currentHospitalId);
    
    const tbody = document.getElementById('ambulanceTable');
    if (ambs.length === 0) {
        tbody.innerHTML = `<tr class="empty-state"><td colspan="3">No ambulances assigned.</td></tr>`;
    } else {
        tbody.innerHTML = ambs.map(a => `<tr><td>${a.vehicleNumber}</td><td>${a.driverName}</td><td>${a.status}</td></tr>`).join('');
    }
}
