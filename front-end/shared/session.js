/* /front-end/shared/session.js */

// 1. Function to handle Login or Signup
function loginUser(role) {
    // Save the role to sessionStorage (lasts until the tab is closed)
    sessionStorage.setItem('nexcare_current_role', role);
    sessionStorage.setItem('isLoggedIn', 'true');

    console.log("Session started for:", role);

    // Redirect to the correct dashboard based on role
    if (role === 'superuser' || role === 'Hospital Manager') {
        window.location.href = '../superuser/dashboard.html';
    } else if (role === 'patient') {
        window.location.href = '../patient/dashboard.html';
    } else {
        // Default fallback if a specific folder isn't ready
        alert("Login successful as " + role + ". Redirecting to main portal...");
        window.location.href = '../landing/landing.html';
    }
}

// 2. Function to Logout
function logoutUser() {
    sessionStorage.clear(); // Wipe all saved data
    window.location.href = '../auth/login.html'; // Send back to login
}

// 3. Security Guard: Check if user is actually logged in
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (!isLoggedIn && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('signup.html')) {
        // If not logged in and trying to access a dashboard, kick them out
        window.location.href = '../auth/login.html';
    }
}