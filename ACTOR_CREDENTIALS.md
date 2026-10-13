# NexCare — Actor Credentials

> **Local development seed data.** Every account below lives in
> `back-end/data/users.json` on this machine. These are not production
> credentials and there is no production deployment.
>
> Generated from `users.json` on 2026-09-02 — 141 accounts.
> **Every row was verified by an actual `POST /api/auth/login` call**, not
> read off the file. 140 of 141 succeed.

---

## The password

**Almost every account uses the same password:**

```
Password123
```

### ⚠ 1 exception

| ID | Email | Role | Problem |
|---|---|---|---|
| `U004` | `patient@gmail.com` | patient | Password was changed — `Password123` is refused |

This account's password was changed through the change-password flow and the
new value **was committed** (the same hash is in `git show HEAD`). A scrypt
hash cannot be reversed, so the current password is not recoverable from the
repo — whoever changed it knows it.

**This matters for a demo:** `U004 / patient@gmail.com` is patient record
`P001`, the richest seeded patient — the bookings, bills and Care+ membership
in the seed hang off it. Use a different patient from the table below, or
reset it:

```bash
# From the repo root. Sets U004 back to Password123 as plaintext;
# it re-hashes itself on the next login. Tested.
node -e 'const fs=require("fs"),f="back-end/data/users.json",u=JSON.parse(fs.readFileSync(f,"utf8"));u.find(x=>x.id==="U004").password="Password123";fs.writeFileSync(f,JSON.stringify(u,null,2));console.log("U004 reset to Password123")'
```

Restart the backend afterwards so it re-reads the file.

### Why some records look different in the file

Some records store a `scrypt$…` hash rather than the plaintext string. For all
but the exception above, **the password is still `Password123`** — NexCare
re-hashes a plaintext password the first time that account signs in. This is
expected; nothing is broken, and you cannot read the password back out of a
hashed record.

How many are hashed is not worth tracking — it goes up every time anyone signs
in, so `users.json` shows up as modified in `git status` after ordinary use.
Verifying all 141 logins converts all 141.

```bash
# how many are currently hashed
node -e 'console.log(require("./back-end/data/users.json").filter(u=>String(u.password).startsWith("scrypt$")).length)'
```

---

## Where to sign in

| Actor | Login page | Portal |
|---|---|---|
| Admin (Super User) | `auth/superuser-login.html` | `front-end/superuser/` |
| Regional Officer | `auth/regional-officer-login.html` | `front-end/regional-officer/` |
| Hospital Manager | `auth/hospital-manager-login.html` | `front-end/hospital_manager/` |
| Doctor | `auth/doctor-login.html` | `front-end/doctor/` |
| Administrative Staff | `auth/staff-login.html` | `front-end/administrative_staff/` |
| Ambulance Staff | `auth/staff-login.html` | `front-end/ambulance/` |
| Patient | `auth/patient-login.html` | `front-end/patient/` |

`auth/login.html` is a combined page offering Patient, Administrative Staff,
Ambulance, Hospital Manager and Doctor by radio button.

> **The role selector matters.** `POST /auth/login` requires a `role` field and
> validates it against the account. The right email and password with the wrong
> role selected **fails** — verified.

> **Rate limit: 20 login attempts per IP per minute** (`AUTH_LIMIT` in
> `lodger.middleware.ts`). Scripted logins across many accounts will hit HTTP
> 429 — that is throttling, not a bad password. Raise it for a bulk run with
> `RATE_LIMIT_AUTH=5000 npm start`.

---

## Quick reference — one working account per role

The fastest way to see each portal. All verified, all `Password123`.

| Actor | Email | Scope |
|---|---|---|
| Admin (Super User) | `superuser@nexcare.com` | Platform-wide |
| Regional Officer | `regional@nexcare.com` | REG-AP-SOUTH |
| Hospital Manager | `hospitalmanager@nexcare.com` | Sri Venkateswara Multispeciality Hospital |
| Doctor | `sunita@nexcare.com` | Sri Venkateswara Multispeciality Hospital |
| Administrative Staff | `admin@nexcare.com` | Sri Venkateswara Multispeciality Hospital |
| Ambulance Staff | `ambulance@nexcare.com` | Sri Venkateswara Multispeciality Hospital |
| Patient | `sravani.reddy@example.in` | Sri Venkateswara Multispeciality Hospital |

A patient's hospital is where they registered, not a visibility scope — a
patient sees only their own data. Staff accounts *are* scoped to their hospital.
See `PROJECT_CONTEXT.md` §5B.

---

## Admin (Super User) — 1 account

Login: `auth/superuser-login.html` · Portal: `front-end/superuser/` · Role value in code: `superuser`

| ID | Name | Email | Password | Status | Login |
|---|---|---|---|---|---|
| `U001` | NexCare Platform Office | `superuser@nexcare.com` | `Password123` | Active | ✅ |

## Regional Officer — 4 accounts

Login: `auth/regional-officer-login.html` · Portal: `front-end/regional-officer/` · Role value in code: `regional_manager`

