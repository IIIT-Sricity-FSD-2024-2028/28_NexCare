let patients = [
    {
        name: "Sarah Johnson", id: "PT2355", status: "In Consultation", statusClass: "status-consultation",
        time: "09:00 AM", location: "Cardiology - Room 201",
        history: [
            {label: "Reception", time: "08:15 AM", state: "completed"}, 
            {label: "Waiting Area", time: "08:50 AM", state: "completed"}, 
            {label: "Cardiology", time: "09:10 AM", state: "waiting"}
        ]
    },
    {
        name: "Michael Chen", id: "PT2365", status: "In ER", statusClass: "status-er",
        time: "10:15 AM", location: "X-Ray Lab",
        history: [
            {label: "Reception", time: "10:07 AM", state: "completed"}, 
            {label: "Waiting Area", time: "10:15 AM", state: "completed"}, 
            {label: "X-Ray Lab", time: "10:30 AM", state: "waiting"}
        ]
    }
];

function renderPatients() {
    const container = document.getElementById('patientsContainer');
    container.innerHTML = patients.map((p, idx) => `
        <div class="card" style="margin-bottom: 15px; border: 1px solid #e5e7eb;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="font-weight: 600; font-size: 15px;">${p.name}</div>
                    <span class="status-badge ${p.statusClass}">${p.status}</span>
                </div>
                <button class="update-btn" onclick="updateLocation('${p.id}')">Update Location</button>
            </div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 15px;">
                ID: ${p.id} &bull; Checked in: ${p.time} &bull; &#128205; ${p.location}
            </div>
            <div>
                <div style="font-size: 11px; font-weight: 600; margin-bottom: 10px; color: #6b7280;">Movement History</div>
                <div class="movement-timeline">
                    ${p.history.map((h, i) => `
                        <div class="movement-step">
                            <div class="step-icon ${h.state}">
                                ${h.state === 'completed' 
                                  ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' 
                                  : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'}
                            </div>
                            <div class="step-label">${h.label}</div>
                            <div class="step-time">${h.time}</div>
                        </div>
                        ${i < p.history.length - 1 ? '<div style="color: #d1d5db;">&rarr;</div>' : ''}
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

function handleCheckin() {
    const id = document.getElementById('patientIdInput').value.trim();
    const purpose = document.getElementById('visitPurposeInput').value.trim();
    
    if (!id || !purpose) {
        alert('Please fill in both Patient ID and Visit Purpose to check them in.');
        return;
    }
    
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newPatient = {
        name: isNaN(id) ? id : `Unknown (${id})`,
        id: id,
        status: "Waiting",
        statusClass: "status-waiting",
        time: timeNow,
        location: "Reception",
        history: [
            {label: "Reception", time: timeNow, state: "completed"}
        ]
    };
    
    patients.unshift(newPatient); // Add to top
    renderPatients();
    
    alert(`Successfully checked in patient ${id} for ${purpose}`);
    
    document.getElementById('patientIdInput').value = '';
    document.getElementById('visitPurposeInput').value = '';
}

function updateLocation(id) {
    const p = patients.find(pat => pat.id === id);
    if(!p) return;
    
    const loc = prompt(`Update current location for ${p.name}:`);
    if (loc && loc.trim() !== '') {
        // Find previous 'waiting' and mark 'completed'
        p.history.forEach(h => {
             if(h.state === 'waiting') h.state = 'completed';
        });
        
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        p.history.push({ label: loc, time: timeNow, state: 'waiting' });
        p.location = loc;
        renderPatients();
    }
}

document.addEventListener('DOMContentLoaded', renderPatients);
