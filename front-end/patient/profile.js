// Profile Page Functionality
// Password management is now centralized via NexCareDB/NexCareStore
// Uses session email to identify the active user and update the users table.

function getStoredPassword() {
    // Standardize to use the core NexCareDB via Store
    return window.NexCareStore?.getPassword() || 'NexCare@2026';
}

function saveStoredPassword(newPw) {
    // Updates the centralized database record for this user
    return window.NexCareStore?.updatePassword(newPw);
}

let profileEditMode = false;
let profileSnapshot = null;

function getProfileFormValues() {
    return {
        fullName: (document.getElementById('fullName')?.value || '').trim(),
        phoneNumber: (document.getElementById('phoneNumber')?.value || '').trim(),
        emailAddress: (document.getElementById('emailAddress')?.value || '').trim(),
        currentPassword: (document.getElementById('currentPassword')?.value || ''),
        newPassword: (document.getElementById('newPassword')?.value || ''),
        confirmPassword: (document.getElementById('confirmPassword')?.value || '')
    };
}

function setProfileInputsDisabled(disabled) {
    const ids = ['fullName', 'phoneNumber', 'emailAddress', 'currentPassword', 'newPassword', 'confirmPassword'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = disabled;
    });
}

function setProfileEditMode(enabled) {
    profileEditMode = enabled;
    setProfileInputsDisabled(!enabled);

    const editBtn = document.getElementById('editProfileBtn');
    const cancelBtn = document.getElementById('cancelProfileBtn');
    const saveBtn = document.getElementById('saveProfileBtn');

    if (editBtn) editBtn.style.display = enabled ? 'none' : 'inline-flex';
    if (cancelBtn) cancelBtn.style.display = enabled ? 'inline-flex' : 'none';
    if (saveBtn) saveBtn.style.display = enabled ? 'inline-flex' : 'none';
}

function saveChanges() {
    const { fullName, phoneNumber, emailAddress, currentPassword, newPassword, confirmPassword } = getProfileFormValues();
    
    // Validate personal info
    if (!fullName || !phoneNumber || !emailAddress) {
        alert('Please fill in all required fields in Personal Information');
        return;
    }
    
    // Validate email format (must include a domain with a dot and at least 2 char TLD)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailAddress)) {
        alert('Please enter a valid email address (e.g. user@example.com)');
        return;
    }

    // Validate phone format (strictly 10 digits only)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
        alert('Phone number must be exactly 10 digits and contain only numbers.');
        return;
    }
    if (/^0+$/.test(phoneNumber) || /^(\d)\1+$/.test(phoneNumber)) {
        alert('Please enter a valid phone number (cannot be all the same digit).');
        return;
    }
    
    // Password change — only if any password field is filled
    let passwordChanged = false;
    if (currentPassword || newPassword || confirmPassword) {
        const storedPw = getStoredPassword();

        if (!currentPassword) {
            alert('Please enter your current password to change it.');
            return;
        }
        if (currentPassword !== storedPw) {
            alert('Current password is incorrect. Please try again.');
            document.getElementById('currentPassword').value = '';
            document.getElementById('currentPassword').focus();
            return;
        }
        if (!newPassword) {
            alert('Please enter a new password.');
            return;
        }
        if (newPassword.length < 8) {
            alert('New password must be at least 8 characters long.');
            return;
        }
        if (newPassword === storedPw) {
            alert('New password cannot be the same as your current password.');
            return;
        }
        if (newPassword !== confirmPassword) {
            alert('New passwords do not match.');
            return;
        }
        passwordChanged = true;
    }
    
    // Show saving state
    const saveButton = document.getElementById('saveProfileBtn');
    const originalText = saveButton ? saveButton.textContent : 'Save';
    if (saveButton) {
        saveButton.textContent = 'Saving...';
        saveButton.disabled = true;
    }
    
    setTimeout(function() {
        // Persist profile to NexCareStore
        if (window.NexCareStore) {
            window.NexCareStore.updateActivePatient({
                fullName,
                phone: phoneNumber,
                email: emailAddress
            });
        }

        // Persist new password to localStorage
        if (passwordChanged) {
            saveStoredPassword(newPassword);
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        }

        if (saveButton) {
            saveButton.textContent = originalText;
            saveButton.disabled = false;
        }
        
        // Build details for success modal
        const detailsHtml = `
            <div style="display:grid; gap:8px; font-size:14px;">
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:#64748B;">Name:</span>
                    <span style="font-weight:600;">${fullName}</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:#64748B;">Email:</span>
                    <span style="font-weight:600;">${emailAddress}</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:#64748B;">Phone:</span>
                    <span style="font-weight:600;">${phoneNumber}</span>
                </div>
                ${passwordChanged ? `<div style="display:flex; justify-content:space-between; padding-top:8px; border-top:1px solid #E2E8F0;">
                    <span style="color:#64748B;">Password:</span>
                    <span style="font-weight:600; color:#16A34A;">Changed successfully</span>
                </div>` : ''}
            </div>
        `;

        if (window.NexCareUI) {
            NexCareUI.showSuccess({
                title: 'Profile Updated!',
                message: 'Your profile has been saved successfully.',
                details: detailsHtml,
                onClose: () => {
                    loadProfileFromStore();
                    profileSnapshot = null;
                    setProfileEditMode(false);
                }
            });
        } else {
            alert('Profile saved successfully!');
            loadProfileFromStore();
            profileSnapshot = null;
            setProfileEditMode(false);
        }
    }, 800);
}

