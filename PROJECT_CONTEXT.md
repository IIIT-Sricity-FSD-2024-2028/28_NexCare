# NexCare — Project Context

> Working context for anyone (human or AI) picking this repo up cold.
> Read this **before** changing roles, actors, or naming. Last updated: 2026-08-26.

---

## 1. The one rule that governs everything

**NexCare is a strictly NON-CLINICAL platform.**

It digitises hospital *administrative* operations only: appointments and queues, bed
and ward allocation, ambulance coordination, inventory, billing, staff rosters,
feedback. It never touches diagnosis, treatment, prescriptions, or medical records.

Every naming and modelling decision follows from this. When in doubt, ask:
*"is this an administrative action or a clinical one?"* If clinical, it does not
belong in NexCare.

Source of truth for scope: `README.md`, `DomainExpertInteraction.md`, `definitions.yml`.

---

## 2. Canonical actors

These four actors come from the domain expert interaction (31-01-2026) and are the
only ones the SRS recognises:

| Actor | Role value in code | Portal |
|---|---|---|
| Patient | `patient` | `front-end/patient/` |
| Administrative Staff | `administrative_staff` | `front-end/administrative_staff/` |
| Ambulance Staff | `ambulance` | `front-end/ambulance/` |
| Admin | `superuser` | `front-end/superuser/` |

The multi-hospital SaaS upgrade (commit `e6f3fc4`) added two oversight actors on top:

| Actor | Role value in code | Portal |
|---|---|---|
| Regional Officer | `regional_manager` | `front-end/regional-officer/` |
| Hospital Manager | `hospital_manager` | `front-end/manager/` |

### Naming decisions (settled 2026-08-26)

- **"Front Desk" is NOT a role.** It was only ever a display label for
  `administrative_staff`, and it was wrong. The role is displayed as
  **"Administrative Staff"** everywhere. "Front Desk" survives *only* as a
  department value alongside Management and Billing (`superuser/manage-users.js`).
- **The role stays `regional_manager` in code**, displayed as "Regional Officer".
  Do not rename the enum member; the display string is the thing users see.
- **Doctors and nurses are NOT actors.** See section 3.

---

## 3. Doctors: directory records, never actors

Doctors were wrongly built as a full login actor with their own portal. They are not
one — a doctor is a clinical role, and NexCare is non-clinical.

**The model now:**

- `UserRole.DOCTOR` and `UserRole.NURSE` still exist in the enum, but **only as
  directory records**. They are non-login. There is no doctor portal.
- They exist so an appointment can name *who the slot is with*, and so the
  regional/hospital views can count clinical headcount as an operational statistic.
- Directory records are created by the Admin via `superuser/manage-users.html`.
  They cannot self-register and cannot log in — both paths are blocked server-side.
- The `doctor` field on an appointment **stays named `doctor`**. It is booking
  metadata (which consultant the slot belongs to), not an actor reference.
  Deliberate decision — do not "clean this up" later.

**Do not** re-add: a doctor login option, a doctor portal, a doctor sidebar branch,
or doctor self-registration.

### Where staff leave lives now

The doctor portal owned leave requests. With no doctor portal, leave is administered
**by Administrative Staff on behalf of staff**, at
`front-end/administrative_staff/leave-requests.html`.

Authority is split, and this is deliberate:

- **Administrative Staff** record a leave request against a staff member and track it.
  They **cannot** approve or reject — `LeaveRequestGuard.validateLeaveApproval`
  rejects them with 403.
- **Hospital Manager / Superuser** approve or reject (`PATCH /api/leaves/:id`).

The backend `leaves` module is unchanged and still keys on `doctorId` / `doctorName`
(that is the directory record whose leave is being recorded). Its guard
(`leave-request.guard.ts`) blocks overlapping approved leaves and has passing specs —
**do not rekey those fields casually**, you will break `leave-request.guard.spec.ts`.

---

## 4. What the Regional Officer actually does

Role `regional_manager`. Oversight of a *set* of hospitals — one level below the
Admin/superuser, one level above a single hospital's staff.

**Backend powers (enforced by `@Roles`):**

| Endpoint | File |
|---|---|
| `PUT /hospitals/:id` — edit hospital details | `hospitals.controller.ts:49` |
| `PATCH /hospitals/:id/verify` — approve a hospital registration | `hospitals.controller.ts:55` |
| `PATCH /hospitals/:id/reject` — reject a registration | `hospitals.controller.ts:61` |
| `GET /support-requests` — read requests across all hospitals it oversees, filterable to one | `support-requests.controller.ts:17` |
| `PUT /support-requests/:id` — action/resolve a support request | `support-requests.controller.ts:36` |
| file uploads | `uploads.controller.ts:40` |

Explicitly **not** allowed: `PATCH /hospitals/:id/assign-manager` — assigning a
hospital manager is superuser-only.

**Frontend today (`front-end/regional-officer/`):**

- `dashboard.html` — four KPI tiles (Assigned Hospitals, Total Doctors, Available
  Beds, Low Stock Items) plus a "Hospitals Under Me" table.
- `hospital-details.html` — read-only drill-down, five tabs: Overview, Staff &
  Doctors, Beds & Wards, Inventory, Ambulances.
- Login at `auth/regional-officer-login.html`. Sidebar has a single link.

**Known gap:** the backend grants verify/reject on hospital registrations, but the
regional officer UI has no button for it — `dashboard.js` only calls
`Hospitals.getAll()`. Today that approval flow only exists in the superuser's
`hospital-registrations.html`. This is unbuilt UI, not a bug.

---

## 5. Layout

```
back-end/          NestJS. src/<feature>/ = controller + service + dto/ + interfaces/
back-end/data/     JSON file store (users.json, appointments.json, leaves.json, ...)
back-end/dist/     Compiled output — committed, regenerate with npm run build
front-end/         Static HTML/CSS/JS, one folder per portal, no framework
front-end/shared/  nav.js (sidebar + role labels), session.js (routing + portal guard),
                   api.js (API client), db.js, mockdb.json
```

Two files decide role behaviour on the frontend and must be kept in sync with the
`UserRole` enum:

- `front-end/shared/nav.js` — sidebar links and the **display name** per role.
- `front-end/shared/session.js` — post-login redirect and the `rolePathMap` portal
  guard that kicks a user out of a portal that is not theirs.

Backend role source of truth: `back-end/src/common/interfaces/api-response.interface.ts`.

---

## 6. Conventions

- Commits: Conventional Commits (`feat:`, `fix:`, `build:`).
- Branch per member (`vivian`, `nikitha`, `poorna`), merged to `main`.
- Never add a Claude co-author trailer to commits.
- `back-end/dist/` and `back-end/docs/swagger.json` are generated — rebuild rather
  than hand-edit:

  ```bash
  cd back-end
  npm run build                                             # dist/
  npx ts-node generate-swagger.ts | grep -o '{"openapi".*'  # docs/swagger.json
  ```

  `generate-swagger.ts` only prints the document to stdout, mixed in with Nest's
  startup logs — hence the grep. Pipe it through
  `python3 -c "import json,sys; json.dump(json.load(sys.stdin), open('docs/swagger.json','w'), indent=2, ensure_ascii=False)"`;
  `ensure_ascii=False` matters or unicode in summaries gets mangled into `\uXXXX`.

### Gotcha: login rewrites the password before authorising

`AuthService.login` upgrades a legacy plaintext password to a scrypt hash *before* it
checks the role. A login that is ultimately rejected still rewrites that user's stored
password in `data/users.json`. Harmless (the password was verified correct first), but
it means poking at auth dirties the seed data — check `git diff back-end/data/` before
committing.
