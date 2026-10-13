/**
 * reports.js
 * Superuser Analytics and Reports.
 *
 * Every figure and every chart on this page is computed from a live API
 * response. There are no seeded numbers, no illustrative series and no
 * "|| 4.85L" style fallbacks that quietly substitute an invented figure when a
 * call fails — a report that shows a plausible number for data it does not
 * have is worse than one that shows nothing, because you cannot tell the two
 * apart. When there is no data, these charts say so.
 *
 * Latency is MEASURED, not asserted: the page times its own API round trips.
 */

const chartInstances = {};

/** Round-trip timings collected by apiGet, in call order. */
const latencySamples = [];

const FALLBACK = '—';

function getToken() {
    return sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
}

async function apiGet(path) {
    const token = getToken();
    const host = window.location.hostname || 'localhost';
    const startedAt = performance.now();
    try {
        const res = await fetch(`http://${host}:3001/api${path}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const body = await res.json();
        latencySamples.push({ path, ms: Math.round(performance.now() - startedAt), ok: res.ok });
        return body;
    } catch (e) {
        latencySamples.push({ path, ms: Math.round(performance.now() - startedAt), ok: false });
        console.warn(`API query ${path} failed:`, e);
        return { success: false, data: null };
    }
}

/** Unwrap { success, data } without inventing a value when data is absent. */
function dataOf(resp, whenMissing = null) {
    return resp && resp.success !== false && resp.data != null ? resp.data : whenMissing;
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value === null || value === undefined ? FALLBACK : value;
}

function inr(n) {
    if (typeof n !== 'number' || !isFinite(n)) return FALLBACK;
    return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/** ₹4,58,210 reads badly on a tile; ₹4.58L reads at a glance. */
function inrCompact(n) {
    if (typeof n !== 'number' || !isFinite(n)) return FALLBACK;
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
    return `₹${Math.round(n)}`;
}

function destroyChart(id) {
    if (chartInstances[id]) {
        chartInstances[id].destroy();
        delete chartInstances[id];
    }
}

/** Draws "nothing to show" onto a canvas rather than leaving a blank frame. */
function emptyCanvas(canvasId, message) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return true;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.fillStyle = '#94A3B8';
    ctx.font = '13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    ctx.restore();
    return true;
}

function monthKey(iso) {
    const d = new Date(iso);
    return isNaN(d) ? null : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
    const [y, m] = key.split('-');
    return new Date(Number(y), Number(m) - 1, 1)
        .toLocaleString('en-IN', { month: 'short', year: 'numeric' });
}

/** The last `count` month keys ending this month, oldest first. */
function recentMonthKeys(count) {
    const out = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return out;
}

// Tab Switching
function switchTab(tabName, event) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        const btn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.textContent.toLowerCase().includes(tabName));
        if (btn) btn.classList.add('active');
    }

    document.querySelectorAll('.report-section').forEach(section => section.classList.remove('active'));
    const targetSection = document.getElementById(`${tabName}-section`);
    if (targetSection) targetSection.classList.add('active');

    switch (tabName) {
        case 'usage': loadUsageAnalytics(); break;
        case 'performance': loadSystemPerformance(); break;
        case 'operational': loadOperationalReports(); break;
        case 'security': loadSecurityReports(); break;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    switchTab(params.get('tab') || 'usage');
});

function refreshAllReports() {
    const activeTab = document.querySelector('.tab-btn.active')?.textContent.toLowerCase() || 'usage';
    if (activeTab.includes('usage') || activeTab.includes('revenue')) loadUsageAnalytics();
    else if (activeTab.includes('performance')) loadSystemPerformance();
    else if (activeTab.includes('operational')) loadOperationalReports();
    else if (activeTab.includes('security')) loadSecurityReports();
}

// ============ USAGE & REVENUE ANALYTICS ============
async function loadUsageAnalytics() {
    const [usersResp, activityResp, streamsResp, trendResp, patSubResp, patPlanResp] = await Promise.all([
        apiGet('/users'),
        apiGet('/system/activity/recent?limit=1000'),
        apiGet('/revenue/platform/streams'),
        apiGet('/revenue/platform/trend?months=6'),
        apiGet('/revenue/patient-subscriptions'),
        apiGet('/revenue/patient-plans')
    ]);

    const users = dataOf(usersResp, []);
    const activities = dataOf(activityResp, []);
    const streams = dataOf(streamsResp);
    const trend = dataOf(trendResp, []);
    const patSubs = dataOf(patSubResp, []);
    const patPlans = dataOf(patPlanResp, []);

    setText('dailyActiveUsers', users.length ? users.filter(u => u.status === 'Active').length : null);
    setText('totalPlatformRevenue', streams ? inrCompact(streams.totalRevenue) : null);

    // A "subscriber" is someone on a plan that actually costs money. Being on
    // the free Pay-as-you-go tier is the absence of a membership.
    const paidPlanIds = new Set(patPlans.filter(p => p.monthlyFee > 0).map(p => p.id));
    const activePaid = patSubs.filter(s => s.status === 'active' && paidPlanIds.has(s.planId));
    setText('totalSubscribersCount', patPlans.length ? activePaid.length : null);

    // Billed hospitals — the ones actually on a plan. Pending registrations
    // are deliberately not counted; they are not customers yet.
    const billedHospitals = streams?.unitEconomics?.hospitals;
    setText('peakConcurrentUsers', typeof billedHospitals === 'number' ? billedHospitals : null);

    renderRevenueTrendChart(trend);
    renderMembershipAdoptionChart(patSubs, patPlans);
    renderModuleUsageTable(activities);
}

/**
 * Graph 1 — the real six-month platform trend.
 *
 * `recurring` is subscriptions plus memberships, so memberships are the
 * difference. Those three series are exactly the split the heading promises.
 */
function renderRevenueTrendChart(trend) {
    const canvas = document.getElementById('platformRevenueCanvas');
    if (!canvas || typeof Chart === 'undefined') return;
    destroyChart('platformRevenue');

    if (!Array.isArray(trend) || trend.length === 0) {
        return emptyCanvas('platformRevenueCanvas', 'No revenue history yet');
    }

    chartInstances['platformRevenue'] = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: trend.map(t => t.month),
            datasets: [
                {
                    label: 'Hospital Subscriptions (₹)',
                    data: trend.map(t => t.subscriptions ?? 0),
                    backgroundColor: '#2563EB',
                    borderRadius: 6
                },
                {
                    label: 'Care+ Memberships (₹)',
                    data: trend.map(t => Math.max(0, (t.recurring ?? 0) - (t.subscriptions ?? 0))),
                    backgroundColor: '#10B981',
                    borderRadius: 6
                },
                {
                    label: 'Processing & Usage Fees (₹)',
                    data: trend.map(t => t.transactional ?? t.processing ?? 0),
                    backgroundColor: '#F59E0B',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
                tooltip: {
                    callbacks: {
                        label: c => `${c.dataset.label}: ${inr(c.raw)}`
                    }
                }
            },
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: { callback: v => `₹${(v / 1000).toFixed(0)}k` }
                }
            }
        }
    });
}

/** Graph 2 — real membership mix, labelled with the real plan names and fees. */
function renderMembershipAdoptionChart(patSubs, patPlans) {
    const canvas = document.getElementById('membershipAdoptionCanvas');
    if (!canvas || typeof Chart === 'undefined') return;
    destroyChart('membershipAdoption');

    if (!Array.isArray(patPlans) || patPlans.length === 0) {
        return emptyCanvas('membershipAdoptionCanvas', 'Plan catalogue unavailable');
    }

    const counts = patPlans.map(p => ({
        label: `${p.name} (₹${p.monthlyFee})`,
        value: patSubs.filter(s => s.planId === p.id && s.status === 'active').length
    }));

    if (counts.every(c => c.value === 0)) {
        return emptyCanvas('membershipAdoptionCanvas', 'No active memberships yet');
    }

    chartInstances['membershipAdoption'] = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: counts.map(c => c.label),
            datasets: [{
                data: counts.map(c => c.value),
                backgroundColor: ['#94A3B8', '#10B981', '#6366F1', '#F59E0B'],
                hoverOffset: 4,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                tooltip: { callbacks: { label: c => `${c.label}: ${c.raw} member(s)` } }
            },
            cutout: '65%'
        }
    });
}

/**
 * Replaces the old invented "feature usage" table. These are the modules the
 * audit log actually recorded activity against, with real counts and real
 * distinct users — no visit totals or average session times, because nothing
 * in this system measures either.
 */
function renderModuleUsageTable(activities) {
    const tbody = document.getElementById('featureUsageTable');
    if (!tbody) return;

    if (!Array.isArray(activities) || activities.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#64748B;padding:18px;">No recorded activity yet.</td></tr>';
        return;
    }

    const byModule = new Map();
    activities.forEach(a => {
        const key = a.module || 'Unspecified';
        if (!byModule.has(key)) byModule.set(key, { events: 0, users: new Set(), actions: new Map(), last: null });
        const row = byModule.get(key);
        row.events++;
        if (a.userId) row.users.add(a.userId);
        row.actions.set(a.action, (row.actions.get(a.action) || 0) + 1);
        const ts = a.timestamp || a.createdAt;
        if (ts && (!row.last || ts > row.last)) row.last = ts;
    });

    const rows = [...byModule.entries()].sort((a, b) => b[1].events - a[1].events);
    const total = activities.length;

    tbody.innerHTML = rows.map(([name, r]) => {
        const topAction = [...r.actions.entries()].sort((a, b) => b[1] - a[1])[0];
        const share = ((r.events / total) * 100).toFixed(1);
        return `
        <tr>
            <td style="font-weight: 600; color:#0F172A;">${name}</td>
            <td>${r.events.toLocaleString('en-IN')}</td>
            <td>${r.users.size}</td>
            <td>${topAction ? `${topAction[0]} (${topAction[1]})` : FALLBACK}</td>
            <td><span style="color:#2563EB; font-weight:600;">${share}%</span></td>
        </tr>`;
    }).join('');
}

// ============ SYSTEM PERFORMANCE ============
async function loadSystemPerformance() {
    const healthResp = await apiGet('/system/health');
    const health = dataOf(healthResp);

    if (!health) {
        ['apiResponseTime', 'systemUptime', 'errorRate', 'dbPerformance',
         'cpuUsage', 'memoryUsage', 'diskIO', 'networkLatency'].forEach(id => setText(id, null));
        renderMeasuredLatencyChart();
        return;
    }

    setText('apiResponseTime', health.apiResponseTime);
    setText('systemUptime', health.systemUptime);
    setText('errorRate', health.databaseStatus);
    setText('dbPerformance', health.activeAmbulances != null ? `${health.activeAmbulances} Units` : null);

    setText('cpuUsage', health.apiStatus);
    setText('memoryUsage', health.memoryUsage);
    setText('diskIO', health.activeHospitals != null
        ? `${health.activeHospitals} Active (${health.pendingApprovals ?? 0} Pending)`
        : null);
    setText('networkLatency', health.nodeVersion);

    renderMeasuredLatencyChart();
}

/**
 * Real measured latency. The old version drew a fixed 12/14/18/24/21/15ms
 * curve against times of day it never sampled. This plots the actual round
 * trip of each API call this page has made, newest last.
 */
function renderMeasuredLatencyChart() {
    const chartContainer = document.getElementById('apiResponseChart');
    if (!chartContainer) return;

    const samples = latencySamples.slice(-8);
    if (samples.length === 0) {
        chartContainer.innerHTML = '<p style="color:#64748B;padding:12px;">No API calls measured yet.</p>';
        return;
    }

    const maxValue = Math.max(...samples.map(s => s.ms), 1);
    chartContainer.innerHTML = samples.map(s => {
        const height = Math.max(4, (s.ms / maxValue) * 100);
        const label = s.path.replace(/^\//, '').split('?')[0];
        return `
            <div class="bar-group" title="${label} — ${s.ms}ms">
                <div class="bar-value">${s.ms}ms</div>
                <div class="bar" style="height: ${height}%; background: ${s.ok ? '#2563EB' : '#EF4444'}"></div>
                <div class="bar-label" style="font-size:10px;">${label.length > 14 ? label.slice(0, 13) + '…' : label}</div>
            </div>`;
    }).join('');
}

// ============ OPERATIONAL & EMERGENCY REPORTS ============
async function loadOperationalReports() {
    const [patientsResp, feedbackResp, hospitalsResp, bedsResp, ambulanceResp] = await Promise.all([
        apiGet('/patients'),
        apiGet('/feedback'),
        apiGet('/hospitals'),
        apiGet('/beds'),
        apiGet('/ambulance')
    ]);

    const patients = dataOf(patientsResp, []);
    const feedback = dataOf(feedbackResp, []);
    const hospitals = dataOf(hospitalsResp, []);
    const beds = dataOf(bedsResp, []);
    const trips = dataOf(ambulanceResp, []);

    setText('newRegistrations', patientsResp && patientsResp.success !== false ? patients.length : null);

    const verified = hospitals.filter(h => h.verificationStatus === 'verified').length;
    setText('hospitalVerifyRate', hospitals.length ? `${verified} / ${hospitals.length} Verified` : null);

    const rated = feedback.filter(f => typeof f.rating === 'number');
    setText('avgFeedbackRating', rated.length
        ? `⭐ ${(rated.reduce((s, f) => s + f.rating, 0) / rated.length).toFixed(1)} / 5.0`
        : null);

    const completedTrips = trips.filter(t => String(t.status || '').toLowerCase() === 'completed').length;
    setText('staffActivityLevel', trips.length ? `${completedTrips} / ${trips.length} Dispatches Completed` : null);

    renderHospitalGrowthChart(hospitals, beds);
    renderAmbulanceDispatchChart(trips);
    renderFeedbackByHospitalChart(feedback, hospitals);
}

/** Graph 3 — real cumulative hospital count by signup month, with real occupancy. */
function renderHospitalGrowthChart(hospitals, beds) {
    const canvas = document.getElementById('hospitalGrowthCanvas');
    if (!canvas || typeof Chart === 'undefined') return;
    destroyChart('hospitalGrowth');

    if (!Array.isArray(hospitals) || hospitals.length === 0) {
        return emptyCanvas('hospitalGrowthCanvas', 'No hospitals registered yet');
    }

    const months = recentMonthKeys(6);
    // A hospital with no signup date was already on the platform before this
    // window opened — the seeded hospitals predate the audit trail. Counting
    // only dated rows would show 1 hospital when there are nine.
    const cumulative = months.map(key =>
        hospitals.filter(h => {
            const k = monthKey(h.createdAt || h.registeredAt);
            return k === null || k <= key;
        }).length
    );

    // Occupancy is a point-in-time fact — beds carry no history — so it is
    // drawn as a single flat reference line rather than a fake trend.
    const occupied = beds.filter(b => String(b.status || '').toLowerCase() === 'occupied').length;
    const occupancy = beds.length ? Number(((occupied / beds.length) * 100).toFixed(1)) : null;

    const datasets = [{
        type: 'bar',
        label: 'Hospitals on Platform (cumulative)',
        data: cumulative,
        backgroundColor: '#3B82F6',
        yAxisID: 'y'
    }];

    if (occupancy !== null) {
        datasets.push({
            type: 'line',
            label: `Bed Occupancy Now (${occupancy}%)`,
            data: months.map(() => occupancy),
            borderColor: '#EC4899',
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
            yAxisID: 'y1'
        });
    }

    chartInstances['hospitalGrowth'] = new Chart(canvas.getContext('2d'), {
        data: { labels: months.map(monthLabel), datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } } },
            scales: {
                y: { type: 'linear', position: 'left', beginAtZero: true, title: { display: true, text: 'Hospitals' }, ticks: { precision: 0 } },
                y1: { type: 'linear', position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false }, title: { display: true, text: 'Occupancy %' } }
            }
        }
    });
}

/**
 * Graph 4 — real dispatch volume by month and outcome.
 *
 * The old chart plotted urban/suburban response times against an 8-minute
 * benchmark. Nothing in the system records a dispatch timestamp separate from
 * creation, so response time cannot be derived — it was invented. Volume and
 * outcome are real and are what the data supports.
 */
function renderAmbulanceDispatchChart(trips) {
    const canvas = document.getElementById('ambulanceDispatchCanvas');
    if (!canvas || typeof Chart === 'undefined') return;
    destroyChart('ambulanceDispatch');

    if (!Array.isArray(trips) || trips.length === 0) {
        return emptyCanvas('ambulanceDispatchCanvas', 'No ambulance dispatches recorded');
    }

    const months = recentMonthKeys(6);
    const statuses = [...new Set(trips.map(t => t.status || 'Unknown'))];
    const palette = { Completed: '#10B981', Pending: '#F59E0B', Dispatched: '#3B82F6', Cancelled: '#EF4444' };

    chartInstances['ambulanceDispatch'] = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: months.map(monthLabel),
            datasets: statuses.map((st, i) => ({
                label: st,
                data: months.map(m => trips.filter(t => monthKey(t.createdAt) === m && (t.status || 'Unknown') === st).length),
                backgroundColor: palette[st] || ['#6366F1', '#14B8A6', '#94A3B8'][i % 3],
                borderRadius: 4
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } } },
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: { stacked: true, beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: 'Dispatches' } }
            }
        }
    });
}

/**
 * Graph 5 — real feedback rating and resolution rate per hospital.
 *
 * The old chart scored four invented geographic regions ("South Region
 * 98.4% SLA compliance") against SLA data this system does not collect.
 */
function renderFeedbackByHospitalChart(feedback, hospitals) {
    const canvas = document.getElementById('regionalComplianceCanvas');
    if (!canvas || typeof Chart === 'undefined') return;
    destroyChart('regionalCompliance');

    if (!Array.isArray(feedback) || feedback.length === 0) {
        return emptyCanvas('regionalComplianceCanvas', 'No feedback submitted yet');
    }

    const nameOf = id => hospitals.find(h => h.id === id)?.name || id || 'Unassigned';
    const byHospital = new Map();
    feedback.forEach(f => {
        const key = f.hospitalId || 'Unassigned';
        if (!byHospital.has(key)) byHospital.set(key, { ratings: [], total: 0, resolved: 0 });
        const row = byHospital.get(key);
        if (typeof f.rating === 'number') row.ratings.push(f.rating);
        row.total++;
        if (String(f.status || '').toLowerCase() === 'resolved') row.resolved++;
    });

    const rows = [...byHospital.entries()].sort((a, b) => b[1].total - a[1].total);

    chartInstances['regionalCompliance'] = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: rows.map(([id]) => nameOf(id)),
            datasets: [
                {
                    label: 'Avg Rating (as % of 5)',
                    data: rows.map(([, r]) => r.ratings.length
                        ? Number(((r.ratings.reduce((s, x) => s + x, 0) / r.ratings.length / 5) * 100).toFixed(1))
                        : 0),
                    backgroundColor: '#6366F1',
                    borderRadius: 6
                },
                {
                    label: 'Feedback Resolved (%)',
                    data: rows.map(([, r]) => r.total ? Number(((r.resolved / r.total) * 100).toFixed(1)) : 0),
                    backgroundColor: '#14B8A6',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
                tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.raw}%` } }
            },
            scales: { x: { beginAtZero: true, max: 100, ticks: { callback: v => `${v}%` } } }
        }
    });
}

