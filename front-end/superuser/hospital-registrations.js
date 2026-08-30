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

        // Fetch Regional Officers for dropdown
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

            // Assignment is intentionally limited to managers configured for the
            // hospital's local city/area. The backend enforces the same rule.
            const hospitalArea = String(h.city || '').trim().toLowerCase();
            const eligibleManagers = regionalOfficers.filter(ro =>
                Array.isArray(ro.areas) && ro.areas.some(area => String(area).trim().toLowerCase() === hospitalArea)
            );
            let roSelect = `<select class="form-control" style="padding: 4px; font-size: 12px; width: 220px;" onchange="assignRegionalOfficer('${h.id}', this.value)" ${h.verificationStatus !== 'pending_verification' ? 'disabled' : ''}>
                <option value="">${eligibleManagers.length ? '-- Assign regional manager --' : '-- No manager configured for this area --'}</option>
                ${eligibleManagers.map(ro => `<option value="${ro.id}" ${h.assignedManagerId === ro.id ? 'selected' : ''}>${escapeHtml(ro.name)} · ${escapeHtml(ro.areas.join(', '))} · ${escapeHtml(ro.email)}</option>`).join('')}
            </select>`;

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
