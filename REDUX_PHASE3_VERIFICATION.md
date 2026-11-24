# Redux Migration — Phase 3 Verification (Cross-Portal Integration)

Phase 3 checks are backend round trips: act in one portal, log out (every slice
resets), log in as the other role, and confirm the fetch thunk returns the new
data. Verified against a running backend (`node dist/src/main.js`, port 3001)
on 2026-11-23, branch `poornasri-phase3-integration`.

## Poornasri — Hospital Manager + Ambulance

| # | Check | Actors | Result |
|---|---|---|---|
| 1 | Patient pays → HM revenue updates | Patient `payBill` → `fetchHmRevenue` | ✅ Pass |
| 2 | Patient requests ambulance → crew sees it | Patient `requestAmbulance` → 5 s `fetchAmbulanceRequests` poll | ✅ Pass |
| 3 | HM approves a leave → doctor's leaves update | HM `approveLeave` → doctor `fetchDoctorLeaves` | ✅ Pass |

### 1. Patient pays → HM revenue updates

- Patient `sravani.reddy@example.in` (P002, H001) had unpaid bill
  `BILL-H001-P002-05` (₹944, Pending).
- `POST /api/payments/intent` → `POST /api/payments/:id/confirm` with the
  approved test card → bill settled (`status: succeeded`).
- Hospital manager `hospitalmanager@nexcare.com` re-fetched
  `GET /api/revenue/hospital/H001` (what `fetchHmRevenue` calls on
  `RevenuePage` mount):

  | Metric | Before | After |
  |---|---|---|
  | collected | 10207 | **11151** (+944) |
  | outstanding | 2950 | **2006** |
  | billsPaid | 8 | **9** |

### 2. Patient requests ambulance → crew sees it

- Patient `patient@gmail.com` (P001, H001) created a request via
  `POST /api/ambulance` → `AMB-MWTA4G1QRQO`, status `Pending`, hospital `H001`
  (the same payload `requestAmbulance` sends, including the hospital the
  patient picked in the form).
- Ambulance crew `ambulance@nexcare.com` (H001) re-fetched
  `GET /api/ambulance` — exactly what the 5 s `usePolling` →
  `fetchAmbulanceRequests` dispatch does — and the request is in the list,
  visible to `selectPendingRequests` on the Incoming Requests page.

### 3. HM approves a leave → doctor's leaves update

- Doctor `vikram@nexcare.in` (U006, H001) filed a leave via
  `POST /api/leaves` → `LMWTA4ZQYW83`, status `pending`.
- `GET /api/leaves?doctorId=U006` as the doctor (what `fetchDoctorLeaves`
  dispatches on `LeavesPage` mount) showed `pending`.
- HM `hospitalmanager@nexcare.com` ran `PATCH /api/leaves/:id`
  `{ status: 'approved' }` (what `approveLeave` sends).
- The doctor's next `GET /api/leaves?doctorId=U006` shows `approved` with
  `approvedByName` set — the StatusPill flips to approved.

## Notes

- All three flows are live recomputations on the backend (revenue is derived
  from the bills store on every call; leaves and ambulance requests are
  re-fetched per mount/poll), so no slice held stale data.
- Runtime data files under `back-end/data/` were restored after testing; the
  repo's seed data is unchanged.

## Nikitha — Doctor and Administrative Staff

Verified on 2026-11-23 in a browser with the Vite development server and the
real NestJS API. The backend ran with a temporary copy of the seed data.

| Check | Redux thunks | Result |
|---|---|---|
| Patient books an appointment and the doctor sees it | `createAppointment`, `fetchDoctorAppointments` | The same appointment ID appeared in the doctor's list with status `Pending`. |
| Staff generates a bill and the patient sees it | `generateBill`, patient `fetchBills` | The same pending bill ID and ₹250 line item appeared in the patient's billing state. |
| Hospital Manager approves a leave and the doctor sees it | `requestLeave`, `approveLeave`, `fetchDoctorLeaves` | The same leave ID changed from `pending` to `approved`. |

- Dispatched `logoutUser` between roles and checked that it cleared auth,
  the stored token, and the appointment, bill, and leave lists used in these
  checks. Each receiving role fetched its data after signing in again.
- Opened all five Doctor pages and all ten Administrative Staff pages with
  Redux development checks enabled. No serialization warnings or uncaught
  browser errors were reported.
- The frontend production build passed. Repository seed files were untouched.

## Deekshita — Superuser

Phase 3 gives Superuser a live view of Regional Officer registration decisions
without duplicating the backend call in the RO slice.

