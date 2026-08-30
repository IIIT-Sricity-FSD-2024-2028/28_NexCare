document.addEventListener('DOMContentLoaded', () => {
    const role = sessionStorage.getItem('nexcare_current_role') || 'guest';
    const body = document.body;

    // Dynamically load logo.js if the custom element isn't defined yet
    if (!customElements.get('nex-care-logo')) {
        const scriptBase = (document.currentScript || [...document.scripts].slice(-1)[0]).src;
        const base = scriptBase.substring(0, scriptBase.lastIndexOf('/shared/'));
        const logoScript = document.createElement('script');
        logoScript.src = base + '/logo.js';
        document.head.appendChild(logoScript);
    }

    // Create the Sidebar Element
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';

    // Define links based on Role
    let navLinks = '';

    let displayRoleName = 'User';
    if (role === 'superuser') displayRoleName = 'Superuser';
    else if (role === 'regional_manager') displayRoleName = 'Regional Officer';
    else if (role === 'hospital_manager') displayRoleName = 'Hospital Manager';
    else if (role === 'administrative_staff') displayRoleName = 'Administrative Staff';
    else if (role === 'patient') displayRoleName = 'Patient';
    else if (role === 'ambulance') displayRoleName = 'Ambulance Staff';
    else if (role === 'hospital_manager') displayRoleName = 'Hospital Manager';
    else if (role === 'doctor') displayRoleName = 'Doctor';

    if (role === 'superuser') {
        navLinks = `
            <a href="../superuser/dashboard.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                System Dashboard
            </a>
            <a href="../superuser/hierarchy.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="16" y="16" width="6" height="6" rx="1"/><path d="M12 8v4"/><path d="M5 16v-2h14v2"/></svg>
                Organisation Hierarchy
            </a>
            <a href="../superuser/hospital-registrations.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Hospital Registrations
            </a>
            <a href="../superuser/patient-directory.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Patient Directory
            </a>
            <a href="../superuser/manage-users.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Manage Users
            </a>
            <a href="../superuser/system-settings.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                System Settings
            </a>
            <a href="../superuser/feedback.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>
                Feedback Review
            </a>
            <a href="../superuser/revenue.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                Revenue Model
            </a>
            <a href="../superuser/reports.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
                Reports & Analytics
            </a>
        `;
    } else if (role === 'hospital_manager') {
        navLinks = `
            <a href="../hospital_manager/dashboard.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Hospital Dashboard
            </a>
            <a href="../hospital_manager/dashboard.html#leaves" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M9 16h6"/></svg>
                Doctor Leaves
            </a>
            <a href="../hospital_manager/dashboard.html#staff" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Staff Directory
            </a>
            <a href="../hospital_manager/dashboard.html#inventory-approvals" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-4-9 4 9 4 9-4z"/><path d="M3 8v8l9 4 9-4V8"/><path d="M12 12v8"/></svg>
                Inventory Approvals
            </a>
            <a href="../hospital_manager/dashboard.html#subscription" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Subscription & Renewal
            </a>
            <a href="../hospital_manager/dashboard.html#supervision" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
                Admin Supervision
            </a>
        `;
    } else if (role === 'regional_manager') {
        navLinks = `
            <a href="../regional-officer/dashboard.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Regional Dashboard
            </a>
            <a href="../regional-officer/hierarchy.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="16" y="16" width="6" height="6" rx="1"/><path d="M12 8v4"/><path d="M5 16v-2h14v2"/></svg>
                My Region
            </a>
            <a href="../regional-officer/hospital-approvals.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 12 11 14 15 10"/></svg>
                Hospital Approvals
            </a>
            <a href="../regional-officer/revenue.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                Revenue
            </a>
            <a href="../regional-officer/performance-alerts.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Performance Alerts
            </a>
            <a href="../regional-officer/hospital-comparison.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
                Hospital Comparison
            </a>
            <a href="../regional-officer/complaints.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>
                Patient Complaints
            </a>
            <a href="../regional-officer/profile.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                My Profile
            </a>
        `;
    } else if (role === 'administrative_staff') {
        navLinks = `
            <a href="../administrative_staff/dashboard.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Administrative Operations
            </a>
            <a href="../administrative_staff/bed-allocation.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"/><path d="M2 13v6"/><path d="M22 13v6"/><path d="M2 19h20"/><path d="M2 13h20"/></svg>
                Bed Allocation
            </a>
            <a href="../administrative_staff/leave-requests.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M9 16h6"/></svg>
                Leave Requests
            </a>
            <a href="../administrative_staff/manage_appointments.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Manage Appointments
            </a>
            <a href="../administrative_staff/inventory.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-4-9 4 9 4 9-4z"/><path d="M3 8v8l9 4 9-4V8"/><path d="M12 12v8"/></svg>
                Inventory & Requisitions
            </a>
        `;
    } else if (role === 'doctor') {
        navLinks = `
            <a href="../doctor/dashboard.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                My Practice
            </a>
            <a href="../doctor/appointments.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                My Appointments
            </a>
            <a href="../doctor/leaves.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M9 16h6"/></svg>
                Leave Calendar
            </a>
            <a href="../doctor/earnings.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                Earnings & Plan
            </a>
            <a href="../doctor/profile.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                My Profile
            </a>
        `;
    } else if (role === 'patient') {
        navLinks = `
            <a href="../patient/dashboard.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                My Profile
            </a>
            <a href="../patient/appointments/appointments.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Appointments
            </a>
            <a href="../patient/ambulance.html" class="nav-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10H6"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>
                Request Ambulance
            </a>
        `;
    }

    // Inject sidebar HTML — uses nex-care-logo web component for branding
    sidebar.innerHTML = `
        <div class="sidebar-brand">
            <nex-care-logo></nex-care-logo>
            <span class="sidebar-role-tag">${displayRoleName}</span>
            <div id="sidebarHospitalName" style="margin-top: 8px; font-size: 13px; color: #374151; font-weight: 600; padding-left: 8px; line-height: 1.3;"></div>
        </div>
        <nav class="nav-menu">
            ${navLinks}
        </nav>
        <button class="logout-btn" onclick="logoutUser()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>Logout</span>
        </button>
    `;

    // Prepend sidebar to the body
    body.prepend(sidebar);

    // Highlight the active nav item based on current page filename
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-item').forEach(link => {
        if (link.getAttribute('href') && link.getAttribute('href').includes(currentPage)) {
            link.classList.add('active');
        }
    });

    // --- Task 4: Staff Profile Hospital ID Badge ---
    // Extract user details from JWT (copied from dashboard logic)
    function decodeJWT(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            const raw = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const json = decodeURIComponent(atob(raw).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            return JSON.parse(json);
        } catch (e) { return null; }
    }

    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    if (token) {
        const payload = decodeJWT(token);
        if (payload && payload.hospitalId) {
            // Find the topbar user element
            const userEl = document.querySelector('.topbar .user');
            if (userEl) {
                // Update text to real name if available
                if (payload.name) {
                    userEl.childNodes[0].textContent = payload.name + ' ';
                }
                
                // Add the badge
                const badge = document.createElement('span');
                badge.style.display = 'inline-block';
                badge.style.marginLeft = '8px';
                badge.style.padding = '4px 8px';
                badge.style.background = '#E0E7FF';
                badge.style.color = '#4338CA';
                badge.style.borderRadius = '6px';
                badge.style.fontSize = '12px';
                badge.style.fontWeight = '600';
                badge.style.border = '1px solid #C7D2FE';
                badge.textContent = 'Hospital: ' + payload.hospitalId;
                
                userEl.appendChild(badge);

                // Fetch real name
                if (window.NexCareAPI && window.NexCareAPI.Hospitals) {
                    window.NexCareAPI.Hospitals.getById(payload.hospitalId)
                        .then(res => {
                            if (res && res.data && res.data.name) {
                                badge.textContent = res.data.name;
                                
                                const sidebarHospital = document.getElementById('sidebarHospitalName');
                                if (sidebarHospital) sidebarHospital.textContent = res.data.name;
                            }
                        })
                        .catch(err => console.error("Could not fetch hospital name for badge:", err));
                }
            }
        }
        
        // --- Task 5: Notifications Dropdown ---
        const topbar = document.querySelector('.topbar');
        if (topbar && !document.querySelector('.notification-bell')) {
            const bellWrap = document.createElement('div');
            bellWrap.className = 'notification-bell';
            bellWrap.style.position = 'relative';
            bellWrap.style.cursor = 'pointer';
            bellWrap.style.marginLeft = 'auto';
            bellWrap.style.marginRight = '20px';
            
            bellWrap.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4B5563" stroke-width="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <div class="notif-dot" style="position:absolute; top:-2px; right:-2px; width:8px; height:8px; background:red; border-radius:50%; display:none;"></div>
                <div class="notif-dropdown" style="position:absolute; top:30px; right:0; width:300px; background:#fff; border:1px solid #e5e7eb; border-radius:8px; box-shadow:0 4px 6px rgba(0,0,0,0.1); display:none; z-index:100; max-height:400px; overflow-y:auto;">
                    <div style="padding:12px; border-bottom:1px solid #e5e7eb; font-weight:600; font-size:14px;">Recent Activity</div>
                    <div class="notif-list" style="padding:8px;"></div>
                </div>
            `;
            
            topbar.insertBefore(bellWrap, topbar.firstChild);
            
            let isOpen = false;
            bellWrap.addEventListener('click', async (e) => {
                const dropdown = bellWrap.querySelector('.notif-dropdown');
                const dot = bellWrap.querySelector('.notif-dot');
                isOpen = !isOpen;
                dropdown.style.display = isOpen ? 'block' : 'none';
                dot.style.display = 'none'; // mark as read
                
                if (isOpen) {
                    const list = dropdown.querySelector('.notif-list');
                    list.innerHTML = '<div style="font-size:12px; color:#6b7280; text-align:center; padding:10px;">Loading...</div>';
                    
                    try {
                        let res;
                        if (window.NexCareAPI && window.NexCareAPI.get) {
                            res = await window.NexCareAPI.get('/system-activity');
                        } else {
                            const response = await fetch(`http://${window.location.hostname || 'localhost'}:3001/api/system-activity`);
                            res = await response.json();
                        }
                        
                        if (res && res.data) {
                            let logs = res.data;
                            if (payload.hospitalId) {
                                // Filter logs for this specific hospital
                                logs = logs.filter(l => !l.hospitalId || l.hospitalId === payload.hospitalId);
                            }
                            
                            if (logs.length === 0) {
                                list.innerHTML = '<div style="font-size:12px; color:#6b7280; text-align:center; padding:10px;">No recent notifications</div>';
                            } else {
                                list.innerHTML = logs.slice(0, 10).map(l => `
                                    <div style="padding:8px; border-bottom:1px solid #f3f4f6; font-size:12px;">
                                        <div style="font-weight:600; color:#111827;">${l.action}</div>
                                        <div style="color:#4b5563;">${l.details}</div>
                                        <div style="color:#9ca3af; font-size:10px; margin-top:4px;">${new Date(l.timestamp).toLocaleString()}</div>
                                    </div>
                                `).join('');
                            }
                        }
                    } catch (err) {
                        list.innerHTML = '<div style="font-size:12px; color:#dc2626; text-align:center; padding:10px;">Failed to load notifications</div>';
                    }
                }
            });
            
            // Randomly simulate an unread notification on page load just to show it works
            if (Math.random() > 0.3) {
                bellWrap.querySelector('.notif-dot').style.display = 'block';
            }
        }
    }
});
