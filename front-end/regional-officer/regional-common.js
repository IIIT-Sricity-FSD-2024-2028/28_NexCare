// Shared helpers for Regional Officer portal pages.

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

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function initRegionalHeader() {
    const user = getCurrentUser();
    if (!user) return null;
    const initials = document.getElementById('userInitials');
    const name = document.getElementById('userNameDisplay');
    const hero = document.getElementById('heroGreeting');
    if (initials) initials.textContent = (user.name || 'RO').substring(0, 2).toUpperCase();
    if (name) name.textContent = user.name || 'Regional Officer';
    if (hero) hero.textContent = `Welcome back, ${user.name || 'Regional Officer'}`;
    return user;
}

function statusBadge(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'verified') return '<span class="badge badge-success">Verified</span>';
    if (s.includes('pending')) return '<span class="badge badge-warning">Pending</span>';
    if (s === 'rejected') return '<span class="badge badge-critical">Rejected</span>';
    return `<span class="badge badge-neutral">${escapeHtml(status || 'Unknown')}</span>`;
}

function feedbackStatusBadge(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'open') return '<span class="badge badge-open">Open</span>';
    if (s.includes('progress')) return '<span class="badge badge-progress">In Progress</span>';
    if (s === 'resolved') return '<span class="badge badge-resolved">Resolved</span>';
    return `<span class="badge badge-neutral">${escapeHtml(status || 'Unknown')}</span>`;
}

function severityBadge(severity) {
    const map = {
        critical: 'badge-critical',
        warning: 'badge-warning',
        info: 'badge-info',
    };
    const cls = map[severity] || 'badge-neutral';
    return `<span class="badge ${cls}">${escapeHtml(severity)}</span>`;
}

function renderStars(rating) {
    const n = Math.max(0, Math.min(5, Number(rating) || 0));
    const full = '★'.repeat(n);
    const empty = '☆'.repeat(5 - n);
    return `<span class="stars" aria-label="Rating ${n} out of 5">${full}${empty}</span>`;
}

function metricClass(metric, value, thresholds) {
    const t = thresholds[metric];
    if (!t) return '';
    if (t.bad && value >= t.bad) return 'bad';
    if (t.warn && value >= t.warn) return 'warn';
    if (t.lowBad && value <= t.lowBad) return 'bad';
    if (t.lowWarn && value <= t.lowWarn) return 'warn';
    return 'good';
}

function formatDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
        });
    } catch {
        return iso;
    }
}
