// ---------------- API HELPER ----------------
function apiGet(path) {
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    const host = window.location.hostname || 'localhost';
    return fetch(`http://${host}:3001/api${path}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    }).then(r => r.json());
}

function apiRequest(method, path, body) {
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    const host = window.location.hostname || 'localhost';
    return fetch(`http://${host}:3001/api${path}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
    }).then(r => r.json());
}

// ---------------- STATE ----------------
let bedsCache = [];
let patientsCache = [];
let currentWard = 'Emergency';
let viewMode = 'grid'; // grid or list

// ---------------- INIT ----------------
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    
    // Attach event listener for search
    document.getElementById('searchInput')?.addEventListener('input', () => {
        renderBeds(currentWard);
    });

    // Auto-fetch patient name on ID input for Admit modal
    const admitPatientIdInput = document.getElementById('admitPatientId');
    if (admitPatientIdInput) {
        admitPatientIdInput.addEventListener('input', window.fetchPatientForAdmit);
    }

    // Auto-fetch patient name on ID input for Update modal
    const updatePatientIdInput = document.getElementById('patientId');
    if (updatePatientIdInput) {
        updatePatientIdInput.addEventListener('input', window.fetchPatientForUpdate);
    }
});

async function loadData() {
    try {
        const [bedsResp, patientsResp] = await Promise.all([
            apiGet('/beds'),
            apiGet('/patients')
        ]);
        bedsCache = bedsResp.data || [];
        patientsCache = patientsResp.data || [];
        
        // Render Wards
        renderWardCards();
        
        // Render initially selected ward
        if (bedsCache.length > 0) {
            // Find wards
            const wards = [...new Set(bedsCache.map(b => b.ward))];
            if (!wards.includes(currentWard) && wards.length > 0) {
                currentWard = wards[0];
            }
        }
        
        renderWardDetails(currentWard);
        renderBeds(currentWard);

    } catch (err) {
        console.error('Failed to load bed allocation data:', err);
    }
}

// ---------------- RENDER WARD CARDS ----------------
function renderWardCards() {
    const container = document.getElementById('wardCards');
    if (!container) return;

    const wards = [...new Set(bedsCache.map(b => b.ward))];
    
    container.innerHTML = wards.map(ward => {
        const wardBeds = bedsCache.filter(b => b.ward === ward);
        const available = wardBeds.filter(b => b.status && b.status.toLowerCase() === 'available').length;
        const occupied = wardBeds.length - available;
        const total = wardBeds.length;
        
        const isActive = ward === currentWard ? 'active' : '';
        const borderStyle = ward === currentWard ? 'border: 2px solid #2563EB;' : 'border: 1px solid #E5E7EB;';
        
        return `
            <div class="card stat" style="cursor: pointer; ${borderStyle}" onclick="window.selectWard('${ward}')">
                <p>${ward} Ward</p>
                <h3>${total} Beds</h3>
                <span class="trend ${available > 0 ? 'success' : 'down'}">${available} Available • ${occupied} Occupied</span>
            </div>
        `;
    }).join('');
}

window.selectWard = function(ward) {
    currentWard = ward;
    renderWardCards();
    renderWardDetails(ward);
    renderBeds(ward);
}

// ---------------- RENDER WARD DETAILS ----------------
function renderWardDetails(ward) {
    const wardBeds = bedsCache.filter(b => b.ward === ward);
    const available = wardBeds.filter(b => b.status && b.status.toLowerCase() === 'available').length;
    const total = wardBeds.length;
    const occupied = total - available;
    
    document.getElementById('wardTitle').textContent = `${ward} Ward`;
    document.getElementById('wardMeta').textContent = `Total Beds: ${total}`;
    document.getElementById('occupiedInfo').textContent = `Occupied/Critical: ${occupied}/${total}`;
    document.getElementById('availableCount').textContent = available;
    document.getElementById('availableCount').style.color = available > 0 ? '#22c55e' : '#ef4444';
}

// ---------------- VIEW MODE ----------------
window.setView = function(mode) {
    viewMode = mode;
    renderBeds(currentWard);
}

