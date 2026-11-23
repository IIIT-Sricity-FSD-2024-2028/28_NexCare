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
