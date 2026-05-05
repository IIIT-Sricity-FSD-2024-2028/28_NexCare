let allPatients = [];

// ---------------- API HELPER ----------------
function apiGet(path) {
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    const host = window.location.hostname || 'localhost';
    return fetch(`http://${host}:3001/api${path}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    }).then(r => r.json());
}

document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.getElementById('patientsTableBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#6b7280;">Loading patients…</td></tr>`;

    try {
        const resp = await apiGet('/patients');
        allPatients = resp.data || [];
    } catch (err) {
        console.error('Failed to load patients:', err);
        allPatients = [];
    }

    renderPatients(allPatients);

    document.getElementById('searchInput').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        const filtered = allPatients.filter(p =>
            (p.fullName && p.fullName.toLowerCase().includes(term)) ||
            (p.email && p.email.toLowerCase().includes(term)) ||
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
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px; color: #6b7280;">No patients found.</td></tr>`;
        return;
    }

    tbody.innerHTML = patients.map(p => {
        const statusClass = p.status === 'Active' ? 'active' : (p.status === 'Critical' ? 'critical' : '');
        return `
            <tr>
                <td><strong>${p.patientIdDisplay || p.id}</strong></td>
                <td>${p.fullName}</td>
                <td>${p.email}</td>
                <td>${p.phone || '-'}</td>
                <td>${p.bloodGroup || '-'}</td>
                <td>${p.age || '-'}</td>
                <td><span class="badge ${statusClass}">${p.status || 'Registered'}</span></td>
            </tr>
        `;
    }).join('');
}
