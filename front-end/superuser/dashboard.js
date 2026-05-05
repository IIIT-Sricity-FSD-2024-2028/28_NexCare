/**
 * superuser/dashboard.js
 * Loads live stats and recent activity from the NestJS backend API.
 * Uses the JWT token stored by session.js for authenticated requests.
 */

document.addEventListener('DOMContentLoaded', function () {
    loadDashboardStats();
    loadRecentActivity();
});

/** Decode a JWT payload without verifying signature (client-side only) */
function getJWTPayload() {
    const token = sessionStorage.getItem('nexcare_auth_token')
               || localStorage.getItem('nexcare_auth_token');
    if (!token) return null;
    try {
        const raw  = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(raw).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        );
        return JSON.parse(json);
    } catch (e) { return null; }
}

/** Make an authenticated GET request to the backend */
async function apiGet(path) {
    const token = sessionStorage.getItem('nexcare_auth_token')
               || localStorage.getItem('nexcare_auth_token');
    const host  = window.location.hostname || 'localhost';
    const res   = await fetch(`http://${host}:3001/api${path}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type':  'application/json'
        }
    });
    return res.json();
}

/** Load system-wide stats and populate the 4 stat cards */
async function loadDashboardStats() {
    try {
        const [usersResp, feedbackResp] = await Promise.all([
            apiGet('/users'),
            apiGet('/feedback')
        ]);

        const users    = usersResp.data    || [];
        const feedback = feedbackResp.data || [];

        const totalUsers    = users.length;
        const totalPatients = users.filter(u => u.role === 'patient').length;
        const activeDoctors = users.filter(u => u.role === 'doctor' && u.status === 'Active').length;
        const pendingFB     = feedback.filter(f => f.status === 'Open' || f.status === 'Pending' || !f.resolved).length;

        setStatCard('totalUsersCount',    totalUsers);
        setStatCard('totalPatientsCount', totalPatients);
        setStatCard('activeDoctorsCount', activeDoctors);
        setStatCard('pendingFeedbackCount', pendingFB);

    } catch (err) {
        console.error('Failed to load dashboard stats:', err);
        // Show fallback dashes rather than leaving "--"
        ['totalUsersCount', 'totalPatientsCount', 'activeDoctorsCount', 'pendingFeedbackCount']
            .forEach(id => setStatCard(id, 'N/A'));
    }
}

function setStatCard(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value;
        // Animate the number in
        el.style.transition = 'opacity 0.3s ease';
        el.style.opacity = '0';
        setTimeout(() => { el.style.opacity = '1'; }, 50);
    }
}

/** Load recent system activity log */
async function loadRecentActivity() {
    const tbody = document.getElementById('activityTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:#6A7282;">Loading activity...</td></tr>`;

    try {
        const resp = await apiGet('/system/activity/recent');
        const activities = resp.data || [];

        if (activities.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:#6A7282;">No system activity recorded yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        // Show most recent 10
        activities.slice(0, 10).forEach(act => {
            const date  = act.timestamp || act.createdAt || act.date || '';
            const actor = act.actor     || act.userId    || 'System';
            const action = act.action   || act.type      || '—';
            const module = act.module   || act.resource  || '—';
            const details = act.details || act.description || '—';

            const displayDate = date
                ? new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                : '—';

            tbody.innerHTML += `
                <tr>
                    <td>${displayDate}</td>
                    <td>${escapeHtml(String(actor))}</td>
                    <td>${escapeHtml(String(action))}</td>
                    <td>${escapeHtml(String(module))}</td>
                    <td>${escapeHtml(String(details))}</td>
                </tr>`;
        });

    } catch (err) {
        console.error('Failed to load activity log:', err);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:#dc2626;">Could not load activity log. Backend may be unavailable.</td></tr>`;
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Auto-refresh every 30 seconds
setInterval(function () {
    loadDashboardStats();
    loadRecentActivity();
}, 30000);
