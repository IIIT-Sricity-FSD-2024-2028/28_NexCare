// ---------------- API HELPER ----------------
function apiGet(path) {
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    const host = window.location.hostname || 'localhost';
    return fetch(`http://${host}:3001/api${path}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    }).then(r => r.json());
}

// ---------------- LOCAL SESSION STORE (check-ins are runtime only) ----------------
const CHECKIN_KEY = 'nexcare_checkins_session';

function getCheckins() {
    try {
        return JSON.parse(sessionStorage.getItem(CHECKIN_KEY) || '[]');
    } catch { return []; }
}

function saveCheckins(checkins) {
    sessionStorage.setItem(CHECKIN_KEY, JSON.stringify(checkins));
}

function renderPatients() {
    const container = document.getElementById('patientsContainer');
    const localPatients = getCheckins();

    if (localPatients.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">No patients currently checked in today.</div>';
        return;
    }

    container.innerHTML = localPatients.map((p) => `
        <div class="card" style="margin-bottom: 24px; border: 1px solid #E5E7EB; padding: 20px; border-radius: 12px; background: #FFF;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-weight: 700; font-size: 18px; color: #111827;">${p.name}</div>
                    <span class="status-badge ${p.statusClass}">${p.status}</span>
                </div>
                <button class="update-btn" onclick="updateLocation('${p.id}')" style="background: transparent; color: #155DFC; border: 1.5px solid #155DFC; padding: 6px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;">Update Location</button>
            </div>
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 20px; font-family: 'JetBrains Mono', monospace;">
                ID: ${p.id} &bull; Checked in: ${p.time} &bull; &#128205; ${p.location}
            </div>
            <div>
                <div style="font-size: 12px; font-weight: 600; margin-bottom: 12px; color: #374151; letter-spacing: 0.5px; text-transform: uppercase;">Movement History</div>
                <div class="movement-timeline" style="display: flex; align-items: center; gap: 12px;">
                    ${p.history.map((h, i) => `
                        <div class="movement-step" style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                            <div class="step-icon ${h.state}">
                                ${h.state === 'completed'
                                  ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
                                  : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#155DFC" stroke-width="3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'}
                            </div>
                            <div class="step-label" style="font-size: 12px; font-weight: 500; color: #111827;">${h.label}</div>
                            <div class="step-time" style="font-size: 11px; color: #6B7280;">${h.time}</div>
                        </div>
                        ${i < p.history.length - 1 ? '<div style="color: #D1D5DB; font-size: 18px;">&rarr;</div>' : ''}
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

async function handleCheckin() {
    const patientId = document.getElementById('patientIdInput').value.trim();
    const purpose = document.getElementById('visitPurposeInput').value.trim();

    if (!patientId || !purpose) {
        alert('Please fill in both Patient ID and Visit Purpose to check them in.');
        return;
    }

    if (patientId.length < 2 || patientId.length > 32) {
        alert('Patient ID must be between 2 and 32 characters.');
        return;
    }
    if (!/^[A-Za-z0-9-]+$/.test(patientId)) {
        alert('Patient ID can only contain letters, numbers, and hyphens (e.g., P001 or PAT-2026-001).');
        return;
    }
    if (purpose.length < 3 || purpose.length > 80) {
        alert('Visit purpose must be between 3 and 80 characters.');
        return;
    }

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Validate patient exists in backend
    let displayName = patientId;
    let foundPatientId = patientId;
    try {
        const resp = await apiGet('/patients');
        const patients = resp.data || [];
        const foundPatient = patients.find(p =>
            p.id.toLowerCase() === patientId.toLowerCase() ||
            (p.patientIdDisplay && p.patientIdDisplay.toLowerCase() === patientId.toLowerCase())
        );
        if (foundPatient) {
            displayName = foundPatient.fullName;
            foundPatientId = foundPatient.id;
        }
    } catch (err) {
        console.warn('Patient lookup failed, proceeding with input ID:', err);
    }

    const currentCheckins = getCheckins();

    // Prevent duplicate active check-in
    const existing = currentCheckins.find(c =>
        String(c.patientId || '').toLowerCase() === foundPatientId.toLowerCase() &&
        String(c.status || '').toLowerCase() !== 'completed'
    );
    if (existing) {
        alert(`This patient is already checked in (Check-in ID: ${existing.id}).`);
        return;
    }

    const newCheckin = {
        id: "C" + Math.floor(Math.random() * 9000 + 1000),
        patientId: foundPatientId,
        name: displayName,
        status: "Waiting",
        statusClass: "status-waiting",
        time: timeNow,
        location: "Reception",
        history: [
            { label: "Reception", time: timeNow, state: "completed" }
        ]
    };

    currentCheckins.unshift(newCheckin);
    saveCheckins(currentCheckins);
    renderPatients();

    if (window.NexCareStore) {
        window.NexCareStore.logActivity('Create', 'Patient Check-in', `Patient ${displayName} checked in for: ${purpose}`);
    }

    alert(`Successfully checked in patient ${displayName} for ${purpose}`);

    document.getElementById('patientIdInput').value = '';
    document.getElementById('visitPurposeInput').value = '';
}

function updateLocation(checkinId) {
    const currentCheckins = getCheckins();
    const p = currentCheckins.find(pat => pat.id === checkinId);
    if (!p) return;

    const loc = prompt(`Update current location for ${p.name}:`);
    if (loc && loc.trim() !== '') {
        const updatedHistory = p.history.map(h => {
            if (h.state === 'waiting') return { ...h, state: 'completed' };
            return h;
        });

        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        updatedHistory.push({ label: loc, time: timeNow, state: 'waiting' });

        let finalStatus = "Moving";
        let finalClass = "status-waiting";
        if (loc.toLowerCase().includes("consultation")) { finalStatus = "In Consultation"; finalClass = "status-consultation"; }
        if (loc.toLowerCase().includes("er")) { finalStatus = "In ER"; finalClass = "status-er"; }

        const idx = currentCheckins.findIndex(c => c.id === checkinId);
        if (idx > -1) {
            currentCheckins[idx] = { ...currentCheckins[idx], location: loc, history: updatedHistory, status: finalStatus, statusClass: finalClass };
            saveCheckins(currentCheckins);
        }

        renderPatients();
    }
}

document.addEventListener('DOMContentLoaded', renderPatients);