| ID | Name | Email | Password | Region | Status | Login |
|---|---|---|---|---|---|---|
| `RM001` | Anirudh Reddy | `regional@nexcare.com` | `Password123` | REG-AP-SOUTH | Active | ✅ |
| `RM002` | Kavya Menon | `kavya.menon@nexcare.in` | `Password123` | REG-KA-SOUTH | Active | ✅ |
| `RM003` | Rohan Deshmukh | `rohan.deshmukh@nexcare.in` | `Password123` | REG-MH-CENTRAL | Active | ✅ |
| `RM004` | Nandini Iyer | `nandini.iyer@nexcare.in` | `Password123` | REG-TN-NORTH | Active | ✅ |

## Hospital Manager — 8 accounts

Login: `auth/hospital-manager-login.html` · Portal: `front-end/hospital_manager/` · Role value in code: `hospital_manager`

| ID | Name | Email | Password | Hospital | Region | Status | Login |
|---|---|---|---|---|---|---|---|
| `HM-AP01` | Priya Reddy | `hospitalmanager@nexcare.com` | `Password123` | H001 — Sri Venkateswara Multispeciality Hospital | REG-AP-SOUTH | Active | ✅ |
| `HM-AP02` | Arjun Varma | `arjun.varma@nexcare.in` | `Password123` | H002 — Coastal Care Hospital | REG-AP-SOUTH | Active | ✅ |
| `HM-KA01` | Sneha Rao | `sneha.rao@nexcare.in` | `Password123` | H003 — Namma Health Multispeciality | REG-KA-SOUTH | Active | ✅ |
| `HM-KA02` | Karthik Shetty | `karthik.shetty@nexcare.in` | `Password123` | H004 — Cauvery City Hospital | REG-KA-SOUTH | Active | ✅ |
| `HM-MH01` | Neha Kulkarni | `neha.kulkarni@nexcare.in` | `Password123` | H005 — Sahyadri Care Hospital | REG-MH-CENTRAL | Active | ✅ |
| `HM-MH02` | Aditya Patil | `aditya.patil@nexcare.in` | `Password123` | H006 — Deccan Multispeciality Centre | REG-MH-CENTRAL | Active | ✅ |
| `HM-TN01` | Meera Krishnan | `meera.krishnan@nexcare.in` | `Password123` | H007 — Chennai Lifeline Hospital | REG-TN-NORTH | Active | ✅ |
| `HM-TN02` | Vignesh Raman | `vignesh.raman@nexcare.in` | `Password123` | H008 — Kaveri Medical Centre | REG-TN-NORTH | Active | ✅ |

## Doctor — 48 accounts

Login: `auth/doctor-login.html` · Portal: `front-end/doctor/` · Role value in code: `doctor`

