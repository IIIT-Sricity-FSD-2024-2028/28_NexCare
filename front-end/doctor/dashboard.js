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

/** Net earnings is the number a doctor actually cares about, so it sits here too. */
async function loadEarnings() {
    try {
        const res = await window.NexCareAPI.Revenue.getMyDoctorEarnings();
        if (!res.success) return;
        const e = res.data;
        setText('kpiNet', money(e.netEarnings));
        setText('kpiNetSub', `${money(e.grossEarnings)} gross · ${e.planName}`);
    } catch (err) {
        console.error('Earnings load failed:', err);
    }
}

function renderToday(all) {
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
    if (a.status === 'Pending') {
        return `<button class="btn primary" onclick="confirmAppointment('${esc(a.id)}')">Confirm</button>`;
    }
    if (a.status === 'Confirmed') {
        return `<button class="btn" onclick="completeAppointment('${esc(a.id)}')">Mark complete</button>`;
    }
    return '<span class="muted">—</span>';
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
