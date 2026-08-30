let allPatients = [];

// ---------------- API HELPERS ----------------
function authToken() {
    return sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
}

function apiBase() {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:3001/api`;
}

function apiGet(path) {
    return fetch(`${apiBase()}${path}`, {
        headers: { 'Authorization': `Bearer ${authToken()}`, 'Content-Type': 'application/json' }
    }).then(r => r.json());
}

// Throws with the API's message so upload/middleware errors reach the user
async function apiSend(method, path, body, isMultipart) {
    const headers = { 'Authorization': `Bearer ${authToken()}` };
    if (!isMultipart) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${apiBase()}${path}`, { method, headers, body });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || payload.success === false) {
        throw new Error(payload.message || `Request failed (${res.status})`);
    }
    return payload;
}

document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.getElementById('patientsTableBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:20px;color:#6b7280;">Loading patients…</td></tr>`;

    try {
        const resp = await apiGet('/users?role=patient');
        allPatients = resp.data || [];
    } catch (err) {
        console.error('Failed to load patients:', err);
        alert('Failed to load patients. Please check your connection and try again.');
        allPatients = [];
    }

    renderPatients(allPatients);

    document.getElementById('searchInput').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        const filtered = allPatients.filter(p =>
            ((p.name || p.fullName) && (p.name || p.fullName).toLowerCase().includes(term)) ||
            (p.email && p.email.toLowerCase().includes(term)) ||
            (p.patientId && p.patientId.toLowerCase().includes(term)) ||
            (p.patientIdDisplay && p.patientIdDisplay.toLowerCase().includes(term)) ||
            (p.id && p.id.toLowerCase().includes(term))
        );
        renderPatients(filtered);
    });
});

function renderPatients(patients) {
    const tbody = document.getElementById('patientsTableBody');
    if (!tbody) return;

    if (patients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 30px; color: #6b7280;">No patients found.</td></tr>`;
        return;
    }

    tbody.innerHTML = patients.map(p => {
        const statusClass = p.status === 'Active' ? 'active' : (p.status === 'Critical' ? 'critical' : '');
        const patientId = p.patientId || p.patientIdDisplay || p.id;
        return `
            <tr>
                <td><strong>${patientId}</strong></td>
                <td>${p.name || p.fullName || '-'}</td>
                <td>${p.email || '-'}</td>
                <td>${p.phone || '-'}</td>
                <td>${p.bloodGroup || '-'}</td>
                <td>${p.age || '-'}</td>
                <td><span class="badge ${statusClass}">${p.status || 'Registered'}</span></td>
                <td>
                    <button class="btn-outline" style="padding:4px 10px; font-size:11px;"
                            onclick="openDocsModal('${patientId}', '${(p.name || p.fullName || '').replace(/'/g, "\\'")}')">
                        Documents
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ---------------- PATIENT DOCUMENTS ----------------
let currentPatientId = null;

window.openDocsModal = async function (patientId, patientName) {
    currentPatientId = patientId;
    document.getElementById('docsTitle').textContent = `Documents — ${patientName} (${patientId})`;
    document.getElementById('docFile').value = '';
    document.getElementById('docDescription').value = '';
    showDocError('');
    showDocStatus('');
    document.getElementById('docsModal').classList.add('active');
    await loadDocuments();
};

window.closeDocsModal = function () {
    currentPatientId = null;
    document.getElementById('docsModal').classList.remove('active');
};

function showDocError(message) {
    const box = document.getElementById('docError');
    box.textContent = message;
    box.style.display = message ? 'block' : 'none';
}

function showDocStatus(message) {
    const box = document.getElementById('docStatus');
    box.textContent = message;
    box.style.display = message ? 'block' : 'none';
}

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function loadDocuments() {
    const list = document.getElementById('docList');
    list.innerHTML = `<div class="small" style="color:#6b7280;">Loading…</div>`;

    try {
        const resp = await apiGet(`/uploads?entityType=patient&entityId=${encodeURIComponent(currentPatientId)}`);
        const docs = resp.data || [];

        if (docs.length === 0) {
            list.innerHTML = `<div class="small" style="color:#9ca3af; font-style:italic;">No documents uploaded yet.</div>`;
            return;
        }

        list.innerHTML = docs.map(d => `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:8px 0; border-bottom:1px solid #e5e7eb;">
                <div style="min-width:0;">
                    <div style="font-size:13px; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${d.originalName}</div>
                    <div class="small" style="color:#6b7280;">
                        ${formatSize(d.sizeBytes)} • ${new Date(d.uploadedAt).toLocaleString()}${d.description ? ` • ${d.description}` : ''}
                    </div>
                </div>
                <div style="display:flex; gap:6px; flex-shrink:0;">
                    <button class="btn-outline" style="padding:4px 8px; font-size:11px;" onclick="downloadDocument('${d.id}', '${d.originalName.replace(/'/g, "\\'")}')">Download</button>
                    <button class="btn-outline" style="padding:4px 8px; font-size:11px; color:#b91c1c;" onclick="deleteDocument('${d.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = `<div class="small" style="color:#b91c1c;">Failed to load documents: ${err.message}</div>`;
    }
}

window.uploadDocument = async function () {
    const input = document.getElementById('docFile');
    const file = input.files && input.files[0];

    if (!file) {
        showDocError('Choose a file to upload first.');
        return;
    }

    // multipart/form-data — the field name must be "file", which is what
    // FileInterceptor('file') reads on the backend
    const form = new FormData();
    form.append('file', file);
    form.append('entityType', 'patient');
    form.append('entityId', currentPatientId);
    form.append('description', document.getElementById('docDescription').value.trim());

    const button = document.getElementById('docUploadBtn');
    button.disabled = true;
    showDocError('');
    showDocStatus(`Uploading ${file.name}…`);

    try {
        await apiSend('POST', '/uploads', form, true);
        showDocStatus(`${file.name} uploaded.`);
        input.value = '';
        document.getElementById('docDescription').value = '';
        await loadDocuments();
    } catch (err) {
        showDocStatus('');
        // e.g. "Unsupported file type ..." or "File is too large. Maximum size is 5 MB."
        showDocError(err.message);
    } finally {
        button.disabled = false;
    }
};

window.downloadDocument = async function (fileId, fileName) {
    try {
        // The download route needs the Authorization header, so fetch the bytes
        // and hand the browser a blob rather than navigating to the URL
        const res = await fetch(`${apiBase()}/uploads/${fileId}/download`, {
            headers: { 'Authorization': `Bearer ${authToken()}` }
        });
        if (!res.ok) throw new Error(`Download failed (${res.status})`);

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    } catch (err) {
        showDocError(err.message);
    }
};

window.deleteDocument = async function (fileId) {
    if (!confirm('Delete this document? This cannot be undone.')) return;

    try {
        await apiSend('DELETE', `/uploads/${fileId}`);
        showDocStatus('Document deleted.');
        await loadDocuments();
    } catch (err) {
        showDocError(err.message);
    }
};
