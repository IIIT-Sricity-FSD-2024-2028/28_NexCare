// NexCare Patient Portal Appointments Management & Booking System

let bookingData = {
    hospital: null,
    department: null,
    doctorId: null,
    doctor: null,
    date: null,
    time: null,
    patientInfo: {}
};

let currentStep = 1;

function getStore() {
    return window.NexCareStore;
}

function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// ── Slot Conflict & Booked Slots Detection ───────────────────────────────────
async function getBookedSlotsForDoctor(hospitalId, doctorName, dateStr) {
    if (!doctorName || !dateStr) return new Set();
    const booked = new Set();
    const normDoc = doctorName.toLowerCase().replace(/^dr\.\s*/i, '').trim();
    const normDate = String(dateStr).trim();

    // 1. Check window.NexCareAPI if available
    try {
        if (window.NexCareAPI && window.NexCareAPI.Appointments) {
            const res = await window.NexCareAPI.Appointments.getAll();
            const list = (res && res.success && Array.isArray(res.data)) ? res.data : 
                         (res && res.data && Array.isArray(res.data.data)) ? res.data.data : [];
            list.forEach(a => {
                if (a.status !== 'Cancelled') {
                    const aDoc = String(a.doctor || a.doctorName || '').toLowerCase().replace(/^dr\.\s*/i, '').trim();
                    const aDate = String(a.dateLabel || a.date || '').trim();
                    if ((aDoc === normDoc || aDoc.includes(normDoc) || normDoc.includes(aDoc)) && 
                        (aDate === normDate || aDate.includes(normDate) || normDate.includes(aDate))) {
                        if (a.timeLabel) booked.add(a.timeLabel);
                        if (a.time) booked.add(a.time);
                    }
                }
            });
        }
    } catch (e) {
        console.warn("API appointments query for booked slots failed:", e);
    }

    // 2. Check local store
    try {
        const store = getStore();
        if (store && typeof store.listAppointments === 'function') {
            const localList = store.listAppointments() || [];
            localList.forEach(a => {
                if (a.status !== 'Cancelled') {
                    const aDoc = String(a.doctor || a.doctorName || '').toLowerCase().replace(/^dr\.\s*/i, '').trim();
                    const aDate = String(a.dateLabel || a.date || '').trim();
                    if ((aDoc === normDoc || aDoc.includes(normDoc) || normDoc.includes(aDoc)) && 
                        (aDate === normDate || aDate.includes(normDate) || normDate.includes(aDate))) {
                        if (a.timeLabel) booked.add(a.timeLabel);
                        if (a.time) booked.add(a.time);
                    }
                }
            });
        }
    } catch (e) {
        console.warn("Local store query for booked slots failed:", e);
    }

    // 3. Check localStorage db table directly as fallback
    try {
        const rawDb = localStorage.getItem('nexcare_db_v3');
        if (rawDb) {
            const parsed = JSON.parse(rawDb);
            const dbList = parsed.appointments || [];
            dbList.forEach(a => {
                if (a.status !== 'Cancelled') {
                    const aDoc = String(a.doctor || a.doctorName || '').toLowerCase().replace(/^dr\.\s*/i, '').trim();
                    const aDate = String(a.dateLabel || a.date || '').trim();
                    if ((aDoc === normDoc || aDoc.includes(normDoc) || normDoc.includes(aDoc)) && 
                        (aDate === normDate || aDate.includes(normDate) || normDate.includes(aDate))) {
                        if (a.timeLabel) booked.add(a.timeLabel);
                        if (a.time) booked.add(a.time);
                    }
                }
            });
        }
    } catch (e) {}

    return booked;
}

// ── Main Page Initialization & Router ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view') || urlParams.get('mode');
    const urlHospitalId = urlParams.get('hospitalId');

    if (urlHospitalId) {
        bookingData.hospital = window.getHospitalById(urlHospitalId);
    }

    if (viewParam === 'book' || urlHospitalId) {
        showBookingFlow();
    } else if (viewParam === 'view' || viewParam === 'my' || viewParam === 'appointments') {
        showMyAppointments();
    } else {
        showAppointmentLanding();
    }
});

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

    currentStep = bookingData.hospital ? 1 : 0;
    renderBookingStep();
}

