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
            const title = recordCard.querySelector('h3')?.textContent || 'Medical Record';
            const date = recordCard.querySelector('p')?.textContent || 'Recent';
            const details = `
                <div style="font-size:13.5px; color:#334155; line-height:1.6;">
                    <div style="margin-bottom:8px;"><strong>Record:</strong> ${title}</div>
                    <div style="margin-bottom:8px;"><strong>Date:</strong> ${date}</div>
                    <div style="margin-bottom:8px;"><strong>Hospital:</strong> NexCare Multi-Speciality Network</div>
                    <div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:12px; border-radius:8px; margin-top:12px;">
                        <strong>Diagnostic Summary:</strong><br>
                        Patient vitals and clinical parameters recorded within normal thresholds. All attached laboratory reports verified by attending consultant.
                    </div>
                </div>
            `;
            if (typeof window.showSystemModal === 'function') {
                window.showSystemModal(title, details);
            } else if (window.NexCareUI && typeof window.NexCareUI.showToast === 'function') {
                window.NexCareUI.showToast(`Displaying ${title}`, 'info');
            }
        });
    });
    
    const downloadButtons = document.querySelectorAll('.record-actions .btn-outline-sm');
    downloadButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const recordCard = this.closest('.record-card');
            const title = recordCard.querySelector('h3')?.textContent || 'Medical Record';
            const fileName = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_summary.txt`;
            const content = `NEXCARE HEALTHCARE NETWORK - OFFICIAL MEDICAL RECORD\n\nRecord: ${title}\nGenerated on: ${new Date().toLocaleDateString('en-IN')}\nStatus: Verified Clinical Entry\n\nThis is a digitally verified medical summary export from the NexCare Patient Portal.`;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            if (window.NexCareUI && typeof window.NexCareUI.showToast === 'function') {
                window.NexCareUI.showToast(`Downloaded ${fileName}`, 'success');
            }
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