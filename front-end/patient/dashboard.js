document.addEventListener("DOMContentLoaded", async () => {
    await loadUserInfo();
    loadNearbyHospitals();
    loadAppointments();
    loadBills();
    loadAmbulance();
    loadRecords();
    setupDashboardSearch();
});

window.showSystemModal = function(title, message, confirmCallback) {
    const modal = document.getElementById('systemModal');
    if(!modal) return;
    
    document.getElementById('modalTitle').textContent = title;
    
    // Convert newlines to breaks
    const bodyContent = message.replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
    document.getElementById('modalBody').innerHTML = bodyContent;
    
    const footer = document.getElementById('modalFooter');
    if (confirmCallback) {
        footer.innerHTML = `
            <button class="btn-outline-sm" onclick="closeSystemModal()">Cancel</button>
            <button class="btn-primary-sm" id="modalConfirmBtn">Confirm</button>
        `;
        document.getElementById('modalConfirmBtn').onclick = () => {
            confirmCallback();
            closeSystemModal();
        };
    } else {
        footer.innerHTML = `
            <button class="btn-primary-sm" onclick="closeSystemModal()">OK</button>
        `;
    }
    modal.style.display = 'flex';
};

window.closeSystemModal = function() {
    const modal = document.getElementById('systemModal');
    if (modal) modal.style.display = 'none';
};

window.cancelAppointment = async function(id) {
    if (!window.NexCareStore) return;
    await window.NexCareStore.updateAppointment(id, { status: 'Cancelled' });
    // Dynamic UI update (no reload)
    loadAppointments();
    loadRecords();
};

window.payBill = function(id, subtotal) {
    // Requirement: Pay Now on dashboard should take user to Billing & Payments
    try {
        sessionStorage.setItem('nexcare_selected_bill_id', String(id));
    } catch (e) {}
    window.location.href = 'billing.html';
};

window.showNotifications = async function() {
    const appointments = await window.NexCareStore.listAppointments();
    const bills = await window.NexCareStore.listBills();
    
    let html = '';
    
    const upcoming = appointments.filter(a => a.status === 'Confirmed' || a.status === 'Pending');
    upcoming.forEach(appt => {
        html += `<div style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; background: #F8FAFC; border-left: 4px solid #155DFC; margin-bottom: 8px; border-radius: 4px;">
            <div style="font-weight: 600; color: #1E293B; margin-bottom: 4px;">Appointment ${appt.status}</div>
            <div style="font-size: 14px; color: #4A5565;">${appt.doctor} (${appt.department}) on ${appt.dateLabel} at ${appt.timeLabel}.</div>
        </div>`;
    });
    
    const pendingBills = bills.filter(b => b.status === 'Pending');
    pendingBills.forEach(bill => {
        html += `<div style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; background: #FFF7ED; border-left: 4px solid #F59E0B; margin-bottom: 8px; border-radius: 4px;">
            <div style="font-weight: 600; color: #9A3412; margin-bottom: 4px;">Payment Required</div>
            <div style="font-size: 14px; color: #4A5565;">Invoice ${bill.id} for ${bill.currency}${bill.subtotal} is due on ${bill.dueDate || bill.visitDate}.</div>
        </div>`;
    });
    
    if (html === '') {
        html = '<div style="padding: 24px; text-align: center; color: #6A7282; font-style: italic;">You have caught up on all alerts.\\nThere are no new notifications.</div>';
    } else {
        html = '<div style="max-height: 350px; overflow-y: auto; padding-right: 8px;">' + html + '</div>';
    }
    
    window.showSystemModal('Notifications Center', html);
};

