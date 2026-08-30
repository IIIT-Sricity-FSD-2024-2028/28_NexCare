let currentHospitalId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentHospitalId = urlParams.get('id');

    // Reached without ?id= — go back to the dashboard rather than trapping the user
    // behind an alert. pageLink() matters here: static hosts like `serve`
    // 301-redirect /page.html to /page and drop the query string.
    if (!currentHospitalId) {
        window.location.replace(pageLink('dashboard'));
        return;
    }

    const userDataStr = sessionStorage.getItem('nexcare_user_data');
    if (userDataStr) {
        const user = JSON.parse(userDataStr);
        document.getElementById('userInitials').textContent = (user.name || 'RO').substring(0, 2).toUpperCase();
        document.getElementById('userNameDisplay').textContent = user.name || 'Regional Officer';
    }

    bindTabClicks();
    await loadHospitalDetails();
});

function bindTabClicks() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            if (tabId) switchTab(tabId, tab);
        });
    });
}

function switchTab(tabId, clickedTab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));

    const tabEl = clickedTab || document.querySelector(`.tab[data-tab="${tabId}"]`);
    if (tabEl) tabEl.classList.add('active');

    const panel = document.getElementById(tabId);
    if (panel) panel.classList.add('active');

    if (tabId === 'staff') loadStaff();
    if (tabId === 'beds') loadBeds();
    if (tabId === 'inventory') loadInventory();
    if (tabId === 'ambulances') loadAmbulances();
}

/** Fill an optional overview row, tolerating fields older hospital records lack. */
function setIfPresent(elementId, value) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = (value === undefined || value === null || value === '') ? 'N/A' : value;
}

