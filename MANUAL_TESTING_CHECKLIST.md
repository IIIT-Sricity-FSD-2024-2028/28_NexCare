# NexCare Manual Testing Checklist

Based on VERIFICATION.md requirements for comprehensive system validation.

**Password for all accounts:** `Password123`

---

## Prerequisites Setup

### Start the System
- [ ] Terminal 1: Start backend on port 3001
  ```bash
  cd back-end
  npm install          # first run only
  npm run build
  node dist/src/main.js
  ```

- [ ] Terminal 2: Start frontend on port 8080
  ```bash
  cd front-end
  npx serve -l 8080
  ```

- [ ] Open http://localhost:8080/landing/landing.html

### Initial Health Checks
- [ ] Backend console prints LAN URLs without red errors
- [ ] http://localhost:3001/api/docs loads Swagger UI with modules listed
- [ ] http://localhost:3001/api/hospitals returns JSON with 12 hospitals (no auth needed)

---

## 1. Automated Checks (Run First)

### Backend Tests
- [ ] Run `cd back-end && npx jest` → Expect: 8 suites, 51 tests, all passing
- [ ] Run `cd back-end && npm run build` → Expect: exit 0, no TypeScript errors

### Frontend Syntax Checks
- [ ] Run frontend syntax validation:
  ```bash
  cd front-end
  for f in $(find . -name "*.js" -not -path "./node_modules/*"); do
    node --check "$f" || echo "BROKEN: $f"
  done
  ```
  → Expect: No broken files

### Merge Conflict Check
- [ ] Run `grep -rIl "^<<<<<<< \|^>>>>>>> " back-end/src front-end back-end/data`
  → Expect: No output (no merge conflict markers)

---

## 2. Login Matrix - All Seven Actors

### Positive Cases (Should Succeed)
- [ ] **Admin**: Login at `auth/superuser-login.html` with `superuser@nexcare.com` → Lands on `/superuser/dashboard.html`
- [ ] **Regional Officer**: Login at `auth/regional-officer-login.html` with `regional@nexcare.com` → Lands on `/regional-officer/dashboard.html`
- [ ] **Hospital Manager**: Login at `auth/hospital-manager-login.html` with `hospitalmanager@nexcare.com` → Lands on `/hospital_manager/dashboard.html`
- [ ] **Doctor**: Login at `auth/doctor-login.html` with `sunita@nexcare.com` → Lands on `/doctor/dashboard.html`
- [ ] **Administrative Staff**: Login at `auth/staff-login.html` with `admin@nexcare.com` → Lands on `/administrative_staff/dashboard.html`
- [ ] **Ambulance Staff**: Login at `auth/staff-login.html` with `ambulance@nexcare.com` → Lands on `/ambulance/`
- [ ] **Patient**: Login at `auth/patient-login.html` with `patient@gmail.com` → Lands on `/patient/dashboard.html`

### Negative Cases (Should Fail)
- [ ] **Wrong role selection**: Try login as Priya Reddy with "Ambulance Staff" selected → Expect: `Access Denied: Account is registered as 'administrative_staff'…`
- [ ] **Nurse account**: Try any nurse account → Expect: `Access Denied: 'nurse' is a directory record, not a NexCare login account.`
- [ ] **Wrong password**: Use correct email but wrong password → Expect: `Authentication Failed: Incorrect password`
- [ ] **Unknown email**: Use non-existent email → Expect: `Authentication Failed: Email address not found`

### Cross-Portal Guard
- [ ] While signed in as **patient**, paste `http://localhost:8080/superuser/dashboard.html` → Expect: Bounced to login page, no admin content flash
- [ ] While signed in as **doctor**, paste `http://localhost:8080/regional-officer/dashboard.html` → Expect: Bounced to login page, no regional officer content flash

---

## 3. Middleware Verification

### 3.1 Security Middleware - Headers
- [ ] Run: `curl -sI http://localhost:3001/api/hospitals | grep -iE "x-|content-security|strict"`
  → Expect: Security headers present (`x-content-type-options`, `x-frame-options`, etc.)

### 3.2 Request Logger - Correlation ID
- [ ] Run: `curl -sI http://localhost:3001/api/hospitals | grep -i '^x-request-id:'`
  → Expect: `x-request-id: <uuid>` format

