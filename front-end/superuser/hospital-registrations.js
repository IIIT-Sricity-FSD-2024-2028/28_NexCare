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

        // Sort: pending first (cleared > rejected > pending), then everything else
        hospitals.sort((a, b) => {
            if (a.verificationStatus === 'pending_verification' && b.verificationStatus !== 'pending_verification') return -1;
            if (b.verificationStatus === 'pending_verification' && a.verificationStatus !== 'pending_verification') return 1;
            if (a.verificationStatus === 'pending_verification' && b.verificationStatus === 'pending_verification') {
                if (a.regionalReviewStatus === 'cleared' && b.regionalReviewStatus !== 'cleared') return -1;
                if (b.regionalReviewStatus === 'cleared' && a.regionalReviewStatus !== 'cleared') return 1;
            }
            // Fallback to newest first
            const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return tB - tA;
        });

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

            let roSelect = `<select class="form-control" style="padding: 4px; font-size: 12px; max-width: 150px; text-overflow: ellipsis;" onchange="assignRegionalOfficer('${h.id}', this.value)" ${h.verificationStatus !== 'pending_verification' ? 'disabled' : ''}>
                <option value="">${ranked.length ? '-- Assign regional officer --' : '-- No regional officers configured --'}</option>
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
            const hNameSafe = escapeHtml(h.name || '').replace(/'/g, "\\'");
            let actions = '';
            if (h.verificationStatus === 'pending_verification') {
                if (h.regionalReviewStatus === 'cleared') {
                    actions = `<div style="font-size:10px;color:#15803D;margin-bottom:4px;font-weight:600;">RO Cleared</div>
                               <button class="btn-approve" style="width:100px;text-align:center;padding:4px 8px;font-size:12px;cursor:pointer;border-radius:4px;" onclick="verifyHospital('${h.id}', '${hNameSafe}')" title="Final approve">Final Approve</button>
                               <button class="btn-reject" style="width:100px;text-align:center;padding:4px 8px;font-size:12px;cursor:pointer;border-radius:4px;margin-top:4px;" onclick="rejectHospital('${h.id}', '${hNameSafe}')" title="Reject">Reject</button>`;
                } else if (h.regionalReviewStatus === 'rejected') {
                    let reasonText = h.regionalReviewNotes ? `(Reason: ${escapeHtml(h.regionalReviewNotes)})` : '';
                    actions = `<div style="font-size:10px;color:#DC2626;margin-bottom:4px;font-weight:600;">RO Rejected<br><span style="font-weight:normal;color:#6A7282;">${reasonText}</span></div>
                               <button class="btn-reject" style="width:100px;text-align:center;padding:4px 8px;font-size:12px;cursor:pointer;border-radius:4px;" onclick="rejectHospital('${h.id}', '${hNameSafe}')" title="Reject">Final Reject</button>`;
                } else {
                    let statusText = h.assignedManagerId ? 'RO pending' : 'RO not assigned';
                    actions = `<div style="font-size:10px;color:#6A7282;margin-bottom:4px;font-weight:600;">${statusText}</div>
                               <button class="btn-approve" style="width:100px;text-align:center;padding:4px 8px;font-size:12px;cursor:pointer;border-radius:4px;" onclick="verifyHospital('${h.id}', '${hNameSafe}')" title="Direct approve">Direct Approve</button>
                               <button class="btn-reject" style="width:100px;text-align:center;padding:4px 8px;font-size:12px;cursor:pointer;border-radius:4px;margin-top:4px;" onclick="rejectHospital('${h.id}', '${hNameSafe}')" title="Reject">Reject</button>`;
                }
            } else if (h.verificationStatus === 'verified') {
                 actions = `<span style="font-size:12px;color:#15803D;font-weight:600;">Approved</span>`;
            } else if (h.verificationStatus === 'rejected') {
                 actions = `<span style="font-size:12px;color:#DC2626;font-weight:600;">Rejected</span>`;
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

function showToastNotification(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed; bottom:24px; right:24px; padding:12px 20px; border-radius:8px; background:${type === 'error' ? '#DC2626' : (type === 'info' ? '#2563EB' : '#16A34A')}; color:#fff; font-size:14px; font-weight:600; box-shadow:0 10px 15px -3px rgba(0,0,0,0.2); z-index:99999;`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function showHospitalCredentialsModal(data, hospitalName) {
    const email = data.email || 'manager@hospital.com';
    const password = data.password || 'tempPass123';
    const hName = data.hospitalName || hospitalName || 'Registered Hospital';

    const modal = document.createElement('div');
    modal.id = 'credentialsModal';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(15,23,42,0.6); display:flex; align-items:center; justify-content:center; z-index:99999; backdrop-filter:blur(4px);';
    modal.innerHTML = `
        <div style="background:#fff; border-radius:16px; width:90%; max-width:520px; padding:28px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); border:1px solid #E2E8F0;">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
                <div style="width:44px; height:44px; border-radius:12px; background:#DCFCE7; color:#15803D; display:flex; align-items:center; justify-content:center; font-size:22px;">✓</div>
                <div>
                    <h3 style="margin:0; font-size:18px; font-weight:700; color:#0F172A;">Hospital Approved Successfully</h3>
                    <p style="margin:2px 0 0; font-size:13px; color:#64748B;">Manager credentials generated for ${escapeHtml(hName)}</p>
                </div>
            </div>
            
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:16px; margin:18px 0; font-size:13.5px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px; padding-bottom:8px; border-bottom:1px dashed #CBD5E1;">
                    <span style="color:#64748B;">Role:</span>
                    <span style="font-weight:600; color:#0F172A;">Hospital Manager</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px; padding-bottom:8px; border-bottom:1px dashed #CBD5E1;">
                    <span style="color:#64748B;">Login Email:</span>
                    <span style="font-weight:700; color:#1E293B; font-family:monospace;" id="credEmail">${escapeHtml(email)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px; padding-bottom:8px; border-bottom:1px dashed #CBD5E1;">
                    <span style="color:#64748B;">Initial Password:</span>
                    <span style="font-weight:700; color:#2563EB; font-family:monospace;" id="credPassword">${escapeHtml(password)}</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:#64748B;">Portal Link:</span>
                    <span style="font-weight:600; color:#059669; font-size:12px;">/hospital_manager/dashboard.html</span>
                </div>
            </div>

            <p style="font-size:12px; color:#64748B; margin:0 0 20px;">Please copy and securely transmit these credentials to the hospital administrator.</p>

            <div style="display:flex; justify-content:flex-end; gap:10px;">
                <button type="button" id="copyCredsBtn" style="padding:10px 18px; border-radius:8px; background:#2563EB; color:#fff; border:none; font-weight:600; font-size:13px; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                    📋 Copy Credentials
                </button>
                <button type="button" id="closeCredsBtn" style="padding:10px 18px; border-radius:8px; background:#F1F5F9; color:#334155; border:1px solid #CBD5E1; font-weight:600; font-size:13px; cursor:pointer;">
                    Done
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('copyCredsBtn').onclick = () => {
        const text = `NEXCARE HOSPITAL MANAGER CREDENTIALS\nHospital: ${hName}\nPortal URL: ${window.location.origin}/hospital_manager/dashboard.html\nLogin Email: ${email}\nInitial Password: ${password}\n\nPlease change your password upon first login.`;
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById('copyCredsBtn');
            if (btn) btn.textContent = '✓ Copied to Clipboard!';
            setTimeout(() => {
                const b = document.getElementById('copyCredsBtn');
                if (b) b.innerHTML = '📋 Copy Credentials';
            }, 2500);
        });
    };

    document.getElementById('closeCredsBtn').onclick = () => {
        modal.remove();
        loadHospitals();
    };
}

window.verifyHospital = async function(id, name) {
    try {
        const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
        const host = window.location.hostname || 'localhost';
        
        const response = await fetch(`http://${host}:3001/api/hospitals/${id}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        const res = await response.json();
        
        if (res.success) {
            if (res.data && res.data.email && res.data.password) {
                showHospitalCredentialsModal(res.data, name);
            } else {
                showToastNotification('Hospital Approved Successfully!', 'success');
                loadHospitals();
            }
        } else {
            showToastNotification(res.message || 'Failed to approve hospital', 'error');
        }
    } catch(err) {
        showToastNotification("Failed to verify: " + err.message, 'error');
    }
};