| ID | Name | Email | Password | Hospital | Region | Department | Fee | Status | Login |
|---|---|---|---|---|---|---|---|---|---|
| `U005` | Dr. Sunita Sharma | `sunita@nexcare.com` | `Password123` | H001 — Sri Venkateswara Multispeciality Hospital | REG-AP-SOUTH | Cardiology | ₹900 | Active | ✅ |
| `DOC-AP01-002` | Dr. Harini Reddy | `harini.reddy@nexcare.in` | `Password123` | H001 — Sri Venkateswara Multispeciality Hospital | REG-AP-SOUTH | General Medicine | ₹800 | On Leave | ✅ |
| `U006` | Dr. Vikram Patel | `vikram@nexcare.in` | `Password123` | H001 — Sri Venkateswara Multispeciality Hospital | REG-AP-SOUTH | Orthopaedics | ₹850 | Active | ✅ |
| `U009` | Dr. Sarah Smith | `sarah.smith@nexcare.com` | `Password123` | H001 — Sri Venkateswara Multispeciality Hospital | REG-AP-SOUTH | Neurology | ₹1000 | On Leave | ✅ |
| `DOC-AP01-005` | Dr. Rajesh Rao | `rajesh.rao@nexcare.in` | `Password123` | H001 — Sri Venkateswara Multispeciality Hospital | REG-AP-SOUTH | Paediatrics | ₹700 | Active | ✅ |
| `U007` | Dr. Anjali Desai | `anjali@nexcare.in` | `Password123` | H001 — Sri Venkateswara Multispeciality Hospital | REG-AP-SOUTH | Dermatology | ₹750 | Active | ✅ |
| `DOC-AP02-001` | Dr. Srinivas Varma | `srinivas.varma@nexcare.in` | `Password123` | H002 — Coastal Care Hospital | REG-AP-SOUTH | Cardiology | ₹800 | Active | ✅ |
| `DOC-AP02-002` | Dr. Swati Naidu | `swati.naidu@nexcare.in` | `Password123` | H002 — Coastal Care Hospital | REG-AP-SOUTH | General Medicine | ₹700 | Active | ✅ |
| `DOC-AP02-003` | Dr. Arvind Swamy | `arvind.swamy@nexcare.in` | `Password123` | H002 — Coastal Care Hospital | REG-AP-SOUTH | Orthopaedics | ₹850 | Active | ✅ |
| `DOC-AP02-004` | Dr. Bhavana Prasad | `bhavana.prasad@nexcare.in` | `Password123` | H002 — Coastal Care Hospital | REG-AP-SOUTH | Paediatrics | ₹650 | Active | ✅ |
| `DOC-AP02-005` | Dr. Madhav Raju | `madhav.raju@nexcare.in` | `Password123` | H002 — Coastal Care Hospital | REG-AP-SOUTH | ENT | ₹750 | Active | ✅ |
| `DOC-AP02-006` | Dr. Leela Kothari | `leela.kothari@nexcare.in` | `Password123` | H002 — Coastal Care Hospital | REG-AP-SOUTH | Gynaecology | ₹900 | Active | ✅ |
| `DOC-KA01-001` | Dr. Ananya Hegde | `ananya.hegde@nexcare.in` | `Password123` | H003 — Namma Health Multispeciality | REG-KA-SOUTH | Cardiology | ₹1100 | Active | ✅ |
| `DOC-KA01-002` | Dr. Suresh Joshi | `suresh.joshi@nexcare.in` | `Password123` | H003 — Namma Health Multispeciality | REG-KA-SOUTH | Neurology | ₹1200 | Active | ✅ |
| `DOC-KA01-003` | Dr. Pradeep Gowda | `pradeep.gowda@nexcare.in` | `Password123` | H003 — Namma Health Multispeciality | REG-KA-SOUTH | Orthopaedics | ₹1000 | Active | ✅ |
| `DOC-KA01-004` | Dr. Maya Kulkarni | `maya.kulkarni@nexcare.in` | `Password123` | H003 — Namma Health Multispeciality | REG-KA-SOUTH | General Medicine | ₹850 | Active | ✅ |
| `DOC-KA01-005` | Dr. Kiran Shetty | `kiran.shetty@nexcare.in` | `Password123` | H003 — Namma Health Multispeciality | REG-KA-SOUTH | General Surgery | ₹950 | Active | ✅ |
| `DOC-KA01-006` | Dr. Divya Ramesh | `divya.ramesh@nexcare.in` | `Password123` | H003 — Namma Health Multispeciality | REG-KA-SOUTH | Dermatology | ₹800 | Active | ✅ |
| `DOC-KA02-001` | Dr. Gautham Nambiar | `gautham.nambiar@nexcare.in` | `Password123` | H004 — Cauvery City Hospital | REG-KA-SOUTH | Cardiology | ₹850 | Active | ✅ |
| `DOC-KA02-002` | Dr. Radhika Ursu | `radhika.ursu@nexcare.in` | `Password123` | H004 — Cauvery City Hospital | REG-KA-SOUTH | Paediatrics | ₹750 | Active | ✅ |
| `DOC-KA02-003` | Dr. Chetan Kumar | `chetan.kumar@nexcare.in` | `Password123` | H004 — Cauvery City Hospital | REG-KA-SOUTH | Orthopaedics | ₹800 | Active | ✅ |
| `DOC-KA02-004` | Dr. Preeti Shenoy | `preeti.shenoy@nexcare.in` | `Password123` | H004 — Cauvery City Hospital | REG-KA-SOUTH | ENT | ₹700 | Active | ✅ |
| `DOC-KA02-005` | Dr. Mahesh Bhat | `mahesh.bhat@nexcare.in` | `Password123` | H004 — Cauvery City Hospital | REG-KA-SOUTH | General Medicine | ₹700 | Active | ✅ |
| `DOC-KA02-006` | Dr. Shalini Rai | `shalini.rai@nexcare.in` | `Password123` | H004 — Cauvery City Hospital | REG-KA-SOUTH | Gynaecology | ₹850 | Active | ✅ |
| `DOC-MH01-001` | Dr. Tarun Kulkarni | `tarun.kulkarni@nexcare.in` | `Password123` | H005 — Sahyadri Care Hospital | REG-MH-CENTRAL | Cardiology | ₹1000 | Active | ✅ |
| `DOC-MH01-002` | Dr. Meenakshi Sundaram | `meenakshi.sundaram@nexcare.in` | `Password123` | H005 — Sahyadri Care Hospital | REG-MH-CENTRAL | Neurology | ₹1100 | Active | ✅ |
| `DOC-MH01-003` | Dr. Sachin Shinde | `sachin.shinde@nexcare.in` | `Password123` | H005 — Sahyadri Care Hospital | REG-MH-CENTRAL | Orthopaedics | ₹900 | Active | ✅ |
| `DOC-MH01-004` | Dr. Pooja Deshmukh | `pooja.deshmukh@nexcare.in` | `Password123` | H005 — Sahyadri Care Hospital | REG-MH-CENTRAL | Paediatrics | ₹750 | Active | ✅ |
| `DOC-MH01-005` | Dr. Nitin Gadkari | `nitin.gadkari@nexcare.in` | `Password123` | H005 — Sahyadri Care Hospital | REG-MH-CENTRAL | Emergency Medicine | ₹850 | Active | ✅ |
| `DOC-MH01-006` | Dr. Rekha Pawar | `rekha.pawar@nexcare.in` | `Password123` | H005 — Sahyadri Care Hospital | REG-MH-CENTRAL | Dermatology | ₹750 | Active | ✅ |
| `DOC-MH02-001` | Dr. Deepa Chawla | `deepa.chawla@nexcare.in` | `Password123` | H006 — Deccan Multispeciality Centre | REG-MH-CENTRAL | Cardiology | ₹800 | Active | ✅ |
| `DOC-MH02-002` | Dr. Amitav Ghosh | `amitav.ghosh@nexcare.in` | `Password123` | H006 — Deccan Multispeciality Centre | REG-MH-CENTRAL | General Medicine | ₹700 | Active | ✅ |
| `DOC-MH02-003` | Dr. Sanjay Borse | `sanjay.borse@nexcare.in` | `Password123` | H006 — Deccan Multispeciality Centre | REG-MH-CENTRAL | Orthopaedics | ₹800 | Active | ✅ |
| `DOC-MH02-004` | Dr. Sunita Jadhav | `sunita.jadhav@nexcare.in` | `Password123` | H006 — Deccan Multispeciality Centre | REG-MH-CENTRAL | Paediatrics | ₹700 | Active | ✅ |
| `DOC-MH02-005` | Dr. Rahul Sonawane | `rahul.sonawane@nexcare.in` | `Password123` | H006 — Deccan Multispeciality Centre | REG-MH-CENTRAL | ENT | ₹750 | Active | ✅ |
| `DOC-MH02-006` | Dr. Smita Wagh | `smita.wagh@nexcare.in` | `Password123` | H006 — Deccan Multispeciality Centre | REG-MH-CENTRAL | Gynaecology | ₹850 | Active | ✅ |
| `DOC-TN01-001` | Dr. V. Ramanathan | `v.ramanathan@nexcare.in` | `Password123` | H007 — Chennai Lifeline Hospital | REG-TN-NORTH | Cardiology | ₹1100 | Active | ✅ |
| `DOC-TN01-002` | Dr. S. Jayaraman | `s.jayaraman@nexcare.in` | `Password123` | H007 — Chennai Lifeline Hospital | REG-TN-NORTH | Neurology | ₹1200 | Active | ✅ |
| `DOC-TN01-003` | Dr. K. Ananthi | `k.ananthi@nexcare.in` | `Password123` | H007 — Chennai Lifeline Hospital | REG-TN-NORTH | General Medicine | ₹900 | Active | ✅ |
| `DOC-TN01-004` | Dr. R. Karthik | `r.karthik@nexcare.in` | `Password123` | H007 — Chennai Lifeline Hospital | REG-TN-NORTH | Orthopaedics | ₹1000 | Active | ✅ |
| `DOC-TN01-005` | Dr. M. Chitra | `m.chitra@nexcare.in` | `Password123` | H007 — Chennai Lifeline Hospital | REG-TN-NORTH | Gynaecology | ₹950 | Active | ✅ |
| `DOC-TN01-006` | Dr. P. Sundar | `p.sundar@nexcare.in` | `Password123` | H007 — Chennai Lifeline Hospital | REG-TN-NORTH | Dermatology | ₹850 | Active | ✅ |
| `DOC-TN02-001` | Dr. T. Venugopal | `t.venugopal@nexcare.in` | `Password123` | H008 — Kaveri Medical Centre | REG-TN-NORTH | Cardiology | ₹850 | Active | ✅ |
| `DOC-TN02-002` | Dr. N. Gayathri | `n.gayathri@nexcare.in` | `Password123` | H008 — Kaveri Medical Centre | REG-TN-NORTH | General Medicine | ₹750 | Active | ✅ |
| `DOC-TN02-003` | Dr. S. Balaji | `s.balaji@nexcare.in` | `Password123` | H008 — Kaveri Medical Centre | REG-TN-NORTH | Orthopaedics | ₹800 | Active | ✅ |
| `DOC-TN02-004` | Dr. U. Malathi | `u.malathi@nexcare.in` | `Password123` | H008 — Kaveri Medical Centre | REG-TN-NORTH | Paediatrics | ₹700 | Active | ✅ |
| `DOC-TN02-005` | Dr. G. Loganathan | `g.loganathan@nexcare.in` | `Password123` | H008 — Kaveri Medical Centre | REG-TN-NORTH | General Surgery | ₹850 | Active | ✅ |
| `DOC-TN02-006` | Dr. E. Soundarya | `e.soundarya@nexcare.in` | `Password123` | H008 — Kaveri Medical Centre | REG-TN-NORTH | ENT | ₹700 | Active | ✅ |

