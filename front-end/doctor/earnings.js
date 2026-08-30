// Doctor — earnings statement and listing tier.
//
// The tier ladder is inverted on purpose: the free tier has the highest
// commission. This page's job is to make that legible, so it shows what each
// tier would actually cost at the doctor's own volume rather than just listing
// prices.

let earnings = null;
let plans = [];

document.addEventListener('DOMContentLoaded', async () => {
    fillHeader('Doctor');
    document.getElementById('saveFeeBtn').addEventListener('click', saveFee);
    await load();
});

async function load() {
    try {
        const [earnRes, planRes] = await Promise.all([
            window.NexCareAPI.Revenue.getMyDoctorEarnings(),
            window.NexCareAPI.Revenue.getDoctorPlans(),
        ]);
        if (!earnRes.success) throw new Error(earnRes.message);

        earnings = earnRes.data;
        plans = planRes.success ? (planRes.data || []) : [];

        renderKpis();
        renderRecommendation();
        renderTrend();
        renderPlans();
        document.getElementById('feeInput').value = earnings.consultationFee;
    } catch (err) {
        console.error('Earnings load failed:', err);
        setHTML('trendBody', '<p class="empty" style="color:#B91C1C;">Could not load your earnings. Check that the backend is running.</p>');
        setHTML('planGrid', '');
    }
}

function renderKpis() {
    const e = earnings;
    setText('kpiGross', money(e.grossEarnings));
    setText('kpiGrossSub', `${e.appointmentsCompleted} completed of ${e.appointmentsBooked} booked`);
    setText('kpiCommission', '−' + money(e.platformCommission));
    setText('kpiCommissionSub', `${percent(e.commissionRate)} of each consultation`);
    setText('kpiListing', e.platformListingFee ? '−' + money(e.platformListingFee) : money(0));
    setText('kpiListingSub', `${e.planName} · per month`);
    setText('kpiNet', money(e.netEarnings));
}

/**
 * The backend works out whether another tier is cheaper at this volume. Showing
 * it is the honest thing to do — a doctor paying ₹2,499 for four consultations
 * should be told, not left to notice.
 */
function renderRecommendation() {
    const box = document.getElementById('recommendation');
    if (!earnings.recommendedPlanId) {
        box.innerHTML = `<div class="note">
            <strong>You are on the right tier.</strong> At your current volume no other listing
            plan would cost you less.
        </div>`;
        return;
    }
    const plan = plans.find(p => p.id === earnings.recommendedPlanId);
    box.innerHTML = `<div class="note warn">
        <strong>${esc(plan ? plan.name : earnings.recommendedPlanId)} would suit you better.</strong>
        ${esc(earnings.recommendationReason || '')}
        <button class="btn" style="margin-left:10px;" onclick="switchPlan('${esc(earnings.recommendedPlanId)}')">
            Switch tier
        </button>
    </div>`;
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
            <span class="amt ${m.net < 0 ? '' : ''}" style="color:${m.net < 0 ? '#B91C1C' : '#15803D'};">
                ${money(m.net)} net
            </span>
        </div>
        <div class="muted" style="margin:-4px 0 12px 202px;">
            ${m.completed} consultation${m.completed === 1 ? '' : 's'}
        </div>
    `).join('') || '<p class="empty">No consultations yet.</p>');
}

function renderPlans() {
    if (!plans.length) {
        setHTML('planGrid', '<p class="empty">No listing tiers configured.</p>');
        return;
    }

    // Cost at this doctor's actual volume, so the tiers can be compared like for like.
    const gross = earnings.grossEarnings;
    const costOf = p => gross * p.commissionRate + p.monthlyFee;
    const cheapest = Math.min(...plans.map(costOf));

    setHTML('planGrid', plans.map(p => {
        const current = p.id === earnings.planId;
        const cost = costOf(p);
        return `
        <div class="plan-card ${current ? 'current' : ''}">
            ${current ? '<span class="pill active badge">Your tier</span>' : ''}
            <h3>${esc(p.name)}</h3>
            <div class="muted">${esc(p.tagline || '')}</div>
            <div class="price">${money(p.monthlyFee)}<span style="font-size:13px;color:#6B7280;font-weight:500;">/month</span></div>
            <div class="muted">${percent(p.commissionRate, 0)} commission per completed consultation</div>
            <ul>${(p.features || []).map(f => `<li>${esc(f)}</li>`).join('')}</ul>
            <div class="cost">
                At your volume this tier costs
                <strong style="color:${cost === cheapest ? '#15803D' : '#111827'};">${money(cost)}</strong>
                per cycle${cost === cheapest ? ' — the cheapest for you' : ''}.
            </div>
            <div style="margin-top:12px;">
                ${current
                    ? '<button class="btn" disabled>Current tier</button>'
                    : `<button class="btn primary" onclick="switchPlan('${esc(p.id)}')">Switch to ${esc(p.name)}</button>`}
            </div>
        </div>`;
    }).join(''));
}

async function switchPlan(planId) {
    try {
        const res = await window.NexCareAPI.Revenue.updateMyDoctorSubscription({ planId });
        if (!res.success) {
            notify(res.message || 'Could not change your tier', 'error');
            return;
        }
        notify('Listing tier updated', 'success');
        await load();
    } catch (err) {
        console.error(err);
        notify('Could not change your tier', 'error');
    }
}

async function saveFee() {
    const consultationFee = Number(document.getElementById('feeInput').value);
    if (!Number.isFinite(consultationFee) || consultationFee < 0) {
        notify('Enter a valid consultation fee', 'error');
        return;
    }
    try {
        const res = await window.NexCareAPI.Revenue.updateMyDoctorSubscription({ consultationFee });
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
