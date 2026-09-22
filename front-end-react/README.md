# NexCare — front end

The single-page React app for all seven NexCare portals. Vite 5 + React 18 +
`react-router-dom` v6, **JavaScript, not TypeScript**, no UI library. It replaced
the 59 static HTML pages that used to live here on 2026-09-22 — see
[`../plan.md`](../plan.md) for the nine-phase migration and
[`../progress.md`](../progress.md) for every decision taken while porting, the
HTML bugs fixed on the way, and the ones deliberately kept.

## Run it

```bash
# 1. backend (from the repo root)
cd back-end && npm install && npm run start:dev        # http://localhost:3001

# 2. this app
cd front-end && npm install && npm run dev             # http://localhost:5173
```

`npm run build` writes a static bundle to `dist/` (gitignored); `npm run preview`
serves it with history-API fallback so deep links such as `/doctor/leaves` load
on refresh. In production use any static host that rewrites unknown paths to
`index.html` — `serve -s dist`, or nginx with `try_files $uri /index.html`.
**Without that fallback every deep link 404s on refresh.**

The API client resolves the backend as `http://<current hostname>:3001/api`, so
the app works from localhost, a LAN IP or the WSL IP with no configuration. Set
`VITE_API_URL` to point it somewhere else.

Accounts for every role are in [`../ACTOR_CREDENTIALS.md`](../ACTOR_CREDENTIALS.md)
(doctor demo: `sunita@nexcare.com` / `Password123`).

## Layout

```
src/
  main.jsx                     BrowserRouter + Auth / Toast / Dialog providers
  App.jsx                      the full route tree; each portal is React.lazy
  api/
    client.js                  fetch wrapper: base URL, Bearer + CSRF (prime-and-retry), 401 signal,
                               multipart upload; resolves { success, data, message } or throws ApiError
    index.js                   every backend area — Auth, Users, Patients, Appointments, Billing,
                               Payments, Ambulance, Feedback, Beds, Inventory, Hospitals,
                               SupportRequests, Leaves, Revenue, Schedules, Hierarchy,
                               Notifications, Uploads, System
    links.js                   pageLink(legacyPage, params) → SPA path (LEGACY_ROUTES table)
  context/
    AuthContext.jsx            session for any role: the five sessionStorage keys, role aliases,
                               JWT expiry, login(email, password, role), logout, updateUser
    ToastContext.jsx           notify(message, type, duration) / showToast({ … })
  components/
    RequireAuth.jsx            no session → /login (remembers `from`); wrong role → own home
    NexCareLogo.jsx, icons.jsx
    layout/                    PortalLayout, Sidebar (menu per role from navigation.js), Header,
                               BackButton, NotificationBell
    ui/                        KpiTile, Panel, StatusPill, EmptyRow, PageHeader, Modal, Tabs,
                               DataTable, ConfirmDialog; Dialogs.jsx = useDialogs()
  features/                    logic two or more portals share
    activity/                  the audit write behind every admin change (POST /system/activity)
    ambulance/                 the transport status ladder, next-status table and ETA countdown
    appointments/              confirm / complete / refer actions and the patient-info modal
    doctor-directory/          the booking catalogue from live hospitals + doctors, and the
                               published-schedule slot maths
    hierarchy/                 the org tree both hierarchy pages draw
    invoice/                   bill totals, the ambulance line, the jsPDF export
    payments/                  the card form and the mock gateway's outcomes
  hooks/
    useStylesheet.js           route-scoped <link> for stylesheets with page-global selectors
    usePolling.js              interval that clears on unmount and pauses while the tab is hidden
    useConfirm.jsx             the shared ConfirmDialog as `await ask(…)`
  portals/                     public · auth · patient · doctor · staff · hospital-manager ·
                               ambulance · regional-officer · superuser
  utils/                       roles.js (aliases, labels, home routes), jwt.js, format.js
  styles/                      one file per portal, copied verbatim, plus global / nav / portal / auth
```

