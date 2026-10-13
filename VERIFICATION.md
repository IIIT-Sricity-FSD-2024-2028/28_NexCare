# NexCare — Manual Verification Guide

A step-by-step script for checking that every actor, feature, middleware and
scalability claim actually works. Written to be run start-to-finish before a
demo or an evaluation.

**Time needed:** ~45 minutes for the full pass, ~10 for the smoke section.

Every account uses the password **`Password123`**.

---

## 0. Start the system

```bash
# Terminal 1 — backend on :3001
cd back-end
npm install          # first run only
npm run build
node dist/src/main.js

# Terminal 2 — frontend on :8080
cd front-end
npx serve -l 8080
```

Open **http://localhost:8080/landing/landing.html**.

| Check | Expected |
|---|---|
| Backend console | prints every reachable LAN URL, no red errors |
| http://localhost:3001/api/docs | Swagger UI loads and lists the modules |
| http://localhost:3001/api/hospitals | JSON with 12 hospitals, no auth needed |

> **If the backend will not start**, the usual cause is a stale build. Run
> `npm run build` again and re-read the error — it names the file and line.

---

## 1. Automated checks first (2 minutes)

Do these before touching the UI. If they fail, the manual pass will only waste
your time.

```bash
cd back-end
npx jest                       # expect: 8 suites, 51 tests, all passing
npm run build                  # expect: exit 0, no TypeScript errors
```

```bash
# Every front-end file parses (catches a committed syntax error, which silently
# kills a whole portal — this has happened twice)
cd front-end
for f in $(find . -name "*.js" -not -path "./node_modules/*"); do
  node --check "$f" || echo "BROKEN: $f"
done
```

```bash
# No merge conflict markers anywhere (this has been committed to main before)
grep -rIl "^<<<<<<< \|^>>>>>>> " back-end/src front-end back-end/data
# expect: no output
```

---

## 2. Login matrix — all seven actors

Sign in as each, confirm you land on the right portal, then **log out** before
the next one.

| Actor | Login page | Email | Lands on |
|---|---|---|---|
| Admin | `auth/superuser-login.html` | `superuser@nexcare.com` | `/superuser/dashboard.html` |
| Regional Officer | `auth/regional-officer-login.html` | `regional@nexcare.com` | `/regional-officer/dashboard.html` |
| Hospital Manager | `auth/hospital-manager-login.html` | `hospitalmanager@nexcare.com` | `/hospital_manager/dashboard.html` |
| Doctor | `auth/doctor-login.html` | `sunita@nexcare.com` | `/doctor/dashboard.html` |
| Administrative Staff | `auth/staff-login.html` | `admin@nexcare.com` | `/administrative_staff/dashboard.html` |
| Ambulance Staff | `auth/staff-login.html` | `ambulance@nexcare.com` | `/ambulance/` |
| Patient | `auth/patient-login.html` | `patient@gmail.com` | `/patient/dashboard.html` |

### Negative cases — these must FAIL

| Try | Expected |
|---|---|
| Right password, wrong role radio (e.g. sign in as Priya Reddy with "Ambulance Staff" selected) | `Access Denied: Account is registered as 'administrative_staff'…` |
| Any nurse account | `Access Denied: 'nurse' is a directory record, not a NexCare login account.` |
| Wrong password | `Authentication Failed: Incorrect password` |
| Unknown email | `Authentication Failed: Email address not found` |

### Cross-portal guard

While signed in as a **patient**, paste `http://localhost:8080/superuser/dashboard.html`
into the address bar.

**Expected:** bounced straight back to the login page, and you never see the
Admin content flash on screen.

Repeat with a **doctor** trying `/regional-officer/dashboard.html`.

---

## 3. Middleware — verify each one individually

This is the section the middleware evaluation rests on. Run each from a terminal.

### 3.1 Security middleware — headers

