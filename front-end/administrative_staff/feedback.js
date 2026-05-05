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
        const resp = await apiGet('/feedback');
        feedbackCache = (resp.data || []).map(f => ({
            id: f.id,
            date: f.createdAt ? f.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
            type: f.type || 'Patient',
            sender: f.sender || 'Anonymous',
            rating: f.rating || 0,
            subject: f.subject || 'Feedback',
            comment: f.summary || f.description || ''
        }));
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
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#6b7280;">No feedback entries found.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(f => {
        let badgeColor = f.type === 'Patient' ? 'status-patient' : 'status-staff';
        return `
        <tr>
            <td><strong>${f.id}</strong></td>
            <td>${f.date}</td>
            <td><span class="status-badge ${badgeColor}">${f.type}</span></td>
            <td>${f.sender}</td>
            <td>${f.subject}</td>
            <td>${renderRatings(f.rating)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn" onclick="viewFeedback('${f.id}')" title="Read Feedback">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button class="action-btn" onclick="deleteFeedback('${f.id}')" title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
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
        <div><strong>ID:</strong> ${f.id}</div>
        <div><strong>Date:</strong> ${f.date}</div>
        <div><strong>Type:</strong> ${f.type}</div>
        <div><strong>Sender:</strong> ${f.sender}</div>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 10px 0;">
        <div><strong>Subject:</strong> ${f.subject}</div>
        <div><strong>Rating:</strong> ${renderRatings(f.rating)} (${f.rating}/5)</div>
        <div style="margin-top: 10px;"><strong>Feedback Body:</strong><br> <span style="display:block; margin-top:5px;">${f.comment}</span></div>
    `;
    document.getElementById('viewFeedbackModal').classList.add('active');
}

function closeViewModal() {
    document.getElementById('viewFeedbackModal').classList.remove('active');
}

async function deleteFeedback(id) {
    if (confirm('Are you sure you want to permanently delete this feedback?')) {
        try {
            await apiRequest('DELETE', `/feedback/${id}`);
        } catch (err) {
            console.error('Delete feedback failed:', err);
        }
        applyFilters();
    }
}

function openAddFeedbackModal() {
    document.getElementById('addFeedbackForm').reset();
    document.getElementById('addFeedbackModal').classList.add('active');
}

function closeAddFeedbackModal() {
    document.getElementById('addFeedbackModal').classList.remove('active');
}

async function saveFeedback(e) {
    e.preventDefault();

    const type = document.getElementById('newType').value;
    const name = document.getElementById('newName').value.trim();
    const subject = document.getElementById('newSubject').value.trim();
    const rating = parseInt(document.getElementById('newRating').value);
    const comment = document.getElementById('newDesc').value.trim();

    if (!type || !name || !subject || !comment) {
        alert("Please fill all required fields correctly.");
        return;
    }

    try {
        await apiRequest('POST', '/feedback', {
            type,
            sender: name,
            rating,
            subject,
            summary: comment,
            status: "Open"
        });
    } catch (err) {
        alert("Failed to save feedback.");
        console.error(err);
        return;
    }

    closeAddFeedbackModal();
    applyFilters();
}

async function applyFilters() {
    const term = document.getElementById('searchTable').value.toLowerCase();
    const typeVal = document.getElementById('filterType').value;

    const all = await loadFeedbacks();
    const filtered = all.filter(f => {
        const matchesTerm = f.sender.toLowerCase().includes(term) || f.subject.toLowerCase().includes(term) || f.id.toLowerCase().includes(term);
        const matchesType = (typeVal === 'All' || f.type === typeVal);
        return matchesTerm && matchesType;
    });

    renderFeedback(filtered);
}

document.addEventListener('DOMContentLoaded', () => {
    applyFilters();

    document.getElementById('searchTable').addEventListener('input', applyFilters);
    document.getElementById('filterType').addEventListener('change', applyFilters);

    window.addEventListener('click', function (event) {
        if (event.target == document.getElementById('addFeedbackModal')) {
            closeAddFeedbackModal();
        } else if (event.target == document.getElementById('viewFeedbackModal')) {
            closeViewModal();
        }
    });
});
