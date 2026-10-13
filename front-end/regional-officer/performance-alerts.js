// Regional Officer — performance alerts page.

let allAlerts = [];

document.addEventListener('DOMContentLoaded', async () => {
    initRegionalHeader();

    ['severityFilter', 'categoryFilter', 'hospitalFilter'].forEach(id => {
        document.getElementById(id).addEventListener('change', render);
    });
    document.getElementById('searchInput').addEventListener('input', render);

    try {
        const res = await window.NexCareAPI.Hospitals.getPerformanceAlerts();
        if (!res || !res.success) throw new Error('Failed to load alerts');
        allAlerts = res.data?.alerts || [];
        updateStats(res.data);
        populateFilters();
        render();
    } catch (err) {
        console.error(err);
        document.getElementById('alertsList').innerHTML =
            '<p class="empty-state" style="color:#DC2626;">Could not load performance alerts.</p>';
    }
});

function updateStats(data) {
    setText('totalAlerts', data?.total ?? 0);
    setText('criticalAlerts', data?.critical ?? 0);
    setText('warningAlerts', data?.warning ?? 0);
    const hospitals = new Set((data?.alerts || []).map(a => a.hospitalId));
    setText('hospitalsAffected', hospitals.size);
}

function populateFilters() {
    const categories = [...new Set(allAlerts.map(a => a.category))].sort();
    const hospitals = [...new Set(allAlerts.map(a => a.hospitalId))];

    document.getElementById('categoryFilter').innerHTML =
        '<option value="all">All categories</option>' +
        categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');

    const hospitalNames = {};
    allAlerts.forEach(a => { hospitalNames[a.hospitalId] = a.hospitalName; });

    document.getElementById('hospitalFilter').innerHTML =
        '<option value="all">All hospitals</option>' +
        hospitals.map(id => `<option value="${escapeHtml(id)}">${escapeHtml(hospitalNames[id] || id)}</option>`).join('');
}

function render() {
    const severity = document.getElementById('severityFilter').value;
    const category = document.getElementById('categoryFilter').value;
    const hospital = document.getElementById('hospitalFilter').value;
    const term = document.getElementById('searchInput').value.trim().toLowerCase();

    const filtered = allAlerts.filter(a => {
        if (severity !== 'all' && a.severity !== severity) return false;
        if (category !== 'all' && a.category !== category) return false;
        if (hospital !== 'all' && a.hospitalId !== hospital) return false;
        if (term) {
            const hay = `${a.title} ${a.message} ${a.hospitalName} ${a.category}`.toLowerCase();
            if (!hay.includes(term)) return false;
        }
        return true;
    });

    const container = document.getElementById('alertsList');
    if (!filtered.length) {
        container.innerHTML = '<p class="empty-state">No alerts match your filters.</p>';
        return;
    }

    container.innerHTML = filtered.map(a => `
        <article class="alert-item ${escapeHtml(a.severity)}">
            <div class="alert-body" style="flex:1;">
                <h4>${escapeHtml(a.title)} ${severityBadge(a.severity)}</h4>
                <p>${escapeHtml(a.message)}</p>
                <p class="alert-meta">
                    ${escapeHtml(a.hospitalName)} · ${escapeHtml(a.category)}
                    ${a.metric != null ? ` · Metric: ${escapeHtml(a.metric)}${a.threshold != null ? ` (threshold: ${a.threshold})` : ''}` : ''}
                </p>
            </div>
            <a href="${escapeHtml(pageLink('hospital-details', { id: a.hospitalId }))}" class="btn-link">View hospital</a>
        </article>
    `).join('');
}
