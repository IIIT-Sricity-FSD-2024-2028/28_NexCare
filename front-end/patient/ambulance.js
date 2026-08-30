// Ambulance Request Page Functionality

document.addEventListener('DOMContentLoaded', function() {
    const ambulanceForm = document.getElementById('ambulanceForm');
    
    if (ambulanceForm) {
        ambulanceForm.addEventListener('submit', handleAmbulanceRequest);
    }

    populateHospitalChoices();
    renderAmbulanceRequests();

    const tbody = document.querySelector('.status-table tbody');
    if (tbody) {
        tbody.addEventListener('click', handleAmbulanceTableClick);
    }

    prefetchPatientData();
});


function getPatientIdFromToken() {
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload.patientId || payload.sub;
    } catch(e) { return null; }
}

async function prefetchPatientData() {
    const patientId = getPatientIdFromToken();
    if (!patientId) return;
    try {
        const res = await window.NexCareAPI.Patients.getById(patientId);
        const patient = res.data;
        if (patient && patient.phone) {
        const contactInput = document.getElementById('contactNumber');
        if (contactInput) {
            contactInput.value = patient.phone;
        }
    }
    } catch (err) { console.error("Failed to prefetch patient", err); }
}

function handleAmbulanceRequest(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const location = formData.get('pickupLocation');
    const contact = formData.get('contactNumber');
    const notes = formData.get('additionalNotes');
    
    if (!location || !contact) {
        showNexCareModal('Missing Information', 'Please fill in all required fields to request an ambulance.', { isError: true });
        return;
    }
    
    // Strict Phone Validation (Exactly 10 digits, no spaces/letters)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(contact)) {
        showNexCareModal('Invalid Phone Number', 'Please enter a valid 10-digit phone number (e.g., 9876543210).', { isError: true });
        return;
    }
    if (/^0+$/.test(contact) || /^(\d)\1+$/.test(contact)) {
        showNexCareModal('Invalid Phone Number', 'Please enter a valid phone number (cannot be all the same digit).', { isError: true });
        return;
    }
    
    // Confirm request
    showNexCareModal('Confirm Emergency Request', 
        `Are you sure you want to dispatch an ambulance to <strong>${location}</strong>?`, 
        { 
            isConfirm: true, 
            onConfirm: () => {
                // Create request in shared store (Create)
                
                const patientId = (window.NexCareStore?.getActivePatientScope && window.NexCareStore.getActivePatientScope()) || getPatientIdFromToken() || sessionStorage.getItem('nexcare_patient_id') || 'PM-PAT-DEFAULT';
                
                let patientName = 'Unknown Patient';
                try {
                    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
                    if (token) {
                        const payload = JSON.parse(decodeURIComponent(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
                        patientName = payload.name || payload.email.split('@')[0];
                    }
                    if (patientName === 'Unknown Patient') {
                        const blob = sessionStorage.getItem('nexcare_user_data');
                        if (blob) {
                            const user = JSON.parse(blob);
                            patientName = user.name || user.email.split('@')[0];
                        }
                    }
                } catch(e) {}
                
                // The backend requires a hospital — an ambulance is dispatched from
                // one, and the patient is brought there.
                const hospitalSelect = document.getElementById('ambulanceHospital');
                const hospitalId = hospitalSelect ? hospitalSelect.value : '';
                if (!hospitalId) {
                    alert('Please choose the hospital you want the ambulance from.');
                    return;
                }

                window.NexCareAPI.Ambulance.createRequest({
                    patientId: patientId,
                    patientName: patientName,
                    hospitalId: hospitalId,
                    pickupLocation: location,
                    contact: contact,
                    notes: notes || ''
                }).then(res => {
                    const req = res.data;
                    const requestId = req?.id || ('AMB-2026-' + String(Math.floor(Math.random() * 900 + 100)).padStart(3, '0'));

                
                // Show success modal
                showNexCareModal('Request Submitted!', 
                    'Your ambulance request has been dispatched successfully.', 
                    { 
                        details: `<strong>Request ID:</strong> ${requestId}<br><strong>ETA:</strong> 8-12 minutes<br><strong>Contact:</strong> ${contact}`,
                        onClose: () => {
                            e.target.reset();
                            renderAmbulanceRequests();
                        }
                    }
                );
            }).catch(err => {
                showNexCareModal('Error', 'Failed to dispatch ambulance.', { isError: true });
            });
            }
        }
    );
}

async function renderAmbulanceRequests() {
    const tbody = document.querySelector('.status-table tbody');
    if (!tbody) return;
    const patientId = getPatientIdFromToken();
    let rows = [];
    if (patientId) {
        try {
            const res = await window.NexCareAPI.get(`/ambulance/patient/${patientId}`);
            rows = res.data || [];
            // Sort by createdAt desc
            rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch(err) {
            console.error('Failed to load requests', err);
        }
    }


    function badge(status) {
        if (status === 'Completed') return 'badge-completed';
        if (status === 'Pending') return 'badge-pending';
        if (status === 'Canceled' || status === 'Cancelled') return 'badge-canceled';
        if (status === 'Dispatched') return 'badge-dispatched';
        if (status === 'En Route') return 'badge-enroute';
        if (status === 'Picked Up') return 'badge-pickedup';
        if (status === 'At Hospital') return 'badge-athospital';
        return 'badge-gray';
    }

    function formatWhen(iso) {
        const d = new Date(iso);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        return `${dateStr} - ${timeStr}`;
    }

    tbody.innerHTML = rows.map(r => `
        <tr data-id="${r.id}">
            <td>${r.id}</td>
            <td>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="display:inline-block; margin-right:6px; vertical-align:middle;">
                    <circle cx="8" cy="8" r="6" stroke="#6A7282" stroke-width="1.33"/>
                    <path d="M8 4v4l2.667 1.333" stroke="#6A7282" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                ${formatWhen(r.createdAt)}
            </td>
            <td>${r.pickupLocation}</td>
            <td>${r.contact}</td>
            <td><span class="badge ${badge(r.status)}">${r.status}</span></td>
            <td>
                ${r.status === 'Pending' || r.status === 'Dispatched' || r.status === 'En Route'
                    ? `<button type="button" class="btn-primary-sm" data-action="cancel">Cancel</button>`
                    : `<span class="badge badge-gray" style="font-size:11px;">${
                          r.status === 'Completed' ? 'Completed'
                        : r.status === 'Cancelled' ? 'Cancelled'
                        : 'In Progress'}</span>`
                }
            </td>
        </tr>
    `).join('');
}

function handleAmbulanceTableClick(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const tr = e.target.closest('tr[data-id]');
    if (!tr) return;

    const id = tr.dataset.id;
    const action = btn.dataset.action;
    
    if (action === 'cancel') {
        showNexCareModal('Cancel Request', 'Are you sure you want to cancel this ambulance request?', {
            isConfirm: true,
            onConfirm: async () => {
                // This used to PATCH the status to 'Canceled' — one L, which is
                // not the AmbulanceStatus enum value ('Cancelled'), so the row
                // ended up in a state nothing else recognised. That is also why
                // the table above used to test for both spellings.
                const res = await window.NexCareAPI.Ambulance.cancelRequest(id);
                if (res && res.success === false) {
                    showNexCareModal('Could not cancel', res.message || 'The request could not be cancelled.');
                }
                renderAmbulanceRequests();
            }
        });
        return;
    }

    // The Delete action is gone: a completed or cancelled trip is the record of
    // what happened. Cancellation keeps the row now, and the hard delete is
    // staff-only.
}

/**
 * Modern NexCare Modal System (FR-15)
 * Replaces ugly browser alerts/confirms with premium glassmorphic popups
 */
function showNexCareModal(title, message, options = {}) {
    const { isError = false, isConfirm = false, onConfirm, onClose, details } = options;
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'nexcare-modal-overlay';
    
    // Build Modal HTML
    overlay.innerHTML = `
        <div class="nexcare-modal-container">
            <div class="modal-icon-container ${isError ? 'error' : ''}">
                ${isError ? '✕' : (isConfirm ? '❓' : '✓')}
            </div>
            <h2 class="nexcare-modal-title">${title}</h2>
            <p class="nexcare-modal-message">${message}</p>
            ${details ? `<div class="modal-details-box">${details}</div>` : ''}
            
            <div style="display: flex; gap: 12px;">
                ${isConfirm ? `
                    <button class="btn-modal-close" style="background:#E2E8F0; color:#475569;" id="modalCancel">No, Back</button>
                    <button class="btn-modal-close" id="modalConfirm">Yes, Proceed</button>
                ` : `
                    <button class="btn-modal-close" id="modalClose">Great, Thanks!</button>
                `}
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Focus management
    const mainBtn = overlay.querySelector('#modalConfirm') || overlay.querySelector('#modalClose');
    if (mainBtn) mainBtn.focus();

    // Event Handlers
    const close = () => {
        overlay.style.animation = 'modal-fade-in 0.2s ease reverse forwards';
        overlay.querySelector('.nexcare-modal-container').style.animation = 'modal-pop-up 0.2s ease reverse forwards';
        setTimeout(() => {
            overlay.remove();
            if (onClose) onClose();
        }, 200);
    };

    if (overlay.querySelector('#modalClose')) {
        overlay.querySelector('#modalClose').onclick = close;
    }
    
    if (overlay.querySelector('#modalCancel')) {
        overlay.querySelector('#modalCancel').onclick = close;
    }

    if (overlay.querySelector('#modalConfirm')) {
        overlay.querySelector('#modalConfirm').onclick = () => {
            close();
            if (onConfirm) onConfirm();
        };
    }

    // Close on background click
    overlay.onclick = (e) => {
        if (e.target === overlay && !isConfirm) close();
    };
}

// Legacy helper (kept to avoid breaking any old calls)
function addRequestToTable(requestId, location, contact) {
    const tbody = document.querySelector('.status-table tbody');
    if (!tbody) return;
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
    const timeStr = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
    });
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${requestId}</td>
        <td>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="display:inline-block; margin-right:6px; vertical-align:middle;">
                <circle cx="8" cy="8" r="6" stroke="#6A7282" stroke-width="1.33"/>
                <path d="M8 4v4l2.667 1.333" stroke="#6A7282" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            ${dateStr} - ${timeStr}
        </td>
        <td>${location}</td>
        <td>${contact}</td>
        <td><span class="badge badge-pending">Pending</span></td>
    `;
    
    tbody.insertBefore(row, tbody.firstChild);
}

/**
 * Fill the hospital picker on the ambulance form.
 *
 * Prefers hospitals in the patient's own city (the same "nearby" filter the rest
 * of the patient portal uses) and falls back to the full verified list, so the
 * form is never left unusable.
 */
async function populateHospitalChoices() {
    const select = document.getElementById('ambulanceHospital');
    if (!select || !window.NexCareAPI) return;

    const city = getPatientCity();

    try {
        let hospitals = [];

        if (city) {
            const nearby = await window.NexCareAPI.Hospitals.getNearby(city);
            if (nearby.success) hospitals = nearby.data || [];
        }
        if (!hospitals.length) {
            const all = await window.NexCareAPI.Hospitals.getAll();
            if (all.success) hospitals = all.data || [];
        }

        hospitals = hospitals.filter(h => (h.verificationStatus || 'verified') === 'verified');

        if (!hospitals.length) {
            select.innerHTML = '<option value="" disabled selected>No hospitals available</option>';
            return;
        }

        select.innerHTML = hospitals
            .map((h, i) => `<option value="${h.id}"${i === 0 ? ' selected' : ''}>${h.name}${h.city ? ' — ' + h.city : ''}</option>`)
            .join('');
    } catch (err) {
        console.warn('Could not load hospitals for the ambulance form:', err);
        select.innerHTML = '<option value="" disabled selected>Could not load hospitals</option>';
    }
}

/** The signed-in patient's city, from the stored user or the JWT. */
function getPatientCity() {
    try {
        const blob = sessionStorage.getItem('nexcare_user_data');
        if (blob) {
            const u = JSON.parse(blob);
            if (u.city) return u.city;
        }
    } catch (e) { /* fall through to the token */ }
    try {
        const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
        if (!token) return null;
        return JSON.parse(atob(token.split('.')[1])).city || null;
    } catch (e) {
        return null;
    }
}
