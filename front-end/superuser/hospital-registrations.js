document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadHospitals();

        // Add search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', async (e) => {
                const term = e.target.value.toLowerCase().trim();
                await loadHospitals(term);
            });
        }
    } catch (err) {
        console.error("Initialization error:", err);
    }
});

// ─── Regional manager suggestions ───────────────────────────────────────────
// One request per distinct city on the page, cached for the render. The backend
// ranks by area coverage first, then by current workload, so the dropdown order
// IS the recommendation — the page does no ranking of its own.

const suggestionCache = new Map();

async function loadSuggestions(hospitals) {
    if (!window.NexCareAPI || !window.NexCareAPI.Users.suggestRegionalManagers) return;

    const cities = [...new Set(
        hospitals.map(h => String(h.city || '').trim()).filter(Boolean)
    )].filter(city => !suggestionCache.has(cityKey(city)));

    await Promise.all(cities.map(async city => {
        try {
            const res = await window.NexCareAPI.Users.suggestRegionalManagers(city);
            if (res.success && Array.isArray(res.data)) {
                suggestionCache.set(cityKey(city), res.data);
            }
        } catch (err) {
            // A failed suggestion must not stop the table rendering; the
            // dropdown falls back to the plain officer list below.
            console.warn(`Could not load RM suggestions for ${city}:`, err.message);
        }
    }));
}

function cityKey(city) {
    return String(city || '').trim().toLowerCase();
}

/**
 * Ranked officers for a city. Falls back to the raw officer list — with
 * coverage worked out client-side — if the suggestion call did not land, so the
 * Admin is never left with an empty dropdown.
 */
function suggestionsFor(city, regionalOfficers) {
    const cached = suggestionCache.get(cityKey(city));
    if (cached) {
        return cached.map(r => ({ ...r, coversCity: covers(r.areas, city) }));
    }
    return (regionalOfficers || []).map(ro => ({
        regionalManagerId: ro.id,
        regionalManagerName: ro.name,
        regionalManagerEmail: ro.email,
        areas: ro.areas || [],
        currentWorkload: null,
        workloadLevel: null,
        reason: '',
        coversCity: covers(ro.areas, city),
    })).sort((a, b) => (b.coversCity === true) - (a.coversCity === true));
}

function covers(areas, city) {
    return Array.isArray(areas) && areas.some(a => cityKey(a) === cityKey(city));
}

/** "Kavitha Menon · Chittoor, Nellore · 2 hospitals (low)" */
function loadLabel(r) {
    const parts = [r.regionalManagerName];
    if (r.areas && r.areas.length) parts.push(r.areas.join(', '));
    if (r.currentWorkload !== null && r.currentWorkload !== undefined) {
        const level = r.workloadLevel ? ` (${r.workloadLevel})` : '';
        parts.push(`${r.currentWorkload} hospital${r.currentWorkload === 1 ? '' : 's'}${level}`);
    } else {
        parts.push(r.regionalManagerEmail);
    }
    return parts.join(' · ');
}

