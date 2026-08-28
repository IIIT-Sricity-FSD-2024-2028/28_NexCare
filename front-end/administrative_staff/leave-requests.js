// Staff Leave Requests — Administrative Staff console.
//
// Administrative staff record leave requests on behalf of hospital staff and track
// their status. Approving or rejecting a request is enforced server-side as
// hospital_manager / superuser only (see back-end LeaveRequestGuard), so this page
// deliberately offers no approve/reject action.

let allLeaves = [];
let staffDirectory = [];

document.addEventListener('DOMContentLoaded', () => {
    loadStaffDirectory();
    loadLeaves();
    setupDateValidation();

    document.getElementById('statusFilter').addEventListener('change', renderFiltered);
    document.getElementById('searchTable').addEventListener('input', renderFiltered);

    const name = getTokenClaim('name');
    if (name) document.getElementById('displayUserName').textContent = name;
});

// ── Data loading ────────────────────────────────────────────────────────────

async function loadLeaves() {
    const hospitalId = getTokenClaim('hospitalId');
    try {
        const res = await window.NexCareAPI.Leaves.getAll(hospitalId ? { hospitalId } : {});
        allLeaves = (res && res.success && Array.isArray(res.data)) ? res.data : [];
    } catch (error) {
        console.warn('Failed to load leaves from backend:', error);
        alert('Failed to load leave requests. Please check your connection and try again.');
        allLeaves = [];
    }
    updateStatistics();
    renderFiltered();
}

// Staff directory powers the "who is this leave for" dropdown. Doctors are
// directory-only records (they cannot log in), which is exactly why leave has to be
// recorded for them by administrative staff.
async function loadStaffDirectory() {
    const select = document.getElementById('staffMember');
    const hospitalId = getTokenClaim('hospitalId');
    try {
        const res = await window.NexCareAPI.Users.getAll();
        const users = (res && res.success && Array.isArray(res.data)) ? res.data : [];
        staffDirectory = users.filter(u =>
            u.role !== 'patient' &&
            u.role !== 'superuser' &&
            u.status === 'Active' &&
            (!hospitalId || !u.hospitalId || u.hospitalId === hospitalId)
        );
    } catch (error) {
        alert('Failed to load staff directory. Please check your connection and try again.');
        console.warn('Failed to load staff directory:', error);
        staffDirectory = [];
    }

    if (staffDirectory.length === 0) {
        select.innerHTML = '<option value="" disabled selected>No staff available</option>';
        return;
    }
    select.innerHTML = '<option value="" disabled selected>Select staff member</option>' +
        staffDirectory.map(u =>
            `<option value="${u.id}">${u.name}${u.dept ? ` — ${u.dept}` : ''}</option>`
        ).join('');
}

// ── Rendering ───────────────────────────────────────────────────────────────

function updateStatistics() {
    const count = s => allLeaves.filter(l => (l.status || '').toLowerCase() === s).length;
    document.getElementById('pendingCount').textContent = count('pending');
    document.getElementById('approvedCount').textContent = count('approved');
    document.getElementById('rejectedCount').textContent = count('rejected');
}

function renderFiltered() {
    const status = document.getElementById('statusFilter').value;
    const term = document.getElementById('searchTable').value.trim().toLowerCase();

    const filtered = allLeaves.filter(leave => {
        const matchesStatus = status === 'all' || (leave.status || '').toLowerCase() === status;
        const haystack = `${leave.doctorName || ''} ${leave.id || ''}`.toLowerCase();
        return matchesStatus && (!term || haystack.includes(term));
    });

    renderLeavesTable(filtered);
}

