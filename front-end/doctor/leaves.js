// Doctor Leave Management JavaScript
// Handles leave requests, viewing, and filtering

const api = new NexCareAPI();
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
            currentUserId = payload.sub;
        } catch (e) {
            console.error('Error parsing token:', e);
        }
    }
}

// Load all leaves for the current doctor
async function loadLeaves() {
    try {
        const response = await api.get(`/leaves?doctorId=${currentUserId}`);
        
        if (response.success && response.data) {
            allLeaves = response.data;
            updateStatistics();
            renderLeavesTable(allLeaves);
        } else {
            console.error('Failed to load leaves:', response.message);
            showNotification('Failed to load leave requests', 'error');
        }
    } catch (error) {
        console.error('Error loading leaves:', error);
        showNotification('Error loading leave requests', 'error');
    }
}

// Update statistics cards
function updateStatistics() {
    const pending = allLeaves.filter(l => l.status === 'pending').length;
    const approved = allLeaves.filter(l => l.status === 'approved').length;
    const rejected = allLeaves.filter(l => l.status === 'rejected').length;

    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('approvedCount').textContent = approved;
    document.getElementById('rejectedCount').textContent = rejected;
}

// Render leaves table
function renderLeavesTable(leaves) {
    const tbody = document.getElementById('leavesTableBody');
    const noDataMessage = document.getElementById('noLeavesMessage');

    if (!leaves || leaves.length === 0) {
        tbody.innerHTML = '';
        noDataMessage.style.display = 'flex';
        return;
    }

    noDataMessage.style.display = 'none';
    tbody.innerHTML = leaves.map(leave => `
        <tr>
            <td><span class="badge">${leave.id}</span></td>
            <td>
                <div class="date-range">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                        <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M3 8h14" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    <span>${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}</span>
                </div>
            </td>
            <td>${truncateText(leave.reason, 30)}</td>
            <td>
                <span class="status-badge status-${leave.status}">
                    ${capitalizeFirst(leave.status)}
                </span>
            </td>
            <td>${formatDate(leave.createdAt)}</td>
            <td>
                <button class="btn-icon" onclick="viewLeaveDetails('${leave.id}')" title="View Details">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M2 10c1.5-4 4.5-6.5 8-6.5s6.5 2.5 8 6.5c-1.5 4-4.5 6.5-8 6.5S3.5 14 2 10z" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                </button>
                ${leave.status === 'pending' ? `
                    <button class="btn-icon btn-icon-danger" onclick="cancelLeave('${leave.id}')" title="Cancel Request">
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                            <path d="M4 4l12 12M4 16L16 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

// Filter leaves by status
function filterLeaves() {
    const status = document.getElementById('statusFilter').value;
    
    if (status === 'all') {
        renderLeavesTable(allLeaves);
    } else {
        const filtered = allLeaves.filter(leave => leave.status === status);
        renderLeavesTable(filtered);
    }
}

// Open leave application modal
function openLeaveModal() {
    document.getElementById('leaveModal').style.display = 'flex';
    document.getElementById('leaveForm').reset();
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').min = today;
    document.getElementById('endDate').min = today;
}

// Close leave application modal
function closeLeaveModal() {
    document.getElementById('leaveModal').style.display = 'none';
}

// Setup date validation
function setupDateValidation() {
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');

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
    const leaveData = {
        doctorId: currentUserId,
        doctorName: getCurrentUserName(),
        hospitalId: getCurrentUserHospitalId(),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        reason: formData.get('reason')
    };

    try {
        const response = await api.post('/leaves', leaveData);
        
        if (response.success) {
            showNotification('Leave request submitted successfully', 'success');
            closeLeaveModal();
            loadLeaves();
        } else {
            showNotification(response.message || 'Failed to submit leave request', 'error');
        }
    } catch (error) {
        console.error('Error submitting leave request:', error);
        if (error.message && error.message.includes('409')) {\
            showNotification('You already have an approved leave during this period', 'error');
        } else {
            showNotification('Error submitting leave request', 'error');
        }
    }
}

// View leave details
function viewLeaveDetails(leaveId) {
    const leave = allLeaves.find(l => l.id === leaveId);
    if (!leave) return;

    const content = document.getElementById('leaveDetailsContent');
    content.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Leave ID:</span>
            <span class="detail-value">${leave.id}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Date Range:</span>
            <span class="detail-value">${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Reason:</span>
            <span class="detail-value">${leave.reason}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value">
                <span class="status-badge status-${leave.status}">
                    ${capitalizeFirst(leave.status)}
                </span>
            </span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Applied On:</span>
            <span class="detail-value">${formatDate(leave.createdAt)}</span>
        </div>
        ${leave.approvedBy ? `
            <div class="detail-row">
                <span class="detail-label">Approved By:</span>
                <span class="detail-value">${leave.approvedBy}</span>
            </div>
        ` : ''}
        ${leave.approvedAt ? `
            <div class="detail-row">
                <span class="detail-label">Approved On:</span>
                <span class="detail-value">${formatDate(leave.approvedAt)}</span>
            </div>
        ` : ''}
        ${leave.rejectionReason ? `
            <div class="detail-row">
                <span class="detail-label">Rejection Reason:</span>
                <span class="detail-value">${leave.rejectionReason}</span>
            </div>
        ` : ''}
    `;

    document.getElementById('viewLeaveModal').style.display = 'flex';
}

// Close view modal
function closeViewModal() {
    document.getElementById('viewLeaveModal').style.display = 'none';
}

// Cancel leave request
async function cancelLeave(leaveId) {
    if (!confirm('Are you sure you want to cancel this leave request?')) {
        return;
    }

    try {
        const response = await api.delete(`/leaves/${leaveId}`);
        
        if (response.success) {
            showNotification('Leave request cancelled successfully', 'success');
            loadLeaves();
        } else {
            showNotification(response.message || 'Failed to cancel leave request', 'error');
        }
    } catch (error) {
        console.error('Error cancelling leave request:', error);
        showNotification('Error cancelling leave request', 'error');
    }
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
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
            return payload.name || 'Doctor';
        } catch (e) {
            return 'Doctor';
        }
    }
    return 'Doctor';
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
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
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