**Rules.** A page lives under `portals/<role>/`; anything two portals import moves
to `features/` or `components/`. Styles are copied, not rewritten (see below).

## Three things to know before editing

**Stylesheets are copies with an override block.** Each `src/styles/<portal>.css`
is the original stylesheet **verbatim**, with a clearly marked override block
appended that undoes leaks from the globally bundled `global.css` / `nav.css` /
`portal.css` (they share class names — `.sidebar`, `.modal-content`, `.tab-btn`,
`.form-group`). Fix a visual diff in the override block; leave the copied rules
above it alone. Stylesheets with page-global selectors (`body`, `h1`) are
route-mounted through `useStylesheet()` so they cannot leak into other routes.

**Portals are lazy.** `App.jsx` pulls each portal in with `React.lazy`, so
`portals/<name>/index.jsx` is the chunk boundary: it exports the route table
*and* a default component that renders it. `vite.config.js` names those chunks
after the folder. Entry chunk 278 kB (78 kB gzip); largest portal chunk is the
patient's at 144 kB. `jspdf` and `chart.js` are dynamic imports of their own.

**API calls throw.** The old HTML client returned `{ success: false }`; this one
throws `ApiError` (with `.status`) and resolves `{ success, data, message }`, so
pages use `try/catch` and read `res.data`. There are no native `alert()`,
`confirm()` or `prompt()` calls — they are `notify()` toasts, `useConfirm()`, and
small input modals.

## Routes

| Area | Routes |
|---|---|
| Public | `/` · `/hospital-registration` · `/patient/hospital-search` (no guard, as the HTML page had none) |
| Auth | `/login` · `/login/:role` · `/register/patient` · `/signup` · `/register/staff` · `/forgot-password` · `/change-password` |
| Patient | `/patient/{dashboard,appointments,billing,ambulance,feedback,membership,profile}` |
| Doctor | `/doctor/{dashboard,appointments,earnings,leaves,profile}` |
| Administrative staff | `/staff/{dashboard,manage-appointments,patient-checkin,patient-directory,bed-allocation,generate-bill,inventory,staff-scheduling,leave-requests,feedback,system-logs}` |
| Hospital manager | `/hospital-manager/{overview,staff,leaves,schedules,supervision,support,feedback,inventory-approvals,ambulance,revenue,subscription,setup}` |
| Ambulance | `/ambulance/{dashboard,ambulance-requests,assigned-dispatch,active-transport,completed-transports,profile}` |
| Regional officer | `/regional-officer/{dashboard,hospital-approvals,hospital-details,hospital-comparison,performance-alerts,complaints,revenue,hierarchy,profile}` |
| Superuser | `/superuser/{dashboard,hierarchy,hospital-registrations,patient-directory,manage-users,system-settings,feedback,revenue,reports}` |

Login → home: patient `/patient/dashboard` · doctor `/doctor/dashboard` ·
administrative_staff `/staff/dashboard` · ambulance `/ambulance/dashboard` ·
hospital_manager `/hospital-manager/overview` · regional_manager
`/regional-officer/dashboard` · superuser `/superuser/dashboard`.

The old `folder/page.html` and `page.html#section` names still resolve, through
`pageLink()` in `api/links.js` — useful for links coming from outside the app.

## Backend rules worth knowing

- `GET /patients/:id` is closed to the `doctor` role, so the patient-info modal
  shows booking history and an honest "contact details are held by the front
  desk" line. The HTML portal hit the same 403.
- Rates are **fractions**: `paymentGatewayRate` `0.019` is 1.9%. The superuser
  revenue page converts on the way in and out (`FEE_FIELDS`); sending `1.9` would
  charge 190%.
- `POST /appointments` runs behind a `forbidNonWhitelisted` ValidationPipe — send
  exactly the fields `CreateAppointmentDto` declares, nothing more.
- Booking slots must fall inside the hospital's **published** schedule
  (`GET /schedules?status=approved`), not just the doctor's roster.
