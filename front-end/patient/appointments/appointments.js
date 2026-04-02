// Appointments page functionality

// Store booking data
let bookingData = {
    department: null,
    doctor: null,
    date: null,
    time: null,
    patientInfo: {}
};

let currentStep = 1;

function getStore() {
    return window.NexCareStore;
}

function getDoctorsForDepartment(deptName) {
    let users = [];
    if (window.NexCareDB) {
        users = window.NexCareDB.getTable('users');
    }
    
    return users.filter(u => 
        u.role && 
        u.role.toLowerCase() === 'doctor' && 
        u.dept === deptName && 
        u.status === 'Active'
    );
}

function renderAppointmentsFromStore() {
    const store = getStore();
    if (!store) return;

    const all = store.listAppointments();
    const upcoming = all.filter(a => a.status !== 'Canceled' && a.status !== 'Completed');
    const past = all.filter(a => a.status === 'Completed' || a.status === 'Canceled');

    // Update stats using specific IDs
    const upcomingCountEl = document.getElementById('upcomingCount');
    const completedCountEl = document.getElementById('completedCount');
    const totalCountEl = document.getElementById('totalCount');
    
    if (upcomingCountEl) upcomingCountEl.textContent = String(upcoming.length);
    if (completedCountEl) completedCountEl.textContent = String(all.filter(a => a.status === 'Completed').length);
    if (totalCountEl) totalCountEl.textContent = String(all.length);

    // Update section badges
    const upcomingBadge = document.getElementById('upcomingBadge');
    const pastBadge = document.getElementById('pastBadge');

    if (upcomingBadge) upcomingBadge.textContent = `${upcoming.length} Scheduled`;
    if (pastBadge) pastBadge.textContent = `${past.length} Records`;

    const lists = document.querySelectorAll('#myAppointments .appointments-list');
    const upcomingList = lists[0];
    const pastList = lists[1];

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    }

    function badgeClass(status) {
        if (status === 'Confirmed') return 'badge-confirmed';
        if (status === 'Pending') return 'badge-pending';
        if (status === 'Completed') return 'badge-completed';
        if (status === 'Canceled') return 'badge-canceled';
        return 'badge-gray';
    }

    function formatMeta(a) {
        const fee = a.fee != null ? `Fee: ₹${a.fee}` : '';
        return `<span class="token">Token: ${escapeHtml(a.token)}</span>${fee ? `<span class="fee">${escapeHtml(fee)}</span>` : ''}`;
    }

    function itemHtml(a, isPastList) {
        const status = escapeHtml(a.status);
        const dept = escapeHtml(a.department);
        const doctor = escapeHtml(a.doctor || 'TBD');
        const date = escapeHtml(a.dateLabel);
        const time = escapeHtml(a.timeLabel);
        const id = escapeHtml(a.id);
        const completedClass = a.status === 'Completed' ? ' completed' : '';

        const primaryAction = a.status === 'Canceled'
            ? `<button class="btn-icon-action" data-action="delete" data-id="${id}" title="Delete">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M3 6h14" stroke="#6A7282" stroke-width="1.5" stroke-linecap="round"/>
                        <path d="M8 6V4h4v2" stroke="#6A7282" stroke-width="1.5" stroke-linecap="round"/>
                        <path d="M6 6l1 12h6l1-12" stroke="#6A7282" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
               </button>`
            : `<button class="btn-icon-action" data-action="cancel" data-id="${id}" title="Cancel">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M14 6L6 14M6 6l8 8" stroke="#E7000B" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
               </button>`;

        const secondaryAction = isPastList
            ? `<button class="btn-icon-action" data-action="delete" data-id="${id}" title="Delete">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M3 6h14" stroke="#6A7282" stroke-width="1.5" stroke-linecap="round"/>
                        <path d="M8 6V4h4v2" stroke="#6A7282" stroke-width="1.5" stroke-linecap="round"/>
                        <path d="M6 6l1 12h6l1-12" stroke="#6A7282" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
               </button>`
            : `<button class="btn-icon-action" data-action="complete" data-id="${id}" title="Mark Completed">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="8" stroke="#00A63E" stroke-width="1.5"/>
                        <path d="M6.5 10.5l2 2 5-5" stroke="#00A63E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
               </button>`;

        return `
            <div class="appointment-item${completedClass}">
                <div class="appointment-emoji">🗓️</div>
                <div class="appointment-details">
                    <div class="appointment-header">
                        <h3>${dept}</h3>
                        <span class="badge ${badgeClass(a.status)}">${status}</span>
                    </div>
                    <div class="appointment-info-grid">
                        <div class="info-item"><span>${doctor}</span></div>
                        <div class="info-item"><span>${date}</span></div>
                        <div class="info-item"><span>${time}</span></div>
                    </div>
                    <div class="appointment-meta">
                        ${formatMeta(a)}
                    </div>
                </div>
                <div class="appointment-actions">
                    ${primaryAction}
                    ${secondaryAction}
                </div>
            </div>
        `;
    }

    if (upcomingList) {
        upcomingList.innerHTML = upcoming.length
            ? upcoming.map(a => itemHtml(a, false)).join('')
            : `<div class="appointment-item"><div class="appointment-details"><h3>No upcoming appointments</h3></div></div>`;
    }

    if (pastList) {
        pastList.innerHTML = past.length
            ? past.map(a => itemHtml(a, true)).join('')
            : `<div class="appointment-item"><div class="appointment-details"><h3>No past appointments</h3></div></div>`;
    }
}

