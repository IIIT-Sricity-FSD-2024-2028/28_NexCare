// Profile Page Functionality
// Uses NexCareStore (async) for patient data, NexCareAPI for password changes.

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

function showPatientNotice(msg, type = 'error') {
    if (window.NexCareUI && typeof window.NexCareUI.showToast === 'function') {
        window.NexCareUI.showToast(msg, type);
        return;
    }
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed; bottom:24px; right:24px; padding:12px 20px; border-radius:8px; background:${type === 'error' ? '#DC2626' : '#16A34A'}; color:#fff; font-size:14px; font-weight:600; box-shadow:0 10px 15px -3px rgba(0,0,0,0.2); z-index:99999;`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

async function saveChanges() {
    const { fullName, phoneNumber, emailAddress, currentPassword, newPassword, confirmPassword } = getProfileFormValues();
    
    // Validate personal info
    if (!fullName || !phoneNumber || !emailAddress) {
        showPatientNotice('Please fill in all required fields in Personal Information', 'error');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailAddress)) {
        showPatientNotice('Please enter a valid email address (e.g. user@example.com)', 'error');
        return;
    }

    // Validate phone format (strictly 10 digits only)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
        showPatientNotice('Phone number must be exactly 10 digits and contain only numbers.', 'error');
        return;
    }
    if (/^0+$/.test(phoneNumber) || /^(\d)\1+$/.test(phoneNumber)) {
        showPatientNotice('Please enter a valid phone number (cannot be all the same digit).', 'error');
        return;
    }
    
    // Password change — only if any password field is filled
    let passwordChanged = false;
    if (currentPassword || newPassword || confirmPassword) {
        if (!currentPassword) {
            showPatientNotice('Please enter your current password to change it.', 'error');
            return;
        }
        if (!newPassword) {
            showPatientNotice('Please enter a new password.', 'error');
            return;
        }
        if (newPassword.length < 8) {
            showPatientNotice('New password must be at least 8 characters long.', 'error');
            return;
        }
        if (newPassword === currentPassword) {
            showPatientNotice('New password cannot be the same as your current password.', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showPatientNotice('New passwords do not match.', 'error');
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

    try {
        // Persist profile to NexCareStore (async)
        if (window.NexCareStore) {
            await window.NexCareStore.updateActivePatient({
                fullName,
                phone: phoneNumber,
                email: emailAddress
            });
        }

        // Change password via backend API
        if (passwordChanged) {
            let pwChanged = false;
            if (isAPIAvailable && isAPIAvailable()) {
                try {
                    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
                    const host = window.location.hostname || 'localhost';
                    const resp = await fetch(`http://${host}:3001/api/auth/change-password`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            email: emailAddress || sessionStorage.getItem('nexcare_user_email'),
                            currentPassword,
                            newPassword
                        })
                    });
                    const result = await resp.json();
                    if (result.success) {
                        pwChanged = true;
                    } else {
                        showPatientNotice(result.message || 'Failed to change password. Please check your current password.', 'error');
                        if (saveButton) { saveButton.textContent = originalText; saveButton.disabled = false; }
                        return;
                    }
                } catch (err) {
                    console.warn('Password change API failed, trying fallback:', err.message);
                }
            }
            
            // Fallback: update password in NexCareDB users table
            if (!pwChanged && window.NexCareDB) {
                const sessionEmail = sessionStorage.getItem('nexcare_user_email');
                if (sessionEmail) {
                    const userRow = await NexCareDB.getActiveUser(sessionEmail);
                    if (userRow) {
                        if (userRow.password !== currentPassword) {
                            showPatientNotice('Current password is incorrect. Please try again.', 'error');
                            document.getElementById('currentPassword').value = '';
                            document.getElementById('currentPassword').focus();
                            if (saveButton) { saveButton.textContent = originalText; saveButton.disabled = false; }
                            return;
                        }
                        NexCareDB.updateRow('users', userRow.id, { password: newPassword });
                        pwChanged = true;
                    }
                }
            }

            if (pwChanged) {
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
            }
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

        if (window.NexCareUI && typeof window.NexCareUI.showSuccess === 'function') {
            NexCareUI.showSuccess({
                title: 'Profile Updated!',
                message: 'Your profile has been saved successfully.',
                details: detailsHtml,
                onClose: async () => {
                    await loadProfileFromStore();
                    profileSnapshot = null;
                    setProfileEditMode(false);
                }
            });
        } else {
            showPatientNotice('Profile saved successfully!', 'success');
            await loadProfileFromStore();
            profileSnapshot = null;
            setProfileEditMode(false);
        }
    } catch (error) {
        console.error('Save profile error:', error);
        showPatientNotice('An error occurred while saving your profile. Please try again.', 'error');
        if (saveButton) {
            saveButton.textContent = originalText;
            saveButton.disabled = false;
        }
    }
}