// ---------------- RENDER BEDS ----------------
function renderBeds(ward) {
    const container = document.getElementById('bedsGrid');
    if (!container) return;
    
    const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
    
    let wardBeds = bedsCache.filter(b => b.ward === ward);
    
    if (search) {
        wardBeds = wardBeds.filter(b => {
            const patientName = (b.patient || '').toLowerCase();
            const bedId = (b.id || '').toLowerCase();
            return patientName.includes(search) || bedId.includes(search);
        });
    }

    if (wardBeds.length === 0) {
        container.innerHTML = `<div style="padding:20px; color:#666;">No beds found for ${ward}.</div>`;
        return;
    }

    if (viewMode === 'grid') {
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';
        container.style.gap = '15px';
        
        container.innerHTML = wardBeds.map(b => {
            const status = (b.status || 'available').toLowerCase();
            let colorClass = 'green';
            let statusText = 'Available';
            
            if (status === 'occupied') { colorClass = 'blue'; statusText = 'Stable'; }
            else if (status === 'critical') { colorClass = 'red'; statusText = 'Critical'; }
            else if (status === 'maintenance') { colorClass = 'gray'; statusText = 'Maintenance'; }
            
            return `
                <div class="card" style="padding: 15px; border-left: 4px solid var(--${colorClass}-500); cursor: pointer;" onclick="window.openUpdateModal('${b.id}')">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <strong>Bed ${b.id}</strong>
                        <span class="dot ${colorClass}" title="${statusText}"></span>
                    </div>
                    <div class="small" style="color: #4b5563; min-height: 20px;">
                        ${b.patient ? b.patient : '<span style="color:#9ca3af; font-style:italic;">Empty</span>'}
                    </div>
                </div>
            `;
        }).join('');
    } else {
        // List mode
        container.style.display = 'block';
        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr>
                        <th style="padding: 10px; border-bottom: 1px solid #e5e7eb;">Bed ID</th>
                        <th style="padding: 10px; border-bottom: 1px solid #e5e7eb;">Status</th>
                        <th style="padding: 10px; border-bottom: 1px solid #e5e7eb;">Patient</th>
                        <th style="padding: 10px; border-bottom: 1px solid #e5e7eb;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${wardBeds.map(b => {
                        const status = (b.status || 'available').toLowerCase();
                        let badgeColor = 'background: #dcfce7; color: #166534;';
                        if (status === 'occupied') badgeColor = 'background: #dbeafe; color: #1e40af;';
                        else if (status === 'critical') badgeColor = 'background: #fee2e2; color: #991b1b;';
                        else if (status === 'maintenance') badgeColor = 'background: #f3f4f6; color: #374151;';
                        
                        return `
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>${b.id}</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; ${badgeColor}">${status.toUpperCase()}</span>
                                </td>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${b.patient || '<span style="color:#9ca3af; font-style:italic;">None</span>'}</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                                    <button class="btn-outline" style="padding: 4px 8px; font-size: 11px;" onclick="window.openUpdateModal('${b.id}')">Manage</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }
}

// ---------------- UPDATE MODAL ----------------
let selectedBedId = null;

window.openUpdateModal = function(bedId) {
    selectedBedId = bedId;
    const bed = bedsCache.find(b => b.id === bedId);
    if (!bed) return;
    
    document.getElementById('patientId').value = '';
    document.getElementById('patientName').value = bed.patient || '';
    
    const statusSelect = document.getElementById('status');
    if (statusSelect) {
        statusSelect.value = (bed.status || 'available').toLowerCase();
    }
    
    document.getElementById('modal').classList.add('active');
}

window.closeModal = function() {
    selectedBedId = null;
    document.getElementById('modal').classList.remove('active');
}

window.fetchPatientForUpdate = function() {
    const pid = document.getElementById('patientId').value.trim();
    if (!pid) {
        document.getElementById('patientName').value = '';
        return;
    }
    
    const patient = patientsCache.find(p => p.id === pid || p.patientIdDisplay === pid);
    if (patient) {
        document.getElementById('patientName').value = patient.fullName;
    } else {
        document.getElementById('patientName').value = '';
    }
}

window.saveBed = async function() {
    if (!selectedBedId) return;
    
    const status = document.getElementById('status').value;
    const patientName = document.getElementById('patientName').value.trim();
    
    if ((status === 'occupied' || status === 'critical') && !patientName) {
        alert('Occupied or Critical beds must have a patient assigned.');
        return;
    }
    
    if (status === 'available' && patientName) {
        alert('Available beds cannot have a patient assigned. Patient will be cleared.');
    }
    
    const updateData = {
        status: status,
        patient: status === 'available' ? '' : patientName
    };
    
    try {
        await apiRequest('PUT', `/beds/${selectedBedId}`, updateData);
        await loadData(); // Reload all data to refresh UI
        closeModal();
    } catch (err) {
        console.error('Failed to update bed:', err);
        alert('Failed to update bed. Please try again.');
    }
}

// ---------------- ADMIT MODAL ----------------
window.openAdmitModal = function() {
    document.getElementById('admitPatientId').value = '';
    document.getElementById('admitName').value = '';
    
    const wardSelect = document.getElementById('admitWard');
    if (wardSelect) {
        const wards = [...new Set(bedsCache.map(b => b.ward))];
        wardSelect.innerHTML = wards.map(w => `<option value="${w}">${w} Ward</option>`).join('');
    }
    
    document.getElementById('admitModal').classList.add('active');
}

window.closeAdmitModal = function() {
    document.getElementById('admitModal').classList.remove('active');
}

window.fetchPatientForAdmit = function() {
    const pid = document.getElementById('admitPatientId').value.trim();
    if (!pid) {
        document.getElementById('admitName').value = '';
        return;
    }
    
    const patient = patientsCache.find(p => p.id === pid || p.patientIdDisplay === pid);
    if (patient) {
        document.getElementById('admitName').value = patient.fullName;
    } else {
        document.getElementById('admitName').value = '';
    }
}

window.admitPatient = async function() {
    const patientName = document.getElementById('admitName').value.trim();
    const ward = document.getElementById('admitWard').value;
    
    if (!patientName) {
        alert('Please fetch a valid patient first.');
        return;
    }
    
    // Find an available bed in the selected ward
    const availableBed = bedsCache.find(b => b.ward === ward && b.status && b.status.toLowerCase() === 'available');
    
    if (!availableBed) {
        alert(`No available beds in ${ward} Ward.`);
        return;
    }
    
    try {
        await apiRequest('PATCH', `/beds/${availableBed.id}/allocate`, { patientId: patientName });
        await loadData(); // Reload all data to refresh UI
        closeAdmitModal();
        alert(`Successfully admitted ${patientName} to Bed ${availableBed.id} in ${ward} Ward.`);
    } catch (err) {
        console.error('Failed to admit patient:', err);
        alert('Failed to admit patient. Please try again.');
    }
}