async function loadUserInfo() {
    // ── Read user identity from the JWT token ─────────────────────────────
    const token = sessionStorage.getItem('nexcare_auth_token')
               || localStorage.getItem('nexcare_auth_token');

    let user = null;

    if (token) {
        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                let raw  = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                while (raw.length % 4) raw += '=';
                const json = decodeURIComponent(
                    atob(raw).split('').map(c =>
                        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
                    ).join('')
                );
                user = JSON.parse(json); // { sub, email, name, role, patientId, exp, iat }
            }
        } catch (e) {
            console.warn('JWT decode failed in loadUserInfo:', e);
        }
    }

    // Fallback: try sessionStorage user_data blob (set by login.html)
    if (!user) {
        try {
            const blob = sessionStorage.getItem('nexcare_user_data');
            if (blob) user = JSON.parse(blob);
        } catch (e) {}
    }

    if (!user) return; // Nothing to populate

    const patientId = user.patientId || user.sub || '';

    // ── Scope NexCareStore to this patient ─────────────────────────────────
    // So appointments/bills/ambulance data only show THIS user's records.
    if (window.NexCareDB && user.email) {
        window.NexCareDB.setActivePatientScope
            ? window.NexCareDB.setActivePatientScope(patientId || user.email)
            : null;
    }

    // ── Fetch latest patient data ──────────────────────────────────────────
    let patientProfile = null;
    try {
        if (window.NexCareStore && window.NexCareStore.getActivePatient) {
            patientProfile = await window.NexCareStore.getActivePatient();
        }
    } catch (e) {
        console.warn('Could not fetch latest patient profile:', e);
    }

    // ── Populate name ──────────────────────────────────────────────────────
    const displayName = (patientProfile && patientProfile.fullName) ? patientProfile.fullName : (user.name || user.email.split('@')[0]);
    const firstName   = displayName.split(' ')[0];

    const nameNode = document.querySelector('.profile-name');
    if (nameNode) nameNode.textContent = displayName;

    const avatarNode = document.querySelector('.profile-avatar');
    if (avatarNode) {
        const initials = displayName.split(' ')
            .map(p => p[0]).join('').substring(0, 2).toUpperCase();
        avatarNode.textContent = initials;
    }

    const heroHeading = document.querySelector('.hero-content h1');
    if (heroHeading) heroHeading.textContent = `Welcome Back, ${firstName}!`;

    // ── Populate Patient ID ────────────────────────────────────────────────
    const idNode = document.querySelector('.profile-id');
    const patientIdentifier = patientProfile.patientId || patientProfile.patientIdDisplay || patientProfile.id;
    if (idNode && patientIdentifier) idNode.textContent = `Patient ID: ${patientIdentifier}`;
}

