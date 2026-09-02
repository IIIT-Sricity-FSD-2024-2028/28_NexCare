/**
 * Hospital Manager Portal JavaScript Logic
 * NexCare Hospital Management System
 */

// State
let allLeaves = [];
let allStaff = [];
let allInventoryReqs = [];
let allSupport = [];
let subscriptionData = null;
let allSchedules = [];
let managerProfile = null;

// Rejection Modal State
let currentRejectionType = null; // 'LEAVE' or 'INVENTORY'
let currentRejectionTargetId = null;

// Status Toggle Modal State
let currentStaffTargetId = null;
let currentStaffTargetStatus = null;

document.addEventListener('DOMContentLoaded', async () => {
    initManagerInfo();
    
    // Check hash for initial tab
    const hash = window.location.hash.replace('#', '') || 'overview';
    switchTab(hash);

    // Initial load
    await loadAllDashboardData();
});

// Listen to hash changes (e.g. from nav clicks)
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '') || 'overview';
    switchTab(hash);
});

/**
 * Initialize Manager profile from session/local storage
 */
function initManagerInfo() {
    const rawUser = sessionStorage.getItem('nexcare_user_data') || localStorage.getItem('nexcare_user_data');
    if (rawUser) {
        try {
            managerProfile = JSON.parse(rawUser);
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }

    // Default fallback if manager logged in via demo session
    if (!managerProfile || managerProfile.role !== 'hospital_manager') {
        managerProfile = {
            id: 'HM001',
            name: 'Srinivas Rao',
            email: 'hospitalmanager@nexcare.com',
            role: 'hospital_manager',
            hospitalId: 'H001',
            hospitalName: 'NexCare AIIMS Super Speciality Hospital'
        };
    }

    if (document.getElementById('managerName')) {
        document.getElementById('managerName').textContent = managerProfile.name || 'Hospital Manager';
    }
    if (document.getElementById('managerHospital')) {
        document.getElementById('managerHospital').textContent = `🏥 ${managerProfile.hospitalName || 'Hospital'}`;
    }
    if (document.getElementById('managerHospitalId')) {
        document.getElementById('managerHospitalId').textContent = `ID: ${managerProfile.hospitalId || 'H001'}`;
    }

    // Init Avatar initials
    const initials = (managerProfile.name || 'HM')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    if (document.getElementById('managerAvatar')) {
        document.getElementById('managerAvatar').textContent = initials || 'HM';
    }

    // Set modal auto-filled hospital info
    if (document.getElementById('staffHospitalId')) {
        document.getElementById('staffHospitalId').value = managerProfile.hospitalId || 'H001';
    }
    if (document.getElementById('staffHospitalName')) {
        document.getElementById('staffHospitalName').value = managerProfile.hospitalName || 'NexCare AIIMS Super Speciality Hospital';
    }

    // Set page auto-filled hospital info
    if (document.getElementById('pageStaffHospitalId')) {
        document.getElementById('pageStaffHospitalId').textContent = managerProfile.hospitalId || 'H001';
    }
    if (document.getElementById('pageStaffHospitalName')) {
        document.getElementById('pageStaffHospitalName').textContent = managerProfile.hospitalName || 'NexCare AIIMS Super Speciality Hospital';
    }
    if (document.getElementById('pageStaffRegion')) {
        document.getElementById('pageStaffRegion').textContent = `${managerProfile.regionName || 'Andhra Pradesh South'} (${managerProfile.regionId || 'R001'})`;
    }
    if (document.getElementById('pageStaffJoiningDate')) {
        document.getElementById('pageStaffJoiningDate').value = new Date().toISOString().split('T')[0];
    }
}

/**
 * Switch tabs in the dashboard
 */
function switchTab(tabName, event) {
    if (event) event.preventDefault();

    const tabs = ['overview', 'leaves', 'schedules', 'staff', 'setup', 'inventory-approvals', 'ambulance', 'subscription', 'supervision', 'support', 'revenue', 'feedback'];
    if (!tabs.includes(tabName)) tabName = 'overview';

    // Update active nav links
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
        el.classList.remove('active');
        if (el.getAttribute('href') === `#${tabName}`) {
            el.classList.add('active');
        }
    });

    // Update active content
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active-tab'));
    const tabMap = {
        overview: 'overviewTab',
        leaves: 'leavesTab',
        schedules: 'schedulesTab',
        staff: 'staffTab',
        setup: 'setupTab',
        'inventory-approvals': 'inventoryApprovalsTab',
        ambulance: 'ambulanceTab',
        subscription: 'subscriptionTab',
        revenue: 'revenueTab',
        supervision: 'supervisionTab',
        support: 'supportTab',
        feedback: 'feedbackTab'
    };

    const targetTabEl = document.getElementById(tabMap[tabName]);
    if (targetTabEl) targetTabEl.classList.add('active-tab');

    const titles = {
        overview: { title: 'Hospital Overview', subtitle: 'Comprehensive oversight of staff, doctor leaves, inventory approvals, and annual subscription.' },
        leaves: { title: 'Doctor Leave Approvals', subtitle: 'Review, approve, or reject doctor leave applications with strict hospital scoping.' },
        schedules: { title: 'Schedule Approvals', subtitle: 'Approve the hospital-wide roster before it is published to department staff.' },
        staff: { title: 'Hospital Staff Directory', subtitle: 'Manage doctors, administrative staff, and ambulance drivers for this hospital.' },
        setup: { title: 'Registration, Setup & Assets', subtitle: 'Configure hospital infrastructure, register staff, view assets, and manage inventory.' },
        'inventory-approvals': { title: 'Inventory Requirements & Approvals', subtitle: 'Approve or reject stock requisition requests raised by administrative staff.' },
        ambulance: { title: 'Ambulance Fleet & Emergency Status', subtitle: 'Live status tracking, fleet readiness, vehicle standby, and emergency dispatch management.' },
        subscription: { title: 'Subscription & License Renewal', subtitle: 'Manage 12-month hospital license, payment history, and instant renewal.' },
        revenue: { title: 'Revenue & Financial Analytics', subtitle: 'Hospital collections and outstanding bills tracking.' },
        supervision: { title: 'Administrative Staff Supervision', subtitle: 'Assigned responsibilities and front-desk operation tracking.' },
        support: { title: 'Regional Support Tickets', subtitle: 'Hospital-level issue escalations and compliance tracking.' },
        feedback: { title: 'Patient Feedback & Issues', subtitle: 'Manage and resolve patient complaints for your hospital.' }
    };

    if (titles[tabName]) {
        const header = document.querySelector('.dashboard-header h1');
        const desc = document.querySelector('.dashboard-header .header-desc');
        if (header) header.textContent = titles[tabName].title;
        if (desc) desc.textContent = titles[tabName].subtitle;
    }

    if (tabName === 'leaves') {
        renderLeaves();
    } else if (tabName === 'supervision') {
        loadSupervision();
    } else if (tabName === 'revenue') {
        loadRevenue();
    } else if (tabName === 'setup') {
        loadInfrastructure();
        loadInventoryCatalog();
    }

    // Reflect hash in URL without jump
    history.replaceState(null, null, `#${tabName}`);
}

/**
 * Load all dashboard data concurrently
 */
async function loadAllDashboardData() {
    try {
        await Promise.all([
            loadOverview(),
            loadLeaves(),
            loadSchedules(),
            loadStaff(),
            loadInventoryReqs(),
            loadAmbulanceFleet(),
            loadSubscription(),
            loadSupport(),
            loadHmFeedback(),
            loadRevenue(),
            loadInfrastructure(),
            loadInventoryCatalog()
        ]);
    } catch (e) {
        console.error('Error loading dashboard data:', e);
    }
}

// ── Revenue ─────────────────────────────────────────────────────────────────
// This hospital's OWN collections. What NexCare charges across all hospitals is
// the platform's commercials and is only visible to the Admin.

let revenueLoaded = false;

