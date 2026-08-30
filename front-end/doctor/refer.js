// Doctor — refer a patient to another doctor after (or with) completing a consult.
// Shared by appointments.html and dashboard.html.

function openReferDialog(appointment) {
    closeReferDialog();

    const overlay = document.createElement('div');
    overlay.id = 'referOverlay';
    Object.assign(overlay.style, {
        position: 'fixed', inset: '0', background: 'rgba(15,23,42,.45)',
        zIndex: '10000', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
    });
    overlay.addEventListener('click', event => {
        if (event.target === overlay) closeReferDialog();
    });

    const canComplete = appointment.status === 'Confirmed';
    overlay.innerHTML = `
        <div style="background:#fff;border-radius:14px;max-width:480px;width:100%;padding:24px;box-shadow:0 20px 50px rgba(0,0,0,.18);">
            <h2 style="margin:0 0 6px;font-size:18px;">Refer ${esc(appointment.patientName)}</h2>
            <p style="margin:0 0 16px;font-size:13px;color:#6B7280;">
                Books a follow-up with another doctor. That consult is billed on the same pending invoice when it is completed.
            </p>
            <div class="field" style="margin-bottom:12px;">
                <label for="referDept">Department</label>
                <select id="referDept"></select>
            </div>
            <div class="field" style="margin-bottom:12px;">
                <label for="referDoctor">Doctor</label>
                <select id="referDoctor"><option value="">Loading…</option></select>
            </div>
            <div class="field-grid" style="margin-bottom:12px;">
                <div class="field">
                    <label for="referDate">Date</label>
                    <input id="referDate" type="date">
                </div>
                <div class="field">
                    <label for="referTime">Time</label>
                    <input id="referTime" type="time" value="10:00">
                </div>
            </div>
            <p id="referFeeHint" class="muted" style="margin:0 0 12px;"></p>
            ${canComplete ? `
            <label style="display:flex;gap:8px;align-items:center;font-size:13px;margin-bottom:16px;">
                <input id="referComplete" type="checkbox" checked>
                Also mark this consultation complete
            </label>` : ''}
            <div class="btn-row" style="justify-content:flex-end;">
                <button type="button" class="btn" id="referCancel">Cancel</button>
                <button type="button" class="btn primary" id="referSubmit">Create referral</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('referCancel').onclick = closeReferDialog;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('referDate').value = tomorrow.toISOString().slice(0, 10);

    let doctors = [];

    document.getElementById('referDept').addEventListener('change', () => fillDoctorSelect(doctors));
    document.getElementById('referDoctor').addEventListener('change', () => showFee(doctors));
    document.getElementById('referSubmit').onclick = () => submitReferral(appointment, doctors);

    window.NexCareAPI.Appointments.getReferralDoctors().then(res => {
        doctors = res.success ? (res.data || []) : [];
        const depts = [...new Set(doctors.map(d => d.dept).filter(Boolean))].sort();
        const deptSel = document.getElementById('referDept');
        deptSel.innerHTML = `<option value="">All departments</option>` +
            depts.map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join('');
        fillDoctorSelect(doctors);
    }).catch(() => {
        const sel = document.getElementById('referDoctor');
        if (sel) sel.innerHTML = '<option value="">Could not load doctors</option>';
    });
}

function closeReferDialog() {
    const el = document.getElementById('referOverlay');
    if (el) el.remove();
}

function fillDoctorSelect(doctors) {
    const dept = document.getElementById('referDept')?.value || '';
    const rows = doctors.filter(d => !dept || d.dept === dept);
    const sel = document.getElementById('referDoctor');
    if (!sel) return;
    if (!rows.length) {
        sel.innerHTML = '<option value="">No doctors in that department</option>';
        showFee([]);
        return;
    }
    sel.innerHTML = rows.map(d =>
        `<option value="${esc(d.id)}">${esc(d.name)}${d.dept ? ` — ${esc(d.dept)}` : ''}</option>`
    ).join('');
    showFee(doctors);
}

function showFee(doctors) {
    const id = document.getElementById('referDoctor')?.value;
    const doc = doctors.find(d => d.id === id);
    const hint = document.getElementById('referFeeHint');
    if (!hint) return;
    hint.textContent = doc
        ? `Follow-up consultation fee: ${money(doc.consultationFee)} (added to the pending bill when that visit is completed)`
        : '';
}

function toDateLabel(isoDate) {
    const [y, m, d] = isoDate.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
        month: 'long', day: '2-digit', year: 'numeric',
    });
}

function toTimeLabel(hhmm) {
    const [h, min] = hhmm.split(':').map(Number);
    const d = new Date();
    d.setHours(h, min || 0, 0, 0);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

async function submitReferral(appointment, doctors) {
    const doctorId = document.getElementById('referDoctor')?.value;
    const dateVal = document.getElementById('referDate')?.value;
    const timeVal = document.getElementById('referTime')?.value;
    if (!doctorId) {
        notify('Choose a doctor to refer to', 'error');
        return;
    }
    if (!dateVal || !timeVal) {
        notify('Choose a date and time for the follow-up', 'error');
        return;
    }

    const doc = doctors.find(d => d.id === doctorId);
    const completeBox = document.getElementById('referComplete');
    const submit = document.getElementById('referSubmit');
    if (submit) submit.disabled = true;

    try {
        const res = await window.NexCareAPI.Appointments.refer(appointment.id, {
            doctorId,
            department: document.getElementById('referDept')?.value || doc?.dept,
            dateLabel: toDateLabel(dateVal),
            timeLabel: toTimeLabel(timeVal),
            fee: doc?.consultationFee,
            completeCurrent: completeBox ? completeBox.checked : false,
        });
        if (!res.success) {
            notify(res.message || 'Could not create the referral', 'error');
            if (submit) submit.disabled = false;
            return;
        }
        closeReferDialog();
        notify('Referral booked', 'success');
        if (typeof load === 'function') await load();
        if (typeof loadPractice === 'function') await loadPractice();
        if (typeof loadEarnings === 'function') await loadEarnings();
    } catch (err) {
        console.error(err);
        notify('Could not create the referral', 'error');
        if (submit) submit.disabled = false;
    }
}
