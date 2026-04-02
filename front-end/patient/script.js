// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltips = document.querySelectorAll('[title]');
    tooltips.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
    
    // Notification handled by window.showNotifications() via onclick
    
    // Handle profile dropdown
    const profileBtn = document.querySelector('.profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', function() {
            window.location.href = 'profile.html';
        });
    }
    
    // Make stat cards clickable
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function() {
            switch(index) {
                case 0: // Upcoming Appointments
                    window.location.href = 'appointments/appointments.html#my-appointments';
                    break;
                case 1: // Medical Records
                    // Scroll to records section
                    document.querySelector('.records-grid').scrollIntoView({ behavior: 'smooth' });
                    break;
                case 2: // Ambulance Requests
                    window.location.href = 'ambulance.html';
                    break;
                case 3: // Pending Bills
                    window.location.href = 'billing.html';
                    break;
            }
        });
    });
    
    // Handle emergency ambulance request
    const emergencyBtn = document.querySelector('.btn-emergency');
    if (emergencyBtn) {
        emergencyBtn.addEventListener('click', handleEmergencyRequest);
    }
    
    // Handle bill payment
    const payButtons = document.querySelectorAll('.btn-primary-sm');
    payButtons.forEach(btn => {
        if (btn.textContent.trim().includes('Pay Now')) {
            btn.addEventListener('click', function() {
                window.location.href = 'billing.html';
            });
        }
    });
    
    // Handle view/download records
    const viewButtons = document.querySelectorAll('.record-actions .btn-primary-sm');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const recordCard = this.closest('.record-card');
            const title = recordCard.querySelector('h3').textContent;
            alert(`Opening ${title}...`);
        });
    });
    
    const downloadButtons = document.querySelectorAll('.record-actions .btn-outline-sm');
    downloadButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const recordCard = this.closest('.record-card');
            const title = recordCard.querySelector('h3').textContent;
            alert(`Downloading ${title}...`);
        });
    });
    
    // Handle appointment action buttons
    const viewAppointmentBtns = document.querySelectorAll('.appointments-table .btn-icon[title="View"]');
    viewAppointmentBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            window.location.href = 'appointments/appointments.html#my-appointments';
        });
    });
});

function handleEmergencyRequest() {
    const location = document.querySelector('.emergency-content input[type="text"]').value;
    const emergencyType = document.querySelector('.emergency-content select').value;
    const contact = document.querySelector('.emergency-content input[type="tel"]').value;
    
    if (!location || !emergencyType || !contact) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (confirm('⚠️ EMERGENCY AMBULANCE REQUEST\n\n' +
                `Location: ${location}\n` +
                `Emergency: ${emergencyType}\n` +
                `Contact: ${contact}\n\n` +
                'Dispatch ambulance immediately?')) {
        alert('✓ Ambulance dispatched!\n\n' +
              'Estimated arrival: 8-12 minutes\n' +
              'Emergency ID: EMR-' + Date.now().toString().slice(-6) + '\n' +
              'Driver will call you shortly.');
        
        // Clear form
        document.querySelector('.emergency-content input[type="text"]').value = '';
        document.querySelector('.emergency-content select').value = '';
        document.querySelector('.emergency-content input[type="tel"]').value = '';
    }
}

function showTooltip(event) {
    const title = event.target.getAttribute('title');
    if (!title) return;
    
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.textContent = title;
    tooltip.style.cssText = `
        position: fixed;
        background: #1E2939;
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        z-index: 1000;
        pointer-events: none;
        white-space: nowrap;
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = event.target.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
    
    event.target.tooltipElement = tooltip;
}

function hideTooltip(event) {
    if (event.target.tooltipElement) {
        event.target.tooltipElement.remove();
        delete event.target.tooltipElement;
    }
}

// Add smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});