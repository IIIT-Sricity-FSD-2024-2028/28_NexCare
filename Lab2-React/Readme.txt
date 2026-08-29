===============================================================================
 NexCare — Lab 2: Converting the frontend to React
===============================================================================

 Project : NexCare — Hospital Administrative Operations Platform (non-clinical)
 Repo    : IIIT-Sricity-FSD-2024-2028/28_NexCare
 Folder  : Lab2-React/
 Stack   : React 19 + Vite 8 (the rest of NexCare stays vanilla HTML/CSS/JS)


-------------------------------------------------------------------------------
 1. WHICH FEATURE WAS CONVERTED, AND WHY
-------------------------------------------------------------------------------

Converted: the PATIENT APPOINTMENT FEATURE — the 4-step booking wizard plus the
"My Appointments" list.

Original code:
    front-end/patient/appointments/appointments.html   (3 sections toggled by
                                                        inline display:none)
    front-end/patient/appointments/appointments.js     (1069 lines)

It was the right page to pick because it is the only screen in NexCare that
already has genuinely *shared* mutable state. The original keeps two variables
at module scope:

    let bookingData = { hospital, department, doctorId, doctor, date, time, ... }
    let currentStep = 1;

and then rebuilds the whole DOM with template strings on every change
(renderStep0 … renderStep3 → renderConfirmation). Those two module-level
variables are exactly what "lift the state up to a common parent" is describing,
so the conversion is a real architectural improvement and not a cosmetic port.


-------------------------------------------------------------------------------
 2. COMPONENT STRUCTURE
-------------------------------------------------------------------------------

    App.jsx  ................. owns ALL shared state; renders the shell
    |
    +-- LoginPanel ........... patient sign-in (its own local form state)
    |
    +-- StepIndicator ........ the 1-2-3-4 progress bar (props only)
    |
    +-- BookingWizard ........ routes to the current step; owns no state
    |   |
    |   +-- HospitalStep ........ step 0
    |   |   +-- HospitalCard .... one hospital tile
    |   |
    |   +-- DepartmentStep ...... step 1
    |   |
    |   +-- DoctorDateStep ...... step 2
    |   |   +-- DoctorCard ...... one consultant tile
    |   |   +-- SlotPicker ...... time slots, taken ones disabled
    |   |
    |   +-- DetailsStep ......... step 3 (review + reason + confirm)
    |   |
    |   +-- Confirmation ........ step 4 (token / reference receipt)
    |
    +-- MyAppointments ....... the list; sibling of BookingWizard
        +-- AppointmentCard .. one appointment row

    api.js ................... API layer (the React port of shared/api.js)
    data/hospitals.js ........ offline hospital catalogue (fallback only)
    styles.css ............... styling, palette taken from the existing portal

15 components in 14 .jsx files, ~1,100 lines of application code.


-------------------------------------------------------------------------------
 3. WHERE PROPS ARE USED
-------------------------------------------------------------------------------

Every component below is driven entirely by props — none of them reads global
state, and none of them fetches its own data.

  StepIndicator      currentStep, labels
                     Purely presentational: renders the progress bar and raises
                     nothing back. Replaces renderStepIndicator()'s template
                     string in the original appointments.js.

  HospitalStep       hospitals, selected, loading
  HospitalCard       hospital, isSelected
                     The card is told whether it is selected; it does not work
                     it out for itself.

  DepartmentStep     hospital, selected
                     Derives its list from hospital.departments — no fetch.

  DoctorDateStep     hospital, department, date, doctor, time, bookedSlots
  DoctorCard         doctor, isSelected
  SlotPicker         slots, bookedSlots, selected
                     bookedSlots is a Set of times already taken, computed by
                     App from the appointments API and passed down two levels.

  DetailsStep        booking, error
  Confirmation       appointment
  AppointmentCard    appointment
  MyAppointments     appointments

  BookingWizard      step, booking, hospitals, bookedSlots, confirmed, ...
                     Receives the whole lifted state and distributes the right
                     slice to whichever step is active.


-------------------------------------------------------------------------------
 4. WHERE CALLBACKS ARE USED (child -> parent communication)
-------------------------------------------------------------------------------

No child ever mutates shared state. Each one calls a function it received as a
prop, and App decides what that means. Eleven callbacks in total:

  CALLBACK              RAISED BY                    WHAT App DOES
  --------------------  ---------------------------  --------------------------
  onSelect              HospitalCard                 stores the hospital, RESETS
   -> onSelectHospital   (via HospitalStep)          department/doctor/date/time,
                                                     advances to step 1
  onSelect              DepartmentStep               stores department, clears
   -> onSelectDepartment                             doctor + time, step 2
  onSelectDoctor        DoctorCard                   stores doctor, clears time
                        (via DoctorDateStep)
  onSelectDate          DoctorDateStep               stores date, clears doctor
                                                     and time (a new weekday
                                                     changes who is on duty)
  onSelectSlot          SlotPicker                   stores the chosen time
                        (via DoctorDateStep)
  onChangeReason        DetailsStep                  updates booking.reason
  onBack / onNext       every step                   moves `step`
  onConfirm             DetailsStep                  POSTs the appointment AND
                                                     prepends it to the shared
                                                     appointments array
  onCancel              AppointmentCard              PATCHes .../cancel and
   -> onCancelAppointment (via MyAppointments)       flips that row to Cancelled
  onLogin               LoginPanel                   authenticates, stores the
                                                     session, reloads data
  onDone                Confirmation                 resets the wizard, switches
                                                     to the appointments list

