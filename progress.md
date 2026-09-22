# NexCare — React SPA migration progress

Companion to [`plan.md`](plan.md). Update this file at the end of every working session:
flip checkboxes, add a dated log line, note anything deferred. Do not edit `plan.md` for
status.

**Current phase:** Phase 8 done — the migration is complete. Two cutover commands
are still outstanding (see the Phase 8 section); everything else has landed. A
full backend + frontend audit followed on the same day: 9 defects found, 9 fixed
(see "Post-migration audit" below).
**Last updated:** 2026-09-22 (Phase 8 + audit)

---

## Phase status

| Phase | Name | Status | Started | Done | Commit |
|---|---|---|---|---|---|
| 0 | Foundation — multi-role shell | ✅ done | 2026-09-19 | 2026-09-19 | (uncommitted) |
| 1 | Public site + auth (16 pages) | ✅ done | 2026-09-19 | 2026-09-19 | (uncommitted) |
| 2 | Patient portal (8 pages) | ✅ done | 2026-09-20 | 2026-09-20 | (uncommitted) |
| 3 | Administrative Staff portal (11 pages) | ✅ done | 2026-09-20 | 2026-09-20 | (uncommitted) |
| 4 | Hospital Manager portal (12 sections) | ✅ done | 2026-09-20 | 2026-09-20 | (uncommitted) |
| 5 | Ambulance Staff portal (6 sections) | ✅ done | 2026-09-20 | 2026-09-20 | (uncommitted) |
| 6 | Regional Officer portal (9 pages) | ✅ done | 2026-09-21 | 2026-09-21 | (uncommitted) |
| 7 | Superuser portal (9 pages) | ✅ done | 2026-09-21 | 2026-09-21 | (uncommitted) |
| 8 | Parity sweep, cutover, delete `front-end/` | ✅ done | 2026-09-22 | 2026-09-22 | (uncommitted) |

Legend: ⬜ not started · 🟨 in progress · ✅ done · ⛔ blocked

Already in React before this plan (Lab deliverable, 2026-09-18): Doctor portal —
login, dashboard, appointments, earnings, leaves, profile. Re-homed in Phase 0.

---

## Phase 0 — Foundation ✅
- [x] Package renamed to `nexcare-frontend`, `front-end-react/dist/` gitignored, tab title "NexCare"
- [x] Folder tree per plan §1 (`portals/`, `features/`, `components/{layout,ui}`); `src/pages/` gone
- [x] Doctor pages moved to `portals/doctor/`, mounted at `/doctor/*`, still working (26/26 browser checks)
- [x] `api/index.js` covers every namespace in `shared/api.js` (Auth, Users, Patients, Appointments,
      Billing, Ambulance, Feedback, Beds, Inventory, Hospitals, SupportRequests, Leaves, Revenue,
      Payments, Schedules, Hierarchy, Notifications, System) — HTML method names kept, doctor aliases kept
- [x] `api/client.js`: CSRF prime-and-retry, 401 → session cleared (only when the request carried a
      token), `VITE_API_URL` override, `http.upload()` multipart, `ApiError` with `.status`
- [x] `AuthContext`: all five session keys + `isLoggedIn`, JWT expiry check, role aliases,
      `login(email, password, role)`, logout order = backend first then wipe (as `session.js`)
- [x] `RequireAuth` takes `roles`; wrong role → own home (session kept)
- [x] `Sidebar` driven by `layout/navigation.js` (all seven roles, labels/order from each portal's HTML)
- [x] `components/ui`: `Tabs`, `ConfirmDialog` added; `Dialogs.jsx` = `NexCareUI` success/error/loading
      as `useDialogs()`; toast now supports `warning` + duration and stacks
- [x] `api/links.js` — `pageLink()` + `LEGACY_ROUTES` (every HTML page and hash section → SPA route)
- [x] Deep link refresh works in `vite preview` (`/doctor/leaves` → 200)
- [x] `db.js` / `mock-hospitals.js` decision recorded below
- [x] `npm run build` clean (232 kB JS / 72 kB gzip before any lazy-loading)
- [x] All seven portals mounted with `<ComingSoon phase=N/>` placeholders and role guards, so every
      role → home redirect and cross-portal link already resolves

## Phase 1 — Public + auth ✅
- [x] `/` landing — markup converted 1:1 (`portals/public/LandingPage.jsx`), `landing.js` → `useLandingEffects`,
      `landing.css` route-mounted via `hooks/useStylesheet` (its `body`/`h1`/`.btn-primary` rules must not leak)
- [x] `/hospital-registration` — `landing/hospital-registration.html` (no file upload existed; plan §3 was wrong on that)
- [x] `/login` hub (5 role radios)
- [x] `/login/patient` · `/login/doctor` · `/login/staff` · `/login/hospital-manager` · `/login/regional-officer` · `/login/superuser`
      — one `LoginPage` driven by a per-slug table (title, fixed role or role picker, footer links)
- [x] `/register/patient` · `/signup` (same form, `variant` prop) · `/register/staff` (doctor-only fields)
- [x] `/forgot-password` (2-step, strength meter, eye toggles) · `/change-password` (guarded, live rule ticks)
- [x] Every actor in `ACTOR_CREDENTIALS.md` logs in through the SPA and lands on the right home (12 login paths × role)
- [x] `auth.css` rescoped under `.auth-page`; `.header` → `.auth-header` (portals own `.header`)
- [x] 51/51 browser checks; side-by-side screenshots vs the HTML pages match (landing, login hub, forgot, hospital reg)

## Phase 2 — Patient ✅
- [x] dashboard · [x] hospital-search · [x] appointments · [x] billing
- [x] ambulance · [x] feedback · [x] membership · [x] profile
- [x] `features/payments/` — `CardPaymentForm` + `payBill()` (intent → confirm, one idempotency
      key per intent); the test cards are listed from `GET /payments/test-cards`, not hard-coded
- [x] `features/invoice/` — `invoice.js` (totals, ambulance check, jsPDF export, print fallback)
      + `InvoiceModal.jsx`; jsPDF is a dynamic `import()` so it is only fetched on a download
- [x] `features/doctor-directory/` — the booking catalogue, rebuilt from `GET /hospitals` +
      `GET /users/doctors` (`useDoctorDirectory()`)
- [x] `NexCareDB` / `NexCareStore` calls all replaced with direct API calls
- [x] `patient/styles.css` copied verbatim to `styles/patient.css`, route-mounted, plus a
      documented override block at the end (see decisions)
- [x] Round-trip verified live: book → pay (decline then approve) → invoice PDF → feedback
- [x] 117/117 browser checks against the live backend; side-by-side screenshots vs all 8 HTML pages

## Phase 3 — Administrative Staff ✅
- [x] dashboard · [x] manage-appointments · [x] patient-checkin · [x] patient-directory
- [x] bed-allocation · [x] generate-bill · [x] inventory · [x] staff-scheduling
- [x] leave-requests · [x] feedback · [x] system-logs (a redirect to the dashboard, as the HTML was)
- [x] `utils/validation.js` · [x] `generate_pages.js` fate decided — neither ported (see decisions)
- [x] `administrative_staff/styles.css` + `logo.css` copied verbatim to `styles/staff.css`, route-mounted,
      each page's inline `<style>` block appended scoped under its `.sp-<page>` root class, plus a
      documented override block at the end
- [x] `api/index.js`: `Users/Appointments/Billing/Beds/Inventory.getAll(filters)`, `Beds.update/updateStatus`,
      `Inventory.use({ quantity, notes })`, `Schedules.delete`, new `Uploads` namespace (multipart upload,
      authenticated blob download)
- [x] Round-trip verified live: check-in → admit to a bed → generate the bill → the patient pays it in the
      patient portal → the staff bill list shows it Paid
- [x] 150/150 browser checks against the live backend; side-by-side screenshots vs all 10 HTML pages

## Phase 4 — Hospital Manager ✅
- [x] overview · [x] staff · [x] leaves · [x] schedules · [x] supervision · [x] support
- [x] feedback · [x] inventory-approvals · [x] ambulance · [x] revenue · [x] subscription · [x] setup
- [x] Subscription change scoped to own hospital (`PATCH /revenue/hospital-subscriptions/H002` from the H001
      manager → 403; own hospital moves Starter → Growth → Starter)
- [x] `dashboard.js` split into one module per section under `portals/hospital-manager/`, plus the shell
      (`HospitalManagerPortal`, `HmSidebar`, `HmContext`), `StaffRegistration` (both forms + credentials
      card), `RenewalModal`, `useApprovals` (the leave / requisition decisions three sections share) and
      `hmShared` (the dashboard.css modal, badges, formats)
- [x] `hospital_manager/dashboard.css` copied verbatim to `styles/hospital-manager.css`, route-mounted, with a
      documented override block at the end
- [x] Leave approval round-trips with Phase 3: a staff-recorded leave (`POST /leaves`) is approved and another
      rejected with a reason from the manager's portal, and `GET /leaves` as the staff shows both outcomes
- [x] 138/138 browser checks against the live backend; side-by-side screenshots vs the HTML page at 1280 and 390

## Phase 5 — Ambulance Staff ✅
- [x] dashboard · [x] ambulance-requests · [x] assigned-dispatch
- [x] active-transport · [x] completed-transports · [x] profile
- [x] Status transitions in `features/ambulance/transportSteps.js` (the tracker, next-status and ETA
      tables keyed on `AmbulanceStatus`) + `useTransportEta`; the 5-second refresh is `hooks/usePolling.js`
      (cleared on unmount, paused while the tab is hidden) and the ETA countdown clears with the page
- [x] `app.js` (3,635 lines) split: `portals/ambulance/` has the shell (`AmbulancePortal` — sidebar, arrow-key
      nav, logout confirm), `AmbulanceContext` (the request list, checklist, local profile) and six pages
- [x] `ambulance/styles.css` copied verbatim to `styles/ambulance.css`, route-mounted, with a documented override
      block at the end
- [x] Round-trip verified live: a patient raises the request in the Phase 2 portal → the crew accepts it (checklist
      first), starts, drives it En Route → Picked Up → At Hospital → completes it → `Ambulance Transport ₹500`
      appears once on the patient's pending bill and on the patient's billing page
- [x] 72/72 browser checks against the live backend; side-by-side screenshots vs the HTML page at 1280 and 390

## Phase 6 — Regional Officer ✅
- [x] dashboard · [x] hospital-approvals · [x] hospital-details (`?id=`) · [x] hospital-comparison
- [x] performance-alerts · [x] complaints · [x] revenue · [x] hierarchy · [x] profile
- [x] `features/hierarchy/` — `HierarchyView.jsx` + `hierarchy.css` (the port of `shared/hierarchy-view.js` and the
      inline `<style>` both hierarchy pages carried); the page passes only the heading and description, so Phase 7's
      superuser page is a two-line wrapper
- [x] `regional-common.js` → `portals/regional-officer/roShared.jsx` (badges, stars, `metricClass`, dates, INR, the
      hero / stat-card / details-link pieces); `regional-common.css` copied verbatim to `styles/regional-officer.css`
      and route-mounted by the four pages that loaded it; the inline blocks of approvals + revenue and of
      hospital-details bundled as `styles/regional-console.css` / `regional-details.css`, every rule prefixed
- [x] Approvals consume a Phase 1 registration: two throwaway registrations assigned to RM001 by the superuser
      appear in the queue, one is *cleared* through the confirm dialog and one *rejected* with a reason through the
      prompt modal; the backend records `regionalReviewStatus` + `regionalReviewNotes`, the rows switch to the
      "Sent to superuser…" / "Review rejected…" notes
- [x] Region scoping verified: the review queue, overview, comparison, alerts, complaints, revenue and hierarchy all
      show only RM001's hospitals (H001, H002, H009); `hospital-details?id=H003` shows the backend's *"You are not
      assigned to this hospital"*; `PATCH /hospitals/H003/regional-review` is a 403
- [x] Hierarchy subtree matches `GET /api/hierarchy`: same root label, same hospital nodes in order, every node of
      the tree rendered, `GET /hierarchy/scope` counts in the tiles and ids in the banner
- [x] 152/152 browser checks against the live backend; side-by-side screenshots vs the HTML pages at 1280 and 390

## Phase 7 — Superuser ✅
- [x] dashboard · [x] hierarchy · [x] hospital-registrations · [x] patient-directory
- [x] manage-users · [x] system-settings · [x] feedback · [x] revenue (all six tabs, regional officers drill-down) · [x] reports
- [x] Fee fraction ↔ percent conversion preserved: the Pricing controls tab shows `paymentGatewayRate` as
      `(rate × 100).toFixed(2)` and saves `raw / 100` — typing `2.1` stores `0.021`, verified against
      `GET /revenue/fees`; hospital-plan and membership-tier fees are rupees and round-trip unchanged
- [x] §5B 200/403 matrix re-run from the SPA (fetches issued from the signed-in tab with the token the SPA
      stored, for superuser, RM001, RM002, the H001 manager, a doctor and a patient — 31 checks, see the log)
- [x] `hierarchy` is the two-line wrapper Phase 6 planned around `features/hierarchy/HierarchyView`
- [x] Chart.js (a CDN `<script>` on `reports.html`) is a dependency, dynamically imported — its own chunk
      (208 kB) is fetched the first time a chart is drawn
- [x] `styles/superuser.css`: the nine pages' inline `<style>` blocks, prefixed (`.su-page` for the chrome
      seven pages declared identically, `.su-<page>` for the rest), plus an override block
