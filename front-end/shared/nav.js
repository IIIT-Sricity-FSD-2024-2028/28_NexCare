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
            <a href="dashboard.html" class="nav-item">Dashboard</a>
            <a href="staff-management.html" class="nav-item">Manage Staff</a>
            <a href="inventory.html" class="nav-item">Inventory</a>
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