function handleAppointmentListAction(e) {
    const btn = e.target.closest('[data-action][data-id]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    const store = getStore();
    if (!store) return;

    if (action === 'cancel') {
        if (!confirm('Cancel this appointment?')) return;
        store.updateAppointment(id, { status: 'Canceled' });
        renderAppointmentsFromStore();
        return;
    }

    if (action === 'complete') {
        store.updateAppointment(id, { status: 'Completed' });
        renderAppointmentsFromStore();
        return;
    }

    if (action === 'delete') {
        if (!confirm('Delete this appointment permanently?')) return;
        store.deleteAppointment(id);
        renderAppointmentsFromStore();
        return;
    }
}

function showAppointmentLanding() {
    document.getElementById('appointmentLanding').style.display = 'block';
    document.getElementById('myAppointments').style.display = 'none';
    document.getElementById('bookingFlow').style.display = 'none';
}

function showMyAppointments() {
    document.getElementById('appointmentLanding').style.display = 'none';
    document.getElementById('myAppointments').style.display = 'block';
    document.getElementById('bookingFlow').style.display = 'none';
    renderAppointmentsFromStore();
}

function showBookingFlow() {
    document.getElementById('appointmentLanding').style.display = 'none';
    document.getElementById('myAppointments').style.display = 'none';
    document.getElementById('bookingFlow').style.display = 'block';
    
    currentStep = 1;
    renderBookingStep();
}

function renderBookingStep() {
    const container = document.getElementById('bookingFlow');
    
    if (currentStep === 1) {
        container.innerHTML = renderStep1();
    } else if (currentStep === 2) {
        container.innerHTML = renderStep2();
        initializeCalendar();
    } else if (currentStep === 3) {
        container.innerHTML = renderStep3();
    } else if (currentStep === 4) {
        container.innerHTML = renderConfirmation();
    }
}

function renderStepIndicator() {
    return `
        <div class="step-indicator">
            <div class="step-progress">
                <div class="step-item">
                    <div class="step-circle ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}">
                        ${currentStep > 1 ? '<svg width="27" height="27" viewBox="0 0 27 27" fill="none"><circle cx="13.5" cy="13.5" r="11" stroke="white" stroke-width="2"/><path d="M8 13l4 4 8-8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '1'}
                    </div>
                    <div class="step-line ${currentStep >= 2 ? 'active' : ''}"></div>
                </div>
                <div class="step-item">
                    <div class="step-circle ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}">
                        ${currentStep > 2 ? '<svg width="27" height="27" viewBox="0 0 27 27" fill="none"><circle cx="13.5" cy="13.5" r="11" stroke="white" stroke-width="2"/><path d="M8 13l4 4 8-8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '2'}
                    </div>
                    <div class="step-line ${currentStep >= 3 ? 'active' : ''}"></div>
                </div>
                <div class="step-item">
                    <div class="step-circle ${currentStep >= 3 ? 'active' : ''}">3</div>
                </div>
            </div>
            <div class="step-labels">
                <span class="step-label">Department</span>
                <span class="step-label">Date & Time</span>
                <span class="step-label">Details</span>
            </div>
        </div>
    `;
}

function renderStep1() {
    const departments = [
        { name: 'Cardiology', desc: 'Heart and cardiovascular care' },
        { name: 'Orthopedics', desc: 'Bone and joint treatment' },
        { name: 'Pediatrics', desc: "Children's healthcare" },
        { name: 'Neurology', desc: 'Brain and nervous system' },
        { name: 'General Medicine', desc: 'Primary care consultation' },
        { name: 'Dermatology', desc: 'Skin care and treatment' }
    ];
    
    return `
        <div class="booking-header">
            <h1>Book an Appointment</h1>
            <p>Schedule your visit with our expert medical professionals. Choose your preferred department, date, and time.</p>
        </div>
        
        ${renderStepIndicator()}
        
        <div class="booking-card">
            <h2>Select Department</h2>
            <div class="department-grid">
                ${departments.map(dept => `
                    <button class="department-btn ${bookingData.department === dept.name ? 'selected' : ''}" 
                            onclick="selectDepartment('${dept.name}')">
                        <h3>${dept.name}</h3>
                        <p>${dept.desc}</p>
                    </button>
                `).join('')}
            </div>
            <div class="booking-actions">
                <button class="btn-back-booking" onclick="showAppointmentLanding()">Back</button>
                <button class="btn-continue" ${!bookingData.department ? 'disabled' : ''} onclick="nextStep()">Continue</button>
            </div>
        </div>
    `;
}

function renderStep2() {
    return `
        <div class="booking-header">
            <h1>Book an Appointment</h1>
            <p>Schedule your visit with our expert medical professionals. Choose your preferred department, date, and time.</p>
        </div>
        
        ${renderStepIndicator()}
        
        <div class="booking-card">
            <h2>Select Date & Time</h2>
            <p style="margin-bottom: 24px;">Department: <span style="color: #155DFC; font-weight: 500;">${bookingData.department}</span></p>

            <div class="form-group" style="margin-bottom: 24px;">
                <label style="display:block; margin-bottom: 8px; font-weight: 500;">Select Doctor:</label>
                <select id="doctorSelect" class="form-control" onchange="selectDoctor(this.value)" style="width: 100%; max-width: 400px; padding: 12px; border: 1px solid #E5E7EB; border-radius: 8px;">
                    <option value="" disabled ${!bookingData.doctor ? 'selected' : ''}>Choose a doctor...</option>
                    ${getDoctorsForDepartment(bookingData.department).map(d => `<option value="${d.name}" ${bookingData.doctor === d.name ? 'selected' : ''}>${d.name}</option>`).join('') || '<option value="" disabled>No doctors available</option>'}
                </select>
            </div>
            
            <div class="calendar-container">
                <div class="calendar-header">
                    <svg width="27" height="27" viewBox="0 0 27 27" fill="none">
                        <path d="M9 2.25V6.75M18 2.25V6.75" stroke="#364153" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>
                        <rect x="3.375" y="4.5" width="20.25" height="20.25" rx="2.25" stroke="#364153" stroke-width="2.25"/>
                        <path d="M3.375 11.25h20.25" stroke="#364153" stroke-width="2.25"/>
                    </svg>
                    <h3>Select Date</h3>
                </div>
                <div class="calendar-controls">
                    <button class="calendar-nav" onclick="changeMonth(-1)">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M10 12L6 8l4-4" stroke="#1E1E1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <div class="calendar-selects">
                        <select class="calendar-select" id="monthSelect" onchange="updateCalendar()">
                            <option value="0">January</option>
                            <option value="1">February</option>
                            <option value="2" selected>March</option>
                            <option value="3">April</option>
                            <option value="4">May</option>
                            <option value="5">June</option>
                            <option value="6">July</option>
                            <option value="7">August</option>
                            <option value="8">September</option>
                            <option value="9">October</option>
                            <option value="10">November</option>
                            <option value="11">December</option>
                        </select>
                        <select class="calendar-select" id="yearSelect" onchange="updateCalendar()">
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                            <option value="2026" selected>2026</option>
                            <option value="2027">2027</option>
                        </select>
                    </div>
                    <button class="calendar-nav" onclick="changeMonth(1)">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M6 12l4-4-4-4" stroke="#1E1E1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
                <div class="calendar-grid" id="calendarGrid"></div>
            </div>
            
            <div class="time-slots-container">
                <div class="time-slots-header">
                    <svg width="27" height="27" viewBox="0 0 27 27" fill="none">
                        <circle cx="13.5" cy="13.5" r="11" stroke="#364153" stroke-width="2.25"/>
                        <path d="M13.5 6.75v6.75l4.5 2.25" stroke="#364153" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <h3>Select Time Slot</h3>
                </div>
                <div class="time-slots-grid" id="timeSlotsGrid">
                    ${renderTimeSlots()}
                </div>
            </div>
            
            <div class="booking-actions">
                <button class="btn-back-booking" onclick="prevStep()">Back</button>
                <button class="btn-continue" ${!bookingData.doctor || !bookingData.date || !bookingData.time ? 'disabled' : ''} onclick="nextStep()">Continue</button>
            </div>
        </div>
    `;
}

function renderTimeSlots() {
    const slots = [
        '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
        '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
        '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
    ];
    
    return slots.map((time, index) => `
        <button class="time-slot ${bookingData.time === time ? 'selected' : ''} ${index % 5 === 0 ? 'disabled' : ''}" 
                onclick="selectTime('${time}')" 
                ${index % 5 === 0 ? 'disabled' : ''}>
            ${time}
        </button>
    `).join('');
}

function renderStep3() {
    return `
        <div class="booking-header">
            <h1>Book an Appointment</h1>
            <p>Schedule your visit with our expert medical professionals. Choose your preferred department, date, and time.</p>
        </div>
        
        ${renderStepIndicator()}
        
        <div class="booking-card">
            <h2>Patient Information</h2>
            <form class="patient-form" id="patientForm" onsubmit="submitBooking(event)">
                <div class="form-field">
                    <label>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <circle cx="9" cy="6" r="3" stroke="#364153" stroke-width="1.5"/>
                            <path d="M15 16a6 6 0 00-12 0" stroke="#364153" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        Full Name *
                    </label>
                    <input type="text" name="fullName" placeholder="Enter your full name" required>
                </div>
                
                <div class="form-field">
                    <label>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M16.5 12.75v2.25a1.5 1.5 0 01-1.636 1.5 14.994 14.994 0 01-6.543-2.329 14.778 14.778 0 01-4.553-4.552A14.994 14.994 0 011.5 3.136 1.5 1.5 0 013 1.5h2.25a1.5 1.5 0 011.5 1.289 9.638 9.638 0 00.525 2.107 1.5 1.5 0 01-.337 1.584L5.625 7.793a12 12 0 004.553 4.552l1.313-1.313a1.5 1.5 0 011.584-.337 9.638 9.638 0 002.107.525 1.5 1.5 0 011.318 1.53z" stroke="#364153" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Phone Number *
                    </label>
                    <input type="tel" name="phone" placeholder="Enter your phone number" required>
                </div>
                
                <div class="form-field">
                    <label>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M3 3h12a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H3a1.5 1.5 0 01-1.5-1.5v-9A1.5 1.5 0 013 3z" stroke="#364153" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M16.5 4.5l-7.5 5.25L1.5 4.5" stroke="#364153" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Email Address *
                    </label>
                    <input type="email" name="email" placeholder="Enter your email address" required>
                </div>
                
                <div class="form-field">
                    <label>Reason for Visit</label>
                    <textarea name="reason" placeholder="Briefly describe your symptoms or reason for visit (optional)"></textarea>
                </div>
            </form>
            
            <div class="appointment-summary">
                <h3>Appointment Summary</h3>
                <div class="summary-item">
                    <span class="summary-label">Department:</span>
                    <span class="summary-value"> ${bookingData.department}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Doctor:</span>
                    <span class="summary-value"> ${bookingData.doctor}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Date:</span>
                    <span class="summary-value"> ${bookingData.date || 'Not selected'}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Time:</span>
                    <span class="summary-value"> ${bookingData.time || 'Not selected'}</span>
                </div>
            </div>
            
            <div class="booking-actions">
                <button type="button" class="btn-back-booking" onclick="prevStep()">Back</button>
                <button type="button" class="btn-continue" onclick="confirmBooking()">Confirm Appointment</button>
            </div>
        </div>
    `;
}

function renderConfirmation() {
    const token = 'APT' + Math.floor(Math.random() * 90000 + 10000);
    
    return `
        <div class="booking-header">
            <h1>Book an Appointment</h1>
            <p>Schedule your visit with our expert medical professionals. Choose your preferred department, date, and time.</p>
        </div>
        
        <div class="booking-card confirmation-container">
            <div class="confirmation-icon">
                <svg width="54" height="54" viewBox="0 0 54 54" fill="none">
                    <circle cx="27" cy="27" r="24" stroke="#00A63E" stroke-width="4"/>
                    <path d="M16 27l8 8 16-16" stroke="#00A63E" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            
            <h1>Appointment Confirmed!</h1>
            <p>Your appointment has been successfully booked</p>
            
            <div class="confirmation-details">
                <div class="appointment-token">
                    <p>Appointment Token</p>
                    <h2>${token}</h2>
                </div>
                
                <div class="confirmation-info">
                    <h3>
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                            <path d="M7.333 1.833V5.5M14.667 1.833V5.5" stroke="#6A7282" stroke-width="1.833" stroke-linecap="round" stroke-linejoin="round"/>
                            <rect x="2.75" y="3.667" width="16.5" height="16.5" rx="2" stroke="#6A7282" stroke-width="1.833"/>
                            <path d="M2.75 9.167h16.5M9.5 12l2 2 4-4" stroke="#6A7282" stroke-width="1.833" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Department
                    </h3>
                    <p>${bookingData.department}</p>
                    
                    <h3 style="margin-top: 12px;">
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                            <circle cx="11" cy="7.333" r="3.667" stroke="#6A7282" stroke-width="1.833"/>
                            <path d="M18.333 20.167a7.333 7.333 0 00-14.666 0" stroke="#6A7282" stroke-width="1.833" stroke-linecap="round"/>
                        </svg>
                        Doctor
                    </h3>
                    <p>${bookingData.doctor}</p>
                    
                    <h3 style="margin-top: 12px;">
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                            <path d="M7.333 1.833V5.5M14.667 1.833V5.5" stroke="#6A7282" stroke-width="1.833" stroke-linecap="round" stroke-linejoin="round"/>
                            <rect x="2.75" y="3.667" width="16.5" height="16.5" rx="2" stroke="#6A7282" stroke-width="1.833"/>
                            <path d="M2.75 9.167h16.5" stroke="#6A7282" stroke-width="1.833"/>
                        </svg>
                        Date & Time
                    </h3>
                    <p>${bookingData.date} at ${bookingData.time}</p>
                    
                    <h3>
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                            <circle cx="11" cy="7.333" r="3.667" stroke="#6A7282" stroke-width="1.833"/>
                            <path d="M18.333 20.167a7.333 7.333 0 00-14.666 0" stroke="#6A7282" stroke-width="1.833" stroke-linecap="round"/>
                        </svg>
                        Patient
                    </h3>
                    <p>${bookingData.patientInfo.fullName || 'John Smith'}</p>
                </div>
            </div>
            
            <div class="important-reminder">
                <h3>Important Reminder:</h3>
                <p>Please arrive 15 minutes before your appointment time. A confirmation email has been sent to ${bookingData.patientInfo.email || 'your email'}.</p>
            </div>
            
            <button class="btn-book-another" onclick="resetBooking()">Book Another Appointment</button>
        </div>
    `;
}

function selectDepartment(dept) {
    bookingData.department = dept;
    renderBookingStep();
}

function selectDate(date) {
    bookingData.date = date;
    updateTimeSlots();
    renderBookingStep();
}

function selectTime(time) {
    bookingData.time = time;
    renderBookingStep();
}

function selectDoctor(docName) {
    bookingData.doctor = docName;
    const continueBtn = document.querySelector('.btn-continue');
    if (continueBtn && bookingData.date && bookingData.time && bookingData.doctor) {
        continueBtn.disabled = false;
    } else if (continueBtn) {
        continueBtn.disabled = true;
    }
}

function nextStep() {
    if (currentStep === 1 && !bookingData.department) return;
    if (currentStep === 2 && (!bookingData.doctor || !bookingData.date || !bookingData.time)) return;
    
    currentStep++;
    renderBookingStep();
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        renderBookingStep();
    }
}

