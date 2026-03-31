// Ambulance Request Page Functionality

document.addEventListener('DOMContentLoaded', function() {
    const ambulanceForm = document.getElementById('ambulanceForm');
    
    if (ambulanceForm) {
        ambulanceForm.addEventListener('submit', handleAmbulanceRequest);
    }

    renderAmbulanceRequests();

    const tbody = document.querySelector('.status-table tbody');
    if (tbody) {
        tbody.addEventListener('click', handleAmbulanceTableClick);
    }
});

function handleAmbulanceRequest(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const location = formData.get('pickupLocation');
    const contact = formData.get('contactNumber');
    const notes = formData.get('additionalNotes');
    
    if (!location || !contact) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Confirm request
    if (confirm('⚠️ EMERGENCY AMBULANCE REQUEST\n\n' +
                `Pickup Location: ${location}\n` +
                `Contact: ${contact}\n` +
                `Notes: ${notes || 'None'}\n\n` +
                'Dispatch ambulance immediately?')) {
        
        // Create request in shared store (Create)
        const req = window.NexCareStore?.createAmbulanceRequest({
            pickupLocation: location,
            contact,
            notes
        });
        const requestId = req?.id || ('AMB-2026-' + String(Math.floor(Math.random() * 900 + 100)).padStart(3, '0'));
        
        // Show success message
        alert('✓ Ambulance Request Submitted!\n\n' +
              `Request ID: ${requestId}\n` +
              'Estimated arrival: 8-12 minutes\n' +
              'Our team will contact you shortly at ' + contact);
        
        // Clear form
        e.target.reset();
        
        renderAmbulanceRequests();
    }
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
        if (!confirm('Cancel this ambulance request?')) return;
        store.updateAmbulanceRequest(id, { status: 'Canceled' });
        renderAmbulanceRequests();
        return;
    }

    if (action === 'delete') {
        if (!confirm('Delete this request permanently?')) return;
        store.deleteAmbulanceRequest(id);
        renderAmbulanceRequests();
        return;
    }
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
