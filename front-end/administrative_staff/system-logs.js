// ---------------- API HELPER ----------------
function getHospitalId() {
    try {
        const user = JSON.parse(sessionStorage.getItem('nexcare_user_data') || localStorage.getItem('nexcare_user_data') || '{}');
        return user.hospitalId || '';
    } catch { return ''; }
}

function apiGet(path) {
    return window.NexCareAPI.get(path);
}

// ---------------- STATE ----------------
let currentStream = 'access';
let refreshTimer = null;

// Fields shown in the message column; everything else goes to Details
const SUMMARY_KEYS = ['timestamp', 'level', 'message'];

document.addEventListener('DOMContentLoaded', () => {
    refreshLogs();

    document.getElementById('autoRefresh').addEventListener('change', (e) => {
        if (e.target.checked) {
            // Matches the server's flush interval — entries land on disk every 5s
            refreshTimer = setInterval(refreshLogs, 5000);
        } else {
            clearInterval(refreshTimer);
            refreshTimer = null;
        }
    });
});

window.selectStream = function (stream) {
    currentStream = stream;
    document.querySelectorAll('.log-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.stream === stream);
    });
    refreshLogs();
};

window.refreshLogs = async function () {
    await Promise.all([loadEntries(), loadFiles()]);
};

// ---------------- LOG FILES ON DISK ----------------
async function loadFiles() {
    const container = document.getElementById('logFiles');
    if (!container) return;

    try {
        const resp = await apiGet('/logs/files');
        const files = resp.data || [];

        if (files.length === 0) {
            container.innerHTML = `<div class="card stat"><p>Log files</p><h3>0</h3><span class="trend neutral">Nothing written yet</span></div>`;
            return;
        }

        container.innerHTML = files.map(f => `
            <div class="card stat">
                <p class="mono">${f.name}</p>
                <h3>${formatSize(f.sizeBytes)}</h3>
                <span class="trend neutral">Updated ${new Date(f.modifiedAt).toLocaleTimeString()}</span>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = `<div class="card stat"><p>Log files</p><h3>—</h3><span class="trend down">${err.message}</span></div>`;
    }
}

// ---------------- LOG ENTRIES ----------------
async function loadEntries() {
    const tbody = document.getElementById('logTableBody');
    if (!tbody) return;

    try {
        const resp = await apiGet(`/logs?stream=${currentStream}&limit=200`);
        const entries = resp.data || [];

        if (entries.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:#6b7280;">No entries in the ${currentStream} log yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = entries.map(e => `
            <tr>
                <td class="mono">${e.timestamp ? new Date(e.timestamp).toLocaleString() : '-'}</td>
                <td><span class="lvl ${e.level || 'info'}">${e.level || 'info'}</span></td>
                <td>${escapeHtml(e.message || '')}</td>
                <td class="log-detail mono">${escapeHtml(details(e))}</td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="color:#b91c1c; padding:20px;">Failed to load logs: ${escapeHtml(err.message)}</td></tr>`;
    }
}

/** Everything except the summary fields, as compact key=value pairs */
function details(entry) {
    return Object.entries(entry)
        .filter(([key, value]) => !SUMMARY_KEYS.includes(key) && value !== undefined && value !== null && value !== '')
        .map(([key, value]) => {
            const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
            // Stack traces are long — show the first frame, the file has the rest
            return `${key}=${text.length > 120 ? text.slice(0, 120) + '…' : text}`;
        })
        .join('  ');
}

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