// ── Multi-Step Wizard Router ──────────────────────────────────────────────────
async function renderBookingStep() {
    const container = document.getElementById('bookingFlow');
    if (!container) return;

    if (currentStep === 0) {
        await renderStep0(container);
    } else if (currentStep === 1) {
        renderStep1(container);
    } else if (currentStep === 2) {
        renderStep2(container);
    } else if (currentStep === 3) {
        renderStep3(container);
    } else if (currentStep === 4) {
        renderConfirmation(container);
    }
}

function renderStepIndicator() {
    return `
        <div class="step-indicator">
            <div class="step-progress">
                <div class="step-item">
                    <div class="step-circle ${currentStep >= 0 ? 'active' : ''} ${currentStep > 0 ? 'completed' : ''}">
                        ${currentStep > 0 ? '✓' : '1'}
                    </div>
                    <div class="step-line ${currentStep >= 1 ? 'active' : ''}"></div>
                </div>
                <div class="step-item">
                    <div class="step-circle ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}">
                        ${currentStep > 1 ? '✓' : '2'}
                    </div>
                    <div class="step-line ${currentStep >= 2 ? 'active' : ''}"></div>
                </div>
                <div class="step-item">
                    <div class="step-circle ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}">
                        ${currentStep > 2 ? '✓' : '3'}
                    </div>
                    <div class="step-line ${currentStep >= 3 ? 'active' : ''}"></div>
                </div>
                <div class="step-item">
                    <div class="step-circle ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}">
                        ${currentStep > 3 ? '✓' : '4'}
                    </div>
                </div>
            </div>
            <div class="step-labels">
                <span class="step-label">Hospital</span>
                <span class="step-label">Department</span>
                <span class="step-label">Date & Doctor</span>
                <span class="step-label">Details</span>
            </div>
        </div>
    `;
}

