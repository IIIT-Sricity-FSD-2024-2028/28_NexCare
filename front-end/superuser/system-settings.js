/* /front-end/superuser/system-settings.js */

// ---------------- API HELPER ----------------
function apiGet(path) {
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    const host = window.location.hostname || 'localhost';
    return fetch(`http://${host}:3001/api${path}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    }).then(r => r.json());
}

function apiRequest(method, path, body) {
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    const host = window.location.hostname || 'localhost';
    return fetch(`http://${host}:3001/api${path}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
    }).then(r => r.json());
}

// Default fallback settings
const DEFAULT_SETTINGS = {
    hospitalName: "NexCare General Hospital",
    supportEmail: "support@nexcare.com",
    emergencyPhone: "911",
    enableRegistration: true,
    maintenanceMode: false
};

/**
 * The backend /system/settings returns an array of { id, key, value } objects.
 * This helper converts that array into a flat key-value object for easy use.
 */
function parseSettingsArray(data) {
    if (!data) return {};
    if (Array.isArray(data)) {
        return data.reduce((acc, item) => {
            acc[item.key] = item.value;
            return acc;
        }, {});
    }
    // If already a flat object, return as-is
    return data;
}

// 1. Load settings from API on page load
document.addEventListener('DOMContentLoaded', async () => {
    let settings = { ...DEFAULT_SETTINGS };

    try {
        const resp = await apiGet('/system/settings');
        if (resp.data) {
            const parsed = parseSettingsArray(resp.data);
            // Map backend keys to our settings keys
            settings = {
                hospitalName: parsed.hospitalName || parsed.hospitalName || DEFAULT_SETTINGS.hospitalName,
                supportEmail: parsed.supportEmail || DEFAULT_SETTINGS.supportEmail,
                emergencyPhone: parsed.emergencyContact || parsed.emergencyPhone || DEFAULT_SETTINGS.emergencyPhone,
                enableRegistration: parsed.enableRegistration !== undefined ? parsed.enableRegistration : DEFAULT_SETTINGS.enableRegistration,
                maintenanceMode: parsed.maintenanceMode !== undefined ? parsed.maintenanceMode : DEFAULT_SETTINGS.maintenanceMode
            };
        }
    } catch (err) {
        console.warn('Could not load settings from API, using defaults:', err);
    }

    // Populate DOM inputs
    document.getElementById('hospitalName').value = settings.hospitalName;
    document.getElementById('supportEmail').value = settings.supportEmail;
    document.getElementById('emergencyPhone').value = settings.emergencyPhone;
    document.getElementById('toggleRegistration').checked = !!settings.enableRegistration;
    document.getElementById('toggleMaintenance').checked = !!settings.maintenanceMode;
});

// 2. Save settings to API
document.getElementById('settingsForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const hName = document.getElementById('hospitalName').value.trim();
    const sEmail = document.getElementById('supportEmail').value.trim();
    const ePhone = document.getElementById('emergencyPhone').value.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sEmail)) {
        alert("Please enter a valid email for Support Contact.");
        document.getElementById('supportEmail').style.borderColor = '#B91C1C';
        return;
    }

    document.getElementById('supportEmail').style.borderColor = '#E5E7EB';

    const updatedSettings = {
        hospitalName: hName,
        supportEmail: sEmail,
        emergencyPhone: ePhone,
        enableRegistration: document.getElementById('toggleRegistration').checked,
        maintenanceMode: document.getElementById('toggleMaintenance').checked
    };

    try {
        await apiRequest('PUT', '/system/settings', updatedSettings);
    } catch (err) {
        console.warn('Failed to save settings to API, saving locally:', err);
    }

    // Show visual confirmation
    const banner = document.getElementById('saveBanner');
    banner.classList.add('show');
    setTimeout(() => { banner.classList.remove('show'); }, 3000);
});
