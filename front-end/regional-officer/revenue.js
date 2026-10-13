// Regional Officer — revenue across the hospitals they oversee.
//
// This is OPERATIONAL revenue: what each hospital collected from patients. What
// NexCare charges those hospitals is the platform's own commercials and is not
// shown here — that lives in the superuser portal.

let rows = [];

document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userInitials').textContent = (user.name || 'RO').substring(0, 2).toUpperCase();
        document.getElementById('userNameDisplay').textContent = user.name || 'Regional Officer';
    }

    document.getElementById('hospitalPicker').addEventListener('change', e => loadDepartments(e.target.value));
    await load();
});

async function load() {
    try {
        const res = await window.NexCareAPI.Revenue.compareMyHospitals();
        if (!res.success) throw new Error(res.message || 'Failed to load revenue');
        rows = res.data || [];
    } catch (err) {
        console.error(err);
        document.getElementById('compareTableBody').innerHTML =
            `<tr><td colspan="5" style="text-align:center;color:#DC2626;">Could not load revenue data.</td></tr>`;
        return;
    }

    renderKpis();
    renderTable();
    populatePicker();
    if (rows.length) loadDepartments(rows[0].hospitalId);
}

function renderKpis() {
    const collected = rows.reduce((t, r) => t + r.collected, 0);
    const outstanding = rows.reduce((t, r) => t + r.outstanding, 0);
    const bills = rows.reduce((t, r) => t + r.billsIssued, 0);
    const avgRate = rows.length
        ? rows.reduce((t, r) => t + r.collectionRate, 0) / rows.length
        : 0;

    setText('kpiCollected', money(collected));
    setText('kpiOutstanding', money(outstanding));
    setText('kpiBills', bills);
    setText('kpiRate', `${avgRate.toFixed(1)}%`);
}

function renderTable() {
    const tbody = document.getElementById('compareTableBody');
    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#6A7282;">No hospitals assigned to you.</td></tr>`;
        return;
    }
    tbody.innerHTML = rows.map(r => `
        <tr>
            <td class="actor-cell">${esc(r.hospitalName)}<div class="muted">${esc(r.hospitalId)}</div></td>
            <td style="font-weight:600;">${money(r.collected)}</td>
            <td style="color:#B45309;">${money(r.outstanding)}</td>
            <td>${r.billsIssued}</td>
            <td>
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="flex:1;max-width:110px;height:8px;background:#F3F4F6;border-radius:4px;overflow:hidden;">
                        <div style="height:100%;width:${Math.min(100, r.collectionRate).toFixed(1)}%;background:${r.collectionRate >= 70 ? '#10B981' : r.collectionRate >= 50 ? '#F59E0B' : '#EF4444'};"></div>
                    </div>
                    <span style="font-size:12px;">${r.collectionRate.toFixed(1)}%</span>
                </div>
            </td>
        </tr>
    `).join('');
}

function populatePicker() {
    document.getElementById('hospitalPicker').innerHTML =
        rows.map(r => `<option value="${esc(r.hospitalId)}">${esc(r.hospitalName)}</option>`).join('');
}

async function loadDepartments(hospitalId) {
    const body = document.getElementById('deptBody');
    if (!hospitalId) return;
    body.innerHTML = '<p style="color:#6A7282;font-size:13px;">Loading…</p>';

    try {
        const res = await window.NexCareAPI.Revenue.getHospitalRevenue(hospitalId);
        if (!res.success) throw new Error(res.message);
        const d = res.data;

        if (!d.byDepartment.length) {
            body.innerHTML = '<p style="color:#6A7282;font-size:13px;">No collected revenue to break down yet.</p>';
            return;
        }

        const max = Math.max(...d.byDepartment.map(x => x.amount), 1);
        body.innerHTML = `
            <p style="font-size:13px;color:#374151;margin-bottom:16px;">
                <strong>${esc(d.hospitalName)}</strong> — ${money(d.collected)} collected across
                ${d.billsPaid} paid bills &middot; average bill ${money(d.averageBillValue)} &middot;
                GST collected ${money(d.gstCollected)}
            </p>
            ${d.byDepartment.map(x => `
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                    <div style="width:150px;font-size:12px;color:#374151;">${esc(x.department)}</div>
                    <div style="flex:1;height:20px;background:#F3F4F6;border-radius:6px;overflow:hidden;">
                        <div style="height:100%;width:${(x.amount / max * 100).toFixed(1)}%;background:linear-gradient(90deg,#2563EB,#0EA5E9);"></div>
                    </div>
                    <div style="width:130px;text-align:right;font-size:12px;font-weight:600;">
                        ${money(x.amount)} <span style="color:#6A7282;font-weight:400;">${x.share}%</span>
                    </div>
                </div>
            `).join('')}
            <div style="margin-top:16px;padding-top:14px;border-top:1px dashed #E5E7EB;font-size:12px;color:#6A7282;">
                Monthly: ${d.byMonth.map(m => `${esc(m.month)} ${money(m.collected)}`).join(' &middot; ')}
            </div>`;
    } catch (err) {
        console.error(err);
        body.innerHTML = '<p style="color:#DC2626;font-size:13px;">Could not load the department breakdown.</p>';
    }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function money(value) {
    return '₹' + (Number(value) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
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
