import re

with open('/home/vivian/FFSD/28_NexCare/front-end/patient/ambulance.js', 'r') as f:
    content = f.read()

# Helper to get patientId from token
token_helper = """
function getPatientIdFromToken() {
    const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload.patientId || payload.sub;
    } catch(e) { return null; }
}
"""
if "getPatientIdFromToken" not in content:
    content = content.replace("function prefetchPatientData() {", token_helper + "\nasync function prefetchPatientData() {")
else:
    content = content.replace("function prefetchPatientData() {", "async function prefetchPatientData() {")

# Rewrite prefetchPatientData
content = re.sub(
    r'const store = window\.NexCareStore;\s*if \(\!store\) return;\s*const patient = store\.getActivePatient\(\);\s*if \(patient && patient\.phone\)',
    "const patientId = getPatientIdFromToken();\n    if (!patientId) return;\n    try {\n        const res = await window.NexCareAPI.Patients.getById(patientId);\n        const patient = res.data;\n        if (patient && patient.phone)",
    content
)
# Add catch block to prefetchPatientData
content = re.sub(
    r'(if \(contactInput\) \{\s*contactInput\.value = patient\.phone;\s*\}\s*\})\s*\}',
    r'\1\n    } catch (err) { console.error("Failed to prefetch patient", err); }\n}',
    content
)

# Rewrite handleAmbulanceRequest
old_create = r"const req = window\.NexCareStore\?\.createAmbulanceRequest\(\{\s*pickupLocation: location,\s*contact,\s*notes\s*\}\);\s*const requestId = req\?\.id \|\| \('AMB-2026-' \+ String\(Math\.floor\(Math\.random\(\) \* 900 \+ 100\)\)\.padStart\(3, '0'\)\);"

new_create = """
                const patientId = getPatientIdFromToken() || 'P001';
                window.NexCareAPI.Ambulance.createRequest({
                    patientId: patientId,
                    pickupLocation: location,
                    contact: contact,
                    notes: notes || ''
                }).then(res => {
                    const req = res.data;
                    const requestId = req?.id || ('AMB-2026-' + String(Math.floor(Math.random() * 900 + 100)).padStart(3, '0'));
"""

content = re.sub(old_create, new_create, content)

# Fix the closing braces for handleAmbulanceRequest
old_close = r"e\.target\.reset\(\);\s*renderAmbulanceRequests\(\);\s*\}\s*\}\s*\);\s*\}\s*\}\s*\);"
new_close = "e.target.reset();\n                            renderAmbulanceRequests();\n                        }\n                    }\n                );\n            }).catch(err => {\n                showNexCareModal('Error', 'Failed to dispatch ambulance.', { isError: true });\n            });\n            }\n        }\n    );"
content = re.sub(old_close, new_close, content)


# Rewrite renderAmbulanceRequests
old_render = r"const store = window\.NexCareStore;\s*const tbody = document\.querySelector\('\.status-table tbody'\);\s*if \(\!store \|\| \!tbody\) return;\s*const rows = store\.listAmbulanceRequests\(\);"
new_render = """const tbody = document.querySelector('.status-table tbody');
    if (!tbody) return;
    const patientId = getPatientIdFromToken();
    let rows = [];
    if (patientId) {
        try {
            const res = await window.NexCareAPI.get(`/ambulance/patient/${patientId}`);
            rows = res.data || [];
            // Sort by createdAt desc
            rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch(err) {
            console.error('Failed to load requests', err);
        }
    }
"""
content = re.sub(old_render, new_render, content)

# Change renderAmbulanceRequests to async
content = content.replace("function renderAmbulanceRequests() {", "async function renderAmbulanceRequests() {")


# Rewrite handleAmbulanceTableClick
old_click = r"const store = window\.NexCareStore;\s*if \(\!store\) return;\s*if \(action === 'cancel'\) \{\s*showNexCareModal\('Cancel Request', 'Are you sure you want to cancel this ambulance request\?', \{\s*isConfirm: true,\s*onConfirm: \(\) => \{\s*store\.updateAmbulanceRequest\(id, \{ status: 'Canceled' \}\);\s*renderAmbulanceRequests\(\);\s*\}\s*\}\);\s*return;\s*\}\s*if \(action === 'delete'\) \{\s*showNexCareModal\('Delete History', 'Are you sure you want to delete this record permanently\?', \{\s*isConfirm: true,\s*onConfirm: \(\) => \{\s*store\.deleteAmbulanceRequest\(id\);\s*renderAmbulanceRequests\(\);\s*\}\s*\}\);\s*return;\s*\}"

new_click = """
    if (action === 'cancel') {
        showNexCareModal('Cancel Request', 'Are you sure you want to cancel this ambulance request?', {
            isConfirm: true,
            onConfirm: async () => {
                await window.NexCareAPI.Ambulance.updateStatus(id, 'Canceled');
                renderAmbulanceRequests();
            }
        });
        return;
    }

    if (action === 'delete') {
        showNexCareModal('Delete History', 'Are you sure you want to delete this record permanently?', {
            isConfirm: true,
            onConfirm: async () => {
                await window.NexCareAPI.Ambulance.cancelRequest(id); // delete route
                renderAmbulanceRequests();
            }
        });
        return;
    }
"""
content = re.sub(old_click, new_click, content)

with open('/home/vivian/FFSD/28_NexCare/front-end/patient/ambulance.js', 'w') as f:
    f.write(content)

print("patched ambulance.js!")
