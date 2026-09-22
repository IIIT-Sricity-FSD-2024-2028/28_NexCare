# NexCare — Frontend migration plan: HTML/JS → React SPA

> One React single-page app replaces the 59 static HTML pages in `front-end/`.
> Same NestJS backend on `:3001`, same `sessionStorage` keys, same stylesheets,
> same behaviour for every actor. When the last phase closes, `front-end/` and the
> `npx serve -l 8080` static server are deleted.
>
> Work is done **one phase at a time, on instruction**. Status lives in
> [`progress.md`](progress.md); this file is the what-and-why and should not need
> to change unless a decision changes.

---

## 0. Ground rules (apply to every phase)

1. **Nothing regresses.** A phase is done only when every page it covers does what
   the HTML page did, verified against a running backend with the accounts in
   `ACTOR_CREDENTIALS.md`. Parity is checked against the HTML page side by side.
2. **Backend is untouched.** No route, DTO, guard, or seed changes for this
   migration. If a page only works because of a backend quirk (e.g. `GET /patients/:id`
   is 403 for doctors), the React page keeps the same behaviour.
3. **Keep `PROJECT_CONTEXT.md` rules** — §1 (non-clinical), §4 (actors), §5B
   (visibility scope). No new features are added while porting; feature requests
   go in `progress.md` → "Deferred" and are done after Phase 8.
4. **Session contract is frozen.** Keys `nexcare_auth_token`, `nexcare_csrf_token`,
   `nexcare_user_data`, `nexcare_current_role`, `nexcare_user_email` are read and
   written exactly as `shared/session.js` does today, so a tab that logged in on the
   HTML portal mid-migration is still logged in on the React one.
5. **Styles are copied, not rewritten.** `global.css`, `nav.css`, `portal.css`,
   `auth.css` are already in `front-end-react/src/styles/`. Per-portal CSS
   (`patient/styles.css`, `hospital_manager/dashboard.css`, `ambulance/styles.css`,
   `landing/landing.css`, …) is copied verbatim into `src/styles/<portal>.css` and
   imported by that portal's layout. Visual diffs are fixed in the React copy only.
6. **The HTML portal stays runnable until Phase 8.** Never delete or edit
   `front-end/` before then — it is the reference for parity checks.
7. **JavaScript, not TypeScript**, matching the existing React app and the rest of
   the front end. Vite + React 18 + `react-router-dom` v6. No UI library.
8. **One commit per phase** minimum, Conventional Commits, no Claude co-author
   trailer. The user runs the commit.

---

## 1. Target structure

```
front-end-react/                     (renamed to front-end/ in Phase 8)
  index.html  vite.config.js  package.json
  src/
    main.jsx                          BrowserRouter + AuthProvider + ToastProvider
    App.jsx                           full route tree (see §2)
    api/
      client.js                       fetch wrapper: base URL, Bearer, CSRF, 401 → logout, error shape
      index.js                        ONE module per backend area, mirrors shared/api.js:
                                      Auth, Users, Patients, Hospitals, Appointments, Beds,
                                      Inventory, Billing, Payments, Ambulance, Feedback,
                                      Leaves, Schedules, Revenue, Hierarchy, Notifications,
                                      Registrations, SystemLogs, Settings, Reports
      links.js                        pageLink(page, params) → SPA path (replaces window.pageLink)
    context/
      AuthContext.jsx                 user, role, token; login(role), logout(); role → home route
      ToastContext.jsx                notify()
    components/
      layout/  PortalLayout, Sidebar (role → menu map from nav.js), Header, NotificationBell,
               PublicLayout (landing / auth shell)
      ui/      KpiTile, Panel, StatusPill, Modal, DataTable, EmptyRow, PageHeader, Tabs,
               SearchBox, Pagination, ConfirmDialog (from shared/ui-components.js)
      NexCareLogo.jsx, RequireAuth.jsx (role-aware), icons.jsx
    features/                         cross-portal logic that two or more portals share
      appointments/  hierarchy/ (hierarchy-view.js)  invoice/ (invoice-pdf.js)
      doctor-directory/  hospital-search/  payments/ (card form + mock gateway outcomes)
    portals/
      public/         landing, hospital-registration
      auth/           login hub, per-role login, patient/staff register, forgot/change password
      patient/        8 pages
      doctor/         5 pages (DONE — moved here from src/pages/)
      staff/          11 pages
      hospital-manager/  12 sections → 12 nested routes
      ambulance/      6 sections → 6 nested routes
      regional-officer/  9 pages
      superuser/      9 pages
    styles/           global, nav, portal, auth (present) + one file per portal
    utils/            format.js, dates, validation (from administrative_staff/validation.js)
```

