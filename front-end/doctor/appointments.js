// Doctor — the full appointment list.
//
// Fetched once and filtered in the browser. The list is per-doctor and small
// enough that a round trip per tab would be slower than filtering locally, and
// it keeps the status counts consistent while an action is in flight.

let allAppointments = [];
let activeStatus = '';
let searchTerm = '';

document.addEventListener('DOMContentLoaded', async () => {
    fillHeader('Doctor');

    document.getElementById('statusTabs').addEventListener('click', event => {
        const btn = event.target.closest('.tab-btn');
        if (!btn) return;
        document.querySelectorAll('#statusTabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeStatus = btn.dataset.status || '';
        render();
    });

    document.getElementById('searchBox').addEventListener('input', event => {
        searchTerm = event.target.value.trim().toLowerCase();
        render();
    });

    await load();
});

async function load() {
    try {
        const res = await window.NexCareAPI.Appointments.getByDoctor('me');
        if (!res.success) throw new Error(res.message);
        allAppointments = (res.data || []).sort((a, b) => appointmentTime(b) - appointmentTime(a));
        render();
    } catch (err) {
        console.error('Appointment load failed:', err);
        setHTML('apptBody', `<tr><td colspan="8" class="empty" style="color:#B91C1C;">
            Could not load your appointments. Check that the backend is running.</td></tr>`);
    }
}

function render() {
    const rows = allAppointments.filter(a => {
        if (activeStatus && a.status !== activeStatus) return false;
        if (!searchTerm) return true;
        return `${a.patientName} ${a.reason} ${a.department}`.toLowerCase().includes(searchTerm);
    });

    setText('listTitle', activeStatus ? `${activeStatus} appointments` : 'All appointments');
    setText('listCount', `${rows.length} of ${allAppointments.length}`);

    if (!rows.length) {
        setHTML('apptBody', '<tr><td colspan="8" class="empty">Nothing matches that filter.</td></tr>');
        return;
    }

    setHTML('apptBody', rows.map(a => `
        <tr>
            <td>${esc(a.dateLabel)}</td>
            <td>${esc(a.timeLabel)}</td>
            <td>
                <a href="#" onclick="viewPatient('${esc(a.patientId)}'); return false;" style="color:#2563EB; text-decoration:none;"><strong>${esc(a.patientName)}</strong></a>
                <br><span class="muted">${esc(a.patientId)}</span>
            </td>
            <td>${esc(a.department)}</td>
            <td class="muted">${esc(a.reason || '—')}</td>
            <td><span class="pill ${esc(a.status)}">${esc(a.status)}</span></td>
            <td class="num">${money(a.fee)}</td>
            <td class="num">${actionsFor(a)}</td>
        </tr>
    `).join(''));
}

function actionsFor(a) {
    const btns = [];
    if (a.status === 'Pending') {
        btns.push(`<button class="btn primary" onclick="act('${esc(a.id)}','confirm')">Confirm</button>`);
    }
    if (a.status === 'Confirmed') {
        btns.push(`<button class="btn" onclick="act('${esc(a.id)}','complete')">Complete</button>`);
    }
    if (a.status === 'Confirmed' || a.status === 'Completed') {
        btns.push(`<button class="btn" style="margin-left:4px;" onclick="openReferModal('${esc(a.id)}')">Refer Patient</button>`);
    }
    return btns.length ? btns.join('') : '<span class="muted">—</span>';
}

/**
 * Confirm and complete are the primary consultation actions a doctor has here.
 */
async function act(id, verb) {
    try {
        const res = await window.NexCareAPI.Appointments[verb](id);
        if (!res.success) {
            notify(res.message || 'Could not update the appointment', 'error');
            return;
        }
        notify(verb === 'confirm' ? 'Appointment confirmed' : 'Consultation marked complete', 'success');
        await load();
    } catch (err) {
        console.error(err);
        notify('Could not update the appointment', 'error');
    }
}

// ── Referral Flow ────────────────────────────────────────────────────────────
let referralDoctorsList = [];

async function openReferModal(appointmentId) {
    const apt = allAppointments.find(a => String(a.id) === String(appointmentId));
    if (!apt) return;

    document.getElementById('referPatientId').value = apt.patientId || '';
    document.getElementById('referPatientName').value = apt.patientName || '';
    document.getElementById('referParentAppointmentId').value = apt.id || '';
    document.getElementById('referHospitalId').value = apt.hospitalId || '';
    document.getElementById('referHospitalName').value = apt.hospitalName || '';

    const info = document.getElementById('referPatientInfo');
    if (info) {
        info.innerHTML = `Referring <strong>${esc(apt.patientName)}</strong> (${esc(apt.patientId)}) for follow-up consultation.`;
    }

    const today = new Date();
    today.setDate(today.getDate() + 1);
    const dateInput = document.getElementById('referDate');
    if (dateInput) {
        dateInput.value = today.toISOString().split('T')[0];
        dateInput.min = new Date().toISOString().split('T')[0];
    }

    // Load doctors scoped to same hospital
    try {
        const res = await window.NexCareAPI.Users.getDoctors('', apt.hospitalId);
        referralDoctorsList = (res.success && Array.isArray(res.data)) ? res.data : [];
    } catch (e) {
        referralDoctorsList = [];
    }

    // Populate departments
    const deptSelect = document.getElementById('referDepartment');
    const docSelect = document.getElementById('referDoctor');
    
    // Extract unique departments from doctors
    const depts = Array.from(new Set(referralDoctorsList.map(d => d.dept).filter(Boolean)));
    if (!depts.length) {
        depts.push('Cardiology', 'Neurology', 'Orthopaedics', 'General Medicine', 'Dermatology', 'Pediatrics');
    }

    deptSelect.innerHTML = '<option value="">Select Department...</option>' +
        depts.map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join('');

    docSelect.innerHTML = '<option value="">Select Doctor...</option>';

    const modal = document.getElementById('referModal');
    if (modal) modal.style.display = 'flex';
}

function closeReferModal() {
    const modal = document.getElementById('referModal');
    if (modal) modal.style.display = 'none';
}

function onReferDepartmentChange() {
    const dept = document.getElementById('referDepartment').value;
    const docSelect = document.getElementById('referDoctor');
    
    const matchingDocs = referralDoctorsList.filter(d => !dept || d.dept === dept);
    
    if (matchingDocs.length > 0) {
        docSelect.innerHTML = '<option value="">Select Doctor...</option>' +
            matchingDocs.map(d => `<option value="${esc(d.id)}" data-name="${esc(d.name)}" data-dept="${esc(d.dept)}" data-fee="${d.consultationFee || 1000}">${esc(d.name)} (${esc(d.dept)}) — ₹${d.consultationFee || 1000}</option>`).join('');
    } else {
        docSelect.innerHTML = '<option value="">No doctors available in this department</option>';
    }
}

function onReferDoctorChange() {
    // Dynamic change if required
}

async function submitReferral(event) {
    event.preventDefault();
    const btn = document.getElementById('referSubmitBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Submitting...';
    }

    try {
        const patientId = document.getElementById('referPatientId').value;
        const patientName = document.getElementById('referPatientName').value;
        const parentAppointmentId = document.getElementById('referParentAppointmentId').value;
        const hospitalId = document.getElementById('referHospitalId').value;
        const hospitalName = document.getElementById('referHospitalName').value;
        const department = document.getElementById('referDepartment').value;
        const docSelect = document.getElementById('referDoctor');
        const doctorId = docSelect.value;
        const selectedOpt = docSelect.options[docSelect.selectedIndex];
        const doctorName = selectedOpt?.dataset?.name || selectedOpt?.text || 'Doctor';
        const fee = Number(selectedOpt?.dataset?.fee) || 1000;
        const rawDate = document.getElementById('referDate').value;
        const time = document.getElementById('referTime').value;
        const reason = document.getElementById('referReason').value;

        const dateObj = new Date(rawDate);
        const dateLabel = isNaN(dateObj.getTime()) ? rawDate : dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

        const payload = {
            patientId,
            patientName,
            department,
            doctor: doctorName,
            doctorId,
            hospitalId: hospitalId || undefined,
            hospitalName: hospitalName || undefined,
            dateLabel,
            timeLabel: time,
            fee,
            reason: reason ? `Referral: ${reason}` : 'Referred follow-up consultation',
            parentAppointmentId,
            status: 'Pending'
        };

        const res = await window.NexCareAPI.Appointments.create(payload);
        if (!res.success) {
            notify(res.message || 'Failed to create referral appointment', 'error');
            return;
        }

        notify('Referral appointment created successfully (will be billed upon completion)', 'success');
        closeReferModal();
        await load();
    } catch (err) {
        console.error('Referral creation failed:', err);
        notify('Failed to create referral appointment', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Create Referral';
        }
    }
}

async function viewPatient(patientId) {
    if (!patientId) return;
    
    // Reset modal state
    const modal = document.getElementById('patientInfoModal');
    if (!modal) return;
    
    document.getElementById('piTitle').textContent = 'Patient Information';
    document.getElementById('piDemographics').innerHTML = '<div>Loading...</div>';
    document.getElementById('piInsurance').innerHTML = '<div>Loading...</div>';
    document.getElementById('piHistoryBody').innerHTML = '<tr><td colspan="3" class="empty">Loading...</td></tr>';
    modal.style.display = 'flex';

    try {
        // Fetch patient demographics
        let patientName = 'Unknown';
        if (window.NexCareAPI && window.NexCareAPI.Patients) {
            const res = await window.NexCareAPI.Patients.getById(patientId);
            if (res.success && res.data) {
                const p = res.data;
                patientName = p.fullName || p.name || 'Patient';
                document.getElementById('piTitle').textContent = patientName;
                document.getElementById('piDemographics').innerHTML = `
                    <div><strong>Email:</strong> ${esc(p.email || 'N/A')}</div>
                    <div><strong>Phone:</strong> ${esc(p.phone || 'N/A')}</div>
                    <div><strong>Age:</strong> ${esc(p.age || 'N/A')}</div>
                    <div><strong>Blood Group:</strong> ${esc(p.bloodGroup || 'N/A')}</div>
                `;

                if (p.insurance) {
                    const ins = p.insurance;
                    let flagHtml = '';
                    if (ins.verificationStatus === 'mock_verified') {
                        flagHtml = `<div style="display:inline-block; padding:4px 8px; background:#FEF3C7; color:#D97706; border-radius:4px; font-size:11px; font-weight:700; margin-left:8px;">⚠️ MOCK / PENDING REAL VERIFICATION</div>`;
                    }
                    document.getElementById('piInsurance').innerHTML = `
                        <div style="display:flex; align-items:center; margin-bottom:8px;">
                            <strong>Status:</strong> 
                            <span style="margin-left:4px;">${esc(ins.verificationStatus || 'Unknown')}</span>
                            ${flagHtml}
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                            <div><strong>Provider:</strong> ${esc(ins.provider || 'N/A')}</div>
                            <div><strong>Policy #:</strong> ${esc(ins.policyNumber || 'N/A')}</div>
                            <div><strong>Group #:</strong> ${esc(ins.groupNumber || 'N/A')}</div>
                            <div><strong>Verified At:</strong> ${ins.verifiedAt ? new Date(ins.verifiedAt).toLocaleString() : 'N/A'}</div>
                        </div>
                    `;
                } else {
                    document.getElementById('piInsurance').innerHTML = '<div>No insurance details on file.</div>';
                }

            } else {
                document.getElementById('piDemographics').innerHTML = '<div>Could not load patient details.</div>';
                document.getElementById('piInsurance').innerHTML = '<div>Could not load patient details.</div>';
            }
        }

        // We already have allAppointments loaded for this doctor, so we can filter locally
        const history = allAppointments
            .filter(a => a.patientId === patientId)
            .sort((a, b) => {
                const dateA = new Date(a.dateLabel + ' ' + a.timeLabel);
                const dateB = new Date(b.dateLabel + ' ' + b.timeLabel);
                return isNaN(dateA) || isNaN(dateB) ? 0 : dateB - dateA;
            });
            
        if (history.length === 0) {
            document.getElementById('piHistoryBody').innerHTML = '<tr><td colspan="3" class="empty">No past records found.</td></tr>';
        } else {
            document.getElementById('piHistoryBody').innerHTML = history.map(a => `
                <tr>
                    <td style="padding:8px 4px;">${esc(a.dateLabel)}</td>
                    <td style="padding:8px 4px;">${esc(a.timeLabel)}</td>
                    <td style="padding:8px 4px;"><span class="pill ${esc(a.status)}">${esc(a.status)}</span></td>
                </tr>
            `).join('');
        }
    } catch (err) {
        console.error('Failed to load patient info', err);
        document.getElementById('piDemographics').innerHTML = '<div style="color:red;">Error loading details.</div>';
    }
}