function confirmBooking() {
    const form = document.getElementById('patientForm');
    const formData = new FormData(form);
    
    bookingData.patientInfo = {
        fullName: formData.get('fullName')?.trim(),
        phone: formData.get('phone')?.trim(),
        email: formData.get('email')?.trim(),
        reason: formData.get('reason')?.trim()
    };
    
    // 1. Basic empty check
    if (!bookingData.patientInfo.fullName || !bookingData.patientInfo.phone || !bookingData.patientInfo.email) {
        alert('Please fill in all required fields (Name, Phone, Email).');
        return;
    }

    // 2. Strict Phone Validation (Exactly 10 digits, no spaces/letters)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(bookingData.patientInfo.phone)) {
        alert('Please enter a valid 10-digit phone number containing only numbers (e.g., 9876543210).');
        return;
    }

    // 3. Strict Email Validation (Must have @ and a proper domain structure)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(bookingData.patientInfo.email)) {
        alert('Please enter a valid email address with a domain (e.g., patient@example.com).');
        return;
    }

    // Persist to shared store (Create)
    const store = getStore();
    if (store) {
        store.createAppointment({
            department: bookingData.department,
            dateLabel: bookingData.date,
            timeLabel: bookingData.time,
            doctor: bookingData.doctor || 'TBD',
            reason: bookingData.patientInfo.reason || '',
            status: 'Confirmed',
            fee: 100
        });

        // Generate corresponding bill dynamically
        let dueDateStr = bookingData.date;
        try {
             const d = new Date(bookingData.date);
             if (!isNaN(d)) {
                 d.setDate(d.getDate() + 14); // Due in 14 days
                 const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                 dueDateStr = `${d.getDate()} ${monthNames[d.getMonth()]}, ${d.getFullYear()}`;
             }
        } catch(e) {}

        if (store.createBill) {
            store.createBill({
                visitDate: bookingData.date,
                dueDate: dueDateStr,
                subtotal: 100, // Matching the appointment fee
                items: [
                   { description: "Specialist Consultation", department: bookingData.department, amount: 100 }
                ]
            });
        }
    }
    
    currentStep = 4;
    renderBookingStep();
}

