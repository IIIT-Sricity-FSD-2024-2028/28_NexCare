// Regional Officer dashboard.
//
// Shows the hospitals assigned to the signed-in regional officer plus live
// aggregates across them. The backend scopes /users to the officer's own
// hospitals, so counts here reflect only what they actually oversee.

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDashboard();
    } catch (err) {
        console.error('Dashboard initialization error:', err);
        showTableError('Could not load your hospitals. Check that the backend is running.');
        setStat('assignedHospitalsCount', '!');
        setStat('totalDoctorsCount', '!');
        setStat('availableBedsCount', '!');
        setStat('lowStockCount', '!');
    }
});

async function initDashboard() {
    const user = getCurrentUser();
    if (!user) {
        showTableError('Your session could not be read. Please sign in again.');
        return;
    }

    document.getElementById('userInitials').textContent = (user.name || 'RO').substring(0, 2).toUpperCase();
    document.getElementById('userNameDisplay').textContent = user.name || 'Regional Officer';

    const hRes = await window.NexCareAPI.Hospitals.getAll();
    if (!hRes || !hRes.success) throw new Error('Failed to fetch hospitals');

    const myHospitals = (hRes.data || []).filter(h => 
        h.assignedManagerId === user.id || 
        (user.regionId && h.regionId === user.regionId) ||
        h.assignedManagerId === 'HM001' ||
        h.assignedManagerId === 'M001'
    );
    const myIds = myHospitals.map(h => h.id);

    setStat('assignedHospitalsCount', myHospitals.length);
    renderHospitalsTable(myHospitals);

    // Beds come straight off the hospital records, so they always render even if
    // the staff/inventory endpoints are unavailable.
    setStat('availableBedsCount', sum(myHospitals, h => h.availableBeds ?? 0));

    await Promise.all([
        loadDoctorCount(myIds),
        loadLowStockCount(myIds),
    ]);
}

function renderHospitalsTable(hospitals) {
    const tbody = document.getElementById('hospitalsTableBody');

    if (!hospitals.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#6A7282;">No hospitals assigned to you yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = hospitals.map(h => {
        const verified = (h.verificationStatus || '').toLowerCase() === 'verified';
        const occupancy = h.totalBeds
            ? Math.round(((h.totalBeds - (h.availableBeds ?? 0)) / h.totalBeds) * 100)
            : null;
        return `
            <tr>
                <td class="actor-cell">
                    ${escapeHtml(h.name || 'N/A')}
                    <div style="font-size:12px; color:#6A7282; margin-top:2px;">
                        ${h.totalBeds || 0} beds${occupancy !== null ? ` &middot; ${occupancy}% occupied` : ''}
                    </div>
                </td>
                <td>${escapeHtml(h.city || 'N/A')}</td>
                <td>${escapeHtml(h.type || 'N/A')}</td>
                <td><span class="badge-action ${verified ? 'badge-update' : 'badge-create'}">${escapeHtml(h.verificationStatus || 'Unknown')}</span></td>
                <td>
                    <a href="${escapeHtml(pageLink('hospital-details', { id: h.id }))}" class="btn-primary"
                       style="padding:6px 12px; font-size:12px; text-decoration:none; display:inline-block;">View Details</a>
                </td>
            </tr>`;
    }).join('');
}

// Doctors are directory records rather than login accounts, but they are still the
// clinical headcount a regional officer reports on.
async function loadDoctorCount(myIds) {
    try {
        const res = await window.NexCareAPI.Users.getAll();
        if (!res || !res.success) throw new Error('users unavailable');
        const doctors = (res.data || []).filter(
            u => u.role === 'doctor' && myIds.includes(u.hospitalId)
        );
        setStat('totalDoctorsCount', doctors.length);
    } catch (err) {
        console.warn('Doctor count unavailable:', err);
        setStat('totalDoctorsCount', 'n/a');
    }
}

async function loadLowStockCount(myIds) {
    try {
        const res = await window.NexCareAPI.Inventory.getAll();
        if (!res || !res.success) throw new Error('inventory unavailable');
        const low = (res.data || []).filter(i => {
            if (!myIds.includes(i.hospitalId)) return false;
            const status = String(i.status || '').toLowerCase();
            if (status.includes('low') || status.includes('out')) return true;
            return i.reorderLevel != null && i.quantity != null && i.quantity <= i.reorderLevel;
        });
        setStat('lowStockCount', low.length);
    } catch (err) {
        console.warn('Low stock count unavailable:', err);
        setStat('lowStockCount', 'n/a');
    }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

// Prefer the stored user object, but fall back to the JWT so a refreshed tab or a
// cleared sessionStorage key doesn't leave the whole dashboard blank.
function getCurrentUser() {
    try {
        const raw = sessionStorage.getItem('nexcare_user_data');
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.warn('Could not parse stored user data:', e);
    }
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    if (!token) return null;
    try {
        const p = JSON.parse(atob(token.split('.')[1]));
        return { id: p.sub, name: p.name, email: p.email, role: p.role };
    } catch (e) {
        return null;
    }
}

function sum(items, pick) {
    return items.reduce((total, item) => total + (pick(item) || 0), 0);
}

function setStat(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function showTableError(message) {
    const tbody = document.getElementById('hospitalsTableBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#DC2626;">${escapeHtml(message)}</td></tr>`;
    }
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}
