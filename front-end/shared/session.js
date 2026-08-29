// ─── Anti-flash: hide page immediately ────────────────────────────────────
// This runs before any HTML is painted. If auth fails → redirect happens
// invisibly. If auth passes → page is revealed with a smooth fade-in.
// Without this, the page briefly flashes protected content before redirecting.
document.documentElement.style.visibility = 'hidden';

// It sets session data and redirects — it does NOT re-authenticate.
function loginUser(role) {
    redirectByRole(role);
}
window.loginUser = loginUser;
window.redirectByRole = redirectByRole;

// Helper function for role-based redirection
function redirectByRole(role) {
    // Use root-relative absolute paths pointing directly to the entry-point file.
    // Avoids npx serve directory listing (no index.html in most portals) and
    // avoids the 301 slash-stripping redirect that breaks relative asset paths.
    switch (role) {
        case "superuser":
            window.location.href = "/superuser/dashboard.html";
            break;

        case "regional_manager":
            window.location.href = "/regional-officer/dashboard.html";
            break;

        case "administrative_staff":
            window.location.href = "/administrative_staff/dashboard.html";
            break;

        case "patient":
            window.location.href = "/patient/dashboard.html";
            break;

        case "ambulance":
            // ambulance uses index.html, trailing slash avoids 301 redirect
            window.location.href = "/ambulance/";
            break;

        case "hospital_manager":
            window.location.href = "/hospital_manager/dashboard.html";
            break;

        default:
            window.location.href = "/landing/landing.html";
    }
}

// Enhanced logoutUser function that supports backend API logout
async function logoutUser() {
    const userEmail = sessionStorage.getItem("nexcare_user_email");
    
    // Try backend logout if API is available and user email exists
    if (window.NexCareAPI && userEmail) {
        try {
            // Extract user ID from stored user data
            const userData = sessionStorage.getItem("nexcare_user_data");
            let userId = null;
            
            if (userData) {
                const user = JSON.parse(userData);
                userId = user.id;
            }
            
            if (userId) {
                await window.NexCareAPI.Auth.logout(userId);
            }
        } catch (error) {
            console.warn('Backend logout error, proceeding with local logout:', error.message);
        }
    }
    
    // Clear all session data & local storage cache keys
    sessionStorage.clear();
    localStorage.removeItem("nexcare_auth_token");
    localStorage.removeItem("nexcare_patients");
    localStorage.removeItem("nexcare_db_v3");
    
    // Redirect to landing page
    window.location.href = "../landing/landing.html";
}
window.logoutUser = logoutUser;

// ─────────────────────────────────────────────────────────────────────────────
// JWT Token Validation (client-side, no external libraries)
// Decodes and validates the JWT payload WITHOUT contacting the backend.
// The signature is not re-verified on client-side (that's the backend's job),
// but we DO check expiry and ensure the payload is structurally sound.
// ─────────────────────────────────────────────────────────────────────────────
function parseJWTPayload(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        // Base64url decode the payload
        const raw = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(raw).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        );
        return JSON.parse(json);
    } catch {
        return null;
    }
}

function getValidSession() {
    const token = sessionStorage.getItem('nexcare_auth_token') ||
                  localStorage.getItem('nexcare_auth_token');
    if (!token) return null;

    const payload = parseJWTPayload(token);
    if (!payload) return null;

    // Check token expiry (exp is Unix seconds)
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) {
        // Token expired — clear session
        sessionStorage.clear();
        localStorage.removeItem('nexcare_auth_token');
        return null;
    }

    return {
        userId: payload.sub,
        email:  payload.email,
        role:   payload.role,
        token:  token,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Page routing helpers
// ─────────────────────────────────────────────────────────────────────────────
function isPublicPage() {
    const path = window.location.pathname.toLowerCase();
    const publicPaths = [
        '/auth/login',
        '/auth/patient-login',
        '/auth/patient-register',
        '/auth/staff-login',
        '/auth/staff-register',
        '/auth/regional-officer-login',
        '/auth/superuser-login',
        '/auth/signup',
        '/landing/landing',
        '/landing/hospital-registration'
    ];
    return publicPaths.some(p => path.includes(p));
}

function checkAuth() {
    const session = getValidSession();

    if (isPublicPage()) {
        // On a public page — always show it regardless of session state.
        // Do NOT auto-redirect logged-in users; they navigated here intentionally
        // (e.g. to log in as a different role, or they just loaded the landing page).
        return;
    }

    // Protected page — require a valid session
    if (!session) {
        sessionStorage.clear();
        window.location.replace('/auth/login.html');
        // Page stays hidden until navigation completes
    }
}

function checkRoleAccess() {
    if (isPublicPage()) return;

    const session = getValidSession();
    if (!session) return; // checkAuth already handles the redirect

    const path = window.location.pathname;
    const role  = session.role;

    // Patients reach their own booking flow under /patient/appointments/
    if (path.includes('/patient/appointments/') && role === 'patient') {
        return;
    }

    const rolePathMap = {
        superuser:             '/superuser/',
        regional_manager:      '/regional-officer/',
        administrative_staff:  '/administrative_staff/',
        patient:               '/patient/',
        ambulance:             '/ambulance/',
        hospital_manager:      '/hospital_manager/',
    };

    // Find which portal this path belongs to
    const currentPortal = Object.entries(rolePathMap).find(([, p]) => path.includes(p));
    if (!currentPortal) return; // Not a role-specific path, allow

    const [requiredRole] = currentPortal;
    if (role !== requiredRole) {
        // Wrong role — kick back to login
        sessionStorage.clear();
        window.location.replace('/auth/login.html');
    }
}


// Run auth/role checks immediately (before paint — prevents flash)
checkAuth();
checkRoleAccess();

// ─── Reveal page after auth passes ─────────────────────────────────────────
// If we reach this line, no redirect was triggered → user is allowed here.
// Fade the page in smoothly instead of a hard visibility toggle.
document.documentElement.style.transition = 'opacity 0.18s ease';
document.documentElement.style.opacity = '0';
document.documentElement.style.visibility = '';
requestAnimationFrame(() => {
    document.documentElement.style.opacity = '1';
});

// Inject UI helpers after DOM is ready
document.addEventListener("DOMContentLoaded", function () {
    injectBackButton(); // adds small icon-only back navigation
});

function injectBackButton() {
    // Avoid injecting on explicitly public pages
    const path = window.location.pathname || "";
    const publicPages = ["login", "signup", "register", "landing"];
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