// Feedback & Complaints Page Functionality

let selectedRating = 0;

function getStore() {
    return window.NexCareStore;
}

function renderSubmissions() {
    const store = getStore();
    const list = document.querySelector('.submissions-list');
    if (!store || !list) return;

    const items = store.listFeedback();

    function badgeClass(status) {
        if (status === 'Open') return 'badge-open';
        if (status === 'In Progress') return 'badge-in-progress';
        if (status === 'Resolved') return 'badge-resolved';
        return 'badge-open';
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    }

    if (!items.length) {
        list.innerHTML = `<div class="submission-card"><div class="submission-header"><div class="submission-info"><h3>No submissions</h3><p>Create one in the Submit tab.</p></div></div></div>`;
        return;
    }

    list.innerHTML = items.map(it => `
        <div class="submission-card" data-id="${escapeHtml(it.id)}">
            <div class="submission-header">
                <div class="submission-info">
                    <h3>Reference ID</h3>
                    <p class="ref-id">${escapeHtml(it.id)}</p>
                </div>
                <div class="submission-info">
                    <h3>Category</h3>
                    <p>${escapeHtml(it.category)}</p>
                </div>
                <div class="submission-info">
                    <h3>Date Submitted</h3>
                    <p>${new Date(it.createdAt).toLocaleDateString()}</p>
                </div>
                <div class="submission-info">
                    <h3>Status</h3>
                    <span class="badge ${badgeClass(it.status)}">${escapeHtml(it.status)}</span>
                </div>
            </div>
            <div style="margin-top:12px; color:#4A5565; font-size:14px; line-height:1.6;">
                ${escapeHtml(it.description)}
            </div>
            <div style="margin-top:12px; display:flex; gap:8px;">
                <button type="button" class="btn-outline-sm" data-action="delete">Delete</button>
                <button type="button" class="btn-primary-sm" data-action="resolve">Mark Resolved</button>
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', function() {
    const feedbackForm = document.getElementById('feedbackForm');
    const descriptionTextarea = document.getElementById('description');
    const charCountSpan = document.getElementById('charCount');
    const starButtons = document.querySelectorAll('.star-btn');
    
    // Initialize Star Icons with SVGs (since text stars are hard to color)
    starButtons.forEach(btn => {
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="#D1D5DC" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
        `;
    });

    // Character count for textarea
    if (descriptionTextarea && charCountSpan) {
        descriptionTextarea.addEventListener('input', function() {
            charCountSpan.textContent = this.value.length;
        });
    }
    
    // Star rating
    starButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            selectedRating = parseInt(this.dataset.rating);
            updateStarRating(selectedRating);
            document.getElementById('rating').value = selectedRating;
        });
    });
    
    // Form submission
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', handleFeedbackSubmit);
    }

    renderSubmissions();

    const submissionsList = document.querySelector('.submissions-list');
    if (submissionsList) {
        submissionsList.addEventListener('click', function(e) {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const card = e.target.closest('.submission-card[data-id]');
            if (!card) return;

            const id = card.dataset.id;
            const action = btn.dataset.action;
            const store = getStore();
            if (!store) return;

            if (action === 'delete') {
                if (!confirm('Delete this submission?')) return;
                store.deleteFeedback(id);
                renderSubmissions();
                return;
            }

            if (action === 'resolve') {
                store.updateFeedback(id, { status: 'Resolved' });
                renderSubmissions();
                return;
            }
        });
    }
});

function showFeedbackTab(tab) {
    const submitTab = document.getElementById('submitTab');
    const submissionsTab = document.getElementById('submissionsTab');
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    if (tab === 'submit') {
        submitTab.classList.add('active');
        submissionsTab.classList.remove('active');
        tabButtons[0].classList.add('active');
        tabButtons[1].classList.remove('active');
    } else {
        submitTab.classList.remove('active');
        submissionsTab.classList.add('active');
        tabButtons[0].classList.remove('active');
        tabButtons[1].classList.add('active');
    }
}

function updateStarRating(rating) {
    const starButtons = document.querySelectorAll('.star-btn');
    
    starButtons.forEach((btn, index) => {
        const svg = btn.querySelector('svg');
        const path = btn.querySelector('svg path');
        if (index < rating) {
            path.setAttribute('fill', '#FDB022');
            path.setAttribute('stroke', '#FDB022');
        } else {
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', '#D1D5DC');
        }
    });
}

function handleFeedbackSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const category = formData.get('category');
    const description = formData.get('description');
    const rating = formData.get('rating');
    
    if (!category) { alert('Please select a category'); return; }
    if (!description || description.trim().length < 10) { alert('Please provide more detail'); return; }
    if (!rating || selectedRating === 0) { alert('Please rate your experience'); return; }
    
    const store = getStore();
    const created = store?.createFeedback({
        category,
        description: description.trim(),
        rating: selectedRating,
        status: 'Open'
    });
    const refId = created?.id || ('REF-2026-' + Math.floor(Math.random() * 90000 + 10000));
    
    alert(`✓ Feedback Submitted!\nReference ID: ${refId}`);
    
    e.target.reset();
    selectedRating = 0;
    updateStarRating(0);
    document.getElementById('charCount').textContent = '0';
    
    renderSubmissions();
    setTimeout(() => { showFeedbackTab('submissions'); }, 500);
}