- [ ] Run: `tail -n 5 -q back-end/logs/access-*.log`
  → Expect: JSON lines with method, path, status, duration per request

### 3.3 CSRF Middleware
- [ ] **Login NOT challenged**: 
  ```bash
  curl -s -o /dev/null -w "login: %{http_code}\n" -X POST http://localhost:3001/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"superuser@nexcare.com","password":"Password123","role":"superuser"}'
  ```
  → Expect: 200

- [ ] **Token handed out on safe requests**:
  ```bash
  TOK=$(curl -s -D - -o /dev/null http://localhost:3001/api/hospitals | grep -i '^x-csrf-token:' | awk '{print $2}' | tr -d '\r')
  echo "token: ${TOK:0:16}… (${#TOK} chars)"
  ```
  → Expect: 64 characters

- [ ] **Token is STABLE (not rotating)**:
  ```bash
  for i in 1 2 3; do curl -s -D - -o /dev/null http://localhost:3001/api/hospitals | grep -i '^x-csrf-token:'; done
  ```
  → Expect: Same token three times

- [ ] **Unauthenticated write IS challenged**:
  ```bash
  curl -s -o /dev/null -w "no token: %{http_code}\n" -X POST http://localhost:3001/api/hospitals/register \
    -H 'Content-Type: application/json' -d '{}'
  ```
  → Expect: 403

- [ ] **Invalid token rejected**:
  ```bash
  curl -s -o /dev/null -w "bad token: %{http_code}\n" -X POST http://localhost:3001/api/hospitals/register \
    -H 'Content-Type: application/json' -H 'x-csrf-token: deadbeef' -d '{}'
  ```
  → Expect: 403

### 3.4 Validation Pipe
- [ ] Run: `curl -s -X POST http://localhost:3001/api/hospitals/register -H 'Content-Type: application/json' -H "x-csrf-token: $TOK" -d '{}'`
  → Expect: `{field, messages[]}` validation error, NOT stack trace, NOT created record

### 3.5 Auth + Roles Guards
- [ ] **No token**: `curl -s -o /dev/null -w "no auth: %{http_code}\n" http://localhost:3001/api/users`
  → Expect: 401

- [ ] **Valid token, wrong role**:
  ```bash
  DOC=$(curl -s -X POST http://localhost:3001/api/auth/login -H 'Content-Type: application/json' \
    -d '{"email":"sunita@nexcare.com","password":"Password123","role":"doctor"}' \
    | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
  curl -s -o /dev/null -w "wrong role: %{http_code}\n" -H "Authorization: Bearer $DOC" http://localhost:3001/api/users
  ```
  → Expect: 403

### 3.6 Ambulance Access Middleware
- [ ] **Patient can access ambulance**:
  ```bash
  PAT=$(curl -s -X POST http://localhost:3001/api/auth/login -H 'Content-Type: application/json' \
    -d '{"email":"patient@gmail.com","password":"Password123","role":"patient"}' \
    | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
  curl -s -o /dev/null -w "patient GET /ambulance: %{http_code}\n" \
    -H "Authorization: Bearer $PAT" http://localhost:3001/api/ambulance
  ```
  → Expect: 200

### 3.7 Interceptors
- [ ] **Query timestamp header**:
  ```bash
  curl -sD - "http://localhost:3001/api/hospitals?speciality=Cardiology&city=CHENNAI&pincode=%20600001%20" -o /dev/null \
    | grep -i '^x-query-timestamp:'
  ```
  → Expect: `x-query-timestamp` header present

- [ ] **Console sanitization**: Watch backend console for same request
  → Expect: Line like `Sanitized query [...]: speciality="cardiology", city="chennai", pincode="600001"` (trimmed and lowercased)

- [ ] **Inventory audit trail**: As administrative staff, restock an inventory item
  → Expect: `back-end/data/inventory-audit.json` gains a row

### 3.8 Exception Filter + 404 Handler
- [ ] Run: `curl -s http://localhost:3001/api/no-such-route`
  → Expect: Clean JSON envelope with `success:false` and `requestId`, NOT HTML error page or stack trace

---

## 4. Feature Walkthrough by Actor

### 4.1 Patient
- [ ] **Book appointment**: Go to `patient/appointments/appointments.html` → Book
  - [ ] Step 0 lists real hospitals (H001, H002…), NOT fictional ones like "Apollo Hospitals"
  - [ ] Pick department, then doctor from real directory
  - [ ] Pick date and slot, confirm
  - [ ] Booking appears under "My Appointments" as *Pending*