Rules for the tree: a page component lives under `portals/<role>/`; anything imported
by two portals moves to `features/` or `components/`. No `pages/` folder at the root
after Phase 0.

---

## 2. Route map

Public
```
/                              landing
/hospital-registration         landing/hospital-registration + hospital-registration/register
/login                         auth/login.html (role hub)
/login/:role                   patient | doctor | staff | hospital-manager | regional-officer | superuser
/register/patient  /register/staff  /signup
/forgot-password  /change-password
```

Authenticated — each portal is a layout route with `<RequireAuth roles={[...]}>` and a
role-specific `<Sidebar>`; `index` redirects to that portal's dashboard.
```
/patient/{dashboard,hospital-search,appointments,billing,ambulance,feedback,membership,profile}
/doctor/{dashboard,appointments,earnings,leaves,profile}
/staff/{dashboard,manage-appointments,patient-checkin,patient-directory,bed-allocation,
        generate-bill,inventory,staff-scheduling,leave-requests,feedback,system-logs}
/hospital-manager/{overview,staff,leaves,schedules,supervision,support,feedback,
                   inventory-approvals,ambulance,revenue,subscription,setup}
/ambulance/{dashboard,ambulance-requests,assigned-dispatch,active-transport,
            completed-transports,profile}
/regional-officer/{dashboard,hospital-approvals,hospital-details,hospital-comparison,
                   performance-alerts,complaints,revenue,hierarchy,profile}
/superuser/{dashboard,hierarchy,hospital-registrations,patient-directory,manage-users,
            system-settings,feedback,revenue,reports}
```

Legacy `.html` links: `pageLink(page, params)` becomes a pure function returning the SPA
path with `?` query preserved (the static host used to drop query strings — the SPA does
not, so `hospital-details?id=H001` just works as `useSearchParams`). Hash sections
(`dashboard.html#leaves`) become the nested routes above.

Login → home: `patient → /patient/dashboard`, `doctor → /doctor/dashboard`,
`administrative_staff → /staff/dashboard`, `ambulance → /ambulance/dashboard`,
`hospital_manager → /hospital-manager/overview`, `regional_manager → /regional-officer/dashboard`,
`superuser → /superuser/dashboard`. Role aliases in `nav.js` (`super_user`, `hospital_admin`,
`admin_staff`, `ambulance_staff`, `regional_officer`) are normalised in `AuthContext`.

---

## 3. Phases

Each phase lists **scope → what to port → exit criteria**. Sizes are lines of the source
being replaced, to set expectations.

### Phase 0 — Foundation: turn the doctor app into the multi-role shell
Scope: `front-end-react/` internals only. No new pages.
- Rename package `nexcare-doctor-react` → `nexcare-frontend`; add `front-end-react/dist/`
  to `.gitignore` (it is currently untracked but not ignored).
- Move `src/pages/*` → `src/portals/doctor/`; introduce `portals/`, `features/`,
  `components/{layout,ui}` folders per §1.
- Port **all** of `shared/api.js` (1,223 lines) into `api/index.js` — every namespace,
  not just the doctor ones — plus `client.js` behaviours: CSRF header, 401 handling,
  `API_URL` override, upload (multipart) helper, error normalisation.
- Port `shared/session.js` (311) semantics into `AuthContext`: all five keys, role
  aliases, `requireRole` guard, redirect-after-login, logout clears everything.
- `Sidebar` reads a **menu map** (one entry per role, extracted from `nav.js` 432 lines,
  icons included) instead of the hard-coded doctor list.
