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
            <td><strong>${esc(a.patientName)}</strong><br><span class="muted">${esc(a.patientId)}</span></td>
            <td>${esc(a.department)}</td>
            <td class="muted">${esc(a.reason || '—')}</td>
            <td><span class="pill ${esc(a.status)}">${esc(a.status)}</span></td>
            <td class="num">${money(a.fee)}</td>
            <td class="num">${actionsFor(a)}</td>
        </tr>
    `).join(''));
}

function actionsFor(a) {
    if (a.status === 'Pending') {
        return `<button class="btn primary" onclick="act('${esc(a.id)}','confirm')">Confirm</button>`;
    }
    if (a.status === 'Confirmed') {
        return `<button class="btn" onclick="act('${esc(a.id)}','complete')">Complete</button>`;
    }
    return '<span class="muted">—</span>';
}

/**
 * Confirm and complete are the only two actions a doctor has here. Cancelling
 * is the patient's or the front desk's call, so it is deliberately absent.
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