- [ ] **Care+ membership**: Go to `patient/membership.html`
  - [ ] Join Care+ → Status panel updates, shows fees waived vs membership paid
  - [ ] Switch back to Pay as you go → Works as cancellation

- [ ] **Pay bill**: Go to `patient/billing.html` → Pay Now
  - [ ] Modal shows simulated-gateway notice with test cards
  - [ ] Pay with `4000 0000 0000 0002` → Expect decline message, bill stays unpaid
  - [ ] Pay with `4242 4242 4242 4242` → Approved, bill becomes Paid

- [ ] **Request ambulance**: Go to `patient/ambulance.html`
  - [ ] Submit request → Appears as *Pending*
  - [ ] Cancel it → Status becomes *Cancelled*, row stays in table (NOT deleted)

- [ ] **Feedback**: Submit feedback → Confirm it appears for Admin in section 4.6

### 4.2 Doctor (sunita@nexcare.com)
- [ ] **Dashboard**: Five KPI tiles populate, today's schedule renders
- [ ] **Appointments**: 
  - [ ] Filter by status tab, search by patient name
  - [ ] Confirm *Pending* appointment → Becomes *Confirmed*
  - [ ] Complete *Confirmed* appointment → Becomes *Completed*
- [ ] **Earnings & Plan**: Gross, commission, listing fee, net all shown at doctor's volume
  - [ ] If another tier cheaper, recommendation banner appears
  - [ ] Change consultation fee, save → Figures move accordingly
- [ ] **Leave**: Request leave → Appears as *Pending*
- [ ] **Ownership guard**: Doctor cannot see another doctor's list
  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $DOC" \
    http://localhost:3001/api/appointments/doctor/U006
  ```
  → Expect: 403

### 4.3 Administrative Staff (admin@nexcare.com)
- [ ] **All pages load with data** (not empty tables):
  - [ ] Bed allocation
  - [ ] Inventory (+ restock)
  - [ ] Manage appointments
  - [ ] Patient check-in
  - [ ] Patient directory
  - [ ] Generate bill
  - [ ] Staff scheduling
  - [ ] Leave requests
  - [ ] System logs
  - [ ] Feedback

- [ ] **Authority check**: On `leave-requests.html`, try to approve leave
  → Expect: Refused (administrative staff record but don't approve)

### 4.4 Hospital Manager (hospitalmanager@nexcare.com)
- [ ] **Dashboard tabs**: Overview, leaves, staff, support all work
- [ ] **Approve doctor's leave** (from section 4.2) → Becomes Approved, doctor sees new status
- [ ] **Revenue tab**: Shows own hospital's collections and what it owes NexCare

### 4.5 Regional Officer (regional@nexcare.com)
- [ ] **My Region** (`hierarchy.html`): Scope banner names region and lists overseen hospitals
- [ ] **Dashboard, hospital approvals, revenue comparison, support requests** all work
- [ ] **Scope test**: Log out, sign in as `regional2@nexcare.com` (Kavitha Menon, Chittoor + Nellore)
  - [ ] She sees ONLY H009 and H011
  - [ ] H001, H002 and rest of M001's region completely absent from hierarchy, dashboard, revenue comparison

### 4.6 Admin/Superuser (superuser@nexcare.com)
- [ ] **Organisation Hierarchy**: Whole tree (platform → regions → hospitals → departments → people)
  - [ ] Expand hospital, use search box
- [ ] **Revenue** (six tabs):
  - [ ] *All streams*: Seven streams, three payers, shares add to 100%
  - [ ] *Hospitals*: Only hospitals that collected something appear
  - [ ] *Doctors*: Tier ladder, change tier fee and Save → figures recompute
  - [ ] *Patients*: Membership tiers and members
  - [ ] *Regional officers*: Revenue and workload per officer, click row to expand hospitals
  - [ ] *Pricing controls*: Change booking fee, Save → All-streams total moves
- [ ] **Hospital registrations**: Regional-officer dropdown grouped, shows load, prints suggestion
- [ ] **Manage users, patient directory, system settings, feedback, reports** all work

---

## 5. Revenue Model Verification

- [ ] **Money traces to records**:
  - [ ] Note total on Admin → Revenue → All streams
  - [ ] As patient, pay bill with success card (section 4.1 step 3)
  - [ ] Reload Admin revenue page
  - [ ] Total increased by exactly (commission rate + processing rate) × bill amount (3.4% with shipped rates)

- [ ] **Ledger recording**:
  ```bash
  SU=$(curl -s -X POST http://localhost:3001/api/auth/login -H 'Content-Type: application/json' \
    -d '{"email":"superuser@nexcare.com","password":"Password123","role":"superuser"}' \
    | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
  curl -s -H "Authorization: Bearer $SU" "http://localhost:3001/api/payments/ledger?stream=hospital_commission" \
    | head -c 400
  ```
  → Expect: Newest row names your bill with rate stored on the row

- [ ] **History test**: Change `paymentGatewayRate` in Pricing controls from 1.9% to 3%
  - [ ] Reload revenue page → Past earnings do NOT change
  - [ ] Only new payments charged at new rate
  - [ ] Set back to 1.9%

- [ ] **Decline earns nothing**: Pay with `4000 0000 0000 0002`, reload revenue
  → Expect: Total unchanged, bill still unpaid

- [ ] **Hospital subscriptions gone**:
  ```bash
  curl -s -o /dev/null -w "plans: %{http_code}\n" -H "Authorization: Bearer $SU" http://localhost:3001/api/revenue/plans
  curl -s -o /dev/null -w "subs:  %{http_code}\n" -H "Authorization: Bearer $SU" http://localhost:3001/api/revenue/subscriptions
  ```
  → Expect: Both 404

---

## 6. Authorization Matrix

All endpoints must return stated HTTP codes:

```bash
API=http://localhost:3001/api
tok () { curl -s -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d "{\"email\":\"$1\",\"password\":\"Password123\",\"role\":\"$2\"}" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])"; }

