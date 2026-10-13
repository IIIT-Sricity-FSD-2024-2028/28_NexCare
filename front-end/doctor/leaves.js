// Doctor — leave requests.
//
// A doctor files their own request; approving it is the hospital manager's
// call (LeaveRequestGuard returns 403 for anyone else). An approved leave stops
// the booking wizard offering those dates, which is why the reason and dates
// matter rather than being free text nobody reads.

let myLeaves = [];

document.addEventListener('DOMContentLoaded', async () => {
    fillHeader('Doctor');
    document.getElementById('submitLeaveBtn').addEventListener('click', submitLeave);

    // Leave is forward-looking — block picking a date that has already passed.
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById('startDate').min = today;
    document.getElementById('endDate').min = today;

    await load();
});

async function load() {
    const user = currentUser();
    if (!user) return;
    try {
        const res = await window.NexCareAPI.Leaves.getAll({ doctorId: user.id });
        if (!res.success) throw new Error(res.message);
        myLeaves = (res.data || []).sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)));
        render();
    } catch (err) {
        console.error('Leave load failed:', err);
        setHTML('leaveBody', `<tr><td colspan="6" class="empty" style="color:#B91C1C;">
            Could not load your leave requests. Check that the backend is running.</td></tr>`);
    }
}

function render() {
    setText('leaveCount', `${myLeaves.length} request${myLeaves.length === 1 ? '' : 's'}`);
    if (!myLeaves.length) {
        setHTML('leaveBody', '<tr><td colspan="6" class="empty">No leave requested yet.</td></tr>');
        return;
    }

    setHTML('leaveBody', myLeaves.map(l => `
        <tr>
            <td>${esc(formatDate(l.startDate))}</td>
            <td>${esc(formatDate(l.endDate))}</td>
            <td class="muted">${esc(l.reason || '—')}</td>
            <td><span class="pill ${esc(String(l.status).toLowerCase())}">${esc(l.status)}</span></td>
            <td class="muted">${esc(l.approvedBy || '—')}</td>
            <td class="num">${
                String(l.status).toLowerCase() === 'pending'
                    ? `<button class="btn danger" onclick="withdraw('${esc(l.id)}')">Withdraw</button>`
                    : '<span class="muted">—</span>'
            }</td>
        </tr>
    `).join(''));
}

async function submitLeave() {
    const user = currentUser();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const reason = document.getElementById('reason').value.trim();

    if (!startDate || !endDate) {
        notify('Pick both a start and an end date', 'error');
        return;
    }
    if (endDate < startDate) {
        notify('The end date cannot be before the start date', 'error');
        return;
    }
    if (!reason) {
        notify('Give a reason — your manager approves against it', 'error');
        return;
    }

    try {
        const res = await window.NexCareAPI.Leaves.create({
            doctorId: user.id,
            doctorName: user.name,
            hospitalId: user.hospitalId || '',
            startDate, endDate, reason,
        });
        if (!res.success) {
            notify(res.message || 'Could not submit the request', 'error');
            return;
        }
        notify('Leave request submitted — your manager will review it', 'success');
        document.getElementById('reason').value = '';
        await load();
    } catch (err) {
        // The guard returns 409 when an approved leave already covers these dates.
        console.error(err);
        notify(err.message || 'Could not submit the request', 'error');
    }
}

async function withdraw(id) {
    if (!confirm('Withdraw this leave request?')) return;
    try {
        const res = await window.NexCareAPI.Leaves.delete(id);
        if (!res.success) {
            notify(res.message || 'Could not withdraw the request', 'error');
            return;
        }
        notify('Leave request withdrawn', 'success');
        await load();
    } catch (err) {
        console.error(err);
        notify('Could not withdraw the request', 'error');
    }
}

function formatDate(value) {
    const d = new Date(value);
    return isNaN(d.getTime())
        ? value
        : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