| Check | Redux thunks/actions | Result |
|---|---|---|
| RO clears or rejects a hospital and Superuser sees the decision | `reviewHospital` → `reviewHospital.fulfilled` in `superuserSlice` | The shared Superuser registration list updates `regionalReviewStatus` immediately. |
| Superuser re-fetches registrations | `fetchRegistrations` | `Hospitals.getAll()` and `Users.getAll()` restore the persisted status after login or remount. |
| Logout clears every slice | `logoutUser.fulfilled`, `sessionCleared` | The root reducer recreates every slice with its `initialState`. |
| Redux development checks | `immutableCheck`, `serializableCheck` | Store configuration enables both checks and should report no warnings for Superuser UI. |

The Superuser hierarchy is intentionally handled by `HierarchyView.jsx`, which
owns one fetch and is shared with Regional Officer; it is not duplicated into
the Superuser slice, as defined by the Redux work split.

### Live read-only API check

On 2026-11-23, the running NestJS API was queried with the seeded Regional
Officer and Superuser accounts:

- Regional Officer review queue returned 3 registrations.
- Superuser hospital list returned 11 hospitals.
- A shared hospital record used the same backend fields in both roles
  (`H001`, `verified`, with its regional review status).

No registration or seed data was changed during this check.

## Poorvishree — Regional Officer

Verified on 2026-11-23 against the running NestJS API (port 3001) and the Vite
app. `reviewHospital` is the Regional Officer thunk (`PATCH /hospitals/:id/regional-review`).
After logout, Superuser `fetchRegistrations` (`GET /hospitals` + `GET /users`)
must return the persisted decision.

| Check | Redux thunks | Result |
|---|---|---|
| RO reviews a hospital and Superuser sees the new status | `reviewHospital`, then Superuser `fetchRegistrations` | Same hospital ID flipped to `regionalReviewStatus: cleared` on the Superuser list. |
| Regional Officer pages have no Redux serializable warnings | RO slice selectors + pages | All nine RO screens loaded with the console hook; no non-serializable or immutable warnings. |
| Final repo check | — | `npm run build` passed. The only remaining `createContext` / `useContext` is `DialogProvider`. |

### RO reviews a hospital → Superuser sees it

- Rainbow Hospital (`H009`) was `pending_verification` with
  `regionalReviewStatus: pending`, assigned to Regional Officer `RM001`
  (`regional@nexcare.com`).
- As the Regional Officer, `GET /api/hospitals/review-queue` (what
  `fetchHospitalApprovals` calls) included `H009`.
- `PATCH /api/hospitals/H009/regional-review` `{ decision: 'cleared', notes: 'Phase 3 verification: facilities and records check out.' }`
  — the same payload `reviewHospital` sends — returned
  `regionalReviewStatus: cleared`. Hospital stayed `pending_verification`
  (final approval is Superuser-only).
- Logged out of that session and signed in as Superuser
  (`superuser@nexcare.com`). `GET /api/hospitals` (what `fetchRegistrations`
  uses) returned 11 hospitals; `H009` had `regionalReviewStatus: cleared`
  and the same notes.
- Superuser Hospital Registrations (`/superuser/hospital-registrations`)
  showed Rainbow Hospital as **RO Cleared**, with Final Approve / Reject
  enabled. Regional Officer Hospital Approvals showed the review as sent
  to the Superuser.

### Regional Officer portal console pass

Opened every Regional Officer route with Redux development checks enabled:

Dashboard, My Region (hierarchy), Hospital Approvals, Revenue, Performance
Alerts, Hospital Comparison, Patient Complaints, My Profile, and Hospital
Details (`?id=H001`). No serialization warnings or uncaught console errors.

Runtime data files under `back-end/data/` were restored after testing; the
repo's seed data is unchanged.

## Vivian — Patient

Verified on 2026-11-25 against the running NestJS API (port 3001) and the Vite
**development** server, so Redux Toolkit's `serializableCheck` and
`immutableCheck` were active. They do not run in a production build. A
Playwright script read the live store through the `<Provider>` and asserted on
`state.patient` / `state.doctor` / `state.ambulance` / `state.hospitalManager`
directly, not on the DOM: **32/32 checks passed**. Runtime files under
`back-end/data/` were restored afterwards.

### The four cross-portal round trips