window.rejectHospital = function(id, name) {
    const modal = document.createElement('div');
    modal.id = 'rejectHospitalModal';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(15,23,42,0.6); display:flex; align-items:center; justify-content:center; z-index:99999; backdrop-filter:blur(4px);';
    modal.innerHTML = `
        <div style="background:#fff; border-radius:16px; width:90%; max-width:480px; padding:24px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); border:1px solid #E2E8F0;">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:14px;">
                <div style="width:40px; height:40px; border-radius:10px; background:#FEE2E2; color:#DC2626; display:flex; align-items:center; justify-content:center; font-size:20px;">✕</div>
                <div>
                    <h3 style="margin:0; font-size:17px; font-weight:700; color:#0F172A;">Reject Hospital Registration</h3>
                    <p style="margin:2px 0 0; font-size:12.5px; color:#64748B;">${escapeHtml(name || 'Selected Hospital')}</p>
                </div>
            </div>

            <div style="margin:16px 0;">
                <label style="display:block; font-size:13px; font-weight:600; color:#334155; margin-bottom:6px;">Reason for Rejection <span style="color:#DC2626;">*</span></label>
                <textarea id="rejectionReasonInput" rows="3" placeholder="e.g. Incomplete NABH accreditation or invalid medical council registration license" style="width:100%; border:1px solid #CBD5E1; border-radius:8px; padding:10px; font-size:13px; resize:none; font-family:inherit;"></textarea>
                <div id="rejectErrorMsg" style="display:none; color:#DC2626; font-size:12px; margin-top:4px;">Please provide a specific rejection reason.</div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px;">
                <button type="button" id="cancelRejectBtn" style="padding:9px 16px; border-radius:8px; background:#F1F5F9; color:#334155; border:1px solid #CBD5E1; font-weight:600; font-size:13px; cursor:pointer;">
                    Cancel
                </button>
                <button type="button" id="confirmRejectBtn" style="padding:9px 16px; border-radius:8px; background:#DC2626; color:#fff; border:none; font-weight:600; font-size:13px; cursor:pointer;">
                    Confirm Rejection
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('cancelRejectBtn').onclick = () => modal.remove();

    document.getElementById('confirmRejectBtn').onclick = async () => {
        const reason = document.getElementById('rejectionReasonInput').value.trim();
        if (!reason || reason.length < 5) {
            document.getElementById('rejectErrorMsg').style.display = 'block';
            return;
        }

        const btn = document.getElementById('confirmRejectBtn');
        btn.disabled = true;
        btn.textContent = 'Rejecting...';

        try {
            const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
            const host = window.location.hostname || 'localhost';
            const response = await fetch(`http://${host}:3001/api/hospitals/${id}/reject`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });
            const res = await response.json();
            modal.remove();
            if (res.success) {
                showToastNotification('Hospital registration rejected and reason logged.', 'info');
                loadHospitals();
            } else {
                showToastNotification(res.message || 'Failed to reject hospital', 'error');
            }
        } catch (err) {
            modal.remove();
            showToastNotification('Failed to reject: ' + err.message, 'error');
        }
    };
};

window.assignRegionalOfficer = async function(hospitalId, managerId) {
    if(!managerId) return;
    try {
        const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
        const host = window.location.hostname || 'localhost';
        const response = await fetch(`http://${host}:3001/api/hospitals/${hospitalId}/assign-manager`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ managerId })
        });
        const res = await response.json();
        if (res.success) {
            showToastNotification('Regional Officer assigned successfully!', 'success');
            loadHospitals();
        } else {
            showToastNotification(res.message || 'Could not assign officer', 'error');
        }
    } catch(err) {
        showToastNotification('Failed to assign manager: ' + err.message, 'error');
    }
};
