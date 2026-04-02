// Profile Page Functionality

let profileEditMode = false;
let profileSnapshot = null;

function getProfileFormValues() {
    return {
        fullName: (document.getElementById('fullName')?.value || '').trim(),
        phoneNumber: (document.getElementById('phoneNumber')?.value || '').trim(),
        emailAddress: (document.getElementById('emailAddress')?.value || '').trim(),
        currentPassword: (document.getElementById('currentPassword')?.value || '').trim(),
        newPassword: (document.getElementById('newPassword')?.value || '').trim(),
        confirmPassword: (document.getElementById('confirmPassword')?.value || '').trim()
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
    const personalForm = document.getElementById('personalInfoForm');
    const passwordForm = document.getElementById('passwordForm');
    
    // Get personal info values
    const { fullName, phoneNumber, emailAddress, currentPassword, newPassword, confirmPassword } = getProfileFormValues();
    
    // Get password values
    // (values already read above)
    
    // Validate personal info
    if (!fullName || !phoneNumber || !emailAddress) {
        alert('Please fill in all required fields in Personal Information');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
        alert('Please enter a valid email address');
        return;
    }

    // Validate phone format (allow +, spaces, (), -, but ensure 10-15 digits)
    const phoneDigits = String(phoneNumber || '').replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
        alert('Please enter a valid phone number (10 to 15 digits).');
        return;
    }
    // Reject obvious fake numbers like all zeros / repeated digits
    if (/^0+$/.test(phoneDigits) || /^(\d)\1+$/.test(phoneDigits)) {
        alert('Please enter a valid phone number (cannot be all the same digit).');
        return;
    }
    
    // If password fields are filled, validate them
    if (currentPassword || newPassword || confirmPassword) {
        if (!currentPassword) {
            alert('Please enter your current password');
            return;
        }
        
        if (!newPassword) {
            alert('Please enter a new password');
            return;
        }
        
        if (newPassword.length < 8) {
            alert('New password must be at least 8 characters long');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }
    }
    
    // Show saving message
    const saveButton = document.getElementById('saveProfileBtn');
    const originalText = saveButton ? saveButton.textContent : 'Save';
    if (saveButton) {
        saveButton.textContent = 'Saving...';
        saveButton.disabled = true;
    }
    
    // Simulate save
    setTimeout(function() {
        // Persist to shared store (Update)
        if (window.NexCareStore) {
            window.NexCareStore.updateActivePatient({
                fullName,
                phone: phoneNumber,
                email: emailAddress
            });
        }

        if (saveButton) {
            saveButton.textContent = originalText;
            saveButton.disabled = false;
        }
        
        let message = '✓ Profile Updated Successfully!\n\n';
        message += `Name: ${fullName}\n`;
        message += `Email: ${emailAddress}\n`;
        message += `Phone: ${phoneNumber}`;
        
        if (newPassword) {
            message += '\n\n✓ Password changed successfully';
            // Clear password fields
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        }
        
        alert(message);

        // Refresh displayed values and exit edit mode
        loadProfileFromStore();
        profileSnapshot = null;
        setProfileEditMode(false);
    }, 1000);
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

    const detailValues = document.querySelectorAll('.account-details-grid .detail-value');
    if (detailValues.length >= 3) {
        detailValues[0].textContent = p.patientIdDisplay || detailValues[0].textContent;
        detailValues[1].textContent = p.memberSince || detailValues[1].textContent;
        detailValues[2].textContent = p.status || detailValues[2].textContent;
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