function renderLeavesTable(leaves) {
    const tbody = document.getElementById('leavesTableBody');
    const empty = document.getElementById('noLeavesMessage');

    if (!leaves.length) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    tbody.innerHTML = leaves.map(leave => {
        const status = (leave.status || 'pending').toLowerCase();
        const cancellable = status === 'pending';
        return `
        <tr>
            <td>${leave.id}</td>
            <td>${leave.doctorName || 'Unknown'}</td>
            <td>${formatDate(leave.startDate)} &ndash; ${formatDate(leave.endDate)}</td>
            <td>${truncateText(leave.reason, 40)}</td>
            <td><span class="badge ${status}">${status}</span></td>
            <td>${formatDate(leave.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn" title="View details" onclick="viewLeaveDetails('${leave.id}')">&#128065;</button>
                    ${cancellable
                        ? `<button class="action-btn" title="Withdraw request" onclick="cancelLeave('${leave.id}')">&#10005;</button>`
                        : ''}
                </div>
            </td>
        </tr>`;
    }).join('');
}

function viewLeaveDetails(leaveId) {
    const leave = allLeaves.find(l => l.id === leaveId);
    if (!leave) return;
    const status = (leave.status || 'pending').toLowerCase();

    document.getElementById('leaveDetailsContent').innerHTML = `
        <div class="detail-row"><strong>Leave ID:</strong> <span>${leave.id}</span></div>
        <div class="detail-row"><strong>Staff Member:</strong> <span>${leave.doctorName || 'Unknown'}</span></div>
        <div class="detail-row"><strong>Start Date:</strong> <span>${formatDate(leave.startDate)}</span></div>
        <div class="detail-row"><strong>End Date:</strong> <span>${formatDate(leave.endDate)}</span></div>
        <div class="detail-row"><strong>Reason:</strong> <span>${leave.reason || 'N/A'}</span></div>
        <div class="detail-row"><strong>Status:</strong> <span class="badge ${status}">${status}</span></div>
        <div class="detail-row"><strong>Applied On:</strong> <span>${formatDate(leave.createdAt)}</span></div>
        ${leave.approvedBy ? `<div class="detail-row"><strong>Actioned By:</strong> <span>${leave.approvedBy}</span></div>` : ''}
        ${leave.approvedAt ? `<div class="detail-row"><strong>Actioned On:</strong> <span>${formatDate(leave.approvedAt)}</span></div>` : ''}
        ${leave.rejectionReason ? `<div class="detail-row"><strong>Rejection Reason:</strong> <span>${leave.rejectionReason}</span></div>` : ''}
    `;
    document.getElementById('viewLeaveModal').classList.add('active');
}

function closeViewModal() {
    document.getElementById('viewLeaveModal').classList.remove('active');
}

// ── Create / withdraw ───────────────────────────────────────────────────────

function openLeaveModal() {
    document.getElementById('leaveForm').reset();
    document.getElementById('leaveModal').classList.add('active');
}

function closeLeaveModal() {
    document.getElementById('leaveModal').classList.remove('active');
}

// End date can never precede start date.
function setupDateValidation() {
    const start = document.getElementById('startDate');
    const end = document.getElementById('endDate');
    const today = new Date().toISOString().split('T')[0];
    start.min = today;
    end.min = today;
    start.addEventListener('change', () => {
        end.min = start.value || today;
        if (end.value && end.value < start.value) end.value = start.value;
    });
}

async function submitLeaveRequest(event) {
    event.preventDefault();

    const staffId = document.getElementById('staffMember').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const reason = document.getElementById('reason').value.trim();

    if (!staffId || !startDate || !endDate || !reason) {
        showNotification('Please fill in every field', 'error');
        return;
    }
    if (endDate < startDate) {
        showNotification('End date cannot be before the start date', 'error');
        return;
    }

    const staff = staffDirectory.find(u => u.id === staffId);

    // The backend leave record still keys on doctorId/doctorName — that is the
    // directory record the leave belongs to, not a logged-in actor.
    const payload = {
        doctorId: staffId,
        doctorName: staff ? staff.name : 'Unknown',
        hospitalId: getTokenClaim('hospitalId') || undefined,
        startDate,
        endDate,
        reason,
    };

    try {
        const res = await window.NexCareAPI.Leaves.create(payload);
        if (res && res.success) {
            if (res.data) allLeaves.unshift(res.data);
            closeLeaveModal();
            updateStatistics();
            renderFiltered();
            showNotification('Leave request recorded successfully', 'success');
            return;
        }
        showNotification((res && res.message) || 'Failed to record leave request', 'error');
    } catch (error) {
        // 409 from LeaveRequestGuard = an approved leave already covers these dates.
        const conflict = String(error && error.message || '').includes('409') ||
                         String(error && error.message || '').toLowerCase().includes('overlap');
        showNotification(
            conflict
                ? 'That staff member already has an approved leave covering these dates'
                : 'Failed to record leave request',
            'error'
        );
    }
}

async function cancelLeave(leaveId) {
    if (!confirm('Withdraw this leave request?')) return;
    try {
        const res = await window.NexCareAPI.Leaves.delete(leaveId);
        if (!res || !res.success) {
            showNotification((res && res.message) || 'Failed to withdraw request', 'error');
            return;
        }
    } catch (error) {
        showNotification('Failed to withdraw request', 'error');
        return;
    }
    allLeaves = allLeaves.filter(l => l.id !== leaveId);
    updateStatistics();
    renderFiltered();
    showNotification('Leave request withdrawn', 'success');
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getTokenClaim(claim) {
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    if (!token) return null;
    try {
        return JSON.parse(atob(token.split('.')[1]))[claim] || null;
    } catch (e) {
        return null;
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function truncateText(text, maxLength) {
    if (!text) return 'N/A';
    return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
}

function showNotification(message, type = 'info') {
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

window.addEventListener('click', (event) => {
    if (event.target === document.getElementById('leaveModal')) closeLeaveModal();
    if (event.target === document.getElementById('viewLeaveModal')) closeViewModal();
});
