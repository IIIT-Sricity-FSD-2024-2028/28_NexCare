// Regional Officer — hospital registration approvals.
//
// The backend already grants regional_manager PATCH /hospitals/:id/verify and
// /reject; until now there was no UI for it, so approvals could only happen
// through the superuser portal.

let allHospitals = [];

document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userInitials').textContent = (user.name || 'RO').substring(0, 2).toUpperCase();
        document.getElementById('userNameDisplay').textContent = user.name || 'Regional Officer';
    }

    document.getElementById('statusFilter').addEventListener('change', render);
    document.getElementById('searchInput').addEventListener('input', render);

    await loadHospitals();
});

async function loadHospitals() {
    try {
        const res = await window.NexCareAPI.Hospitals.getAll();
        if (!res || !res.success) throw new Error('Failed to load hospitals');
        allHospitals = res.data || [];
    } catch (err) {
        console.error(err);
        showError('Could not load registrations. Check that the backend is running.');
        return;
    }
    updateStats();
    render();
}

function updateStats() {
    const count = status => allHospitals.filter(h => normalise(h.verificationStatus) === status).length;
    setText('pendingCount', count('pending_verification'));
    setText('verifiedCount', count('verified'));
    setText('rejectedCount', count('rejected'));
}

function render() {
    const status = document.getElementById('statusFilter').value;
    const term = document.getElementById('searchInput').value.trim().toLowerCase();

    const rows = allHospitals.filter(h => {
        const matchesStatus = status === 'all' || normalise(h.verificationStatus) === status;
        const haystack = `${h.name || ''} ${h.city || ''} ${h.registrationNumber || ''}`.toLowerCase();
        return matchesStatus && (!term || haystack.includes(term));
    });

    const tbody = document.getElementById('approvalsTableBody');
    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#6A7282;">No registrations match this filter.</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map(h => {
        const st = normalise(h.verificationStatus);
        const pending = st === 'pending_verification';
        return `
        <tr>
            <td class="actor-cell">
                ${esc(h.name)}
                <div class="muted">${esc(h.registrationNumber || 'No reg. number')} &middot; ${esc(h.type || 'N/A')}</div>
            </td>
            <td>
                ${esc(h.city || 'N/A')}
                <div class="muted">${esc(h.state || '')}${h.pincode ? ' - ' + esc(h.pincode) : ''}</div>
            </td>
            <td>
                ${h.totalBeds || 0} beds
                <div class="muted">${h.icuBeds || 0} ICU${h.emergency24x7 ? ' &middot; 24x7 ER' : ''}</div>
            </td>
            <td>
                ${esc(h.adminName || 'N/A')}
                <div class="muted">${esc(h.adminPhone || h.phone || '')}</div>
            </td>
            <td><span class="pill ${st === 'verified' ? 'resolved' : st === 'rejected' ? 'urgent' : 'open'}">${esc(label(st))}</span></td>
            <td>
                ${pending ? `
                    <div style="display:flex; gap:6px;">
                        <button class="btn-sm btn-approve" onclick="decide('${esc(h.id)}','verify')">Approve</button>
                        <button class="btn-sm btn-reject" onclick="decide('${esc(h.id)}','reject')">Reject</button>
                    </div>
                ` : `<span class="muted">No action needed</span>`}
            </td>
        </tr>`;
    }).join('');
}

async function decide(hospitalId, action) {
    const hospital = allHospitals.find(h => h.id === hospitalId);
    const name = hospital ? hospital.name : hospitalId;
    const verb = action === 'verify' ? 'Approve' : 'Reject';

    if (!confirm(`${verb} the registration for ${name}?`)) return;

    // Show loading state
    const hideLoading = window.NexCareUI && window.NexCareUI.showLoading 
        ? window.NexCareUI.showLoading(`${verb}ing registration...`) 
        : null;

    try {
        const res = action === 'verify'
            ? await window.NexCareAPI.Hospitals.verify(hospitalId)
            : await window.NexCareAPI.Hospitals.reject(hospitalId);

        if (hideLoading) hideLoading();

        if (!res || !res.success) {
            const errorMsg = (res && res.message) || `Failed to ${action} registration. Please try again.`;
            notify(errorMsg, 'error');
            return;
        }

        if (hospital) {
            hospital.verificationStatus = action === 'verify' ? 'verified' : 'rejected';
        }
        updateStats();
        render();
        notify(`${name} ${action === 'verify' ? 'approved' : 'rejected'} successfully`, 'success');
    } catch (err) {
        if (hideLoading) hideLoading();
        console.error(err);
        notify(`Failed to ${action} registration. Please check your connection and try again.`, 'error');
    }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function normalise(status) {
    const s = String(status || '').toLowerCase();
    return s === 'pending' ? 'pending_verification' : s;
}

function label(status) {
    return status === 'pending_verification' ? 'awaiting review' : status.replace(/_/g, ' ');
}

function getCurrentUser() {
    try {
        const raw = sessionStorage.getItem('nexcare_user_data');
        if (raw) return JSON.parse(raw);
    } catch (e) { /* fall through to the token */ }
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    if (!token) return null;
    try {
        const p = JSON.parse(atob(token.split('.')[1]));
        return { id: p.sub, name: p.name, role: p.role };
    } catch (e) {
        return null;
    }
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function showError(message) {
    document.getElementById('approvalsTableBody').innerHTML =
        `<tr><td colspan="6" style="text-align:center; color:#DC2626;">${esc(message)}</td></tr>`;
}

function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

function notify(message, type = 'info') {
    const n = document.createElement('div');
    Object.assign(n.style, {
        position: 'fixed', bottom: '20px', right: '20px', padding: '12px 20px',
        borderRadius: '8px', color: '#FFFFFF', fontWeight: '600', fontSize: '14px',
        zIndex: '99999', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        background: type === 'success' ? '#10B981' : (type === 'error' ? '#EF4444' : '#3B82F6'),
    });
    n.textContent = message;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}