async function loadHospitals(searchTerm = '') {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: #6A7282;">Loading hospitals...</td></tr>`;

    try {
        // Fetch hospitals - try NexCareAPI first, fallback to direct API call
        let hospitals = [];
        if (window.NexCareAPI && window.NexCareAPI.Hospitals) {
            const hRes = await window.NexCareAPI.Hospitals.getAll();
            if (!hRes.success) throw new Error("Failed to load hospitals");
            hospitals = hRes.data || [];
        } else {
            // Fallback to direct API call
            const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
            const host = window.location.hostname || 'localhost';
            const res = await fetch(`http://${host}:3001/api/hospitals`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const resp = await res.json();
            hospitals = resp.data || [];
        }

        // Filter by search term if provided
        if (searchTerm) {
            hospitals = hospitals.filter(h =>
                (h.name && h.name.toLowerCase().includes(searchTerm)) ||
                (h.city && h.city.toLowerCase().includes(searchTerm)) ||
                (h.registrationNumber && h.registrationNumber.toLowerCase().includes(searchTerm)) ||
                (h.adminName && h.adminName.toLowerCase().includes(searchTerm))
            );
        }

        // Fetch Regional Officers for dropdown.
        let regionalOfficers = [];
        if (window.NexCareAPI && window.NexCareAPI.Users) {
            const uRes = await window.NexCareAPI.Users.getAll();
            if (uRes.success) {
                regionalOfficers = uRes.data.filter(u => u.role === 'regional_manager');
            }
        } else {
            // Fallback to direct API call
            const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
            const host = window.location.hostname || 'localhost';
            const res = await fetch(`http://${host}:3001/api/users`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const resp = await res.json();
            regionalOfficers = (resp.data || []).filter(u => u.role === 'regional_manager');
        }

        // Suggestions come from the backend (UsersService.suggestRMForHospital),
        // which ranks officers by area coverage and then by how loaded they are.
        // Doing it server-side means the dropdown shows the same answer the
        // backend would give, and one request covers every city on the page
        // instead of one per row.
        await loadSuggestions(hospitals);

        if (hospitals.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #6A7282;">
                        <svg style="margin-bottom:12px;opacity:0.5;" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        <br>No hospitals found in the system.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = hospitals.map(h => {
            let statusBadge = '';
            if (h.verificationStatus === 'pending_verification') statusBadge = '<span class="badge" style="background:#FEF3C7;color:#D97706;">Pending</span>';
            else if (h.verificationStatus === 'verified') statusBadge = '<span class="badge" style="background:#DCFCE7;color:#15803D;">Verified</span>';
            else if (h.verificationStatus === 'rejected') statusBadge = '<span class="badge" style="background:#FEE2E2;color:#DC2626;">Rejected</span>';
            else statusBadge = `<span class="badge" style="background:#F3F4F6;color:#374151;">${h.verificationStatus || 'Unknown'}</span>`;

            // Ranked suggestions for this hospital's city, with the officer's
            // current load shown so the Admin can see who is already stretched.
            const ranked = suggestionsFor(h.city, regionalOfficers);
            const covering = ranked.filter(r => r.coversCity);
            const others = ranked.filter(r => !r.coversCity);

            const optionFor = r => `<option value="${r.regionalManagerId}" ${h.assignedManagerId === r.regionalManagerId ? 'selected' : ''}>${escapeHtml(loadLabel(r))}</option>`;

            let roSelect = `<select class="form-control" style="padding: 4px; font-size: 12px; width: 260px;" onchange="assignRegionalOfficer('${h.id}', this.value)" ${h.verificationStatus !== 'pending_verification' ? 'disabled' : ''}>
                <option value="">${ranked.length ? '-- Assign regional manager --' : '-- No regional managers configured --'}</option>
                ${covering.length ? `<optgroup label="Covers ${escapeHtml(h.city || 'this area')}">${covering.map(optionFor).join('')}</optgroup>` : ''}
                ${others.length ? `<optgroup label="Other areas">${others.map(optionFor).join('')}</optgroup>` : ''}
            </select>`;

            // Surface the top recommendation next to the control, so the Admin
            // does not have to open the dropdown to see who the system favours.
            const top = ranked[0];
            if (top && h.verificationStatus === 'pending_verification' && !h.assignedManagerId) {
                roSelect += `<div style="font-size:11px;color:#6A7282;margin-top:4px;">
                    Suggested: <strong>${escapeHtml(top.regionalManagerName)}</strong> — ${escapeHtml(top.reason || '')}
                </div>`;
            }

            // Actions
            let actions = '';
            if (h.verificationStatus === 'pending_verification') {
                if (h.regionalReviewStatus === 'cleared') {
                    actions = `<button class="btn-icon" onclick="verifyHospital('${h.id}')" title="Final approve">Final approve</button>
                        <button class="btn-icon danger" onclick="rejectHospital('${h.id}')" title="Reject">Reject</button>`;
                } else if (h.regionalReviewStatus === 'rejected') {
                    actions = `<button class="btn-icon danger" onclick="rejectHospital('${h.id}')" title="Reject">Reject</button>`;
                } else if (h.assignedManagerId) {
                    actions = '<span style="font-size:12px;color:#6A7282;">Regional review pending</span>';
                } else {
                    actions = '<span style="font-size:12px;color:#6A7282;">Assign a regional manager</span>';
                }
            }

            return `
                <tr style="border-bottom: 1px solid #F3F4F6;">
                    <td style="padding: 16px 24px; font-size: 14px; color: #111827; font-weight: 500;">
                        ${escapeHtml(h.name)} <br> <span style="font-size:12px; color:#6A7282; font-weight:normal;">${escapeHtml(h.city)}</span>
                    </td>
                    <td style="padding: 16px 24px; font-size: 14px; color: #475569;">${escapeHtml(h.registrationNumber || 'N/A')}</td>
                    <td style="padding: 16px 24px; font-size: 14px; color: #475569;">${escapeHtml(h.adminName)}<br><span style="font-size:12px;">${escapeHtml(h.adminEmail)}</span></td>
                    <td style="padding: 16px 24px;">${statusBadge}</td>
                    <td style="padding: 16px 24px;">${roSelect}</td>
                    <td style="padding: 16px 24px; text-align: right;">${actions}</td>
                </tr>
            `;
        }).join('');
        
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: #DC2626;">Error loading data. ${err.message}</td></tr>`;
    }
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

window.verifyHospital = async function(id) {
    if(!confirm("Are you sure you want to verify this hospital?")) return;
    try {
        let res;
        if (window.NexCareAPI && window.NexCareAPI.Hospitals) {
            res = await window.NexCareAPI.Hospitals.verify(id);
        } else {
            // Fallback to direct API call
            const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
            const host = window.location.hostname || 'localhost';
            const response = await fetch(`http://${host}:3001/api/hospitals/${id}/verify`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            res = await response.json();
        }
        if(res.success) {
            loadHospitals();
        } else {
            alert(res.message);
        }
    } catch(err) {
        alert("Failed to verify: " + err.message);
    }
}

window.rejectHospital = async function(id) {
    if(!confirm("Are you sure you want to reject this hospital?")) return;
    try {
        let res;
        if (window.NexCareAPI && window.NexCareAPI.Hospitals) {
            res = await window.NexCareAPI.Hospitals.reject(id);
        } else {
            // Fallback to direct API call
            const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
            const host = window.location.hostname || 'localhost';
            const response = await fetch(`http://${host}:3001/api/hospitals/${id}/reject`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            res = await response.json();
        }
        if(res.success) {
            loadHospitals();
        } else {
            alert(res.message);
        }
    } catch(err) {
        alert("Failed to reject: " + err.message);
    }
}

window.assignRegionalOfficer = async function(hospitalId, managerId) {
    if(!managerId) return;
    try {
        let res;
        if (window.NexCareAPI && window.NexCareAPI.Hospitals) {
            res = await window.NexCareAPI.Hospitals.assignManager(hospitalId, managerId);
        } else {
            // Fallback to direct API call
            const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
            const host = window.location.hostname || 'localhost';
            const response = await fetch(`http://${host}:3001/api/hospitals/${hospitalId}/assign-manager`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ managerId })
            });
            res = await response.json();
        }
        if(res.success) {
            alert("Regional Officer assigned successfully!");
            loadHospitals();
        } else {
            alert(res.message);
        }
    } catch(err) {
        alert("Failed to assign manager: " + err.message);
    }
}
