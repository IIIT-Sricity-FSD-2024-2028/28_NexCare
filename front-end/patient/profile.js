// Profile Page Functionality

function saveChanges() {
    const personalForm = document.getElementById('personalInfoForm');
    const passwordForm = document.getElementById('passwordForm');
    
    // Get personal info values
    const fullName = document.getElementById('fullName').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const emailAddress = document.getElementById('emailAddress').value;
    
    // Get password values
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
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
    const saveButton = document.querySelector('.btn-save-changes');
    const originalText = saveButton.innerHTML;
    saveButton.innerHTML = '<span>Saving...</span>';
    saveButton.disabled = true;
    
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

        saveButton.innerHTML = originalText;
        saveButton.disabled = false;
        
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
