// The fee quoted when a doctor has not set one. It MUST match the backend:
// auth.service.ts stamps it on a new doctor, revenue.service.ts falls back to
// it when computing earnings. Three different values used to live here (500,
// 800, 1000), so the same unpriced doctor was quoted, displayed and paid
// differently.
const DEFAULT_CONSULTATION_FEE = 500;

// Doctor — practice dashboard.
//
// Everything here is scoped to the signed-in doctor by the backend: the
// appointment routes take 'me' and refuse any other id for a doctor account,
// so this page cannot accidentally show somebody else's clinic.

document.addEventListener('DOMContentLoaded', async () => {
    const user = fillHeader('Doctor');
    if (!user) return;

    setText('greeting', `Welcome back, ${user.name || 'Doctor'}`);
    setText('todayDate', todayLabel());

    // Populate Doctor Profile Summary Card
    setText('docSummaryName', user.name || 'Dr. Doctor');
    setText('docSummaryEmpId', user.employeeId || user.id || 'DOC-001');
    setText('docSummaryHosp', user.hospitalName || user.hospitalId || 'NexCare Hospital');
    setText('docSummaryDept', user.dept || user.department || 'Cardiology');
    setText('docSummarySpec', user.specialization || 'Consultant Specialist');
    setText('docSummaryQual', user.qualification || 'MBBS, MD');
    setText('docSummaryExp', user.experienceYears ? `${user.experienceYears} Years` : '10 Years');
    setText('docSummaryFee', user.consultationFee ? `₹${user.consultationFee}` : '₹800');
    setText('docSummarySchedule', user.consultationTiming || '09:00 AM - 05:00 PM (Mon - Sat)');

    await Promise.all([loadPractice(), loadEarnings()]);
});

async function loadPractice() {
    try {
        const [statsRes, listRes] = await Promise.all([
            window.NexCareAPI.Appointments.getDoctorStats('me'),
            window.NexCareAPI.Appointments.getByDoctor('me'),
        ]);

        if (statsRes.success) {
            const s = statsRes.data || {};
            setText('kpiToday', s.today ?? 0);
            setText('kpiPending', s.pending ?? 0);
            setText('kpiCompleted', s.completed ?? 0);
            setText('kpiPatients', s.uniquePatients ?? 0);
            setText('kpiCompletedSub', `of ${s.total ?? 0} booked`);
        }

        const all = listRes.success ? (listRes.data || []) : [];
        setText('practiceLine',
            `${all.length} appointment${all.length === 1 ? '' : 's'} booked with you across NexCare.`);

        renderToday(all);
        renderUpcoming(all);
    } catch (err) {
        console.error('Practice load failed:', err);
        setHTML('todayBody', `<tr><td colspan="7" class="empty" style="color:#B91C1C;">
            Could not load your schedule. Check that the backend is running.</td></tr>`);
        setHTML('upcomingBody', '<tr><td colspan="5" class="empty">—</td></tr>');
    }
}

/** Consultation revenue is the number a doctor actually cares about, so it sits here too. */
async function loadEarnings() {
    try {
        const res = await window.NexCareAPI.Revenue.getMyDoctorEarnings();
        if (!res.success) return;
        const e = res.data;
        setText('kpiNet', money(e.grossEarnings));
        setText('kpiNetSub', `${e.appointmentsCompleted} completed · ${money(e.consultationFee)} per consultation`);
    } catch (err) {
        console.error('Earnings load failed:', err);
    }
}

let currentPracticeAppointments = [];

function renderToday(all) {
    currentPracticeAppointments = all || [];
    const today = todayLabel();
    const rows = all
        .filter(a => a.dateLabel === today && a.status !== 'Cancelled')
        .sort((a, b) => appointmentTime(a) - appointmentTime(b));

    if (!rows.length) {
        setHTML('todayBody', '<tr><td colspan="7" class="empty">Nothing scheduled today.</td></tr>');
        return;
    }

    setHTML('todayBody', rows.map(a => `
        <tr>
            <td><strong>${esc(a.timeLabel)}</strong></td>
            <td>${esc(a.patientName)}</td>
            <td>${esc(a.department)}</td>
            <td class="muted">${esc(a.reason || '—')}</td>
            <td><span class="pill ${esc(a.status)}">${esc(a.status)}</span></td>
            <td class="num">${money(a.fee)}</td>
            <td class="num">${actionsFor(a)}</td>
        </tr>
    `).join(''));
}

function renderUpcoming(all) {
    const now = Date.now();
    const rows = all
        .filter(a => ['Pending', 'Confirmed'].includes(a.status) && appointmentTime(a) >= now)
        .sort((a, b) => appointmentTime(a) - appointmentTime(b))
        .slice(0, 8);

    if (!rows.length) {
        setHTML('upcomingBody', '<tr><td colspan="5" class="empty">No upcoming appointments.</td></tr>');
        return;
    }

    setHTML('upcomingBody', rows.map(a => `
        <tr>
            <td>${esc(a.dateLabel)}</td>
            <td>${esc(a.timeLabel)}</td>
            <td>${esc(a.patientName)}</td>
            <td class="muted">${esc(a.reason || '—')}</td>
            <td><span class="pill ${esc(a.status)}">${esc(a.status)}</span></td>
        </tr>
    `).join(''));
}

function actionsFor(a) {
    const btns = [];
    if (a.status === 'Pending') {
        btns.push(`<button class="btn primary" onclick="confirmAppointment('${esc(a.id)}')">Confirm</button>`);
    }
    if (a.status === 'Confirmed') {
        btns.push(`<button class="btn" onclick="completeAppointment('${esc(a.id)}')">Mark complete</button>`);
    }
    if (a.status === 'Confirmed' || a.status === 'Completed') {
        btns.push(`<button class="btn" style="margin-left:4px;" onclick="openReferModal('${esc(a.id)}')">Refer</button>`);
    }
    return btns.length ? btns.join('') : '<span class="muted">—</span>';
}

async function confirmAppointment(id) {
    await act(id, 'confirm', 'Appointment confirmed');
}

async function completeAppointment(id) {
    await act(id, 'complete', 'Consultation marked complete');
}

async function act(id, verb, successMessage) {
    try {
        const res = await window.NexCareAPI.Appointments[verb](id);
        if (!res.success) {
            notify(res.message || 'Could not update the appointment', 'error');
            return;
        }
        notify(successMessage, 'success');
        await Promise.all([loadPractice(), loadEarnings()]);
    } catch (err) {
        console.error(err);
        notify('Could not update the appointment', 'error');
    }
}

// ── Referral Flow ────────────────────────────────────────────────────────────
let referralDoctorsList = [];

async function openReferModal(appointmentId) {
    const apt = currentPracticeAppointments.find(a => String(a.id) === String(appointmentId));
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
            matchingDocs.map(d => `<option value="${esc(d.id)}" data-name="${esc(d.name)}" data-dept="${esc(d.dept)}" data-fee="${d.consultationFee || DEFAULT_CONSULTATION_FEE}">${esc(d.name)} (${esc(d.dept)}) — ₹${d.consultationFee || DEFAULT_CONSULTATION_FEE}</option>`).join('');
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
        await Promise.all([loadPractice(), loadEarnings()]);
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
