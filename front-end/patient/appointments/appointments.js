// NexCare Appointments Page & Booking Flow System

// Safe description map for specialities
const SPECIALITY_DESCRIPTIONS = {
    "Cardiology": "Heart and cardiovascular care",
    "Neurology": "Brain and nervous-system care",
    "General Medicine": "Primary healthcare and consultations",
    "Emergency Medicine": "Urgent and emergency care",
    "Gynaecology": "Women’s reproductive healthcare",
    "Gynecology": "Women’s reproductive healthcare",
    "Paediatrics": "Healthcare for infants and children",
    "Pediatrics": "Healthcare for infants and children",
    "Orthopaedics": "Bone, joint and muscle treatment",
    "Orthopedics": "Bone, joint and muscle treatment",
    "Physiotherapy": "Rehabilitation and movement therapy",
    "Cardiothoracic Surgery": "Heart and chest surgery",
    "Dermatology": "Skin, hair and nail treatment",
    "Neurosurgery": "Surgical care for the brain and nervous system",
    "Oncology": "Cancer diagnosis and treatment"
};

let bookingData = {
    hospital: null,
    department: null,
    doctor: null,
    date: null,
    time: null,
    patientInfo: {}
};

let currentStep = 1;
let calendarCurrentDate = new Date();

function getStore() {
    return window.NexCareStore;
}

// ── Hospital Resolver ────────────────────────────────────────────────────────
async function resolveHospital(hId) {
    if (!hId) return null;

    // Try API first
    try {
        if (window.NexCareAPI && window.NexCareAPI.Hospitals) {
            const res = await window.NexCareAPI.Hospitals.getById(hId);
            if (res && res.success && res.data) {
                return res.data;
            }
        }
    } catch (e) {
        console.warn("API lookup failed for hospitalId:", hId, e);
    }

    // Try window.MOCK_HOSPITALS fallback
    if (Array.isArray(window.MOCK_HOSPITALS)) {
        const targetId = String(hId).trim().toLowerCase();
        const found = window.MOCK_HOSPITALS.find(h => String(h.id || '').trim().toLowerCase() === targetId);
        if (found) return found;
    }

    return null;
}

// Normalize speciality names to match project standard (e.g. Orthopaedics, Paediatrics)
function normalizeSpecialityName(name) {
    if (!name) return '';
    const str = String(name).trim();
    if (str.toLowerCase() === 'orthopedics') return 'Orthopaedics';
    if (str.toLowerCase() === 'pediatrics') return 'Paediatrics';
    if (str.toLowerCase() === 'gynecology') return 'Gynaecology';
    return str;
}

// ── Main Page Initialization ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    // Check URL search params for hospitalId first
    const urlParams = new URLSearchParams(window.location.search);
    let urlHospitalId = urlParams.get('hospitalId');

    // Fall back to localStorage only if URL param is absent
    if (!urlHospitalId) {
        try {
            urlHospitalId = localStorage.getItem('selectedHospitalId');
        } catch (e) {}
    }

    if (urlHospitalId) {
        await startBookingFlowForHospital(urlHospitalId);
    } else {
        showAppointmentLanding();
    }
});

async function startBookingFlowForHospital(hId) {
    const hospital = await resolveHospital(hId);

    const landing = document.getElementById('appointmentLanding');
    const myAppts = document.getElementById('myAppointments');
    const flowContainer = document.getElementById('bookingFlow');

    if (!hospital) {
        if (landing) landing.style.display = 'none';
        if (myAppts) myAppts.style.display = 'none';
        if (flowContainer) {
            flowContainer.style.display = 'block';
            flowContainer.innerHTML = `
                <div style="background:#FFFFFF; border:1px solid #FCA5A5; border-radius:12px; padding:32px; text-align:center; max-width:600px; margin:40px auto; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                    <div style="font-size:40px; margin-bottom:16px;">🏥</div>
                    <h2 style="color:#991B1B; font-size:20px; font-weight:700; margin-bottom:12px;">Hospital Not Found</h2>
                    <p style="color:#4B5563; font-size:14px; margin-bottom:24px; line-height:1.6;">The selected hospital could not be found. Please return to hospital search and choose a hospital.</p>
                    <button class="btn-primary" onclick="window.location.href='../hospital-search.html'">Back to Hospital Search</button>
                </div>
            `;
        }
        return;
    }

    // Set active hospital
    bookingData.hospital = hospital;
    bookingData.department = null;
    bookingData.date = null;
    bookingData.time = null;

    try { localStorage.setItem('selectedHospitalId', hospital.id); } catch(e) {}

    showBookingFlow();
}