```bash
curl -sI http://localhost:3001/api/hospitals | grep -iE "x-|content-security|strict"
```
**Expected:** security headers present (`x-content-type-options`,
`x-frame-options`, etc.).

### 3.2 Request logger — correlation id + access log

```bash
# anchor the grep — a bare "x-request-id" also matches the CORS
# Access-Control-Expose-Headers line, which is not the header itself
curl -sI http://localhost:3001/api/hospitals | grep -i '^x-request-id:'
```
**Expected:** `x-request-id: <uuid>`.

```bash
# -n and -q are needed because the glob matches one log file per day
tail -n 5 -q back-end/logs/access-*.log
```
**Expected:** one JSON line per request with method, path, status and duration.

### 3.3 CSRF middleware

This is the one that has broken twice. Test all four behaviours.

```bash
API=http://localhost:3001/api

# (a) login must NOT be challenged — this is what used to 403 and lock everyone out
curl -s -o /dev/null -w "login: %{http_code}\n" -X POST $API/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"superuser@nexcare.com","password":"Password123","role":"superuser"}'
# expect 200

# (b) a token is handed out on any safe request
TOK=$(curl -s -D - -o /dev/null $API/hospitals | grep -i '^x-csrf-token:' | awk '{print $2}' | tr -d '\r')
echo "token: ${TOK:0:16}… (${#TOK} chars)"     # expect 64 chars

# (c) the token is STABLE — it must not rotate on every GET
for i in 1 2 3; do curl -s -D - -o /dev/null $API/hospitals | grep -i '^x-csrf-token:'; done
# expect: the same token three times

# (d) an unauthenticated write IS challenged
curl -s -o /dev/null -w "no token: %{http_code}\n" -X POST $API/hospitals/register \
  -H 'Content-Type: application/json' -d '{}'
# expect 403

curl -s -o /dev/null -w "bad token: %{http_code}\n" -X POST $API/hospitals/register \
  -H 'Content-Type: application/json' -H 'x-csrf-token: deadbeef' -d '{}'
# expect 403
```

> **Why Bearer writes are not challenged:** CSRF works by making a browser
> attach credentials it sends *automatically* (cookies). NexCare sends
> `Authorization: Bearer` from sessionStorage, set explicitly per call — a
> cross-origin page cannot make the browser attach it. Those requests are
> structurally immune, so challenging them buys nothing. This is worth being
> able to say out loud if you are asked why the exemption exists.

### 3.4 Validation pipe

```bash
curl -s -X POST http://localhost:3001/api/hospitals/register \
  -H 'Content-Type: application/json' -H "x-csrf-token: $TOK" -d '{}'
```
**Expected:** a `{field, messages[]}` validation error naming the missing
fields — **not** a stack trace and **not** a created record.

### 3.5 Auth + Roles guards

```bash
API=http://localhost:3001/api
# no token at all
curl -s -o /dev/null -w "no auth: %{http_code}\n" $API/users
# expect 401

# valid token, wrong role (doctor asking for the user directory)
DOC=$(curl -s -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"sunita@nexcare.com","password":"Password123","role":"doctor"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
curl -s -o /dev/null -w "wrong role: %{http_code}\n" -H "Authorization: Bearer $DOC" $API/users
# expect 403
```

### 3.6 Ambulance access middleware

```bash
API=http://localhost:3001/api
# A patient has no hospitalId and must still be able to request an ambulance.
# This 403'd for a while and made the feature unusable.
PAT=$(curl -s -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"patient@gmail.com","password":"Password123","role":"patient"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
curl -s -o /dev/null -w "patient GET /ambulance: %{http_code}\n" \
  -H "Authorization: Bearer $PAT" $API/ambulance
# expect 200
```

### 3.7 Interceptors

```bash
curl -sD - "$API/hospitals?speciality=Cardiology&city=CHENNAI&pincode=%20600001%20" -o /dev/null \
  | grep -i '^x-query-timestamp:'
```
**Expected:** an `x-query-timestamp` header — that is `HospitalQueryInterceptor`
stamping the response.

