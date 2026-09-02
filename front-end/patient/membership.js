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

let selectedPlan = null;
let activePayMethod = 'upi';
let selectedUpiApp = 'Google Pay';

function choosePlan(planId, planName) {
    const targetPlan = plans.find(p => p.id === planId);
    if (!targetPlan) return;

    if (planId === 'CARE-PAYG') {
        openCancelModal();
        return;
    }

    selectedPlan = targetPlan;
    openPaymentModal(targetPlan);
}

function openPaymentModal(plan) {
    const modal = document.getElementById('paymentModal');
    if (!modal) return;

    document.getElementById('modalPlanTitle').textContent = `Join ${plan.name}`;
    document.getElementById('summaryPlanName').textContent = plan.name;
    document.getElementById('summaryTotalPayable').textContent = money(plan.monthlyFee);
    document.getElementById('btnPayAmount').textContent = money(plan.monthlyFee);
    
    const ambDisc = plan.id === 'CARE-FAMILY' ? '25% off emergency dispatch' : '20% off emergency dispatch';
    document.getElementById('summaryAmbulanceDisc').textContent = ambDisc;

    // Reset steps
    document.getElementById('paymentStep1').style.display = 'block';
    document.getElementById('paymentStep2').style.display = 'none';
    document.getElementById('paymentStep3').style.display = 'none';

    switchPayMethod('upi');
    modal.style.display = 'flex';
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) modal.style.display = 'none';
}

function handleModalBackdropClick(e) {
    if (e.target.id === 'paymentModal') {
        closePaymentModal();
    }
}

function switchPayMethod(method) {
    activePayMethod = method;
    const tabs = document.querySelectorAll('.method-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    const panels = {
        upi: document.getElementById('methodUpi'),
        card: document.getElementById('methodCard'),
        netbanking: document.getElementById('methodNetbanking'),
    };

    Object.keys(panels).forEach(k => {
        if (panels[k]) panels[k].style.display = k === method ? 'block' : 'none';
    });

    const activeTab = Array.from(tabs).find(t => t.textContent.toLowerCase().includes(method));
    if (activeTab) activeTab.classList.add('active');
}

function selectUpiApp(el, appName) {
    selectedUpiApp = appName;
    document.querySelectorAll('.upi-app-card').forEach(c => c.classList.remove('selected'));
    if (el) el.classList.add('selected');
}

async function processPayment() {
    if (!selectedPlan) return;

    let methodDetails = '';
    if (activePayMethod === 'upi') {
        const upiId = document.getElementById('upiIdInput')?.value.trim() || 'patient@okhdfcbank';
        methodDetails = `UPI (${selectedUpiApp} / ${upiId})`;
    } else if (activePayMethod === 'card') {
        const cardNum = document.getElementById('cardNumberInput')?.value.trim() || '4242 4242 4242 4242';
        const last4 = cardNum.replace(/\s+/g, '').slice(-4) || '4242';
        methodDetails = `Card (•••• ${last4})`;
    } else if (activePayMethod === 'netbanking') {
        const bank = document.getElementById('netBankSelect')?.value || 'HDFC Bank';
        methodDetails = `Net Banking (${bank})`;
    }

    const txnId = `TXN-MEM-${Math.floor(100000 + Math.random() * 900000)}`;
    const step1 = document.getElementById('paymentStep1');
    const step2 = document.getElementById('paymentStep2');
    const step3 = document.getElementById('paymentStep3');
    const subtext = document.getElementById('processingSubtext');

    step1.style.display = 'none';
    step2.style.display = 'block';

    setTimeout(async () => {
        if (subtext) subtext.textContent = 'Verifying with payment network & activating benefits...';
        
        try {
            const res = await window.NexCareAPI.Revenue.setMyMembership(selectedPlan.id, {
                method: methodDetails,
                transactionId: txnId,
                amount: selectedPlan.monthlyFee,
            });

            if (!res.success) {
                step2.style.display = 'none';
                step1.style.display = 'block';
                showNotification(res.message || 'Payment simulation could not complete', 'error');
                return;
            }

            // Populate success step
            document.getElementById('successPlanMsg').innerHTML = `You are now subscribed to <strong>${esc(selectedPlan.name)}</strong>.`;
            document.getElementById('successTxnId').textContent = txnId;
            document.getElementById('successAmountPaid').textContent = money(selectedPlan.monthlyFee);
            
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            document.getElementById('successRenewsOn').textContent = formatDate(nextMonth.toISOString());

            step2.style.display = 'none';
            step3.style.display = 'block';
        } catch (err) {
            console.error('Payment processing failed:', err);
            step2.style.display = 'none';
            step1.style.display = 'block';
            showNotification('Payment processing failed. Please try again.', 'error');
        }
    }, 1200);
}

async function finishPaymentSuccess() {
    closePaymentModal();
    showNotification('Care+ Membership successfully activated!', 'success');
    await load();
}

function openCancelModal() {
    const modal = document.getElementById('cancelModal');
    if (modal) modal.style.display = 'flex';
}

function closeCancelModal() {
    const modal = document.getElementById('cancelModal');
    if (modal) modal.style.display = 'none';
}

function handleCancelBackdropClick(e) {
    if (e.target.id === 'cancelModal') {
        closeCancelModal();
    }
}

async function confirmCancelMembership() {
    closeCancelModal();
    try {
        const res = await window.NexCareAPI.Revenue.setMyMembership('CARE-PAYG');
        if (!res.success) {
            showNotification(res.message || 'Could not cancel membership', 'error');
            return;
        }
        showNotification('Membership cancelled. You are now on Pay As You Go.', 'info');
        await load();
    } catch (err) {
        console.error('Cancel membership failed:', err);
        showNotification('Could not cancel membership', 'error');
    }
}

function showNotification(msg, type = 'info') {
    if (window.NexCareUI && typeof window.NexCareUI.showToast === 'function') {
        window.NexCareUI.showToast(msg, type);
        return;
    }
    // Fallback toast without blocking window alert
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.background = type === 'error' ? '#DC2626' : type === 'success' ? '#059669' : '#1E293B';
    toast.style.color = '#fff';
    toast.style.fontSize = '14px';
    toast.style.fontWeight = '600';
    toast.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.2)';
    toast.style.zIndex = '100000';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
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
