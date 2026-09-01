// ---------------- API HELPER ----------------
function apiGet(path) {
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    const host = window.location.hostname || 'localhost';
    return fetch(`http://${host}:3001/api${path}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    }).then(r => r.json());
}

function apiRequest(method, path, body) {
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    const host = window.location.hostname || 'localhost';
    return fetch(`http://${host}:3001/api${path}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
    }).then(r => r.json());
}

// ---------------- STATE ----------------
let feedbackCache = [];

async function loadFeedbacks() {
    try {
        const [resp, hospResp] = await Promise.all([
            apiGet('/feedback'),
            apiGet('/hospitals')
        ]);
        const hospMap = {};
        if (hospResp && hospResp.data) {
            hospResp.data.forEach(h => hospMap[h.id] = h.name);
        }
        
        feedbackCache = (resp.data || []).map(f => ({
            id: f.id,
            date: f.createdAt ? f.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
            type: f.type || 'Patient',
            sender: f.sender || 'Anonymous',
            rating: f.rating || 0,
            subject: f.subject || 'Feedback',
            comment: f.summary || f.description || '',
            hospitalName: hospMap[f.hospitalId] || f.hospitalId || 'Unknown Hospital'
        }));

        // Populate hospital filter dropdown if empty
        const filterHosp = document.getElementById('filterHospital');
        if (filterHosp && filterHosp.options.length <= 1) {
            const uniqueHospitals = [...new Set(feedbackCache.map(f => f.hospitalName))].sort();
            uniqueHospitals.forEach(h => {
                const opt = document.createElement('option');
                opt.value = h;
                opt.textContent = h;
                filterHosp.appendChild(opt);
            });
        }

        return feedbackCache;
    } catch (err) {
        console.error('Failed to load feedback:', err);
        return [];
    }
}

function renderRatings(num) {
    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
        starsHtml += i < num ? '&#9733;' : '&#9734;';
    }
    return `<span class="stars">${starsHtml}</span>`;
}

function renderFeedback(data) {
    const tbody = document.getElementById('feedbackTableBody');
    if (!tbody) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px; color: #6b7280;">No feedback entries found.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(f => {
        let badgeColor = f.type === 'Patient' ? 'Patient' : 'Staff';
        return `
        <tr>
            <td style="font-weight: 500; color: #111827;">${f.id}</td>
            <td>${f.date}</td>
            <td>${f.hospitalName}</td>
            <td><span class="badge ${badgeColor}">${f.type}</span></td>
            <td>${f.sender}</td>
            <td>${f.subject}</td>
            <td>${renderRatings(f.rating)}</td>
            <td>
                <div style="display:flex; gap: 8px;">
                    <button class="btn-icon" onclick="viewFeedback('${f.id}')" title="Read Feedback">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button class="btn-icon danger" onclick="deleteFeedback('${f.id}')" title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </td>
        </tr>
    `}).join('');
}

function viewFeedback(id) {
    const f = feedbackCache.find(x => x.id === id);
    if (!f) return;

    document.getElementById('feedbackDetailsContainer').innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
            <div><strong style="color:#6b7280;">ID:</strong> ${f.id}</div>
            <div><strong style="color:#6b7280;">Date:</strong> ${f.date}</div>
            <div><strong style="color:#6b7280;">Type:</strong> ${f.type}</div>
            <div><strong style="color:#6b7280;">Sender:</strong> ${f.sender}</div>
        </div>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 15px 0;">
        <div style="margin-bottom: 10px;"><strong style="color:#6b7280;">Subject:</strong> ${f.subject}</div>
        <div style="margin-bottom: 15px;"><strong style="color:#6b7280;">Rating:</strong> ${renderRatings(f.rating)} (${f.rating}/5)</div>
        <div>
            <strong style="color:#6b7280;">Feedback Body:</strong>
            <div style="margin-top:8px; padding: 12px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
                ${f.comment}
            </div>
        </div>
    `;
    document.getElementById('viewFeedbackModal').classList.add('active');
}

function closeViewModal() {
    document.getElementById('viewFeedbackModal').classList.remove('active');
}

async function deleteFeedback(id) {
    if (confirm('WARNING: Are you sure you want to permanently delete this feedback?')) {
        try {
            await apiRequest('DELETE', `/feedback/${id}`);
        } catch (err) {
            console.error('Delete feedback failed:', err);
        }
        applyFilters();
    }
}

async function applyFilters() {
    const term = (document.getElementById('searchTable')?.value || '').toLowerCase();
    const typeVal = document.getElementById('filterType')?.value || 'All';
    const hospVal = document.getElementById('filterHospital')?.value || 'All';

    const all = await loadFeedbacks();
    const filtered = all.filter(f => {
        const matchesTerm = f.sender.toLowerCase().includes(term) || f.subject.toLowerCase().includes(term) || f.id.toLowerCase().includes(term);
        const matchesType = (typeVal === 'All' || f.type === typeVal);
        const matchesHosp = (hospVal === 'All' || f.hospitalName === hospVal);
        return matchesTerm && matchesType && matchesHosp;
    });

    renderFeedback(filtered);
}

document.addEventListener('DOMContentLoaded', () => {
    applyFilters();

    const searchInput = document.getElementById('searchTable');
    const filterInput = document.getElementById('filterType');
    const hospInput = document.getElementById('filterHospital');

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (filterInput) filterInput.addEventListener('change', applyFilters);
    if (hospInput) hospInput.addEventListener('change', applyFilters);

    window.addEventListener('click', function (event) {
        if (event.target == document.getElementById('viewFeedbackModal')) {
            closeViewModal();
        }
    });
});