## Administrative Staff — 40 accounts

Login: `auth/staff-login.html` · Portal: `front-end/administrative_staff/` · Role value in code: `administrative_staff`

| ID | Name | Email | Password | Hospital | Region | Department | Status | Login |
|---|---|---|---|---|---|---|---|---|
| `U002` | Lakshmi Naidu | `admin@nexcare.com` | `Password123` | H001 — Sri Venkateswara Multispeciality Hospital | REG-AP-SOUTH | Front Desk / Patient Registration | Active | ✅ |
| `ADM-AP01-02` | Suresh Babu | `suresh.babu@nexcare.in` | `Password123` | H001 — Sri Venkateswara Multispeciality Hospital | REG-AP-SOUTH | Inventory / Procurement | Active | ✅ |
| `ADM-AP01-03` | Divya Reddy | `divya.reddy@nexcare.in` | `Password123` | H001 — Sri Venkateswara Multispeciality Hospital | REG-AP-SOUTH | Billing / Appointments | Active | ✅ |
| `ADM-AP01-04` | Kiran Kumar | `kiran.kumar@nexcare.in` | `Password123` | H001 — Sri Venkateswara Multispeciality Hospital | REG-AP-SOUTH | Bed Allocation & Admissions | Active | ✅ |
| `ADM-H001-05` | Naveen Reddy | `naveen.reddy@nexcare.in` | `Password123` | H001 — Sri Venkateswara Multispeciality Hospital | REG-AP-SOUTH | Patient Relations | Active | ✅ |
| `ADM-AP02-01` | Ramesh Verma | `ramesh.verma@nexcare.in` | `Password123` | H002 — Coastal Care Hospital | REG-AP-SOUTH | Front Desk | Active | ✅ |
| `ADM-AP02-02` | Latha Raju | `latha.raju@nexcare.in` | `Password123` | H002 — Coastal Care Hospital | REG-AP-SOUTH | Billing | Active | ✅ |
| `ADM-AP02-03` | Venu Gopal | `venu.gopal@nexcare.in` | `Password123` | H002 — Coastal Care Hospital | REG-AP-SOUTH | Inventory | Active | ✅ |
| `ADM-AP02-04` | Kavitha Swamy | `kavitha.swamy@nexcare.in` | `Password123` | H002 — Coastal Care Hospital | REG-AP-SOUTH | Scheduling | Active | ✅ |
| `ADM-H002-05` | Keerthana Devi | `keerthana.devi@nexcare.in` | `Password123` | H002 — Coastal Care Hospital | REG-AP-SOUTH | Admissions Coordination | Active | ✅ |
| `ADM-KA01-01` | Nikhil Rao | `nikhil.rao@nexcare.in` | `Password123` | H003 — Namma Health Multispeciality | REG-KA-SOUTH | Front Desk | Active | ✅ |
| `ADM-KA01-02` | Deepika Gowda | `deepika.gowda@nexcare.in` | `Password123` | H003 — Namma Health Multispeciality | REG-KA-SOUTH | Billing & TPA | Active | ✅ |
| `ADM-KA01-03` | Prashanth Bhat | `prashanth.bhat@nexcare.in` | `Password123` | H003 — Namma Health Multispeciality | REG-KA-SOUTH | Inventory & Supplies | Active | ✅ |
| `ADM-KA01-04` | Vidya Murthy | `vidya.murthy@nexcare.in` | `Password123` | H003 — Namma Health Multispeciality | REG-KA-SOUTH | Admissions & Beds | Active | ✅ |
| `ADM-H003-05` | Ritu Malhotra | `ritu.malhotra@nexcare.in` | `Password123` | H003 — Namma Health Multispeciality | REG-KA-SOUTH | Quality & Records | Active | ✅ |
| `ADM-KA02-01` | Shruti Ursu | `shruti.ursu@nexcare.in` | `Password123` | H004 — Cauvery City Hospital | REG-KA-SOUTH | Front Desk | Active | ✅ |
| `ADM-KA02-02` | Manjunath Hegde | `manjunath.hegde@nexcare.in` | `Password123` | H004 — Cauvery City Hospital | REG-KA-SOUTH | Billing | Active | ✅ |
| `ADM-KA02-03` | Sowmya Rai | `sowmya.rai@nexcare.in` | `Password123` | H004 — Cauvery City Hospital | REG-KA-SOUTH | Inventory | Active | ✅ |
| `ADM-KA02-04` | Ganesh Shetty | `ganesh.shetty@nexcare.in` | `Password123` | H004 — Cauvery City Hospital | REG-KA-SOUTH | Scheduling | Active | ✅ |
| `ADM-H004-05` | Anusha Shetty | `anusha.shetty@nexcare.in` | `Password123` | H004 — Cauvery City Hospital | REG-KA-SOUTH | Patient Relations | Active | ✅ |
| `ADM-MH01-01` | Amit Shinde | `amit.shinde@nexcare.in` | `Password123` | H005 — Sahyadri Care Hospital | REG-MH-CENTRAL | Front Desk | Active | ✅ |
| `ADM-MH01-02` | Pooja Kadam | `pooja.kadam@nexcare.in` | `Password123` | H005 — Sahyadri Care Hospital | REG-MH-CENTRAL | Billing & Cashless | Active | ✅ |
| `ADM-MH01-03` | Rohan More | `rohan.more@nexcare.in` | `Password123` | H005 — Sahyadri Care Hospital | REG-MH-CENTRAL | Inventory | Active | ✅ |
| `ADM-MH01-04` | Snehal Joshi | `snehal.joshi@nexcare.in` | `Password123` | H005 — Sahyadri Care Hospital | REG-MH-CENTRAL | Patient Experience | Active | ✅ |
| `ADM-H005-05` | Tejas Kulkarni | `tejas.kulkarni@nexcare.in` | `Password123` | H005 — Sahyadri Care Hospital | REG-MH-CENTRAL | Quality & Records | Active | ✅ |
| `ADM-MH02-01` | Vikas Pawar | `vikas.pawar@nexcare.in` | `Password123` | H006 — Deccan Multispeciality Centre | REG-MH-CENTRAL | Front Desk | Active | ✅ |
| `ADM-MH02-02` | Anagha Deshpande | `anagha.deshpande@nexcare.in` | `Password123` | H006 — Deccan Multispeciality Centre | REG-MH-CENTRAL | Billing | Active | ✅ |
| `ADM-MH02-03` | Sujay Patil | `sujay.patil@nexcare.in` | `Password123` | H006 — Deccan Multispeciality Centre | REG-MH-CENTRAL | Inventory | Active | ✅ |
| `ADM-MH02-04` | Mansi Borse | `mansi.borse@nexcare.in` | `Password123` | H006 — Deccan Multispeciality Centre | REG-MH-CENTRAL | Admissions | Active | ✅ |
| `ADM-H006-05` | Madhura Joshi | `madhura.joshi@nexcare.in` | `Password123` | H006 — Deccan Multispeciality Centre | REG-MH-CENTRAL | Admissions Coordination | Active | ✅ |
| `ADM-TN01-01` | S. Vijay | `s.vijay@nexcare.in` | `Password123` | H007 — Chennai Lifeline Hospital | REG-TN-NORTH | Front Desk | Active | ✅ |
| `ADM-TN01-02` | R. Priyadarshini | `r.priyadarshini@nexcare.in` | `Password123` | H007 — Chennai Lifeline Hospital | REG-TN-NORTH | Billing | Active | ✅ |
| `ADM-TN01-03` | M. Saravanan | `m.saravanan@nexcare.in` | `Password123` | H007 — Chennai Lifeline Hospital | REG-TN-NORTH | Inventory | Active | ✅ |
| `ADM-TN01-04` | K. Nithya | `k.nithya@nexcare.in` | `Password123` | H007 — Chennai Lifeline Hospital | REG-TN-NORTH | Scheduling | Active | ✅ |
| `ADM-H007-05` | S. Nivetha | `s.nivetha@nexcare.in` | `Password123` | H007 — Chennai Lifeline Hospital | REG-TN-NORTH | Quality & Records | Active | ✅ |
| `ADM-TN02-01` | A. Dinesh | `a.dinesh@nexcare.in` | `Password123` | H008 — Kaveri Medical Centre | REG-TN-NORTH | Front Desk | Active | ✅ |
| `ADM-TN02-02` | P. Revathi | `p.revathi@nexcare.in` | `Password123` | H008 — Kaveri Medical Centre | REG-TN-NORTH | Billing | Active | ✅ |
| `ADM-TN02-03` | T. Sathish | `t.sathish@nexcare.in` | `Password123` | H008 — Kaveri Medical Centre | REG-TN-NORTH | Inventory | Active | ✅ |
| `ADM-TN02-04` | V. Keerthana | `v.keerthana@nexcare.in` | `Password123` | H008 — Kaveri Medical Centre | REG-TN-NORTH | Patient Helpdesk | Active | ✅ |
| `ADM-H008-05` | Aravind Kumar | `aravind.kumar@nexcare.in` | `Password123` | H008 — Kaveri Medical Centre | REG-TN-NORTH | Patient Relations | Active | ✅ |