function showAppointmentLanding() {
    const landing = document.getElementById('appointmentLanding');
    const myAppts = document.getElementById('myAppointments');
    const flow = document.getElementById('bookingFlow');

    if (landing) landing.style.display = 'block';
    if (myAppts) myAppts.style.display = 'none';
    if (flow) flow.style.display = 'none';
}

function showMyAppointments() {
    const landing = document.getElementById('appointmentLanding');
    const myAppts = document.getElementById('myAppointments');
    const flow = document.getElementById('bookingFlow');

    if (landing) landing.style.display = 'none';
    if (myAppts) myAppts.style.display = 'block';
    if (flow) flow.style.display = 'none';
    renderAppointmentsFromStore();
}

function showBookingFlow() {
    const landing = document.getElementById('appointmentLanding');
    const myAppts = document.getElementById('myAppointments');
    const flow = document.getElementById('bookingFlow');

    if (landing) landing.style.display = 'none';
    if (myAppts) myAppts.style.display = 'none';
    if (flow) flow.style.display = 'block';
    
    currentStep = 1;
    renderBookingStep();
}

// ── Step Rendering Router ────────────────────────────────────────────────────
async function renderBookingStep() {
    const container = document.getElementById('bookingFlow');
    if (!container) return;

    if (currentStep === 1) {
        renderStep1(container);
    } else if (currentStep === 2) {
        renderStep2(container);
    } else if (currentStep === 3) {
        await renderStep3(container);
    } else if (currentStep === 4) {
        renderConfirmation(container);
    }
}

function renderStepIndicator() {
    return `
        <div class="step-indicator">
            <div class="step-progress">
                <div class="step-item">
                    <div class="step-circle ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}">
                        ${currentStep > 1 ? '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 6L8 13L5 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '1'}
                    </div>
                    <div class="step-line ${currentStep >= 2 ? 'active' : ''}"></div>
                </div>
                <div class="step-item">
                    <div class="step-circle ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}">
                        ${currentStep > 2 ? '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 6L8 13L5 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '2'}
                    </div>
                    <div class="step-line ${currentStep >= 3 ? 'active' : ''}"></div>
                </div>
                <div class="step-item">
                    <div class="step-circle ${currentStep >= 3 ? 'active' : ''}">3</div>
                </div>
            </div>
            <div class="step-labels">
                <span class="step-label">Department / Speciality</span>
                <span class="step-label">Date & Time</span>
                <span class="step-label">Details</span>
            </div>
        </div>
    `;
}

