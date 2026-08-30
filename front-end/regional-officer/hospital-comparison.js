// Regional Officer — hospital comparison page.

let allHospitals = [];

const METRICS = [
    { key: 'bedOccupancyRate', label: 'Bed Occupancy', suffix: '%', thresholds: { bad: 90, warn: 80 } },
    { key: 'appointmentCompletionRate', label: 'Appointment Completion', suffix: '%', thresholds: { lowBad: 50, lowWarn: 70 } },
    { key: 'patientSatisfactionScore', label: 'Patient Satisfaction', suffix: '/5', thresholds: { lowBad: 2.5, lowWarn: 3.5 } },
    { key: 'doctorCount', label: 'Doctors', suffix: '' },
    { key: 'availableBeds', label: 'Available Beds', suffix: '' },
    { key: 'lowStockItems', label: 'Low Stock Items', suffix: '', thresholds: { bad: 5, warn: 2 } },
    { key: 'openComplaints', label: 'Open Complaints', suffix: '', thresholds: { bad: 3, warn: 1 } },
];

document.addEventListener('DOMContentLoaded', async () => {
    initRegionalHeader();
    document.getElementById('compareBtn').addEventListener('click', runComparison);
    document.getElementById('compareAllBtn').addEventListener('click', () => {
        const select = document.getElementById('hospitalSelect');
        [...select.options].forEach(o => { o.selected = true; });
        runComparison();
    });

    try {
        const res = await window.NexCareAPI.Hospitals.getComparison();
        if (!res || !res.success) throw new Error('Failed to load comparison');
        allHospitals = res.data?.hospitals || [];
        populateSelect();
        renderComparison(allHospitals);
    } catch (err) {
        console.error(err);
        document.getElementById('comparisonCards').innerHTML =
            '<p class="empty-state" style="color:#DC2626;">Could not load hospital comparison data.</p>';
    }
});

function populateSelect() {
    const select = document.getElementById('hospitalSelect');
    select.innerHTML = allHospitals.map(h =>
        `<option value="${escapeHtml(h.hospitalId)}" selected>${escapeHtml(h.hospitalName)} (${escapeHtml(h.city)})</option>`
    ).join('');
}

async function runComparison() {
    const select = document.getElementById('hospitalSelect');
    const ids = [...select.selectedOptions].map(o => o.value);
    if (!ids.length) {
        alert('Please select at least one hospital to compare.');
        return;
    }
    try {
        const res = await window.NexCareAPI.Hospitals.getComparison(ids);
        if (!res || !res.success) throw new Error('Comparison failed');
        renderComparison(res.data?.hospitals || []);
    } catch (err) {
        console.error(err);
        alert('Could not run comparison. Please try again.');
    }
}

function renderComparison(hospitals) {
    renderCards(hospitals);
    renderOccupancyChart(hospitals);
    renderTable(hospitals);
}

function renderCards(hospitals) {
    const container = document.getElementById('comparisonCards');
    if (!hospitals.length) {
        container.innerHTML = '<p class="empty-state">No hospitals to compare.</p>';
        return;
    }

    container.innerHTML = hospitals.map(h => `
        <article class="compare-card">
            <h3>${escapeHtml(h.hospitalName)}</h3>
            <p class="city">${escapeHtml(h.city)} · ${escapeHtml(h.type || '')}</p>
            ${METRICS.map(m => {
                const val = h[m.key] ?? 0;
                const cls = m.thresholds ? metricClass(m.key, val, m.thresholds) : '';
                return `
                    <div class="metric-row">
                        <span class="label">${escapeHtml(m.label)}</span>
                        <span class="value ${cls}">${val}${escapeHtml(m.suffix)}</span>
                    </div>`;
            }).join('')}
            <div style="margin-top:12px;">
                <a href="${escapeHtml(pageLink('hospital-details', { id: h.hospitalId }))}" class="btn-link">View details</a>
            </div>
        </article>
    `).join('');
}

function renderOccupancyChart(hospitals) {
    const container = document.getElementById('occupancyChart');
    if (!hospitals.length) {
        container.innerHTML = '<p class="empty-state">No data available.</p>';
        return;
    }

    container.innerHTML = hospitals.map(h => {
        const pct = h.bedOccupancyRate || 0;
        const fillClass = pct >= 90 ? 'bad' : pct >= 80 ? 'warn' : '';
        return `
            <div class="bar-row">
                <span>${escapeHtml(h.hospitalName.split(' ')[0])}</span>
                <div class="bar-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeHtml(h.hospitalName)} occupancy">
                    <div class="bar-fill ${fillClass}" style="width:${pct}%"></div>
                </div>
                <strong>${pct}%</strong>
            </div>`;
    }).join('');
}

function renderTable(hospitals) {
    const thead = document.getElementById('comparisonTableHead');
    const tbody = document.getElementById('comparisonTableBody');

    if (!hospitals.length) {
        thead.innerHTML = '';
        tbody.innerHTML = '<tr><td class="empty-state">No data</td></tr>';
        return;
    }

    thead.innerHTML = `
        <tr>
            <th scope="col">Metric</th>
            ${hospitals.map(h => `<th scope="col">${escapeHtml(h.hospitalName)}</th>`).join('')}
        </tr>`;

    tbody.innerHTML = METRICS.map(m => `
        <tr>
            <th scope="row">${escapeHtml(m.label)}</th>
            ${hospitals.map(h => {
                const val = h[m.key] ?? 0;
                const cls = m.thresholds ? metricClass(m.key, val, m.thresholds) : '';
                return `<td><span class="value ${cls}" style="font-weight:700;">${val}${escapeHtml(m.suffix)}</span></td>`;
            }).join('')}
        </tr>
    `).join('');
}
