function loginUser(role) {

    sessionStorage.setItem("isLoggedIn", "true");
    sessionStorage.setItem("nexcare_current_role", role);

    switch (role) {
        case "superuser":
            window.location.href = "../superuser/dashboard.html";
            break;

        case "administrative_staff":
            window.location.href = "../administrative_staff/dashboard.html";
            break;

        case "patient":
            window.location.href = "../patient/dashboard.html";
            break;

        case "ambulance":
            window.location.href = "../ambulance/dashboard.html";
            break;

        default:
            window.location.href = "../landing/landing.html";
    }
}

function logoutUser() {
    sessionStorage.clear();
    window.location.href = "../auth/login.html";
}

function checkAuth() {

    const isLoggedIn = sessionStorage.getItem("isLoggedIn");
    const publicPages = ["login.html", "signup.html", "landing.html", "index.html"];
    const path = window.location.pathname;

    const isPublic = publicPages.some(page => path.includes(page));

    if (!isLoggedIn && !isPublic) {
        window.location.href = "../auth/login.html";
    }
}

// Ensures that users can only access dashboards meant for their role
function checkRoleAccess() {

    // Get the role stored during login
    const role = sessionStorage.getItem("nexcare_current_role");

    // Get the current page path (e.g., /administrative_staff/dashboard.html)
    const path = window.location.pathname;

    // If no role is found, stop the function
    if (!role) return;

    // If a user tries to access the administrative_staff section but is not an administrative_staff, redirect to login
    if (path.includes("/administrative_staff/") && role !== "administrative_staff")
        window.location.href = "../auth/login.html";

    // If a user tries to access the superuser section but is not a superuser, redirect
    if (path.includes("/superuser/") && role !== "superuser")
        window.location.href = "../auth/login.html";

    // If a user tries to access the patient section but is not a patient, redirect
    if (path.includes("/patient/") && role !== "patient")
        window.location.href = "../auth/login.html";

    // If a user tries to access the ambulance section but is not ambulance staff, redirect
    if (path.includes("/ambulance/") && role !== "ambulance")
        window.location.href = "../auth/login.html";
}


// Run authentication and role checks once the page finishes loading
document.addEventListener("DOMContentLoaded", function () {
    checkAuth();        // verifies user is logged in
    checkRoleAccess();  // verifies user is accessing the correct role dashboard
});