- [x] 222/222 browser checks against the live backend; side-by-side screenshots vs the HTML pages at 1280

## Phase 8 — Cutover ✅
- [x] `MANUAL_TESTING_CHECKLIST.md` passed on the SPA — 40 API/middleware checks + 91 browser
      checks + the 26-check cross-role flow. The checklist itself was stale against the current
      seed and is rewritten (see below).
- [x] No `.html` links / hard-coded `window.location` strings in `src/` — the only `.html`
      matches are provenance comments (`// patient/billing.html + billing.js`) and
      `api/links.js`'s legacy-name parser; the six `window.location` uses are the API client's
      hostname mirror, `AuthShell`'s error text, the credentials modal's `origin`, and one
      `pathname.endsWith('/setup')` check. Nothing navigates by string.
- [x] Cross-role end-to-end flow done in one sitting (26/26 — see the log)
- [x] `React.lazy` per portal; bundle size noted below
- [x] `README.md` (a "Running it" section added), the app's own `README.md` (rewritten for the
      finished SPA), `PROJECT_CONTEXT.md` (§2 status, §3/§5/§5A route names, §6, §7, §11 seed
      roster, §12–13 rewritten for the SPA, §14 Phase 8 entry, §15 run commands + the
      query-string gotcha), `ACTOR_CREDENTIALS.md`, `DEMO_TEST_CREDENTIALS.md`,
      `TEST_ACCOUNTS.md`, `LOGIN_CREDENTIALS.md`, `VERIFICATION.md` and
      `MANUAL_TESTING_CHECKLIST.md` updated
- [x] `.gitignore`: `front-end-react/dist/` → `front-end/dist/`
- [ ] **`front-end/` deleted and `front-end-react/` renamed to `front-end/`** — blocked, not
      done. The sandbox refused `git rm -r front-end` / `rm -rf` / `mv` as irreversible local
      destruction. Everything else in the phase is complete *as if* the rename had happened:
      the docs, `.gitignore` and the app's README all describe the post-cutover layout. Run:

      ```bash
      cd /home/vivian/FFSD
      git rm -r -q front-end          # the 148 tracked static files
      rm -rf front-end                # node_modules, serve_*.txt, frontend_log.txt
      rm -f front-end-react/plan.md   # the superseded Lab-2 plan
      mv front-end-react front-end
      git add -A front-end .gitignore
      ```
- [ ] Old `front-end-react/plan.md` removed — part of the same blocked step

### Bundle after `React.lazy` per portal

`App.jsx` lazy-loads all seven portals plus the unguarded `HospitalSearchPage`; each
`portals/<name>/index.jsx` exports the route table *and* a default component that renders it,
so that module is the chunk boundary. `vite.config.js` names those chunks after the folder
(they were all `index-<hash>` otherwise). A `.chunk-loading` fallback in `app.css` covers the
Suspense frame.

| | Before | After |
|---|---|---|
| entry chunk | 913.06 kB / 233.56 kB gzip | **278.26 kB / 77.71 kB gzip** |
| over the 500 kB warning | yes | no |

Portal chunks: patient 144.20 · hospital-manager 117.11 · staff 116.24 · superuser 90.36 ·
regional-officer 54.52 · ambulance 46.12 · doctor 27.96 kB. `jspdf` (356 kB) and `chart.js`
(208 kB) stay dynamic imports of their own — fetched only on an invoice download or a report
chart.

---

## Decisions made during the migration
_(things `plan.md` left open, settled while working — date each one)_

- 2026-09-19 — Plan and progress files created at repo root. Old `front-end-react/plan.md`
  is the Lab-2 doctor-portal plan and is left in place until Phase 8.
- 2026-09-19 (Phase 0) — **API calls throw** instead of returning `{success:false}`. The HTML layer
  never threw; the React client throws `ApiError` and resolves `{ success: true, data, message }`,
  so `res.data` reads the same and pages use try/catch instead of `if (!res.success)`.
- 2026-09-19 (Phase 0) — **`shared/db.js` is not ported.** It is the old localStorage
  "compatibility bridge"; only `patient/` still calls it (3 methods). Phase 2 replaces those with
  API calls. `shared/mock-hospitals.js` (1,965 lines, 3 pages) — same: Phase 2 audits which of it
  has no backend equivalent before porting anything.
- 2026-09-19 (Phase 0) — **Wrong-role visits go to the user's own home, not to login.** `session.js`
  wiped the session and bounced to login; the SPA keeps the session and redirects. Same outcome
  (you cannot see the other portal) without a surprise logout.
- 2026-09-19 (Phase 0) — **Back button is inline in the header**, not viewport-fixed. The HTML's fixed
  button overlapped the logo (its sidebar-width lookup ran before `nav.js` injected the sidebar);
  the fixed version in React overlapped the title. Inline before the title avoids both.
- 2026-09-19 (Phase 0) — Sidebar icons for patient / staff / hospital-manager / ambulance are the
  closest shapes from the `nav.js` set; those portals had their own inline sidebars with their own
  icons and CSS. Phases 2–5 bring each portal's real sidebar styling and may replace the icons.
- 2026-09-19 (Phase 0) — `React.lazy` per portal deferred to Phase 8 as planned; bundle is small.
- 2026-09-19 (Phase 1) — **`hospital-registration/register.html` + `register.js` are not ported.** Nothing links
  to them (landing and the login hub both link `landing/hospital-registration.html`), and `register.js` reads
  form ids that do not exist in its own HTML. Dead page; Phase 8 deletes it with the rest.
- 2026-09-19 (Phase 1) — **No `window.alert()` on login failure.** The HTML login pages showed the inline error
  *and* an alert popup ("as requested by user" per the comment). The SPA shows the inline message only.
- 2026-09-19 (Phase 1) — **Stylesheets with page-global selectors are route-mounted, not bundled.** `useStylesheet(url)`
  adds a `<link>` on mount and removes it on unmount. Used for `landing.css`; the pattern is there for
  `patient/styles.css`, `ambulance/styles.css`, `hospital_manager/dashboard.css` in Phases 2/4/5.
  Small page styles (`forgot-password`, `hospital-registration`) are bundled with every rule prefixed instead.
- 2026-09-19 (Phase 1) — **`/signup` registers then calls `/auth/login`.** `signup.html` copied the token from the
  register response into storage by hand; going through `login()` writes the same keys and lands on the same
  `/patient/dashboard`.
- 2026-09-19 (Phase 1) — Login pages never bounce an already-signed-in visitor (as the HTML: they may be switching
  role) — except when RequireAuth sent them with a `from`, which is honoured. Footer links between login pages
  carry that state along.

- 2026-09-20 (Phase 2) — **`shared/db.js` and `shared/mock-hospitals.js` are not ported, as Phase 0 planned.**
  Every `NexCareStore` call became a direct API call: the backend already scopes `GET /appointments`,
  `/billing` and `/feedback` to the signed-in patient, so the "active patient scope" the store kept in
  memory is not needed. `mock-hospitals.js` was the offline catalogue behind the booking wizard; with the
  API unreachable the wizard now says so instead of offering 1,965 lines of stale hospitals.
- 2026-09-20 (Phase 2) — **The booking POST sends exactly the fields `CreateAppointmentDto` declares.**
  `appointments.js` built a wider object (`consultationFee`, `patientName`) and `db.js` whitelisted it
  down before POSTing; sending the wider one straight through is a 400, because the ValidationPipe runs
  with `forbidNonWhitelisted`. `patientId` **is** sent even though the controller overwrites it with the
  caller's own id — the DTO marks it `@IsNotEmpty`, and validation runs first.
- 2026-09-20 (Phase 2) — **The selected bill travels in `?bill=<id>`, not `sessionStorage`.** `billing.js`
  used `nexcare_selected_bill_id` because the static host dropped query strings (plan.md §4). The old key
  is not read at all — nothing outside the patient portal wrote it.
- 2026-09-20 (Phase 2) — **`patient/styles.css` is route-mounted and gets an override block appended.**
  The patient pages loaded `styles.css` and nothing else; in the SPA `global.css`, `portal.css` and
  `nav.css` are bundled for every route, and they share class names with it. Four leaks were found and
  are undone at the end of `styles/patient.css`, with the copy above them left verbatim:
  `.tab-btn.active` (portal.css painted it blue while this file colours the text blue — the active
  feedback tab's label was invisible), `.modal-content` (global.css lifts it 20px and only restores it
  for its own `.modal-overlay.active` convention), `.sidebar` (global.css forces `z-index: 9999
  !important`, which put the sidebar on top of every modal), and `.form-group` / its label (global.css
  adds margins these flex-`gap` forms do not want).