async function loadProfileFromStore() {
    const store = window.NexCareStore;
    
    // Extract user from JWT to ensure patient scope is initialized
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    let user = null;
    if (token) {
        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                let raw = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                while (raw.length % 4) raw += '=';
                const json = decodeURIComponent(atob(raw).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                user = JSON.parse(json);
            }
        } catch (e) {}
    }
    if (!user) {
        try {
            const blob = sessionStorage.getItem('nexcare_user_data');
            if (blob) user = JSON.parse(blob);
        } catch (e) {}
    }

    if (!user) return; // Cannot load profile if not logged in

    const patientId = user.patientId || user.sub || '';

    // Scope NexCareStore to this patient BEFORE fetching
    if (window.NexCareDB && user.email) {
        window.NexCareDB.setActivePatientScope
            ? window.NexCareDB.setActivePatientScope(patientId || user.email)
            : null;
    }

    let p = null;
    if (store) {
        p = await store.getActivePatient();
    }

    // Fallback to user data if patient profile is missing (e.g. newly registered)
    const profileData = p || {
        fullName: user.name || user.email.split('@')[0],
        email: user.email,
        phone: '',
        patientIdDisplay: patientId,
        memberSince: 'Just now',
        status: 'Active'
    };

    const fullName = document.getElementById('fullName');
    const phoneNumber = document.getElementById('phoneNumber');
    const emailAddress = document.getElementById('emailAddress');
    if (fullName) fullName.value = profileData.fullName || profileData.name || '';
    if (phoneNumber) phoneNumber.value = profileData.phone || '';
    if (emailAddress) emailAddress.value = profileData.email || '';

    // Dynamically update Account Information
    const patientIdEl = document.getElementById('profilePatientId');
    const memberSinceEl = document.getElementById('profileMemberSince');
    const statusEl = document.getElementById('profileAccountStatus');

    if (patientIdEl) patientIdEl.textContent = profileData.patientId || profileData.patientIdDisplay || profileData.id || '--';
    if (memberSinceEl) memberSinceEl.textContent = profileData.memberSince || '--';
    
    if (statusEl) {
        statusEl.textContent = profileData.status || 'Active';
        statusEl.className = 'status-badge'; 
        const status = (profileData.status || 'Active').toLowerCase();
        
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
    
    // Dynamically update Care+ Membership Tier
    const memEl = document.getElementById('profileMembershipTier');
    if (memEl && window.NexCareAPI?.Revenue?.getMyMembership) {
        window.NexCareAPI.Revenue.getMyMembership().then(res => {
            if (res && res.success && res.data) {
                const m = res.data;
                const isPaid = m.monthlyFee > 0 && m.planId !== 'CARE-PAYG';
                memEl.style.color = isPaid ? '#15803D' : '#475569';
                memEl.innerHTML = `
                    ${isPaid ? '⭐ ' : ''}<strong>${m.planName || 'Care+ Member'}</strong>
                    <a href="membership.html" style="font-size:12px; font-weight:600; text-decoration:underline; margin-left:6px; color:#2563EB;">Manage</a>
                `;
            }
        }).catch(() => {});
    }

    // Update the header name if it exists (for immediate reflection)
    const headerName = document.querySelector('.profile-name');
    if (headerName) {
        headerName.textContent = profileData.fullName || profileData.name;
    }
    const headerAvatar = document.querySelector('.profile-avatar');
    if (headerAvatar) {
        const nameStr = profileData.fullName || profileData.name || 'User';
        headerAvatar.textContent = nameStr.split(' ').map(x => x[0]).join('').substring(0,2).toUpperCase();
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    await loadProfileFromStore();
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