## Ambulance Staff — 16 accounts

Login: `auth/staff-login.html` · Portal: `front-end/ambulance/` · Role value in code: `ambulance`

| ID | Name | Email | Password | Hospital | Region | Status | Login |
|---|---|---|---|---|---|---|---|
| `U003` | Tirupati Crew Alpha | `ambulance@nexcare.com` | `Password123` | H001 — Sri Venkateswara Multispeciality Hospital | REG-AP-SOUTH | Active | ✅ |
| `AMB-H001-02` | Tirupati Crew Bravo | `ambulance.h0012@nexcare.in` | `Password123` | H001 — Sri Venkateswara Multispeciality Hospital | REG-AP-SOUTH | Active | ✅ |
| `AMB-H002-01` | Nellore Crew Alpha | `ambulance.h0021@nexcare.in` | `Password123` | H002 — Coastal Care Hospital | REG-AP-SOUTH | Active | ✅ |
| `AMB-H002-02` | Nellore Crew Bravo | `ambulance.h0022@nexcare.in` | `Password123` | H002 — Coastal Care Hospital | REG-AP-SOUTH | Active | ✅ |
| `AMB-H003-01` | Bengaluru Crew Alpha | `ambulance.h0031@nexcare.in` | `Password123` | H003 — Namma Health Multispeciality | REG-KA-SOUTH | Active | ✅ |
| `AMB-H003-02` | Bengaluru Crew Bravo | `ambulance.h0032@nexcare.in` | `Password123` | H003 — Namma Health Multispeciality | REG-KA-SOUTH | Active | ✅ |
| `AMB-H004-01` | Mysuru Crew Alpha | `ambulance.h0041@nexcare.in` | `Password123` | H004 — Cauvery City Hospital | REG-KA-SOUTH | Active | ✅ |
| `AMB-H004-02` | Mysuru Crew Bravo | `ambulance.h0042@nexcare.in` | `Password123` | H004 — Cauvery City Hospital | REG-KA-SOUTH | Active | ✅ |
| `AMB-H005-01` | Pune Crew Alpha | `ambulance.h0051@nexcare.in` | `Password123` | H005 — Sahyadri Care Hospital | REG-MH-CENTRAL | Active | ✅ |
| `AMB-H005-02` | Pune Crew Bravo | `ambulance.h0052@nexcare.in` | `Password123` | H005 — Sahyadri Care Hospital | REG-MH-CENTRAL | Active | ✅ |
| `AMB-H006-01` | Nashik Crew Alpha | `ambulance.h0061@nexcare.in` | `Password123` | H006 — Deccan Multispeciality Centre | REG-MH-CENTRAL | Active | ✅ |
| `AMB-H006-02` | Nashik Crew Bravo | `ambulance.h0062@nexcare.in` | `Password123` | H006 — Deccan Multispeciality Centre | REG-MH-CENTRAL | Active | ✅ |
| `AMB-H007-01` | Chennai Crew Alpha | `ambulance.h0071@nexcare.in` | `Password123` | H007 — Chennai Lifeline Hospital | REG-TN-NORTH | Active | ✅ |
| `AMB-H007-02` | Chennai Crew Bravo | `ambulance.h0072@nexcare.in` | `Password123` | H007 — Chennai Lifeline Hospital | REG-TN-NORTH | Active | ✅ |
| `AMB-H008-01` | Vellore Crew Alpha | `ambulance.h0081@nexcare.in` | `Password123` | H008 — Kaveri Medical Centre | REG-TN-NORTH | Active | ✅ |
| `AMB-H008-02` | Vellore Crew Bravo | `ambulance.h0082@nexcare.in` | `Password123` | H008 — Kaveri Medical Centre | REG-TN-NORTH | Active | ✅ |

