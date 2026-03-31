document.addEventListener('DOMContentLoaded', () => {
    const role = sessionStorage.getItem('nexcare_current_role') || 'guest';
    const body = document.body;

    // Create the Sidebar Element
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';

    // Define links based on Role
    let navLinks = '';
    
    if (role === 'superuser') {
        navLinks = `
            <a href="../superuser/dashboard.html" class="nav-item">System Dashboard</a>
            <a href="../superuser/manage-users.html" class="nav-item">Manage Users</a>
            <a href="../superuser/system-settings.html" class="nav-item">System Settings</a>
        `;
    } else if (role === 'administrative_staff') {
        navLinks = `
            <a href="../administrative_staff/dashboard.html" class="nav-item">Operations Dashboard</a>
            <a href="../administrative_staff/bed-allocation.html" class="nav-item">Bed Allocation</a>
            <a href="../administrative_staff/reports.html" class="nav-item">Reports</a>
        `;
    } else if (role === 'patient') {
        navLinks = `
            <a href="../patient/dashboard.html" class="nav-item">My Profile</a>
            <a href="../patient/appointments.html" class="nav-item">Appointments</a>
            <a href="../patient/ambulance.html" class="nav-item">Request Ambulance</a>
        `;
    }

    // Inject the HTML structure
    sidebar.innerHTML = `
        <div class="sidebar-brand">NEX CARE</div>
        <nav class="nav-menu">
            ${navLinks}
        </nav>
        <button class="logout-btn" onclick="logoutUser()">Logout</button>
    `;

    // Add sidebar to the beginning of the body
    body.prepend(sidebar);
});