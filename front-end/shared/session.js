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
            window.location.href = "../ambulance/index.html";
            break;

        default:
            window.location.href = "../landing/landing.html";
    }
}

function logoutUser() {
    sessionStorage.clear();
    window.location.href = "../landing/landing.html";
}

function checkAuth() {

    const isLoggedIn = sessionStorage.getItem("isLoggedIn");
    // Only truly public pages should bypass auth checks
    const publicPages = ["login.html", "signup.html", "landing.html"];
    const path = window.location.pathname;

    const isPublic = publicPages.some(page => path.includes(page));

    if (isLoggedIn !== 'true' && !isPublic) {
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


// Run auth/role checks immediately (prevents flashing protected content)
checkAuth();
checkRoleAccess();

// Inject UI helpers after DOM is ready
document.addEventListener("DOMContentLoaded", function () {
    injectBackButton(); // adds small icon-only back navigation
});

function injectBackButton() {
    // Avoid injecting on explicitly public pages
    const path = window.location.pathname || "";
    const publicPages = ["login.html", "signup.html", "landing.html"];
    if (publicPages.some(page => path.includes(page))) return;

    // Avoid duplicates if session.js is included multiple times
    if (document.getElementById("ncBackButton")) return;

    const styleId = "ncBackButtonStyles";
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
            .nc-back-btn {
                position: fixed;
                top: 18px;
                left: 18px;
                width: 34px;
                height: 34px;
                padding: 0;
                border-radius: 10px;
                border: 1px solid rgba(229,231,235,0.95);
                background: rgba(255,255,255,0.92);
                color: #111827;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 9999;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                backdrop-filter: blur(6px);
            }
            .nc-back-btn:hover {
                background: rgba(239,246,255,0.95);
                border-color: rgba(37,99,235,0.35);
                color: #1D4ED8;
            }
            .nc-back-btn:active { transform: scale(0.98); }
            .nc-back-btn svg { width: 18px; height: 18px; }
            @media (max-width: 520px) {
                .nc-back-btn { top: 12px; left: 12px; }
            }
        `;
        document.head.appendChild(style);
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "ncBackButton";
    btn.className = "nc-back-btn";
    btn.setAttribute("aria-label", "Back");
    btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6"></path>
        </svg>
    `;

    btn.addEventListener("click", () => {
        if (window.history.length > 1) window.history.back();
        else {
            // Fallback: go to role dashboard if there's no history stack
            const role = sessionStorage.getItem("nexcare_current_role");
            if (role) loginUser(role);
            else window.location.href = "../landing/landing.html";
        }
    });

    // Position within the main content region (not on top of the sidebar)
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
        const rect = sidebar.getBoundingClientRect();
        const width = Math.max(0, rect.width || sidebar.offsetWidth || 0);
        btn.style.left = `${Math.round(width + 18)}px`;
    }

    document.body.appendChild(btn);
}