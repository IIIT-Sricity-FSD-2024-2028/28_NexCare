// Patient — Care+ membership.
//
// NexCare charges patients in two ways: a per-booking convenience fee, and an
// optional membership that waives it. This page has to be honest about which
// one is cheaper for THIS patient, so it shows the fees waived against the
// membership paid rather than only the marketing copy.

let plans = [];
let membership = null;
let fees = null;

document.addEventListener('DOMContentLoaded', async () => {
    fillPatientHeader();
    await load();
});

async function load() {
    try {
        const [planRes, meRes] = await Promise.all([
            window.NexCareAPI.Revenue.getPatientPlans(),
            window.NexCareAPI.Revenue.getMyMembership(),
        ]);

        if (!planRes.success) throw new Error(planRes.message);
        plans = planRes.data || [];
        membership = meRes.success ? meRes.data : null;

        renderStatus();
        renderPlans();
        renderFees();
    } catch (err) {
        console.error('Membership load failed:', err);
        document.getElementById('membershipStatus').innerHTML =
            '<p style="color:#DC2626;">Could not load your membership. Check that the backend is running.</p>';
        document.getElementById('planGrid').innerHTML = '';
        document.getElementById('feeList').innerHTML = '';
    }
}

function renderStatus() {
    const box = document.getElementById('membershipStatus');
    if (!membership) {
        box.innerHTML = '<h2>Your membership</h2><p style="color:#6A7282;">You are on pay as you go.</p>';
        return;
    }

    const m = membership;
    const worthIt = m.netBenefit >= 0;
    const verdict = m.monthlyFee === 0
        ? 'You pay the booking fee on each appointment. A membership would waive it.'
        : worthIt
            ? `Your membership has saved you ${money(m.netBenefit)} more than it cost.`
            : `Your membership has cost ${money(Math.abs(m.netBenefit))} more than it has saved so far — at your booking rate, pay as you go may be cheaper.`;

    box.innerHTML = `
        <h2>Your membership</h2>
        <p style="color:#6A7282;font-size:13px;margin:6px 0 0;">
            <strong style="color:#101828;font-size:15px;">${esc(m.planName)}</strong>
            ${m.renewsOn ? ` · renews ${esc(formatDate(m.renewsOn))}` : ''}
        </p>
        <div class="m-stat-grid">
            <div class="m-stat"><p class="label">Bookings made</p><p class="value">${m.bookingsMade}</p></div>
            <div class="m-stat"><p class="label">Booking fees waived</p><p class="value">${money(m.bookingFeesWaived)}</p></div>
            <div class="m-stat"><p class="label">Membership paid</p><p class="value">${money(m.membershipPaid)}</p></div>
            <div class="m-stat">
                <p class="label">Net benefit</p>
                <p class="value" style="color:${worthIt ? '#047857' : '#B91C1C'};">${money(m.netBenefit)}</p>
            </div>
        </div>
        <p style="color:#6A7282;font-size:13px;margin:14px 0 0;">${esc(verdict)}</p>
    `;
}

function renderPlans() {
    const grid = document.getElementById('planGrid');
    if (!plans.length) {
        grid.innerHTML = '<p style="color:#6A7282;">No plans available.</p>';
        return;
    }

    const currentId = membership ? membership.planId : 'CARE-PAYG';

    grid.innerHTML = plans.map(p => {
        const current = p.id === currentId;
        const isFree = p.monthlyFee === 0;
        return `
        <div class="m-card ${current ? 'current' : ''}">
            ${current ? '<span class="m-badge">Current plan</span>' : ''}
            <h3>${esc(p.name)}</h3>
            <div class="tag">${esc(p.tagline || '')}</div>
            <div class="price">${money(p.monthlyFee)}<small>${isFree ? '' : ' / month'}</small></div>
            <div class="tag">${p.coversMembers > 1 ? `Covers up to ${p.coversMembers} people` : 'Individual'}</div>
            <ul>${(p.features || []).map(f => `<li>${esc(f)}</li>`).join('')}</ul>
            <div class="cta">
                ${current
                    ? '<button class="m-btn" disabled>Your current plan</button>'
                    : `<button class="m-btn ${isFree ? 'secondary' : ''}" onclick="choosePlan('${esc(p.id)}','${esc(p.name)}')">
                           ${isFree ? 'Cancel membership' : `Switch to ${esc(p.name)}`}
                       </button>`}
            </div>
        </div>`;
    }).join('');
}

function renderFees() {
    // The per-booking fee is the number the membership is measured against, and
    // it comes back on the membership payload rather than the plan list.
    const perBooking = membership && membership.bookingsMade > 0 && membership.bookingFeesWaived > 0
        ? membership.bookingFeesWaived / membership.bookingsMade
        : null;

    const plusPlan = plans.find(p => p.waivesBookingFee) || null;
    const rows = [
        ['Booking convenience fee', perBooking !== null
            ? `${money(perBooking)} per appointment`
            : 'charged per appointment'],
        ['Ambulance dispatch fee', plusPlan
            ? `discounted ${percent(plusPlan.ambulanceDiscount, 0)} on ${plusPlan.name}`
            : 'charged per completed trip'],
        ['Queue position', plusPlan && plusPlan.priorityQueue
            ? `priority on ${plusPlan.name}`
            : 'standard'],
    ];

    document.getElementById('feeList').innerHTML = rows.map(([label, value]) => `
        <div class="fee-row"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>
    `).join('') + `
        <p style="color:#6A7282;font-size:12px;margin-top:14px;">
            Your hospital bills are separate — those are the hospital's charges, not NexCare's.
            See <a href="billing.html">Billing &amp; Payments</a>.
        </p>`;
}

async function choosePlan(planId, planName) {
    const cancelling = planId === 'CARE-PAYG';
    const question = cancelling
        ? 'Cancel your membership and go back to pay as you go?'
        : `Switch to ${planName}?`;
    if (!confirm(question)) return;

    try {
        const res = await window.NexCareAPI.Revenue.setMyMembership(planId);
        if (!res.success) {
            notify(res.message || 'Could not update your membership', 'error');
            return;
        }
        notify(res.message || 'Membership updated', 'success');
        await load();
    } catch (err) {
        console.error(err);
        notify('Could not update your membership', 'error');
    }
}

/** The patient portal's header is its own markup, not the shared portal one. */
function fillPatientHeader() {
    const user = currentUser();
    if (!user) return;
    const name = document.getElementById('header-name');
    const id = document.getElementById('header-id');
    const avatar = document.getElementById('header-avatar');
    if (name) name.textContent = user.name || 'Patient';
    if (id) id.textContent = user.patientId || user.id || '';
    if (avatar) avatar.textContent = initials(user.name);
}

function formatDate(value) {
    const d = new Date(value);
    return isNaN(d.getTime())
        ? value
        : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