- 2026-09-20 (Phase 2) — **`membership.html`'s inline `<style>` became `styles/membership.css`**, also
  route-mounted: its `.modal-overlay` / `.modal-card` / `.modal-header` names collide with global.css and
  patient.css. Same treatment — one override re-asserting `opacity`/`visibility`, because global.css
  hides `.modal-overlay` until a `.active` class the membership markup never used.
- 2026-09-20 (Phase 2) — **`/patient/hospital-search` stays outside the role guard.** `hospital-search.html`
  had no auth guard: a visitor from the landing page could search, and only *booking* asked for a login.
  The route is mounted before the guarded portal; a signed-in patient gets the portal shell and sidebar,
  anyone else the page's own three-item sidebar.
- 2026-09-20 (Phase 2) — **One patient sidebar for all eight pages.** The HTML pages each carried their own
  inline sidebar and they disagreed: `billing.html`, `membership.html` and `profile.html` omit "Search
  Hospitals", `appointments.html` omits it too. The SPA shows the dashboard's full list everywhere.
- 2026-09-20 (Phase 2) — **One header format.** `membership.js` wrote the patient id bare (`P002`) while
  `dashboard.js` wrote `Patient ID: P002`. The shared `PatientHeader` uses the dashboard's format.
- 2026-09-20 (Phase 2) — **No floating back button on the patient pages.** `session.js` injected one into
  every portal page; Phase 0 already replaced it with an inline button in the shared `Header`, and the
  patient pages use their own header, which never had one. Every patient page is one sidebar click away.
- 2026-09-20 (Phase 2) — **jsPDF is a dependency, dynamically imported.** It was a CDN `<script>` on the
  HTML pages. Bundling it eagerly pushed the main chunk to 834 kB; behind `await import('jspdf')` it is
  477 kB (128 kB gzip) and the PDF machinery is only fetched when someone downloads an invoice.

- 2026-09-20 (Phase 3) — **`administrative_staff/validation.js` and `generate_pages.js` are not ported.**
  `validation.js` is an ES module that no staff page ever imported (every page inlines its own checks),
  so `utils/validation.js` would have been dead code from day one; the pages keep their inline rules.
  `generate_pages.js` is a one-off Node script that once wrote an early `staff_scheduling.html` /
  `feedback.html` from hard-coded arrays — the checked-in pages have since outgrown it. Both go with
  `front-end/` in Phase 8.
- 2026-09-20 (Phase 3) — **`alert()` / `confirm()` / `prompt()` become toasts, `ConfirmDialog` and a
  small input modal.** The staff scripts used ~60 native dialogs. Validation and result messages are
  `notify()` toasts with the HTML's exact wording (warning for validation, error for failures, success for
  confirmations); every `if (!confirm(…)) return;` is `if (!(await ask(…))) return;` via
  `portals/staff/useConfirm.jsx` (the shared `ConfirmDialog`); the one `prompt()` (check-in "Update
  Location") is a modal with an input. Server errors show the `ApiError` message where the HTML showed a
  flat "Failed to …" — same outcome with the reason attached (as Phase 2 decided for ambulance).
- 2026-09-20 (Phase 3) — **Check-ins stay in `sessionStorage` under `nexcare_checkins_session`.** The
  HTML page never sent check-ins to the backend (there is no endpoint); the SPA keeps the same key so a
  tab that checked patients in on the HTML page still lists them.
- 2026-09-20 (Phase 3) — **`NexCareStore.logActivity()` is kept as `POST /system/activity`.** On the
  staff pages it was a real backend write (via `shared/db.js`), so the SPA posts the same record
  (best-effort, `staffData.js logActivity()`); Phase 2 had nothing to port because the patient scripts
  never called it. This is why `system-activity.json` keeps changing.
- 2026-09-20 (Phase 3) — **One sidebar, no floating back button, no hamburger effect.** The ten pages
  carried the same inline sidebar (menu order from `dashboard.html`); `session.js`'s floating back
  button is dropped as on the patient pages. The dashboard's ☰ button toggled a `sidebar-collapsed`
  body class that no stylesheet defines; it is kept and still does nothing visible.
- 2026-09-20 (Phase 3) — **`styles/staff.css` override block** (same treatment as `patient.css`):
  `nav.css` fixes `.sidebar` to the viewport and `global.css` forces its z-index — this portal's sidebar
  is a flex child that scrolls with the page; `portal.css`'s `.btn:hover` painted the blue `.btn` white;
  `global.css`'s `* { margin: 0 }` removed the default `h2`/`h4`/`p` margins these pages relied on;
  `global.css` lifts `.modal-content` 20px and pads `.form-group label`. Each is undone under
  `.staff-portal` at the end of the file; the copies above stay verbatim.
- 2026-09-20 (Phase 3) — **Manage Appointments lists the backend's real statuses.** See "Fixed on port"
  below; the filter additionally offers `Scheduled` because the seed still holds lowercase `scheduled`
  rows (filterable, not saveable — `UpdateAppointmentDto` is `@IsEnum(AppointmentStatus)`).

- 2026-09-20 (Phase 4) — **Each `#section` is a route; the header title follows it.** `switchTab()` wrote the
  section titles into `.dashboard-header h1` / `.header-desc`, selectors the HTML never had (the header is
  `#pageTitle`), so the HTML page said "Hospital Overview" on every tab. The SPA shows the titles the table
  intended. The sidebar collapse (`body.sidebar-collapsed`, remembered in `localStorage` under
  `nexcare_sidebar_collapsed`) and the phone drawer (`body.mobile-sidebar-open` + overlay) are body classes
  the shell toggles and removes on unmount, because `dashboard.css` keys on them.
- 2026-09-20 (Phase 4) — **Shared state lives in `HmContext`, not in module scope.** `dashboard.js` kept
  `managerProfile`, `subscriptionData` and the nav badge counts as globals every section read. The context
  holds the hospital identity, the subscription (banner + sidebar pill + overview card + subscription hero),
  the three sidebar counters, the two header-launched modals and a `version` counter that any write bumps so
  the mounted section reloads (plan.md §4, "sections share module-level state").
- 2026-09-20 (Phase 4) — **The duplicated HTML is ported once.** `dashboard.html` declared `#leavesTab` twice
  (the first one empty — `getElementById` found it, so the Doctor Leaves tab was blank), `#revenueTab` twice
  and `#newAmbulanceModal` twice, and `#setupTab` / the second `#leavesTab` carried inline `display:flex`
  that beat `.tab-content { display:none }`, so Setup was visible under every tab. Each section is one
  component; Revenue shows the stat grid, the department split and the "what this hospital owes" card
  (which the id collision had sent to the Subscription tab, where it is also shown).
- 2026-09-20 (Phase 4) — **Subscription section = registration licence + platform plan.** The HTML showed the
  annual "Enterprise License" (`GET /hospitals/:id/subscription`, ₹50,000 renewal through
  `POST /hospitals/:id/renew-subscription`) and nothing about the §5A plan. Both are shown, labelled apart:
  the licence hero + renewal history as before, and a "Platform plan — priced by staff accounts" card with
  the catalogue from `GET /revenue/hospital-plans`, the current plan (matched by name from
  `platformCharges.planName`, since `GET /revenue/hospital-subscriptions` is superuser-only) and a confirm →
  `PATCH /revenue/hospital-subscriptions/:hospitalId { planId }`. The renewal modal records the payment
  method the manager actually chose (`Card (•••• 9921)`, `Net Banking (…)`) — `processMockRenewalPayment()`
  sent `UPI (admin.aiims@icici)` whatever tab was open.
- 2026-09-20 (Phase 4) — **`confirm()` → `ConfirmDialog`, `alert()` → toast, the missing modals built.**
  Schedules and staff status use the shared `useConfirm` (moved from `portals/staff/` to `hooks/` now that
  two portals import it). The staff Activate/Deactivate button opened `#staffStatusModal` and the feedback
  "Update Status" opened `#hmFeedbackStatusModal` — neither existed in `dashboard.html`, so both buttons
  threw; the SPA has a confirm and a status modal. "+ New Support Ticket" called `openSupportModal()`, which
  `dashboard.js` never defined; the SPA has the modal, posting `CreateSupportRequestDto`.
- 2026-09-20 (Phase 4) — **Pending counts include `PENDING_APPROVAL`.** `loadOverview()` counted only
  `PENDING` requisitions (3) while `filterInventoryReqs()` listed `PENDING_APPROVAL` rows as actionable too
  (7), so the badge disagreed with the tab. The SPA counts what it lists.
- 2026-09-20 (Phase 4) — **Leave rows read `type` and count their own days.** Seeded leaves carry
  `type: "CASUAL"` and no `daysCount`; `dashboard.js` read `leaveType` / `daysCount` and printed "Casual
  Leave" / "1 day" for every row. Both spellings are read, days come from the dates when the record has none.
- 2026-09-20 (Phase 4) — **`styles/hospital-manager.css` override block.** `dashboard.html` loaded
  `global.css` too, so global.css's form-group / label margins, `.btn-secondary`, `.data-table` are part of
  the reference look and are *kept*. Undone: `nav.css` sidebar padding, its `.logout-btn` margin/size,
  `.main-content` 282px margin, `portal.css`'s `.header-title`; the sidebar's forced z-index 9999 goes back
  under the modals. Two SPA-only layout fixes, both documented in the block: `.main-content` is sized from
  the viewport (the HTML scrolled sideways at 1280 — its `flex: 1` item grew to its content), and the
  two-column grids stack under 768px (the HTML scrolled sideways at 390 too); `.sub-hero-info` gets a
  flex-basis so the countdown box sits beside the licence details as the row was designed.
- 2026-09-20 (Phase 4) — **"+ New Transport" asks for the patient id.** The HTML form never collected one and
  the backend validator requires it, so every dispatch from the HTML page was a 400. The toast says the
  request is *pending dispatch* — `dashboard.js` said "dispatched", but the backend records every new
  request as `Pending` until the ambulance desk dispatches it.

- 2026-09-20 (Phase 5) — **The server status is the only transport state.** `app.js` kept a parallel
  `stepIndex` counter beside the backend status, and its `TRANSPORT_STEPS` (6 rows, starting at Pending) and
  `STEP_TO_BACKEND_STATUS` (5 rows, starting at Dispatched) were offset by one: Start Transport wrote
  `En Route` + step 0, so the tracker said "Pending — In Progress" for a request the server had En Route;
  "Update to Next Step" sent `Completed` at step 4 (raising the patient's charge) and then `En Route` at
  step 5, and the Complete button sent `Completed` again. `features/ambulance/transportSteps.js` derives the
  tracker from the status (Dispatched → En Route → Picked Up → At Hospital → Completed), "Next Step" is
  `PATCH /ambulance/:id/status` with the next value, and completion is `PATCH /ambulance/:id/complete`
  (after `PUT` with the `completedDate` / `completedTime` stamps the page recorded), so the ₹500 transport
  charge is raised exactly once. `stepIndex` is no longer written.
- 2026-09-20 (Phase 5) — **Accept is `PATCH /ambulance/:id/dispatch` with the crew as `assignedTo`.**
  `app.js` sent a bare `PUT { status: 'Dispatched' }`, which left the request attributed to nobody; the
  dispatch route sets the same status and records who took it (and notifies the patient). Cancel Assignment
  keeps the page's `PUT { status: 'Pending' }`.
- 2026-09-20 (Phase 5) — **Requests are the hospital's, not the crew member's.** The page listed every
  request `GET /ambulance` returned (the backend scopes to the crew's hospital) with no `assignedTo` filter,
  and held one active transport at a time (Start disabled with "Finish current transport first"). Kept.
- 2026-09-20 (Phase 5) — **The ETA countdown works.** `ETATimer` wrote into `#eta-<requestId>`, an element
  the page never had, so the banner always read "--:--"; `useTransportEta` counts the step's estimate
  (Dispatched 8 · En Route 12 · Picked Up 5 · At Hospital 15 min) down in the banner and restarts on every
  status change.
- 2026-09-20 (Phase 5) — **Profile shows the signed-in crew member.** The page showed a hard-coded
  "Alex Martinez / +1 (555) 987-6543 / AMB-05 / EMP-AMB-2024-142 / EMT-45782-CA / January 15, 2024"
  whoever was logged in (two competing initialisers, `initProfile` and `initializeProfile`, fought over the
  same form). The SPA starts from the login user — name, phone, employee id, and now `assignedVehicle`,
  `driverLicense`, `shift`, `joiningDate`, which `AuthService.login` copies onto the response when the
  record has them (backend: four lines + the interface, the only way this role can see its own record since
  `GET /users/:id` is closed to it). Edits (name, 10-digit phone, vehicle, availability) stay in
  sessionStorage `ambulanceProfile` as the page kept them; its "sync name with backend" was
  `PUT /users/:id`, a 403 for this role every time, and is not attempted.
- 2026-09-20 (Phase 5) — **Completed Transports has no Delete.** The page's Delete called
  `PATCH /ambulance/:id/cancel`, which refuses a completed request (and `DELETE` is staff-only and refuses
  them too), so every click failed; the history is the record. Cancelled requests, which `app.js` showed
  as "Completed", get their own badge; a "Completed At" column shows the stamps.
- 2026-09-20 (Phase 5) — **Dropped from the HTML:** `NexCareStore.logActivity()` on completion
  (`POST /system/activity` is staff/superuser-only — a guaranteed 403 for this role), the
  `SessionManager` / `StateManager` / `NavigationHistory` machinery (routes), the `#validation-tests`
  self-test page, `setupAutoSave` (the only form is the profile), `showPageWithLoading`. `ToastNotifications`
  → the shared `notify()`; `confirm()` on logout and cancel-assignment → `ConfirmDialog`; the failed-refresh
  alert fires once per outage instead of every 5 seconds.
- 2026-09-20 (Phase 5) — **`styles/ambulance.css` override block.** `index.html` loaded only this file. Undone:
  nav.css's fixed `.sidebar` (made sticky instead; static under 768px where the file stacks it), its
  `.nav-item` link styling (here the `<li>` only wraps the link), its `.logout-btn` colours, the 282px
  `.main-content` margin; portal.css's card `.page-header` and outline `.btn` border; global.css's
  form-group margins. Added: `.badge-orange` / `.badge-blue` / `.badge-teal`, which `app.js` used for
  Pending / Assigned / Active but the stylesheet never defined (those three were unstyled in the HTML).

- 2026-09-21 (Phase 6) — **The shared `PortalLayout` / `Sidebar` / `Header` are the shell.** These nine pages used
  nav.js's injected sidebar (the only portal besides the doctor's that did), so the Phase 0 shell fits as-is: the
  menu is `navigation.js`'s regional list, the header is the shared one. Two consequences kept as in the doctor
  portal: the header shows the notification bell (nav.js only injected it into a `.topbar`, which these pages lack)
  and the avatar reads `initials()` ("AR") where `regional-common.js` took the first two letters of the name ("AN").
- 2026-09-21 (Phase 6) — **Three stylesheet treatments, per page, matching what each HTML page loaded.**
  `regional-common.css` (dashboard, comparison, alerts, complaints) is a verbatim copy route-mounted through
  `useRegionalCss()` — *per page*, not on the portal shell, because profile and hierarchy used `portal.css`'s
  smaller header and padded panels and would have changed under it. The identical inline `<style>` pair of
  `hospital-approvals.html` / `revenue.html` is bundled as `regional-console.css` under `.ro-console`, and
  `hospital-details.html`'s under `.ro-details` (the Phase 1 rule for small page styles). Override blocks: portal.css's
  `.panel { overflow: hidden }` clipped the lifted stat cards inside the dashboard's revenue panel (undone); the
  sidebar's forced z-index 9999 goes back under the complaints status modal (z 1000 — the HTML overlapped the same
  way); the details header's 72px left padding, which cleared session.js's floating back button, is back to 32px.
- 2026-09-21 (Phase 6) — **`hospital-details` sits inside the portal shell.** The HTML page loaded no `nav.js` and
  set `margin-left: 0`, so it had no sidebar at all — the only regional page without one. In the SPA it is a
  nested route like the rest: the sidebar and the inline back button are there, `?id=` is read with
  `useSearchParams`, and a visit without `?id=` goes to the dashboard as `hospital-details.js` did.
- 2026-09-21 (Phase 6) — **`confirm()` / `prompt()` / `alert()` → `ConfirmDialog`, a reason modal, toasts** (as
  Phases 3–5). Clear-for-approval asks through `useConfirm`; Reject opens a small modal for the reason (the
  `prompt()`), Cancel aborts as a null prompt did; comparison's two `alert()`s and the complaints save failure are
  toasts, the last with the server's message. The approvals page's own `notify()` (a hand-rolled fixed div) is the
  shared toast. The `NexCareUI.showLoading` overlay the approvals script called only if `ui-components.js` was
  loaded — it never was on that page — is not reproduced; the two buttons disable while the request is in flight.
- 2026-09-21 (Phase 6) — **Dashboard tolerates an alerts failure on its own** (`Promise.all` over two calls that
  each catch), as the HTML did when the alerts response was not a success; an overview failure shows the HTML's
  "Could not load regional overview…" in the table and the alerts panel.
- 2026-09-21 (Phase 6) — **Hospital-details tabs reload every time they are opened**, exactly as `switchTab()` did,
  and the beds / inventory tabs write their counts back into the overview rows as the HTML did; the overview's own
  counts come from `GET /hospitals/:id/beds` + `/inventory` rather than the hospital record, also as before.
- 2026-09-21 (Phase 6) — **Complaints' status modal is the HTML's inline-styled overlay**, not the shared `Modal`,
  so it looks the same; after a save the list and stats are re-fetched as `saveStatus()` did.
- 2026-09-21 (Phase 6) — **Profile reads the login user** (`regionId`, `regionName`, `areas`, `phone` come with
  the login response), with `profile.js`'s fallbacks kept verbatim (`EMP-RO-001`, `+91 98480 00111`, `01 Jan 2026`
  when a field is missing — the seeded officer has no `createdAt`, so "Date Joined" shows the fallback as it did).