// ============ SECURITY & AUDIT LOGS ============
async function loadSecurityReports() {
    const activityResp = await apiGet('/system/activity/recent?limit=1000');
    const activities = dataOf(activityResp, []);
    const available = activityResp && activityResp.success !== false;

    if (!available) {
        ['failedLogins', 'securityIncidents', 'permissionChanges', 'dataAccessLogs'].forEach(id => setText(id, null));
        renderSecurityEventsTable([], false);
        return;
    }

    const isFailedLogin = a =>
        /fail|invalid|denied|unauthor/i.test(`${a.action} ${a.details || ''}`) &&
        /login|auth/i.test(`${a.action} ${a.module || ''}`);

    setText('failedLogins', activities.filter(isFailedLogin).length);
    setText('securityIncidents', activities.filter(a => String(a.severity || '').toUpperCase() === 'HIGH').length);
    setText('permissionChanges', activities.filter(a => /passwordchange|password reset|update/i.test(a.action || '')).length);
    setText('dataAccessLogs', activities.length.toLocaleString('en-IN'));

    renderSecurityEventsTable(activities, true);
}

function renderSecurityEventsTable(activities, available) {
    const tbody = document.getElementById('securityEventsTable');
    if (!tbody) return;

    if (!available) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#DC2626;padding:18px;">Audit log unavailable.</td></tr>';
        return;
    }
    if (activities.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#64748B;padding:18px;">No audit events recorded yet.</td></tr>';
        return;
    }

    const rows = [...activities]
        .sort((a, b) => String(b.timestamp || b.createdAt || '').localeCompare(String(a.timestamp || a.createdAt || '')))
        .slice(0, 10);

    const sevClass = s => String(s).toUpperCase() === 'HIGH' ? 'status-danger' : 'status-good';

    tbody.innerHTML = rows.map(a => {
        const ts = (a.timestamp || a.createdAt || '').replace('T', ' ').substring(0, 19);
        return `
        <tr>
            <td style="font-family: monospace; font-size: 12.5px;">${ts || FALLBACK}</td>
            <td style="font-weight: 600; color:#0F172A;">${a.action || FALLBACK}${a.module ? ` · ${a.module}` : ''}</td>
            <td>${a.userId || FALLBACK}</td>
            <td><span class="perf-status ${sevClass(a.severity)}">${a.severity || 'INFO'}</span></td>
            <td style="font-size:12px;color:#475569;">${(a.details || '').slice(0, 70)}</td>
        </tr>`;
    }).join('');
}