async function loadRevenue() {
    if (revenueLoaded) return;

    const statsEl = document.getElementById('revenueStats');
    const deptEl = document.getElementById('revenueDeptBody');
    const platformEl = document.getElementById('revenuePlatformBody');

    const hospitalId = getManagerHospitalId();
    if (!hospitalId) {
        if (deptEl) deptEl.innerHTML = '<p style="color:#DC2626;">No hospital is linked to this account.</p>';
        return;
    }

    const money = v => '₹' + (Number(v) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

    try {
        const res = await window.NexCareAPI.Revenue.getHospitalRevenue(hospitalId);
        if (!res.success) throw new Error(res.message || 'Failed to load revenue');
        const d = res.data;
        revenueLoaded = true;

        if (statsEl) {
            statsEl.innerHTML = `
                <div class="stat-card"><div class="stat-label">Collected</div><div class="stat-value">${money(d.collected)}</div></div>
                <div class="stat-card"><div class="stat-label">Outstanding</div><div class="stat-value">${money(d.outstanding)}</div></div>
                <div class="stat-card"><div class="stat-label">Collection Rate</div><div class="stat-value">${d.collectionRate}%</div></div>
                <div class="stat-card"><div class="stat-label">Bills Issued</div><div class="stat-value">${d.billsIssued}</div></div>`;
        }

        if (deptEl) {
            if (!d.byDepartment || !d.byDepartment.length) {
                deptEl.innerHTML = '<p>No collected revenue to break down yet.</p>';
            } else {
                const max = Math.max(...d.byDepartment.map(x => x.amount), 1);
                deptEl.innerHTML = d.byDepartment.map(x => `
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                        <div style="width:150px;font-size:13px;">${x.department}</div>
                        <div style="flex:1;height:20px;background:#F3F4F6;border-radius:6px;overflow:hidden;">
                            <div style="height:100%;width:${(x.amount / max * 100).toFixed(1)}%;background:linear-gradient(90deg,#2563EB,#0EA5E9);"></div>
                        </div>
                        <div style="width:140px;text-align:right;font-size:13px;font-weight:600;">${money(x.amount)}
                            <span style="color:#6B7280;font-weight:400;">${x.share}%</span></div>
                    </div>`).join('') +
                    `<div style="margin-top:16px;padding-top:14px;border-top:1px dashed #E5E7EB;font-size:12px;color:#6B7280;">
                        Monthly: ${(d.byMonth || []).map(m => `${m.month} ${money(m.collected)}`).join(' · ')}
                     </div>`;
            }
        }

        if (platformEl) {
            // The plan is priced by staff accounts, so the seat count is shown
            // beside it — it is the meter, and a manager who adds staff should
            // be able to see why the bill moved.
            const pc = d.platformCharges;
            const seats = pc && pc.includedSeats === null
                ? `${pc.staffSeats} staff accounts · unlimited on this plan`
                : pc ? `${pc.staffSeats} staff accounts · ${pc.includedSeats} included` : '';
            platformEl.innerHTML = pc ? `
                <p style="font-size:13px;margin-bottom:4px;">Subscription plan: <strong>${escapeHtml(pc.planName)}</strong></p>
                <p style="font-size:12px;color:#6B7280;margin-bottom:12px;">${escapeHtml(seats)}</p>
                <table class="data-table" style="width:100%;">
                    <tbody>
                        <tr><td>Monthly plan fee</td><td style="text-align:right;">${money(pc.baseFee)}</td></tr>
                        <tr><td>Extra staff seats</td><td style="text-align:right;">${pc.extraSeatFee ? money(pc.extraSeatFee) : '—'}</td></tr>
                        <tr><td>Bill payment processing</td><td style="text-align:right;">${money(pc.processingFees)}</td></tr>
                        <tr><td style="font-weight:700;">Total this cycle</td><td style="text-align:right;font-weight:700;">${money(pc.total)}</td></tr>
                    </tbody>
                </table>
                <p style="font-size:12px;color:#6B7280;margin-top:12px;">
                    NexCare takes no share of what you collect — your subscription is the same
                    whatever kind of month you have.
                </p>` : '<p>No active subscription for this hospital.</p>';
        }
    } catch (err) {
        console.error('Revenue load failed:', err);
        if (deptEl) deptEl.innerHTML = '<p style="color:#DC2626;">Could not load revenue data.</p>';
        if (platformEl) platformEl.innerHTML = '';
    }
}

/** The hospital this manager belongs to, from the stored user or the JWT. */
function getManagerHospitalId() {
    try {
        const raw = sessionStorage.getItem('nexcare_user_data');
        if (raw) {
            const u = JSON.parse(raw);
            if (u.hospitalId) return u.hospitalId;
        }
    } catch (e) { /* fall through to the token */ }
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    if (!token) return null;
    try {
        return JSON.parse(atob(token.split('.')[1])).hospitalId || null;
    } catch (e) {
        return null;
    }
}

/**
 * TAB 1: Load Overview Metrics & Pending Queue
 */
async function loadOverview() {
    const hospitalId = managerProfile?.hospitalId || 'H001';

    try {
        const [leavesResp, usersResp, inventoryResp, subResp, schedulesResp, supportResp] = await Promise.all([
            window.NexCareAPI.Leaves.getAll({ hospitalId }).catch(() => ({ success: false, data: [] })),
            window.NexCareAPI.Users.getAll().catch(() => ({ success: false, data: [] })),
            window.NexCareAPI.Inventory.getRequirements({ hospitalId }).catch(() => ({ success: false, data: [] })),
            window.NexCareAPI.Hospitals.getSubscription(hospitalId).catch(() => ({ success: false, data: null })),
            window.NexCareAPI.get(`/schedules?hospitalId=${encodeURIComponent(hospitalId)}&status=pending`).catch(() => ({ success: false, data: [] })),
            window.NexCareAPI.SupportRequests.getAll({ status: 'Open' }).catch(() => ({ success: false, data: [] }))
        ]);

        const leaves = (leavesResp.success && Array.isArray(leavesResp.data)) ? leavesResp.data : [];
        const users = (usersResp.success && Array.isArray(usersResp.data)) ? usersResp.data : [];
        const reqs = (inventoryResp.success && Array.isArray(inventoryResp.data)) ? inventoryResp.data : [];
        subscriptionData = subResp.success ? subResp.data : null;
        const pendingSchedules = (schedulesResp && schedulesResp.success && Array.isArray(schedulesResp.data)) ? schedulesResp.data.length : 0;
        const openSupport = (supportResp && supportResp.success && Array.isArray(supportResp.data)) ? supportResp.data.length : 0;

        // Scoped staff filters
        const doctors = users.filter(u => u.role === 'doctor' && u.hospitalId === hospitalId);
        const adminStaff = users.filter(u => u.role === 'administrative_staff' && u.hospitalId === hospitalId);
        const pendingLeaves = leaves.filter(l => l.status?.toLowerCase() === 'pending');
        const pendingReqs = reqs.filter(r => r.status?.toUpperCase() === 'PENDING');
        const urgentReqs = pendingReqs.filter(r => r.priority?.toUpperCase() === 'URGENT');

        // Update Stat Cards
        document.getElementById('statDoctors').textContent = doctors.length;
        document.getElementById('statPendingLeavesSub').textContent = `${pendingLeaves.length} pending leave request${pendingLeaves.length === 1 ? '' : 's'}`;
        if (document.getElementById('statPendingLeaves')) {
            document.getElementById('statPendingLeaves').textContent = pendingLeaves.length;
        }
        
        document.getElementById('statAdminStaff').textContent = adminStaff.length;
        if (document.getElementById('statPendingSchedules')) {
            document.getElementById('statPendingSchedules').textContent = pendingSchedules;
        }
        if (document.getElementById('statSupport')) {
            document.getElementById('statSupport').textContent = openSupport;
        }
        
        document.getElementById('statPendingInventory').textContent = pendingReqs.length;
        document.getElementById('statUrgentInventorySub').textContent = `${urgentReqs.length} urgent requisition${urgentReqs.length === 1 ? '' : 's'}`;

        // Nav counters
        const navLeave = document.getElementById('navLeaveBadge');
        if (navLeave) {
            navLeave.textContent = pendingLeaves.length;
            navLeave.style.display = pendingLeaves.length > 0 ? 'inline-block' : 'none';
        }

        const navInv = document.getElementById('navInventoryBadge');
        if (navInv) {
            navInv.textContent = pendingReqs.length;
            navInv.style.display = pendingReqs.length > 0 ? 'inline-block' : 'none';
        }

        // Subscription stats
        if (subscriptionData) {
            document.getElementById('statSubscriptionDays').textContent = subscriptionData.daysRemaining !== undefined ? subscriptionData.daysRemaining : '--';
            document.getElementById('statSubscriptionStatus').textContent = `License ${subscriptionData.status || 'Active'}`;
            
            if (document.getElementById('overviewSubHospitalName')) document.getElementById('overviewSubHospitalName').textContent = subscriptionData.hospitalName || managerProfile.hospitalName;
            if (document.getElementById('overviewSubHospitalId')) document.getElementById('overviewSubHospitalId').textContent = subscriptionData.hospitalId || hospitalId;
            if (document.getElementById('overviewSubExpiry')) document.getElementById('overviewSubExpiry').textContent = subscriptionData.subscriptionExpiryDate || '--';
            if (document.getElementById('overviewSubDays')) document.getElementById('overviewSubDays').textContent = `${subscriptionData.daysRemaining} Days`;
            
            const badge = document.getElementById('overviewSubBadge');
            if (badge) {
                badge.className = `badge badge-${subscriptionData.status === 'EXPIRED' ? 'rejected' : (subscriptionData.status === 'DUE_SOON' ? 'pending' : 'active')}`;
                badge.textContent = subscriptionData.status || 'Active';
            }

            const pill = document.getElementById('navSubPill');
            if (pill) {
                pill.textContent = subscriptionData.status === 'EXPIRED' ? 'Expired' : (subscriptionData.status === 'DUE_SOON' ? 'Due Soon' : 'Active');
                pill.className = `nav-pill ${subscriptionData.status === 'EXPIRED' ? 'bg-danger text-white' : ''}`;
            }

            renderSubscriptionBanner(subscriptionData);
        }

        // Render Pending Approvals Queue in Overview
        renderPendingQueue(pendingLeaves, pendingReqs);

    } catch (err) {
        console.error('Error loading overview:', err);
    }
}

/**
 * Render combined pending queue on overview tab
 */
function renderPendingQueue(pendingLeaves, pendingReqs) {
    const tbody = document.getElementById('pendingQueueTableBody');
    if (!tbody) return;

    const items = [];

    pendingLeaves.forEach(l => {
        items.push({
            type: 'LEAVE',
            id: l.id,
            title: `Doctor Leave: ${l.doctorName || 'Doctor'} (${l.leaveType || 'General'})`,
            requester: `${l.doctorName || 'Doctor'} • ${l.department || 'Clinical'}`,
            date: `${l.startDate} to ${l.endDate} (${l.daysCount || 1}d)`,
            priorityOrReason: l.reason || 'Medical / Personal reason',
            priorityBadge: 'MEDIUM',
            raw: l
        });
    });

    pendingReqs.forEach(r => {
        items.push({
            type: 'INVENTORY',
            id: r.id,
            title: `Inventory: ${r.itemName} (${r.requestedQuantity} ${r.unit})`,
            requester: `${r.requestedBy || 'Staff'} • ${r.department}`,
            date: `Req Date: ${r.requestDate || r.createdAt?.split('T')[0]}`,
            priorityOrReason: r.reason || 'Restock requisition',
            priorityBadge: r.priority || 'MEDIUM',
            raw: r
        });
    });

    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-cell text-success">
                    ✨ No pending approvals! All doctor leaves and inventory requisitions are up-to-date.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = items.map(item => `
        <tr>
            <td>
                <span class="badge ${item.type === 'LEAVE' ? 'badge-role' : 'badge-approved'}">
                    ${item.type === 'LEAVE' ? '🩺 Doctor Leave' : '📦 Inventory'}
                </span>
            </td>
            <td><strong>${item.title}</strong></td>
            <td>${item.requester}</td>
            <td>${item.date}</td>
            <td>
                <span class="badge badge-${(item.priorityBadge || 'medium').toLowerCase()}">${item.priorityBadge || 'MEDIUM'}</span>
                <div style="font-size:11.5px; color:#64748B; margin-top:2px;">${item.priorityOrReason}</div>
            </td>
            <td>
                <div style="display:flex; gap:6px;">
                    ${item.type === 'LEAVE' ? `
                        <button class="btn-action-sm btn-action-approve" onclick="approveLeave('${item.id}')">Approve</button>
                        <button class="btn-action-sm btn-action-reject" onclick="promptRejectLeave('${item.id}')">Reject</button>
                    ` : `
                        <button class="btn-action-sm btn-action-approve" onclick="approveInventoryReq('${item.id}')">Approve</button>
                        <button class="btn-action-sm btn-action-reject" onclick="promptRejectInventoryReq('${item.id}')">Reject</button>
                    `}
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Render subscription warning banner based on days remaining
 */
function renderSubscriptionBanner(sub) {
    const bannerContainer = document.getElementById('subscriptionAlertBanner');
    if (!bannerContainer || !sub) return;

    if (sub.warningLevel === 'expired') {
        bannerContainer.style.display = 'block';
        bannerContainer.innerHTML = `
            <div class="alert-banner alert-banner-expired">
                <div class="alert-banner-content">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <div>
                        <strong>Hospital Registration Expired:</strong> Your NexCare subscription ended on ${sub.subscriptionExpiryDate}. Please renew immediately to maintain active hospital services.
                    </div>
                </div>
                <button class="alert-btn alert-btn-danger" onclick="openRenewalModal()">Renew Subscription (12 Months)</button>
            </div>
        `;
    } else if (sub.warningLevel === 'urgent_7') {
        bannerContainer.style.display = 'block';
        bannerContainer.innerHTML = `
            <div class="alert-banner alert-banner-urgent">
                <div class="alert-banner-content">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <div>
                        <strong>URGENT: Registration Renewal Due:</strong> Only ${sub.daysRemaining} day${sub.daysRemaining === 1 ? '' : 's'} remaining before your hospital license expires on ${sub.subscriptionExpiryDate}.
                    </div>
                </div>
                <button class="alert-btn alert-btn-warning" onclick="openRenewalModal()">Renew License Now</button>
            </div>
        `;
    } else if (sub.warningLevel === 'warning_30') {
        bannerContainer.style.display = 'block';
        bannerContainer.innerHTML = `
            <div class="alert-banner alert-banner-warning">
                <div class="alert-banner-content">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <div>
                        <strong>Renewal Notice:</strong> Your NexCare annual registration expires in ${sub.daysRemaining} days (${sub.subscriptionExpiryDate}).
                    </div>
                </div>
                <button class="alert-btn alert-btn-warning" onclick="openRenewalModal()">Renew (+12 Months)</button>
            </div>
        `;
    } else {
        bannerContainer.style.display = 'none';
        bannerContainer.innerHTML = '';
    }
}

/**
 * TAB 2: Load Doctor Leaves
 */
async function loadLeaves() {
    const hospitalId = managerProfile?.hospitalId || 'H001';
    const tbody = document.getElementById('leavesTableBody');

    try {
        const resp = await window.NexCareAPI.Leaves.getAll({ hospitalId });
        allLeaves = (resp.success && Array.isArray(resp.data)) ? resp.data : [];

        // Populate department filter dropdown
        const deptFilter = document.getElementById('leaveDeptFilter');
        if (deptFilter) {
            const depts = [...new Set(allLeaves.map(l => l.department).filter(Boolean))];
            deptFilter.innerHTML = '<option value="ALL">All Departments</option>' + depts.map(d => `<option value="${d}">${d}</option>`).join('');
        }

        filterLeaves();
    } catch (e) {
        console.error('Error loading leaves:', e);
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="loading-cell text-danger">Failed to load doctor leaves.</td></tr>`;
    }
}

/**
 * Filter and render doctor leaves
 */
function filterLeaves() {
    const tbody = document.getElementById('leavesTableBody');
    if (!tbody) return;

    const searchTerm = (document.getElementById('leaveSearchInput')?.value || '').toLowerCase().trim();
    const statusFilter = document.getElementById('leaveStatusFilter')?.value || 'ALL';
    const deptFilter = document.getElementById('leaveDeptFilter')?.value || 'ALL';

    let filtered = [...allLeaves];

    if (statusFilter !== 'ALL') {
        filtered = filtered.filter(l => (l.status || '').toLowerCase() === statusFilter.toLowerCase());
    }

    if (deptFilter !== 'ALL') {
        filtered = filtered.filter(l => l.department === deptFilter);
    }

    if (searchTerm) {
        filtered = filtered.filter(l => 
            (l.doctorName || '').toLowerCase().includes(searchTerm) ||
            (l.reason || '').toLowerCase().includes(searchTerm) ||
            (l.specialization || '').toLowerCase().includes(searchTerm)
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="loading-cell">No leave requests match the selected criteria.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(leave => {
        const isPending = (leave.status || '').toLowerCase() === 'pending';
        const isApproved = (leave.status || '').toLowerCase() === 'approved';
        const isRejected = (leave.status || '').toLowerCase() === 'rejected';

        let auditText = '';
        if (isApproved && leave.approvedByName) {
            auditText = `<div style="font-size:11px; color:#059669; margin-top:2px;">Approved by ${leave.approvedByName} on ${leave.approvedAt ? leave.approvedAt.split('T')[0] : 'record'}</div>`;
        } else if (isRejected) {
            auditText = `<div style="font-size:11px; color:#DC2626; margin-top:2px;"><strong>Rejected:</strong> ${leave.rejectionReason || 'By Manager'}${leave.rejectedByName ? ` (${leave.rejectedByName})` : ''}</div>`;
        }

        return `
            <tr>
                <td>
                    <strong>${leave.doctorName || 'Dr. Practitioner'}</strong>
                    <div style="font-size:11px; color:#64748B;">ID: ${leave.doctorId || 'DOC'}</div>
                </td>
                <td>
                    <strong>${leave.department || 'Clinical'}</strong>
                    <div style="font-size:11px; color:#64748B;">${leave.specialization || 'Consultant'}</div>
                </td>
                <td>
                    <span class="badge badge-role">${leave.leaveType || 'Casual Leave'}</span>
                </td>
                <td>${leave.startDate} to ${leave.endDate}</td>
                <td><strong>${leave.daysCount || 1} day${(leave.daysCount || 1) === 1 ? '' : 's'}</strong></td>
                <td>${leave.reason || 'Personal / Medical'}</td>
                <td>
                    <span class="badge badge-${isPending ? 'pending' : (isApproved ? 'active' : 'rejected')}">
                        ${leave.status ? leave.status.toUpperCase() : 'PENDING'}
                    </span>
                    ${auditText}
                </td>
                <td>
                    ${isPending ? `
                        <div style="display:flex; gap:6px;">
                            <button class="btn-action-sm btn-action-approve" onclick="approveLeave('${leave.id}')">Approve</button>
                            <button class="btn-action-sm btn-action-reject" onclick="promptRejectLeave('${leave.id}')">Reject</button>
                        </div>
                    ` : `
                        <span style="font-size:12px; color:#94A3B8;">Completed</span>
                    `}
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Approve doctor leave
 */
async function approveLeave(leaveId) {
    try {
        const resp = await window.NexCareAPI.Leaves.approve(leaveId);
        if (resp.success) {
            showToast('Leave request approved successfully!', 'success');
            await loadOverview();
            await loadLeaves();
        } else {
            showToast(resp.message || 'Failed to approve leave', 'error');
        }
    } catch (e) {
        showToast('Error approving leave request', 'error');
    }
}

/**
 * Open rejection modal for doctor leave
 */
function promptRejectLeave(leaveId) {
    currentRejectionType = 'LEAVE';
    currentRejectionTargetId = leaveId;
    
    document.getElementById('rejectionModalTitle').textContent = 'Reject Doctor Leave Request';
    document.getElementById('rejectionModalPrompt').textContent = 'Please provide a clear administrative reason for rejecting this doctor leave request:';
    document.getElementById('rejectionReasonInput').value = '';
    document.getElementById('rejectionModal').style.display = 'flex';
}

/**
 * TAB: Schedules Management
 */
async function loadSchedules() {
    const tbody = document.getElementById('schedulesTableBody');
    if (!tbody) return;
    try {
        const hospitalId = managerProfile ? managerProfile.hospitalId : null;
        const path = hospitalId ? `/schedules?hospitalId=${encodeURIComponent(hospitalId)}` : '/schedules';
        const response = await window.NexCareAPI.get(path);
        if (response && response.success && Array.isArray(response.data)) {
            allSchedules = response.data;
            renderSchedules(allSchedules);
            const pending = allSchedules.filter(s => s.status === 'pending').length;
            if (document.getElementById('statPendingSchedules')) {
                document.getElementById('statPendingSchedules').textContent = pending;
            }
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="loading-cell">No schedules found.</td></tr>';
        }
    } catch (err) {
        console.error('Failed to load schedules:', err);
        tbody.innerHTML = '<tr><td colspan="5" class="loading-cell" style="color:#ef4444;">Failed to load schedules.</td></tr>';
    }
}

function renderSchedules(rows) {
    const tbody = document.getElementById('schedulesTableBody');
    if (!rows || rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading-cell">No schedules found.</td></tr>';
        return;
    }
    tbody.innerHTML = rows.map(s => {
        const statusBadge = s.status === 'approved' ? '<span class="badge badge-active">APPROVED</span>' :
            s.status === 'rejected' ? '<span class="badge badge-suspended">REJECTED</span>' :
            '<span class="badge badge-inactive">PENDING</span>';
        const coverage = (s.slots || []).map(sl => `${sl.department} · ${sl.shift}`).join('; ') || '—';
        const actions = s.status === 'pending' ? `
            <button onclick="approveSchedule('${s.id}')" style="padding:4px 8px; font-size:12px; border-radius:4px; background:#10B981; color:#fff; border:none; cursor:pointer; margin-right:4px;">Approve</button>
            <button onclick="rejectSchedule('${s.id}')" style="padding:4px 8px; font-size:12px; border-radius:4px; background:#EF4444; color:#fff; border:none; cursor:pointer;">Reject</button>
        ` : '<span style="color:#6A7282; font-size:12px;">Processed</span>';
        return `
            <tr>
                <td>${escapeHtml((s.validFrom || '') + ' to ' + (s.validTo || ''))}</td>
                <td>${escapeHtml(coverage)}</td>
                <td>${escapeHtml(s.notes || '—')}</td>
                <td>${statusBadge}</td>
                <td>${actions}</td>
            </tr>
        `;
    }).join('');
}

async function approveSchedule(id) {
    if (!confirm('Approve and publish this hospital schedule?')) return;
    const response = await window.NexCareAPI.patch(`/schedules/${id}`, { status: 'approved' });
    if (response && response.success) {
        showToast('Schedule approved and published!', 'success');
        if (window.NexCareUI && window.NexCareUI.showToast) {
            window.NexCareUI.showToast({ message: 'Schedule published', type: 'success' });
        }
        await loadSchedules();
        await loadOverview();
    } else {
        showToast((response && response.message) || 'Could not approve schedule', 'error');
    }
}

async function rejectSchedule(id) {
    if (!confirm('Reject this hospital schedule?')) return;
    const response = await window.NexCareAPI.patch(`/schedules/${id}`, { status: 'rejected' });
    if (response && response.success) {
        showToast('Schedule rejected', 'warning');
        if (window.NexCareUI && window.NexCareUI.showToast) {
            window.NexCareUI.showToast({ message: 'Schedule rejected', type: 'warning' });
        }
        await loadSchedules();
        await loadOverview();
    } else {
        showToast((response && response.message) || 'Could not reject schedule', 'error');
    }
}

function filterSchedules() {
    const statusVal = document.getElementById('scheduleStatusFilter').value;
    renderSchedules(allSchedules.filter(s => !statusVal || s.status === statusVal));
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * TAB 3: Load Staff Directory & Supervision
 */
async function loadStaff() {
    const hospitalId = managerProfile?.hospitalId || 'H001';
    const tbody = document.getElementById('staffTableBody');

    try {
        const resp = await window.NexCareAPI.Users.getAll();
        const users = (resp.success && Array.isArray(resp.data)) ? resp.data : [];
        
        // Scope to this hospital only
        allStaff = users.filter(u => u.hospitalId === hospitalId);

        filterStaff();
        loadSupervision();
    } catch (e) {
        console.error('Error loading staff:', e);
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="loading-cell text-danger">Failed to load staff directory.</td></tr>`;
    }
}

/**
 * Filter and render staff directory
 */
function filterStaff() {
    const tbody = document.getElementById('staffTableBody');
    if (!tbody) return;

    const searchTerm = (document.getElementById('staffSearchInput')?.value || '').toLowerCase().trim();
    const roleFilter = document.getElementById('staffRoleFilter')?.value || 'ALL';
    const statusFilter = document.getElementById('staffStatusFilter')?.value || 'ALL';

    let filtered = [...allStaff];

    if (roleFilter !== 'ALL') {
        filtered = filtered.filter(s => (s.role || '').toLowerCase() === roleFilter.toLowerCase());
    }

    if (statusFilter !== 'ALL') {
        filtered = filtered.filter(s => (s.status || '').toLowerCase() === statusFilter.toLowerCase());
    }

    if (searchTerm) {
        filtered = filtered.filter(s => 
            (s.name || '').toLowerCase().includes(searchTerm) ||
            (s.email || '').toLowerCase().includes(searchTerm) ||
            (s.employeeId || '').toLowerCase().includes(searchTerm) ||
            (s.designation || '').toLowerCase().includes(searchTerm)
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="loading-cell">No staff members found matching your search.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(staff => {
        const isActive = (staff.status || 'Active').toLowerCase() === 'active';
        const roleName = staff.role === 'doctor' ? 'Doctor' : (staff.role === 'administrative_staff' ? 'Administrative Staff' : (staff.role === 'ambulance' ? 'Ambulance Staff' : staff.role));

        let roleDetails = '';
        if (staff.role === 'doctor') {
            roleDetails = `
                <div><strong>MRN:</strong> ${staff.medicalRegNumber || 'MCI-REG'}</div>
                <div style="font-size:11px; color:#64748B;"><strong>OPD:</strong> ${staff.consultationTiming || 'Regular Hours'}</div>
            `;
        } else if (staff.role === 'administrative_staff') {
            const resps = Array.isArray(staff.responsibilities) ? staff.responsibilities : ['Bed Allocation', 'Inventory'];
            roleDetails = `
                <div class="resp-tags-container" style="margin-top:2px;">
                    ${resps.slice(0, 2).map(r => `<span class="resp-tag">${r}</span>`).join('')}
                </div>
            `;
        } else if (staff.role === 'ambulance') {
            roleDetails = `
                <div><strong>Veh:</strong> ${staff.assignedVehicle || 'AP-03-AX-1001'}</div>
                <div style="font-size:11px; color:#64748B;">${staff.shift || 'Day Shift'}</div>
            `;
        }

        return `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div class="user-avatar" style="width:34px; height:34px; font-size:12px;">
                            ${(staff.name || 'S').split(' ').map(n=>n[0]).join('').slice(0,2)}
                        </div>
                        <div>
                            <strong>${staff.name}</strong>
                            <div style="font-size:11px; color:#64748B;">ID: ${staff.employeeId || staff.id}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge ${staff.role === 'doctor' ? 'badge-role' : 'badge-approved'}">${roleName}</span>
                    <div style="font-size:12px; font-weight:600; color:#334155; margin-top:3px;">${staff.designation || staff.dept || 'General'}</div>
                </td>
                <td>
                    <div>${staff.email}</div>
                    <div style="font-size:11px; color:#64748B;">${staff.phone || '+91 98480 00000'}</div>
                </td>
                <td>${roleDetails}</td>
                <td>
                    <span class="badge badge-${isActive ? 'active' : 'inactive'}">
                        ${staff.status || 'Active'}
                    </span>
                </td>
                <td>
                    <div style="display:flex; gap:6px;">
                        <button class="btn-action-sm ${isActive ? 'btn-action-reject' : 'btn-action-approve'}" onclick="promptToggleStaffStatus('${staff.id}', '${isActive ? 'Inactive' : 'Active'}', '${staff.name}')">
                            ${isActive ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Open staff status toggle confirmation modal
 */
function promptToggleStaffStatus(userId, newStatus, userName) {
    currentStaffTargetId = userId;
    currentStaffTargetStatus = newStatus;

    document.getElementById('staffStatusTitle').textContent = `${newStatus === 'Active' ? 'Activate' : 'Deactivate'} Staff Member`;
    document.getElementById('staffStatusMsg').textContent = `Are you sure you want to mark ${userName} as ${newStatus}?`;
    document.getElementById('btnConfirmStaffStatus').onclick = executeToggleStaffStatus;
    document.getElementById('staffStatusModal').style.display = 'flex';
}

function closeStaffStatusModal() {
    document.getElementById('staffStatusModal').style.display = 'none';
    currentStaffTargetId = null;
    currentStaffTargetStatus = null;
}

async function executeToggleStaffStatus() {
    if (!currentStaffTargetId || !currentStaffTargetStatus) return;

    try {
        const resp = await window.NexCareAPI.Users.updateStatus(currentStaffTargetId, currentStaffTargetStatus);
        if (resp.success) {
            showToast(`Staff member marked as ${currentStaffTargetStatus}`, 'success');
            closeStaffStatusModal();
            await loadStaff();
        } else {
            showToast(resp.message || 'Failed to update status', 'error');
        }
    } catch (e) {
        showToast('Error updating staff status', 'error');
    }
}

/**
 * TAB 4: Load Inventory Requirements
 */
async function loadInventoryReqs() {
    const hospitalId = managerProfile?.hospitalId || 'H001';
    const tbody = document.getElementById('inventoryTableBody');

    try {
        const resp = await window.NexCareAPI.Inventory.getRequirements({ hospitalId });
        allInventoryReqs = (resp.success && Array.isArray(resp.data)) ? resp.data : [];

        filterInventoryReqs();
    } catch (e) {
        console.error('Error loading inventory reqs:', e);
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="loading-cell text-danger">Failed to load inventory requirements.</td></tr>`;
    }
}

/**
 * Filter and render inventory requirements
 */
function filterInventoryReqs() {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    const searchTerm = (document.getElementById('inventorySearchInput')?.value || '').toLowerCase().trim();
    const statusFilter = document.getElementById('inventoryStatusFilter')?.value || 'ALL';
    const priorityFilter = document.getElementById('inventoryPriorityFilter')?.value || 'ALL';

    let filtered = [...allInventoryReqs];

    if (statusFilter !== 'ALL') {
        filtered = filtered.filter(r => (r.status || '').toUpperCase() === statusFilter.toUpperCase());
    }

    if (priorityFilter !== 'ALL') {
        filtered = filtered.filter(r => (r.priority || '').toUpperCase() === priorityFilter.toUpperCase());
    }

    if (searchTerm) {
        filtered = filtered.filter(r => 
            (r.itemName || '').toLowerCase().includes(searchTerm) ||
            (r.department || '').toLowerCase().includes(searchTerm) ||
            (r.reason || '').toLowerCase().includes(searchTerm)
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="loading-cell">No inventory requisitions match the selected filter.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(req => {
        const isPending = (req.status || '').toUpperCase() === 'PENDING' || (req.status || '').toUpperCase() === 'PENDING_APPROVAL';
        const isApproved = (req.status || '').toUpperCase() === 'APPROVED';
        const isPurchasing = (req.status || '').toUpperCase() === 'PURCHASE_IN_PROGRESS';
        const isPurchased = (req.status || '').toUpperCase() === 'PURCHASED';
        const isRestocked = (req.status || '').toUpperCase() === 'RESTOCKED' || (req.status || '').toUpperCase() === 'FULFILLED';
        const isRejected = (req.status || '').toUpperCase() === 'REJECTED';

        let auditInfo = '';
        if (isApproved) {
            auditInfo = `<div style="font-size:11px; color:#059669; margin-top:2px;">Approved by ${req.approvedByName || 'Manager'}</div>
                         <div style="font-size:10.5px; color:#64748B;">Awaiting purchasing by Admin Staff</div>`;
        } else if (isPurchasing) {
            auditInfo = `<div style="font-size:11px; color:#0284c7; margin-top:2px;">PO in Progress (${req.supplier || 'Vendor'})</div>
                         <div style="font-size:10.5px; color:#64748B;">Invoice: ${req.invoiceNumber || 'Pending'}</div>`;
        } else if (isPurchased) {
            auditInfo = `<div style="font-size:11px; color:#7c3aed; margin-top:2px;">Purchased by Admin Staff</div>
                         <div style="font-size:10.5px; color:#64748B;">Awaiting delivery & restock</div>`;
        } else if (isRestocked) {
            auditInfo = `<div style="font-size:11px; color:#16a34a; margin-top:2px;">✓ Restocked (+${req.quantityPurchased || req.requestedQuantity} ${req.unit})</div>`;
        } else if (isRejected) {
            auditInfo = `<div style="font-size:11px; color:#DC2626; margin-top:2px;"><strong>Reason:</strong> ${req.rejectionReason || 'Rejected by Manager'}</div>`;
        }

        let statusBadgeClass = 'badge-pending';
        let displayStatus = 'PENDING APPROVAL';
        if (isApproved) { statusBadgeClass = 'badge-approved'; displayStatus = 'APPROVED'; }
        else if (isPurchasing) { statusBadgeClass = 'badge-role'; displayStatus = 'PURCHASING'; }
        else if (isPurchased) { statusBadgeClass = 'badge-active'; displayStatus = 'PURCHASED'; }
        else if (isRestocked) { statusBadgeClass = 'badge-active'; displayStatus = 'RESTOCKED'; }
        else if (isRejected) { statusBadgeClass = 'badge-rejected'; displayStatus = 'REJECTED'; }

        return `
            <tr>
                <td>
                    <strong>${req.id}</strong>
                    <div style="font-size:11px; color:#64748B;">${req.requestDate || req.createdAt?.split('T')[0]}</div>
                </td>
                <td>
                    <strong>${req.itemName}</strong>
                    <div style="font-size:11px; color:#64748B;">${req.category || 'Supplies'}</div>
                </td>
                <td>
                    <div><strong>${req.requestedQuantity}</strong> ${req.unit} requested</div>
                    <div style="font-size:11px; color:#64748B;">Current Stock: ${req.currentQuantity} ${req.unit}</div>
                </td>
                <td>
                    <strong>${req.department}</strong>
                    <div style="font-size:11px; color:#64748B;">${req.requestedBy || 'Admin Staff'}</div>
                </td>
                <td>
                    <span class="badge badge-${(req.priority || 'medium').toLowerCase()}">${req.priority || 'MEDIUM'}</span>
                    <div style="font-size:11px; color:#64748B; margin-top:2px;">${req.reason || ''}</div>
                </td>
                <td>
                    <strong>₹${(Number(req.estimatedCost) || 0).toLocaleString('en-IN')}</strong>
                </td>
                <td>
                    <span class="badge ${statusBadgeClass}">${displayStatus}</span>
                    ${auditInfo}
                </td>
                <td>
                    ${isPending ? `
                        <div style="display:flex; gap:6px;">
                            <button class="btn-action-sm btn-action-approve" onclick="openApprovalModal('${req.id}')">Approve</button>
                            <button class="btn-action-sm btn-action-reject" onclick="promptRejectInventoryReq('${req.id}')">Reject</button>
                        </div>
                    ` : `
                        <span style="font-size:12px; color:#64748B; font-weight:600;">Processed</span>
                    `}
                </td>
            </tr>
        `;
    }).join('');
}

let currentApprovalTargetId = null;

function openApprovalModal(reqId) {
    currentApprovalTargetId = reqId;
    document.getElementById('approvalRemarksInput').value = '';
    document.getElementById('approvalModal').style.display = 'flex';
}

function closeApprovalModal() {
    document.getElementById('approvalModal').style.display = 'none';
    currentApprovalTargetId = null;
}

async function executeApproval() {
    if (!currentApprovalTargetId) return;
    const remarks = document.getElementById('approvalRemarksInput').value.trim();

    try {
        const resp = await window.NexCareAPI.Inventory.approveRequirement(currentApprovalTargetId, remarks);
        if (resp.success) {
            showToast('Inventory requisition approved successfully! Passed to Admin Staff for purchasing.', 'success');
            closeApprovalModal();
            await loadOverview();
            await loadInventoryReqs();
        } else {
            showToast(resp.message || 'Failed to approve requirement', 'error');
        }
    } catch (e) {
        showToast('Error approving requirement', 'error');
    }
}

/**
 * Open rejection modal for inventory requirement
 */
function promptRejectInventoryReq(reqId) {
    currentRejectionType = 'INVENTORY';
    currentRejectionTargetId = reqId;

    document.getElementById('rejectionModalTitle').textContent = 'Reject Inventory Requisition';
    document.getElementById('rejectionModalPrompt').textContent = 'Please provide an administrative reason for rejecting this stock requirement:';
    document.getElementById('rejectionReasonInput').value = '';
    document.getElementById('rejectionModal').style.display = 'flex';
}

/**
 * Fulfill inventory requirement
 */
async function fulfillInventoryReq(reqId) {
    try {
        const resp = await window.NexCareAPI.Inventory.fulfillRequirement(reqId);
        if (resp.success) {
            showToast('Requirement fulfilled and item stock replenished!', 'success');
            await loadInventoryReqs();
        } else {
            showToast(resp.message || 'Failed to fulfill requirement', 'error');
        }
    } catch (e) {
        showToast('Error fulfilling requirement', 'error');
    }
}

/**
 * Execute Rejection Confirmation (Doctor Leave or Inventory)
 */
async function executeRejection() {
    const reason = document.getElementById('rejectionReasonInput').value.trim();
    if (!reason) {
        showToast('Please provide a rejection reason.', 'error');
        return;
    }

    try {
        if (currentRejectionType === 'LEAVE') {
            const resp = await window.NexCareAPI.Leaves.reject(currentRejectionTargetId, reason);
            if (resp.success) {
                showToast('Doctor leave request rejected with reason.', 'success');
                closeRejectionModal();
                await loadOverview();
                await loadLeaves();
            } else {
                showToast(resp.message || 'Failed to reject leave', 'error');
            }
        } else if (currentRejectionType === 'INVENTORY') {
            const resp = await window.NexCareAPI.Inventory.rejectRequirement(currentRejectionTargetId, reason);
            if (resp.success) {
                showToast('Inventory requirement rejected with reason.', 'success');
                closeRejectionModal();
                await loadOverview();
                await loadInventoryReqs();
            } else {
                showToast(resp.message || 'Failed to reject requirement', 'error');
            }
        }
    } catch (e) {
        showToast('Error executing rejection', 'error');
    }
}

function closeRejectionModal() {
    document.getElementById('rejectionModal').style.display = 'none';
    currentRejectionType = null;
    currentRejectionTargetId = null;
}

/**
 * TAB 5: Load Subscription & Renewal
 */
async function loadSubscription() {
    const hospitalId = managerProfile?.hospitalId || 'H001';
    const tbody = document.getElementById('paymentHistoryTableBody');

    try {
        const resp = await window.NexCareAPI.Hospitals.getSubscription(hospitalId);
        if (resp.success && resp.data) {
            subscriptionData = resp.data;

            document.getElementById('subHospitalTitle').textContent = `${subscriptionData.hospitalName} - Enterprise License`;
            document.getElementById('subHospitalIdVal').textContent = subscriptionData.hospitalId;
            document.getElementById('subRegDateVal').textContent = subscriptionData.registrationDate || '2024-01-01';
            document.getElementById('subStartDateVal').textContent = subscriptionData.subscriptionStartDate || '2025-01-01';
            document.getElementById('subExpiryDateVal').textContent = subscriptionData.subscriptionExpiryDate || '--';
            document.getElementById('subDaysCount').textContent = subscriptionData.daysRemaining !== undefined ? subscriptionData.daysRemaining : '--';
            
            const heroStatus = document.getElementById('subHeroStatusPill');
            if (heroStatus) {
                heroStatus.textContent = `Status: ${subscriptionData.status || 'Active'}`;
                heroStatus.style.background = subscriptionData.status === 'EXPIRED' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.2)';
                heroStatus.style.color = subscriptionData.status === 'EXPIRED' ? '#F87171' : '#34D399';
            }

            // Render payment history table
            const history = Array.isArray(subscriptionData.paymentHistory) ? subscriptionData.paymentHistory : [];
            if (tbody) {
                if (history.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">No previous renewal transactions recorded yet.</td></tr>`;
                } else {
                    tbody.innerHTML = history.map(item => `
                        <tr>
                            <td><strong>${item.date ? item.date.split('T')[0] : '--'}</strong></td>
                            <td><code>${item.transactionId}</code></td>
                            <td>${item.paymentType || 'UPI'}</td>
                            <td><strong>₹${(Number(item.amount) || 50000).toLocaleString('en-IN')}</strong></td>
                            <td>${item.previousExpiry || '--'}</td>
                            <td class="text-success"><strong>${item.newExpiry}</strong></td>
                            <td><span class="badge badge-active">${item.status || 'PAID'}</span></td>
                        </tr>
                    `).join('');
                }
            }
        }
    } catch (e) {
        console.error('Error loading subscription:', e);
    }
}

/**
 * Open 12-Month Renewal Modal with dynamic math
 */
function openRenewalModal() {
    const hospitalId = managerProfile?.hospitalId || 'H001';
    const hospitalName = subscriptionData?.hospitalName || managerProfile?.hospitalName || 'Hospital';

    document.getElementById('payModalHospitalName').textContent = `${hospitalName} (${hospitalId})`;
    
    const currentExpiryStr = subscriptionData?.subscriptionExpiryDate || new Date().toISOString().split('T')[0];
    document.getElementById('payModalCurrentExpiry').textContent = currentExpiryStr;

    // Calculate +12 months from current expiry (or from now if expired)
    const now = new Date();
    let baseDate = now;
    if (currentExpiryStr) {
        const curExp = new Date(currentExpiryStr);
        if (curExp > now) baseDate = curExp;
    }
    const newExp = new Date(baseDate);
    newExp.setFullYear(newExp.getFullYear() + 1);

    document.getElementById('payModalNewExpiry').textContent = `${newExp.toISOString().split('T')[0]} (+12 Months)`;

    document.getElementById('renewalModal').style.display = 'flex';
}

function closeRenewalModal() {
    document.getElementById('renewalModal').style.display = 'none';
}

/**
 * Switch payment methods in modal
 */
function switchPayTab(type, event) {
    if (event) event.preventDefault();

    document.querySelectorAll('.pay-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.pay-form-content').forEach(f => f.classList.remove('active'));

    if (type === 'upi') {
        document.querySelectorAll('.pay-tab')[0].classList.add('active');
        document.getElementById('payFormUpi').classList.add('active');
    } else if (type === 'card') {
        document.querySelectorAll('.pay-tab')[1].classList.add('active');
        document.getElementById('payFormCard').classList.add('active');
    } else if (type === 'netbanking') {
        document.querySelectorAll('.pay-tab')[2].classList.add('active');
        document.getElementById('payFormNetbanking').classList.add('active');
    }
}

/**
 * Process mock renewal payment
 */
async function processMockRenewalPayment() {
    const btn = document.getElementById('btnPayConfirm');
    const hospitalId = managerProfile?.hospitalId || 'H001';

    btn.disabled = true;
    btn.innerHTML = '<span>Processing Secure Payment...</span>';

    try {
        const paymentData = {
            paymentMethod: 'UPI (admin.aiims@icici)',
            amount: 50000
        };

        const resp = await window.NexCareAPI.Hospitals.renewSubscription(hospitalId, paymentData);
        if (resp.success) {
            showToast('Payment successful! Hospital subscription extended by 12 Months.', 'success');
            closeRenewalModal();
            await loadAllDashboardData();
        } else {
            showToast(resp.message || 'Payment processing failed', 'error');
        }
    } catch (e) {
        showToast('Error processing renewal payment', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Pay ₹50,000 & Extend 12 Months</span>';
    }
}

/**
 * TAB 6: Load Administrative Supervision
 */
function loadSupervision() {
    const grid = document.getElementById('adminStaffGrid');
    if (!grid) return;

    const hospitalId = managerProfile?.hospitalId || 'H001';
    const adminStaff = allStaff.filter(s => s.role === 'administrative_staff' && s.hospitalId === hospitalId);

    if (adminStaff.length === 0) {
        grid.innerHTML = `<p class="loading-cell">No administrative staff members found for this hospital.</p>`;
        return;
    }

    grid.innerHTML = adminStaff.map(staff => {
        const resps = Array.isArray(staff.responsibilities) ? staff.responsibilities : [
            'Bed Allocation & Patient Check-in',
            'Inventory Requisition & Tracking',
            'Billing & Discharge Administration'
        ];

        return `
            <div class="admin-card">
                <div class="admin-card-header">
                    <div class="admin-avatar">
                        ${staff.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                    </div>
                    <div>
                        <h4 style="font-size:15px; font-weight:700; color:#0F172A;">${staff.name}</h4>
                        <div style="font-size:12px; color:#64748B;">${staff.designation || 'Operations Lead'} • ${staff.employeeId || staff.id}</div>
                        <div style="font-size:12px; color:#2563EB;">${staff.email}</div>
                    </div>
                </div>

                <div>
                    <label style="font-size:11.5px; font-weight:700; text-transform:uppercase; color:#64748B; margin-bottom:6px; display:block;">
                        Supervised Responsibilities
                    </label>
                    <div class="resp-tags-container">
                        ${resps.map(r => `<span class="resp-tag">✓ ${r}</span>`).join('')}
                    </div>
                </div>

                <div style="border-top:1px solid #F1F5F9; padding-top:10px; display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#64748B;">
                    <span>Status: <strong class="text-success">${staff.status || 'Active'}</strong></span>
                    <span>Joined: ${staff.joiningDate || '2024-01-15'}</span>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * TAB 7: Load Support Requests
 */
async function loadSupport() {
    const hospitalId = managerProfile?.hospitalId || 'H001';
    const tbody = document.getElementById('supportTableBody');

    try {
        const resp = await window.NexCareAPI.SupportRequests.getAll(hospitalId);
        allSupport = (resp.success && Array.isArray(resp.data)) ? resp.data : [];

        if (!tbody) return;
        if (allSupport.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="loading-cell">No support tickets found for your hospital.</td></tr>`;
            return;
        }

        tbody.innerHTML = allSupport.map(ticket => `
            <tr>
                <td><strong>${ticket.id}</strong></td>
                <td>
                    <strong>${ticket.subject || ticket.title}</strong>
                    <div style="font-size:11px; color:#64748B;">${ticket.category || 'General'}</div>
                </td>
                <td><span class="badge badge-${(ticket.priority || 'medium').toLowerCase()}">${ticket.priority || 'MEDIUM'}</span></td>
                <td>${ticket.createdAt ? ticket.createdAt.split('T')[0] : '--'}</td>
                <td>
                    <span class="badge badge-${ticket.status === 'Open' ? 'pending' : 'active'}">
                        ${ticket.status || 'Open'}
                    </span>
                </td>
                <td>${ticket.response || ticket.resolution || 'Pending regional review'}</td>
            </tr>
        `).join('');
    } catch (e) {
        console.error('Error loading support:', e);
    }
}

let lastRegisteredCredentials = null;
let emailPreviewTimeout = null;

function previewDedicatedStaffEmail() {
    clearTimeout(emailPreviewTimeout);
    const name = document.getElementById('pageStaffName').value.trim();
    if (!name) {
        document.getElementById('pageStaffEmailPreview').value = 'name@nexcare.in';
        return;
    }

    emailPreviewTimeout = setTimeout(async () => {
        try {
            const resp = await window.NexCareAPI.Users.previewEmail(name);
            if (resp.success && resp.data?.email) {
                document.getElementById('pageStaffEmailPreview').value = resp.data.email;
            }
        } catch (e) {
            console.error('Email preview error:', e);
        }
    }, 250);
}

function handlePageStaffRoleChange() {
    const role = document.getElementById('pageStaffRole').value;
    const docSec = document.getElementById('pageDoctorFields');
    const admSec = document.getElementById('pageAdminFields');
    const ambSec = document.getElementById('pageAmbulanceFields');

    if (docSec) docSec.style.display = role === 'doctor' ? 'block' : 'none';
    if (admSec) admSec.style.display = role === 'administrative_staff' ? 'block' : 'none';
    if (ambSec) ambSec.style.display = role === 'ambulance' ? 'block' : 'none';
}

async function handleDedicatedStaffSubmit(e) {
    e.preventDefault();

    const role = document.getElementById('pageStaffRole').value;
    const hospitalId = managerProfile?.hospitalId || 'H001';
    const hospitalName = managerProfile?.hospitalName || 'NexCare AIIMS Super Speciality Hospital';
    const name = document.getElementById('pageStaffName')?.value.trim();

    if (!name) {
        showToast('Please enter staff full name', 'error');
        return;
    }

    const newStaff = {
        name,
        phone: document.getElementById('pageStaffPhone')?.value.trim() || '+91 98480 12345',
        dob: document.getElementById('pageStaffDob')?.value || undefined,
        gender: document.getElementById('pageStaffGender')?.value || 'Other',
        address: document.getElementById('pageStaffAddress')?.value.trim() || undefined,
        dept: document.getElementById('pageStaffDept')?.value || 'General Medicine',
        designation: document.getElementById('pageStaffDesignation')?.value.trim() || 'Staff Member',
        qualification: document.getElementById('pageStaffQualification')?.value.trim() || undefined,
        joiningDate: document.getElementById('pageStaffJoiningDate')?.value || new Date().toISOString().split('T')[0],
        employmentType: document.getElementById('pageStaffEmploymentType')?.value || 'Full-time',
        role,
        hospitalId,
        hospitalName,
        status: 'Active'
    };

    if (role === 'doctor') {
        newStaff.specialization = document.getElementById('pageDoctorSpecialization')?.value.trim() || 'General Medicine';
        newStaff.medicalRegNumber = document.getElementById('pageDoctorMRN')?.value.trim() || 'MCI-00000';
        newStaff.experienceYears = Number(document.getElementById('pageDoctorExperience')?.value) || 5;
        newStaff.consultationTiming = document.getElementById('pageDoctorTiming')?.value.trim() || '09:00 AM - 01:00 PM (Mon-Fri)';
        newStaff.consultationFee = Number(document.getElementById('pageDoctorFee')?.value) || 500;
    } else if (role === 'administrative_staff') {
        const checked = Array.from(document.querySelectorAll('input[name="pageAdminResp"]:checked')).map(c => c.value);
        newStaff.responsibilities = checked.length > 0 ? checked : ['Bed Allocation & Patient Check-in', 'Inventory Requisition & Tracking'];
    } else if (role === 'ambulance') {
        newStaff.driverLicense = document.getElementById('pageAmbLicense')?.value.trim() || 'DL-AP-TEMP';
        newStaff.assignedVehicle = document.getElementById('pageAmbVehicle')?.value.trim() || 'AP-03-AX-1001';
        newStaff.shift = document.getElementById('pageAmbShift')?.value || 'Day Shift (08:00 - 16:00)';
    }

    const btn = document.getElementById('submitRegBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Registering Staff...';
    }

    try {
        const resp = await window.NexCareAPI.Users.create(newStaff);
        if (resp.success && resp.data) {
            showToast(`Staff member ${newStaff.name} registered successfully!`, 'success');
            showRegistrationSuccessModal(resp.data);
            document.getElementById('dedicatedStaffForm').reset();
            await loadOverview();
            await loadStaff();
        } else {
            const err = resp.message ? (Array.isArray(resp.message) ? resp.message.join(', ') : resp.message) : 'Staff registration failed';
            showToast(err, 'error');
        }
    } catch (err) {
        showToast('Error registering staff member: ' + (err.message || 'Server error'), 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Submit Registration';
        }
    }
}

let modalEmailPreviewTimeout = null;

function previewModalStaffEmail() {
    clearTimeout(modalEmailPreviewTimeout);
    const name = document.getElementById('staffName')?.value.trim();
    const emailField = document.getElementById('staffEmail');
    if (!emailField) return;

    if (!name) {
        emailField.value = '';
        return;
    }

    modalEmailPreviewTimeout = setTimeout(async () => {
        try {
            const resp = await window.NexCareAPI.Users.previewEmail(name);
            if (resp.success && resp.data?.email) {
                emailField.value = resp.data.email;
            }
        } catch (e) {
            console.error('Modal email preview error:', e);
        }
    }, 250);
}

/**
 * STAFF REGISTRATION MODAL CONTROLS
 */
function openStaffModal() {
    initManagerInfo();
    document.getElementById('staffForm').reset();
    document.getElementById('staffHospitalId').value = managerProfile?.hospitalId || 'H001';
    document.getElementById('staffHospitalName').value = managerProfile?.hospitalName || 'NexCare AIIMS Super Speciality Hospital';
    document.getElementById('staffEmail').value = '';
    handleStaffRoleChange();
    document.getElementById('staffModal').style.display = 'flex';
}

function closeStaffModal() {
    document.getElementById('staffModal').style.display = 'none';
}

function handleStaffRoleChange() {
    const role = document.getElementById('staffRole').value;
    const docSec = document.getElementById('doctorFieldsSection');
    const admSec = document.getElementById('adminStaffFieldsSection');
    const ambSec = document.getElementById('ambulanceFieldsSection');

    if (docSec) docSec.style.display = role === 'doctor' ? 'block' : 'none';
    if (admSec) admSec.style.display = role === 'administrative_staff' ? 'block' : 'none';
    if (ambSec) ambSec.style.display = role === 'ambulance' ? 'block' : 'none';
}

async function handleStaffSubmit(e) {
    e.preventDefault();

    const role = document.getElementById('staffRole').value;
    const hospitalId = managerProfile?.hospitalId || 'H001';
    const hospitalName = managerProfile?.hospitalName || 'NexCare AIIMS Super Speciality Hospital';
    const name = document.getElementById('staffName')?.value.trim();

    if (!name) {
        showToast('Please enter staff full name', 'error');
        return;
    }

    const newStaff = {
        name,
        phone: document.getElementById('staffPhone')?.value.trim() || '+91 98480 12345',
        dept: document.getElementById('staffDept')?.value || 'General Medicine',
        designation: document.getElementById('staffDesignation')?.value.trim() || 'Staff Member',
        gender: document.getElementById('staffGender')?.value || 'Other',
        employmentType: document.getElementById('staffEmploymentType')?.value || 'Full-time',
        role,
        hospitalId,
        hospitalName,
        status: 'Active'
    };

    if (role === 'doctor') {
        newStaff.specialization = document.getElementById('doctorSpecialization')?.value.trim() || 'General Medicine';
        newStaff.medicalRegNumber = document.getElementById('doctorMRN')?.value.trim() || 'MCI-00000';
        newStaff.qualification = document.getElementById('doctorQualification')?.value.trim() || 'MBBS, MD';
        newStaff.experienceYears = Number(document.getElementById('doctorExperience')?.value) || 5;
        newStaff.consultationTiming = document.getElementById('doctorTiming')?.value.trim() || '09:00 AM - 01:00 PM';
    } else if (role === 'administrative_staff') {
        const checked = Array.from(document.querySelectorAll('input[name="adminResp"]:checked')).map(c => c.value);
        newStaff.responsibilities = checked.length > 0 ? checked : ['Bed Allocation & Patient Check-in'];
    } else if (role === 'ambulance') {
        newStaff.driverLicense = document.getElementById('ambulanceLicense')?.value.trim() || 'DL-AP-TEMP';
        newStaff.assignedVehicle = document.getElementById('ambulanceVehicle')?.value.trim() || 'AP-03-AX-1001';
        newStaff.shift = document.getElementById('ambulanceShift')?.value || 'Day Shift (08:00 - 16:00)';
    }

    const btn = document.getElementById('submitStaffRegistration') || document.getElementById('btnSubmitStaff');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Registering Staff...';
    }

    try {
        const resp = await window.NexCareAPI.Users.create(newStaff);
        if (resp.success && resp.data) {
            closeStaffModal();
            showRegistrationSuccessModal(resp.data);
            await loadOverview();
            await loadStaff();
        } else {
            const err = resp.message ? (Array.isArray(resp.message) ? resp.message.join(', ') : resp.message) : 'Staff registration failed';
            showToast(err, 'error');
        }
    } catch (err) {
        showToast('Error creating staff record: ' + (err.message || 'Server error'), 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Submit Registration';
        }
    }
}

/**
 * Show Registration Success Credentials Modal
 */
function showRegistrationSuccessModal(userData) {
    lastRegisteredCredentials = {
        name: userData.name,
        employeeId: userData.employeeId || userData.id,
        role: userData.role === 'doctor' ? 'Doctor' : (userData.role === 'administrative_staff' ? 'Administrative Staff' : (userData.role === 'ambulance' ? 'Ambulance Staff' : userData.role)),
        hospital: userData.hospitalName || managerProfile?.hospitalName || 'Hospital',
        email: userData.email,
        password: userData.tempPassword || 'NexCare@123'
    };

    document.getElementById('successEmpName').textContent = lastRegisteredCredentials.name;
    document.getElementById('successEmpId').textContent = lastRegisteredCredentials.employeeId;
    document.getElementById('successEmpRole').textContent = lastRegisteredCredentials.role;
    document.getElementById('successEmpHospital').textContent = lastRegisteredCredentials.hospital;
    document.getElementById('successEmpEmail').textContent = lastRegisteredCredentials.email;
    document.getElementById('successEmpPass').textContent = lastRegisteredCredentials.password;

    document.getElementById('registrationSuccessModal').style.display = 'flex';
}

function copyStaffCredentials() {
    if (!lastRegisteredCredentials) return;
    const credText = `NexCare Staff Credentials:\nName: ${lastRegisteredCredentials.name}\nEmployee ID: ${lastRegisteredCredentials.employeeId}\nRole: ${lastRegisteredCredentials.role}\nHospital: ${lastRegisteredCredentials.hospital}\nEmail: ${lastRegisteredCredentials.email}\nTemporary Password: ${lastRegisteredCredentials.password}\n(Note: Password change required on first login)`;
    
    navigator.clipboard.writeText(credText).then(() => {
        showToast('Staff credentials copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Credentials ready: ' + lastRegisteredCredentials.email, 'info');
    });
}

function registerAnotherStaff() {
    document.getElementById('registrationSuccessModal').style.display = 'none';
    switchTab('register-staff');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToStaffDirectory() {
    document.getElementById('registrationSuccessModal').style.display = 'none';
    switchTab('staff');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Global Toast Notification Utility
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            ${type === 'success' ? '<polyline points="20 6 9 17 4 12"></polyline>' : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'}
        </svg>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/**
 * Logout Helper
 */
function logoutUser() {
    try {
        sessionStorage.clear();
        localStorage.removeItem('nexcare_token');
        localStorage.removeItem('nexcare_user_data');
        localStorage.removeItem('nexcare_currentUser');
    } catch (e) {}
    window.location.href = '../auth/login.html';
}

/**
 * =========================================================
 * AMBULANCE FLEET & EMERGENCY STATUS MANAGEMENT
 * =========================================================
 */
let ambulanceCache = [];

async function loadAmbulanceFleet() {
    const hospitalId = managerProfile?.hospitalId || 'H001';
    const tbody = document.getElementById('ambulanceTableBody');
    if (!tbody) return;

    try {
        const resp = await window.NexCareAPI.Ambulance.getAll({ hospitalId }).catch(() => ({ success: false, data: [] }));
        if (resp.success && Array.isArray(resp.data)) {
            ambulanceCache = resp.data;
        } else {
            ambulanceCache = [];
        }

        updateAmbulanceKpis();
        renderAmbulances(ambulanceCache);
    } catch (err) {
        console.error('Error loading ambulance fleet:', err);
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding:24px;">Failed to load ambulance records.</td></tr>`;
    }
}

function updateAmbulanceKpis() {
    const total = ambulanceCache.length;
    const available = ambulanceCache.filter(a => (a.status || '').toLowerCase() === 'available').length;
    const onDuty = ambulanceCache.filter(a => ['dispatched', 'en route', 'pending'].includes((a.status || '').toLowerCase())).length;
    const maintenance = ambulanceCache.filter(a => ['maintenance', 'unavailable'].includes((a.status || '').toLowerCase())).length;

    if (document.getElementById('ambStatTotal')) document.getElementById('ambStatTotal').textContent = total;
    if (document.getElementById('ambStatAvailable')) document.getElementById('ambStatAvailable').textContent = available;
    if (document.getElementById('ambStatOnDuty')) document.getElementById('ambStatOnDuty').textContent = onDuty;
    if (document.getElementById('ambStatMaintenance')) document.getElementById('ambStatMaintenance').textContent = maintenance;

    const navBadge = document.getElementById('navAmbulanceBadge');
    if (navBadge) {
        navBadge.textContent = onDuty;
        navBadge.style.display = onDuty > 0 ? 'inline-block' : 'none';
    }
}

function renderAmbulances(list) {
    const tbody = document.getElementById('ambulanceTableBody');
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding:28px;">No ambulance fleet records matching criteria.</td></tr>`;
        return;
    }

    const getStatusBadge = (st) => {
        const s = (st || '').toLowerCase();
        if (s === 'available') return `<span class="badge" style="background:#dcfce7; color:#15803d; font-weight:700;">🟢 Available</span>`;
        if (s === 'dispatched') return `<span class="badge" style="background:#dbeafe; color:#1d4ed8; font-weight:700;">🔵 Dispatched</span>`;
        if (s === 'en route') return `<span class="badge" style="background:#fef3c7; color:#b45309; font-weight:700;">🟡 En Route</span>`;
        if (s === 'pending') return `<span class="badge" style="background:#fee2e2; color:#b91c1c; font-weight:700;">🔴 Pending Dispatch</span>`;
        if (s === 'maintenance') return `<span class="badge" style="background:#f3e8ff; color:#7e22ce; font-weight:700;">⚙️ Maintenance</span>`;
        if (s === 'completed') return `<span class="badge" style="background:#e0f2fe; color:#0369a1; font-weight:700;">✅ Completed</span>`;
        return `<span class="badge" style="background:#f1f5f9; color:#475569;">${st || 'Unknown'}</span>`;
    };

    tbody.innerHTML = list.map(item => `
        <tr>
            <td>
                <div style="font-weight:700; color:#0f172a;">${item.vehicleNumber || item.id}</div>
                <small style="color:#64748b; font-size:11.5px;">Unit ID: ${item.id}</small>
            </td>
            <td>
                <span class="badge" style="background:#f1f5f9; color:#334155; font-size:12px; font-weight:600;">
                    ${item.type || 'Emergency Ambulance'}
                </span>
            </td>
            <td>
                <div style="font-weight:600; color:#1e293b;">${item.driverName || 'Unassigned'}</div>
                <small style="color:#64748b; font-size:12px;">📞 ${item.driverPhone || item.contact || '--'}</small>
            </td>
            <td>
                <div style="font-weight:600; color:#0f172a;">${item.patientName || 'Standby / Fleet Unit'}</div>
                <small style="color:#64748b; display:block; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${item.notes || ''}">
                    ${item.notes || 'Emergency standby ready'}
                </small>
            </td>
            <td>
                <div style="color:#334155; font-size:13px;">📍 ${item.pickupLocation || 'Central Hospital Bay'}</div>
            </td>
            <td>
                ${getStatusBadge(item.status)}
            </td>
            <td>
                <span style="font-weight:700; color:#0284c7; font-size:13px;">${item.eta || 'Ready'}</span>
            </td>
            <td>
                <button class="btn-action-sm btn-action-view" onclick="openAmbulanceStatusModal('${item.id}')" title="Update Status">
                    ✏️ Update
                </button>
            </td>
        </tr>
    `).join('');
}

function handleAmbulanceSearch() {
    const q = (document.getElementById('ambSearchInput')?.value || '').toLowerCase().trim();
    const st = document.getElementById('ambStatusFilter')?.value || 'all';

    let filtered = [...ambulanceCache];
    if (st !== 'all') {
        filtered = filtered.filter(a => (a.status || '').toLowerCase() === st.toLowerCase());
    }
    if (q) {
        filtered = filtered.filter(a =>
            (a.id || '').toLowerCase().includes(q) ||
            (a.vehicleNumber || '').toLowerCase().includes(q) ||
            (a.driverName || '').toLowerCase().includes(q) ||
            (a.patientName || '').toLowerCase().includes(q) ||
            (a.pickupLocation || '').toLowerCase().includes(q) ||
            (a.type || '').toLowerCase().includes(q)
        );
    }
    renderAmbulances(filtered);
}

function handleAmbulanceFilter() {
    handleAmbulanceSearch();
}

function filterAmbulances(st) {
    const sel = document.getElementById('ambStatusFilter');
    if (!sel) return;
    if (st === 'all') sel.value = 'all';
    else if (st === 'active') sel.value = 'Dispatched';
    else sel.value = st;
    handleAmbulanceFilter();
}

function openAmbulanceStatusModal(id) {
    const item = ambulanceCache.find(a => a.id === id);
    if (!item) return;

    document.getElementById('ambModalId').value = item.id;
    document.getElementById('ambModalVehicle').value = `${item.vehicleNumber || item.id} (${item.type || 'Ambulance'})`;
    document.getElementById('ambModalStatus').value = item.status || 'Available';
    document.getElementById('ambModalDriver').value = item.driverName ? `${item.driverName} (${item.driverPhone || ''})` : '';
    document.getElementById('ambModalEta').value = item.eta || '';
    document.getElementById('ambModalNotes').value = item.notes || '';

    document.getElementById('ambulanceStatusModal').style.display = 'flex';
}

function closeAmbulanceStatusModal() {
    document.getElementById('ambulanceStatusModal').style.display = 'none';
}

async function saveAmbulanceStatus(e) {
    e.preventDefault();
    const id = document.getElementById('ambModalId').value;
    const status = document.getElementById('ambModalStatus').value;
    const driverRaw = document.getElementById('ambModalDriver').value.trim();
    const eta = document.getElementById('ambModalEta').value.trim() || (status === 'Available' ? 'Ready' : '--');
    const notes = document.getElementById('ambModalNotes').value.trim();

    let driverName = driverRaw;
    let driverPhone = '';
    if (driverRaw.includes('(')) {
        const parts = driverRaw.split('(');
        driverName = parts[0].trim();
        driverPhone = parts[1].replace(')', '').trim();
    }

    const btn = document.getElementById('btnSaveAmbulanceStatus');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Saving...';
    }

    try {
        const resp = await window.NexCareAPI.Ambulance.update(id, {
            status,
            driverName,
            driverPhone: driverPhone || undefined,
            eta,
            notes: notes || undefined
        });

        if (resp.success) {
            showToast(`Ambulance ${id} status updated to ${status}`, 'success');
            closeAmbulanceStatusModal();
            await loadAmbulanceFleet();
            await loadOverview();
        } else {
            showToast(resp.message || 'Failed to update status', 'error');
        }
    } catch (err) {
        showToast('Error updating ambulance status', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Save Status';
        }
    }
}

function openNewAmbulanceRequestModal() {
    document.getElementById('newAmbulanceForm').reset();
    document.getElementById('newAmbulanceModal').style.display = 'flex';
}

function closeNewAmbulanceRequestModal() {
    document.getElementById('newAmbulanceModal').style.display = 'none';
}

async function handleNewAmbulanceSubmit(e) {
    e.preventDefault();
    const patientName = document.getElementById('newAmbPatientName').value.trim();
    const contact = document.getElementById('newAmbContact').value.trim();
    const pickupLocation = document.getElementById('newAmbPickup').value.trim();
    const type = document.getElementById('newAmbType').value;
    const vehicleNumber = document.getElementById('newAmbVehicle').value;
    const driverName = document.getElementById('newAmbDriverName')?.value.trim();
    const driverPhone = document.getElementById('newAmbDriverPhone')?.value.trim();
    const notes = document.getElementById('newAmbNotes').value.trim();
    const hospitalId = managerProfile?.hospitalId || 'H001';

    const btn = document.getElementById('btnSubmitNewAmbulance');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Dispatching...';
    }

    try {
        const resp = await window.NexCareAPI.Ambulance.create({
            patientName,
            contact,
            pickupLocation,
            type,
            vehicleNumber,
            driverName: driverName || undefined,
            driverPhone: driverPhone || undefined,
            notes: notes || `Emergency ${type} requested by manager`,
            status: 'Dispatched',
            eta: '8 mins',
            hospitalId
        });

        if (resp.success) {
            showToast(`Ambulance ${vehicleNumber} dispatched for ${patientName}!`, 'success');
            closeNewAmbulanceRequestModal();
            await loadAmbulanceFleet();
            await loadOverview();
        } else {
            showToast(resp.message || 'Failed to dispatch ambulance', 'error');
        }
    } catch (err) {
        showToast('Error dispatching ambulance', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Dispatch Ambulance';
        }
    }
}

// ── Patient Feedback & Issues (Hospital Manager) ────────────────────────────
let allHmFeedback = [];
let hmFeedbackEditingId = null;

async function loadHmFeedback() {
    const hospitalId = getManagerHospitalId();
    if (!hospitalId) return;

    try {
        const resp = await window.NexCareAPI.Feedback.getAll({ hospitalId });
        allHmFeedback = (resp.success && Array.isArray(resp.data)) ? resp.data : [];
        hmRenderFeedback();
    } catch (err) {
        console.error('Failed to load feedback:', err);
        const tbody = document.getElementById('hmFeedbackTableBody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="loading-cell" style="color:red;">Error loading feedback.</td></tr>`;
    }
}

function hmRenderFeedback() {
    const tbody = document.getElementById('hmFeedbackTableBody');
    if (!tbody) return;

    if (allHmFeedback.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">No feedback found.</td></tr>`;
        return;
    }

    const filterVal = document.getElementById('hmFeedbackStatusFilter')?.value || 'all';
    const filtered = allHmFeedback.filter(f => filterVal === 'all' || f.status === filterVal);

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">No feedback matches this filter.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(f => {
        let statusBadge = f.status === 'Resolved' ? 'active' : (f.status === 'In Progress' ? 'pending' : 'rejected');
        let ratingStars = '⭐'.repeat(f.rating) + '☆'.repeat(5 - f.rating);
        let dateStr = f.createdAt ? new Date(f.createdAt).toISOString().split('T')[0] : 'N/A';

        return `
        <tr>
            <td>${dateStr}</td>
            <td style="font-weight:500;">${f.sender || 'Anonymous'}</td>
            <td>
                <div style="font-weight:600;">${f.subject || 'N/A'}</div>
                <div style="font-size:12px; color:#6B7280; margin-top:4px;">${f.summary || f.description || ''}</div>
            </td>
            <td>${f.category || 'General'}</td>
            <td style="color:#F59E0B; font-size:14px;">${ratingStars}</td>
            <td><span class="badge badge-${statusBadge}">${f.status || 'Open'}</span></td>
            <td>
                <button class="btn-secondary" style="padding:4px 10px; font-size:12px;" onclick="openHmFeedbackModal('${f.id}', '${f.status}')">Update Status</button>
            </td>
        </tr>
        `;
    }).join('');
}

function openHmFeedbackModal(id, currentStatus) {
    hmFeedbackEditingId = id;
    document.getElementById('hmFeedbackCurrentStatus').textContent = currentStatus || 'Open';
    document.getElementById('hmFeedbackNewStatus').value = currentStatus || 'Open';
    
    const modal = document.getElementById('hmFeedbackStatusModal');
    modal.style.display = 'flex';
}

function closeHmFeedbackModal() {
    hmFeedbackEditingId = null;
    document.getElementById('hmFeedbackStatusModal').style.display = 'none';
}

async function saveHmFeedbackStatus() {
    if (!hmFeedbackEditingId) return;
    const newStatus = document.getElementById('hmFeedbackNewStatus').value;
    
    try {
        const res = await window.NexCareAPI.Feedback.updateStatus(hmFeedbackEditingId, newStatus);
        if (!res || !res.success) throw new Error('Update failed');
        
        // Update local state
        const idx = allHmFeedback.findIndex(f => f.id === hmFeedbackEditingId);
        if (idx >= 0) {
            allHmFeedback[idx].status = newStatus;
            hmRenderFeedback();
        }
        closeHmFeedbackModal();
    } catch (err) {
        console.error(err);
        alert('Could not update status. Please try again.');
    }
}

// =========================================================
// INFRASTRUCTURE (WARDS & BEDS)
// =========================================================
async function loadInfrastructure() {
    const tableBody = document.getElementById('infrastructureTableBody');
    if (!tableBody) return;
    try {
        const resp = await window.NexCareAPI.getBeds();
        if (resp.success) {
            const beds = resp.data || [];
            if (beds.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#6b7280;">No beds registered yet.</td></tr>';
            } else {
                tableBody.innerHTML = beds.map(b => `
                    <tr>
                        <td><strong>${b.id}</strong></td>
                        <td>${b.ward}</td>
                        <td><span class="status-pill status-${(b.status || '').toLowerCase().replace('_', '-')}">${b.status}</span></td>
                        <td>${b.patient || '-'}</td>
                    </tr>
                `).join('');
            }
        } else {
            tableBody.innerHTML = `<tr><td colspan="4" class="error-cell">${resp.message || 'Failed to load infrastructure.'}</td></tr>`;
        }
    } catch (e) {
        tableBody.innerHTML = '<tr><td colspan="4" class="error-cell">Failed to load infrastructure.</td></tr>';
    }
}

async function handleNewBedSubmit(e) {
    e.preventDefault();
    const ward = document.getElementById('bedWard').value;
    const bedId = document.getElementById('bedId').value;
    try {
        const resp = await window.NexCareAPI.createBed({ id: bedId, ward });
        if (resp.success) {
            NexCareUI.showToast({ message: 'Bed registered successfully!', type: 'success' });
            document.getElementById('newBedForm').reset();
            loadInfrastructure();
        } else {
            NexCareUI.showToast({ message: resp.message || 'Failed to register bed.', type: 'error' });
        }
    } catch (e) {
        NexCareUI.showToast({ message: 'Network error.', type: 'error' });
    }
}

// =========================================================
// INVENTORY CATALOG
// =========================================================
async function loadInventoryCatalog() {
    const tableBody = document.getElementById('inventoryCatalogTableBody');
    if (!tableBody) return;
    try {
        const resp = await window.NexCareAPI.getInventory();
        if (resp.success) {
            const items = resp.data || [];
            if (items.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#6b7280;">Catalog is empty. Add items above.</td></tr>';
            } else {
                tableBody.innerHTML = items.map(item => {
                    const statusClass = item.quantity <= item.minStock ? 'status-critical' : 'status-active';
                    return `
                        <tr>
                            <td><strong>${item.name}</strong><br><small style="color:#6b7280">${item.id}</small></td>
                            <td>${item.category}</td>
                            <td>${item.location}</td>
                            <td>${item.quantity} ${item.unit} <small style="color:#6b7280;">(Min: ${item.minStock})</small></td>
                            <td><span class="status-pill ${statusClass}">${item.quantity <= item.minStock ? 'LOW STOCK' : 'IN STOCK'}</span></td>
                        </tr>
                    `;
                }).join('');
            }
        } else {
            tableBody.innerHTML = `<tr><td colspan="5" class="error-cell">${resp.message || 'Failed to load inventory.'}</td></tr>`;
        }
    } catch (e) {
        tableBody.innerHTML = '<tr><td colspan="5" class="error-cell">Failed to load inventory.</td></tr>';
    }
}

async function handleNewInventorySubmit(e) {
    e.preventDefault();
    const payload = {
        name: document.getElementById('invName').value,
        category: document.getElementById('invCategory').value,
        quantity: parseInt(document.getElementById('invQty').value, 10),
        minStock: parseInt(document.getElementById('invMin').value, 10),
        unit: document.getElementById('invUnit').value,
        location: document.getElementById('invLocation').value,
    };
    try {
        const resp = await window.NexCareAPI.createInventory(payload);
        if (resp.success) {
            NexCareUI.showToast({ message: 'Item added to catalog!', type: 'success' });
            document.getElementById('newInventoryForm').reset();
            loadInventoryCatalog();
        } else {
            NexCareUI.showToast({ message: resp.message || 'Failed to add item.', type: 'error' });
        }
    } catch (e) {
        NexCareUI.showToast({ message: 'Network error.', type: 'error' });
    }
}

function toggleSidebar() {
    document.body.classList.toggle('sidebar-collapsed');
}