- 2026-09-21 (Phase 7) — **Shared `PortalLayout` / `Sidebar` / `Header` again** (all nine pages used nav.js's
  injected sidebar). `Header` gains an optional `roleText` prop because every superuser page printed
  "System Administrator" on the role line where `roleLabel()` says "Super User". As in Phase 6 the header
  shows the bell and the login user's name/initials ("NP · NexCare Platform Office") where seven of the
  HTML pages hard-coded "SU · Super User" (only revenue.js and hierarchy.html filled the real name).
- 2026-09-21 (Phase 7) — **One bundled stylesheet, `styles/superuser.css`, generated from the HTML.** Every
  page carried an inline `<style>`; seven of them (dashboard, patient-directory, feedback,
  hospital-registrations, manage-users, system-settings, reports) restated the same header / page-header /
  table-card / btn-icon block, which is emitted once under `.su-page`; what each page alone declared is
  under `.su-<page>`; revenue.html's second block (plan cards, its narrower bar-row widths) under
  `.su-revenue`; hierarchy uses portal.css + `features/hierarchy/hierarchy.css` as its HTML did. The
  override block undoes three portal.css / global.css leaks: `.page-header { flex-wrap: wrap; gap }` (the
  feedback filters dropped under the title), `.page-header { display: flex }` on the settings page (its
  header was a block), and the sidebar's forced z-index 9999 (over the feedback / manage-users modals, as
  in the HTML).
- 2026-09-21 (Phase 7) — **`confirm()` / `alert()` → `ConfirmDialog` / toasts** (as Phases 3–6): the three
  permanent deletes (patient, user, feedback) ask through `useConfirm` with the HTML's wording; the
  settings page's `alert("Please enter a valid email…")` is a warning toast (the browser's own
  `type=email` validation fires first, as it did on the HTML form). manage-users.js's success toasts and
  its "Failed to Save User" error dialog were behind `window.NexCareUI`, which that page never loaded — so
  the HTML gave no feedback at all on save; the SPA shows the toast text the script carried, and the
  server's message on failure. The hospital-registrations page's hand-rolled fixed-div toasts, its
  credentials modal and its rejection modal are ported as they were (inline-styled overlays), not the
  shared `Modal`, so they look the same.
- 2026-09-21 (Phase 7) — **`logActivity()` fixed on port** (see "Fixed on port (Phase 7)"): moved to
  `features/activity/logActivity.js` now that staff and superuser pages both call it (`staffData.js`
  re-exports it), and it now sends what `CreateActivityDto` declares.
- 2026-09-21 (Phase 7) — **The credentials modal's portal link is the SPA route.** hospital-registrations.js
  printed and copied `/hospital_manager/dashboard.html`; the SPA prints `pageLink('hospital_manager/dashboard')`
  → `/hospital-manager/overview` (plan.md Phase 8: no `.html` links may remain).
- 2026-09-21 (Phase 7) — **Search and filters run in memory.** hospital-registrations.js re-fetched
  `/hospitals` + `/users` + the suggestion endpoints on every keystroke and feedback.js re-fetched
  `/feedback` + `/hospitals` on every filter change; the SPA fetches once, filters the snapshot, and
  re-fetches after a write (assign / approve / reject / delete). Same rows, one request.
- 2026-09-21 (Phase 7) — **Settings toggles read a saved `"false"` as off.** `PUT /system/settings` stores
  every value as a string, and system-settings.js read the toggles back with `!!value`, so a saved
  `maintenanceMode: false` came back as **on** after a reload; the SPA parses `"true"`/`"false"`.
