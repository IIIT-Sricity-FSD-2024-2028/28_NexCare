# NexCare — Seed Account Reference

> Demo/test accounts shipped in `back-end/data/users.json`. For local development and
> project demos only. **Last verified against the seed file: 2026-08-28.**

**Every account uses the same password: `Password123`**

Some accounts are stored as scrypt hashes rather than plaintext — they were hashed by
the login upgrade path described at the bottom of this file. Their password is still
`Password123`.

**Totals:** 45 user records — **26 can log in**, **19 are doctor directory records
that cannot**.

---

## Accounts that can log in

### Oversight

| Role | Name | Email | Hospital |
|---|---|---|---|
| Admin (superuser) — `U001` | Rajesh Kumar | `superuser@nexcare.com` | — (all) |
| Regional Officer — `M001` | Rajesh Sharma | `regional@nexcare.com` | — (H002, H003) |
| Hospital Manager — `HM001` | Srinivas Rao | `hospitalmanager@nexcare.com` | H001 |

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
| Patient | `front-end/auth/patient-login.html` |
| Patient / Admin Staff / Ambulance / Hospital Manager | `front-end/auth/login.html` (combined) |

The login form sends the selected role alongside the credentials, and the backend
rejects a mismatch — signing in as Priya Reddy with the "Ambulance Staff" radio
selected fails even though the password is correct.

---

## Directory-only records — these CANNOT log in

The other 19 accounts are doctors. NexCare is a non-clinical platform, so they exist
purely as directory records that appointments and leave rosters can reference. They
have a password field in the seed data, but `AuthService.login` refuses them with:

> `Access Denied: 'doctor' is a directory record, not a NexCare login account.`

There is **no Doctor option on any login page** — it was removed on 2026-08-28
because it was a dead end that only ever produced that error.

| Name | Department | Status | Hospital |
|---|---|---|---|
| Dr. Sunita Sharma | Cardiology | Active | H001 |
| Dr. Vikram Patel | Orthopaedics | Active | H001 |
| Dr. Anjali Desai | General Medicine | **On Leave** | H001 |
| Dr. Priya Nair | Paediatrics | Active | H001 |
| Dr. Arjun Mehta | General Medicine | Active | H001 |
| Dr. Sanjay Gupta | Neurology | Active | H001 |
| Dr. Rajesh Khanna | Neurology | Active | H002 |
| Dr. Meera Iyer | Dermatology | Active | H002 |
| Dr. Kavya Reddy | Gynaecology | Active | H002 |
| Dr. Naveen Kumar | Paediatrics | Active | H002 |
| Dr. Sneha Pillai | General Medicine | Active | H002 |
| Dr. Harish Varma | Cardiology | Active | H002 |
| Dr. Preethi Nambiar | Orthopaedics | Active | H002 |
| Dr. Ananya Iyer | Cardiology | Active | H003 |
| Dr. Ravi Shankar | Neurology | Active | H003 |
| Dr. Deepak Nair | Orthopaedics | Active | H003 |
| Dr. Shalini Rao | General Medicine | **On Leave** | H003 |
| Dr. Vignesh Murthy | Emergency Medicine | Active | H003 |
| Dr. Bhavana Menon | General Medicine | Active | H003 |

Directory records are created by the Admin at `front-end/superuser/manage-users.html`
(the role dropdown there still lists "Doctor (directory record)" — that is correct and
intentional). See `PROJECT_CONTEXT.md` §4 for why doctors are modelled this way.

---

## Hospitals (12)

| ID | Name | City | Status | Manager |
|---|---|---|---|---|
| H001 | NexCare AIIMS Super Speciality Hospital | Tirupati | verified | HM001 |
| H002 | Apollo Health City | Tirupati | verified | M001 |
| H003 | Fortis Care Hospital | Chennai | verified | M001 |
| H004 | Sri Venkateswara Care Center | Tirupati | verified | — |
| HSP001 | Sri Venkateswara Multi Speciality Hospital | Tirupati | verified | — |
| HSP002 | Padmavathi Women and Children Hospital | Tirupati | verified | — |
| HSP003 | Tirumala Orthopaedic and Trauma Centre | Tirupati | verified | — |
| HSP004 | Rayalaseema Heart Institute | Tirupati | verified | — |
| HSP005 | Chittoor District General Hospital | Chittoor | verified | — |
| HSP006 | Renigunta Community Hospital | Renigunta | verified | — |
| HSP007 | Nellore Neuro Care Centre | Nellore | verified | — |
| HSP008 | Apollo Specialty Clinic Tirupati | Tirupati | verified | — |

Staff accounts are scoped to a hospital and only see that hospital's data. The Admin
and Regional Officer are not scoped that way — the Admin sees everything, the Regional
Officer sees the hospitals assigned to them.

---

## Notes

**Everything persists across a backend restart.** All 18 data files go through
`FileStore`, including `wards.json`, `departments.json` and `equipment.json`.
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