- `RequireAuth` accepts `roles`; wrong role → that role's own home, not `/login`.
- Port `shared/ui-components.js` (278) and `shared/portal.js` (109) into `components/ui`.
- `api/links.js` — `pageLink()` replacement with a legacy-page → route table so ported
  pages can be linked from not-yet-ported ones during the migration.
- Vite: `server.historyApiFallback` is default; add `build.outDir` and a `preview`
  check that deep links (`/doctor/leaves`) load on refresh.
- Decide and document: `db.js` (865, localStorage fallback) is **not** ported. Only
  `patient/` still calls it (3 methods) — Phase 2 replaces those with API calls.
  `mock-hospitals.js` (1,965, 3 pages) — same: audit in Phase 2, port only what has no
  backend equivalent.
Exit: doctor portal works exactly as before at `/doctor/*`; `/login/doctor` and legacy
`/login` both reach it; `npm run build` clean; `progress.md` updated.

### Phase 1 — Public site and authentication (16 pages)
Scope: `landing/` (2 html, 918+1,608 css), `hospital-registration/` (1), `auth/` (12).
- `PublicLayout` with landing header/footer; landing page sections as components.
- Hospital registration form (multi-step, file upload of licence docs) → `features/`
  because Superuser and Regional Officer review the same record later.
- Login hub + six role logins share one `LoginForm` with a `role` prop; patient and
  staff registration; forgot/change password. Doctor login (done) is folded in.
- After-login redirect table from §2.
Exit: every actor in `ACTOR_CREDENTIALS.md` can log in through the SPA and lands on the
correct (possibly still-unported → temporary "coming in phase N" placeholder) home.
Doctor and public flows have no placeholders.

### Phase 2 — Patient portal (8 pages + `dataStore.js`, `script.js`)
Pages: dashboard, hospital-search, appointments (booking flow with urgency + fee +
Care+ waiver), billing (card payment via mock gateway, invoice download), ambulance
request, feedback (hospital picker), membership (Care+), profile.
- `features/payments/` — card form, the five test-card outcomes, idempotency key.
- `features/invoice/` — port `invoice-pdf.js` (566) once; Staff reuses it in Phase 3.
- Replace the 3 `NexCareDB` calls and any `mock-hospitals` fallback with API calls.
Exit: book → pay → download invoice → feedback round-trip works for `P001`'s login;
fee waiver shows for a Care+ member; ambulance request submits (the 0c72405 fix holds).

### Phase 3 — Administrative Staff portal (11 pages, largest page count)
Pages: dashboard, manage-appointments, patient-checkin, patient-directory,
bed-allocation, generate-bill, inventory, staff-scheduling, leave-requests, feedback,
system-logs. Plus `validation.js` → `utils/validation.js`, `generate_pages.js` (check
whether it is a build-time helper or dead — likely delete).
- Bed allocation ward grid, bill generation (line items → `POST /billing`), check-in queue.
Exit: full front-desk day works: check-in → bed → bill → mark paid; leave request
approvals visible to the hospital manager (HTML portal, until Phase 4).

### Phase 4 — Hospital Manager portal (1 page, 12 sections; 1,645 html / 2,196 js / 1,429 css)
- Each `#section` → nested route; the section switcher becomes `<NavLink>`s.
- Sections: overview, staff, leaves, schedules, supervision, support, feedback,
  inventory-approvals, ambulance, revenue, subscription (plan/seat count/`PATCH
  /revenue/hospital-subscriptions/:id`), setup.
- Break `dashboard.js` into one module per section; shared KPI/ table code → `components/ui`.
Exit: every section renders with `H001`'s manager; subscription change is scoped to own
hospital (403 elsewhere); leave approval round-trips with Phase 3.

### Phase 5 — Ambulance Staff portal (1 page, 6 sections; 667 html / 3,635 js / 3,879 css)
- Sections → routes: dashboard, ambulance-requests, assigned-dispatch, active-transport,
  completed-transports, profile.