- 2026-09-21 (Phase 7) — **Reports: latency is still measured, the tab is in the URL.** Each call is timed
  in the page (`timed()`), newest last, red when it failed; `?tab=` is read *and written* with
  `useSearchParams` so the dashboard's "Full Log →" (`reports?tab=security`) lands on the security tab —
  on the `npx serve` host that query string was dropped and the link always opened the usage tab. The
  "Department Performance" table, which reports.js never filled, still shows its loading row.
- 2026-09-21 (Phase 7) — **Revenue tabs are render functions, not components**, so a keystroke in a fee
  input does not remount the tab and lose focus; the six tabs render from one snapshot as revenue.js did
  and every write reloads it. `Promise.all` tolerates the eight secondary calls failing (each settles to
  null); only the overview failing shows the HTML's "Could not load revenue data…" rows.
- 2026-09-21 (Phase 7) — **The dashboard's `setInterval(30000)` is `usePolling`** (cleared on unmount,
  paused while the tab is hidden), as Phase 5 did for the ambulance page.
- 2026-09-22 (Phase 8) — **Every portal is `React.lazy`; the public site and the auth pages are
  not.** Those are what an anonymous visitor loads first, and putting them behind a second
  request would only add a waterfall. `portals/<name>/index.jsx` is the chunk boundary and now
  exports a default component beside the route table; `vite.config.js` names the chunk after the
  folder, because seven modules called `index.jsx` otherwise produce seven `index-<hash>.js`.
- 2026-09-22 (Phase 8) — **The `front-end/node_modules/` line stays in `.gitignore`.** plan.md
  said to drop it, on the assumption the folder was going away; it is not — the React app has a
  `node_modules/` at the same path. The line is redundant with the plain `node_modules/` rule
  (as `back-end/node_modules/` already was), and removing only one of the two would be
  inconsistent. `front-end-react/dist/` → `front-end/dist/` was changed as planned.
- 2026-09-22 (Phase 8) — **`MANUAL_TESTING_CHECKLIST.md` and `VERIFICATION.md` were stale against
  the seed, not just against the HTML paths.** They were written for the pre-2026-09-01 revenue
  model and the pre-2026-09-02 seed: 12 hospitals (there are 9), `regional2@nexcare.com` and
  `regional3@nexcare.com` (the seed has `kavya.menon@nexcare.in` / `rohan.deshmukh@nexcare.in`),
  M002 covering H009 + H011 (RM002 covers H003 + H004), "seven streams, three payers" (five
  streams, two payers), a `hospital_commission` ledger stream (removed with the old model) and
  "3.4% of the bill" for a card payment (it is `paymentGatewayRate` alone, 1.9%). All corrected
  against the running backend, and a §4.7 was added for the cross-role flow. `8 suites / 51
  tests` → `10 suites / 62 tests` in both.
- 2026-09-22 (Phase 8) — **`patient@gmail.com` is not the demo patient any more.** Its password
  was changed during earlier testing and `ACTOR_CREDENTIALS.md` has said so since; the two test
  documents still used it and every login check in them failed. They now use
  `venkat.rao@example.in` (`P003`), with a note pointing at the reset one-liner.
- 2026-09-22 (Phase 8) — **The nurse-login refusal is checked by adding a record, not by an
  account.** The seed ships no `nurse` rows, so `NON_LOGIN_ROLES` could not be exercised as
  written. The checklist now says to add one to `users.json`, attempt the login, and
  `git checkout` the file. Verified this way: *"Access Denied: 'nurse' is a directory record,
  not a NexCare login account."*

- 2026-09-21 (Phase 7) — **`ComingSoon` and `App.jsx`'s `pending()` helper are gone** — every portal is
  ported, so no route renders a placeholder any more.

## Post-migration audit (2026-09-22)

A sweep of the whole system, on request, once every phase had landed. Method:

1. **Backend route matrix** — every documented `GET` (132 routes) hit as all seven
   roles. No 5xx, no 404, no 401 to a signed-in caller, no route unreachable by
   every role. (Run with `RATE_LIMIT_GENERAL` raised: 7 × 132 requests trips the
   300/min per-IP limiter, which is what makes an unthrottled sweep report
   dozens of phantom failures.)
2. **UI control crawl** — all 59 routes of all seven portals, cycling every
   `<select>`, typing in every search box and clicking every non-destructive
   button (closing whatever opened). 0 page errors, 0 console errors, 0 failing
   API calls.
3. **Write-path audit** — every feature that changes data, driven through the
   SPA and then asserted against the backend.

**Nine defects found and fixed.** Backend tests stayed at 10 suites / 62 tests
throughout; both builds are clean.

| # | Defect | Fix |
|---|---|---|
| 1 | **A patient's rename was silently lost.** `PUT /patients/:id` takes `fullName`; the record's display field is `name`. `PatientsService.update` spread the DTO straight in, so the record gained a `fullName` key nothing reads and `name` never changed. The UI showed success and the header updated from the session, so it looked like it had worked until a reload. | `update()` maps `fullName` → `name` and no longer stores the DTO spelling. |
| 2 | **The patient profile could not be saved at all.** Every seeded patient's `phone` is a display string (`+91 98480 33445`); the form loaded it verbatim and `save()` requires `^\d{10}$`, so *any* save — even one that only touched the name — was refused with "Phone number must be exactly 10 digits". Pre-existing: `profile.js` did the same. | `localPhone()` loads the national 10-digit part; the strict rule still applies to what the patient types. |
| 3 | **A regional officer's `GET /feedback` was always empty.** The controller passed `req.user.id` where `findForRegionalManager(hospitalIds: string[])` expects an array, so `new Set('RM001')` was a set of *characters* and no hospital ever matched. Latent — the SPA's complaints page calls `/feedback/regional`, which resolves the ids properly — but any other caller got silence. | The `GET /feedback` branch resolves hospital ids through `getHospitalsForManager()`, exactly as `/feedback/regional` does. |
| 4 | **`GET /system/performance` returned health data** — `getPerformance()` called `getHealth()`, so "performance" answered with hospital and user counts and nothing about the process. | A real `SystemService.getPerformance()`: uptime, RSS/heap, CPU time, node version, platform, pid. |
| 5 | **A leave could be created with no `hospitalId`** and was then invisible to every hospital manager forever (their tab filters on it). `CreateLeaveDto` is a bare TypeScript interface, so the global `ValidationPipe` checks nothing on that route. The doctor's page always sent one, so only API callers hit it. | `LeavesController.create` stamps `hospitalId`, `doctorName` and `doctorId` from the caller when a doctor omits them, mirroring the existing manager/staff auto-bind. |
| 6 | **`window.confirm` in the doctor's Leaves page** — the last native dialog in the app; Phases 3–7 replaced every other one with `ConfirmDialog`. | `useConfirm()` with a danger-styled "Withdraw" confirm. |
| 7 | **`window.alert` in `features/invoice/invoice.js`** on the no-bill path. The module is plain JS with no React context, which is why it reached for the native dialog. | `downloadInvoicePDF(bill, patient, onError)`; the two calling pages pass `notify`. |
| 8 | **`docs/swagger.json` was three weeks stale** (185 paths against the app's 189) — missing `POST /auth/forgot-password/verify`, `POST /auth/forgot-password/reset`, `GET /system/health` and `GET /system/performance`. | Regenerated with `npm run swagger:generate`. |
| 9 | **`PROJECT_CONTEXT.md` §15 contradicted `main.ts`** — it said the server rewrites `docs/swagger.json` on boot; `main.ts` says in a comment that it deliberately does not (it churned the tracked file in four of nineteen commits). This is *why* #8 went unnoticed. | §15 rewritten with the real command and the drift recorded. |

**Verified working** (driven through the SPA, asserted against the backend):
booking wizard → payment (decline and approve) → invoice PDF; feedback
submit/edit/delete; Care+ join; ambulance request/cancel, crew accept →
Dispatched with `assignedTo`; inventory add/restock/use/delete + audit trail;
appointments create/edit/delete; a doctor's leave → the manager's approval;
staff activate/deactivate; requisition approve; support ticket; platform plan
switch (Starter → Growth); complaint status; system settings save; user
create/delete; the doctor's consultation-fee save.

**Left alone, deliberately:**
- `InventoryService` caches `inventory.json` in memory at construction while
  every other service re-reads per request, so a hand-edit of that file is not
  picked up until a restart (`VERIFICATION.md` §7.3 implies it would be). It is
  correct through the app, and the change is riskier than the payoff.
- The staff Generate Bill page always POSTs a *new* bill rather than adding to
  the patient's open one, so a patient billed after a completed consultation
  ends up with two bills carrying a consultation line each. The HTML page did
  the same; changing it is a product decision, not a port fix.
- A brand-new patient's first bill carries no `hospitalId` (see the Phase 8
  entry below) and so is not counted in that hospital's collections.

## Deferred / found while porting
_(bugs or feature ideas noticed in the HTML pages that are NOT fixed during the port)_

- **Pre-existing, Phase 2 — fixed 2026-09-20 (before Phase 3):** the booking wizard could offer a slot the
  server then refused with *"That slot is outside the published hospital schedule."* The wizard's slots came
  from the doctor's roster (`shared/doctor-directory.js` turned a saved `{start:'08:00', end:'17:00'}` into
  exactly two "slots" — the start and the end time), while `AppointmentsService` gates on the hospital's
  **approved schedule**, which closes at 16:00 for every seeded department — so the last slot of every day
  was refused, in the HTML wizard and the port alike. Now `features/doctor-directory/hospitalSchedule.js`
  loads `GET /schedules?hospitalId=&status=approved` and mirrors `isPublishedCoverage()` (validity range,
  department or `All`, overnight shifts); `slotsForDoctor()` cuts the doctor's working window into 30-minute
  slots (`SLOT_STEP_MINUTES`) and keeps only those inside a published window. The wizard explains an empty
  grid with the server's own reasons (no roster published / no hours for the department that day / doctor's
  hours outside the roster). If `GET /schedules` fails the untrimmed list is offered and the server still
  has the final say. Verified live: U005 Monday offers 08:00 AM–03:30 PM (16 slots) and the last one is
  accepted first time.
- **Pre-existing, Phase 2 (kept):** the backend refuses a second *active* ambulance request per patient.
  The HTML page reported that as a flat "Failed to dispatch ambulance."; the SPA shows the server's own
  message instead, which is the same outcome with the reason attached.

- Lab-era differences in the doctor portal that pre-date this plan and are kept: the React doctor
  pages show a notification bell and the hospital name in the sidebar (the HTML doctor pages have
  neither because they lack the `.topbar` that `nav.js` looked for); appointment action buttons read
  "Refer" instead of "Refer Patient". Revisit in Phase 8's parity sweep if the team wants exact parity.
- `nav.js` carried menus for hospital-manager, staff and patient that no page loaded (those portals
  had inline sidebars). The SPA uses the inline sidebars' labels/order, not the `nav.js` ones.