// ── Step 1: Speciality Selection ─────────────────────────────────────────────
function renderStep1(container) {
    const hosp = bookingData.hospital;
    const hospName = hosp ? hosp.name : 'Hospital';
    const specs = (hosp && Array.isArray(hosp.specialities)) ? hosp.specialities.map(normalizeSpecialityName) : ['General Medicine'];

    container.replaceChildren();

    // Header
    const header = document.createElement('div');
    header.className = 'booking-header';
    const h1 = document.createElement('h1');
    h1.textContent = `Book an Appointment — ${hospName}`;
    const p = document.createElement('p');
    p.textContent = `Select an available speciality offered at ${hospName}.`;
    header.appendChild(h1);
    header.appendChild(p);

    container.appendChild(header);

    // Indicator HTML
    const indWrap = document.createElement('div');
    indWrap.innerHTML = renderStepIndicator();
    container.appendChild(indWrap.firstElementChild);

    // Booking Card
    const card = document.createElement('div');
    card.className = 'booking-card';

    const title = document.createElement('h2');
    title.textContent = 'Select Speciality / Department';
    card.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'department-grid';

    const continueBtn = document.createElement('button');
    continueBtn.className = 'btn-continue';
    continueBtn.disabled = !bookingData.department;
    continueBtn.textContent = 'Continue';
    continueBtn.onclick = () => {
        if (bookingData.department) {
            currentStep = 2;
            renderBookingStep();
        }
    };

    specs.forEach(specName => {
        const desc = SPECIALITY_DESCRIPTIONS[specName] || `${specName} medical services and consultation`;
        const isSelected = bookingData.department === specName;

        const btn = document.createElement('button');
        btn.className = `department-btn ${isSelected ? 'selected' : ''}`;
        
        const h3 = document.createElement('h3');
        h3.textContent = specName;
        const pDesc = document.createElement('p');
        pDesc.textContent = desc;

        btn.appendChild(h3);
        btn.appendChild(pDesc);

        btn.onclick = () => {
            // Deselect previous buttons
            grid.querySelectorAll('.department-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            // Changing speciality clears previously selected date and time
            if (bookingData.department !== specName) {
                bookingData.department = specName;
                bookingData.date = null;
                bookingData.time = null;
            }

            continueBtn.disabled = false;
        };

        grid.appendChild(btn);
    });

    card.appendChild(grid);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'booking-actions';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn-back-booking';
    backBtn.textContent = '← Back to Hospitals';
    backBtn.onclick = () => {
        window.location.href = '../hospital-search.html';
    };

    actions.appendChild(backBtn);
    actions.appendChild(continueBtn);
    card.appendChild(actions);

    container.appendChild(card);
}

// ── Step 2: Date & Time Selection ────────────────────────────────────────────
function renderStep2(container) {
    const hosp = bookingData.hospital;
    const hospName = hosp ? hosp.name : 'Hospital';
    const dept = bookingData.department || 'General Medicine';

    container.replaceChildren();

    // Header
    const header = document.createElement('div');
    header.className = 'booking-header';
    const h1 = document.createElement('h1');
    h1.textContent = `Book an Appointment — ${hospName}`;
    const p = document.createElement('p');
    p.textContent = `Choose your preferred date and time slot for ${dept}.`;
    header.appendChild(h1);
    header.appendChild(p);
    container.appendChild(header);

    // Indicator
    const indWrap = document.createElement('div');
    indWrap.innerHTML = renderStepIndicator();
    container.appendChild(indWrap.firstElementChild);

    // Booking Card
    const card = document.createElement('div');
    card.className = 'booking-card';

    const cardTitle = document.createElement('h2');
    cardTitle.textContent = 'Select Date & Time';
    card.appendChild(cardTitle);

    const deptLabel = document.createElement('p');
    deptLabel.style.marginBottom = '24px';
    deptLabel.style.fontSize = '14px';
    deptLabel.style.color = '#374151';
    deptLabel.innerHTML = `Speciality: <strong style="color:#155DFC;">${dept}</strong>`;
    card.appendChild(deptLabel);

    // Calendar & Slots Container
    const calContainer = document.createElement('div');
    calContainer.className = 'calendar-container';
    calContainer.style.display = 'grid';
    calContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
    calContainer.style.gap = '24px';

    // ── Left: Calendar ──
    const calBox = document.createElement('div');
    calBox.className = 'date-section';

    const calHeader = document.createElement('div');
    calHeader.className = 'calendar-header';
    calHeader.style.display = 'flex';
    calHeader.style.justifyContent = 'space-between';
    calHeader.style.alignItems = 'center';
    calHeader.style.marginBottom = '16px';

    const calTitle = document.createElement('h3');
    calTitle.style.margin = '0';
    calTitle.style.fontSize = '16px';
    calTitle.style.fontWeight = '600';
    calTitle.textContent = '📅 Select Date';

    const monthYearSelects = document.createElement('div');
    monthYearSelects.style.display = 'flex';
    monthYearSelects.style.gap = '8px';

    const monthSel = document.createElement('select');
    monthSel.style.padding = '4px 8px';
    monthSel.style.borderRadius = '6px';
    monthSel.style.border = '1px solid #D1D5DB';

    const yearSel = document.createElement('select');
    yearSel.style.padding = '4px 8px';
    yearSel.style.borderRadius = '6px';
    yearSel.style.border = '1px solid #D1D5DB';

    monthYearSelects.appendChild(monthSel);
    monthYearSelects.appendChild(yearSel);
    calHeader.appendChild(calTitle);
    calHeader.appendChild(monthYearSelects);
    calBox.appendChild(calHeader);

    const gridEl = document.createElement('div');
    gridEl.className = 'calendar-grid';
    calBox.appendChild(gridEl);
    calContainer.appendChild(calBox);

    // ── Right: Time Slots ──
    const slotBox = document.createElement('div');
    slotBox.className = 'time-slots-container';

    const slotTitle = document.createElement('h3');
    slotTitle.style.margin = '0 0 16px 0';
    slotTitle.style.fontSize = '16px';
    slotTitle.style.fontWeight = '600';
    slotTitle.textContent = '🕒 Select Time Slot';
    slotBox.appendChild(slotTitle);

    const slotsWrapper = document.createElement('div');
    slotBox.appendChild(slotsWrapper);
    calContainer.appendChild(slotBox);

    card.appendChild(calContainer);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'booking-actions';
    actions.style.marginTop = '32px';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn-back-booking';
    backBtn.textContent = '← Back to Specialities';
    backBtn.onclick = () => {
        currentStep = 1;
        renderBookingStep();
    };

    const continueBtn = document.createElement('button');
    continueBtn.className = 'btn-continue';
    continueBtn.disabled = !(bookingData.date && bookingData.time);
    continueBtn.textContent = 'Continue';
    continueBtn.onclick = () => {
        if (bookingData.date && bookingData.time) {
            currentStep = 3;
            renderBookingStep();
        }
    };

    actions.appendChild(backBtn);
    actions.appendChild(continueBtn);
    card.appendChild(actions);

    container.appendChild(card);

    // Render Calendar & Slots Logic
    const monthsList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 30);

    function updateMonthYearSelects() {
        monthSel.replaceChildren();
        yearSel.replaceChildren();

        monthsList.forEach((m, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = m;
            if (i === calendarCurrentDate.getMonth()) opt.selected = true;
            monthSel.appendChild(opt);
        });

        const curYear = new Date().getFullYear();
        [curYear, curYear + 1].forEach(y => {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            if (y === calendarCurrentDate.getFullYear()) opt.selected = true;
            yearSel.appendChild(opt);
        });
    }

    monthSel.onchange = () => {
        calendarCurrentDate.setMonth(parseInt(monthSel.value));
        renderCalendarGrid();
    };

    yearSel.onchange = () => {
        calendarCurrentDate.setFullYear(parseInt(yearSel.value));
        renderCalendarGrid();
    };

    function renderCalendarGrid() {
        updateMonthYearSelects();
        gridEl.replaceChildren();

        const year = calendarCurrentDate.getFullYear();
        const month = calendarCurrentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const weekdaysHeader = document.createElement('div');
        weekdaysHeader.style.display = 'grid';
        weekdaysHeader.style.gridTemplateColumns = 'repeat(7, 1fr)';
        weekdaysHeader.style.textAlign = 'center';
        weekdaysHeader.style.fontWeight = '600';
        weekdaysHeader.style.fontSize = '12px';
        weekdaysHeader.style.color = '#6B7280';
        weekdaysHeader.style.marginBottom = '8px';

        ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(wd => {
            const el = document.createElement('div');
            el.textContent = wd;
            weekdaysHeader.appendChild(el);
        });
        gridEl.appendChild(weekdaysHeader);

        const daysGrid = document.createElement('div');
        daysGrid.style.display = 'grid';
        daysGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
        daysGrid.style.gap = '4px';

        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            daysGrid.appendChild(empty);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            dateObj.setHours(0, 0, 0, 0);

            const isPast = dateObj < today;
            const isBeyond30 = dateObj > maxDate;
            const isDisabled = isPast || isBeyond30;

            const dateStr = `${monthsList[month]} ${d < 10 ? '0' + d : d}, ${year}`;
            const isSelected = bookingData.date === dateStr;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = d;
            btn.style.padding = '8px 0';
            btn.style.borderRadius = '6px';
            btn.style.border = '1px solid ' + (isSelected ? '#155DFC' : '#E5E7EB');
            btn.style.background = isSelected ? '#155DFC' : (isDisabled ? '#F3F4F6' : '#FFFFFF');
            btn.style.color = isSelected ? '#FFFFFF' : (isDisabled ? '#9CA3AF' : '#1F2937');
            btn.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
            btn.style.fontWeight = isSelected ? '700' : '500';
            btn.disabled = isDisabled;

            if (!isDisabled) {
                btn.onclick = () => {
                    daysGrid.querySelectorAll('button').forEach(b => {
                        b.style.background = '#FFFFFF';
                        b.style.color = '#1F2937';
                        b.style.borderColor = '#E5E7EB';
                    });
                    btn.style.background = '#155DFC';
                    btn.style.color = '#FFFFFF';
                    btn.style.borderColor = '#155DFC';

                    bookingData.date = dateStr;
                    // Reset selected time when date changes
                    bookingData.time = null;
                    continueBtn.disabled = true;

                    renderTimeSlotsForDate(dateObj);
                };
            }

            daysGrid.appendChild(btn);
        }

        gridEl.appendChild(daysGrid);

        // If date is already selected, render its slots
        if (bookingData.date) {
            const parts = bookingData.date.split(', ');
            const mDay = parts[0].split(' ');
            const mIdx = monthsList.indexOf(mDay[0]);
            const dNum = parseInt(mDay[1]);
            const yNum = parseInt(parts[1]);
            const dObj = new Date(yNum, mIdx, dNum);
            renderTimeSlotsForDate(dObj);
        } else {
            slotsWrapper.replaceChildren();
            const prompt = document.createElement('div');
            prompt.style.padding = '24px';
            prompt.style.textAlign = 'center';
            prompt.style.color = '#6B7280';
            prompt.style.fontSize = '14px';
            prompt.style.background = '#F9FAFB';
            prompt.style.borderRadius = '8px';
            prompt.textContent = 'Please select a date from the calendar to view available time slots.';
            slotsWrapper.appendChild(prompt);
        }
    }

    function renderTimeSlotsForDate(dateObj) {
        slotsWrapper.replaceChildren();

        const weekday = dateObj.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
        const avail = (hosp && hosp.availability) ? hosp.availability[dept] : null;

        let allowedDays = [1, 2, 3, 4, 5, 6];
        let configuredSlots = ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"];

        if (avail) {
            if (Array.isArray(avail.days)) allowedDays = avail.days;
            if (Array.isArray(avail.slots)) configuredSlots = avail.slots;
        }

        // Check if hospital speciality operates on this weekday
        if (!allowedDays.includes(weekday)) {
            const alertBox = document.createElement('div');
            alertBox.style.padding = '20px';
            alertBox.style.background = '#FEF2F2';
            alertBox.style.border = '1px solid #FCA5A5';
            alertBox.style.borderRadius = '8px';
            alertBox.style.color = '#991B1B';
            alertBox.style.fontSize = '14px';
            alertBox.style.lineHeight = '1.5';
            alertBox.textContent = 'No appointments are available for this speciality on the selected date. Please choose another date.';
            slotsWrapper.appendChild(alertBox);
            return;
        }

        // Filter past time slots if dateObj is TODAY
        const now = new Date();
        const isToday = dateObj.toDateString() === now.toDateString();

        const validSlots = configuredSlots.filter(slotStr => {
            if (!isToday) return true;

            // Parse time string e.g. "09:30 AM" or "02:00 PM"
            const match = slotStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
            if (!match) return true;

            let h = parseInt(match[1]);
            const m = parseInt(match[2]);
            const mer = match[3].toUpperCase();

            if (mer === 'PM' && h < 12) h += 12;
            if (mer === 'AM' && h === 12) h = 0;

            const slotTime = new Date(now);
            slotTime.setHours(h, m, 0, 0);

            return slotTime > now;
        });

        if (validSlots.length === 0) {
            const alertBox = document.createElement('div');
            alertBox.style.padding = '20px';
            alertBox.style.background = '#FFFBEB';
            alertBox.style.border = '1px solid #FCD34D';
            alertBox.style.borderRadius = '8px';
            alertBox.style.color = '#92400E';
            alertBox.style.fontSize = '14px';
            alertBox.textContent = 'All time slots for today have passed. Please select a future date.';
            slotsWrapper.appendChild(alertBox);
            return;
        }

        const slotsGrid = document.createElement('div');
        slotsGrid.style.display = 'grid';
        slotsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))';
        slotsGrid.style.gap = '10px';

        validSlots.forEach(slotStr => {
            const isSelected = bookingData.time === slotStr;
            const sBtn = document.createElement('button');
            sBtn.type = 'button';
            sBtn.textContent = slotStr;
            sBtn.style.padding = '10px 8px';
            sBtn.style.borderRadius = '8px';
            sBtn.style.border = '1px solid ' + (isSelected ? '#155DFC' : '#D1D5DB');
            sBtn.style.background = isSelected ? '#EFF6FF' : '#FFFFFF';
            sBtn.style.color = isSelected ? '#1D4ED8' : '#374151';
            sBtn.style.fontWeight = isSelected ? '700' : '500';
            sBtn.style.fontSize = '13px';
            sBtn.style.cursor = 'pointer';

            sBtn.onclick = () => {
                slotsGrid.querySelectorAll('button').forEach(b => {
                    b.style.background = '#FFFFFF';
                    b.style.color = '#374151';
                    b.style.borderColor = '#D1D5DB';
                    b.style.fontWeight = '500';
                });
                sBtn.style.background = '#EFF6FF';
                sBtn.style.color = '#1D4ED8';
                sBtn.style.borderColor = '#155DFC';
                sBtn.style.fontWeight = '700';

                bookingData.time = slotStr;
                continueBtn.disabled = !(bookingData.date && bookingData.time);
            };

            slotsGrid.appendChild(sBtn);
        });

        slotsWrapper.appendChild(slotsGrid);
    }

    renderCalendarGrid();
}

