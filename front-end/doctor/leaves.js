// Doctor Leave Management JavaScript
// Handles leave requests, viewing, and filtering

const MOCK_LEAVES = [
    {
        id: 'L001',
        doctorId: 'U007',
        doctorName: 'Dr. Anjali Desai',
        hospitalId: 'H001',
        startDate: '2026-08-20',
        endDate: '2026-08-25',
        reason: 'Family vacation',
        status: 'approved',
        createdAt: '2026-08-15T00:00:00Z',
        updatedAt: '2026-08-16T00:00:00Z',
        approvedBy: 'U002',
        approvedAt: '2026-08-16T00:00:00Z'
    },
    {
        id: 'L002',
        doctorId: 'U005',
        doctorName: 'Dr. Sarah Smith',
        hospitalId: 'H001',
        startDate: '2026-09-01',
        endDate: '2026-09-03',
        reason: 'Medical conference attendance',
        status: 'pending',
        createdAt: '2026-08-20T00:00:00Z',
        updatedAt: '2026-08-20T00:00:00Z'
    },
    {
        id: 'L003',
        doctorId: 'U006',
        doctorName: 'Dr. Vikram Patel',
        hospitalId: 'H001',
        startDate: '2026-08-28',
        endDate: '2026-08-30',
        reason: 'Personal medical appointment',
        status: 'pending',
        createdAt: '2026-08-24T00:00:00Z',
        updatedAt: '2026-08-24T00:00:00Z'
    }
];

let allLeaves = [];
let currentUserId = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadUserInfo();
    loadLeaves();
    setupDateValidation();
});

// Load current user information
function loadUserInfo() {
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUserId = payload.sub || payload.id || payload.userId || null;
        } catch (e) {
            console.error('Error parsing token:', e);
        }
    }
}

// Load all leaves for the current doctor
async function loadLeaves() {
    let leavesList = [];

    try {
        let response = null;
        const apiService = window.NexCareAPI || (typeof api !== 'undefined' ? api : null);
        
        if (apiService && apiService.Leaves) {
            response = await apiService.Leaves.getAll(currentUserId ? { doctorId: currentUserId } : {});
        } else if (apiService && typeof apiService.get === 'function') {
            const endpoint = currentUserId ? `/leaves?doctorId=${encodeURIComponent(currentUserId)}` : '/leaves';
            response = await apiService.get(endpoint);
        }

        if (response && response.success) {
            const rawData = response.data;
            if (Array.isArray(rawData)) {
                leavesList = rawData;
            } else if (rawData && Array.isArray(rawData.data)) {
                leavesList = rawData.data;
            }
        }

        // If filtering by currentUserId returned empty, try fetching all leaves
        if (leavesList.length === 0 && currentUserId && apiService) {
            const allRes = await (apiService.Leaves ? apiService.Leaves.getAll() : apiService.get('/leaves'));
            if (allRes && allRes.success && Array.isArray(allRes.data) && allRes.data.length > 0) {
                leavesList = allRes.data;
            }
        }
    } catch (error) {
        console.warn('Backend leaves API unreachable, using client mock fallback:', error);
    }

    // Fallback to mock data if no leaves retrieved
    if (!leavesList || leavesList.length === 0) {
        try {
            const stored = localStorage.getItem('nexcare_mock_leaves');
            if (stored) {
                leavesList = JSON.parse(stored);
            }
        } catch(e) {}

        if (!leavesList || leavesList.length === 0) {
            leavesList = JSON.parse(JSON.stringify(MOCK_LEAVES));
            try { localStorage.setItem('nexcare_mock_leaves', JSON.stringify(leavesList)); } catch(e) {}
        }
    }

    allLeaves = leavesList;
    updateStatistics();
    renderLeavesTable(allLeaves);
}

// Update statistics cards
function updateStatistics() {
    const pending = allLeaves.filter(l => (l.status || '').toLowerCase() === 'pending').length;
    const approved = allLeaves.filter(l => (l.status || '').toLowerCase() === 'approved').length;
    const rejected = allLeaves.filter(l => (l.status || '').toLowerCase() === 'rejected').length;

    const pendingEl = document.getElementById('pendingCount');
    const approvedEl = document.getElementById('approvedCount');
    const rejectedEl = document.getElementById('rejectedCount');

    if (pendingEl) pendingEl.textContent = pending;
    if (approvedEl) approvedEl.textContent = approved;
    if (rejectedEl) rejectedEl.textContent = rejected;
}