SU=$(tok superuser@nexcare.com superuser)
RO1=$(tok regional@nexcare.com regional_manager)
RO2=$(tok regional2@nexcare.com regional_manager)
HM=$(tok hospitalmanager@nexcare.com hospital_manager)
DOC=$(tok sunita@nexcare.com doctor)
PAT=$(tok patient@gmail.com patient)

hit () { printf '%-46s %s\n' "$1" \
  "$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $2" "$API$3")"; }
```

- [ ] `hit "admin: platform streams        (200)" "$SU"  /revenue/platform/streams` → 200
- [ ] `hit "admin: payments ledger         (200)" "$SU"  /payments/ledger` → 200
- [ ] `hit "admin: hierarchy               (200)" "$SU"  /hierarchy` → 200
- [ ] `hit "M002: own hospital revenue     (200)" "$RO2" /revenue/hospital/H009` → 200
- [ ] `hit "M002: OTHER region's revenue   (403)" "$RO2" /revenue/hospital/H001` → 403
- [ ] `hit "M001: other region's revenue   (403)" "$RO1" /revenue/hospital/H009` → 403
- [ ] `hit "M002: platform streams         (403)" "$RO2" /revenue/platform/streams` → 403
- [ ] `hit "M002: payments ledger          (403)" "$RO2" /payments/ledger` → 403
- [ ] `hit "HM:   own hospital revenue     (200)" "$HM"  /revenue/hospital/H001` → 200
- [ ] `hit "HM:   another hospital         (403)" "$HM"  /revenue/hospital/H002` → 403
- [ ] `hit "doctor: own appointments       (200)" "$DOC" /appointments/doctor/me` → 200
- [ ] `hit "doctor: another doctor's list  (403)" "$DOC" /appointments/doctor/U006` → 403
- [ ] `hit "doctor: user directory         (403)" "$DOC" /users` → 403
- [ ] `hit "patient: own membership        (200)" "$PAT" /revenue/patient/me/membership` → 200
- [ ] `hit "patient: platform streams      (403)" "$PAT" /revenue/platform/streams` → 403
- [ ] `hit "patient: hierarchy             (403)" "$PAT" /hierarchy` → 403

---

## 7. Scalability Verification

### 7.1 No N+1 File Reads
- [ ] `time curl -s -o /dev/null -H "Authorization: Bearer $SU" http://localhost:3001/api/users/regional-managers/workloads`
  → Expect: Well under 100ms, time stays flat when adding officers