// ── Step 3: Patient Information & Confirmation ───────────────────────────────
async function renderStep3(container) {
    const hosp = bookingData.hospital;
    const hospName = hosp ? hosp.name : 'Hospital';
    const hospAddr = hosp ? (hosp.address || `${hosp.city || ''} - ${hosp.pincode || ''}`) : '';

    const store = getStore();
    const activePatient = store ? (await store.getActivePatient() || {}) : {};

    container.replaceChildren();

    // Header
    const header = document.createElement('div');
    header.className = 'booking-header';
    const h1 = document.createElement('h1');
    h1.textContent = `Book an Appointment — ${hospName}`;
    const p = document.createElement('p');
    p.textContent = `Review your details and confirm your appointment.`;
    header.appendChild(h1);
    header.appendChild(p);
    container.appendChild(header);

    // Indicator
    const indWrap = document.createElement('div');
    indWrap.innerHTML = renderStepIndicator();
    container.appendChild(indWrap.firstElementChild);

    // Card
    const card = document.createElement('div');
    card.className = 'booking-card';

    const cardTitle = document.createElement('h2');
    cardTitle.textContent = 'Patient Information & Confirmation';
    card.appendChild(cardTitle);

    // Form
    const form = document.createElement('form');
    form.className = 'patient-form';
    form.onsubmit = (e) => e.preventDefault();

    // Name field
    const nameGroup = document.createElement('div');
    nameGroup.className = 'form-field';
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Full Name *';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.required = true;
    nameInput.placeholder = 'Enter full name';
    nameInput.value = activePatient.fullName || '';
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);
    form.appendChild(nameGroup);

    // Phone field
    const phoneGroup = document.createElement('div');
    phoneGroup.className = 'form-field';
    const phoneLabel = document.createElement('label');
    phoneLabel.textContent = 'Phone Number *';
    const phoneInput = document.createElement('input');
    phoneInput.type = 'tel';
    phoneInput.required = true;
    phoneInput.placeholder = 'Enter phone number';
    phoneInput.value = activePatient.phone || '';
    phoneGroup.appendChild(phoneLabel);
    phoneGroup.appendChild(phoneInput);
    form.appendChild(phoneGroup);

    // Email field
    const emailGroup = document.createElement('div');
    emailGroup.className = 'form-field';
    const emailLabel = document.createElement('label');
    emailLabel.textContent = 'Email Address *';
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.required = true;
    emailInput.placeholder = 'Enter email address';
    emailInput.value = activePatient.email || '';
    emailGroup.appendChild(emailLabel);
    emailGroup.appendChild(emailInput);
    form.appendChild(emailGroup);

    // Reason field
    const reasonGroup = document.createElement('div');
    reasonGroup.className = 'form-field';
    const reasonLabel = document.createElement('label');
    reasonLabel.textContent = 'Reason for Visit (Optional)';
    const reasonInput = document.createElement('textarea');
    reasonInput.rows = 3;
    reasonInput.placeholder = 'Describe your symptoms or reason for visit...';
    reasonGroup.appendChild(reasonLabel);
    reasonGroup.appendChild(reasonInput);
    form.appendChild(reasonGroup);

    card.appendChild(form);

    // Summary Box
    const summaryBox = document.createElement('div');
    summaryBox.className = 'appointment-summary';
    summaryBox.style.marginTop = '24px';
    summaryBox.style.padding = '20px';
    summaryBox.style.background = '#F8FAFC';
    summaryBox.style.border = '1px solid #E2E8F0';
    summaryBox.style.borderRadius = '8px';

    const sumHeader = document.createElement('h3');
    sumHeader.style.margin = '0 0 12px 0';
    sumHeader.style.fontSize = '16px';
    sumHeader.style.fontWeight = '600';
    sumHeader.textContent = 'Appointment Summary';
    summaryBox.appendChild(sumHeader);

    const items = [
        { label: 'Hospital', val: hospName },
        { label: 'Address', val: hospAddr },
        { label: 'Speciality', val: bookingData.department },
        { label: 'Date', val: bookingData.date || 'Not selected' },
        { label: 'Time', val: bookingData.time || 'Not selected' }
    ];

    items.forEach(it => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.marginBottom = '6px';
        row.style.fontSize = '14px';

        const lbl = document.createElement('span');
        lbl.style.color = '#64748B';
        lbl.textContent = it.label + ':';

        const val = document.createElement('span');
        val.style.fontWeight = '600';
        val.style.color = '#1E293B';
        val.textContent = it.val;

        row.appendChild(lbl);
        row.appendChild(val);
        summaryBox.appendChild(row);
    });

    card.appendChild(summaryBox);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'booking-actions';
    actions.style.marginTop = '24px';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn-back-booking';
    backBtn.textContent = '← Back to Date & Time';
    backBtn.onclick = () => {
        currentStep = 2;
        renderBookingStep();
    };

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn-continue';
    confirmBtn.textContent = 'Confirm Appointment';

    confirmBtn.onclick = async () => {
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Processing...';

        try {
            const apptPayload = {
                hospitalId: hosp ? hosp.id : '',
                hospitalName: hospName,
                department: bookingData.department,
                doctor: hospName,
                dateLabel: bookingData.date,
                timeLabel: bookingData.time,
                patientName: nameInput.value.trim(),
                phone: phoneInput.value.trim(),
                email: emailInput.value.trim(),
                reason: reasonInput.value.trim()
            };

            let result = null;
            if (store && store.createAppointment) {
                result = await store.createAppointment(apptPayload);
            }

            bookingData.lastToken = (result && result.token) ? result.token : ('APT-' + Math.floor(100000 + Math.random() * 900000));
            bookingData.patientInfo = {
                name: nameInput.value.trim(),
                phone: phoneInput.value.trim(),
                email: emailInput.value.trim()
            };

            currentStep = 4;
            renderBookingStep();
        } catch (err) {
            console.error("Error creating appointment:", err);
            alert("Failed to book appointment. Please try again.");
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm Appointment';
        }
    };

    actions.appendChild(backBtn);
    actions.appendChild(confirmBtn);
    card.appendChild(actions);

    container.appendChild(card);
}

