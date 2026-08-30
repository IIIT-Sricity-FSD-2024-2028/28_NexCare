/* ─────────────────────────────────────────────────────────────────────────────
   Small helpers every portal page re-implemented: the signed-in user, currency
   and date formatting, HTML escaping, and a toast.

   Deliberately plain globals rather than a module — the portals load scripts
   with <script src>, not import, and mixing the two would mean a build step.
   Load AFTER shared/api.js.
   ───────────────────────────────────────────────────────────────────────────── */

/** The signed-in user, from the cached session or the JWT payload. */
function currentUser() {
    try {
        const raw = sessionStorage.getItem('nexcare_user_data');
        if (raw) return JSON.parse(raw);
    } catch (e) { /* fall through to the token */ }

    const token = sessionStorage.getItem('nexcare_auth_token') ||
                  localStorage.getItem('nexcare_auth_token');
    if (!token) return null;
    try {
        const p = JSON.parse(atob(token.split('.')[1]));
        // The JWT calls the user id `sub`; the rest of the app calls it `id`.
        return { id: p.sub, name: p.name, email: p.email, role: p.role,
                 patientId: p.patientId, hospitalId: p.hospitalId };
    } catch (e) {
        return null;
    }
}

/** Rupees, Indian digit grouping, no decimals unless the value is small. */
function money(value) {
    const n = Number(value) || 0;
    const decimals = Math.abs(n) > 0 && Math.abs(n) < 100 && !Number.isInteger(n) ? 2 : 0;
    return '₹' + n.toLocaleString('en-IN', {
        minimumFractionDigits: decimals, maximumFractionDigits: decimals,
    });
}

/** A rate stored as a fraction, shown as a percentage. */
function percent(fraction, digits = 1) {
    return (Number(fraction) * 100).toFixed(digits) + '%';
}

function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

/** Initials for the header avatar. */
function initials(name) {
    return String(name || '?')
        .replace(/^Dr\.?\s+/i, '')
        .split(/\s+/).filter(Boolean).slice(0, 2)
        .map(w => w[0].toUpperCase()).join('') || '?';
}

/** Fill in the standard header block. Every portal page has the same one. */
function fillHeader(roleLabel) {
    const user = currentUser();
    if (!user) return null;
    setText('userNameDisplay', user.name || 'User');
    setText('userRoleDisplay', roleLabel || '');
    const avatar = document.getElementById('userAvatar');
    if (avatar) avatar.textContent = initials(user.name);
    return user;
}

function notify(message, type = 'info') {
    // Prefer the shared component when the page loaded it.
    if (window.NexCareUI && typeof window.NexCareUI.showToast === 'function') {
        window.NexCareUI.showToast(message, type);
        return;
    }
    const n = document.createElement('div');
    Object.assign(n.style, {
        position: 'fixed', bottom: '20px', right: '20px', padding: '12px 20px',
        borderRadius: '8px', color: '#FFFFFF', fontWeight: '600', fontSize: '14px',
        zIndex: '99999', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxWidth: '360px',
        background: type === 'success' ? '#10B981' : (type === 'error' ? '#EF4444' : '#3B82F6'),
    });
    n.textContent = message;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3500);
}

/**
 * Today in the same format appointments store (`dateLabel`), so "today's
 * schedule" can be a string comparison rather than a date parse of 100 rows.
 */
function todayLabel() {
    return new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
}

/** Sort key for an appointment's date + time labels. */
function appointmentTime(apt) {
    const t = Date.parse(`${apt.dateLabel} ${apt.timeLabel}`);
    return Number.isNaN(t) ? 0 : t;
}
