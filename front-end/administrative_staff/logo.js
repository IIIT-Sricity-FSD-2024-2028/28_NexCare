class NexCareLogo extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="logo-container" style="display: flex; flex-direction: column; align-items: flex-start; padding: 20px;">
                <div class="logo" style="padding: 0;">
                    <div class="logo-icon-container">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                        </svg>
                    </div>
                    <span class="logo-text">
                        <span class="nex">NEX</span><span class="care">CARE</span>
                    </span>
                </div>
                <div class="portal-subtitle" style="margin-top: 10px; font-size: 11px; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding-left: 2px;">Administrative Staff</div>
                <div id="logoHospitalName" style="margin-top: 8px; font-size: 12px; color: #374151; font-weight: 600; padding-left: 2px; line-height: 1.3;"></div>
            </div>
        `;
    }
}

// Register the custom element
if (!customElements.get('nex-care-logo')) {
    customElements.define('nex-care-logo', NexCareLogo);
}

// Helper to decode JWT
function decodeJWT(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const raw = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(atob(raw).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        return JSON.parse(json);
    } catch(e) { return null; }
}

// Global hook for logout button and UI enhancements
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Setup global sidebar logout button
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            sessionStorage.clear();
            localStorage.clear();
            window.location.href = '../auth/login.html';
        });
    });

    // 2. Setup topbar user static profile
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    const payload = token ? decodeJWT(token) : null;

    const topbarUser = document.querySelector('.topbar .user');
    if (topbarUser && payload) {
        topbarUser.className = 'user-profile';
        const name = payload.name || 'Admin User';
        const initial = name.charAt(0).toUpperCase();
        topbarUser.innerHTML = `
            <div class="avatar">${initial}</div>
            <span class="user-name">${name}</span>
        `;
    }

    // 3. Fetch and display hospital name
    if (payload && payload.hospitalId) {
        try {
            const host = window.location.hostname || 'localhost';
            const res = await fetch(`http://${host}:3001/api/hospitals/${payload.hospitalId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data && data.success && data.data && data.data.name) {
                const el = document.getElementById('logoHospitalName');
                if (el) el.textContent = data.data.name;
            }
        } catch (err) {
            console.error('Failed to fetch hospital name:', err);
        }
    }
});
