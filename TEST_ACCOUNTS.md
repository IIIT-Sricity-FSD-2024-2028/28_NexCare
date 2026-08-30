# NexCare — Seed Account Reference

> Demo/test accounts shipped in `back-end/data/users.json`. For local development and
> project demos only. Last verified: 2026-08-26.

**Every account uses the same password: `Password123`**

Two accounts (`superuser@nexcare.com`, `patient@gmail.com`) are stored as scrypt
hashes rather than plaintext — they were hashed by the login upgrade path described at
the bottom of this file. Their password is still `Password123`; this was verified by
recomputing the scrypt digest, not assumed.

---

## Accounts that can log in

Five of the twelve seed accounts are real login actors.

| Role | Name | Email | Password | Hospital |
|---|---|---|---|---|
| Admin (superuser) | System Administrator | `superuser@nexcare.com` | `Password123` | — |
| Regional Officer | Rajesh Sharma | `regional@nexcare.com` | `Password123` | — |
| Administrative Staff | Priya Reddy | `admin@nexcare.com` | `Password123` | H001 |
| Ambulance Staff | Alex Martinez | `ambulance@nexcare.com` | `Password123` | H001 |
| Patient | John Anderson | `patient@gmail.com` | `Password123` | — |

### Where to log in

| Account | Login page |
|---|---|
| Admin / superuser | `front-end/auth/superuser-login.html` |
| Regional Officer | `front-end/auth/regional-officer-login.html` |
| Administrative Staff, Ambulance Staff | `front-end/auth/staff-login.html` |
| Patient | `front-end/auth/patient-login.html` |
| Any of the above | `front-end/auth/login.html` (combined page) |

The login form sends the selected role alongside the credentials, and the backend
rejects a mismatch — signing in as Priya Reddy with the "Ambulance Staff" radio
selected fails even though the password is correct.

---

## Directory-only records — these CANNOT log in

The remaining seven accounts are doctors. NexCare is a non-clinical platform, so they
exist purely as directory records that appointments and leave rosters can reference.
They have a password field in the seed data, but `AuthService.login` refuses them with:

> `Access Denied: 'doctor' is a directory record, not a NexCare login account.`

| Name | Email | Department | Status | Hospital |
|---|---|---|---|---|
| Dr. Sarah Smith | `sarah.smith@nexcare.com` | Cardiology | Active | H001 |
| Dr. Vikram Patel | `vikram.patel@nexcare.com` | Orthopedics | Active | H001 |
| Dr. Anjali Desai | `anjali.desai@nexcare.com` | General Medicine | **On Leave** | H001 |
| Dr. Priya Nair | `priya.nair@nexcare.com` | Pediatrics | Active | H001 |
| Dr. Rajesh Khanna | `rajesh.khanna@nexcare.com` | Neurology | Active | H002 |
| Dr. Meera Iyer | `meera.iyer@nexcare.com` | Dermatology | Active | H002 |
| Dr. Arjun Mehta | `arjun.mehta@nexcare.com` | General Medicine | Active | H001 |

See `PROJECT_CONTEXT.md` §3 for why doctors are modelled this way.

---

## Hospitals

| ID | Name | City |
|---|---|---|
| H001 | NexCare AIIMS Super Speciality Hospital | Tirupati |
| H002 | Apollo Health City | Tirupati |

Staff accounts are scoped to a hospital and only see that hospital's data. The Admin
and Regional Officer are not scoped and see across hospitals.

---

## Notes

**These accounts survive a backend restart.** Users are read from and written to
`back-end/data/users.json` on every change, so anything you register through the UI
persists. (Wards, departments, and equipment do *not* persist — see
`PROJECT_CONTEXT.md` §6.)

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