- **Pre-existing, Phase 3 (kept):** the backend refuses to admit any seeded patient to a bed — every
  seeded H001 patient login (P001–P003) already occupies 9–13 seeded beds, and `PATCH /beds/:id/allocate`
  answers *"Patient X is already allocated to bed …"*. The SPA shows that message (the HTML showed the
  same via `alert`). The Phase 3 test run registers a throwaway patient to exercise admission.
- **Pre-existing, Phase 3 — fixed 2026-09-20 (backend, with Phase 4, on instruction):** `POST /auth/register`
  handed every new patient `patientId: "P001"` — `IdGenerator.generatePatientId()` derives the next id from
  the list it is handed and `AuthService.register()` handed it nothing. It now passes the patient records'
  ids plus the ids already stamped on login accounts. Verified: two registrations → `P065`, `P066`.
- **Pre-existing, Phase 3 — fixed 2026-09-20 (with Phase 4):** Generate Bill's `WARD_RATES` keys
  (`Emergency`, `General`, …) never matched the seeded ward names (`Emergency Ward`, `General Ward`, …), so
  the automatic ward line item never appeared. `wardLineItem()` now matches the ward by keyword (emergency /
  ICU-CCU / paediatric / maternity / general) and prefers the bed's own `dailyRate`; the bed lookup also
  matches on the login account's `patientId` (beds carry `P001`, the user record is `U004`, and the old
  comparison used the user id). Verified live: P001's seeded General Ward bed yields "General Ward Stay".
- **Pre-existing, Phase 3 (kept):** the staff-scheduling week table overflowed the viewport horizontally
  in the HTML (`.main` had no `min-width: 0`); in the SPA the same markup fits because `app.css` gives
  `#root` `min-width: 0`. Not undone.
- **Backend bugs fixed with Phase 4 (2026-09-20, on the user's instruction to fix deferred bugs — plan.md §0
  rule 2 was set aside for these; each is a §5B scope or a broken route, not a migration change):**
  - `PATCH /feedback/:id/status` did not admit `hospital_manager` at all — the HM feedback tab's only action
    was a 403 — and admitted staff for *any* hospital's feedback. The role is added and the write is scoped
    to the caller's hospital for managers and staff (`assertOwnHospital`).
  - `GET /support-requests` for a hospital manager filtered on `assignedManagerId === <manager id>`, but that
    field is the **regional officer** a ticket is escalated to, so every hospital manager got `[]` (the HTML
    tab was always "No support tickets"). The manager now gets their hospital's tickets, unfiltered.
  - `GET /inventory` had no hospital scoping and `POST /inventory` stamped no `hospitalId`: every hospital's
    staff and manager saw every hospital's stock, and an item added by H001 belonged to nobody. The list is
    scoped like `/inventory/requirements` (`?hospitalId=` honoured for superuser / regional officer, 403 on a
    cross-hospital id for staff and managers) and create stamps the caller's hospital.
  - `InventoryService` worked with `name` / `quantity` / `minStock` while the seed stores `itemName` /
    `currentQuantity` / `minimumQuantity`: low-stock checks were dead for seeded items, and
    `mark-restocked` threw on `i.name.toLowerCase()` for the first seeded item it met. Items are normalised
    on load and both spellings are kept in step on save; the restock matcher guards the name.
  - `BedsService.create` refused a bed past `hospital.totalBeds` with "Subscription limit reached … please
    upgrade", wording from the removed bed-based tiers (§5A); it now says the registered bed capacity is
    reached. (H001 is seeded at exactly its capacity, 120, so the Setup page's first bed always shows this.)
  Backend still builds clean and `npx jest` is 10 suites / 62 tests passing.
- **Pre-existing, Phase 4 (HTML, not fixed — `front-end/` is frozen until Phase 8):**
  `shared/session.js`'s `publicPaths` lacks `/auth/hospital-manager-login` (and `/auth/doctor-login`,
  `/auth/forgot-password`), so the dedicated HM login page bounces to the hub before it renders; the hub's
  radio works. `switchTab('leaves')` calls `renderLeaves()`, which does not exist, so the Doctor Leaves nav
  item throws after switching. `registerAnotherStaff()` switches to a `register-staff` tab that is not in
  the list and lands on the overview. The SPA has none of these.
- **Pre-existing, Phase 4 (kept):** seeded H001 patients (P001, P002, P003, P008) each already have an active
  ambulance request, so "+ New Transport" for them is refused with the server's message; the test uses P004.
