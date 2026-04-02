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
            </div>
        `;
    }
}

// Register the custom element
if (!customElements.get('nex-care-logo')) {
    customElements.define('nex-care-logo', NexCareLogo);
}

// Global hook for logout button and UI enhancements
document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup global sidebar logout button
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Redirect to login page
            window.location.href = '../auth/login.html';
        });
    });

    // 2. Transform static topbar user into interactive profile dropdown
    const topbarUser = document.querySelector('.topbar .user');
    if (topbarUser) {
        // Morph the container
        topbarUser.className = 'user-profile';
        topbarUser.innerHTML = `
            <div class="avatar">A</div>
            <span class="user-name">Admin User</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            <div class="dropdown-menu">
                <a href="#">My Profile</a>
                <a href="#">Settings</a>
                <div class="divider"></div>
                <a href="../auth/login.html" class="logout-link">Logout</a>
            </div>
        `;

        // Toggle logic
        topbarUser.addEventListener('click', (e) => {
            const dropdown = topbarUser.querySelector('.dropdown-menu');
            dropdown.classList.toggle('active');
            e.stopPropagation(); // Prevent document click from closing immediately
        });

        // Close on outside click
        document.addEventListener('click', () => {
            const dropdown = topbarUser.querySelector('.dropdown-menu');
            if(dropdown) dropdown.classList.remove('active');
        });
    }
});
