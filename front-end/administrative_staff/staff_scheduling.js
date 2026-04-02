let staffCache = [];

function getStaff() {
    if (!window.NexCareDB) return [];
    const dbUsers = window.NexCareDB.getTable('users');
    staffCache = dbUsers.filter(u => u.role !== 'patient' && u.role !== 'superuser').map(u => ({
        id: u.id,
        name: u.name || 'Unknown',
        role: u.role || 'Staff',
        dept: u.dept || 'General',
        shift: u.shift || 'Morning (08:00 - 16:00)',
        status: u.status || 'Scheduled'
    }));
    return staffCache;
}

function renderStaff(data = getStaff()) {
    const tbody = document.getElementById('staffTableBody');
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

function deleteShift(id) {
    if (confirm('Are you sure you want to delete this staff member?')) {
        if(window.NexCareDB) window.NexCareDB.deleteRow('users', id);
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
    const s = getStaff().find(st => st.id === id);
    if(!s) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Staff Shift';
    document.getElementById('staffId').value = s.id;
    document.getElementById('staffName').value = s.name;
    document.getElementById('staffRole').value = s.role;
    document.getElementById('staffDept').value = s.dept;
    document.getElementById('staffShift').value = s.shift;
    document.getElementById('staffStatus').value = s.status;
    
    document.getElementById('shiftModal').classList.add('active');
}

function saveShift(e) {
    e.preventDefault();
    if(!window.NexCareDB) return;
    
    const id = document.getElementById('staffId').value;
    const name = document.getElementById('staffName').value.trim();
    const role = document.getElementById('staffRole').value.trim();
    const dept = document.getElementById('staffDept').value;
    const shift = document.getElementById('staffShift').value;
    const status = document.getElementById('staffStatus').value;
    
    if(!name || !role || !dept || !shift) {
        alert("Please fill all required fields correctly.");
        return;
    }

    const payload = {
        name,
        role,
        dept,
        shift,
        status,
        email: name.replace(/\s+/g,"").toLowerCase() + "@nexcare.com"
    };

    if (id) {
        window.NexCareDB.updateRow('users', id, payload);
    } else {
        payload.id = window.NexCareDB.generateId("STF");
        payload.password = "Password123";
        window.NexCareDB.addRow('users', payload);
    }
    
    closeShiftModal();
    applyFilters();
}

function applyFilters() {
    const term = document.getElementById('searchTable').value.toLowerCase();
    const stat = document.getElementById('filterStatus').value;
    
    const filtered = getStaff().filter(s => {
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
    
    window.addEventListener('click', function(event) {
        if (event.target == document.getElementById('shiftModal')) {
            closeShiftModal();
        }
    });
});