- **Fixed on port (Phase 3)** — broken in the HTML against this backend, working in the SPA:
  - `manage_appointments.js` could never save: it POSTed `patientName` (the ValidationPipe runs with
    `forbidNonWhitelisted`, and `CreateAppointmentDto` has no such field — the backend resolves the name
    from `patientId` itself) and its status options (`Scheduled`, `Waiting`, `In Progress`) are not in
    `AppointmentStatus`, so every edit was a 400 too. The form now sends exactly the DTO's fields with
    the real statuses (`Pending`, `Confirmed`, `Completed`, `Cancelled`, `No Show`).
  - `inventory.js` "Add Item" sent a `status` key that `CreateInventoryDto` does not declare → 400 on
    every add. Dropped; the backend derives the status.
  - `inventory.js` read `name` / `minStock` while the seed (and the backend's own writes) use `itemName`
    / `minimumQuantity`, so the HTML stock table had a blank name column and said "Min: 20" for every
    item. Both spellings are read now.
  - `patient_checkin.js` displayed `foundPatient.fullName`, which patient *users* do not have (they have
    `name`) — the HTML card said "undefined". The SPA's shared `patientName()` falls back to `name`.
- **Fixed on port (Phase 1)** — these were broken in the HTML and work in the SPA:
  - `auth/change-password.html` called `Auth.changePassword({ currentPassword, newPassword })` but the API
    takes two positional arguments, so every submit failed with "Both current and new password are required".
  - `auth/forgot-password.html` hard-coded `http://localhost:3001/api`; it now uses the shared client (works over LAN).
  - `landing/hospital-registration.html` left the submit button disabled forever after the "ICU beds cannot
    exceed total beds" client error (early `return` before the `finally`).

- **Pre-existing, Phase 5 (HTML, not fixed — `front-end/` is frozen until Phase 8):** everything listed under
  the Phase 5 decisions (the stepIndex drift, the dead ETA element, the fictional profile, the Delete that
  always failed, the unstyled status badges); `shared/session.js`'s `publicPaths` also lacks
  `/auth/ambulance-login`, though the hub radio works.
- **Pre-existing, Phase 5 (kept):** `POST /ambulance` ignores the caller-supplied `status` and creates every
  request as `Pending`; the HM portal's "New Transport" toast (Phase 4) already says so.
- **Not changed (data, not code):** every seeded patient occupies 4–17 seeded beds because the seed generator
  spreads each hospital's `occupied` counts over its 8 patient records. Freeing them would drop occupancy from
  ~70% to ~7% and shift the health scores and revenue seed the team regenerated on 2026-09-02, so it is left
  for a seed regeneration with more patient records, not a Phase 4 fix.

- **Fixed on port (Phase 6):** `hospital-comparison.js` passed each metric's own thresholds object to
  `metricClass(metric, value, thresholds)`, which looks the metric up *inside* the map it is handed — so nothing was
  ever found and no card or table value on the HTML comparison page was coloured. The SPA hands it the keyed map;
  the good / warn / bad colours the stylesheet defines now show.
- **Pre-existing, Phase 6 (kept):** a new hospital registration (`POST /hospitals/register`) has no
  `assignedManagerId`; it reaches an officer's review queue only after the superuser assigns it
  (`PATCH /hospitals/:id/assign-manager`). The Phase 6 run does that by API before the officer sees the two
  throwaway registrations; the Phase 7 superuser page is where that assignment lives in the UI.
- **Pre-existing, Phase 6 (kept):** `GET /hospitals/:id/doctors` returns doctors with *no* `hospitalId` alongside
  the hospital's own (`!user.hospitalId || user.hospitalId === id`), so the details Staff tab can list unattached
  doctors; the same "no hospital id → include" rule applies to beds, inventory and ambulances. The HTML filtered the
  same way client-side (`hospitalMatches`), so the numbers agree.
- **Pre-existing, Phase 6 (kept):** `hospital-details.html` cannot be opened with `?id=` on the `npx serve` host
  (the static server drops the query string and redirects to the dashboard — plan.md §4), so the side-by-side
  screenshot for that page could not be taken from the HTML; the SPA page was checked against the HTML source.
- **Pre-existing, Phase 6 (HTML, not fixed — `front-end/` is frozen until Phase 8):** `hospital-approvals.html`,
  `revenue.html` and `hospital-details.html` carry a second, inline JWT guard placed *after* the page scripts, so a
  wrong-role visitor's page scripts run (and fire their API calls) before the guard clears the session and bounces.
  The SPA's `RequireAuth` decides before the page mounts.

- **Fixed on port (Phase 7):**
  - `shared/db.js logActivity()` — the audit write behind every superuser and staff page change — sent
    `{ action, module, details, date, createdAt }`; `CreateActivityDto` forbids `date`/`createdAt`
    (`forbidNonWhitelisted`) and requires `userId` and `severity`, so **every audit row the HTML pages
    tried to write was a silent 400** (db.js swallowed it into a localStorage list nobody reads). The Phase 3
    port had copied the payload faithfully and was 400ing the same way. `features/activity/logActivity.js`
    now sends `{ userId: <login user id>, action, module, details, severity: 'INFO' }`; verified live —
    "Full deletion of patient…" and the manage-users Create/Update rows land in `system-activity.json`
    stamped `U001`.
  - `system-settings.js` read saved toggles with `!!value` on string-typed settings (see decisions).
  - `reports.html?tab=security` (the dashboard's "Full Log →") never opened the security tab on the static
    host; it does in the SPA.
- **Pre-existing, Phase 7 (kept):** `POST /hospitals/:id/approve` ("Direct Approve") verifies a registration
  with no regional clearance and mints the manager login with a fixed password; `PATCH /hospitals/:id/verify`
  is the guarded route but the HTML page never called it. The SPA calls what the page called.
- **Pre-existing, Phase 7 (kept):** the reports page's "Department Performance" table is never populated
  (reports.js has no code for it) and `perf-status.status-danger` is undefined in any stylesheet; the
  trend captions on the stat tiles ("↑ 12% vs last period", "99.98% Available") are static text.
- **Pre-existing, Phase 7 (kept):** `GET /users` for the superuser returns patient accounts too; the
  dashboard, patient directory and manage-users pages filter by role client-side as the scripts did.
- **Pre-existing, Phase 7 (HTML, not fixed — `front-end/` is frozen until Phase 8):** `reports.html`'s inline
  JWT guard has a syntax error (a missing `}`), so that script never runs — `session.js` alone guards the
  page. `dashboard.html`'s `#userNameDisplay` is never written (dashboard.js has no code for it), so the
  header always says "Super User". `manage-users.js` on a save failure calls `NexCareUI.showError`, which is
  not loaded, and falls back to `alert()`.

- **Pre-existing, Phase 8 (kept — backend, and the migration freezes it):** a patient with **no
  billing history** gets their first bill with **no `hospitalId`**. Completing an appointment
  calls `BillingService.getOrCreatePendingBill()`, which can only inherit the hospital from an
  earlier bill of the same patient (`bills.find(b => b.patientId === … && b.hospitalId)`), and
  the appointment's own `hospitalId` is not passed down. The bill gets the flat `BILL-000n` id
  and is **not counted in that hospital's collections** — `GET /revenue/hospital/:id` misses it.
  The code comment says as much, so this is deliberate rather than an oversight, but it means a
  brand-new patient's consultation fee is invisible to their hospital's revenue view until they
  have a second, staff-issued bill. The Phase 8 flow pays the staff-issued `BILL-H001-nnn` for
  exactly this reason. Not fixed: plan.md §0 rule 2.
- **Pre-existing, Phase 8 (kept):** the staff Generate Bill page always POSTs a **new** bill
  rather than adding to the patient's open one, so a patient who is billed by the front desk
  after their consultation was completed ends up with two bills, both carrying a consultation
  line. The HTML page behaved the same way.
- **Lab-era doctor-portal differences** (bell in the header, hospital name in the sidebar,
  "Refer" instead of "Refer Patient") were re-checked in the parity sweep and **kept**: the same
  three differences now apply to the regional-officer and superuser portals too, since they use
  the same shared shell, and the team has seen them across four phases without objecting.

## Log
- 2026-09-19 — Repo surveyed: 59 HTML pages in 10 folders, ~6.3k lines of shared JS,
  HTML served by `npx serve -l 8080`. Doctor portal already in React. Plan written in 9 phases.
- 2026-09-19 — **Phase 0 done.** Restructured `front-end-react/` into the multi-role shell.
  Verified with a Playwright run against the live backend (`node dist/src/main.js` + `vite preview`):
  anonymous deep link → login → back to the remembered page; all 5 doctor pages render with the right
  active nav item, header, hospital name, populated KPIs, appointments rows, notification dropdown;
  wrong-role bounce keeps the session; reload keeps the session; logout wipes session + local token;
  a hospital-manager session lands on `/hospital-manager/overview` with the 12-entry HM sidebar and
  the Phase 4 placeholder; the doctor login form shows the backend's role-mismatch error. 26/26.
  Test logins appended rows to `back-end/data/system-activity.json` (already dirty before this
  session); `users.json` untouched.
- 2026-09-19 — **Phase 1 done.** 16 HTML pages → 9 components (`portals/public/`, `portals/auth/`).
  Playwright run against the live backend, 51/51: landing effects (fade-in, counters, reveal, footer year,
  stylesheet mount/unmount), hub + 6 role logins for all 7 roles (12 paths), no-role and wrong-role errors,
  deep link → hub → superuser login → back to `/superuser/reports`, patient register (client validation,
  success, new account logs in), signup auto-login, staff register (doctor fields, specialisation rule),
  hospital registration (ICU rule, success, redirect), forgot-password step 1/2 (no real reset sent),
  change-password (guard, live rules, wrong current password → backend 400 shown, session kept).
  The registration tests wrote throwaway records; `hospitals.json`, `notifications.json`, `patients.json`,
  `users.json` were restored with `git checkout` afterwards. `system-activity.json` remains dirty as before.
- 2026-09-20 — **Phase 2 done.** 8 HTML pages + `dataStore.js` + `script.js` → `portals/patient/`
  (7 routed pages + the shell, sidebar, header and two modal components) plus three shared features:
  `features/invoice/`, `features/payments/` and `features/doctor-directory/`. Playwright run against the
  live backend (`node dist/src/main.js` + `vite preview`), **117/117**, no console errors: login and
  dashboard (KPIs, hospital network ranked by the patient's own city, header search filtering, the
  notifications centre, the invoice breakdown modal); hospital search signed in and signed out; the
  appointment landing, "my appointments" and the four-step wizard through to a confirmed booking with a
  token; billing with a declined card (4000…0002, message shown inline, bill left open) then an approved
  one (4242…4242, pending count drops, payment history gains a row) and a downloaded PDF invoice;
  ambulance cancel + request with phone validation; feedback submit / edit / resolve / delete; membership
  join through the simulated gateway and cancel back to pay-as-you-go; profile edit, validation and save;
  and the session rules (reload, wrong-role bounce, logout wipe, anonymous guard).
  Side-by-side screenshots against all 8 HTML pages at 1280 wide; the four CSS leaks they exposed are
  fixed in `styles/patient.css`'s override block (see decisions). Three test bookings/payments and a
  profile save dirtied `appointments.json`, `billing.json`, `ambulance.json`, `feedback.json`,
  `patients.json`, `users.json`, `notifications.json`, `payment-intents.json`,
  `platform-transactions.json` and `patient-subscriptions.json`; all were restored with `git checkout`.
  `system-activity.json` remains dirty as it was before this session.
- 2026-09-20 — **Phase 2 bug fixed before Phase 3.** The booking wizard's slot list now comes from the
  hospital's published schedule (`features/doctor-directory/hospitalSchedule.js`); see "Deferred / found
  while porting". Verified live: 9/9 checks, the last offered slot is accepted first time.
- 2026-09-20 — **Phase 3 done.** 10 HTML pages + `logo.js` (+ the `system-logs.html` redirect) →
  `portals/staff/` (10 routed pages, the shell, sidebar, topbar, `useConfirm`, `staffData` helpers).
  Playwright run against the live backend (`node dist/src/main.js` + `vite preview`), **150/150**:
  login and shell (10 menu items, hospital name under the logo, user pill); dashboard KPIs, list, search,
  quick actions; check-in validation, resolve-by-id, duplicate refusal, location update via the modal,
  session key; directory search and the documents modal (upload a .txt, list, download, delete);
  appointments filter, create (fixed on port), edit → Confirmed, inline delete confirm/cancel; beds — five
  stat cards, ward switch, grid/list, admit a freshly registered patient, illegal transition rejected
  inline by the middleware, release, re-admit; bills — stats, filter, fetch details, line items, save,
  view, PDF and CSV downloads; inventory — add (fixed on port), restock, over-use refused, use, audit
  trail, delete, raise a requisition; scheduling — accordion, week navigation, submit a roster, delete it
  from "awaiting approval"; leaves — stats, filter, record for a doctor, details, withdraw; feedback —
  filter and details; routing (system-logs → dashboard, wrong-role bounce, reload, logout wipe, anonymous
  guard, stylesheet unmounted); and the round trip — the staff-generated bill is paid by the patient
  through `?bill=<id>` and comes back Paid in the staff list. Side-by-side screenshots vs the 10 HTML pages
  at 1280 (match; the HTML's floating back button is the only difference) and 390 (both overflow the same
  way — the HTML has no responsive rules). The run wrote to `beds.json`, `billing.json`,
  `inventory-audit.json`, `inventory-requirements.json`, `notifications.json`, `patients.json`,
  `payment-intents.json`, `platform-transactions.json`, `uploads.json`, `users.json`; all restored with
  `git checkout`. `system-activity.json` remains dirty as before (and gains rows from `logActivity`).
- 2026-09-20 — **Phase 4 done.** `hospital_manager/dashboard.html` (1 page, 12 `#section`s) + `dashboard.js`
  → `portals/hospital-manager/` (12 routed sections, the shell, sidebar, context, the two staff-registration
  forms with the credentials card, the renewal modal, `useApprovals`). Playwright run against the live backend
  (`node dist/src/main.js` + `vite preview`), **138/138**: login (deep link remembered), shell (12 items,
  hospital name / id / initials, stylesheet mount, no horizontal overflow at 1280); overview KPIs, queue,
  quick actions (modal + navigation), header titles; **the Phase 3 round trip** — two staff-recorded leaves,
  one approved (audit names the manager, days computed = 3) and one rejected with a reason (empty reason
  refused), both visible to the staff through `GET /leaves`; a staff-submitted schedule approved through the
  confirm dialog; staff directory filters, search, deactivate → activate; the header modal registers an
  administrative staff member (email preview, `ADM-H001-nnn` id, three default responsibilities) and the Setup
  form an ambulance driver; bed registration (capacity refusal shown, then success after raising `totalBeds`);
  an inventory item (LOW STOCK, scoped to H001, invisible to H002, 403 on `?hospitalId=H002`); requisition
  approve with remarks / reject with reason, badge 7 → 6, filters; ambulance status update, a new transport
  for P004 (Pending, H001), KPI-click filter, search; subscription — plan cards, Starter → Growth → Starter
  through `PATCH /revenue/hospital-subscriptions/H001`, 403 for H002, renewal by card extending the expiry and
  recording `Card (•••• 9921)`; revenue stats, department bars, platform charges; supervision cards;
  a support ticket created and listed; feedback status updated and filtered, 403 for the H002 manager;
  routing (reload, unknown section → overview, wrong-role bounce, collapse persisted, phone drawer, logout
  wipe, stylesheet unmounted); and the deferred fixes (unique patient ids on registration, the ward line on
  the staff Generate Bill page). Side-by-side screenshots vs the HTML page at 1280: match apart from the fixes
  listed under decisions; at 390 the SPA stacks the grids (the HTML scrolls sideways). The run wrote to
  `ambulance.json`, `beds.json`, `feedback.json`, `hospitals.json`, `inventory-requirements.json`,
  `inventory.json`, `leaves.json`, `notifications.json`, `patients.json`, `schedules.json`,
  `support-requests.json`, `users.json`; all restored with `git checkout`. `system-activity.json` remains dirty
  as before.
- 2026-09-20 — **Phase 5 done.** `ambulance/index.html` (1 page, 6 `.page` blocks) + `app.js` →
  `portals/ambulance/` (6 routed pages, the shell, the context) + `features/ambulance/` (`transportSteps.js`,
  `useTransportEta.js`) + `hooks/usePolling.js`. Playwright run against the live backend
  (`node dist/src/main.js` + `vite preview`), **72/72**, no console errors: a freshly registered patient raises
  a request in the Phase 2 portal (hospital picker → confirm → "Ambulance Dispatched!"); crew login (deep link
  remembered), shell (6 links, hospital name, real crew name, stylesheet mount, no overflow at 1280), dashboard
  KPIs and the recent table with the patient's request; the backend's one-active-request-per-patient refusal;
  Accept disabled until the four checklist items are ticked (persisted under `nexcare_checklist_v1`), then
  accept → `Dispatched` with `assignedTo` = the crew and a patient notification; dispatch card, Start
  disabled while the seeded En Route transport is active, that transport completed through the UI first,
  cancel-assignment confirm dismissed, start → `En Route`; the active page's patient details, current step,
  running ETA (11:xx, restarting at 4:xx after the next step), tracker classes, Next Step → `Picked Up` →
  `At Hospital`, Complete Transport replacing Next Step, Call Patient toasts, complete → `Completed` with the
  date/time stamps; **`Ambulance Transport ₹500` on the patient's pending bill, referencing the request id,
  exactly once**, visible on the patient's billing page, and the patient's ambulance page showing Completed;
  the history row, counters, CSV export (headers + row); profile from the login (name, phone, employee id),
  validation (10-digit phone, 3–10 char vehicle), save (vehicle uppercased, badge On Duty, sessionStorage
  `ambulanceProfile`), cancel restoring fields; ArrowUp/ArrowDown nav, unknown section → dashboard,
  wrong-role bounce, reload, logout confirm + wipe, stylesheet unmounted. Side-by-side screenshots vs the HTML
  page at 1280 (match apart from the fixes listed under decisions) and 390 (both stack the sidebar). The run
  wrote to `ambulance.json`, `billing.json`, `notifications.json`, `patients.json`, `users.json`; all restored
  with `git checkout`. `system-activity.json` remains dirty as before.
- 2026-09-21 — **Phase 6 done.** 9 HTML pages + `regional-common.js/css` + `shared/hierarchy-view.js` →
  `portals/regional-officer/` (9 routed pages, `roShared.jsx`) + `features/hierarchy/` (`HierarchyView.jsx`,
  `hierarchy.css`) + `styles/regional-officer.css` (verbatim + override block), `regional-console.css`,
  `regional-details.css`. Playwright run against the live backend (`node dist/src/main.js` + `vite preview`),
  **152/152**, no unexpected console errors (the two expected: the deliberate 403 for an unassigned hospital and the
  deliberate wrong-password 400): anonymous deep link → login → dashboard; shell (8 nav.js items, role tag,
  header, stylesheet mount/unmount, no overflow at 1280); dashboard KPIs, hospitals table, subscription-revenue
  panel, alerts preview and quick actions all equal to `GET /hospitals/regional/overview` +
  `/performance-alerts`; comparison (all / selected `?ids=` / compare all / empty-selection warning, coloured
  metrics, bars, table columns); alerts (four stats, severity / category / hospital / search filters, metric line,
  details link); hospital details (no `?id=` → dashboard; H001 overview from live beds + inventory; the four lazy
  tabs; H003 → the backend's 403 message); approvals (stats, filters, search; two superuser-assigned registrations
  cleared and rejected with a reason through the dialogs, backend state confirmed; cross-region review → 403);
  complaints (stats, filters, hospital names, status modal round trip with `PATCH /feedback/:id/status`, stats
  re-fetched, reverted); revenue (KPIs summed from `GET /revenue/my-hospitals/compare`, rows, department breakdown
  and picker, empty-revenue message); hierarchy (banner, five tiles, tree vs `GET /hierarchy`, collapsed hospitals,
  search opens matches, empty message); profile (eleven fields, hospital count from the overview, the three password
  validations, a real change and change-back); routing (reload, index, unknown page, wrong-role bounce, logout wipe,
  guard). Side-by-side screenshots vs the HTML pages at 1280: match (bell + "AR" initials aside, see decisions);
  at 390 both overflow the same way (nav.css has no responsive rules). The run wrote to `hospitals.json`,
  `feedback.json`, `notifications.json`, `users.json`; all restored with `git checkout`. `system-activity.json`
  remains dirty as before. Script: `/tmp/claude-1000/-home-vivian-FFSD/b5f41b7b-81c7-484d-842f-63c69396b1db/scratchpad/phase6.mjs`.
- 2026-09-21 — **Phase 7 done.** 9 HTML pages (5,346 lines) → `portals/superuser/` (9 routed pages,
  `suShared.jsx`) + `features/activity/logActivity.js` + `styles/superuser.css`; `chart.js` added as a
  dependency (lazy chunk). Playwright run against the live backend (`node dist/src/main.js` + `vite preview`),
  **222/222**, no unexpected console errors (the deliberate 403 probes and fetches aborted by navigating away
  from the polling dashboard aside): anonymous deep link → hub → "Super User Login" → back to the remembered
  `/superuser/revenue`; shell (9 nav.js items, role tag, "System Administrator" role line, login name, no
  overflow at 1280); dashboard (four counts equal to `/users` · `/patients` · `/feedback` filters, five
  quick-action routes, the ten newest `/system/activity/recent` rows, "Full Log →" → the security tab);
  hierarchy (root banner, seven platform-level tiles, tree vs `GET /hierarchy`, collapsed hospitals, search,
  empty message); **hospital registrations round trip** with three throwaway registrations — pending-first
  ordering, the ranked "Covers Tirupati" optgroup with load labels and the "Suggested:" line, a non-covering
  officer refused by the backend, assignment → `assignedManagerId` RM001 / "RO pending", Direct Approve → the
  credentials modal (email `<first>.<hNNN>@nexcare.com`, password, SPA portal link, clipboard copy) → backend
  verified + a working `hospital_manager` login, Reject (empty reason refused, reason recorded), H009's
  "RO Rejected … Final Reject", search; patient directory (25 patient accounts, search, cancel/confirm delete
  of a throwaway registration, `DELETE /users/:id`, the audit row); manage users (118 staff rows, role badge,
  the four validation messages, role → department list, areas required for a regional officer, create →
  toast → the account logs in with `Password123`, edit name + Inactive, delete, click-outside close); system
  settings (values from `GET /system/settings`, native email validation, save → banner → `PUT` stored the
  map, reload reads maintenance **on** then **off** back correctly); feedback (row count, hospital / type
  filters, search, details modal, delete); revenue (all six tabs against the live figures — streams, payer
  bars, MRR/ARR, trend, per-hospital rows, plan cards with live seat counts, membership tiers and members,
  regions with the click-to-expand breakdown and the conditional unassigned tile; hospital-plan and tier
  fees repriced and restored; **`paymentGatewayRate` 2.1 → 0.021 → 1.9**, the stream basis line re-priced;
  negative values refused with the field label); reports (usage tiles, the lazy chart.js chunk, non-blank
  canvases for all five charts, the module table from the audit log, health tiles, measured latency bars
  named by path, operational tiles, security tiles and the ten newest events, date-range re-fetch, reload
  keeps `?tab=`); the **§5B matrix from the SPA** (superuser 200s; RM002 sees 2 hospitals, 403 on H001's
  revenue / platform streams / fees / approve / settings / subscriptions; RM001 403 on H003; HM 403 on H002;
  doctor 403 on another doctor's appointments and on `/hierarchy` but 200 on `/hierarchy/scope`; patient 403
  on streams and `/users`); routing (index, unknown page, reload, wrong-role bounce, logout wipe). Side-by-side
  screenshots vs the 9 HTML pages and every revenue/report tab at 1280: match (bell + login name aside, see
  decisions; the two CSS leaks found are fixed in the override block). The run wrote to
  `hospital-subscriptions.json`, `hospitals.json`, `notifications.json`, `patients.json`,
  `platform-fee-config.json`, `system-settings.json`, `users.json`, `feedback.json`; all restored with
  `git checkout`. `system-activity.json` remains dirty as before (and now gains real audit rows).
  Script: `/tmp/claude-1000/-home-vivian-FFSD/ceb2cf37-e75c-4bcf-a2a5-ffab214bcad7/scratchpad/phase7.mjs`.
- 2026-09-22 — **Phase 8 done (bar the two blocked cutover commands).** `React.lazy` per portal
  first, so the bundle under test was the shipped one: entry chunk 913 kB → **278 kB (78 kB
  gzip)**, no chunk over the 500 kB warning, seven named portal chunks.
  Then `MANUAL_TESTING_CHECKLIST.md` end to end against the live backend
  (`node dist/src/main.js` + `vite preview`), in three passes:
  **API and middleware, 40/40** (`api-checks.sh`) — merge-conflict sweep, health, security
  headers, `x-request-id` + the access log, CSRF (login not challenged, 64-char token, stable
  across three and nine parallel requests, unauthenticated write 403, bad token 403),
  the ValidationPipe's `{field, messages[]}`, auth/roles guards, the ambulance middleware,
  `x-query-timestamp`, the 404 envelope with its `requestId`, `/revenue/plans` + `/subscriptions`
  still 404, the **16-row authorisation matrix** (re-run with the seed's real accounts — see
  decisions), the two workload endpoints under 100 ms (3 ms / 12 ms), and a 2 MB body → 413.
  **Browser, 91/91** (`phase8a.mjs`) — all seven actors log in through their own login page and
  land on the right home with no page error; the four negative cases (wrong role, nurse record,
  wrong password, unknown email); three cross-portal bounces with no content flash; the
  anonymous deep link remembered through login; **every route of every portal** (58 pages) with
  its data, no console error and no 4xx API call; `hospital-details?id=H001` and the backend's
  refusal on `?id=H003`; the unguarded `/patient/hospital-search`; the four public pages; and a
  deep-link refresh served 200 by the host.
  **Cross-role flow, 26/26** (`phase8b.mjs`), in one sitting, all through the SPA — a throwaway
  patient registers (`P065`, a unique id) → books Cardiology at H001 through the four-step
  wizard (Pending) → the front desk checks them in → Dr Sunita Confirms then Completes → the
  front desk generates `BILL-H001-001` (₹2,478, the consultation line plus their own) → the
  patient is **declined** on `4000…0002` (bill stays Pending, **platform earns nothing**) then
  **approved** on `4242…4242` → platform revenue moves by **exactly ₹47.08 = 0.019 × 2,478**,
  the ledger row names the bill with its rate, gross and `hospitalId: H001` → the H001 manager's
  revenue section shows collections **₹10,207 → ₹12,685**, up by the bill → the superuser's
  revenue page lists the hospital. Plus: repricing `paymentGatewayRate` to 3% left the settled
  ₹45,438.42 untouched (restored to 1.9%), a staff restock appended to the inventory audit
  trail, a hand-edit of `billing.json` moved `collected` 12,685 → 15,635 with no restart
  (§7.3, nothing is stored pre-aggregated), and a backend restart left every bill, appointment
  and ledger row in place (§7.6).
  `npx jest` in `back-end/`: 10 suites, 62 tests, all passing. The run wrote to
  `appointments.json`, `billing.json`, `inventory.json`, `inventory-audit.json`,
  `notifications.json`, `patients.json`, `payment-intents.json`, `platform-fee-config.json`,
  `platform-transactions.json` and `users.json`; all restored with `git checkout`.
  `system-activity.json` remains dirty as it was before this session.
  Scripts: `/tmp/claude-1000/-home-vivian-FFSD/6da70775-df86-44e7-b9ec-0dac20c4347f/scratchpad/`
  — `api-checks.sh`, `phase8a.mjs`, `phase8b.mjs`.
  **Still to run:** the `git rm` / `rm` / `mv` cutover block in the Phase 8 section above. The
  sandbox refused it; every document already describes the post-rename layout.
