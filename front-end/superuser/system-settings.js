/* /front-end/superuser/system-settings.js */

// Mock Default Settings
const DEFAULT_SETTINGS = {
    hospitalName: "NexCare General Hospital",
    supportEmail: "support@nexcare.com",
    emergencyPhone: "911",
    enableRegistration: true,
    maintenanceMode: false
};

// 1. Read: Load data onto the screen from Local Storage when loaded
document.addEventListener('DOMContentLoaded', () => {
    let settings = localStorage.getItem('nexcare_system_settings');
    
    // Fallback to default if no settings exist yet
    if (settings) {
        settings = JSON.parse(settings);
    } else {
        settings = DEFAULT_SETTINGS;
        localStorage.setItem('nexcare_system_settings', JSON.stringify(settings));
    }

    // Populate DOM inputs with the exact data
    document.getElementById('hospitalName').value = settings.hospitalName;
    document.getElementById('supportEmail').value = settings.supportEmail;
    document.getElementById('emergencyPhone').value = settings.emergencyPhone;
    
    // Populate Toggles
    document.getElementById('toggleRegistration').checked = settings.enableRegistration;
    document.getElementById('toggleMaintenance').checked = settings.maintenanceMode;
});

// 2. Update Document Function Without Reloading
document.getElementById('settingsForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Stop page from refreshing dynamically

    // Gather inputs
    const hName = document.getElementById('hospitalName').value.trim();
    const sEmail = document.getElementById('supportEmail').value.trim();
    const ePhone = document.getElementById('emergencyPhone').value.trim();
    
    // Quick strictly JS validation matching Review 3 rules
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(sEmail)) {
        alert("Please enter a strictly valid email for Support Contact.");
        document.getElementById('supportEmail').style.borderColor = 'var(--danger)';
        return;
    }
    
    // Set validation boundary back
    document.getElementById('supportEmail').style.borderColor = 'var(--border-color)';

    // Build the updated object payload
    const updatedSettings = {
        hospitalName: hName,
        supportEmail: sEmail,
        emergencyPhone: ePhone,
        enableRegistration: document.getElementById('toggleRegistration').checked,
        maintenanceMode: document.getElementById('toggleMaintenance').checked
    };

    // Commit to JSON Local Storage 'Database'
    localStorage.setItem('nexcare_system_settings', JSON.stringify(updatedSettings));

    // Show visual confirmation without reload
    const banner = document.getElementById('saveBanner');
    banner.classList.add('show');
    
    // Auto-hide the banner
    setTimeout(() => {
        banner.classList.remove('show');
    }, 3000);
});
