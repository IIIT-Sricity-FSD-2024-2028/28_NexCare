import urllib.request
import json

BASE = 'http://localhost:3001/api'

def call(method, path, body=None, token=None):
    url = BASE + path
    data = json.dumps(body).encode() if body else None
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())

p = 0; f = 0

def check(name, cond, note=''):
    global p, f
    sym = '✅' if cond else '❌'
    print(f'{sym} {name:<35} {note}')
    if cond: p += 1
    else: f += 1

print('=== NexCare JWT Guard & RBAC Verification ===\n')

# Login — get tokens
pLogin = call('POST', '/auth/login', {'email':'patient@gmail.com','password':'Password123','role':'patient'})
aLogin = call('POST', '/auth/login', {'email':'superuser@nexcare.com','password':'Password123','role':'superuser'})
PT = pLogin.get('data',{}).get('token','')
AT = aLogin.get('data',{}).get('token','')

check('T1 Login (public, no token)', pLogin.get('success'), '200 ' + pLogin.get('message',''))
check('T1b Admin login (public)',     aLogin.get('success'), '200 ' + aLogin.get('message',''))

# No token → 401
r = call('GET', '/users')
check('T2 No token → 401', r.get('statusCode') == 401, str(r.get('message','')))

# Patient token + /patients → 200
r = call('GET', '/patients', token=PT)
check('T3 Patient token + /patients', r.get('success'), r.get('message',''))

# Patient token + /users → 403
r = call('GET', '/users', token=PT)
check('T4 Patient token + /users', r.get('statusCode') == 403, str(r.get('message',''))[:60])

# Patient token + /system → 403
r = call('GET', '/system/activity', token=PT)
check('T5 Patient token + /system', r.get('statusCode') == 403, str(r.get('message',''))[:60])

# Admin token + /users → 200
r = call('GET', '/users', token=AT)
check('T6 Admin token + /users', r.get('success'), r.get('message',''))

# Admin token + /system → 200
r = call('GET', '/system/activity', token=AT)
check('T7 Admin token + /system', r.get('success'), r.get('message',''))

# Wrong role at login
r = call('POST', '/auth/login', {'email':'patient@gmail.com','password':'Password123','role':'superuser'})
check('T8 Wrong role → rejected', not r.get('success'), r.get('message',''))

# Wrong password
r = call('POST', '/auth/login', {'email':'patient@gmail.com','password':'wrongpass','role':'patient'})
check('T9 Wrong password → rejected', not r.get('success'), r.get('message',''))

# Expired/tampered token → 401
r = call('GET', '/users', token='eyJhbGciOiJIUzI1NiJ9.tampered.invalidsig')
check('T10 Tampered token → 401', r.get('statusCode') == 401, str(r.get('message','')))

# Disk persistence
import os
if os.path.exists('data/users.json'):
    with open('data/users.json') as fh:
        users = json.load(fh)
    check('T11 Disk persistence', len(users) >= 9, f'{len(users)} users in data/users.json')
else:
    check('T11 Disk persistence', False, 'data/users.json not found')

print(f'\n{p}/{p+f} tests passed')
