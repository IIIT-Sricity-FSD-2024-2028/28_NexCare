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
- Remaining Phase 3 rows belong to the other portal owners (see
  `REDUX_WORK_SPLIT.md` §5).