function setStatCard(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

async function loadHospitalDetails() {
    try {
        const hRes = await window.NexCareAPI.Hospitals.getById(currentHospitalId);
        if (!hRes.success || !hRes.data) {
            document.getElementById('hospitalName').textContent = hRes.message || 'Hospital Not Found';
            document.getElementById('hospitalAddress').textContent = hRes.message || 'Unable to load this hospital.';
            return;
        }

        const hospital = hRes.data;

        document.getElementById('hospitalName').textContent = hospital.name;
        document.getElementById('hospitalAddress').textContent = `${hospital.address || ''}, ${hospital.city || ''}, ${hospital.state || ''} - ${hospital.pincode || ''}`;
        document.getElementById('hospitalType').textContent = hospital.type || 'N/A';
        document.getElementById('hospitalStatus').textContent = hospital.verificationStatus === 'verified' ? 'Verified' : 'Pending';

        document.getElementById('overviewReg').textContent = hospital.registrationNumber || 'N/A';
        document.getElementById('overviewPhone').textContent = hospital.phone || 'N/A';
        document.getElementById('overviewEmail').textContent = hospital.email || 'N/A';
        document.getElementById('overviewAdmin').textContent = hospital.adminName || 'N/A';
        document.getElementById('overviewEmergency').textContent = hospital.emergency24x7 ? 'Yes' : 'No';
        setIfPresent('overviewAccreditation', hospital.accreditation);
        setIfPresent('overviewEstablished', hospital.establishedYear);
        setIfPresent('overviewDepartments', hospital.departmentsCount);
        setIfPresent('overviewTheatres', hospital.operationTheatres);
        setIfPresent('overviewAmbulances', hospital.ambulanceCount);

        // Fetch actual bed counts from database instead of using static hospital record
        let beds = [];
        let inventory = [];
        
        try {
            const bedsRes = await window.NexCareAPI.get(`/hospitals/${encodeURIComponent(currentHospitalId)}/beds`);
            if (bedsRes.success && bedsRes.data) {
                beds = bedsRes.data;
            }
        } catch (bedErr) {
            console.warn('Failed to load beds data:', bedErr);
        }

        try {
            const inventoryRes = await window.NexCareAPI.get(`/hospitals/${encodeURIComponent(currentHospitalId)}/inventory`);
            if (inventoryRes.success && inventoryRes.data) {
                inventory = inventoryRes.data;
            }
        } catch (invErr) {
            console.warn('Failed to load inventory data:', invErr);
        }

        // Calculate actual bed counts
        const totalBeds = beds.length;
        const availableBeds = beds.filter(b => (b.status || '').toLowerCase() === 'available').length;
        const icuBeds = beds.filter(b => (b.ward || '').toLowerCase() === 'icu').length;
        const occupiedBeds = beds.filter(b => (b.status || '').toLowerCase() === 'occupied').length;

        // Update UI with actual data
        document.getElementById('overviewBeds').textContent = totalBeds;
        document.getElementById('overviewIcu').textContent = icuBeds;
        document.getElementById('overviewAvailableBeds').textContent = availableBeds;
        
        const inventoryCount = inventory.length;
        document.getElementById('overviewInventory').textContent = inventoryCount;

        const specs = Array.isArray(hospital.specialities) ? hospital.specialities.join(', ') : (hospital.speciality || 'N/A');
        setStatCard('overviewStatsSummary', `${totalBeds} Total Beds · ${icuBeds} ICU · ${availableBeds} Available · ${inventoryCount} Inventory Items · ${specs}`);
    } catch (err) {
        console.error(err);
        document.getElementById('hospitalName').textContent = 'Failed to load hospital';
    }
}

function hospitalMatches(record) {
    if (!record) return false;
    const hid = record.hospitalId || record.hospital_id;
    if (!hid) return true;
    return hid === currentHospitalId;
}

async function loadStaff() {
    const tbody = document.getElementById('staffTable');
    tbody.innerHTML = `<tr class="empty-state"><td colspan="3">Loading doctors...</td></tr>`;

    const res = await window.NexCareAPI.get(
        `/hospitals/${encodeURIComponent(currentHospitalId)}/doctors`
    );

    if (!res.success) {
        setStatCard('staffStatsSummary', 'Unable to load doctors');
        tbody.innerHTML = `<tr class="empty-state"><td colspan="3">${res.message || 'Failed to load doctors.'}</td></tr>`;
        return;
    }

    const doctors = (res.data || []).filter(u => {
        const role = (u.role || '').toLowerCase();
        return role === 'doctor' && hospitalMatches(u);
    });

    const onLeave = doctors.filter(d => {
        const status = (d.status || '').toLowerCase();
        return status === 'on leave' || status === 'on_leave';
    }).length;

    setStatCard('staffStatsSummary', `${doctors.length} Doctors · ${onLeave} On Leave`);

    if (doctors.length === 0) {
        tbody.innerHTML = `<tr class="empty-state"><td colspan="3">No doctors found for this hospital.</td></tr>`;
        return;
    }

    tbody.innerHTML = doctors.map(s =>
        `<tr><td>${s.name || 'N/A'}</td><td>${s.dept || s.department || s.speciality || 'Doctor'}</td><td>${s.status || 'Active'}</td></tr>`
    ).join('');
}

async function loadBeds() {
    const tbody = document.getElementById('bedsTable');
    tbody.innerHTML = `<tr class="empty-state"><td colspan="3">Loading beds...</td></tr>`;

    const res = await window.NexCareAPI.get(
        `/hospitals/${encodeURIComponent(currentHospitalId)}/beds`
    );

    if (!res.success) {
        setStatCard('bedsStatsSummary', 'Unable to load beds');
        tbody.innerHTML = `<tr class="empty-state"><td colspan="3">${res.message || 'Failed to load beds.'}</td></tr>`;
        return;
    }

    const beds = (res.data || []).filter(hospitalMatches);
    const available = beds.filter(b => (b.status || '').toLowerCase() === 'available').length;
    const occupied = beds.filter(b => (b.status || '').toLowerCase() === 'occupied').length;
    const maintenance = beds.filter(b => (b.status || '').toLowerCase() === 'maintenance').length;
    const icuBeds = beds.filter(b => (b.ward || '').toLowerCase() === 'icu').length;

    setStatCard('bedsStatsSummary', `${beds.length} Beds · ${available} Available · ${occupied} Occupied · ${maintenance} Maintenance`);

    // Update overview counts to stay consistent
    document.getElementById('overviewBeds').textContent = beds.length;
    document.getElementById('overviewIcu').textContent = icuBeds;
    document.getElementById('overviewAvailableBeds').textContent = available;

    if (beds.length === 0) {
        tbody.innerHTML = `<tr class="empty-state"><td colspan="3">No beds configured.</td></tr>`;
        return;
    }

    tbody.innerHTML = beds.map(b =>
        `<tr><td>${b.ward || b.wardId || 'General'}</td><td>${b.bedNumber || b.id || 'N/A'}</td><td>${b.status || 'N/A'}</td></tr>`
    ).join('');
}

async function loadInventory() {
    const tbody = document.getElementById('inventoryTable');
    tbody.innerHTML = `<tr class="empty-state"><td colspan="4">Loading inventory...</td></tr>`;

    const res = await window.NexCareAPI.get(
        `/hospitals/${encodeURIComponent(currentHospitalId)}/inventory`
    );

    if (!res.success) {
        setStatCard('inventoryStatsSummary', 'Unable to load inventory');
        tbody.innerHTML = `<tr class="empty-state"><td colspan="4">${res.message || 'Failed to load inventory.'}</td></tr>`;
        return;
    }

    const inv = (res.data || []).filter(hospitalMatches);
    const low = inv.filter(i => {
        const status = (i.status || '').toLowerCase();
        return status.includes('low') || status.includes('out') || status === 'critical';
    }).length;

    setStatCard('inventoryStatsSummary', `${inv.length} Items · ${low} Low / Out of Stock`);

    // Update overview inventory count to stay consistent
    document.getElementById('overviewInventory').textContent = inv.length;

    if (inv.length === 0) {
        tbody.innerHTML = `<tr class="empty-state"><td colspan="4">No inventory data.</td></tr>`;
        return;
    }

    tbody.innerHTML = inv.map(i =>
        `<tr><td>${i.itemName || i.name || 'N/A'}</td><td>${i.category || 'N/A'}</td><td>${i.quantity ?? 0}</td><td>${i.status || 'N/A'}</td></tr>`
    ).join('');
}

async function loadAmbulances() {
    const tbody = document.getElementById('ambulanceTable');
    tbody.innerHTML = `<tr class="empty-state"><td colspan="3">Loading ambulances...</td></tr>`;

    const res = await window.NexCareAPI.get(
        `/hospitals/${encodeURIComponent(currentHospitalId)}/ambulances`
    );

    if (!res.success) {
        setStatCard('ambulanceStatsSummary', 'Unable to load ambulances');
        tbody.innerHTML = `<tr class="empty-state"><td colspan="3">${res.message || 'Failed to load ambulances.'}</td></tr>`;
        return;
    }

    const ambs = (res.data || []).filter(hospitalMatches);
    setStatCard('ambulanceStatsSummary', `${ambs.length} Ambulance Records`);

    if (ambs.length === 0) {
        tbody.innerHTML = `<tr class="empty-state"><td colspan="3">No ambulances assigned.</td></tr>`;
        return;
    }

    tbody.innerHTML = ambs.map(a =>
        `<tr><td>${a.vehicleNumber || a.id || 'N/A'}</td><td>${a.driverName || a.patientName || 'N/A'}</td><td>${a.status || 'N/A'}</td></tr>`
    ).join('');
}