function loadProfileFromStore() {
    const store = window.NexCareStore;
    if (!store) return;
    const p = store.getActivePatient();
    if (!p) return;

    const fullName = document.getElementById('fullName');
    const phoneNumber = document.getElementById('phoneNumber');
    const emailAddress = document.getElementById('emailAddress');
    if (fullName) fullName.value = p.fullName || '';
    if (phoneNumber) phoneNumber.value = p.phone || '';
    if (emailAddress) emailAddress.value = p.email || '';

    // Dynamically update Account Information using specific IDs
    const patientIdEl = document.getElementById('profilePatientId');
    const memberSinceEl = document.getElementById('profileMemberSince');
    const statusEl = document.getElementById('profileAccountStatus');

    if (patientIdEl) patientIdEl.textContent = p.patientIdDisplay || '--';
    if (memberSinceEl) memberSinceEl.textContent = p.memberSince || '--';
    
    if (statusEl) {
        statusEl.textContent = p.status || 'Active';
        // Reset classes and apply status-specific one
        statusEl.className = 'status-badge'; 
        const status = (p.status || 'Active').toLowerCase();
        
        if (status === 'active') {
            statusEl.classList.add('active');
        } else if (status === 'critical' || status === 'emergency') {
            statusEl.classList.add('critical');
        } else if (status === 'pending') {
            statusEl.classList.add('pending');
        } else {
            statusEl.classList.add('inactive');
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadProfileFromStore();
    setProfileEditMode(false);

    const editBtn = document.getElementById('editProfileBtn');
    const cancelBtn = document.getElementById('cancelProfileBtn');
    const saveBtn = document.getElementById('saveProfileBtn');

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            profileSnapshot = getProfileFormValues();
            setProfileEditMode(true);
            const nameEl = document.getElementById('fullName');
            if (nameEl) nameEl.focus();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (profileSnapshot) {
                const { fullName, phoneNumber, emailAddress } = profileSnapshot;
                const fullNameEl = document.getElementById('fullName');
                const phoneEl = document.getElementById('phoneNumber');
                const emailEl = document.getElementById('emailAddress');
                if (fullNameEl) fullNameEl.value = fullName;
                if (phoneEl) phoneEl.value = phoneNumber;
                if (emailEl) emailEl.value = emailAddress;
            } else {
                loadProfileFromStore();
            }

            // Always clear password fields on cancel
            const ids = ['currentPassword', 'newPassword', 'confirmPassword'];
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });

            setProfileEditMode(false);
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (!profileEditMode) return;
            saveChanges();
        });
    }

    // Add event listeners for form fields
    const inputs = document.querySelectorAll('.profile-form input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
});
