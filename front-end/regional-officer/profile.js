document.addEventListener('DOMContentLoaded', () => {
    const userDataStr = sessionStorage.getItem('nexcare_user_data');
    if (userDataStr) {
        const user = JSON.parse(userDataStr);
        
        // Debug: log the user data to see what's available
        console.log('User data from session:', user);
        
        // Update header
        document.getElementById('userNameDisplay').textContent = user.name || 'Regional Officer';
        document.getElementById('userRoleDisplay').textContent = 'Regional Manager';
        document.getElementById('userAvatar').textContent = (user.name || 'RO').substring(0, 2).toUpperCase();
        
        // Update profile page
        document.getElementById('profileName').textContent = user.name || 'My Profile';
        
        // Build profile fields with better fallback logic
        const regionValue = user.regionName || user.regionId || 
                           (user.areas && Array.isArray(user.areas) && user.areas.length > 0 ? user.areas.join(', ') : 
                           (user.area || 'N/A'));
        
        const fields = [
            { label: 'Name', value: user.name || 'N/A' },
            { label: 'Email', value: user.email || 'N/A' },
            { label: 'Role', value: 'Regional Manager' },
            { label: 'Region', value: regionValue },
            { label: 'Employee ID', value: user.employeeId || user.id || 'N/A' },
            { label: 'Phone', value: user.phone || 'N/A' }
        ];
        
        const fieldsHtml = fields.map(field => `
            <div class="field">
                <label>${field.label}</label>
                <div class="field-value">${field.value}</div>
            </div>
        `).join('');
        
        document.getElementById('profileFields').innerHTML = fieldsHtml;
    }
    
    // Change password functionality
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', async () => {
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            
            if (!currentPassword || !newPassword) {
                alert('Please fill in both password fields');
                return;
            }
            
            if (newPassword.length < 6) {
                alert('New password must be at least 6 characters');
                return;
            }
            
            try {
                const response = await window.NexCareAPI.Auth.changePassword(currentPassword, newPassword);
                if (response.success) {
                    alert('Password updated successfully');
                    document.getElementById('currentPassword').value = '';
                    document.getElementById('newPassword').value = '';
                } else {
                    alert('Failed to update password: ' + (response.message || 'Unknown error'));
                }
            } catch (error) {
                alert('Error updating password: ' + error.message);
            }
        });
    }
});