// ---------------- API HELPER ----------------
function apiGet(path) {
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    const host = window.location.hostname || 'localhost';
    return fetch(`http://${host}:3001/api${path}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    }).then(r => r.json());
}

function apiRequest(method, path, body) {
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    const host = window.location.hostname || 'localhost';
    return fetch(`http://${host}:3001/api${path}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
    }).then(r => r.json());
}

// ---------------- STATE ----------------
let staffCache = [];

async function loadStaff() {
    try {
        const resp = await apiGet('/users');
        const users = resp.data || [];
        staffCache = users
            .filter(u => u.role !== 'patient' && u.role !== 'superuser')
            .map(u => ({
                id: u.id,
                name: u.name || 'Unknown',
                role: u.role || 'Staff',
                dept: u.dept || 'General',
                shift: u.shift || 'Morning (08:00 - 16:00)',
                status: u.status || 'Scheduled'
            }));
        return staffCache;
    } catch (err) {
        console.error('Failed to load staff:', err);
        return [];
    }
}

function renderStaff(data) {
    const tbody = document.getElementById('staffTableBody');
    if (!tbody) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#6b7280;">No staff members found.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(s => {
        let badgeColor = s.status === 'On Duty' ? 'status-onduty' : s.status === 'On Leave' ? 'status-onleave' : 'status-scheduled';
        return `
        <tr>
            <td><strong>${s.name}</strong></td>
            <td>${s.role}</td>
            <td>${s.dept}</td>
            <td>${s.shift}</td>
            <td><span class="status-badge ${badgeColor}">${s.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn" onclick="editShift('${s.id}')" title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="action-btn" onclick="deleteShift('${s.id}')" title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </td>
        </tr>
    `}).join('');
}

async function deleteShift(id) {
    if (confirm('Are you sure you want to delete this staff member?')) {
        try {
            await apiRequest('DELETE', `/users/${id}`);
        } catch (err) {
            console.error('Delete staff failed:', err);
            alert('Failed to delete staff member.');
            return;
        }
        applyFilters();
    }
}

function openShiftModal() {
    document.getElementById('shiftForm').reset();
    document.getElementById('staffId').value = '';
    document.getElementById('modalTitle').textContent = 'Add Staff Shift';
    document.getElementById('shiftModal').classList.add('active');
}

function closeShiftModal() {
    document.getElementById('shiftModal').classList.remove('active');
}

function editShift(id) {
    const s = staffCache.find(st => st.id === id);
    if (!s) return;

    document.getElementById('modalTitle').textContent = 'Edit Staff Shift';
    document.getElementById('staffId').value = s.id;
    document.getElementById('staffName').value = s.name;
    document.getElementById('staffRole').value = s.role;
    document.getElementById('staffDept').value = s.dept;
    document.getElementById('staffShift').value = s.shift;
    document.getElementById('staffStatus').value = s.status;

    document.getElementById('shiftModal').classList.add('active');
}

async function saveShift(e) {
    e.preventDefault();

    const id = document.getElementById('staffId').value;
    const name = document.getElementById('staffName').value.trim();
    const role = document.getElementById('staffRole').value.trim();
    const dept = document.getElementById('staffDept').value;
    const shift = document.getElementById('staffShift').value;
    const status = document.getElementById('staffStatus').value;

    if (!name || !role || !dept || !shift) {
        alert("Please fill all required fields correctly.");
        return;
    }

    // Generate a more robust email using timestamp to avoid duplicates
    const timestamp = Date.now().toString(36);
    const emailBase = name.replace(/\s+/g, "").toLowerCase().replace(/[^a-z0-9]/g, '');
    const email = `${emailBase}.${timestamp}@nexcare.com`;

    const payload = { name, role, dept, shift, status, email };

    try {
        if (id) {
            await apiRequest('PUT', `/users/${id}`, payload);
        } else {
            // Prompt for password instead of hardcoding
            const password = prompt("Enter password for new staff member:");
            if (!password) {
                alert("Password is required for new staff accounts.");
                return;
            }
            if (password.length < 6) {
                alert("Password must be at least 6 characters long.");
                return;
            }
            payload.password = password;
            await apiRequest('POST', '/users', payload);
        }
    } catch (err) {
        alert('Failed to save staff member. Please try again.');
        console.error(err);
        return;
    }

    closeShiftModal();
    applyFilters();
}

async function applyFilters() {
    const term = document.getElementById('searchTable').value.toLowerCase();
    const stat = document.getElementById('filterStatus').value;

    const all = await loadStaff();
    const filtered = all.filter(s => {
        const matchesTerm = s.name.toLowerCase().includes(term) || s.dept.toLowerCase().includes(term);
        const matchesStat = (stat === 'All' || s.status === stat);
        return matchesTerm && matchesStat;
    });

    renderStaff(filtered);
}

document.addEventListener('DOMContentLoaded', () => {
    applyFilters();

    document.getElementById('searchTable').addEventListener('input', applyFilters);
    document.getElementById('filterStatus').addEventListener('change', applyFilters);

    window.addEventListener('click', function (event) {
        if (event.target == document.getElementById('shiftModal')) {
            closeShiftModal();
        }
    });
});
