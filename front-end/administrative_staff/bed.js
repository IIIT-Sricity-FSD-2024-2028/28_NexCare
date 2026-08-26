// ---------------- API HELPER ----------------
function apiGet(path) {
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    const host = window.location.hostname || 'localhost';
    return fetch(`http://${host}:3001/api${path}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    }).then(r => r.json());
}

// Rejects with the API's own message so middleware errors (e.g. an illegal bed
// status transition) can be shown to the user instead of being swallowed.
async function apiRequest(method, path, body) {
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    const host = window.location.hostname || 'localhost';
    const res = await fetch(`http://${host}:3001/api${path}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok || payload.success === false) {
        throw new Error(payload.message || `Request failed (${res.status})`);
    }
    return payload;
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

        // Hospital-wide stat cards
        renderBedStats();

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

// ---------------- LIVE STAT CARDS ----------------
// Recomputed from the freshly fetched bed list after every status change,
// so the totals always match what the API reports.
function countByStatus(beds, status) {
    return beds.filter(b => (b.status || 'available').toLowerCase() === status).length;
}

function renderBedStats() {
    const container = document.getElementById('bedStats');
    if (!container) return;

    const total = bedsCache.length;
    const available = countByStatus(bedsCache, 'available');
    const occupied = countByStatus(bedsCache, 'occupied');
    const critical = countByStatus(bedsCache, 'critical');
    const maintenance = countByStatus(bedsCache, 'maintenance');
    const occupancyRate = total > 0 ? Math.round(((occupied + critical) / total) * 100) : 0;

    const cards = [
        { label: 'Total Beds', value: total, note: `${occupancyRate}% occupancy`, trend: 'neutral' },
        { label: 'Available', value: available, note: 'Ready for admission', trend: available > 0 ? 'up' : 'down' },
        { label: 'Occupied', value: occupied, note: 'Patients admitted', trend: 'neutral' },
        { label: 'Critical', value: critical, note: 'Needs intensive care', trend: critical > 0 ? 'down' : 'neutral' },
        { label: 'Maintenance', value: maintenance, note: 'Out of service', trend: 'neutral' }
    ];

    container.innerHTML = cards.map(c => `
        <div class="card stat">
            <p>${c.label}</p>
            <h3>${c.value}</h3>
            <span class="trend ${c.trend}">${c.note}</span>
        </div>
    `).join('');
}

// ---------------- RENDER WARD CARDS ----------------
function renderWardCards() {
    const container = document.getElementById('wardCards');
    if (!container) return;

    const wards = [...new Set(bedsCache.map(b => b.ward))];
    
    container.innerHTML = wards.map(ward => {
        const wardBeds = bedsCache.filter(b => b.ward === ward);
        const available = countByStatus(wardBeds, 'available');
        const occupied = countByStatus(wardBeds, 'occupied') + countByStatus(wardBeds, 'critical');
        const total = wardBeds.length;

        const borderStyle = ward === currentWard ? 'border: 2px solid #2563EB;' : 'border: 1px solid #E5E7EB;';

        return `
            <div class="card stat" style="cursor: pointer; ${borderStyle}" onclick="window.selectWard('${ward}')">
                <p>${ward} Ward</p>
                <h3>${total} Beds</h3>
                <span class="trend ${available > 0 ? 'up' : 'down'}">${available} Available • ${occupied} Occupied</span>
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
    const available = countByStatus(wardBeds, 'available');
    const maintenance = countByStatus(wardBeds, 'maintenance');
    const total = wardBeds.length;
    const occupied = countByStatus(wardBeds, 'occupied') + countByStatus(wardBeds, 'critical');

    document.getElementById('wardTitle').textContent = `${ward} Ward`;
    document.getElementById('wardMeta').textContent = `Total Beds: ${total}${maintenance ? ` • ${maintenance} under maintenance` : ''}`;
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

// Mirrors BedStatusChangeMiddleware on the backend — shown as a hint only.
// The API remains the authority and rejects illegal transitions with a 400.
const ALLOWED_TRANSITIONS = {
    available: ['occupied', 'maintenance'],
    occupied: ['critical', 'available'],
    critical: ['occupied', 'available'],
    maintenance: ['available']
};

window.openUpdateModal = function(bedId) {
    selectedBedId = bedId;
    const bed = bedsCache.find(b => b.id === bedId);
    if (!bed) return;

    document.getElementById('patientId').value = '';
    document.getElementById('patientName').value = bed.patient || '';

    const current = (bed.status || 'available').toLowerCase();
    const statusSelect = document.getElementById('status');
    if (statusSelect) {
        statusSelect.value = current;
    }

    const hint = document.getElementById('bedModalHint');
    if (hint) {
        const allowed = ALLOWED_TRANSITIONS[current] || [];
        hint.textContent = `Bed ${bed.id} is currently ${current}. Allowed next: ${allowed.join(', ') || 'none'}.`;
    }
    showBedError('');

    document.getElementById('modal').classList.add('active');
}

function showBedError(message) {
    const box = document.getElementById('bedModalError');
    if (!box) {
        if (message) alert(message);
        return;
    }
    box.textContent = message;
    box.style.display = message ? 'block' : 'none';
}

window.closeModal = function() {
    selectedBedId = null;
    showBedError('');
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

/**
 * Send a status change through the dedicated bed endpoints so it passes
 * BedStatusChangeMiddleware:
 *   allocate -> occupied, release -> available, everything else via /status.
 */
async function applyStatusChange(bed, target, patientName) {
    const id = bed.id;
    const current = (bed.status || 'available').toLowerCase();

    // Status unchanged — the only thing that can differ is the patient
    if (target === current) {
        if ((target === 'occupied' || target === 'critical') && patientName && patientName !== bed.patient) {
            await apiRequest('PUT', `/beds/${id}`, { status: target, patient: patientName });
        }
        return;
    }

    if (target === 'available') {
        // A bed holding a patient is freed by releasing it
        if (current === 'occupied' || current === 'critical') {
            await apiRequest('PATCH', `/beds/${id}/release`);
        } else {
            await apiRequest('PATCH', `/beds/${id}/status`, { status: 'available' });
        }
        return;
    }

    if (target === 'occupied' || target === 'critical') {
        // No patient on the bed yet: allocate first, then escalate if needed.
        // From maintenance the allocate call is what the middleware rejects,
        // and its message explains the required maintenance -> available step.
        if (!bed.patient) {
            await apiRequest('PATCH', `/beds/${id}/allocate`, { patientId: patientName });
            if (target === 'critical') {
                await apiRequest('PATCH', `/beds/${id}/status`, { status: 'critical' });
            }
            return;
        }

        // Patient already on the bed — update the name first if it changed
        if (patientName && patientName !== bed.patient) {
            await apiRequest('PUT', `/beds/${id}`, { status: current, patient: patientName });
        }
        await apiRequest('PATCH', `/beds/${id}/status`, { status: target });
        return;
    }

    // maintenance (rejected by the middleware while a patient is assigned)
    await apiRequest('PATCH', `/beds/${id}/status`, { status: target });
}

window.saveBed = async function() {
    if (!selectedBedId) return;

    const bed = bedsCache.find(b => b.id === selectedBedId);
    if (!bed) return;

    const status = document.getElementById('status').value;
    const patientName = document.getElementById('patientName').value.trim();

    if ((status === 'occupied' || status === 'critical') && !patientName) {
        showBedError('Occupied or Critical beds must have a patient assigned.');
        return;
    }

    showBedError('');

    try {
        await applyStatusChange(bed, status, patientName);
        await loadData(); // Reload from the API so the stat cards match the server
        closeModal();
    } catch (err) {
        console.error('Failed to update bed:', err);
        // Surfaces the middleware's transition message, e.g.
        // "Illegal bed status transition: maintenance -> occupied. ..."
        showBedError(err.message || 'Failed to update bed. Please try again.');
        await loadData();
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
        alert(err.message || 'Failed to admit patient. Please try again.');
    }
}
