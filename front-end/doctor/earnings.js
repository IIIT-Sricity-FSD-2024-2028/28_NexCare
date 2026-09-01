// Doctor — consultation revenue statement.
//
// NexCare charges a doctor nothing. Doctors are hospital staff, and the
// hospital's staff-count subscription already covers their seat, so there is no
// listing tier to choose and no commission to deduct. This page shows the
// doctor what their completed consultations were worth, and lets them set the
// fee a patient is quoted when booking.

let earnings = null;

document.addEventListener('DOMContentLoaded', async () => {
    fillHeader('Doctor');
    document.getElementById('saveFeeBtn').addEventListener('click', saveFee);
    await load();
});

async function load() {
    try {
        const earnRes = await window.NexCareAPI.Revenue.getMyDoctorEarnings();
        if (!earnRes.success) throw new Error(earnRes.message);

        earnings = earnRes.data;

        renderKpis();
        renderTrend();
        document.getElementById('feeInput').value = earnings.consultationFee;
    } catch (err) {
        console.error('Earnings load failed:', err);
        setHTML('trendBody', '<p class="empty" style="color:#B91C1C;">Could not load your earnings. Check that the backend is running.</p>');
    }
}

function renderKpis() {
    const e = earnings;
    setText('kpiGross', money(e.grossEarnings));
    setText('kpiGrossSub', `${e.appointmentsCompleted} completed of ${e.appointmentsBooked} booked`);
    setText('kpiCompleted', e.appointmentsCompleted);
    setText('kpiCompletedSub', `${e.appointmentsCancelled} cancelled`);
    setText('kpiFee', money(e.consultationFee));
    setText('kpiDeducted', money(0));
}

function renderTrend() {
    const months = earnings.byMonth || [];
    const peak = Math.max(1, ...months.map(m => Math.abs(m.gross)));

    setHTML('trendBody', months.map(m => `
        <div class="bar-row">
            <span class="name">${esc(m.month)}</span>
            <div class="bar-track">
                <div class="bar-fill" style="width:${(Math.abs(m.gross) / peak) * 100}%"></div>
            </div>
            <span class="amt">${money(m.gross)}</span>
        </div>
        <div class="muted" style="margin:-4px 0 12px 202px;">
            ${m.completed} consultation${m.completed === 1 ? '' : 's'}
        </div>
    `).join('') || '<p class="empty">No consultations yet.</p>');
}

async function saveFee() {
    const consultationFee = Number(document.getElementById('feeInput').value);
    if (!Number.isFinite(consultationFee) || consultationFee < 0) {
        notify('Enter a valid consultation fee', 'error');
        return;
    }
    try {
        const res = await window.NexCareAPI.Revenue.updateMyConsultationFee(consultationFee);
        if (!res.success) {
            notify(res.message || 'Could not save your fee', 'error');
            return;
        }
        notify('Consultation fee updated', 'success');
        await load();
    } catch (err) {
        console.error(err);
        notify('Could not save your fee', 'error');
    }
}