## Patient — 24 accounts

Login: `auth/patient-login.html` · Portal: `front-end/patient/` · Role value in code: `patient`

| ID | Name | Email | Password | Hospital | Region | Patient ID | Status | Login |
|---|---|---|---|---|---|---|---|---|
| `U004` | Raghav Rao | `patient@gmail.com` | **changed — unknown** | H001 — Sri Venkateswara Multispeciality Hospital | REG-AP-SOUTH | `P001` | Active | ❌ |
| `PAT-LOGIN-H1-2` | Sravani Reddy | `sravani.reddy@example.in` | `Password123` | H001 — Sri Venkateswara Multispeciality Hospital | REG-AP-SOUTH | `P002` | Active | ✅ |
| `PAT-LOGIN-H1-3` | Venkat Rao | `venkat.rao@example.in` | `Password123` | H001 — Sri Venkateswara Multispeciality Hospital | REG-AP-SOUTH | `P003` | Active | ✅ |
| `PAT-LOGIN-H2-1` | Karthik Varma | `karthik.v@example.in` | `Password123` | H002 — Coastal Care Hospital | REG-AP-SOUTH | `P009` | Active | ✅ |
| `PAT-LOGIN-H2-2` | Gayathri Devi | `gayathri.d@example.in` | `Password123` | H002 — Coastal Care Hospital | REG-AP-SOUTH | `P010` | Active | ✅ |
| `PAT-LOGIN-H2-3` | Rahul Verma | `rahul.v@example.in` | `Password123` | H002 — Coastal Care Hospital | REG-AP-SOUTH | `P011` | Active | ✅ |
| `PAT-LOGIN-H3-1` | Manoj Prasad | `manoj.prasad@example.in` | `Password123` | H003 — Namma Health Multispeciality | REG-KA-SOUTH | `P017` | Active | ✅ |
| `PAT-LOGIN-H3-2` | Pooja Hegde | `pooja.h@example.in` | `Password123` | H003 — Namma Health Multispeciality | REG-KA-SOUTH | `P018` | Active | ✅ |
| `PAT-LOGIN-H3-3` | Varun Gowda | `varun.gowda@example.in` | `Password123` | H003 — Namma Health Multispeciality | REG-KA-SOUTH | `P019` | Active | ✅ |
| `PAT-LOGIN-H4-1` | Basavaraj Ursu | `basavaraj.u@example.in` | `Password123` | H004 — Cauvery City Hospital | REG-KA-SOUTH | `P025` | Active | ✅ |
| `PAT-LOGIN-H4-2` | Divya Shetty | `divya.s@example.in` | `Password123` | H004 — Cauvery City Hospital | REG-KA-SOUTH | `P026` | Active | ✅ |
| `PAT-LOGIN-H4-3` | Chetan Rai | `chetan.r@example.in` | `Password123` | H004 — Cauvery City Hospital | REG-KA-SOUTH | `P027` | Active | ✅ |
| `PAT-LOGIN-H5-1` | Rohan Joshi | `rohan.j@example.in` | `Password123` | H005 — Sahyadri Care Hospital | REG-MH-CENTRAL | `P033` | Active | ✅ |
| `PAT-LOGIN-H5-2` | Swati Kulkarni | `swati.k@example.in` | `Password123` | H005 — Sahyadri Care Hospital | REG-MH-CENTRAL | `P034` | Active | ✅ |
| `PAT-LOGIN-H5-3` | Ajinkya Shinde | `ajinkya.s@example.in` | `Password123` | H005 — Sahyadri Care Hospital | REG-MH-CENTRAL | `P035` | Active | ✅ |
| `PAT-LOGIN-H6-1` | Sanjay Borse | `sanjay.b@example.in` | `Password123` | H006 — Deccan Multispeciality Centre | REG-MH-CENTRAL | `P041` | Active | ✅ |
| `PAT-LOGIN-H6-2` | Pallavi Sonawane | `pallavi.s@example.in` | `Password123` | H006 — Deccan Multispeciality Centre | REG-MH-CENTRAL | `P042` | Active | ✅ |
| `PAT-LOGIN-H6-3` | Ganesh Jadhav | `ganesh.j@example.in` | `Password123` | H006 — Deccan Multispeciality Centre | REG-MH-CENTRAL | `P043` | Active | ✅ |
| `PAT-LOGIN-H7-1` | S. Karthikeyan | `s.karthik@example.in` | `Password123` | H007 — Chennai Lifeline Hospital | REG-TN-NORTH | `P049` | Active | ✅ |
| `PAT-LOGIN-H7-2` | R. Vijayalakshmi | `r.vijaya@example.in` | `Password123` | H007 — Chennai Lifeline Hospital | REG-TN-NORTH | `P050` | Active | ✅ |
| `PAT-LOGIN-H7-3` | M. Saravanan | `m.saravana@example.in` | `Password123` | H007 — Chennai Lifeline Hospital | REG-TN-NORTH | `P051` | Active | ✅ |
| `PAT-LOGIN-H8-1` | A. Sathish | `a.sathish@example.in` | `Password123` | H008 — Kaveri Medical Centre | REG-TN-NORTH | `P057` | Active | ✅ |
| `PAT-LOGIN-H8-2` | V. Sangeetha | `v.sangeetha@example.in` | `Password123` | H008 — Kaveri Medical Centre | REG-TN-NORTH | `P058` | Active | ✅ |
| `PAT-LOGIN-H8-3` | E. Srinivasan | `e.srini@example.in` | `Password123` | H008 — Kaveri Medical Centre | REG-TN-NORTH | `P059` | Active | ✅ |

