// Regional Officer — support request console.
//
// GET /support-requests is already scoped server-side: a regional_manager receives
// requests across the hospitals assigned to them. PUT /support-requests/:id lets
// them advance or resolve one. There was no UI for either until now.

const STATUSES = [
    'open',
    'in_progress',
    'waiting_for_hospital',
    'waiting_for_manager',
    'resolved',
    'closed',
];

let allRequests = [];
let hospitalNames = {};

document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userInitials').textContent = (user.name || 'RO').substring(0, 2).toUpperCase();
        document.getElementById('userNameDisplay').textContent = user.name || 'Regional Officer';
    }

    document.getElementById('statusFilter').addEventListener('change', render);
    document.getElementById('hospitalFilter').addEventListener('change', render);
    document.getElementById('searchInput').addEventListener('input', render);

    await Promise.all([loadHospitalNames(), loadRequests()]);
    populateHospitalFilter();
    render();
});

async function loadHospitalNames() {
    try {
        const res = await window.NexCareAPI.Hospitals.getAll();
        if (res && res.success) {
            (res.data || []).forEach(h => { hospitalNames[h.id] = h.name; });
        }
    } catch (err) {
        console.warn('Hospital names unavailable:', err);
    }
}

async function loadRequests() {
    try {
        const res = await window.NexCareAPI.SupportRequests.getAll();
        if (!res || !res.success) throw new Error('Failed to load support requests');
        allRequests = res.data || [];
        updateStats();
    } catch (err) {
        console.error(err);
        showError('Could not load support requests. Check that the backend is running.');
    }
}

function populateHospitalFilter() {
    const select = document.getElementById('hospitalFilter');
    const ids = [...new Set(allRequests.map(r => r.hospitalId))];
    select.innerHTML = '<option value="all">All my hospitals</option>' +
        ids.map(id => `<option value="${esc(id)}">${esc(hospitalNames[id] || id)}</option>`).join('');
}

function updateStats() {
    const isOpen = r => !['resolved', 'closed'].includes(String(r.status).toLowerCase());
    setText('openCount', allRequests.filter(isOpen).length);
    setText('mineCount', allRequests.filter(r => r.status === 'waiting_for_manager').length);
    setText('urgentCount', allRequests.filter(r => r.priority === 'urgent' && isOpen(r)).length);
    setText('resolvedCount', allRequests.filter(r => !isOpen(r)).length);
}

function render() {
    const status = document.getElementById('statusFilter').value;
    const hospital = document.getElementById('hospitalFilter').value;
    const term = document.getElementById('searchInput').value.trim().toLowerCase();

    const rows = allRequests.filter(r => {
        if (status !== 'all' && String(r.status).toLowerCase() !== status) return false;
        if (hospital !== 'all' && r.hospitalId !== hospital) return false;
        if (term) {
            const haystack = `${r.subject || ''} ${r.category || ''} ${r.description || ''}`.toLowerCase();
            if (!haystack.includes(term)) return false;
        }
        return true;
    });

    const tbody = document.getElementById('requestsTableBody');
    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#6A7282;">No requests match this filter.</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map(r => {
        const st = String(r.status || 'open').toLowerCase();
        const closed = ['resolved', 'closed'].includes(st);
        return `
        <tr>
            <td class="actor-cell">
                ${esc(r.subject)}
                <div class="muted">${esc(r.category || 'General')} &middot; ${esc(r.id)}</div>
                <div class="muted" style="margin-top:6px; max-width:420px;">${esc(truncate(r.description, 110))}</div>
            </td>
            <td>${esc(hospitalNames[r.hospitalId] || r.hospitalId)}</td>
            <td><span class="pill ${esc(r.priority || 'low')}">${esc(r.priority || 'low')}</span></td>
            <td><span class="pill ${esc(st)}">${esc(st.replace(/_/g, ' '))}</span></td>
            <td>
                ${formatDate(r.createdAt)}
                <div class="muted">updated ${formatDate(r.updatedAt)}</div>
            </td>
            <td>
                <select class="btn-sm btn-neutral" onchange="changeStatus('${esc(r.id)}', this.value, this)"
                        style="height:32px;" ${closed ? '' : ''}>
                    ${STATUSES.map(s =>
                        `<option value="${s}" ${s === st ? 'selected' : ''}>${s.replace(/_/g, ' ')}</option>`
                    ).join('')}
                </select>
            </td>
        </tr>`;
    }).join('');
}

async function changeStatus(requestId, newStatus, selectEl) {
    const request = allRequests.find(r => r.id === requestId);
    if (!request || newStatus === String(request.status).toLowerCase()) return;

    const previous = request.status;
    const payload = { status: newStatus };
    if (['resolved', 'closed'].includes(newStatus)) {
        payload.resolvedAt = new Date().toISOString();
    }

    try {
        const res = await window.NexCareAPI.SupportRequests.update(requestId, payload);
        if (!res || !res.success) {
            selectEl.value = previous;
            notify((res && res.message) || 'Failed to update request', 'error');
            return;
        }
        request.status = newStatus;
        request.updatedAt = new Date().toISOString();
        if (payload.resolvedAt) request.resolvedAt = payload.resolvedAt;
        updateStats();
        render();
        notify(`${request.subject} → ${newStatus.replace(/_/g, ' ')}`, 'success');
    } catch (err) {
        console.error(err);
        selectEl.value = previous;
        notify('Failed to update request', 'error');
    }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

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

function truncate(text, max) {
    if (!text) return '';
    return text.length <= max ? text : text.substring(0, max) + '...';
}

function formatDate(value) {
    if (!value) return 'N/A';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function showError(message) {
    document.getElementById('requestsTableBody').innerHTML =
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
