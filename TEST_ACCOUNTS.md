# NexCare — Seed Account Reference

> Demo/test accounts shipped in `back-end/data/users.json`. For local development and
> project demos only. **Last verified against the seed file: 2026-08-30.**

**Every account uses the same password: `Password123`**

Some accounts are stored as scrypt hashes rather than plaintext — they were hashed by
the login upgrade path described at the bottom of this file. Their password is still
`Password123`.

**Totals:** 48 user records — **47 can log in**. Doctors became login actors on
2026-08-30 and have a portal of their own; only nurses remain directory-only, and
the seed data ships none.

---

## Accounts that can log in

### Oversight

| Role | Name | Email | Hospital |
|---|---|---|---|
| Admin (superuser) — `U001` | Rajesh Kumar | `superuser@nexcare.com` | — (all 12) |
| Regional Officer — `M001` | Rajesh Sharma | `regional@nexcare.com` | Tirupati + Renigunta — 9 hospitals |
| Regional Officer — `M002` | Kavitha Menon | `regional2@nexcare.com` | Chittoor + Nellore — HSP005, HSP007 |
| Regional Officer — `M003` | Arjun Raghavan | `regional3@nexcare.com` | Chennai — H003 |
| Hospital Manager — `HM001` | Srinivas Rao | `hospitalmanager@nexcare.com` | H001 |

Three regional officers rather than one, so the visibility scope is actually
demonstrable: sign in as `regional2@nexcare.com` and H001 is neither visible in the
hierarchy nor readable through `/revenue/hospital/H001` (403).

### Hospital staff

| Role | Name | Email | Hospital |
|---|---|---|---|
| Administrative Staff | Priya Reddy | `admin@nexcare.com` | H001 |
| Administrative Staff | Anita Joshi | `anita@nexcare.com` | H001 |
| Administrative Staff | Lakshmi Menon | `lakshmi@nexcare.com` | H002 |
| Administrative Staff | Divya Krishnan | `divya@nexcare.com` | H003 |
| Administrative Staff | Karthik Raman | `karthik@nexcare.com` | H003 |
| Ambulance Staff | Alex Martinez | `ambulance@nexcare.com` | H001 |
| Ambulance Staff | Suresh Babu | `suresh@nexcare.com` | H002 |
| Ambulance Staff | Manoj Selvam | `manoj@nexcare.com` | H003 |

### Patients (15)

| Name | Email |
|---|---|
| John Anderson | `patient@gmail.com` |
| Vivian Mathew | `patient2@gmail.com` |
| Priya Sharma | `patient3@gmail.com` |
| Abhishek Kumar | `patient4@gmail.com` |
| Heya Reddy | `patient5@gmail.com` |
| Suresh Kumar | `patient6@gmail.com` |
| Vishv Reddy | `patient7@gmail.com` |
| Ramesh Gupta | `patient8@gmail.com` |
| Ananya Sharma | `ananya.sharma@gmail.com` |
| Rahul Verma | `rahul.verma@gmail.com` |
| Meena Kumari | `meena.kumari@gmail.com` |
| Sandeep Reddy | `sandeep.reddy@gmail.com` |
| Fatima Sheikh | `fatima.sheikh@gmail.com` |
| Vijay Anand | `vijay.anand@gmail.com` |
| Test Patient | `patient@nexcare.com` |

### Where to log in

| Account | Login page |
|---|---|
| Admin / superuser | `front-end/auth/superuser-login.html` |
| Regional Officer | `front-end/auth/regional-officer-login.html` |
| Hospital Manager | `front-end/auth/hospital-manager-login.html` |
| Administrative Staff, Ambulance Staff | `front-end/auth/staff-login.html` |
| Doctor | `front-end/auth/doctor-login.html` |
| Patient | `front-end/auth/patient-login.html` |
| Patient / Admin Staff / Ambulance / Hospital Manager / Doctor | `front-end/auth/login.html` (combined) |

Doctors, administrative staff and ambulance crew can also self-register at
`front-end/auth/staff-register.html`. A new doctor must give a specialisation —
that is the department patients book them under. They are not enrolled on any
plan: a doctor is a seat on their hospital's subscription, and NexCare charges
them nothing.

The login form sends the selected role alongside the credentials, and the backend
rejects a mismatch — signing in as Priya Reddy with the "Ambulance Staff" radio
selected fails even though the password is correct.

---

## Doctors (20) — these DO log in

Doctors became login actors on 2026-08-30. Each has a portal at
`front-end/doctor/` covering their own schedule, the appointments booked with them,
their leave requests, and the consultation revenue they generated.
Sign in at `front-end/auth/doctor-login.html` with the same `Password123`.

**NexCare charges a doctor nothing.** Doctor listing tiers and the commission on
each consultation were removed on 2026-09-01: a doctor is an employee of the
hospital, and the hospital's subscription — priced by how many staff accounts it
runs — already covers their seat. The consultation fee below is what the *patient*
is quoted and what the *hospital* bills; the platform takes no share of it. A
doctor sets their own fee from the Earnings page. See `PROJECT_CONTEXT.md` §5A.