---

## Accounts that cannot log in

### Nurses

**Nurses are directory-only records, not login actors.** `AuthService.login`
refuses them with:

```
Access Denied: 'nurse' is a directory record, not a NexCare login account.
```

They exist so rosters, leave records and headcount statistics can reference
them. **The seed ships none** — `users.json` holds 0 nurse records. The Admin
creates them at `superuser/manage-users.html`.

### Accounts marked `On Leave`

2 accounts carry `On Leave`. They still sign in — the status affects
rostering, not authentication (both verified below).

| ID | Name | Role | Login |
|---|---|---|---|
| `DOC-AP01-002` | Dr. Harini Reddy | doctor | ✅ |
| `U009` | Dr. Sarah Smith | doctor | ✅ |

> `On Leave` staff still hold a **billable seat** — only `Inactive` frees one.
> See `PROJECT_CONTEXT.md` §5A.

---

## Hospitals referenced above

| ID | Name | City | Verification |
|---|---|---|---|
| `H001` | Sri Venkateswara Multispeciality Hospital | Tirupati | verified |
| `H002` | Coastal Care Hospital | Nellore | verified |
| `H003` | Namma Health Multispeciality | Bengaluru | verified |
| `H004` | Cauvery City Hospital | Mysuru | verified |
| `H005` | Sahyadri Care Hospital | Pune | verified |
| `H006` | Deccan Multispeciality Centre | Nashik | verified |
| `H007` | Chennai Lifeline Hospital | Chennai | verified |
| `H008` | Kaveri Medical Centre | Vellore | verified |
| `H009` | Rainbow Hospital | Tirupati | pending_verification |

`H009` is a pending registration awaiting the Admin's decision. It has no staff
accounts and — since 2026-09-02 — is deliberately not billed. See
`PROJECT_CONTEXT.md` §14.

---

## Regenerating this file

Generated, not maintained by hand — a hand-edited row will drift from
`users.json`. The Login column comes from a real login call per account, so
regeneration needs a running backend with the auth rate limit raised.

---

## Related files

- `TEST_ACCOUNTS.md` — narrower set, with the scoping rules explained
- `LOGIN_CREDENTIALS.md` — the older credentials note
- `PROJECT_CONTEXT.md` §3–§5 — what each actor is allowed to see
