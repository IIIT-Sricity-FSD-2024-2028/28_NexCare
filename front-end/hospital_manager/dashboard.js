/**
 * Hospital Manager Portal JavaScript Logic
 */
let allLeaves = [];
let allStaff = [];
let allSupport = [];
let managerProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
    initManagerInfo();
    await loadOverview();
    await loadLeaves();
    await loadStaff();
    await loadSupport();
});

function initManagerInfo() {
    const rawUser = sessionStorage.getItem('nexcare_user_data') || localStorage.getItem('nexcare_user_data');
    if (rawUser) {
        try {
            managerProfile = JSON.parse(rawUser);
            if (document.getElementById('managerName')) document.getElementById('managerName').textContent = managerProfile.name || 'Hospital Manager';
            if (document.getElementById('managerHospital')) document.getElementById('managerHospital').textContent = `🏥 ${managerProfile.hospitalName || managerProfile.hospital || 'Hospital'}`;
            
            const initials = (managerProfile.name || 'HM')
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
            if (document.getElementById('managerAvatar')) document.getElementById('managerAvatar').textContent = initials || 'HM';
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

function switchTab(tabName, event) {
    if (event) event.preventDefault();
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active-tab'));
    
    if (tabName === 'overview') {
        document.querySelector('a[href="#overview"]').classList.add('active');
        document.getElementById('overviewTab').classList.add('active-tab');
        document.getElementById('pageTitle').textContent = 'Hospital Overview';
        document.getElementById('pageSubtitle').textContent = 'Manage hospital operations and staff';
    } else if (tabName === 'leaves') {
        document.querySelector('a[href="#leaves"]').classList.add('active');
        document.getElementById('leavesTab').classList.add('active-tab');
        document.getElementById('pageTitle').textContent = 'Leave Approvals';
        document.getElementById('pageSubtitle').textContent = 'Approve or reject doctor leave requests';
    } else if (tabName === 'staff') {
        document.querySelector('a[href="#staff"]').classList.add('active');
        document.getElementById('staffTab').classList.add('active-tab');
        document.getElementById('pageTitle').textContent = 'Staff Directory';
        document.getElementById('pageSubtitle').textContent = 'View and manage hospital staff';
    } else if (tabName === 'support') {
        document.querySelector('a[href="#support"]').classList.add('active');
        document.getElementById('supportTab').classList.add('active-tab');
        document.getElementById('pageTitle').textContent = 'Support Requests';
        document.getElementById('pageSubtitle').textContent = 'Handle patient and staff support requests';
    } else if (tabName === 'revenue') {
        document.querySelector('a[href="#revenue"]').classList.add('active');
        document.getElementById('revenueTab').classList.add('active-tab');
        document.getElementById('pageTitle').textContent = 'Revenue';
        document.getElementById('pageSubtitle').textContent = 'Collections, outstanding bills and platform charges';
        loadRevenue();
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
        deptEl.innerHTML = '<p style="color:#DC2626;">No hospital is linked to this account.</p>';
        return;
    }

    const money = v => '₹' + (Number(v) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

    try {
        const res = await window.NexCareAPI.Revenue.getHospitalRevenue(hospitalId);
        if (!res.success) throw new Error(res.message || 'Failed to load revenue');
        const d = res.data;
        revenueLoaded = true;

        statsEl.innerHTML = `
            <div class="stat-card"><div class="stat-label">Collected</div><div class="stat-value">${money(d.collected)}</div></div>
            <div class="stat-card"><div class="stat-label">Outstanding</div><div class="stat-value">${money(d.outstanding)}</div></div>
            <div class="stat-card"><div class="stat-label">Collection Rate</div><div class="stat-value">${d.collectionRate}%</div></div>
            <div class="stat-card"><div class="stat-label">Bills Issued</div><div class="stat-value">${d.billsIssued}</div></div>`;

        if (!d.byDepartment.length) {
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
                    Monthly: ${d.byMonth.map(m => `${m.month} ${money(m.collected)}`).join(' · ')}
                 </div>`;
        }

        const pc = d.platformCharges;
        platformEl.innerHTML = pc ? `
            <p style="font-size:13px;margin-bottom:12px;">Subscription plan: <strong>${pc.planName}</strong></p>
            <table class="data-table" style="width:100%;">
                <tbody>
                    <tr><td>Monthly base fee</td><td style="text-align:right;">${money(pc.baseFee)}</td></tr>
                    <tr><td>Bed overage</td><td style="text-align:right;">${pc.bedOverageFee ? money(pc.bedOverageFee) : '—'}</td></tr>
                    <tr><td>Commission on collections</td><td style="text-align:right;">${money(pc.commission)}</td></tr>
                    <tr><td style="font-weight:700;">Total this cycle</td><td style="text-align:right;font-weight:700;">${money(pc.total)}</td></tr>
                </tbody>
            </table>` : '<p>No active subscription for this hospital.</p>';
    } catch (err) {
        console.error('Revenue load failed:', err);
        deptEl.innerHTML = '<p style="color:#DC2626;">Could not load revenue data.</p>';
        platformEl.innerHTML = '';
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

async function loadOverview() {
    const tbody = document.getElementById('overviewTableBody');
    
    const hideLoading = window.NexCareUI && window.NexCareUI.showLoading 
        ? window.NexCareUI.showLoading('Loading overview...') 
        : null;
    
    try {
        if (!window.NexCareAPI) {
            throw new Error('API library not loaded. Please refresh the page.');
        }
        
        // Load various metrics
        const [leavesResp, supportResp] = await Promise.all([
            window.NexCareAPI.Leaves.getAll({ status: 'pending' }).catch(() => ({ success: false, data: [] })),
            window.NexCareAPI.SupportRequests.getAll({ status: 'Open' }).catch(() => ({ success: false, data: [] }))
        ]);
        
        if (hideLoading) hideLoading();
        
        const pendingLeaves = leavesResp.success ? leavesResp.data.length : 0;
        const openSupport = supportResp.success ? supportResp.data.length : 0;
        
        document.getElementById('statPendingLeaves').textContent = pendingLeaves;
        document.getElementById('statSupport').textContent = openSupport;
        
        tbody.innerHTML = `
            <tr>
                <td><strong>Pending Leave Requests</strong></td>
                <td>${pendingLeaves}</td>
                <td>${pendingLeaves > 0 ? '<span class="badge badge-inactive">Needs Attention</span>' : '<span class="badge badge-active">All Clear</span>'}</td>
            </tr>
            <tr>
                <td><strong>Open Support Requests</strong></td>
                <td>${openSupport}</td>
                <td>${openSupport > 0 ? '<span class="badge badge-inactive">Needs Attention</span>' : '<span class="badge badge-active">All Clear</span>'}</td>
            </tr>
            <tr>
                <td><strong>Hospital Status</strong></td>
                <td>Operational</td>
                <td><span class="badge badge-active">Active</span></td>
            </tr>
        `;
    } catch (err) {
        if (hideLoading) hideLoading();
        console.error('Failed to load overview:', err);
        
        if (window.NexCareUI && window.NexCareUI.showToast) {
            window.NexCareUI.showToast({ 
                message: 'Failed to load overview. Please check your connection.', 
                type: 'error' 
            });
        }
        
        tbody.innerHTML = '<tr><td colspan="3" class="loading-cell" style="color:#ef4444;">Failed to load overview. Please try again.</td></tr>';
    }
}

async function loadLeaves() {
    const tbody = document.getElementById('leavesTableBody');
    
    const hideLoading = window.NexCareUI && window.NexCareUI.showLoading 
        ? window.NexCareUI.showLoading('Loading leave requests...') 
        : null;
    
    try {
        if (!window.NexCareAPI || !window.NexCareAPI.Leaves) {
            throw new Error('API library not loaded. Please refresh the page.');
        }
        
        const hospitalId = managerProfile ? managerProfile.hospitalId : null;
        const response = await window.NexCareAPI.Leaves.getAll(hospitalId ? { hospitalId } : {});
        
        if (hideLoading) hideLoading();
        
        if (response && response.success && Array.isArray(response.data)) {
            allLeaves = response.data;
            renderLeaves(allLeaves);
            document.getElementById('statPendingLeaves').textContent = allLeaves.filter(l => l.status === 'pending').length;
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">No leave requests found.</td></tr>';
        }
    } catch (err) {
        if (hideLoading) hideLoading();
        console.error('Failed to load leaves:', err);
        
        if (window.NexCareUI && window.NexCareUI.showToast) {
            window.NexCareUI.showToast({ 
                message: 'Failed to load leave requests. Please check your connection.', 
                type: 'error' 
            });
        }
        
        tbody.innerHTML = '<tr><td colspan="6" class="loading-cell" style="color:#ef4444;">Failed to load leave requests. Please try again.</td></tr>';
    }
}

function renderLeaves(leaves) {
    const tbody = document.getElementById('leavesTableBody');
    if (!leaves || leaves.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">No leave requests found.</td></tr>';
        return;
    }

    tbody.innerHTML = leaves.map(l => {
        const statusBadge = l.status === 'approved' ? '<span class="badge badge-active">APPROVED</span>' :
            l.status === 'rejected' ? '<span class="badge badge-suspended">REJECTED</span>' :
            '<span class="badge badge-inactive">PENDING</span>';
        
        const dates = `${l.startDate || ''} to ${l.endDate || ''}`;
        const actions = l.status === 'pending' ? `
            <button onclick="approveLeave('${l.id}')" style="padding:4px 8px; font-size:12px; border-radius:4px; background:#10B981; color:#fff; border:none; cursor:pointer; margin-right:4px;">
                Approve
            </button>
            <button onclick="rejectLeave('${l.id}')" style="padding:4px 8px; font-size:12px; border-radius:4px; background:#EF4444; color:#fff; border:none; cursor:pointer;">
                Reject
            </button>
        ` : '<span style="color:#6A7282; font-size:12px;">Processed</span>';
        
        return `
            <tr>
                <td><strong>${escapeHtml(l.doctorName || 'Doctor')}</strong></td>
                <td>${escapeHtml(l.department || 'N/A')}</td>
                <td>${escapeHtml(dates)}</td>
                <td>${escapeHtml(l.reason || 'N/A')}</td>
                <td>${statusBadge}</td>
                <td>${actions}</td>
            </tr>
        `;
    }).join('');
}

async function approveLeave(id) {
    if (!confirm('Approve this leave request?')) return;
    
    const hideLoading = window.NexCareUI && window.NexCareUI.showLoading 
        ? window.NexCareUI.showLoading('Approving leave...') 
        : null;
    
    try {
        const response = await window.NexCareAPI.Leaves.update(id, { status: 'approved' });
        
        if (hideLoading) hideLoading();
        
        if (response && response.success) {
            if (window.NexCareUI && window.NexCareUI.showToast) {
                window.NexCareUI.showToast({ 
                    message: 'Leave request approved successfully', 
                    type: 'success' 
                });
            }
            await loadLeaves();
        } else {
            if (window.NexCareUI && window.NexCareUI.showError) {
                window.NexCareUI.showError({ 
                    title: 'Failed to Approve',
                    message: response.message || 'Could not approve leave request'
                });
            }
        }
    } catch (err) {
        if (hideLoading) hideLoading();
        console.error('Leave approval error:', err);
        
        if (window.NexCareUI && window.NexCareUI.showToast) {
            window.NexCareUI.showToast({ 
                message: 'Failed to approve leave. Please try again.', 
                type: 'error' 
            });
        }
    }
}

async function rejectLeave(id) {
    if (!confirm('Reject this leave request?')) return;
    
    const hideLoading = window.NexCareUI && window.NexCareUI.showLoading 
        ? window.NexCareUI.showLoading('Rejecting leave...') 
        : null;
    
    try {
        const response = await window.NexCareAPI.Leaves.update(id, { status: 'rejected' });
        
        if (hideLoading) hideLoading();
        
        if (response && response.success) {
            if (window.NexCareUI && window.NexCareUI.showToast) {
                window.NexCareUI.showToast({ 
                    message: 'Leave request rejected', 
                    type: 'warning' 
                });
            }
            await loadLeaves();
        } else {
            if (window.NexCareUI && window.NexCareUI.showError) {
                window.NexCareUI.showError({ 
                    title: 'Failed to Reject',
                    message: response.message || 'Could not reject leave request'
                });
            }
        }
    } catch (err) {
        if (hideLoading) hideLoading();
        console.error('Leave rejection error:', err);
        
        if (window.NexCareUI && window.NexCareUI.showToast) {
            window.NexCareUI.showToast({ 
                message: 'Failed to reject leave. Please try again.', 
                type: 'error' 
            });
        }
    }
}

function filterLeaves() {
    const statusVal = document.getElementById('leaveStatusFilter').value;
    const filtered = allLeaves.filter(l => !statusVal || l.status === statusVal);
    renderLeaves(filtered);
}

async function loadStaff() {
    const tbody = document.getElementById('staffTableBody');
    
    const hideLoading = window.NexCareUI && window.NexCareUI.showLoading 
        ? window.NexCareUI.showLoading('Loading staff...') 
        : null;
    
    try {
        if (!window.NexCareAPI || !window.NexCareAPI.Users) {
            throw new Error('API library not loaded. Please refresh the page.');
        }
        
        const hospitalId = managerProfile ? managerProfile.hospitalId : null;
        const response = await window.NexCareAPI.Users.getAll();
        
        if (hideLoading) hideLoading();
        
        if (response && response.success && Array.isArray(response.data)) {
            allStaff = response.data.filter(u => !hospitalId || u.hospitalId === hospitalId);
            renderStaff(allStaff);
            document.getElementById('statStaff').textContent = allStaff.length;
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="loading-cell">No staff found.</td></tr>';
        }
    } catch (err) {
        if (hideLoading) hideLoading();
        console.error('Failed to load staff:', err);
        
        if (window.NexCareUI && window.NexCareUI.showToast) {
            window.NexCareUI.showToast({ 
                message: 'Failed to load staff. Please check your connection.', 
                type: 'error' 
            });
        }
        
        tbody.innerHTML = '<tr><td colspan="5" class="loading-cell" style="color:#ef4444;">Failed to load staff. Please try again.</td></tr>';
    }
}

function renderStaff(staff) {
    const tbody = document.getElementById('staffTableBody');
    if (!staff || staff.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading-cell">No staff found.</td></tr>';
        return;
    }

    tbody.innerHTML = staff.map(s => {
        const statusBadge = s.status === 'Active' ? '<span class="badge badge-active">Active</span>' :
            s.status === 'On Leave' ? '<span class="badge badge-inactive">On Leave</span>' :
            '<span class="badge badge-suspended">Inactive</span>';
        
        return `
            <tr>
                <td><strong>${escapeHtml(s.name || 'N/A')}</strong></td>
                <td>${escapeHtml(s.email || 'N/A')}</td>
                <td>${escapeHtml(s.role || 'N/A')}</td>
                <td>${escapeHtml(s.dept || 'N/A')}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    }).join('');
}

function filterStaff() {
    const query = document.getElementById('staffSearch').value.toLowerCase().trim();
    const filtered = allStaff.filter(s => 
        !query || 
        (s.name && s.name.toLowerCase().includes(query)) ||
        (s.email && s.email.toLowerCase().includes(query)) ||
        (s.role && s.role.toLowerCase().includes(query))
    );
    renderStaff(filtered);
}

async function loadSupport() {
    const tbody = document.getElementById('supportTableBody');
    
    const hideLoading = window.NexCareUI && window.NexCareUI.showLoading 
        ? window.NexCareUI.showLoading('Loading support requests...') 
        : null;
    
    try {
        if (!window.NexCareAPI || !window.NexCareAPI.SupportRequests) {
            throw new Error('API library not loaded. Please refresh the page.');
        }
        
        const response = await window.NexCareAPI.SupportRequests.getAll();
        
        if (hideLoading) hideLoading();
        
        if (response && response.success && Array.isArray(response.data)) {
            allSupport = response.data;
            renderSupport(allSupport);
            document.getElementById('statSupport').textContent = allSupport.filter(s => s.status === 'Open').length;
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="loading-cell">No support requests found.</td></tr>';
        }
    } catch (err) {
        if (hideLoading) hideLoading();
        console.error('Failed to load support requests:', err);
        
        if (window.NexCareUI && window.NexCareUI.showToast) {
            window.NexCareUI.showToast({ 
                message: 'Failed to load support requests. Please check your connection.', 
                type: 'error' 
            });
        }
        
        tbody.innerHTML = '<tr><td colspan="5" class="loading-cell" style="color:#ef4444;">Failed to load support requests. Please try again.</td></tr>';
    }
}

function renderSupport(support) {
    const tbody = document.getElementById('supportTableBody');
    if (!support || support.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading-cell">No support requests found.</td></tr>';
        return;
    }

    tbody.innerHTML = support.map(s => {
        const statusBadge = s.status === 'Open' ? '<span class="badge badge-inactive">Open</span>' :
            s.status === 'In Progress' ? '<span class="badge badge-driver">In Progress</span>' :
            '<span class="badge badge-active">Resolved</span>';
        
        const actions = s.status === 'Open' ? `
            <button onclick="updateSupportStatus('${s.id}', 'In Progress')" style="padding:4px 8px; font-size:12px; border-radius:4px; background:#3B82F6; color:#fff; border:none; cursor:pointer; margin-right:4px;">
                Start
            </button>
        ` : s.status === 'In Progress' ? `
            <button onclick="updateSupportStatus('${s.id}', 'Resolved')" style="padding:4px 8px; font-size:12px; border-radius:4px; background:#10B981; color:#fff; border:none; cursor:pointer;">
                Resolve
            </button>
        ` : '<span style="color:#10B981; font-size:12px;">Completed</span>';
        
        return `
            <tr>
                <td><strong>${escapeHtml(s.id || 'N/A')}</strong></td>
                <td>${escapeHtml(s.subject || 'N/A')}</td>
                <td>${escapeHtml(s.priority || 'Normal')}</td>
                <td>${statusBadge}</td>
                <td>${actions}</td>
            </tr>
        `;
    }).join('');
}

async function updateSupportStatus(id, status) {
    const hideLoading = window.NexCareUI && window.NexCareUI.showLoading 
        ? window.NexCareUI.showLoading('Updating status...') 
        : null;
    
    try {
        const response = await window.NexCareAPI.SupportRequests.update(id, { status });
        
        if (hideLoading) hideLoading();
        
        if (response && response.success) {
            if (window.NexCareUI && window.NexCareUI.showToast) {
                window.NexCareUI.showToast({ 
                    message: `Support request ${status.toLowerCase()}`, 
                    type: 'success' 
                });
            }
            await loadSupport();
        } else {
            if (window.NexCareUI && window.NexCareUI.showError) {
                window.NexCareUI.showError({ 
                    title: 'Failed to Update',
                    message: response.message || 'Could not update support request'
                });
            }
        }
    } catch (err) {
        if (hideLoading) hideLoading();
        console.error('Support update error:', err);
        
        if (window.NexCareUI && window.NexCareUI.showToast) {
            window.NexCareUI.showToast({ 
                message: 'Failed to update support request. Please try again.', 
                type: 'error' 
            });
        }
    }
}

function filterSupport() {
    const statusVal = document.getElementById('supportStatusFilter').value;
    const filtered = allSupport.filter(s => !statusVal || s.status === statusVal);
    renderSupport(filtered);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
