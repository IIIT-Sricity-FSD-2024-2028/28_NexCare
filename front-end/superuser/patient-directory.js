let allPatients = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchPatients();

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

function fetchPatients() {
    if (window.NexCareDB) {
        allPatients = window.NexCareDB.getTable('patients');
    }
    renderPatients(allPatients);
}

function deletePatient(id) {
    if (confirm("WARNING: Are you sure you want to permanently delete this patient from the NexCare records?")) {
        if (window.NexCareDB) {
            window.NexCareDB.deleteRow('patients', id);
        }
        fetchPatients();
    }
}

function renderPatients(patients) {
    const tbody = document.getElementById('patientsTableBody');
    if (!tbody) return;

    if (patients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px; color: #6b7280;">No patients found.</td></tr>`;
        return;
    }

    tbody.innerHTML = patients.map(p => {
        const statusClass = p.status === 'Active' ? 'Active' : (p.status === 'Critical' ? 'Critical' : 'Registered');
        
        let dateString = "N/A";
        if (p.createdAt) {
            dateString = new Date(p.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        }
        
        return `
            <tr>
                <td style="font-weight: 500; color: #111827;">${p.patientIdDisplay || p.id}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div style="width:30px; height:30px; border-radius:50%; background:#e0e7ff; color:#3730a3; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:12px;">
                            ${p.fullName ? p.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        ${p.fullName || 'Unknown'}
                    </div>
                </td>
                <td>${p.email}</td>
                <td>${p.phone || '-'}</td>
                <td style="color: #6B7280;">${dateString}</td>
                <td><span class="badge ${statusClass}">${p.status || 'Registered'}</span></td>
                <td>
                    <button class="btn-icon danger" onclick="deletePatient('${p.id}')" title="Delete Patient">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}