| Name | Email | Department | Hospital | Status | Consultation fee |
|---|---|---|---|---|---|
| Dr. Sunita Sharma | `sunita@nexcare.com` | Cardiology | H001 | Active | ₹900 |
| Dr. Vikram Patel | `vikram@nexcare.com` | Orthopaedics | H001 | Active | ₹800 |
| Dr. Anjali Desai | `anjali@nexcare.com` | General Medicine | H001 | **On Leave** | ₹500 |
| Dr. Priya Nair | `priya@nexcare.com` | Paediatrics | H001 | Active | ₹600 |
| Dr. Rajesh Khanna | `rajesh@nexcare.com` | Neurology | H002 | Active | ₹1100 |
| Dr. Meera Iyer | `meera@nexcare.com` | Dermatology | H002 | Active | ₹700 |
| Dr. Arjun Mehta | `arjun@nexcare.com` | General Medicine | H001 | Active | ₹500 |
| Dr. Kavya Reddy | `kavya@nexcare.com` | Gynaecology | H002 | Active | ₹750 |
| Dr. Naveen Kumar | `naveen@nexcare.com` | Paediatrics | H002 | Active | ₹600 |
| Dr. Sneha Pillai | `sneha@nexcare.com` | General Medicine | H002 | Active | ₹500 |
| Dr. Harish Varma | `harish@nexcare.com` | Cardiology | H002 | Active | ₹900 |
| Dr. Ananya Iyer | `ananya@nexcare.com` | Cardiology | H003 | Active | ₹900 |
| Dr. Ravi Shankar | `ravi@nexcare.com` | Neurology | H003 | Active | ₹1100 |
| Dr. Deepak Nair | `deepak@nexcare.com` | Orthopaedics | H003 | Active | ₹800 |
| Dr. Shalini Rao | `shalini@nexcare.com` | General Medicine | H003 | **On Leave** | ₹500 |
| Dr. Vignesh Murthy | `vignesh@nexcare.com` | Emergency Medicine | H003 | Active | ₹600 |
| Dr. Sanjay Gupta | `sanjay@nexcare.com` | Neurology | H001 | Active | ₹1100 |
| Dr. Preethi Nambiar | `preethi@nexcare.com` | Orthopaedics | H002 | Active | ₹800 |
| Dr. Bhavana Menon | `bhavana@nexcare.com` | General Medicine | H003 | Active | ₹500 |
| Dr. Sarah Smith | `sarah.smith@nexcare.com` | Cardiology | H001 | Active | ₹900 |

Two are seeded **On Leave**: `anjali@nexcare.com` and `shalini@nexcare.com`. The
booking wizard will not offer a slot with a doctor on approved leave.

Nurses remain directory-only records with no portal — `AuthService.login` still
refuses them — but the seed data ships none. The Admin creates them at
`front-end/superuser/manage-users.html`. See `PROJECT_CONTEXT.md` §4.

---

## Hospitals (12)

`Manager` is the **regional officer** assigned to the hospital — that is what
`assignedManagerId` means everywhere it is read. Each is assigned by matching the
hospital's city against the officer's `areas`, the same rule
`superuser/hospital-registrations.js` uses.

| ID | Name | City | Status | Regional officer |
|---|---|---|---|---|
| H001 | NexCare AIIMS Super Speciality Hospital | Tirupati | verified | M001 |
| H002 | Apollo Health City | Tirupati | verified | M001 |
| H003 | Fortis Care Hospital | Chennai | verified | M003 |
| H004 | Sri Venkateswara Care Center | Tirupati | verified | M001 |
| HSP001 | Sri Venkateswara Multi Speciality Hospital | Tirupati | verified | M001 |
| HSP002 | Padmavathi Women and Children Hospital | Tirupati | verified | M001 |
| HSP003 | Tirumala Orthopaedic and Trauma Centre | Tirupati | verified | M001 |
| HSP004 | Rayalaseema Heart Institute | Tirupati | verified | M001 |
| HSP005 | Chittoor District General Hospital | Chittoor | verified | M002 |
| HSP006 | Renigunta Community Hospital | Renigunta | verified | M001 |
| HSP007 | Nellore Neuro Care Centre | Nellore | verified | M002 |
| HSP008 | Apollo Specialty Clinic Tirupati | Tirupati | verified | M001 |

H001's hospital *manager* is `HM001`; that link is on the user record
(`hospitalId`), not on the hospital.

Staff accounts are scoped to a hospital and only see that hospital's data. The Admin
and Regional Officer are not scoped that way — the Admin sees everything, the Regional
Officer sees the hospitals assigned to them.

---

## Notes

**Everything persists across a backend restart.** All 25 data files go through
`FileStore`, including `wards.json`, `departments.json` and `equipment.json`, and
the six revenue files (`subscription-plans`, `hospital-subscriptions`,
`doctor-plans`, `doctor-subscriptions`, `patient-plans`, `patient-subscriptions`)
plus `platform-fee-config.json`.
(An earlier version of this file claimed those three were in-memory only — that is no
longer true.)

**Passwords rewrite themselves on first login.** `AuthService.login` upgrades a legacy
plaintext password to a scrypt hash *before* it checks the role, so simply attempting a
login rewrites that user's stored password in `users.json`. The account still works
with `Password123` — but it means auth testing dirties the seed file. Check
`git diff back-end/data/` before committing.

**To add more login accounts**, either register through
`front-end/auth/staff-register.html` (administrative_staff and ambulance only) or have
the Admin create them in `front-end/superuser/manage-users.html`.

**Before this ever goes near real deployment:** these are shared, committed, identical
credentials. Rotate them, and move the seed file out of version control.
