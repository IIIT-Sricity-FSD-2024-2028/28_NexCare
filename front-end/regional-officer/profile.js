document.addEventListener('DOMContentLoaded', async () => {
    let user = null;
    try {
        const userDataStr = sessionStorage.getItem('nexcare_user_data') || localStorage.getItem('nexcare_user_data');
        if (userDataStr) user = JSON.parse(userDataStr);
    } catch (e) {}

    if (!user) {
        user = window.NexCareAPI?.Auth?.getUser() || {};
    }

    // Update Header
    const nameStr = user.name || 'Regional Officer';
    document.getElementById('userNameDisplay').textContent = nameStr;
    document.getElementById('userRoleDisplay').textContent = 'Regional Officer';
    document.getElementById('userAvatar').textContent = nameStr.substring(0, 2).toUpperCase();
    document.getElementById('profileName').textContent = nameStr;
    const subEl = document.getElementById('profileSub');
    if (subEl) subEl.textContent = `${user.regionName || user.regionId || 'Regional'} Management Profile`;

    // Fetch assigned hospitals count from API overview
    let hospitalCount = 0;
    try {
        const overviewRes = await window.NexCareAPI.Hospitals.getRegionalOverview();
        if (overviewRes && overviewRes.success) {
            hospitalCount = overviewRes.data?.summary?.assignedHospitals || overviewRes.data?.hospitals?.length || 0;
        }
    } catch (e) {
        console.warn('Could not fetch regional overview count:', e);
    }

    const regionName = user.regionName || (user.regionId === 'REG-AP-SOUTH' ? 'Andhra Pradesh South' : user.regionId === 'REG-KA-SOUTH' ? 'Karnataka South' : user.regionId === 'REG-MH-CENTRAL' ? 'Maharashtra Central' : user.regionId === 'REG-TN-NORTH' ? 'Tamil Nadu North' : user.regionId || 'N/A');
    const regionId = user.regionId || 'REG-001';
    const areas = Array.isArray(user.areas) ? user.areas.join(', ') : (user.areas || 'N/A');
    const phone = user.phone || '+91 98480 00111';
    const empId = user.employeeId || user.id || 'EMP-RO-001';
    const status = user.status || 'Active';
    const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '01 Jan 2026';

    const fields = [
        { label: 'Full Name', value: nameStr },
        { label: 'Employee ID', value: empId },
        { label: 'Email Address', value: user.email || 'N/A' },
        { label: 'Phone Number', value: phone },
        { label: 'Role', value: 'Regional Officer' },
        { label: 'Region Name', value: regionName },
        { label: 'Region ID', value: regionId },
        { label: 'State / Area', value: areas },
        { label: 'Number of Hospitals Managed', value: `${hospitalCount} Hospitals` },
        { label: 'Account Status', value: status },
        { label: 'Date Joined', value: joined }
    ];

    const fieldsHtml = fields.map(field => `
        <div class="field" style="background:#F9FAFB;padding:12px 16px;border-radius:8px;border:1px solid #E5E7EB;">
            <label style="font-size:12px;color:#6B7280;font-weight:600;display:block;margin-bottom:4px;">${field.label}</label>
            <div class="field-value" style="font-size:14px;font-weight:600;color:#111827;">${field.value}</div>
        </div>
    `).join('');

    const container = document.getElementById('profileFields');
    if (container) {
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
        container.style.gap = '16px';
        container.innerHTML = fieldsHtml;
    }

    // Change Password Handler
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
                if (response && response.success) {
                    alert('Password updated successfully');
                    document.getElementById('currentPassword').value = '';
                    document.getElementById('newPassword').value = '';
                } else {
                    alert('Failed to update password: ' + (response?.message || 'Unknown error'));
                }
            } catch (error) {
                alert('Error updating password: ' + error.message);
            }
        });
    }
});