const fs = require('fs');

const getLayout = (title, activeMenu, content) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>NexCare HMS - ${title}</title>
    <meta name="description" content="Hospital Management System - ${title}">
    
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="logo.css">
    <script defer src="logo.js"></script>
    <style>
        /* Specific Styles */
        .form-input, .form-select {
            height: 38px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 4px 12px;
            font-size: 13px;
        }
        .btn-dark {
            height: 38px;
            background: #0a0a0a;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 20px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            white-space: nowrap;
        }
        .btn-dark:hover { background: #1a1a1a; }
        
        .status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
        }
        .status-admin { background: #dbeafe; color: #1e40af; }
        .status-maintenance { background: #fee2e2; color: #991b1b; }
        .status-active { background: #dcfce7; color: #166534; }
        .status-waiting { background: #fef3c7; color: #92400e; }
        
        /* Table / Modal specific */
        .table-wrapper { overflow-y: auto; max-height: 500px; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th, td { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
        th { background: #f9fafb; color: #6b7280; font-weight: 600; text-transform: uppercase; font-size: 11px; }
        tr:hover { background: #f9fafb; }
        .action-buttons { display: flex; gap: 8px; }
        .action-btn { width: 32px; height: 32px; border: 1px solid #e5e7eb; background: white; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .action-btn:hover { background: #f9fafb; }
    </style>
</head>
<body>
<div class="layout">
    <div class="sidebar">
        <nex-care-logo></nex-care-logo>
        <ul class="menu">
            <li class="${activeMenu === 'Dashboard' ? 'active' : ''}">
                <a href="dashboard.html">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    Dashboard
                </a>
            </li>
            <li class="${activeMenu === 'Inventory' ? 'active' : ''}">
                <a href="inventory.html">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3 8 12 13 21 8"/></svg>
                    Inventory
                </a>
            </li>
            <li class="${activeMenu === 'Staff' ? 'active' : ''}">
                <a href="staff_scheduling.html">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="4"/><path d="M17 11a4 4 0 1 0-4-4"/><path d="M3 21v-2a4 4 0 0 1 6-3.46"/><path d="M16 21v-2a4 4 0 0 0-3-3.87"/></svg>
                    Staff Scheduling
                </a>
            </li>
            <li class="${activeMenu === 'Bill' ? 'active' : ''}">
                <a href="generate-bill.html">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V8z"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="9" x2="8" y2="9"/></svg>
                    Generate Bill
                </a>
            </li>
            <li class="${activeMenu === 'Feedback' ? 'active' : ''}">
                <a href="feedback.html">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>
                    Feedback
                </a>
            </li>
        </ul>
        <div class="logout">
            <button type="button" class="logout-btn">
                <svg class="logout-icon" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 17l5-5-5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12H9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                <span>Logout</span>
            </button>
        </div>
    </div>
    
    <div class="main">
        <div class="topbar">
            <div class="user">Admin User</div>
        </div>
${content}
    </div>
</div>
${activeMenu === 'Staff' ? '<script src="staff_scheduling.js"></script>' : ''}
${activeMenu === 'Feedback' ? '<script src="feedback.js"></script>' : ''}
</body>
</html>`;

const staffContent = `
    <div class="header-row" style="display:flex; justify-content: space-between; align-items:center;">
        <div>
            <h1>Staff Scheduling</h1>
            <div class="sub">Manage non-clinical staff shifts across administrative departments.</div>
        </div>
        <button class="btn-dark" onclick="alert('Add Shift')">+ Add Shift</button>
    </div>
    
    <div class="card" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items:center;">
        <div style="display: flex; gap: 10px;">
            <select class="form-select"><option>All Departments</option><option>IT Support</option><option>Administration</option><option>Maintenance</option></select>
            <select class="form-select"><option>Today</option><option>This Week</option><option>Next Week</option></select>
        </div>
        <div>
            <input type="month" class="form-input" value="2026-03">
        </div>
    </div>
    
    <div class="card">
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Staff Name</th>
                        <th>Role</th>
                        <th>Department</th>
                        <th>Shift (Time)</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="staffTableBody"></tbody>
            </table>
        </div>
    </div>
`;

const staffJs = `
const staffData = [
    {name: "Deekshitha", role: "Frontend Lead", dept: "IT Support", shift: "Morning (08:00 - 16:00)", status: "On Duty"},
    {name: "Poornasri", role: "UI Developer", dept: "IT Support", shift: "Morning (08:00 - 16:00)", status: "Scheduled"},
    {name: "Nikitha", role: "Backend Engineer", dept: "Administration", shift: "Afternoon (14:00 - 22:00)", status: "On Duty"},
    {name: "Poorvishree", role: "Database Admin", dept: "Maintenance", shift: "Morning (08:00 - 16:00)", status: "On Leave"}
];

function renderStaff() {
    const tbody = document.getElementById('staffTableBody');
    tbody.innerHTML = staffData.map(s => {
        let badgeColor = s.status === 'On Duty' ? 'status-active' : s.status === 'On Leave' ? 'status-maintenance' : 'status-waiting';
        return \`
        <tr>
            <td><strong>\${s.name}</strong></td>
            <td>\${s.role}</td>
            <td>\${s.dept}</td>
            <td>\${s.shift}</td>
            <td><span class="status-badge \${badgeColor}">\${s.status}</span></td>
            <td>
                <button class="action-btn" onclick="alert('Edit Shift')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            </td>
        </tr>
    \`}).join('');
}
document.addEventListener('DOMContentLoaded', renderStaff);
`;

const feedbackContent = `
    <div class="header-row">
        <div>
            <h1>Feedback & Reports</h1>
            <div class="sub">View and respond to staff and facility feedbacks.</div>
        </div>
    </div>

    <div class="card" style="margin-bottom: 20px; display: flex; gap: 10px;">
        <input type="text" id="searchFeedback" class="form-input" placeholder="Search feedback..." style="width: 300px;">
        <select class="form-select" id="filterType"><option value="all">All Types</option><option value="Visitor">Visitor</option><option value="Staff">Staff</option></select>
    </div>
    
    <div class="card">
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Sender Type</th>
                        <th>Sender</th>
                        <th>Rating</th>
                        <th>Subject</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="feedbackTableBody"></tbody>
            </table>
        </div>
    </div>
`;

const feedbackJs = `
const feedbackData = [
    {date: "2026-03-30", type: "Visitor", sender: "John Doe", rating: 5, subject: "Clean Environment", comment: "The waiting areas and administrative corridors were extremely clean."},
    {date: "2026-03-31", type: "Visitor", sender: "Jane Smith", rating: 3, subject: "Parking Issues", comment: "Hard to find a parking spot near the main administrative entrance."},
    {date: "2026-04-01", type: "Staff", sender: "Alice J.", rating: 4, subject: "System Speed", comment: "The new HMS is good but sometimes slow to load inventory files."}
];

function renderFeedback(data = feedbackData) {
    const tbody = document.getElementById('feedbackTableBody');
    tbody.innerHTML = data.map(f => \`
        <tr>
            <td>\${f.date}</td>
            <td><span class="status-badge \${f.type === 'Visitor' ? 'status-waiting' : 'status-admin'}">\${f.type}</span></td>
            <td><strong>\${f.sender}</strong></td>
            <td>\${'&#9733;'.repeat(f.rating)}\${'&#9734;'.repeat(5-f.rating)}</td>
            <td>\${f.subject}</td>
            <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">\${f.comment}</td>
            <td>
                <button class="action-btn" onclick="alert('Viewing feedback: \${f.subject}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
            </td>
        </tr>
    \`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    renderFeedback();
    
    document.getElementById('filterType').addEventListener('change', e => {
        const val = e.target.value;
        const filtered = val === 'all' ? feedbackData : feedbackData.filter(f => f.type === val);
        renderFeedback(filtered);
    });
    document.getElementById('searchFeedback').addEventListener('input', e => {
        const t = e.target.value.toLowerCase();
        renderFeedback(feedbackData.filter(f => f.subject.toLowerCase().includes(t) || f.sender.toLowerCase().includes(t)));
    });
});
`;

fs.writeFileSync('staff_scheduling.html', getLayout('Staff Scheduling', 'Staff', staffContent));
fs.writeFileSync('staff_scheduling.js', staffJs);
fs.writeFileSync('feedback.html', getLayout('Feedback', 'Feedback', feedbackContent));
fs.writeFileSync('feedback.js', feedbackJs);

console.log('Successfully generated standardized pages.');