// ── Step 4: Confirmation Screen ─────────────────────────────────────────────
function renderConfirmation(container) {
    const hosp = bookingData.hospital;
    const hospName = hosp ? hosp.name : 'Hospital';

    container.replaceChildren();

    const box = document.createElement('div');
    box.style.background = '#FFFFFF';
    box.style.border = '1px solid #E5E7EB';
    box.style.borderRadius = '16px';
    box.style.padding = '40px 24px';
    box.style.textAlign = 'center';
    box.style.maxWidth = '550px';
    box.style.margin = '30px auto';
    box.style.boxShadow = '0 10px 25px rgba(0,0,0,0.05)';

    const icon = document.createElement('div');
    icon.style.fontSize = '48px';
    icon.style.marginBottom = '16px';
    icon.textContent = '✅';

    const h2 = document.createElement('h2');
    h2.style.margin = '0 0 8px 0';
    h2.style.fontSize = '22px';
    h2.style.fontWeight = '700';
    h2.style.color = '#111827';
    h2.textContent = 'Appointment Confirmed!';

    const pMsg = document.createElement('p');
    pMsg.style.margin = '0 0 24px 0';
    pMsg.style.fontSize = '14px';
    pMsg.style.color = '#4B5563';
    pMsg.textContent = `Your appointment at ${hospName} has been successfully scheduled.`;

    const summaryBox = document.createElement('div');
    summaryBox.style.background = '#F9FAFB';
    summaryBox.style.border = '1px solid #E5E7EB';
    summaryBox.style.borderRadius = '12px';
    summaryBox.style.padding = '16px 20px';
    summaryBox.style.textAlign = 'left';
    summaryBox.style.marginBottom = '28px';

    const items = [
        { label: 'Appointment Token', val: bookingData.lastToken || 'APT-2026-001' },
        { label: 'Hospital', val: hospName },
        { label: 'Speciality', val: bookingData.department },
        { label: 'Date', val: bookingData.date },
        { label: 'Time', val: bookingData.time }
    ];

    items.forEach(it => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.marginBottom = '8px';
        row.style.fontSize = '14px';

        const lbl = document.createElement('span');
        lbl.style.color = '#6B7280';
        lbl.textContent = it.label + ':';

        const val = document.createElement('span');
        val.style.fontWeight = '600';
        val.style.color = '#111827';
        val.textContent = it.val;

        row.appendChild(lbl);
        row.appendChild(val);
        summaryBox.appendChild(row);
    });

    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '12px';

    const dashBtn = document.createElement('button');
    dashBtn.className = 'btn-primary';
    dashBtn.style.flex = '1';
    dashBtn.textContent = 'Go to Dashboard';
    dashBtn.onclick = () => {
        window.location.href = '../dashboard.html';
    };

    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn-outline-sm';
    viewBtn.style.flex = '1';
    viewBtn.style.padding = '10px 16px';
    viewBtn.textContent = 'View My Appointments';
    viewBtn.onclick = () => {
        showMyAppointments();
    };

    btnRow.appendChild(dashBtn);
    btnRow.appendChild(viewBtn);

    box.appendChild(icon);
    box.appendChild(h2);
    box.appendChild(pMsg);
    box.appendChild(summaryBox);
    box.appendChild(btnRow);

    container.appendChild(box);
}

