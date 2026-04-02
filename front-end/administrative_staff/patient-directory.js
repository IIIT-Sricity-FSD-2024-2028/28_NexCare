let allPatients = [];

document.addEventListener('DOMContentLoaded', () => {
    if (window.NexCareDB) {
        allPatients = window.NexCareDB.getTable('patients');
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
