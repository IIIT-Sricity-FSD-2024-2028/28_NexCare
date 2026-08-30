import re

with open('/home/vivian/FFSD/28_NexCare/front-end/ambulance/app.js', 'r') as f:
    content = f.read()

# Replace listAllAmbulanceRequests
content = re.sub(
    r'const dbReqs = await window\.NexCareStore\.listAllAmbulanceRequests\(\);',
    r'const res = await window.NexCareAPI.Ambulance.getAllRequests();\n            const dbReqs = res.data;',
    content
)

# Replace updateAmbulanceRequest
content = re.sub(
    r'window\.NexCareStore\.updateAmbulanceRequest\(([^,]+),\s*(\{[^}]+\})\);',
    r'window.NexCareAPI.Ambulance.updateRequest(\1, \2);',
    content
)

# Replace deleteAmbulanceRequest
content = re.sub(
    r'window\.NexCareStore\.deleteAmbulanceRequest\(([^)]+)\);',
    r'window.NexCareAPI.Ambulance.cancelRequest(\1);',
    content
)

# Replace logActivity
content = re.sub(
    r'window\.NexCareStore\.logActivity\(([^,]+),\s*([^,]+),\s*([^)]+)\);',
    r'console.log("Activity:", \1, \2, \3);',
    content
)

with open('/home/vivian/FFSD/28_NexCare/front-end/ambulance/app.js', 'w') as f:
    f.write(content)

print("patched ambulance/app.js!")
