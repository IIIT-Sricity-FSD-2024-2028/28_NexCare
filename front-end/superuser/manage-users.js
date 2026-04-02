let usersCache = [];

function getUsers() {
    if (!window.NexCareDB) return [];
    // Superuser sees all users universally
    usersCache = window.NexCareDB.getTable('users');
    return usersCache;
}

const ROLE_DEPARTMENTS = {
    'admin': ['Management', 'IT Support', 'Human Resources', 'Billing'],
    'administrative_staff': ['Management', 'Front Desk', 'Billing'],
    'doctor': ['Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'General Medicine', 'Dermatology', 'Emergency'],
    'nurse': ['ER', 'ICU', 'General Ward', 'Pediatrics'],
    'driver': ['Transport', 'Maintenance'],
    'ambulance': ['Transport']
};

document.addEventListener('DOMContentLoaded', () => {
    // Rely solely on universal NexCareDB
    renderTable();
});

// Read: Render Table Dynamically
function renderTable() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = ''; // Clear existing rows

    const usersList = getUsers();

    if(usersList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 30px; color: var(--text-muted);">No users found. Add one to get started.</td></tr>`;
        return;
    }

    usersList.forEach(user => {
        // Obfuscate the patients from the staff management list, keep it clean
        if(user.role === 'patient') return; 

        const row = document.createElement('tr');
        const roleDisp = user.role.replace('_', ' ').toUpperCase();
        
        row.innerHTML = `
            <td style="font-weight: 500;">${user.name}</td>
            <td style="color: var(--text-muted);">${user.email}</td>
            <td>${user.dept || '-'}</td>
            <td><span class="badge ${user.role}">${roleDisp}</span></td>
            <td>
                <span style="color: ${user.status === 'Active' ? 'var(--success)' : 'var(--danger)'}">
                    • ${user.status}
                </span>
            </td>
            <td>
                <button class="btn-secondary btn-icon" onclick="editUser('${user.id}')">Edit</button>
                <button class="btn-danger btn-icon" onclick="deleteUser('${user.id}')" title="Delete user">
                    <span style="display:inline-flex; align-items:center; gap:6px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M3 6h18"></path>
                            <path d="M8 6V4h8v2"></path>
                            <path d="M6 6l1 16h10l1-16"></path>
                        </svg>
                        Delete
                    </span>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}


function updateDeptDropdown(role, selectedDept = null) {
    const deptSelect = document.getElementById('userDept');
    deptSelect.innerHTML = '<option value="">Select Department...</option>';
    
    if (role && ROLE_DEPARTMENTS[role]) {
        ROLE_DEPARTMENTS[role].forEach(dept => {
            const isSelected = (dept === selectedDept) ? 'selected' : '';
            deptSelect.innerHTML += `<option value="${dept}" ${isSelected}>${dept}</option>`;
        });
    }
}

// Modal Management
const modalOverlay = document.getElementById('userModalOverlay');
const form = document.getElementById('userForm');

function openUserModal() {
    clearValidation();
    form.reset();
    document.getElementById('userId').value = '';
    document.getElementById('modalTitle').textContent = 'Add New User';
    updateDeptDropdown(''); // clear out department dropdown
    modalOverlay.classList.add('active');
}

function closeUserModal() {
    modalOverlay.classList.remove('active');
}

// Modal Click-Outside logic
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeUserModal();
});

// Validation Helper
function clearValidation() {
    document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.form-control').forEach(el => el.style.borderColor = 'var(--border-color)');
}

function showError(fieldId, errorId) {
    document.getElementById(fieldId).style.borderColor = 'var(--danger)';
    document.getElementById(errorId).style.display = 'block';
}

// Create & Update (Save)
function handleSaveUser(e) {
    e.preventDefault();
    clearValidation();

    // Get Form Values
    const idInput = document.getElementById('userId').value;
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const role = document.getElementById('userRole').value;
    const dept = document.getElementById('userDept').value;
    const status = document.getElementById('userStatus').value;

    let isValid = true;

    // Strict Client-Side Validation
    if(name.length < 2) {
        showError('userName', 'errorName');
        isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)) {
        showError('userEmail', 'errorEmail');
        isValid = false;
    }

    if(!role) {
        showError('userRole', 'errorRole');
        isValid = false;
    }

    if(!dept) {
        showError('userDept', 'errorDept');
        isValid = false;
    }

    if(!isValid) return; // Stop processing if invalid

    // Save Data
    if (!window.NexCareDB) return;

    if(idInput === '') {
        // Create new user
        const newId = window.NexCareDB.generateId("U");
        window.NexCareDB.addRow('users', { 
            id: newId, 
            name, 
            email, 
            role, 
            dept, 
            status,
            password: "Password123" // Setup dummy password
        });
        
        if (window.NexCareStore) {
            window.NexCareStore.logActivity('Create', 'Users', `New ${role} account created: ${name} (${dept})`);
        }
    } else {
        // Update existing user
        window.NexCareDB.updateRow('users', idInput, { 
            name, 
            email, 
            role, 
            dept, 
            status 
        });

        if (window.NexCareStore) {
            window.NexCareStore.logActivity('Update', 'Users', `Updated user details for ${name} (ID: ${idInput})`);
        }
    }

    renderTable();
    closeUserModal();
}

// Edit (Populate Form)
function editUser(id) {
    const user = getUsers().find(u => u.id === id);
    if(!user) return;

    clearValidation();
    document.getElementById('modalTitle').textContent = 'Edit User';
    document.getElementById('userId').value = user.id;
    document.getElementById('userName').value = user.name;
    document.getElementById('userEmail').value = user.email;
    document.getElementById('userRole').value = user.role;
    updateDeptDropdown(user.role, user.dept);
    document.getElementById('userStatus').value = user.status;
    
    modalOverlay.classList.add('active');
}

// Delete
function deleteUser(id) {
    if(confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
        if(window.NexCareDB) {
            const user = window.NexCareDB.getTable('users').find(u => u.id === id);
            const userName = user ? user.name : id;
            window.NexCareDB.deleteRow('users', id);
            
            if (window.NexCareStore) {
                window.NexCareStore.logActivity('Delete', 'Users', `Removed user account: ${userName} (ID: ${id})`);
            }
        }
        renderTable(); // Update instantly without reloading
    }
}