The two clearest examples for marking purposes:

  (a) HospitalCard -> HospitalStep -> App
      HospitalCard renders a tile and calls onSelect(hospital). It has no idea
      that selecting a hospital also wipes the department, the doctor, the date
      and the slot — App applies that rule, because only App can see the whole
      booking object.

  (b) AppointmentCard -> MyAppointments -> App
      The Cancel button travels up two levels. MyAppointments wraps the parent
      callback so it can show an error message locally, then forwards to App,
      which is where the appointments array actually lives.


-------------------------------------------------------------------------------
 5. WHERE STATE WAS LIFTED, AND WHY
-------------------------------------------------------------------------------

All shared state lives in App.jsx. Four pieces, each for a different reason:

  booking  { hospital, department, doctor, date, time, reason }
      Five step components each READ a different slice and WRITE a different
      field. No single step can own it, so it is lifted to their nearest common
      parent. This directly replaces the module-level `bookingData` object in
      the original appointments.js.

  appointments  [ ... ]
      THE CLEAREST CASE. BookingWizard *produces* an appointment; MyAppointments
      *displays* the list. They are SIBLINGS, so neither can own it — the list
      has to live above both. Because it does, confirming a booking makes the
      new row appear in the list with no refetch and no manual DOM update.

  step  0..4
      BookingWizard renders it, but HospitalStep, DepartmentStep, DoctorDateStep
      and DetailsStep all need to move it. Owned by App, changed only through
      onBack / onNext / the selection callbacks.

  session  { id, name, role, patientId }
      Created by LoginPanel, displayed by the header, required by every API
      call, and used to filter MyAppointments. Four consumers across three
      subtrees, so it can only sit at the top.

DELIBERATE COUNTER-EXAMPLE — not everything should be lifted:

  MyAppointments.jsx keeps `filter` ("upcoming" vs "past") as LOCAL state, and
  LoginPanel.jsx keeps `email` / `password` / `busy` local. Those are private
  view details that no other component needs. Lifting them would add noise to
  App and re-render the whole tree on every keystroke for no benefit.


-------------------------------------------------------------------------------
 6. HOW TO RUN
-------------------------------------------------------------------------------

  Terminal 1 — the existing NexCare backend (optional but recommended):

      cd back-end
      npm install
      npm run build
      npm run start:prod          # http://localhost:3001/api

  Terminal 2 — this React app:

      cd Lab2-React
      npm install
      npm run dev                 # http://localhost:5173

  Then open http://localhost:5173 and sign in with a seed patient account:

      email    : patient@gmail.com
      password : Password123

  (Other seed accounts are listed in TEST_ACCOUNTS.md at the repo root.)

  vite.config.js proxies /api -> http://localhost:3001, so the browser stays on
  one origin and no CORS configuration is needed.

  WITHOUT the backend running, the app still works: api.js falls back to the
  bundled hospital catalogue in src/data/hospitals.js and keeps bookings in
  memory. A banner at the top always says which mode you are in. This is the
  same API-first-then-fallback pattern the existing front-end/shared/db.js uses.

  Production build:  npm run build   (output in dist/)
  Smoke test:        npm test         (renders the tree, asserts on the HTML)


-------------------------------------------------------------------------------
 7. HOW THE DATA IS SOURCED
-------------------------------------------------------------------------------

The wizard needs hospital -> department -> doctor -> slots. The NestJS backend
has the first three but no availability model, so api.js builds the tree from
two live endpoints:

    GET /api/hospitals       @Public()   verified hospitals
    GET /api/users/doctors   patient     doctor directory records carrying
                                         `dept` and `hospitalId` (doctors on
                                         approved leave are excluded server-side)

Doctors are grouped by hospital, then by department. Slot templates are
generated client-side from a stable hash of the doctor id, so a doctor keeps the
same rota between reloads. Those templates are a DISPLAY aid only — the
authoritative check is the server, which refuses any POST that clashes with an
existing appointment, falls on a past date, or lands inside a doctor's approved
leave.

SlotPicker greys out times that are already taken by reading
GET /api/appointments and matching doctor + date (getBookedSlots in api.js),
so the user is stopped before they hit the server error rather than after.


-------------------------------------------------------------------------------
 8. TESTING — WHAT WAS ACTUALLY VERIFIED
-------------------------------------------------------------------------------