// ── Store Appointments Renderer ──────────────────────────────────────────────
async function renderAppointmentsFromStore() {
    const store = getStore();
    if (!store) return;

    const all = await store.listAppointments();
    const upcoming = all.filter(a => a.status !== 'Cancelled' && a.status !== 'Completed');
    const past = all.filter(a => a.status === 'Completed' || a.status === 'Cancelled');

    const upcomingCountEl = document.getElementById('upcomingCount');
    const completedCountEl = document.getElementById('completedCount');
    const totalCountEl = document.getElementById('totalCount');
    
    if (upcomingCountEl) upcomingCountEl.textContent = String(upcoming.length);
    if (completedCountEl) completedCountEl.textContent = String(all.filter(a => a.status === 'Completed').length);
    if (totalCountEl) totalCountEl.textContent = String(all.length);

    const upcomingBadge = document.getElementById('upcomingBadge');
    const pastBadge = document.getElementById('pastBadge');

    if (upcomingBadge) upcomingBadge.textContent = `${upcoming.length} Scheduled`;
    if (pastBadge) pastBadge.textContent = `${past.length} Records`;

    const lists = document.querySelectorAll('#myAppointments .appointments-list');
    if (lists.length >= 2) {
        const upcomingList = lists[0];
        const pastList = lists[1];

        upcomingList.innerHTML = upcoming.length
            ? upcoming.map(a => itemHtml(a, false)).join('')
            : `<div class="appointment-item"><div class="appointment-details"><h3>No upcoming appointments</h3></div></div>`;

        pastList.innerHTML = past.length
            ? past.map(a => itemHtml(a, true)).join('')
            : `<div class="appointment-item"><div class="appointment-details"><h3>No past appointments</h3></div></div>`;
    }
}