| # | Check | Redux thunks | Result |
|---|---|---|---|
| 1 | Patient books → doctor sees it | `createAppointment` → logout → doctor `fetchDoctorAppointments` | `APT-…` booked with Dr. Vikram Patel (H001, Orthopaedics) through the wizard UI appeared in `state.doctor.appointments.list`. |
| 2 | Staff generates a bill → patient sees it | staff `POST /billing` → patient `fetchBills` | `BILL-H001-001` (₹250 + GST) was in `state.patient.billing.bills`. The doctor's `complete` also added the consultation fee to the patient's open pending bill (the backend appends it to that bill; it does not open a new one). |
| 3 | Patient pays → HM revenue updates | `payBill` (card form, test card 4242…) → HM `fetchHmRevenue` | `collected` went from ₹10,207 to ₹10,502 (+₹295, exactly the bill total). |
| 4 | Patient requests an ambulance → crew sees it | `cancelAmbulanceRequest` (the seeded open request) → `requestAmbulance` → crew `fetchAmbulanceRequests` poll | The new `AMB-…` request (H001) was in `state.ambulance.requests.list` on the crew's Incoming Requests page. |

### Same store, different screens

- Paying a bill on Billing dropped the dashboard's Pending Bills count from 2
  to 1. `payBill.fulfilled` marks the bill paid in `billing.bills` and the
  dashboard reads the same list.
- After booking, reopening the wizard for the same doctor and date showed that
  slot as **Booked**. The wizard now derives booked slots from
  `patient.appointments.list`, not from a separate fetch.

### Logout

The patient's `logoutUser.fulfilled` reset every patient sub-state (profile,
appointments, bills, hospitals, nearby hospitals, search, directory, schedules,
test cards). It also set `auth.user` to `null` and wiped `nexcare_auth_token`. The
doctor who signed in next on the same tab saw an empty `state.patient`.

### All patient data now comes from the store

Before this change, six patient screens still fetched into component
`useState`: the dashboard's hospital network, the feedback hospital picker, the
ambulance hospital picker, Find Hospitals, the booking wizard (directory,
published schedules, booked slots) and the card form's test cards. The profile
page also called `Auth.changePassword` directly, and the notification bell kept
its own copy of appointments and bills. Each of these now dispatches a thunk
and reads a selector:

| Screen | Thunk | Store key |
|---|---|---|
| Dashboard hospital network, ambulance hospital picker | `fetchNearbyHospitals` | `patient.nearbyHospitals` |
| Feedback hospital picker | `fetchHospitals` | `patient.hospitals` |
| Find Hospitals | `searchHospitals` | `patient.hospitalSearch` (`query` = the filters answered) |
| Booking wizard catalogue | `fetchDoctorDirectory` | `patient.directory` |
| Booking wizard rosters | `fetchPublishedSchedules` | `patient.schedules` |
| Booking wizard booked slots | `fetchAppointments` + `bookedSlotsFrom()` | `patient.appointments` |
| Card payment form | `fetchTestCards` | `patient.payments` |
| Profile password | `changePassword` | `patient.profile.error` on rejection |
| Care+ cancel | `cancelMembership` | `patient.membership` |
| Notification bell, invoice modals | (selectors only) | `selectAppointments`, `selectPendingBills`, `selectBillById` |

Live checks: each of those keys filled on its page (11 hospitals nearby, 11 in
the picker, 2 for a "Tirupati" search, 8 hospitals in the catalogue, 1
approved H001 roster, 5 test cards). A wrong current password produced
`changePassword.rejected` with "Current password is incorrect" in
`patient.profile.error`.

Local `useState` now holds only form inputs, wizard steps, open/closed flags,
one-button busy flags and the GPS fix on Find Hospitals.

### CRUD per repository (patient slice)

| Repository | Create | Read | Update | Delete |
|---|---|---|---|---|
| appointments | `createAppointment` | `fetchAppointments` | `rescheduleAppointment`, `cancelAppointment` | `deleteAppointment` |
| feedback | `submitFeedback` | `fetchFeedback` | `updateFeedback` | `deleteFeedback` |
| membership | `subscribeMembership` | `fetchMembership`, `fetchPatientPlans` | `subscribeMembership` (plan change) | `cancelMembership` |
| patients | registration page | `fetchPatientProfile` | `updatePatientProfile`, `changePassword` | staff/superuser only |
| billing | staff `generateBill` | `fetchBills` | `payBill` | staff only |
| ambulance | `requestAmbulance` | `fetchAmbulanceRequests` | `cancelAmbulanceRequest` | staff only |
| hospitals, users/doctors, schedules, payments | — | `fetchHospitals`, `fetchNearbyHospitals`, `searchHospitals`, `fetchDoctorDirectory`, `fetchPublishedSchedules`, `fetchTestCards` | — | — |

"Staff only" means the backend's `@Roles` refuses the patient role. Those
writes live in the staff and superuser slices.

### Console

The whole patient portal, the doctor appointments page, the hospital manager
revenue page and the crew requests page were opened under the development
checks. There were no non-serializable or mutation warnings and no uncaught
errors. The only console error was the deliberate wrong-password `400`.
`npm run build` passes.