Now watch the backend console for the same request.
**Expected:** a line like
`Sanitized query [...]: speciality="cardiology", city="chennai", pincode="600001"`
— the values **trimmed and lowercased**, so the search is case-insensitive.

> **Be precise about this one if you are asked.** The interceptor *normalises*
> the query; it does **not** strip HTML, despite the word "Sanitized" in the log
> line. Passing `speciality=<script>alert(1)</script>` lowercases it and leaves
> the tag intact. That is not an injection hole — the value is only ever used as
> a filter against hospital records, never written into a page by the backend,
> and the front-end escapes output with `escapeHtml`. But do not claim it as XSS
> protection, because it is not.

Then, in the UI, restock an inventory item as administrative staff and confirm
`back-end/data/inventory-audit.json` gained a row — that is the
`InventoryAuditInterceptor` recording an audit trail.

### 3.8 Exception filter + 404 handler

```bash
curl -s http://localhost:3001/api/no-such-route
```
**Expected:** a clean JSON envelope with `success:false` and a `requestId` —
never an HTML error page or a raw stack trace.

---

## 4. Feature walkthrough by actor

### 4.1 Patient

1. **Book an appointment** — `patient/appointments/appointments.html` → Book.
   - Step 0 lists **real hospitals from the database** (H001, H002…), not
     fictional ones. If you see "Apollo Hospitals" or "Manipal", the live
     directory did not load — check the browser console.
   - Pick a department, then a doctor. The doctor list is the real directory.
   - Pick a date and slot, confirm.
   - **Expected:** the booking appears under "My Appointments" as *Pending*.
2. **Care+ membership** — `patient/membership.html`.
   - Join Care+. **Expected:** the status panel updates and shows fees waived
     vs membership paid, and is honest when the plan is not paying off.
   - Switch back to Pay as you go — that is how cancelling works.
3. **Pay a bill** — `patient/billing.html` → Pay Now.
   - The modal shows the simulated-gateway notice with the test cards.
   - Pay with **`4000 0000 0000 0002`** → **expect a decline message**, and the
     bill stays unpaid.
   - Pay with **`4242 4242 4242 4242`** → approved, bill becomes Paid.
   - **Then check the money moved** (§5).
4. **Request an ambulance** — `patient/ambulance.html`.
   - Submit a request. **Expected:** it appears as *Pending*.
   - Cancel it. **Expected:** status becomes **Cancelled and the row stays in
     the table** — it must not vanish. (It used to be hard-deleted.)
5. **Feedback** — submit one, confirm it appears for the Admin in §4.6.

### 4.2 Doctor (`sunita@nexcare.com`)

1. **Dashboard** — five KPI tiles populate, today's schedule renders.
2. **Appointments** — filter by status tab, search by patient name.
   - Confirm a *Pending* appointment → becomes *Confirmed*.
   - Complete a *Confirmed* one → becomes *Completed*.
3. **Earnings** — consultation revenue, consultations completed, the doctor's
   own fee, and a *Deducted by NexCare* tile.
   - The deducted tile must read **₹0**. NexCare charges a doctor nothing: they
     are a seat on their hospital's subscription. There is no tier to pick.
   - Change the consultation fee, save, and confirm the figures move.
4. **Leave** — request leave; it appears as *Pending*. A hospital manager
   approves it in §4.4.