function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function badgeClass(status) {
    if (status === 'Confirmed') return 'badge-confirmed';
    if (status === 'Pending') return 'badge-pending';
    if (status === 'Completed') return 'badge-completed';
    if (status === 'Cancelled') return 'badge-canceled';
    return 'badge-gray';
}

function itemHtml(a, isPastList) {
    const status = escapeHtml(a.status);
    const dept = escapeHtml(a.department);
    const doctor = escapeHtml(a.doctor || a.hospitalName || 'NexCare Hospital');
    const date = escapeHtml(a.dateLabel);
    const time = escapeHtml(a.timeLabel);
    const id = escapeHtml(a.id);
    const completedClass = a.status === 'Completed' ? ' completed' : '';

    const primaryAction = a.status === 'Cancelled'
        ? `<button class="btn-icon-action" onclick="deleteAppt('${id}')" title="Delete">❌</button>`
        : `<button class="btn-icon-action" onclick="cancelAppt('${id}')" title="Cancel">🚫</button>`;

    return `
        <div class="appointment-item${completedClass}">
            <div class="appointment-emoji">🗓️</div>
            <div class="appointment-details">
                <div class="appointment-header">
                    <h3>${dept}</h3>
                    <span class="badge ${badgeClass(a.status)}">${status}</span>
                </div>
                <div class="appointment-info-grid">
                    <div class="info-item"><span>🏥 ${doctor}</span></div>
                    <div class="info-item"><span>📅 ${date}</span></div>
                    <div class="info-item"><span>🕒 ${time}</span></div>
                </div>
                <div class="appointment-meta">
                    <span class="token">Token: ${escapeHtml(a.token || a.id)}</span>
                </div>
            </div>
            <div class="appointment-actions">
                ${primaryAction}
            </div>
        </div>
    `;
}

window.cancelAppt = async function(id) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    const store = getStore();
    if (store) {
        await store.updateAppointment(id, { status: 'Cancelled' });
        renderAppointmentsFromStore();
    }
};

window.deleteAppt = async function(id) {
    if (!confirm('Are you sure you want to delete this appointment?')) return;
    const store = getStore();
    if (store) {
        await store.deleteAppointment(id);
        renderAppointmentsFromStore();
    }
};