Run against the live NestJS backend on :3001 through the Vite proxy on :5173:

  [PASS] npm run build            -> 31 modules, no errors, no warnings
  [PASS] npm test                 -> 9 components render, 7 content assertions
                                     pass (weekday filtering, slot rendering,
                                     booked-slot disabling, conditional Cancel)
  [PASS] GET  /api/hospitals      -> 200, 12 hospitals
  [PASS] POST /api/auth/login     -> 200, JWT issued for patient@gmail.com
  [PASS] GET  /api/users/doctors  -> 200, 17 active doctors across H001/H002/H003
  [PASS] POST /api/appointments   -> 201, "Appointment created successfully",
                                     status Pending, token TKN-… issued
  [PASS] duplicate slot rejected  -> "Appointment already exists for this
                                     patient with this doctor at the same time"
  [PASS] past date rejected       -> "Cannot book appointments in the past"
  [PASS] getBookedSlots           -> correctly reports 10:30 AM as taken
  [PASS] PATCH .../cancel         -> 200, status flips to Cancelled
  [PASS] offline mode             -> catalogue fallback renders, wizard completes

  Backend regression check after the bug fixes below:
  [PASS] npx jest                 -> 5 suites, 19 tests, all passing
  [PASS] npm run build (backend)  -> compiles clean (it did NOT before)

  Test data created during verification was removed afterwards, so
  back-end/data/ is unchanged.


-------------------------------------------------------------------------------
 9. BUGS FIXED IN THE EXISTING PROJECT ALONGSIDE THIS LAB
-------------------------------------------------------------------------------

BACKEND — it did not compile cleanly before this lab (3 TypeScript errors):

  1. beds/beds.module.ts imported BedStatusChangeMiddleware from
     '../lodger.middleware', which does not export it. Fixed to import from
     './middleware/bed-status-change.middleware'.
  2. hospitals/hospitals.module.ts had the same wrong import for
     HospitalAccessMiddleware. Fixed the same way.
  3. ambulance.service.ts referenced AmbulanceStatus.CANCELLED, which was
     missing from the enum. Added it (every sibling status enum already has
     one) and completed the two exhaustive Record<AmbulanceStatus, ...> maps
     it cascaded into — the stats counter and the state-transition table. A
     trip can now be cancelled before pickup; once the patient is aboard it
     runs to completion.

FRONTEND — dead links and dead code:

  4. shared/nav.js linked to administrative_staff/reports.html, which was never
     built. Replaced with links to the pages that do exist.
  5. shared/nav.js linked to patient/appointments.html; the real path is
     patient/appointments/appointments.html.
  6. patient/appointments/appointments.html linked its sidebar brand to
     "dashboard.html", resolving inside the appointments/ folder. Now ../.
  7. auth/login.html and auth/staff-login.html still offered a "Doctor" role
     radio, but doctors are directory records and the backend refuses them
     (PROJECT_CONTEXT.md section 4). Removed, along with the doctor branches in
     shared/session.js and the orphaned front-end/doctor/ portal.
  8. Removed front-end/manager/ (superseded by hospital_manager/, nothing
     linked to it) and consolidated the two duplicate hospital-registration
     pages onto landing/hospital-registration.html, which is the one that
     sends the adminPhone field the backend requires.
  9. Removed the three orphaned book-appointment-step*.html pages — nothing
     outside them linked to them, they were superseded by the single-page
     wizard, and they referenced an app.js that does not exist.
 10. Removed committed build junk: back-end/.next/ (4 Next.js bundles from an
     abandoned experiment) and 4 stray tracked files under the gitignored
     back-end/dist/. Also removed patch_ambulance*.py, which operated on a
     clone path that no longer exists.

  Every relative href/src across all 47 remaining HTML pages now resolves.
  TEST_ACCOUNTS.md was rewritten — it claimed 12 seed accounts and 7 doctors
  when the seed file actually holds 45 users, 26 of them able to log in.


-------------------------------------------------------------------------------
 10. FILE LIST
-------------------------------------------------------------------------------

  Lab2-React/
    Readme.txt                     this file
    render-test.jsx                smoke test (npm test)
    package.json                   React 19 + Vite 8
    vite.config.js                 dev server + /api -> :3001 proxy
    index.html                     Vite entry point
    src/
      main.jsx                     React root
      App.jsx                      shared state + all callbacks   (370 lines)
      api.js                       API layer                      (270 lines)
      styles.css                   styling                        (278 lines)
      data/hospitals.js            offline catalogue              (821 lines)
      components/
        StepIndicator.jsx          progress bar
        BookingWizard.jsx          step router
        HospitalStep.jsx           step 0
        HospitalCard.jsx
        DepartmentStep.jsx         step 1
        DoctorDateStep.jsx         step 2
        DoctorCard.jsx
        SlotPicker.jsx
        DetailsStep.jsx            step 3
        Confirmation.jsx           step 4
        MyAppointments.jsx         appointment list
        AppointmentCard.jsx
        LoginPanel.jsx             patient sign-in

===============================================================================