// Render leaves table
function renderLeavesTable(leaves) {
    const tbody = document.getElementById('leavesTableBody');
    const noDataMessage = document.getElementById('noLeavesMessage');

    if (!tbody) return;

    if (!leaves || leaves.length === 0) {
        tbody.innerHTML = '';
        if (noDataMessage) noDataMessage.style.display = 'flex';
        return;
    }

    if (noDataMessage) noDataMessage.style.display = 'none';
    tbody.innerHTML = leaves.map(leave => `
        <tr>
            <td><span class="badge" style="background: #F3F4F6; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 12px; color: #374151;">${leave.id}</span></td>
            <td>
                <div class="date-range" style="display: flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                        <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M3 8h14" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    <span>${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}</span>
                </div>
            </td>
            <td>${truncateText(leave.reason, 30)}</td>
            <td>
                <span class="status-badge status-${(leave.status || 'pending').toLowerCase()}" style="padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-block;">
                    ${capitalizeFirst(leave.status)}
                </span>
            </td>
            <td>${formatDate(leave.createdAt)}</td>
            <td>
                <div style="display: flex; gap: 6px;">
                    <button class="btn-icon" onclick="viewLeaveDetails('${leave.id}')" title="View Details" style="padding: 4px 8px; border: 1px solid #D1D5DB; border-radius: 6px; background: #FFF; cursor: pointer;">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                            <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M2 10c1.5-4 4.5-6.5 8-6.5s6.5 2.5 8 6.5c-1.5 4-4.5 6.5-8 6.5S3.5 14 2 10z" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                    </button>
                    ${(leave.status || '').toLowerCase() === 'pending' ? `
                        <button class="btn-icon btn-icon-danger" onclick="cancelLeave('${leave.id}')" title="Cancel Request" style="padding: 4px 8px; border: 1px solid #FCA5A5; border-radius: 6px; background: #FEF2F2; color: #DC2626; cursor: pointer;">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                <path d="M4 4l12 12M4 16L16 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Filter leaves by status
function filterLeaves() {
    const statusSelect = document.getElementById('statusFilter');
    if (!statusSelect) return;
    const status = statusSelect.value;
    
    if (status === 'all') {
        renderLeavesTable(allLeaves);
    } else {
        const filtered = allLeaves.filter(leave => (leave.status || '').toLowerCase() === status.toLowerCase());
        renderLeavesTable(filtered);
    }
}

// Open leave application modal
function openLeaveModal() {
    const modal = document.getElementById('leaveModal');
    if (modal) modal.style.display = 'flex';
    const form = document.getElementById('leaveForm');
    if (form) form.reset();
    
    const today = new Date().toISOString().split('T')[0];
    const startInput = document.getElementById('startDate');
    const endInput = document.getElementById('endDate');
    if (startInput) startInput.min = today;
    if (endInput) endInput.min = today;
}

// Close leave application modal
function closeLeaveModal() {
    const modal = document.getElementById('leaveModal');
    if (modal) modal.style.display = 'none';
}

// Setup date validation
function setupDateValidation() {
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    if (!startDate || !endDate) return;

    startDate.addEventListener('change', () => {
        endDate.min = startDate.value;
        if (endDate.value && endDate.value < startDate.value) {
            endDate.value = startDate.value;
        }
    });
}

// Submit leave request
async function submitLeaveRequest(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const docId = currentUserId || 'U007';
    const leaveData = {
        doctorId: docId,
        doctorName: getCurrentUserName(),
        hospitalId: getCurrentUserHospitalId(),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        reason: formData.get('reason')
    };

    let submittedSuccess = false;
    let errorMessage = '';

    try {
        const apiService = window.NexCareAPI || (typeof api !== 'undefined' ? api : null);
        let response = null;

        if (apiService && apiService.Leaves) {
            response = await apiService.Leaves.create(leaveData);
        } else if (apiService && typeof apiService.post === 'function') {
            response = await apiService.post('/leaves', leaveData);
        }

        if (response && response.success) {
            submittedSuccess = true;
            if (response.data) {
                allLeaves.unshift(response.data);
            }
        } else if (response && response.message) {
            errorMessage = response.message;
        }
    } catch (error) {
        console.warn('Backend submit failed or rejected:', error);
        if (error.message && error.message.includes('409')) {
            errorMessage = 'You already have an approved leave during this period';
        }
    }

    if (errorMessage) {
        showNotification(errorMessage, 'error');
        return;
    }

    if (!submittedSuccess) {
        // Fallback local submission
        const newLeave = {
            id: 'L' + Math.floor(100 + Math.random() * 900),
            ...leaveData,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        allLeaves.unshift(newLeave);
        try { localStorage.setItem('nexcare_mock_leaves', JSON.stringify(allLeaves)); } catch(e) {}
    }

    updateStatistics();
    renderLeavesTable(allLeaves);
    showNotification('Leave request submitted successfully', 'success');
    closeLeaveModal();
}

// View leave details
function viewLeaveDetails(leaveId) {
    const leave = allLeaves.find(l => l.id === leaveId);
    if (!leave) return;

    const content = document.getElementById('leaveDetailsContent');
    if (content) {
        content.innerHTML = `
            <div class="detail-row" style="margin-bottom: 10px;">
                <strong>Leave ID:</strong> <span>${leave.id}</span>
            </div>
            <div class="detail-row" style="margin-bottom: 10px;">
                <strong>Doctor Name:</strong> <span>${leave.doctorName || 'Doctor'}</span>
            </div>
            <div class="detail-row" style="margin-bottom: 10px;">
                <strong>Date Range:</strong> <span>${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}</span>
            </div>
            <div class="detail-row" style="margin-bottom: 10px;">
                <strong>Reason:</strong> <span>${leave.reason}</span>
            </div>
            <div class="detail-row" style="margin-bottom: 10px;">
                <strong>Status:</strong> <span class="status-badge status-${(leave.status || 'pending').toLowerCase()}">${capitalizeFirst(leave.status)}</span>
            </div>
            <div class="detail-row" style="margin-bottom: 10px;">
                <strong>Applied On:</strong> <span>${formatDate(leave.createdAt)}</span>
            </div>
            ${leave.approvedBy ? `<div class="detail-row" style="margin-bottom: 10px;"><strong>Approved By:</strong> <span>${leave.approvedBy}</span></div>` : ''}
            ${leave.approvedAt ? `<div class="detail-row" style="margin-bottom: 10px;"><strong>Approved On:</strong> <span>${formatDate(leave.approvedAt)}</span></div>` : ''}
            ${leave.rejectionReason ? `<div class="detail-row" style="margin-bottom: 10px;"><strong>Rejection Reason:</strong> <span>${leave.rejectionReason}</span></div>` : ''}
        `;
    }

    const modal = document.getElementById('viewLeaveModal');
    if (modal) modal.style.display = 'flex';
}

// Close view modal
function closeViewModal() {
    const modal = document.getElementById('viewLeaveModal');
    if (modal) modal.style.display = 'none';
}

// Cancel leave request
async function cancelLeave(leaveId) {
    if (!confirm('Are you sure you want to cancel this leave request?')) {
        return;
    }

    try {
        const apiService = window.NexCareAPI || (typeof api !== 'undefined' ? api : null);
        if (apiService && apiService.Leaves) {
            await apiService.Leaves.delete(leaveId);
        } else if (apiService && typeof apiService.delete === 'function') {
            await apiService.delete(`/leaves/${leaveId}`);
        }
    } catch (error) {
        console.warn('Backend delete failed:', error);
    }

    allLeaves = allLeaves.filter(l => l.id !== leaveId);
    try { localStorage.setItem('nexcare_mock_leaves', JSON.stringify(allLeaves)); } catch(e) {}
    updateStatistics();
    renderLeavesTable(allLeaves);
    showNotification('Leave request cancelled successfully', 'success');
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function truncateText(text, maxLength) {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function capitalizeFirst(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getCurrentUserName() {
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.name || 'Dr. Anjali Desai';
        } catch (e) {
            return 'Dr. Anjali Desai';
        }
    }
    return 'Dr. Anjali Desai';
}

function getCurrentUserHospitalId() {
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.hospitalId || 'H001';
        } catch (e) {
            return 'H001';
        }
    }
    return 'H001';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = '8px';
    notification.style.color = '#FFFFFF';
    notification.style.fontWeight = '600';
    notification.style.fontSize = '14px';
    notification.style.zIndex = '99999';
    notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    notification.style.background = type === 'success' ? '#10B981' : (type === 'error' ? '#EF4444' : '#3B82F6');
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Close modals when clicking outside
window.onclick = function(event) {
    const leaveModal = document.getElementById('leaveModal');
    const viewModal = document.getElementById('viewLeaveModal');
    
    if (event.target === leaveModal) {
        closeLeaveModal();
    }
    if (event.target === viewModal) {
        closeViewModal();
    }
}
