// Superuser — NexCare's own revenue model.
//
// The platform has three payers and eight streams. Hospitals buy the platform,
// doctors buy visibility, patients buy convenience. A hospital's own patient
// billing is its revenue, not ours, and is shown in that hospital's manager
// portal instead.
//
// One load() fetches everything and each tab renders from that snapshot, so the
// totals on "All streams" and the per-payer tabs are guaranteed to agree.

let overview = null;
let streams = null;
let doctorPlans = [];
let doctorSubs = [];
let patientPlans = [];
let patientSubs = [];
let fees = null;
let regions = null;

document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userNameDisplay').textContent = user.name || 'Super User';
    }
    wireTabs();
    document.getElementById('saveFeesBtn').addEventListener('click', saveFees);
    await load();
});

function wireTabs() {
    document.getElementById('revenueTabs').addEventListener('click', event => {
        const btn = event.target.closest('.tab-btn');
        if (!btn) return;
        document.querySelectorAll('#revenueTabs .tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-section').forEach(sec => sec.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
}

async function load() {
    const R = window.NexCareAPI.Revenue;
    try {
        const [overviewRes, trendRes, streamRes,
               docPlanRes, docSubRes, patPlanRes, patSubRes, feeRes, regionRes] = await Promise.all([
            R.getPlatformOverview(),
            R.getPlatformTrend(6),
            R.getPlatformStreams(),
            R.getDoctorPlans(),
            R.getDoctorSubscriptions(),
            R.getPatientPlans(),
            R.getPatientSubscriptions(),
            R.getFees(),
            R.getRegionalOfficerOverview(),
        ]);

        if (!overviewRes.success) {
            throw new Error(overviewRes.message || 'Failed to load revenue');
        }

        overview = overviewRes.data;
        streams = streamRes.success ? streamRes.data : null;
        doctorPlans = docPlanRes.success ? (docPlanRes.data || []) : [];
        doctorSubs = docSubRes.success ? (docSubRes.data || []) : [];
        patientPlans = patPlanRes.success ? (patPlanRes.data || []) : [];
        patientSubs = patSubRes.success ? (patSubRes.data || []) : [];
        fees = feeRes.success ? feeRes.data : null;
        regions = regionRes.success ? regionRes.data : null;

        renderKpis(overview);
        renderHospitals(overview);
        renderTrend(trendRes.success ? (trendRes.data || []) : []);

        renderStreams();
        renderDoctors();
        renderPatients();
        renderFees();
        renderRegions();
    } catch (err) {
        console.error('Revenue load failed:', err);
        document.getElementById('hospitalTableBody').innerHTML =
            `<tr><td colspan="7" style="text-align:center;padding:24px;color:#DC2626;">
                Could not load revenue data. Check that the backend is running.</td></tr>`;
        document.getElementById('streamBody').innerHTML =
            `<tr><td colspan="6" class="empty" style="color:#DC2626;">
                Could not load revenue data. Check that the backend is running.</td></tr>`;
    }
}

// ── All streams ─────────────────────────────────────────────────────────────

function renderStreams() {
    if (!streams) return;
    const s = streams;
    const u = s.unitEconomics || {};

    setText('sTotal', money(s.totalRevenue));
    setText('sTotalSub', `${(s.byStream || []).length} streams, 3 payers`);
    setText('sRecurring', money(s.recurringRevenue));
    setText('sRecurringSub', `${u.recurringShare ?? 0}% of total — the stickiness number`);
    setText('sUsage', money(s.usageRevenue));
    setText('sArpHospital', money(u.revenuePerHospital));
    setText('sHospitalCount', `across ${u.hospitals ?? 0} hospitals`);
    setText('sArpDoctor', money(u.revenuePerDoctor));
    setText('sDoctorCount', `across ${u.doctors ?? 0} doctors`);
    setText('sArpPatient', money(u.revenuePerPatient));
    setText('sPatientCount', `across ${u.patients ?? 0} patients`);

    document.getElementById('streamBody').innerHTML = (s.byStream || []).map(line => `
        <tr>
            <td>
                <strong>${esc(line.label)}</strong><br>
                <span class="muted">${esc(line.basis)}</span>
            </td>
            <td><span class="pill ${line.payer === 'hospital' ? 'confirmed' : (line.payer === 'doctor' ? 'pending' : 'active')}">${esc(line.payer)}</span></td>
            <td class="muted">${esc(line.type)}</td>
            <td class="num">${line.units.toLocaleString('en-IN')}<br><span class="muted">${esc(line.unitLabel)}</span></td>
            <td class="num" style="font-weight:700;">${money(line.amount)}</td>
            <td class="num">${line.share}%</td>
        </tr>
    `).join('') || '<tr><td colspan="6" class="empty">No revenue in this period.</td></tr>';

    const peak = Math.max(1, ...(s.byPayer || []).map(p => p.amount));
    document.getElementById('payerBody').innerHTML = (s.byPayer || []).map(p => `
        <div class="bar-row">
            <span class="name" style="text-transform:capitalize;">${esc(p.payer)}s</span>
            <div class="bar-track"><div class="bar-fill ${p.payer === 'hospital' ? '' : esc(p.payer)}" style="width:${(p.amount / peak) * 100}%"></div></div>
            <span class="amt">${money(p.amount)}</span>
            <span class="amt">${p.share}%</span>
        </div>
    `).join('');
}

/** Find one stream's figures by its stable machine key. */
function stream(key) {
    return ((streams && streams.byStream) || []).find(s => s.key === key) ||
           { amount: 0, units: 0, unitLabel: '' };
}

// ── Doctors ─────────────────────────────────────────────────────────────────

function renderDoctors() {
    const listing = stream('doctor_subscription');
    const commission = stream('doctor_commission');

    setText('dTotal', money(listing.amount + commission.amount));
    setText('dRecurring', money(listing.amount));
    setText('dRecurringSub', `${listing.units} ${listing.unitLabel}`);
    setText('dCommission', money(commission.amount));
    setText('dCommissionSub', `${commission.units} ${commission.unitLabel}`);

    document.getElementById('doctorPlanGrid').innerHTML = doctorPlans.map(p => {
        const onPlan = doctorSubs.filter(s => s.planId === p.id).length;
        return `
        <div class="plan-card">
            <h3>${esc(p.name)}</h3>
            <div class="muted">${esc(p.tagline || '')}</div>
            <div class="price">₹<input type="number" min="0" step="100" id="dfee-${esc(p.id)}" value="${p.monthlyFee}"
                 style="width:110px;font-size:22px;font-weight:700;color:#2563EB;border:1px solid #E5E7EB;border-radius:8px;padding:2px 8px;">
                 <span style="font-size:13px;color:#6B7280;font-weight:500;">/month</span></div>
            <div class="muted">${(p.commissionRate * 100).toFixed(0)}% commission ·
                ${p.monthlyBookingCap ? `${p.monthlyBookingCap} bookings/month` : 'unlimited bookings'}</div>
            <ul>${(p.features || []).map(f => `<li>${esc(f)}</li>`).join('')}</ul>
            <div class="meta">${onPlan} doctor${onPlan === 1 ? '' : 's'} on this tier</div>
            <button class="btn primary" style="margin-top:12px;" onclick="saveDoctorPlanFee('${esc(p.id)}')">Save</button>
        </div>`;
    }).join('') || '<p class="muted">No listing tiers configured.</p>';

    setText('doctorCount', `${doctorSubs.length} enrolled`);
    document.getElementById('doctorSubBody').innerHTML = doctorSubs.map(s => `
        <tr>
            <td><strong>${esc(s.doctorName)}</strong><br><span class="muted">${esc(s.doctorId)}</span></td>
            <td class="muted">${esc(s.hospitalId || '—')}</td>
            <td>
                <select class="plan-select" onchange="changeDoctorPlan('${esc(s.doctorId)}', this.value, this)">
                    ${doctorPlans.map(p => `<option value="${esc(p.id)}" ${p.id === s.planId ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
                </select>
            </td>
            <td><span class="pill ${esc(s.status)}">${esc(String(s.status).replace(/_/g, ' '))}</span></td>
            <td class="num">${money(s.consultationFee)}</td>
        </tr>
    `).join('') || '<tr><td colspan="5" class="empty">No doctors enrolled yet.</td></tr>';
}

async function saveDoctorPlanFee(planId) {
    const monthlyFee = Number(document.getElementById(`dfee-${planId}`).value);
    if (!Number.isFinite(monthlyFee) || monthlyFee < 0) {
        notify('Enter a valid monthly fee', 'error');
        return;
    }
    await apply(() => window.NexCareAPI.Revenue.updateDoctorPlan(planId, { monthlyFee }), 'Listing tier repriced');
}

async function changeDoctorPlan(doctorId, planId, selectEl) {
    const previous = (doctorSubs.find(s => s.doctorId === doctorId) || {}).planId;
    if (planId === previous) return;
    const ok = await apply(
        () => window.NexCareAPI.Revenue.updateDoctorSubscription(doctorId, { planId }),
        'Doctor moved to a new tier');
    if (!ok) selectEl.value = previous;
}

// ── Patients ────────────────────────────────────────────────────────────────

function renderPatients() {
    const membership = stream('patient_membership');
    const booking = stream('patient_booking_fee');
    const ambulance = stream('ambulance_dispatch_fee');

    setText('pTotal', money(membership.amount + booking.amount + ambulance.amount));
    setText('pMembership', money(membership.amount));
    setText('pMembershipSub', `${membership.units} ${membership.unitLabel}`);
    setText('pBooking', money(booking.amount));
    setText('pBookingSub', `${booking.units} ${booking.unitLabel}`);
    setText('pAmbulance', money(ambulance.amount));
    setText('pAmbulanceSub', `${ambulance.units} ${ambulance.unitLabel}`);

    document.getElementById('patientPlanGrid').innerHTML = patientPlans.map(p => {
        const onPlan = patientSubs.filter(s => s.planId === p.id && s.status === 'active').length;
        return `
        <div class="plan-card">
            <h3>${esc(p.name)}</h3>
            <div class="muted">${esc(p.tagline || '')}</div>
            <div class="price">₹<input type="number" min="0" step="50" id="pfee-${esc(p.id)}" value="${p.monthlyFee}"
                 style="width:100px;font-size:22px;font-weight:700;color:#2563EB;border:1px solid #E5E7EB;border-radius:8px;padding:2px 8px;">
                 <span style="font-size:13px;color:#6B7280;font-weight:500;">/month</span></div>
            <div class="muted">
                ${p.waivesBookingFee ? 'waives the booking fee' : 'pays the booking fee'} ·
                ${(p.ambulanceDiscount * 100).toFixed(0)}% off ambulance ·
                covers ${p.coversMembers}
            </div>
            <ul>${(p.features || []).map(f => `<li>${esc(f)}</li>`).join('')}</ul>
            <div class="meta">${onPlan} active member${onPlan === 1 ? '' : 's'}</div>
            <button class="btn primary" style="margin-top:12px;" onclick="savePatientPlanFee('${esc(p.id)}')">Save</button>
        </div>`;
    }).join('') || '<p class="muted">No membership tiers configured.</p>';

    const active = patientSubs.filter(s => s.status === 'active');
    setText('memberCount', `${active.length} active`);
    document.getElementById('memberBody').innerHTML = patientSubs.map(s => `
        <tr>
            <td><strong>${esc(s.patientName)}</strong><br><span class="muted">${esc(s.patientId)}</span></td>
            <td>${esc((patientPlans.find(p => p.id === s.planId) || {}).name || s.planId)}</td>
            <td><span class="pill ${esc(s.status)}">${esc(s.status)}</span></td>
            <td class="muted">${esc(shortDate(s.startedAt))}</td>
            <td class="muted">${esc(shortDate(s.renewsOn))}</td>
        </tr>
    `).join('') || '<tr><td colspan="5" class="empty">Nobody has taken a membership yet.</td></tr>';
}

async function savePatientPlanFee(planId) {
    const monthlyFee = Number(document.getElementById(`pfee-${planId}`).value);
    if (!Number.isFinite(monthlyFee) || monthlyFee < 0) {
        notify('Enter a valid monthly fee', 'error');
        return;
    }
    await apply(() => window.NexCareAPI.Revenue.updatePatientPlan(planId, { monthlyFee }), 'Membership tier repriced');
}

// ── Regional officers ───────────────────────────────────────────────────────

function renderRegions() {
    if (!regions) {
        setHTML('regionBody', '<tr><td colspan="10" class="empty">Could not load the regional overview.</td></tr>');
        return;
    }

    const t = regions.totals || {};
    setText('rTotalOfficers', t.officers ?? 0);
    setText('rTotalHospitals', `${t.hospitals ?? 0} hospitals on the platform`);
    setText('rPlatformRevenue', money(t.platformRevenue));
    setText('rCollections', money(t.collections));
    setText('rStaff', t.staff ?? 0);
    setText('rDoctors', `plus ${t.doctors ?? 0} doctors`);

    // Only shown when there is something wrong to look at.
    const unassignedTile = document.getElementById('rUnassignedTile');
    if (t.unassignedHospitals) {
        unassignedTile.style.display = '';
        setText('rUnassigned', t.unassignedHospitals);
    } else {
        unassignedTile.style.display = 'none';
    }

    const rows = regions.officers || [];
    const peak = Math.max(1, ...rows.map(r => r.platformRevenue));
    setHTML('regionBarBody', rows.map(r => `
        <div class="bar-row">
            <span class="name">${esc(r.officerName)}</span>
            <div class="bar-track">
                <div class="bar-fill ${r.isAssigned ? '' : 'patient'}" style="width:${(r.platformRevenue / peak) * 100}%"></div>
            </div>
            <span class="amt">${money(r.platformRevenue)}</span>
            <span class="amt">${r.revenueShare}%</span>
        </div>
    `).join('') || '<p class="empty">No regional officers configured.</p>');

    setHTML('regionBody', rows.map(r => `
        <tr style="cursor:pointer;" onclick="toggleRegion('${esc(r.officerId)}')">
            <td>
                <strong>${esc(r.officerName)}</strong>
                ${r.isAssigned ? '' : ' <span class="pill pending">gap</span>'}
                <br><span class="muted">${esc(r.officerEmail)}</span>
            </td>
            <td class="muted">${r.areas.length ? esc(r.areas.join(', ')) : '—'}</td>
            <td class="num">${r.hospitals}${r.pendingVerifications ? `<br><span class="muted">${r.pendingVerifications} pending</span>` : ''}</td>
            <td><span class="pill ${r.workloadLevel === 'high' ? 'cancelled' : (r.workloadLevel === 'medium' ? 'pending' : 'active')}">${esc(r.workloadLevel)}</span></td>
            <td class="num">${r.doctors}</td>
            <td class="num">${r.staff}</td>
            <td class="num">${r.availableBeds}/${r.totalBeds}</td>
            <td class="num muted">${money(r.collections)}</td>
            <td class="num" style="font-weight:700;">${money(r.platformRevenue)}</td>
            <td class="num">${r.revenueShare}%</td>
        </tr>
        <tr id="region-${esc(r.officerId)}" style="display:none;">
            <td colspan="10" style="background:#F9FAFB;padding:0;">
                ${hospitalBreakdown(r)}
            </td>
        </tr>
    `).join('') || '<tr><td colspan="10" class="empty">No regional officers configured.</td></tr>');
}

function hospitalBreakdown(r) {
    if (!r.byHospital || !r.byHospital.length) {
        return '<p class="empty">No hospitals in this region yet.</p>';
    }
    return `
        <table class="rev" style="margin:0;">
            <thead>
                <tr>
                    <th>Hospital</th><th>City</th><th>Status</th>
                    <th class="num">Doctors</th><th class="num">Beds free</th>
                    <th class="num">Collections</th><th class="num">Outstanding</th>
                    <th class="num">Platform revenue</th>
                </tr>
            </thead>
            <tbody>
                ${r.byHospital.map(h => `
                    <tr>
                        <td>${esc(h.hospitalName)}<br><span class="muted">${esc(h.hospitalId)}</span></td>
                        <td class="muted">${esc(h.city)}</td>
                        <td><span class="pill ${esc(h.verificationStatus)}">${esc(String(h.verificationStatus).replace(/_/g, ' '))}</span></td>
                        <td class="num">${h.doctors}</td>
                        <td class="num">${h.availableBeds}/${h.totalBeds}</td>
                        <td class="num muted">${money(h.collections)}</td>
                        <td class="num muted">${money(h.outstanding)}</td>
                        <td class="num" style="font-weight:600;">${money(h.platformRevenue)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

function toggleRegion(officerId) {
    const row = document.getElementById(`region-${officerId}`);
    if (row) row.style.display = row.style.display === 'none' ? '' : 'none';
}

// ── Pricing controls ────────────────────────────────────────────────────────

// Rates are stored as fractions but edited as percentages — a superuser types
// "1.9", not "0.019".
const FEE_FIELDS = [
    ['patientBookingFee', 'Booking convenience fee (₹)', 'rupees', 'Charged to the patient on each appointment booked.'],
    ['ambulanceDispatchFee', 'Ambulance dispatch fee (₹)', 'rupees', 'Charged on each completed dispatch.'],
    ['paymentGatewayRate', 'Payment processing (%)', 'percent', 'Taken on every bill settled through NexCare.'],
    ['extraStaffSeatFee', 'Extra staff seat (₹/month)', 'rupees', 'Per seat beyond the plan allowance.'],
    ['notificationCreditFee', 'Notification credit (₹)', 'rupees', 'Per SMS or WhatsApp sent on a hospital’s behalf.'],
];

function renderFees() {
    if (!fees) {
        document.getElementById('feeFields').innerHTML = '<p class="muted">Could not load the fee configuration.</p>';
        return;
    }
    setText('feeUpdated', fees.updatedAt ? `last changed ${shortDate(fees.updatedAt)}` : '');

    document.getElementById('feeFields').innerHTML = FEE_FIELDS.map(([key, label, kind, help]) => `
        <div class="field">
            <label for="fee-${key}">${esc(label)}</label>
            <input id="fee-${key}" type="number" min="0" step="${kind === 'percent' ? '0.1' : '1'}"
                   value="${kind === 'percent' ? (fees[key] * 100).toFixed(2) : fees[key]}">
            <span class="muted">${esc(help)}</span>
        </div>
    `).join('');
}

async function saveFees() {
    const changes = {};
    for (const [key, label, kind] of FEE_FIELDS) {
        const raw = Number(document.getElementById(`fee-${key}`).value);
        if (!Number.isFinite(raw) || raw < 0) {
            notify(`${label} must be a number that is not negative`, 'error');
            return;
        }
        changes[key] = kind === 'percent' ? raw / 100 : raw;
    }
    await apply(() => window.NexCareAPI.Revenue.updateFees(changes), 'Pricing updated — reports re-priced');
}

/** Run a pricing change, report it, and reload every figure on the page. */
async function apply(action, successMessage) {
    try {
        const res = await action();
        if (!res.success) {
            notify(res.message || 'The change was rejected', 'error');
            return false;
        }
        notify(successMessage, 'success');
        await load();
        return true;
    } catch (err) {
        console.error(err);
        notify('The change could not be saved', 'error');
        return false;
    }
}

function shortDate(value) {
    const d = new Date(value);
    return isNaN(d.getTime())
        ? String(value || '—')
        : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Rendering ───────────────────────────────────────────────────────────────

function renderKpis(o) {
    setText('kpiMrr', money(o.mrr));
    setText('kpiArr', money(o.arr));
    setText('kpiCommission', money(o.commissionRevenue));
    setText('kpiProcessing', money(o.processingRevenue));
    setText('kpiSubs', o.earningHospitals);
    setText('kpiArpa', money(o.averageRevenuePerHospital));

    setText('kpiMrrSub', 'doctor tiers + Care+ — no hospital licence');
    setText('kpiCommissionSub', `on ${money(o.gatewayVolume)} collected`);
    setText('kpiProcessingSub', `${money(o.outstandingReceivables)} still outstanding`);
    setText('kpiSubsSub', `of ${o.totalHospitals} hospitals on the platform`);
}

function renderTrend(trend) {
    const body = document.getElementById('trendBody');
    if (!trend.length) {
        body.innerHTML = '<p class="muted">No trend data.</p>';
        return;
    }
    const peak = Math.max(1, ...trend.map(t => t.total));
    body.innerHTML = trend.map(t => `
        <div class="bar-row">
            <span class="name">${esc(t.month)}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${(t.total / peak) * 100}%"></div></div>
            <span class="amt">${money(t.total)}</span>
        </div>
        <div class="muted" style="margin:-4px 0 12px 202px;">
            ${money(t.recurring)} recurring · ${money(t.commission)} commission · ${money(t.processing)} processing
        </div>
    `).join('');
}

function renderHospitals(o) {
    const rows = o.byHospital || [];
    if (!rows.length) {
        setHTML('hospitalTableBody',
            '<tr><td colspan="7" class="empty">No hospital has collected anything in this period.</td></tr>');
        return;
    }

    setHTML('hospitalTableBody', rows.map(h => `
        <tr>
            <td><strong>${esc(h.hospitalName)}</strong><br><span class="muted">${esc(h.hospitalId)}</span></td>
            <td><span class="pill ${esc(h.status)}">${esc(String(h.status).replace(/_/g, ' '))}</span></td>
            <td class="num">${h.paymentsProcessed}</td>
            <td class="num muted">${money(h.collections)}</td>
            <td class="num">${money(h.commission)}</td>
            <td class="num">${money(h.processingFees)}</td>
            <td class="num" style="font-weight:700;">${money(h.platformRevenue)}</td>
        </tr>
    `).join(''));
}

// ── Actions ─────────────────────────────────────────────────────────────────

// ── Helpers ─────────────────────────────────────────────────────────────────

function money(value) {
    const n = Number(value) || 0;
    return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

function getCurrentUser() {
    try {
        const raw = sessionStorage.getItem('nexcare_user_data');
        if (raw) return JSON.parse(raw);
    } catch (e) { /* fall through to the token */ }
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    if (!token) return null;
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}

function notify(message, type = 'info') {
    const n = document.createElement('div');
    Object.assign(n.style, {
        position: 'fixed', bottom: '20px', right: '20px', padding: '12px 20px',
        borderRadius: '8px', color: '#FFFFFF', fontWeight: '600', fontSize: '14px',
        zIndex: '99999', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        background: type === 'success' ? '#10B981' : (type === 'error' ? '#EF4444' : '#3B82F6'),
    });
    n.textContent = message;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}