- [ ] `time curl -s -o /dev/null -H "Authorization: Bearer $SU" http://localhost:3001/api/revenue/regional-officers`
  → Expect: Well under 100ms, time stays flat when adding officers

### 7.2 Bucketing Instead of Nested Scans
- [ ] Review `back-end/src/revenue/revenue.service.ts` → `getRegionalOfficerOverview`
  → Expect: No query inside officer loop

### 7.3 Nothing Stored Pre-Aggregated
- [ ] Edit bill status directly in `back-end/data/billing.json`
- [ ] Reload revenue page
  → Expect: Numbers move without rebuild or restart

### 7.4 Concurrency - CSRF Token Stability
- [ ] Run parallel CSRF requests:
  ```bash
  for i in $(seq 1 9); do
    curl -s -D - -o /dev/null http://localhost:3001/api/hospitals | grep -i '^x-csrf-token:' &
  done; wait
  ```
  → Expect: All nine print the SAME token

### 7.5 Payload and Rate Limits
- [ ] Create oversized body:
  ```bash
  python3 -c "print('{\"a\":\"' + 'x'*2000000 + '\"}')" > /tmp/big.json
  curl -s -o /dev/null -w "big body: %{http_code}\n" -X POST http://localhost:3001/api/auth/login \
    -H 'Content-Type: application/json' --data-binary @/tmp/big.json
  ```
  → Expect: 4xx with clean JSON error, not crash

### 7.6 Persistence Across Restart
- [ ] Stop backend (Ctrl-C), start again, reload any portal
  → Expect: Every appointment, bill, payment, ledger row still there

---

## 8. Final State Verification

After completing full testing, you should be able to confirm:

- [ ] 8 jest suites / 51 tests pass
- [ ] Backend builds with no TypeScript errors
- [ ] Every front-end `.js` parses
- [ ] All seven actors log in and land on right portal
- [ ] Cross-portal URL access blocked for every role
- [ ] All six middleware behaviors verified individually (section 3)
- [ ] Login is NOT blocked by CSRF, but unauthenticated write IS
- [ ] Patient can book, pay, request ambulance and cancel it
- [ ] Cancelled ambulance request still in table
- [ ] Doctor can confirm and complete, cannot touch another doctor's list
- [ ] M002 cannot see M001's region anywhere
- [ ] One card payment moves platform revenue by exactly 3.4% of bill
- [ ] Declined payment moves nothing
- [ ] Repricing does not restate past earnings
- [ ] All 16 authorization checks in section 6 return expected codes

---

## Test Cards Reference

| Card | Outcome |
|------|---------|
| `4242 4242 4242 4242` | approved |
| `4000 0000 0000 0002` | declined by issuer |
| `4000 0000 0000 0069` | expired card |
| `4000 0000 0000 0119` | processing error |
| `4000 0000 0000 9995` | insufficient funds |

Any future expiry date and any 3-digit CVV. Unrecognized card numbers are declined.

---

## Test Accounts Reference

| Role | Email |
|------|-------|
| Admin | `superuser@nexcare.com` |
| Regional Officer (Tirupati + Renigunta) | `regional@nexcare.com` |
| Regional Officer (Chittoor + Nellore) | `regional2@nexcare.com` |
| Regional Officer (Chennai) | `regional3@nexcare.com` |
| Hospital Manager (H001) | `hospitalmanager@nexcare.com` |
| Doctor (Cardiology, H001) | `sunita@nexcare.com` |
| Administrative Staff (H001) | `admin@nexcare.com` |
| Ambulance Staff (H001) | `ambulance@nexcare.com` |
| Patient | `patient@gmail.com` |

---

## Error Log

Record any issues found during testing:

### Automated Test Failures
- [ ] Test suite failures: _______________
- [ ] Build errors: _______________
- [ ] Syntax errors: _______________

### Manual Test Failures  
- [ ] Login issues: _______________
- [ ] Middleware issues: _______________
- [ ] Feature walkthrough issues: _______________
- [ ] Authorization issues: _______________
- [ ] Revenue model issues: _______________
- [ ] Scalability issues: _______________

### Overall Assessment
- [ ] System ready for demo: YES/NO
- [ ] Critical issues blocking demo: _______________
- [ ] Recommended fixes before demo: _______________