5. **Ownership guard** — a doctor must not see another doctor's list:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $DOC" \
     $API/appointments/doctor/U006
   # expect 403
   ```

### 4.3 Administrative Staff (`admin@nexcare.com`)

Walk each page and confirm it loads with data, not an empty table:
bed allocation · inventory (+ restock) · manage appointments · patient check-in ·
patient directory · generate bill · staff scheduling · leave requests ·
system logs · feedback.

**Authority check:** on `leave-requests.html`, try to **approve** a leave.
**Expected:** refused — administrative staff record leave, they do not approve it.

### 4.4 Hospital Manager (`hospitalmanager@nexcare.com`)

1. Dashboard tabs: overview, leaves, staff, support.
2. **Approve the doctor's leave** from §4.2. **Expected:** it becomes Approved,
   and the doctor sees the new status.
3. Revenue tab — their own hospital's collections and what it owes NexCare.

### 4.5 Regional Officer (`regional@nexcare.com`)

1. **My Region** (`hierarchy.html`) — the scope banner names the officer's
   region and lists exactly the hospitals they oversee.
2. Dashboard, hospital approvals, revenue comparison, support requests.
3. **The scope test — this is the important one.** Log out, sign in as
   `regional2@nexcare.com` (Kavitha Menon, Chittoor + Nellore).
   - **Expected:** she sees **only H009 and H011**. H001, H002 and the rest
     of M001's region must be completely absent from her hierarchy, her
     dashboard and her revenue comparison.

### 4.6 Admin / Superuser (`superuser@nexcare.com`)

1. **Organisation Hierarchy** — the whole tree: platform → regions → hospitals
   → departments → people. Expand a hospital, use the search box.
2. **Revenue** — six tabs:
   - *All streams* — five streams, two payers (hospital and patient, never
     doctor), shares add to 100%.
   - *Hospitals* — every hospital, its plan, its staff-account count, its
     subscription and its processing fees.
   - *Hospital plans* — Starter / Growth / Enterprise, priced by staff
     headcount; change a plan's monthly fee and Save, confirm it recomputes.
     Move a hospital to another plan from the table and confirm its charge
     changes.
   - *Patients* — membership tiers and members.
   - *Regional officers* — revenue and workload per officer; click a row to
     expand its hospitals. The officer totals must sum to the platform total.
   - *Pricing controls* — change the booking fee, Save, and confirm the
     All-streams total moves.
3. **Hospital registrations** — the regional-officer dropdown is grouped into
   "Covers &lt;city&gt;" and "Other areas", shows each officer's current load,
   and prints a suggestion under the control.
4. Manage users · patient directory · system settings · feedback · reports.

---

## 5. Revenue model — prove the money is real

The point of the model is that **every rupee traces to a record**. Verify that
rather than trusting the dashboard.

### 5.1 The subscription is counted, not declared

1. Note the *Hospital platform subscriptions* line on **Admin → Revenue → All
   streams**, and the staff-account count beside it.
2. Add a staff member to a hospital (Admin → Manage users), then reload.
   **Expected:** the seat count rises by one. The amount rises only if that
   hospital is now over its plan's included seats, in which case it rises by
   exactly `extraStaffSeatFee` (₹250).
3. Set that user's status to *Inactive* and reload.
   **Expected:** the seat count falls again — an inactive account is not a
   billable seat.

### 5.2 A hospital is not charged on what it earns

1. Note the *Hospital platform subscriptions* amount.
2. As a patient, pay a bill with the success card (§4.1 step 3).
3. Reload.

**Expected:** the subscription line is **unchanged**. Only the *Bill payment
processing* line moves, by exactly `paymentGatewayRate × the bill amount` —
1.9% with the shipped rates. There is no commission on collections: that was
removed on 2026-09-01 so a hospital's cost stays fixed and predictable.

4. Check the ledger recorded it:
   ```bash
   SU=$(curl -s -X POST $API/auth/login -H 'Content-Type: application/json' \
     -d '{"email":"superuser@nexcare.com","password":"Password123","role":"superuser"}' \
     | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
   curl -s -H "Authorization: Bearer $SU" "$API/payments/ledger?stream=payment_gateway_fee" \
     | head -c 400
   ```
   **Expected:** the newest row names your bill, with the `rate` stored **on the
   row**, and it is the **only** row written for that payment.

### 5.3 Nothing is charged to a doctor

1. Complete a consultation as a doctor (§4.2 step 2), then open **Earnings**.
   **Expected:** consultation revenue rises by the appointment fee, and
   *Deducted by NexCare* still reads **₹0**.
2. As the Admin, reload **Revenue → All streams**.
   **Expected:** no stream has `doctor` as its payer, and the *Revenue by payer*
   chart shows exactly two bars.
3. The doctor billing routes are gone. These must 404:
   ```bash
   curl -s -o /dev/null -w "doctor-plans: %{http_code}\n" -H "Authorization: Bearer $SU" $API/revenue/doctor-plans
   curl -s -o /dev/null -w "doctor-subs:  %{http_code}\n" -H "Authorization: Bearer $SU" $API/revenue/doctor-subscriptions
   ```

### 5.4 Repricing changes the future, not the past

1. **The history test.** Change `paymentGatewayRate` in *Pricing controls* from
   1.9% to 3%. Reload the revenue page.
   **Expected:** past earnings do **not** change. Only new payments are charged
   at the new rate. (A model that recomputes from current rates would silently
   restate every payment ever taken — this one records the rate when charged.)
   Set it back to 1.9% afterwards.

2. **A decline earns nothing.** Pay with `4000 0000 0000 0002`, then reload
   revenue. **Expected:** the total is unchanged and the bill is still unpaid.

3. **The bed-based hospital tiers are gone.** These must 404:
   ```bash
   curl -s -o /dev/null -w "plans: %{http_code}\n" -H "Authorization: Bearer $SU" $API/revenue/plans
   curl -s -o /dev/null -w "subs:  %{http_code}\n" -H "Authorization: Bearer $SU" $API/revenue/subscriptions
   ```

---

## 6. Visibility scope — the authorisation matrix

Every one of these must return the stated code. This is the fastest way to prove
the scoping is enforced server-side and not just hidden in the UI.

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

hit "admin: platform streams        (200)" "$SU"  /revenue/platform/streams
hit "admin: payments ledger         (200)" "$SU"  /payments/ledger
hit "admin: hierarchy               (200)" "$SU"  /hierarchy
hit "M002: own hospital revenue     (200)" "$RO2" /revenue/hospital/H009
hit "M002: OTHER region's revenue   (403)" "$RO2" /revenue/hospital/H001
hit "M001: other region's revenue   (403)" "$RO1" /revenue/hospital/H009
hit "M002: platform streams         (403)" "$RO2" /revenue/platform/streams
hit "M002: payments ledger          (403)" "$RO2" /payments/ledger
hit "HM:   own hospital revenue     (200)" "$HM"  /revenue/hospital/H001
hit "HM:   another hospital         (403)" "$HM"  /revenue/hospital/H002
hit "doctor: own appointments       (200)" "$DOC" /appointments/doctor/me
hit "doctor: another doctor's list  (403)" "$DOC" /appointments/doctor/U006
hit "doctor: user directory         (403)" "$DOC" /users
hit "patient: own membership        (200)" "$PAT" /revenue/patient/me/membership
hit "patient: platform streams      (403)" "$PAT" /revenue/platform/streams
hit "patient: hierarchy             (403)" "$PAT" /hierarchy
```

**Expected:** every line matches the code in brackets.

---

## 7. Scalability

The claims worth checking, and how to check them.

### 7.1 No N+1 file reads

`UsersService` and `RevenueService` take **one snapshot per request** rather than
re-reading JSON per officer. The naive version did 2 file reads per officer —
101 reads for 50 officers.

```bash
# Response time must not grow with the number of officers
time curl -s -o /dev/null -H "Authorization: Bearer $SU" $API/users/regional-managers/workloads
time curl -s -o /dev/null -H "Authorization: Bearer $SU" $API/revenue/regional-officers
```
**Expected:** both well under 100 ms. Add officers via *Manage Users* and re-run
— the time should stay flat, not scale with the count.

### 7.2 Bucketing instead of nested scans

`/revenue/regional-officers` buckets bills, staff and beds by hospital **once**,
so a hundredth officer costs a map lookup, not another pass over every bill.

Read `back-end/src/revenue/revenue.service.ts` → `getRegionalOfficerOverview`
and confirm there is no query inside the officer loop.

### 7.3 Nothing stored pre-aggregated

No total is cached anywhere; every figure derives from bills, appointments,
dispatches and the ledger at read time. Verify by editing a bill's status
directly in `back-end/data/billing.json` and reloading the revenue page — the
numbers move without a rebuild or a restart.

### 7.4 Concurrency — the CSRF token must be stable

Pages fire many GETs in parallel (the Admin revenue page issues nine at once).
An earlier bug rotated the CSRF token on every safe request, so parallel loads
raced and writes failed at random.

```bash
for i in $(seq 1 9); do
  curl -s -D - -o /dev/null $API/hospitals | grep -i '^x-csrf-token:' &
done; wait
```
**Expected:** all nine print the **same** token.

### 7.5 Payload and rate limits

```bash
# Oversized body is rejected, not swallowed
python3 -c "print('{\"a\":\"' + 'x'*2000000 + '\"}')" > /tmp/big.json
curl -s -o /dev/null -w "big body: %{http_code}\n" -X POST $API/auth/login \
  -H 'Content-Type: application/json' --data-binary @/tmp/big.json
```
**Expected:** a 4xx with a clean JSON error, not a crash.

### 7.6 Persistence across restart

Stop the backend (Ctrl-C), start it again, reload any portal.
**Expected:** every appointment, bill, payment and ledger row is still there —
all 25 data files go through `FileStore`.

---

## 8. Known-good final state

After a full pass you should be able to say:

- [ ] 8 jest suites / 51 tests pass
- [ ] Backend builds with no TypeScript errors
- [ ] Every front-end `.js` parses
- [ ] All seven actors log in and land on the right portal
- [ ] Cross-portal URL access is blocked for every role
- [ ] All six middleware behaviours verified individually (§3)
- [ ] Login is **not** blocked by CSRF, but an unauthenticated write **is**
- [ ] A patient can book, pay, request an ambulance and cancel it
- [ ] A cancelled ambulance request is still in the table
- [ ] A doctor can confirm and complete, and cannot touch another doctor's list
- [ ] M002 cannot see M001's region anywhere
- [ ] One card payment moves platform revenue by exactly 3.4% of the bill
- [ ] A declined payment moves nothing
- [ ] Repricing does not restate past earnings
- [ ] All 16 authorisation checks in §6 return the expected codes

---

## Appendix — test cards

The gateway is a **simulation**. No real card is accepted, contacted or stored;
only the last four digits are retained.

| Card | Outcome |
|---|---|
| `4242 4242 4242 4242` | approved |
| `4000 0000 0000 0002` | declined by issuer |
| `4000 0000 0000 0069` | expired card |
| `4000 0000 0000 0119` | processing error |
| `4000 0000 0000 9995` | insufficient funds |

Any future expiry date and any 3-digit CVV. An unrecognised card number is
**declined**, not approved — so a demo cannot accidentally "succeed" on a number
nobody chose.

## Appendix — accounts

| Role | Email |
|---|---|
| Admin | `superuser@nexcare.com` |
| Regional Officer (Tirupati + Renigunta) | `regional@nexcare.com` |
| Regional Officer (Chittoor + Nellore) | `regional2@nexcare.com` |
| Regional Officer (Chennai) | `regional3@nexcare.com` |
| Hospital Manager (H001) | `hospitalmanager@nexcare.com` |
| Doctor (Cardiology, H001) | `sunita@nexcare.com` |
| Administrative Staff (H001) | `admin@nexcare.com` |
| Ambulance Staff (H001) | `ambulance@nexcare.com` |
| Patient | `patient@gmail.com` |

Full roster in `TEST_ACCOUNTS.md`.