- `app.js` is the single biggest file: split by section; status-transition logic
  (requested → assigned → en-route → completed) into `features/ambulance/`.
- Any polling/`setInterval` becomes a hook with cleanup.
Exit: a patient's request (Phase 2) is visible, accepted, driven through every status
and completed; dispatch fee appears in the patient's bill.

### Phase 6 — Regional Officer portal (9 pages)
Pages: dashboard, hospital-approvals, hospital-details (`?id=`), hospital-comparison,
performance-alerts, complaints, revenue, hierarchy, profile.
- `features/hierarchy/` — port `hierarchy-view.js` (161); Superuser reuses it.
- `regional-common.js/css` → portal layout.
- Approvals consume the Phase 1 registration record.
Exit: officer sees only own region's hospitals; approve/reject a registration; hierarchy
subtree matches `GET /api/hierarchy`.

### Phase 7 — Superuser portal (9 pages)
Pages: dashboard, hierarchy, hospital-registrations, patient-directory, manage-users,
system-settings, feedback, revenue (all tabs incl. regional officers drill-down), reports.
- Revenue fee fields: keep the fraction ↔ percent conversion (`FEE_FIELDS`) — sending
  `1.9` charges 190%.
Exit: full platform view; fee edit round-trips; every role's 200/403 matrix from
`PROJECT_CONTEXT.md` §5B still holds when driven from the SPA.

### Phase 8 — Parity sweep, cutover, delete the HTML frontend
- Run `MANUAL_TESTING_CHECKLIST.md` end to end on the SPA. Fix diffs.
- Grep the SPA for any `.html` link or `window.location` string; none may remain.
- Cross-role flows in one sitting: patient books → staff checks in → doctor completes →
  staff bills → patient pays → manager sees revenue → superuser sees ledger row.
- **Delete** `front-end/` (all 10 folders, `serve_*.txt`, `frontend_log.txt`,
  `debug.html`, `jsconfig.json`, `package-lock.json`, `logo.js`). Remove the
  `front-end/node_modules/` line from `.gitignore`. Remove the old `front-end-react/plan.md`
  (the Lab deliverable's plan; superseded by this file).
- Rename `front-end-react/` → `front-end/` and update `README.md`, `PROJECT_CONTEXT.md`
  (§6–§13 inventory, §15 run commands: `npm run dev` / `npm run build && npm run preview`
  instead of `npx serve`), and the 7 credential/testing docs that reference `.html` paths.
- Production serving note in README: any static host with history-API fallback
  (`vite preview`, `serve -s dist`, nginx `try_files`).
Exit: repo has one frontend; `git grep -l 'front-end/' -- '*.md'` shows only the new paths.

---

## 4. Risks and how each phase handles them

| Risk | Where it bites | Mitigation |
|---|---|---|
| Static host dropped query strings, so pages may have worked around it with `sessionStorage` handoffs | Phase 2, 3, 6 (`hospital-details?id=`) | Prefer `useSearchParams`; keep reading the old session key as fallback for one phase, then drop |
| `db.js` localStorage state that never reached the backend | Phase 2 | Audit the 3 calls; if data exists only in `localStorage`, it is demo residue — not ported |
| Sections in HM/Ambulance share module-level state across "pages" | Phase 4, 5 | Lift to the portal layout via context or a `useOutletContext` |
| `setInterval` polling without cleanup | Phase 5 (dispatch), Phase 3 (queue) | `useEffect` return cleanup, one `usePolling` hook |
| Login rewrites passwords in `users.json` on every attempt | All | Check `git diff back-end/data/` before every commit |
| Docs drift | Phase 8 | The `.html` grep is an exit criterion, not a suggestion |
| Bundle size once all seven portals are in one app | Phase 8 | `React.lazy` per portal layout route; measure with `vite build --report` |

---

## 5. Definition of "intact"

For each ported page, all of the following match the HTML page:
- every API call (method, path, payload) — checked in the network tab
- every visible state: loading, empty, error, success toast text
- role scoping (403 handled the same way)
- links out of the page land on the equivalent route
- stylesheet is the copied original; layout diff is pixel-close at 1280 and 390 wide