// ── Step 0: Hospital Selection ────────────────────────────────────────────────
async function renderStep0(container) {
    container.replaceChildren();

    const header = document.createElement('div');
    header.className = 'booking-header';
    header.innerHTML = `
        <button class="btn-outline-sm" style="margin-bottom: 16px; display: inline-flex; align-items: center; gap: 6px;" onclick="showAppointmentLanding()">
            ← Back to Appointments Landing
        </button>
        <h1>Book an Appointment</h1>
        <p>Select a hospital to proceed with booking.</p>
    `;
    container.appendChild(header);

    const indWrap = document.createElement('div');
    indWrap.innerHTML = renderStepIndicator();
    container.appendChild(indWrap.firstElementChild);

    const card = document.createElement('div');
    card.className = 'booking-card';

    const title = document.createElement('h2');
    title.textContent = 'Select Hospital';
    card.appendChild(title);

    const resultsGrid = document.createElement('div');
    resultsGrid.className = 'hospital-results-grid';
    resultsGrid.style.display = 'grid';
    resultsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
    resultsGrid.style.gap = '16px';
    resultsGrid.style.marginTop = '20px';

    const hospitals = Array.isArray(window.MOCK_HOSPITALS) ? window.MOCK_HOSPITALS : [];

    hospitals.forEach(h => {
        const isSelected = bookingData.hospital && (bookingData.hospital.id === h.id || bookingData.hospital.name === h.name);
        const hCard = document.createElement('div');
        hCard.className = `hospital-card ${isSelected ? 'selected' : ''}`;
        hCard.style.border = isSelected ? '2px solid #155DFC' : '1px solid #E5E7EB';
        hCard.style.background = isSelected ? '#EFF6FF' : '#FFFFFF';
        hCard.style.borderRadius = '12px';
        hCard.style.padding = '20px';
        hCard.style.cursor = 'pointer';
        hCard.style.transition = 'all 0.2s';

        hCard.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 8px;">🏥</div>
            <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 4px;">${escapeHtml(h.name)}</h3>
            <p style="font-size: 13px; color: #6B7280; margin-bottom: 12px;">📍 ${escapeHtml(h.city)} • ${escapeHtml(h.address || '')}</p>
            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px;">
                ${(h.specialities || []).slice(0, 3).map(s => `<span class="badge" style="background:#F3F4F6; color:#374151; font-size:11px;">${escapeHtml(s)}</span>`).join('')}
            </div>
            <button class="btn-primary" style="width: 100%; justify-content: center; padding: 8px 12px; font-size: 13px;">
                ${isSelected ? 'Selected' : 'Select Hospital'}
            </button>
        `;

        hCard.onclick = () => {
            if (bookingData.hospital !== h) {
                bookingData.hospital = h;
                bookingData.department = null;
                bookingData.date = null;
                bookingData.doctor = null;
                bookingData.time = null;
            }
            currentStep = 1;
            renderBookingStep();
        };

        resultsGrid.appendChild(hCard);
    });

    card.appendChild(resultsGrid);
    container.appendChild(card);
}

// ── Step 1: Department Selection ─────────────────────────────────────────────
function renderStep1(container) {
    const hosp = bookingData.hospital;
    const hospName = hosp ? hosp.name : 'Hospital';
    const depts = hosp ? window.getDepartmentsForHospital(hosp.id || hosp.name) : [];

    container.replaceChildren();

    const header = document.createElement('div');
    header.className = 'booking-header';
    header.innerHTML = `
        <h1>Book an Appointment — ${escapeHtml(hospName)}</h1>
        <p>Select an available department offered at ${escapeHtml(hospName)}.</p>
    `;
    container.appendChild(header);

    const indWrap = document.createElement('div');
    indWrap.innerHTML = renderStepIndicator();
    container.appendChild(indWrap.firstElementChild);

    const card = document.createElement('div');
    card.className = 'booking-card';

    const title = document.createElement('h2');
    title.textContent = 'Select Department';
    card.appendChild(title);

    // Selected Hospital Summary Banner with Change option
    const hospitalInfo = document.createElement('div');
    hospitalInfo.style.background = '#F9FAFB';
    hospitalInfo.style.border = '1px solid #E5E7EB';
    hospitalInfo.style.borderRadius = '8px';
    hospitalInfo.style.padding = '12px 16px';
    hospitalInfo.style.marginBottom = '20px';
    hospitalInfo.style.display = 'flex';
    hospitalInfo.style.justifyContent = 'space-between';
    hospitalInfo.style.alignItems = 'center';

    hospitalInfo.innerHTML = `
        <div>
            <span style="font-size: 12px; color: #6B7280; font-weight: 600;">Selected Hospital:</span>
            <span style="font-size: 14px; color: #111827; font-weight: 700; margin-left: 8px;">🏥 ${escapeHtml(hospName)}</span>
        </div>
        <button type="button" style="background: none; border: none; color: #155DFC; font-size: 13px; font-weight: 600; cursor: pointer;" onclick="currentStep = 0; renderBookingStep();">
            Change Hospital
        </button>
    `;
    card.appendChild(hospitalInfo);

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

    depts.forEach(d => {
        const specName = d.name;
        const isSelected = bookingData.department === specName;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `department-btn ${isSelected ? 'selected' : ''}`;

        btn.innerHTML = `
            <h3>${escapeHtml(specName)}</h3>
            <p>Specialist medical services and consultation</p>
        `;

        btn.onclick = () => {
            grid.querySelectorAll('.department-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            if (bookingData.department !== specName) {
                bookingData.department = specName;
                bookingData.date = null;
                bookingData.doctor = null;
                bookingData.time = null;
            }
            continueBtn.disabled = false;
        };

        grid.appendChild(btn);
    });

    card.appendChild(grid);

    const actions = document.createElement('div');
    actions.className = 'booking-actions';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn-back-booking';
    backBtn.textContent = '← Back to Hospitals';
    backBtn.onclick = () => {
        currentStep = 0;
        renderBookingStep();
    };

    actions.appendChild(backBtn);
    actions.appendChild(continueBtn);
    card.appendChild(actions);

    container.appendChild(card);
}

// ── Step 2: Date, Doctor & Time Slot Selection ────────────────────────────────
function renderStep2(container) {
    const hosp = bookingData.hospital;
    const hospName = hosp ? hosp.name : 'Hospital';
    const dept = bookingData.department || 'General Medicine';

    container.replaceChildren();

    const header = document.createElement('div');
    header.className = 'booking-header';
    header.innerHTML = `
        <h1>Select Date & Doctor</h1>
        <p>Choose your preferred date, doctor, and time slot for <strong>${escapeHtml(dept)}</strong> at ${escapeHtml(hospName)}.</p>
    `;
    container.appendChild(header);

    const indWrap = document.createElement('div');
    indWrap.innerHTML = renderStepIndicator();
    container.appendChild(indWrap.firstElementChild);

    const card = document.createElement('div');
    card.className = 'booking-card';

    // 1. Date Picker Field
    const dateGroup = document.createElement('div');
    dateGroup.style.marginBottom = '20px';

    const dateLabel = document.createElement('label');
    dateLabel.style.display = 'block';
    dateLabel.style.fontSize = '14px';
    dateLabel.style.fontWeight = '600';
    dateLabel.style.color = '#374151';
    dateLabel.style.marginBottom = '6px';
    dateLabel.textContent = '📅 1. Select Appointment Date *';
    dateGroup.appendChild(dateLabel);

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.id = 'step2DatePicker';
    dateInput.className = 'form-input';
    dateInput.style.width = '100%';
    dateInput.style.padding = '10px 14px';
    dateInput.style.border = '1px solid #D1D5DB';
    dateInput.style.borderRadius = '8px';
    dateInput.style.fontSize = '14px';

    const todayStr = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    dateInput.min = todayStr;
    dateInput.max = maxDate.toISOString().split('T')[0];

    if (bookingData.date) {
        dateInput.value = bookingData.date;
    }

    dateGroup.appendChild(dateInput);
    card.appendChild(dateGroup);

    // Availability Alert Box
    const alertBox = document.createElement('div');
    alertBox.style.display = 'none';
    alertBox.style.padding = '14px 16px';
    alertBox.style.background = '#FEF2F2';
    alertBox.style.border = '1px solid #FCA5A5';
    alertBox.style.borderRadius = '8px';
    alertBox.style.color = '#991B1B';
    alertBox.style.fontSize = '13px';
    alertBox.style.marginBottom = '20px';
    card.appendChild(alertBox);

    // 2. Doctor Selection Field
    const docGroup = document.createElement('div');
    docGroup.style.marginBottom = '20px';

    const docLabel = document.createElement('label');
    docLabel.style.display = 'block';
    docLabel.style.fontSize = '14px';
    docLabel.style.fontWeight = '600';
    docLabel.style.color = '#374151';
    docLabel.style.marginBottom = '6px';
    docLabel.textContent = '👨‍⚕️ 2. Select Available Doctor *';
    docGroup.appendChild(docLabel);

    const docSelect = document.createElement('select');
    docSelect.id = 'step2DoctorSelect';
    docSelect.style.width = '100%';
    docSelect.style.padding = '10px 14px';
    docSelect.style.border = '1px solid #D1D5DB';
    docSelect.style.borderRadius = '8px';
    docSelect.style.fontSize = '14px';
    docSelect.disabled = true;
    docSelect.innerHTML = `<option value="">Select Date First...</option>`;
    docGroup.appendChild(docSelect);
    card.appendChild(docGroup);

    // 3. Doctor Information Card Container
    const doctorCardContainer = document.createElement('div');
    doctorCardContainer.style.marginBottom = '20px';
    card.appendChild(doctorCardContainer);

    // 4. Time Slots Section
    const slotGroup = document.createElement('div');
    slotGroup.style.marginBottom = '24px';

    const slotLabel = document.createElement('label');
    slotLabel.style.display = 'block';
    slotLabel.style.fontSize = '14px';
    slotLabel.style.fontWeight = '600';
    slotLabel.style.color = '#374151';
    slotLabel.style.marginBottom = '8px';
    slotLabel.textContent = '🕒 3. Available Time Slots *';
    slotGroup.appendChild(slotLabel);

    const slotsGrid = document.createElement('div');
    slotsGrid.style.display = 'grid';
    slotsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(110px, 1fr))';
    slotsGrid.style.gap = '10px';
    slotGroup.appendChild(slotsGrid);
    card.appendChild(slotGroup);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'booking-actions';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn-back-booking';
    backBtn.textContent = '← Back to Department';
    backBtn.onclick = () => {
        currentStep = 1;
        renderBookingStep();
    };

    const continueBtn = document.createElement('button');
    continueBtn.className = 'btn-continue';
    continueBtn.disabled = true;
    continueBtn.textContent = 'Continue';
    continueBtn.onclick = () => {
        if (bookingData.date && bookingData.doctor && bookingData.time) {
            currentStep = 3;
            renderBookingStep();
        }
    };

    actions.appendChild(backBtn);
    actions.appendChild(continueBtn);
    card.appendChild(actions);

    container.appendChild(card);

    // ── Dynamic Availability & Slot Loading Handler ──────────────────────────
    function handleDateChange() {
        const dateVal = dateInput.value;
        docSelect.innerHTML = `<option value="">Select Doctor...</option>`;
        docSelect.disabled = true;
        doctorCardContainer.replaceChildren();
        slotsGrid.replaceChildren();
        alertBox.style.display = 'none';
        continueBtn.disabled = true;

        if (!dateVal) return;

        bookingData.date = dateVal;
        const availableDocs = window.getAvailableDoctorsForDate(hosp ? hosp.id : 'apollo', dept, dateVal);

        if (availableDocs && availableDocs.length > 0) {
            docSelect.disabled = false;
            availableDocs.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.id || d.name;
                opt.textContent = `${d.name} — ${d.qualification} (${d.experience} yrs exp)`;
                if (bookingData.doctor === d.name || bookingData.doctorId === d.id) {
                    opt.selected = true;
                }
                docSelect.appendChild(opt);
            });

            if (!bookingData.doctor || !availableDocs.some(d => d.name === bookingData.doctor || d.id === bookingData.doctorId)) {
                bookingData.doctorId = availableDocs[0].id;
                bookingData.doctor = availableDocs[0].name;
            }
            handleDoctorChange();
        } else {
            alertBox.textContent = "No doctors are available for this department on the selected date. Please choose another date.";
            alertBox.style.display = "block";
        }
    }

    async function handleDoctorChange() {
        const dateVal = dateInput.value;
        const docVal = docSelect.value;
        doctorCardContainer.replaceChildren();
        slotsGrid.replaceChildren();
        continueBtn.disabled = true;

        if (!dateVal || !docVal) return;

        const availableDocs = window.getAvailableDoctorsForDate(hosp ? hosp.id : 'apollo', dept, dateVal);
        const selectedDoc = availableDocs.find(d => (d.id && d.id === docVal) || d.name === docVal) || availableDocs[0];

        if (selectedDoc) {
            bookingData.doctorId = selectedDoc.id;
            bookingData.doctor = selectedDoc.name;

            // Render Doctor Info Card (Requirement 14)
            const dObj = new Date(dateVal);
            const weekday = dObj.toLocaleDateString("en-US", { weekday: "long" });

            doctorCardContainer.innerHTML = `
                <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 10px; padding: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h4 style="color: #1E3A8A; font-size: 16px; font-weight: 700; margin: 0 0 4px 0;">👨‍⚕️ ${escapeHtml(selectedDoc.name)}</h4>
                            <p style="color: #1D4ED8; font-size: 13px; font-weight: 600; margin: 0;">${escapeHtml(dept)} • ${escapeHtml(selectedDoc.qualification)}</p>
                        </div>
                        <span class="badge" style="background: #DBEAFE; color: #1E40AF; padding: 4px 8px; font-size: 11px; font-weight: 600; border-radius: 20px;">Available</span>
                    </div>
                    <div style="display: flex; gap: 16px; font-size: 12px; color: #4B5563; margin-top: 8px;">
                        <span>⭐ <strong>${selectedDoc.experience} Yrs Exp</strong></span>
                        <span>🏥 <strong>${escapeHtml(hospName)}</strong></span>
                        <span>📅 <strong>${weekday}</strong></span>
                    </div>
                </div>
            `;

            // Query booked slots for this doctor on this date
            const bookedSlots = await getBookedSlotsForDoctor(hosp ? hosp.id : 'apollo', selectedDoc.name, dateVal);

            // Load Slots Grid
            const slots = window.getSlotsForDoctor(hosp ? hosp.id : 'apollo', dept, docVal, dateVal);
            if (slots && slots.length > 0) {
                let availableCount = 0;

                slots.forEach(s => {
                    const isBooked = bookedSlots.has(s);
                    const isSelected = bookingData.time === s && !isBooked;

                    const slotBtn = document.createElement('button');
                    slotBtn.type = 'button';
                    slotBtn.style.padding = '8px 12px';
                    slotBtn.style.borderRadius = '6px';
                    slotBtn.style.fontWeight = '600';
                    slotBtn.style.fontSize = '13px';
                    slotBtn.style.transition = 'all 0.2s';

                    if (isBooked) {
                        // Slot is already booked -> disable and mark Booked
                        slotBtn.disabled = true;
                        slotBtn.style.border = '1px solid #E5E7EB';
                        slotBtn.style.background = '#F3F4F6';
                        slotBtn.style.color = '#9CA3AF';
                        slotBtn.style.cursor = 'not-allowed';
                        slotBtn.title = 'This slot has already been booked by another patient';
                        slotBtn.innerHTML = `<span style="text-decoration: line-through;">${s}</span><span style="display:block; font-size:10px; color:#DC2626; font-weight:700;">Booked</span>`;
                    } else {
                        availableCount++;
                        slotBtn.style.border = isSelected ? '2px solid #155DFC' : '1px solid #D1D5DB';
                        slotBtn.style.background = isSelected ? '#155DFC' : '#FFFFFF';
                        slotBtn.style.color = isSelected ? '#FFFFFF' : '#1F2937';
                        slotBtn.style.cursor = 'pointer';
                        slotBtn.textContent = s;

                        slotBtn.onclick = () => {
                            slotsGrid.querySelectorAll('button:not(:disabled)').forEach(b => {
                                b.style.border = '1px solid #D1D5DB';
                                b.style.background = '#FFFFFF';
                                b.style.color = '#1F2937';
                            });
                            slotBtn.style.border = '2px solid #155DFC';
                            slotBtn.style.background = '#155DFC';
                            slotBtn.style.color = '#FFFFFF';

                            bookingData.time = s;
                            continueBtn.disabled = false;
                        };
                    }

                    slotsGrid.appendChild(slotBtn);
                });

                if (availableCount === 0) {
                    alertBox.textContent = `All time slots for ${selectedDoc.name} on this date are fully booked. Please choose another date or doctor.`;
                    alertBox.style.display = 'block';
                }

                if (bookingData.time && slots.includes(bookingData.time) && !bookedSlots.has(bookingData.time)) {
                    continueBtn.disabled = false;
                } else if (bookingData.time && bookedSlots.has(bookingData.time)) {
                    bookingData.time = null;
                    continueBtn.disabled = true;
                }
            }
        }
    }

    dateInput.onchange = handleDateChange;
    docSelect.onchange = handleDoctorChange;

    if (dateInput.value) {
        handleDateChange();
    }
}

// ── Step 3: Details & Confirmation Summary ───────────────────────────────────
function renderStep3(container) {
    const hosp = bookingData.hospital;
    const hospName = hosp ? hosp.name : 'Hospital';

    container.replaceChildren();

    const header = document.createElement('div');
    header.className = 'booking-header';
    header.innerHTML = `
        <h1>Patient Details & Summary</h1>
        <p>Review your appointment details before confirming.</p>
    `;
    container.appendChild(header);

    const indWrap = document.createElement('div');
    indWrap.innerHTML = renderStepIndicator();
    container.appendChild(indWrap.firstElementChild);

    const card = document.createElement('div');
    card.className = 'booking-card';

    const title = document.createElement('h2');
    title.textContent = 'Appointment Summary';
    card.appendChild(title);

    const summaryBox = document.createElement('div');
    summaryBox.style.background = '#F9FAFB';
    summaryBox.style.border = '1px solid #E5E7EB';
    summaryBox.style.borderRadius = '12px';
    summaryBox.style.padding = '20px';
    summaryBox.style.marginBottom = '24px';

    const items = [
        { label: 'Hospital', val: hospName },
        { label: 'Department', val: bookingData.department },
        { label: 'Doctor', val: bookingData.doctor },
        { label: 'Appointment Date', val: bookingData.date },
        { label: 'Time Slot', val: bookingData.time }
    ];

    items.forEach(it => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.marginBottom = '10px';
        row.style.fontSize = '14px';

        const lbl = document.createElement('span');
        lbl.style.color = '#6B7280';
        lbl.textContent = it.label + ':';

        const val = document.createElement('span');
        val.style.fontWeight = '700';
        val.style.color = '#111827';
        val.textContent = it.val || 'Not selected';

        row.appendChild(lbl);
        row.appendChild(val);
        summaryBox.appendChild(row);
    });
    card.appendChild(summaryBox);

    const actions = document.createElement('div');
    actions.className = 'booking-actions';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn-back-booking';
    backBtn.textContent = '← Back to Date & Doctor';
    backBtn.onclick = () => {
        currentStep = 2;
        renderBookingStep();
    };

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn-continue';
    confirmBtn.textContent = 'Confirm Appointment';
    confirmBtn.onclick = async () => {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Processing...';

        try {
            // Guard: Check if slot was booked in the interim
            const freshBookedSlots = await getBookedSlotsForDoctor(hosp ? hosp.id : 'apollo', bookingData.doctor, bookingData.date);
            if (freshBookedSlots.has(bookingData.time)) {
                alert(`The slot "${bookingData.time}" on ${bookingData.date} with ${bookingData.doctor} was just booked by another patient. Please select a different time slot.`);
                currentStep = 2;
                renderBookingStep();
                return;
            }

            const apptPayload = {
                hospitalId: hosp ? hosp.id : 'apollo',
                hospitalName: hospName,
                department: bookingData.department,
                doctorId: bookingData.doctorId || '',
                doctor: bookingData.doctor,
                dateLabel: bookingData.date,
                timeLabel: bookingData.time,
                patientName: 'Patient',
                status: 'Confirmed'
            };

            const store = getStore();
            let result = null;
            if (store && store.createAppointment) {
                result = await store.createAppointment(apptPayload);
            }

            bookingData.lastToken = (result && result.token) ? result.token : ('APT-' + Math.floor(100000 + Math.random() * 900000));
            currentStep = 4;
            renderConfirmation(container);
        } catch (err) {
            console.error('Error confirming appointment:', err);
            alert('Failed to confirm appointment. Please try again.');
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm Appointment';
        }
    };

    actions.appendChild(backBtn);
    actions.appendChild(confirmBtn);
    card.appendChild(actions);

    container.appendChild(card);
}

// ── Step 4: Confirmation Screen ───────────────────────────────────────────────
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
    box.style.margin = '40px auto';
    box.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';

    const icon = document.createElement('div');
    icon.style.fontSize = '48px';
    icon.style.marginBottom = '16px';
    icon.textContent = '🎉';

    const h2 = document.createElement('h2');
    h2.style.color = '#00A63E';
    h2.style.fontSize = '22px';
    h2.style.fontWeight = '700';
    h2.style.marginBottom = '8px';
    h2.textContent = 'Appointment Confirmed!';

    const pMsg = document.createElement('p');
    pMsg.style.color = '#4B5563';
    pMsg.style.fontSize = '14px';
    pMsg.style.marginBottom = '24px';
    pMsg.textContent = 'Your appointment has been successfully scheduled. Present your appointment token at the reception.';

    const summaryBox = document.createElement('div');
    summaryBox.style.background = '#F9FAFB';
    summaryBox.style.border = '1px solid #E5E7EB';
    summaryBox.style.borderRadius = '12px';
    summaryBox.style.padding = '20px';
    summaryBox.style.marginBottom = '24px';
    summaryBox.style.textAlign = 'left';

    const items = [
        { label: 'Appointment Token', val: bookingData.lastToken || 'APT-1024' },
        { label: 'Hospital', val: hospName },
        { label: 'Department', val: bookingData.department },
        { label: 'Doctor', val: bookingData.doctor },
        { label: 'Date', val: bookingData.date },
        { label: 'Time Slot', val: bookingData.time },
        { label: 'Status', val: 'Confirmed' }
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
    let all = [];
    const store = getStore();

    try {
        if (window.NexCareAPI && window.NexCareAPI.Appointments) {
            const res = await window.NexCareAPI.Appointments.getAll();
            if (res && res.success && Array.isArray(res.data)) {
                all = res.data;
            } else if (res && res.data && Array.isArray(res.data.data)) {
                all = res.data.data;
            }
        }
    } catch (e) {
        console.warn("API appointments fetch failed, falling back to local store:", e);
    }

    if (!all || all.length === 0) {
        if (store && typeof store.listAppointments === 'function') {
            all = store.listAppointments();
        }
    }

    if (!all) all = [];

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
            : `<div class="appointment-item"><div class="appointment-details"><h3>No upcoming appointments found</h3></div></div>`;

        pastList.innerHTML = past.length
            ? past.map(a => itemHtml(a, true)).join('')
            : `<div class="appointment-item"><div class="appointment-details"><h3>No past appointments found</h3></div></div>`;
    }
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
    const hospital = escapeHtml(a.hospitalName || a.hospital || 'NexCare Hospital');
    const doctor = escapeHtml(a.doctor && a.doctor.startsWith('Dr.') ? a.doctor : (a.doctorName || `Dr. ${a.department || 'General'} Specialist`));
    const date = escapeHtml(a.dateLabel);
    const time = escapeHtml(a.timeLabel);
    const id = escapeHtml(a.id);
    const hospId = escapeHtml(a.hospitalId || 'apollo');
    const completedClass = a.status === 'Completed' ? ' completed' : '';

    const actionsHtml = a.status === 'Confirmed' || a.status === 'Pending'
        ? `
            <button class="btn-outline-sm" style="padding: 6px 12px; font-size: 13px;" onclick="rescheduleAppt('${id}', '${hospId}', '${dept}', '${doctor}')">🔄 Reschedule</button>
            <button class="btn-outline-sm" style="padding: 6px 12px; font-size: 13px; color: #DC2626; border-color: #FCA5A5;" onclick="cancelAppt('${id}')" title="Cancel">🚫 Cancel</button>
          `
        : a.status === 'Cancelled'
        ? `<button class="btn-outline-sm" style="padding: 6px 12px; font-size: 13px; color: #DC2626;" onclick="deleteAppt('${id}')" title="Delete">❌ Delete</button>`
        : `<span class="badge badge-completed">Completed</span>`;

    return `
        <div class="appointment-item${completedClass}">
            <div class="appointment-emoji">🗓️</div>
            <div class="appointment-details">
                <div class="appointment-header">
                    <h3>${dept}</h3>
                    <span class="badge ${badgeClass(a.status)}">${status}</span>
                </div>
                <div class="appointment-info-grid">
                    <div class="info-item"><span>🏥 <strong>Hospital:</strong> ${hospital}</span></div>
                    <div class="info-item"><span>👨‍⚕️ <strong>Doctor:</strong> ${doctor}</span></div>
                    <div class="info-item"><span>📅 ${date}</span></div>
                    <div class="info-item"><span>🕒 ${time}</span></div>
                </div>
                <div class="appointment-meta">
                    <span class="token">Token / ID: ${escapeHtml(a.token || a.id)}</span>
                </div>
            </div>
            <div class="appointment-actions" style="display: flex; gap: 8px; align-items: center;">
                ${actionsHtml}
            </div>
        </div>
    `;
}

window.rescheduleAppt = function(id, hospId, dept, doctorName) {
    const hospObj = window.getHospitalById(hospId);
    bookingData.hospital = hospObj || null;
    bookingData.department = dept || null;
    bookingData.doctor = doctorName || null;
    bookingData.date = null;
    bookingData.time = null;

    showBookingFlow();
};

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
