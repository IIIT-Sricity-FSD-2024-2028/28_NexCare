// Regional Officer — patient complaints & feedback tracking.

let allItems = [];
let hospitalNames = {};
let editingId = null;

document.addEventListener('DOMContentLoaded', async () => {
    initRegionalHeader();

    ['statusFilter', 'categoryFilter', 'hospitalFilter'].forEach(id => {
        document.getElementById(id).addEventListener('change', render);
    });
    document.getElementById('searchInput').addEventListener('input', render);

    document.getElementById('modalCancel').addEventListener('click', closeModal);
    document.getElementById('modalSave').addEventListener('click', saveStatus);
    document.getElementById('statusModal').addEventListener('click', e => {
        if (e.target.id === 'statusModal') closeModal();
    });

    await Promise.all([loadHospitalNames(), loadComplaints()]);
    populateFilters();
    render();
});

async function loadHospitalNames() {
    try {
        const res = await window.NexCareAPI.Hospitals.getMyHospitals();
        if (res?.success) {
            (res.data || []).forEach(h => { hospitalNames[h.id] = h.name; });
        }
    } catch (err) {
        console.warn('Hospital names unavailable:', err);
    }
}

async function loadComplaints() {
    try {
        const res = await window.NexCareAPI.Feedback.getRegional();
        if (!res || !res.success) throw new Error('Failed to load feedback');
        allItems = res.data?.items || [];
        const stats = res.data?.stats || {};
        setText('totalCount', stats.total ?? 0);
        setText('openCount', stats.open ?? 0);
        setText('progressCount', stats.inProgress ?? 0);
        setText('avgRating', stats.averageRating ?? '—');
    } catch (err) {
        console.error(err);
        document.getElementById('complaintsTableBody').innerHTML =
            '<tr><td colspan="8" style="text-align:center;color:#DC2626;">Could not load complaints.</td></tr>';
    }
}

function populateFilters() {
    const categories = [...new Set(allItems.map(i => i.category))].sort();
    const hospitals = [...new Set(allItems.map(i => i.hospitalId).filter(Boolean))];

    document.getElementById('categoryFilter').innerHTML =
        '<option value="all">All categories</option>' +
        categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');

    document.getElementById('hospitalFilter').innerHTML =
        '<option value="all">All hospitals</option>' +
        hospitals.map(id => `<option value="${escapeHtml(id)}">${escapeHtml(hospitalNames[id] || id)}</option>`).join('');
}

function render() {
    const status = document.getElementById('statusFilter').value;
    const category = document.getElementById('categoryFilter').value;
    const hospital = document.getElementById('hospitalFilter').value;
    const term = document.getElementById('searchInput').value.trim().toLowerCase();

    const rows = allItems.filter(item => {
        if (status !== 'all' && item.status !== status) return false;
        if (category !== 'all' && item.category !== category) return false;
        if (hospital !== 'all' && item.hospitalId !== hospital) return false;
        if (term) {
            const hay = `${item.subject} ${item.summary} ${item.sender} ${item.category}`.toLowerCase();
            if (!hay.includes(term)) return false;
        }
        return true;
    });

    const tbody = document.getElementById('complaintsTableBody');
    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No complaints match your filters.</td></tr>';
        return;
    }

    tbody.innerHTML = rows.map(item => `
        <tr>
            <td>${formatDate(item.createdAt)}</td>
            <td>${escapeHtml(hospitalNames[item.hospitalId] || item.hospitalId || '—')}</td>
            <td>
                <strong>${escapeHtml(item.sender)}</strong>
                <div style="font-size:12px;color:#6A7282;">${escapeHtml(item.type)}</div>
            </td>
            <td>
                <strong>${escapeHtml(item.subject)}</strong>
                <div style="font-size:12px;color:#6A7282;max-width:240px;">${escapeHtml(item.summary)}</div>
            </td>
            <td><span class="badge badge-neutral">${escapeHtml(item.category)}</span></td>
            <td>${item.rating ? renderStars(item.rating) : '—'}</td>
            <td>${feedbackStatusBadge(item.status)}</td>
            <td>
                <button type="button" class="btn-link" data-id="${escapeHtml(item.id)}" data-subject="${escapeHtml(item.subject)}" data-status="${escapeHtml(item.status)}" onclick="openStatusModal(this)">Update</button>
            </td>
        </tr>
    `).join('');
}

function openStatusModal(btn) {
    editingId = btn.dataset.id;
    document.getElementById('modalSubject').textContent = btn.dataset.subject;
    document.getElementById('modalStatus').value = btn.dataset.status;
    const modal = document.getElementById('statusModal');
    modal.hidden = false;
    modal.style.display = 'flex';
}

function closeModal() {
    editingId = null;
    const modal = document.getElementById('statusModal');
    modal.hidden = true;
    modal.style.display = 'none';
}

async function saveStatus() {
    if (!editingId) return;
    const status = document.getElementById('modalStatus').value;
    try {
        const res = await window.NexCareAPI.Feedback.updateStatus(editingId, status);
        if (!res || !res.success) throw new Error(res?.message || 'Update failed');
        const idx = allItems.findIndex(i => i.id === editingId);
        if (idx >= 0) allItems[idx].status = status;
        closeModal();
        await loadComplaints();
        render();
    } catch (err) {
        console.error(err);
        alert('Could not update status. Please try again.');
    }
}

window.openStatusModal = openStatusModal;
