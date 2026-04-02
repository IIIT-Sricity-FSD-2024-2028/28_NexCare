/* /front-end/superuser/system-settings.js */

/* /front-end/superuser/system-settings.js */

// 1. Read: Load data onto the screen from NexCareDB
document.addEventListener('DOMContentLoaded', () => {
    if (!window.NexCareDB) return;

    const settings = window.NexCareDB.read().settings || {
        hospitalName: "NexCare General Hospital",
        supportEmail: "support@nexcare.com",
        emergencyPhone: "911",
        enableRegistration: true,
        maintenanceMode: false
    };

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
    e.preventDefault(); 

    // Gather inputs
    const hName = document.getElementById('hospitalName').value.trim();
    const sEmail = document.getElementById('supportEmail').value.trim();
    const ePhone = document.getElementById('emergencyPhone').value.trim();
    
    // Fix Regex literal correctly
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sEmail)) {
        alert("Please enter a valid email for Support Contact.");
        document.getElementById('supportEmail').style.borderColor = '#B91C1C';
        return;
    }
    
    // Reset styling
    document.getElementById('supportEmail').style.borderColor = '#E5E7EB';

    // Build the updated object payload
    const updatedSettings = {
        hospitalName: hName,
        supportEmail: sEmail,
        emergencyPhone: ePhone,
        enableRegistration: document.getElementById('toggleRegistration').checked,
        maintenanceMode: document.getElementById('toggleMaintenance').checked
    };

    // Commit to NexCareDB
    if (window.NexCareDB) {
        const db = window.NexCareDB.read();
        db.settings = updatedSettings;
        window.NexCareDB.write(db);
    }

    // Show visual confirmation
    const banner = document.getElementById('saveBanner');
    banner.classList.add('show');
    
    // Auto-hide the banner
    setTimeout(() => {
        banner.classList.remove('show');
    }, 3000);
});