async function loadAppointments() {
    const appointments = await window.NexCareStore.listAppointments();
    const table = document.querySelector("#appointmentsTable tbody");
    const stat = document.getElementById("statAppointments");
    
    const upcoming = appointments.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled');
    if (stat) stat.textContent = upcoming.length;
    
    if (table) {
        table.innerHTML = "";
        if (upcoming.length === 0) {
            table.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #6A7282; padding: 20px;">No upcoming appointments found.</td></tr>`;
        } else {
            upcoming.forEach(appt => {
                let badgeClass = "badge-pending";
                if(appt.status === 'Confirmed') badgeClass = "badge-confirmed";
                
                const hosp = escapeHtml(appt.hospitalName || appt.hospital || 'NexCare General Hospital');
                const doc = escapeHtml(appt.doctor && appt.doctor.startsWith('Dr.') ? appt.doctor : (appt.doctorName || `Dr. ${appt.department || 'General'} Specialist`));
                let viewMsg = `Viewing details for Appointment: ${appt.token || appt.id}\\nHospital: ${hosp}\\nDoctor: ${doc}\\nReason: ${appt.reason || "N/A"}`.replace(/'/g, "");
                let cancelConfirm = `Are you sure you want to cancel this appointment with ${doc} at ${hosp}?`.replace(/'/g, "");
                
                table.innerHTML += `
                    <tr>
                        <td><strong>${hosp}</strong></td>
                        <td>${doc}</td>
                        <td>${escapeHtml(appt.department)}</td>
                        <td>${escapeHtml(appt.dateLabel)}</td>
                        <td>${escapeHtml(appt.timeLabel)}</td>
                        <td><span class="badge ${badgeClass}">${escapeHtml(appt.status)}</span></td>
                        <td>
                            <button class="btn-icon" title="View" onclick="showSystemModal('Appointment Details', '${viewMsg}')">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="#4A5565" stroke-width="1.5"/><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="#4A5565" stroke-width="1.5"/></svg>
                            </button>
                            <button class="btn-icon" title="Cancel" onclick="showSystemModal('Cancel Appointment', '${cancelConfirm}', () => window.cancelAppointment('${appt.id}'))">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="#E7000B" stroke-width="1.33" stroke-linecap="round"/></svg>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
    }
}

async function loadBills() {
    const bills = await window.NexCareStore.listBills();
    const table = document.querySelector("#billingTable tbody");
    const stat = document.getElementById("statBills");
    
    const pending = bills.filter(b => b.status === "Pending");
    if (stat) stat.textContent = pending.length;
    
    if (table) {
        table.innerHTML = "";
        if (bills.length === 0) {
            table.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #6A7282; padding: 20px;">No bills found.</td></tr>`;
        } else {
            bills.forEach(bill => {
                let badgeClass = bill.status === "Paid" ? "badge-paid" : "badge-pending";
                let payConfirm = `Proceed to pay ${bill.currency}${bill.subtotal} for ${bill.id}?`.replace(/'/g, "");
                
                let actionBtn = bill.status === "Pending" ? 
                    `<button class="btn-primary-sm" onclick="showSystemModal('Confirm Payment', '${payConfirm}', () => window.payBill('${bill.id}', ${bill.subtotal}))">Pay Now</button>` :
                    `<button class="btn-icon" title="Download PDF" onclick="window.NexCareInvoice ? window.NexCareInvoice.download('${bill.id}') : null"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 10v3.333A1.333 1.333 0 0112.667 14.667H3.333A1.333 1.333 0 012 13.333V10" stroke="#4A5565" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.667 6.667L8 10l3.333-3.333M8 10V1.333" stroke="#4A5565" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
                
                table.innerHTML += `
                    <tr>
                        <td><strong>${bill.id}</strong></td>
                        <td>${bill.items && bill.items[0] ? bill.items[0].description : "General Services"}</td>
                        <td>${bill.visitDate || bill.dueDate}</td>
                        <td><strong>${bill.currency}${bill.total || bill.subtotal}</strong></td>
                        <td><span class="badge ${badgeClass}">${bill.status}</span></td>
                        <td style="display: flex; gap: 8px; align-items: center; justify-content: flex-end;">
                            ${actionBtn}
                             <button class="btn-icon" title="View Breakdown" onclick="window.NexCareInvoice ? window.NexCareInvoice.view('${bill.id}') : null">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="#4A5565" stroke-width="1.5"/><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="#4A5565" stroke-width="1.5"/></svg>
                             </button>
                        </td>
                    </tr>
                `;
            });
        }
    }
}

async function loadAmbulance() {
    const reqs = await window.NexCareStore.listAmbulanceRequests();
    const stat = document.getElementById("statAmbulance");
    if (stat) stat.textContent = reqs.filter(r => r.status !== 'Completed').length;
}

async function loadRecords() {
    const appointments = await window.NexCareStore.listAppointments();
    const completed = appointments.filter(a => a.status === 'Completed');
    
    const grid = document.getElementById("recordsGrid");
    const stat = document.getElementById("statRecords");
    
    if (stat) stat.textContent = completed.length;
    
    if (grid) {
        grid.innerHTML = "";
        if (completed.length === 0) {
            grid.innerHTML = `<p style="color: #6A7282; padding: 20px; grid-column: 1 / -1;">No medical records found.</p>`;
        } else {
            completed.forEach((appt, index) => {
                let viewMsg = `Opening Medical Record:\\nPatient: ${appt.patientName}\\nDoctor: ${appt.doctor}\\nDepartment: ${appt.department}\\nDate: ${appt.dateLabel}\\n\\nNotes: Patient is fully recovered and cleared.`.replace(/'/g, "");
                let dlMsg = `Downloading standard medical release form for ${appt.dateLabel}...`.replace(/'/g, "");
                
                grid.innerHTML += `
                    <div class="record-card">
                        <div class="record-icon blue">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#155DFC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#155DFC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="record-info">
                            <h3>${appt.reason || ("Visit Diagnostics #" + (index+1))}</h3>
                            <p>${appt.doctor} - ${appt.department}</p>
                            <p class="record-date">${appt.dateLabel}</p>
                        </div>
                        <div class="record-actions">
                            <button class="btn-primary-sm" onclick="showSystemModal('Medical Record', '${viewMsg}')">View</button>
                            <button class="btn-outline-sm" onclick="showSystemModal('Download Document', '${dlMsg}')">Download</button>
                        </div>
                    </div>
                `;
            });
        }
    }
}

function setupDashboardSearch() {
    const input = document.querySelector('.search-bar input');
    if (!input) return;

    const normalize = (s) => String(s || '').toLowerCase().trim();

    function applySearch() {
        const q = normalize(input.value);

        // Appointments table rows
        const apptRows = document.querySelectorAll('#appointmentsTable tbody tr');
        apptRows.forEach(row => {
            const text = normalize(row.textContent);
            row.style.display = !q || text.includes(q) ? '' : 'none';
        });

        // Billing rows
        const billRows = document.querySelectorAll('#billingTable tbody tr');
        billRows.forEach(row => {
            const text = normalize(row.textContent);
            row.style.display = !q || text.includes(q) ? '' : 'none';
        });

        // Records cards
        const recordCards = document.querySelectorAll('#recordsGrid .record-card');
        recordCards.forEach(card => {
            const text = normalize(card.textContent);
            card.style.display = !q || text.includes(q) ? '' : 'none';
        });
    }

    input.addEventListener('input', applySearch);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            input.value = '';
            applySearch();
        }
    });
}

window.bookHospitalAppt = function(hospitalId) {
    if (hospitalId) {
        try { localStorage.setItem('selectedHospitalId', hospitalId); } catch(e) {}
        window.location.href = pageLink('appointments/appointments', { hospitalId });
    } else {
        window.location.href = 'appointments/appointments.html';
    }
};

async function loadNearbyHospitals() {
    const grid = document.getElementById('nearbyHospitalsGrid');
    if (!grid) return;

    let hospitalsList = [];
    let isMock = false;
    const patientPincode = "517501";
    const patientCity = "Tirupati";

    try {
        let res = null;
        if (window.NexCareAPI && window.NexCareAPI.Hospitals) {
            res = await window.NexCareAPI.Hospitals.getNearby(patientCity, undefined, patientPincode);
            if (!res || !res.success) {
                res = await window.NexCareAPI.Hospitals.getAll();
            }
        } else {
            throw new Error("NexCareAPI.Hospitals is not initialized");
        }

        if (res && res.success) {
            const rawData = res.data;
            if (Array.isArray(rawData)) {
                hospitalsList = rawData;
            } else if (rawData && Array.isArray(rawData.data)) {
                hospitalsList = rawData.data;
            } else if (rawData && Array.isArray(rawData.hospitals)) {
                hospitalsList = rawData.hospitals;
            }
        }

        if (!Array.isArray(hospitalsList) || hospitalsList.length === 0) {
            throw new Error("No hospital data returned from API");
        }
    } catch (err) {
        console.warn("Backend unavailable or returned error for hospitals, falling back to mock data:", err);
        isMock = true;
        hospitalsList = Array.isArray(window.MOCK_HOSPITALS) ? window.MOCK_HOSPITALS : [];
    }

    // Update location / demo badge in UI
    const locationBadge = document.getElementById('patientLocationBadge');
    if (locationBadge) {
        if (isMock) {
            locationBadge.innerHTML = `Location: Tirupati (517501) <span style="background:#FEF3C7; color:#92400E; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:600; margin-left:6px;">Demo data</span>`;
        } else {
            locationBadge.textContent = `Location: Tirupati (517501)`;
        }
    }

    if (!Array.isArray(hospitalsList) || hospitalsList.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 24px; color: #6A7282;">Hospital information is temporarily unavailable. Please try again.</div>`;
        return;
    }

    // Filter to verified hospitals if verificationStatus field exists
    const verifiedHospitals = hospitalsList.filter(h => !h.verificationStatus || h.verificationStatus === 'verified');
    const displayList = verifiedHospitals.length > 0 ? verifiedHospitals : hospitalsList;

    // Proximity sorting
    const samePin = displayList.filter(h => String(h.pincode || '').trim() === patientPincode);
    const sameCity = displayList.filter(h => String(h.city || '').trim().toLowerCase() === patientCity.toLowerCase() && String(h.pincode || '').trim() !== patientPincode);
    const otherHospitals = displayList.filter(h => String(h.city || '').trim().toLowerCase() !== patientCity.toLowerCase());

    const sortedHospitals = [...samePin, ...sameCity, ...otherHospitals];

    if (sortedHospitals.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 24px; color: #6A7282;">No hospitals match the selected location.</div>`;
        return;
    }

    grid.innerHTML = sortedHospitals.map(h => {
        const pinStr = String(h.pincode || '').trim();
        const cityStr = String(h.city || '').trim();
        const nameStr = h.name || 'Hospital';
        const addressStr = h.address ? `${h.address}, ` : '';
        const fullAddr = `${addressStr}${cityStr}${pinStr ? ` - ${pinStr}` : ''}`;
        
        let proximityTag = '';
        if (pinStr === patientPincode) proximityTag = '<span style="background:#DCFCE7; color:#15803D; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600;">Same PIN (517501)</span>';
        else if (cityStr.toLowerCase() === patientCity.toLowerCase()) proximityTag = '<span style="background:#EFF6FF; color:#1D4ED8; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600;">In Your City</span>';
        else proximityTag = '<span style="background:#F3F4F6; color:#4B5563; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:500;">Nearby City</span>';

        const bedsAvail = typeof h.availableBeds === 'number' ? h.availableBeds : (h.icuBeds || 0);
        const bedsTotal = typeof h.totalBeds === 'number' ? h.totalBeds : 0;
        const emergencyStr = (h.emergencyAvailable || h.emergency24x7) ? 'Available 24x7' : 'Not Available';
        const phoneStr = h.phone ? ` • 📞 ${h.phone}` : '';

        return `
            <div style="background:#FFFFFF; border:1px solid #E5E7EB; border-radius:12px; padding:16px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:start; gap:8px; margin-bottom:8px;">
                        <h3 style="margin:0; font-size:15px; font-weight:700; color:#111827;">${nameStr}</h3>
                    </div>
                    <div style="margin-bottom:10px;">${proximityTag}</div>
                    <p style="font-size:12px; color:#6A7282; margin:0 0 6px;">📍 ${fullAddr}</p>
                    <p style="font-size:12px; color:#4B5563; margin:0 0 4px;">🛏️ Beds: <strong>${bedsAvail} available</strong> / ${bedsTotal} total</p>
                    <p style="font-size:12px; color:#4B5563; margin:0 0 12px;">🚨 Emergency: <strong>${emergencyStr}</strong>${phoneStr}</p>
                </div>
                <button class="btn-primary-sm" onclick="window.bookHospitalAppt('${h.id || ''}')" style="width:100%; text-align:center;">Book Appointment</button>
            </div>
        `;
    }).join('');
}