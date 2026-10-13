// Regional Officer — overview dashboard using /hospitals/regional/overview API.

document.addEventListener('DOMContentLoaded', async () => {
    initRegionalHeader();
    try {
        await loadDashboard();
    } catch (err) {
        console.error('Dashboard initialization error:', err);
        showTableError('Could not load regional overview. Check that the backend is running.');
    }
});

async function loadDashboard() {
    const [overviewRes, alertsRes] = await Promise.all([
        window.NexCareAPI.Hospitals.getRegionalOverview(),
        window.NexCareAPI.Hospitals.getPerformanceAlerts(),
    ]);

    if (!overviewRes || !overviewRes.success) throw new Error('Failed to fetch regional overview');

    const { summary, hospitals, hospitalRevenueList } = overviewRes.data || {};
    const alerts = alertsRes?.success ? alertsRes.data : { total: 0, alerts: [] };

    setText('assignedHospitalsCount', summary?.assignedHospitals ?? 0);
    setText('verifiedSub', `${summary?.verifiedHospitals ?? 0} verified · ${summary?.pendingVerifications ?? 0} pending`);
    setText('totalDoctorsCount', summary?.totalDoctors ?? 0);
    setText('availableBedsCount', summary?.availableBeds ?? 0);
    setText('occupancySub', `${summary?.averageOccupancy ?? 0}% avg occupancy`);
    setText('alertCount', alerts.total ?? 0);
    setText('alertSub', `${alerts.critical ?? 0} critical · ${alerts.warning ?? 0} warning`);
    setText('complaintsCount', summary?.openComplaints ?? 0);
    setText('satisfactionSub', `${summary?.averageSatisfaction ?? 0}/5 avg satisfaction`);
    setText('lowStockCount', summary?.lowStockItems ?? 0);

    // Revenue KPIs
    const formatINR = num => '₹' + (Number(num) || 0).toLocaleString('en-IN');
    setText('totalRegionalRev', formatINR(summary?.totalRegionalRevenue ?? 0));
    setText('revMonth', formatINR(summary?.revenueThisMonth ?? 0));
    setText('revYear', formatINR(summary?.revenueThisYear ?? 0));
    setText('activePaidHospitals', summary?.activePaidHospitals ?? 0);
    setText('pendingRenewals', summary?.pendingRenewals ?? 0);
    setText('expiredSubs', summary?.expiredSubscriptions ?? 0);
    setText('renewalsDueSoon', summary?.renewalsDueSoon ?? 0);

    renderHospitalsTable(hospitals || []);
    renderRevenueTable(hospitalRevenueList || []);
    renderAlertsPreview(alerts.alerts || []);
}

function renderRevenueTable(list) {
    const tbody = document.getElementById('revenueTableBody');
    if (!tbody) return;
    if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No subscription revenue data found for this region.</td></tr>';
        return;
    }
    const formatINR = num => '₹' + (Number(num) || 0).toLocaleString('en-IN');
    tbody.innerHTML = list.map(item => `
        <tr>
            <td><strong>${escapeHtml(item.hospitalName)}</strong><div style="font-size:11px;color:#6B7280;">${escapeHtml(item.hospitalId)}</div></td>
            <td><span class="badge badge-info">${escapeHtml(item.subscriptionPlan)}</span></td>
            <td>${escapeHtml(item.lastPaymentDate)}</td>
            <td style="font-weight:700;color:#059669;">${formatINR(item.amountPaid)}</td>
            <td>${escapeHtml(item.subscriptionExpiryDate)}</td>
            <td><span class="badge badge-success">${escapeHtml(item.status)}</span></td>
        </tr>
    `).join('');
}

function renderHospitalsTable(hospitals) {
    const tbody = document.getElementById('hospitalsTableBody');
    if (!hospitals.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No hospitals assigned to you yet.</td></tr>';
        return;
    }

    tbody.innerHTML = hospitals.map(h => `
        <tr>
            <td>
                <strong>${escapeHtml(h.hospitalName)}</strong>
                <div style="font-size:12px;color:#6A7282;margin-top:2px;">${escapeHtml(h.type || '')} · ${h.totalBeds} beds</div>
            </td>
            <td>${escapeHtml(h.city || '—')}</td>
            <td>
                <span class="value ${h.bedOccupancyRate >= 90 ? 'bad' : h.bedOccupancyRate >= 80 ? 'warn' : 'good'}" style="font-weight:700;">
                    ${h.bedOccupancyRate}%
                </span>
            </td>
            <td>${h.doctorCount}</td>
            <td>${h.patientSatisfactionScore > 0 ? renderStars(h.patientSatisfactionScore) : '—'}</td>
            <td>${statusBadge(h.verificationStatus)}</td>
            <td>
                <a href="${escapeHtml(pageLink('hospital-details', { id: h.hospitalId }))}" class="btn-link">Details</a>
            </td>
        </tr>
    `).join('');
}

function renderAlertsPreview(alerts) {
    const container = document.getElementById('alertsPreview');
    const top = alerts.slice(0, 4);

    if (!top.length) {
        container.innerHTML = '<p class="empty-state">No performance alerts — all hospitals are within normal thresholds.</p>';
        return;
    }

    container.innerHTML = top.map(a => `
        <article class="alert-item ${escapeHtml(a.severity)}" aria-label="${escapeHtml(a.title)}">
            <div class="alert-body">
                <h4>${escapeHtml(a.title)} ${severityBadge(a.severity)}</h4>
                <p>${escapeHtml(a.message)}</p>
                <p class="alert-meta">${escapeHtml(a.hospitalName)} · ${escapeHtml(a.category)}</p>
            </div>
        </article>
    `).join('');
}

function showTableError(message) {
    const tbody = document.getElementById('hospitalsTableBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#DC2626;">${escapeHtml(message)}</td></tr>`;
    const alerts = document.getElementById('alertsPreview');
    if (alerts) alerts.innerHTML = `<p class="empty-state" style="color:#DC2626;">${escapeHtml(message)}</p>`;
}
