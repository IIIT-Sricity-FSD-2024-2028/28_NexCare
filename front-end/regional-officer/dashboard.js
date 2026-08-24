document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDashboard();
    } catch (err) {
        console.error("Dashboard initialization error:", err);
    }
});

async function initDashboard() {
    const userDataStr = sessionStorage.getItem('nexcare_user_data');
    if (!userDataStr) return;
    const user = JSON.parse(userDataStr);
    
    document.getElementById('userInitials').textContent = (user.name || 'RO').substring(0, 2).toUpperCase();
    document.getElementById('userNameDisplay').textContent = user.name || 'Regional Officer';

    const hRes = await window.NexCareAPI.Hospitals.getAll();
    if (!hRes.success) throw new Error("Failed to fetch hospitals");
    
    const allHospitals = hRes.data || [];
    const myHospitals = allHospitals.filter(h => h.assignedManagerId === user.id);

    document.getElementById('assignedHospitalsCount').textContent = myHospitals.length;
    
    const tableBody = document.getElementById('hospitalsTableBody');
    if (myHospitals.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #6A7282;">No hospitals assigned to you yet.</td></tr>`;
    } else {
        tableBody.innerHTML = myHospitals.map(h => `
            <tr>
                <td class="actor-cell">${h.name || 'N/A'}</td>
                <td>${h.city || 'N/A'}</td>
                <td>${h.type || 'N/A'}</td>
                <td><span class="badge-action badge-update">${h.verificationStatus || 'Unknown'}</span></td>
                <td>
                    <a href="hospital-details.html?id=${h.id}" class="btn-primary" style="padding: 6px 12px; font-size: 12px; text-decoration: none; display: inline-block;">View Details</a>
                </td>
            </tr>
        `).join('');
    }

    let totalBeds = 0;
    
    for (const h of myHospitals) {
        totalBeds += h.totalBeds || 0;
    }
    
    document.getElementById('availableBedsCount').textContent = totalBeds;
    document.getElementById('totalDoctorsCount').textContent = "View details";
    document.getElementById('lowStockCount').textContent = "View details";
}