function resetBooking() {
    bookingData = {
        department: null,
        doctor: null,
        date: null,
        time: null,
        patientInfo: {}
    };
    currentStep = 1;
    showAppointmentLanding();
}

// Calendar functionality
let currentMonth = 2; // March (0-indexed)
let currentYear = 2026;
let selectedDate = null;

function initializeCalendar() {
    updateCalendar();
}

function updateCalendar() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    
    if (monthSelect && yearSelect) {
        currentMonth = parseInt(monthSelect.value);
        currentYear = parseInt(yearSelect.value);
    }
    
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    let html = '';
    
    // Day headers
    const dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    dayHeaders.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        html += `<div class="calendar-day other-month">${daysInPrevMonth - i}</div>`;
    }
    
    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const isPast = date < today;
        const isToday = date.toDateString() === today.toDateString();
        const isSelected = selectedDate && selectedDate.getDate() === day && 
                          selectedDate.getMonth() === currentMonth && 
                          selectedDate.getFullYear() === currentYear;
        
        html += `<div class="calendar-day ${isPast ? 'disabled' : ''} ${isSelected ? 'selected' : ''}" 
                      onclick="${!isPast ? `selectCalendarDate(${day})` : ''}">${day}</div>`;
    }
    
    // Next month days
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (firstDay + daysInMonth);
    for (let i = 1; i <= remainingCells; i++) {
        html += `<div class="calendar-day other-month">${i}</div>`;
    }
    
    calendarGrid.innerHTML = html;
}

function selectCalendarDate(day) {
    selectedDate = new Date(currentYear, currentMonth, day);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    bookingData.date = `${monthNames[currentMonth]} ${String(day).padStart(2, '0')}, ${currentYear}`;
    updateCalendar();
    
    // Enable time slot selection
    const continueBtn = document.querySelector('.btn-continue');
    if (continueBtn && bookingData.time && bookingData.doctor) {
        continueBtn.disabled = false;
    }
}

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    if (monthSelect && yearSelect) {
        monthSelect.value = currentMonth;
        yearSelect.value = currentYear;
    }
    
    updateCalendar();
}

function updateTimeSlots() {
    const timeSlotsGrid = document.getElementById('timeSlotsGrid');
    if (timeSlotsGrid) {
        timeSlotsGrid.innerHTML = renderTimeSlots();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check which view to show based on URL hash
    const hash = window.location.hash;
    if (hash === '#book') {
        showBookingFlow();
    } else if (hash === '#my-appointments') {
        showMyAppointments();
    } else {
        showAppointmentLanding();
    }

    const myAppointments = document.getElementById('myAppointments');
    if (myAppointments) {
        myAppointments.addEventListener('click', handleAppointmentListAction);
    }
});
