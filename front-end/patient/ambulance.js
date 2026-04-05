// Ambulance Request Page Functionality

document.addEventListener('DOMContentLoaded', function() {
    const ambulanceForm = document.getElementById('ambulanceForm');
    
    if (ambulanceForm) {
        ambulanceForm.addEventListener('submit', handleAmbulanceRequest);
    }

    renderAmbulanceRequests();

    if (tbody) {
        tbody.addEventListener('click', handleAmbulanceTableClick);
    }

    prefetchPatientData();
});

function prefetchPatientData() {
    const store = window.NexCareStore;
    if (!store) return;

    const patient = store.getActivePatient();
    if (patient && patient.phone) {
        const contactInput = document.getElementById('contactNumber');
        if (contactInput) {
            contactInput.value = patient.phone;
        }
    }
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
                const req = window.NexCareStore?.createAmbulanceRequest({
                    pickupLocation: location,
                    contact,
                    notes
                });
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
            }
        }
    );
}

function renderAmbulanceRequests() {
    const store = window.NexCareStore;
    const tbody = document.querySelector('.status-table tbody');
    if (!store || !tbody) return;

    const rows = store.listAmbulanceRequests();

    function badge(status) {
        if (status === 'Completed') return 'badge-completed';
        if (status === 'Pending') return 'badge-pending';
        if (status === 'Canceled') return 'badge-canceled';
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
                ${r.status === 'Pending'
                    ? `<button type="button" class="btn-primary-sm" data-action="cancel">Cancel</button>`
                    : `<button type="button" class="btn-outline-sm" data-action="delete">Delete</button>`
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
    const store = window.NexCareStore;
    if (!store) return;

    if (action === 'cancel') {
        showNexCareModal('Cancel Request', 'Are you sure you want to cancel this ambulance request?', {
            isConfirm: true,
            onConfirm: () => {
                store.updateAmbulanceRequest(id, { status: 'Canceled' });
                renderAmbulanceRequests();
            }
        });
        return;
    }

    if (action === 'delete') {
        showNexCareModal('Delete History', 'Are you sure you want to delete this record permanently?', {
            isConfirm: true,
            onConfirm: () => {
                store.deleteAmbulanceRequest(id);
                renderAmbulanceRequests();
            }
        });
        return;
    }
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
