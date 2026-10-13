# NexCare — Team Work Split and Re-commit Plan

All of the React front end, and the backend and doc fixes that went with it, were
committed by one account (Vivian545) on 2026-09-22, in five commits:

| Commit | What it holds |
|---|---|
| `f797213` | fix(backend): scope inventory and feedback per hospital, unblock support tickets |
| `d9612a2` | feat(frontend): the React SPA for all seven portals (added as `front-end-react/`) |
| `4894b28` | fix(backend): five defects from the post-migration audit |
| `30df803` | refactor(frontend)!: delete the static HTML portals, move `front-end-react/` → `front-end/` |
| `78b2980` | docs: rewrite for the React front end |

We will **revert those five commits** and then **re-commit the exact same files**,
each person from their own GitHub account, so the history shows who owns what.

**Nobody rewrites code.** Every file is restored byte-for-byte from a snapshot tag,
`nexcare-react-final`. When the last step is done, the repo is identical to
today's `main`.

---

## 1. Who owns what

| Person | Portal(s) | Shared work they also commit | Approx. JS/JSX lines |
|---|---|---|---|
| **Vivian** | Patient | Patient-only features: doctor directory, invoice, card payments | ~4,300 |
| **Nikitha** | Doctor, Administrative Staff | Doctor-only feature: appointment actions / modals | ~4,100 |
| **Poornasri** | Hospital Manager, Ambulance | Ambulance-only feature: transport steps / ETA | ~4,000 |
| **Deekshita** | Superuser | Layout shell (header, sidebar, nav, logo, icons), hierarchy view, activity log, landing page, global styles | ~4,200 |
| **Poorvishree** | Regional Officer | Project setup, API client, auth/toast context, utils, UI kit, hooks, auth pages, hospital registration page, router (`App.jsx`, `main.jsx`) | ~4,200 |

Shared code went to Deekshita and Poorvishree because their portals are the
smallest (Superuser ~2,500 lines, Regional Officer ~1,600 lines; each of the others
has 3,500+). When a shared module is used by only one portal (for example
`features/invoice`, which only Patient uses), the owner of that portal commits it.

The backend fixes and docs are split by area too (§5 and §6).

---

## 2. Order of work

Shared code has to land before the portals that import it. Each round must be
**merged into `main` before the next round starts**. Inside a round, people can
work in parallel because nobody touches the same file.

| Round | Who | What |
|---|---|---|
| 0 | Vivian | Tag the snapshot, revert the five commits, commit this file |
| 1 | Poorvishree | Foundation: project setup, API, context, utils, UI kit, hooks |
| 2 | Deekshita | Layout shell, shared features, global styles |
| 3 | Everyone (parallel) | Portals + the pages and styles that belong to them |
| 4 | Poorvishree | Router: `main.jsx` + `App.jsx`, then check that `npm run build` passes |
| any time after 0 | Each person | Their backend fix commit (§5) |
| 5 | Deekshita, Nikitha, Poornasri, then **Vivian last** | Docs (§6) |

`npm run build` will fail between Round 1 and Round 4. That is expected: until
`App.jsx` is back, nothing imports the portals. Do not "fix" it by editing files.

---

## 3. Rules for every commit

1. **Use your own GitHub identity.** Before your first commit, run:
   ```bash
   git config user.name    # must be your name
   git config user.email   # must be an email verified on YOUR GitHub account
   ```
   If the email is not on your GitHub account, the commit will not count as yours.
   To set it for this repo only: `git config user.email you@example.com`.
2. **Restore files only from the tag.** Do not copy them from someone's machine.
   Do not edit, reformat or "improve" them during this process. Use
   `git checkout nexcare-react-final -- <paths>`.
3. **Commit only the paths listed for you.** Check with `git status` before committing.
4. **Work on your own branch and open a PR into `main`.** Merge with
   *Create a merge commit* or *Rebase and merge* so your authorship is kept.
5. **Start every round from the latest `main`:**
   ```bash
   git fetch origin --tags
   git checkout main && git pull
   git checkout -b <yourname>/<what>
   ```

Every per-person block below follows this pattern:

```bash
git checkout nexcare-react-final -- <paths to restore>
git rm -r -q <old HTML folders to delete>     # only where listed
git status                                    # only your paths should appear
git commit -m "<message>"
git push -u origin <yourname>/<what>          # then open the PR
```

---

## 4. Step-by-step

### Round 0 — Vivian (snapshot + revert)

```bash
git checkout main && git pull

# 1. Snapshot the finished state so everyone can restore from it
git tag nexcare-react-final 78b2980
git push origin nexcare-react-final

# 2. Park the uncommitted edits (U004 password reset, new ownership note).
#    They are re-applied in Round 5.
git stash push -m "pre-revert edits" -- ACTOR_CREDENTIALS.md PROJECT_CONTEXT.md back-end/data/users.json back-end/data/system-activity.json

# 3. Revert all five commits in one commit
git revert --no-commit a4afa10..78b2980
git commit -m "revert: undo the 2026-09-22 commits so each member can re-commit their own part"

# 4. Add this plan
git add TEAM_WORK_SPLIT.md
git commit -m "docs: add the team work split and re-commit plan"
git push
```

After this, `front-end/` holds the old static HTML portals again and the React
app is gone. `git show nexcare-react-final:front-end/src/App.jsx` should still
print the router. If it does, the snapshot is safe.

> A revert keeps the original five commits in history, followed by a commit
> that undoes them. Everyone's re-commits come after that. The other way is to
> reset `main` to `a4afa10` and force-push. That removes the originals, but it
> rewrites shared history and every member would have to re-clone. Only do it if
> the whole team agrees.

---

### Round 1 — Poorvishree (foundation)

Branch: `poorvishree/frontend-foundation`

```bash
git checkout nexcare-react-final -- \
  .gitignore \
  front-end/package.json front-end/package-lock.json front-end/vite.config.js \
  front-end/index.html front-end/.gitignore front-end/README.md \
  front-end/src/api \
  front-end/src/context \
  front-end/src/utils \
  front-end/src/components/RequireAuth.jsx \
  front-end/src/components/ui \
  front-end/src/hooks \
  front-end/src/assets \
  front-end/src/styles/portal.css front-end/src/styles/app.css

git rm -r -q front-end/shared front-end/assets front-end/logo.js front-end/jsconfig.json \
  front-end/debug.html front-end/frontend_log.txt front-end/serve_err.txt front-end/serve_out.txt

git commit -m "feat(frontend): set up the Vite + React project, API client, auth context and UI kit"
```

| Path | What it is |
|---|---|
| `package.json`, `package-lock.json`, `vite.config.js`, `index.html`, `.gitignore`, `README.md` | Vite + React 18 project setup |
| `src/api/client.js`, `index.js`, `links.js` | Fetch wrapper with the JWT, every backend endpoint, cross-portal links |
| `src/context/AuthContext.jsx`, `ToastContext.jsx` | Login session and toast notifications |
| `src/utils/format.js`, `jwt.js`, `roles.js` | Date/currency formatting, token decoding, role → home route |
| `src/components/RequireAuth.jsx` | Route guard |
| `src/components/ui/index.jsx`, `Dialogs.jsx` | Shared cards/badges/tables and the confirm/prompt dialogs |
| `src/hooks/useConfirm.jsx`, `usePolling.js`, `useStylesheet.js` | Shared hooks |
| `src/assets/wave-image.png`, `src/styles/portal.css`, `app.css` | Shared portal styles |
| root `.gitignore` | Adds `front-end/dist/` |

---

### Round 2 — Deekshita (layout shell + shared features)

Branch: `deekshita/frontend-shell`

```bash
git checkout nexcare-react-final -- \
  front-end/src/components/layout \
  front-end/src/components/icons.jsx \
  front-end/src/components/NexCareLogo.jsx \
  front-end/src/features/hierarchy \
  front-end/src/features/activity \
  front-end/src/styles/global.css front-end/src/styles/nav.css

git commit -m "feat(frontend): add the shared portal layout, navigation, hierarchy view and activity log"
```

| Path | What it is |
|---|---|
| `components/layout/Header.jsx`, `Sidebar.jsx`, `PortalLayout.jsx`, `BackButton.jsx`, `NotificationBell.jsx`, `navigation.js` | The header + sidebar shell that Doctor, Regional Officer and Superuser use |
| `components/icons.jsx`, `NexCareLogo.jsx` | Icon set and logo used on every page |
| `features/hierarchy/HierarchyView.jsx`, `hierarchy.css` | Region → hospital → staff tree (Regional Officer + Superuser) |
| `features/activity/logActivity.js` | System activity logging (Staff + Superuser) |
| `styles/global.css`, `nav.css` | Global and navigation styles |

---

### Round 3 — everyone, in parallel

Each bullet below is **one commit / one PR**. Do them in any order.

#### Vivian — Patient

Branch: `vivian/patient-portal`

```bash
git checkout nexcare-react-final -- \
  front-end/src/portals/patient \
  front-end/src/features/doctor-directory \
  front-end/src/features/invoice \
  front-end/src/features/payments \
  front-end/src/styles/patient.css front-end/src/styles/membership.css
git rm -r -q front-end/patient
git commit -m "feat(patient): port the patient portal to React"
```

This covers the dashboard, booking wizard, appointments, billing with card
payments and the invoice PDF, ambulance request, hospital search, membership
(Care+), feedback and profile.

#### Nikitha — Doctor

Branch: `nikitha/doctor-portal`

```bash
git checkout nexcare-react-final -- \
  front-end/src/portals/doctor \
  front-end/src/features/appointments
git rm -r -q front-end/doctor
git commit -m "feat(doctor): port the doctor portal to React"
```

#### Nikitha — Administrative Staff

Branch: `nikitha/staff-portal`

```bash
git checkout nexcare-react-final -- \
  front-end/src/portals/staff \
  front-end/src/styles/staff.css
git rm -r -q front-end/administrative_staff
git commit -m "feat(staff): port the administrative staff portal to React"
```

#### Poornasri — Hospital Manager

Branch: `poornasri/hospital-manager-portal`

```bash
git checkout nexcare-react-final -- \
  front-end/src/portals/hospital-manager \
  front-end/src/styles/hospital-manager.css
git rm -r -q front-end/hospital_manager
git commit -m "feat(hospital-manager): port the hospital manager dashboard to React"
```

#### Poornasri — Ambulance

Branch: `poornasri/ambulance-portal`

```bash
git checkout nexcare-react-final -- \
  front-end/src/portals/ambulance \
  front-end/src/features/ambulance \
  front-end/src/styles/ambulance.css
git rm -r -q front-end/ambulance
git commit -m "feat(ambulance): port the ambulance portal to React"
```

#### Deekshita — Superuser

Branch: `deekshita/superuser-portal`

```bash
git checkout nexcare-react-final -- \
  front-end/src/portals/superuser \
  front-end/src/styles/superuser.css
git rm -r -q front-end/superuser
git commit -m "feat(superuser): port the superuser portal to React"
```

#### Deekshita — Public landing page

Branch: `deekshita/landing-page`

```bash
git checkout nexcare-react-final -- \
  front-end/src/portals/public/LandingPage.jsx \
  front-end/src/portals/public/useLandingEffects.js \
  front-end/src/styles/landing.css
git rm -r -q front-end/landing
git commit -m "feat(public): port the landing page to React"
```

#### Poorvishree — Regional Officer

Branch: `poorvishree/regional-officer-portal`

```bash
git checkout nexcare-react-final -- \
  front-end/src/portals/regional-officer \
  front-end/src/styles/regional-officer.css \
  front-end/src/styles/regional-console.css \
  front-end/src/styles/regional-details.css
git rm -r -q front-end/regional-officer
git commit -m "feat(regional-officer): port the regional officer portal to React"
```

#### Poorvishree — Auth pages + hospital registration

Branch: `poorvishree/auth-pages`

```bash
git checkout nexcare-react-final -- \
  front-end/src/portals/auth \
  front-end/src/portals/public/HospitalRegistrationPage.jsx \
  front-end/src/styles/auth.css \
  front-end/src/styles/forgot-password.css \
  front-end/src/styles/hospital-registration.css
git rm -r -q front-end/auth front-end/hospital-registration
git commit -m "feat(auth): port login, registration, password pages and hospital registration to React"
```

---

### Round 4 — Poorvishree (router)

Start this only after **every** Round 3 PR is merged.

Branch: `poorvishree/router`

```bash
git checkout nexcare-react-final -- front-end/src/main.jsx front-end/src/App.jsx
git commit -m "feat(frontend): wire every portal into the router"

cd front-end && npm install && npm run build   # must succeed
```

At this point `front-end/` should match the snapshot exactly:

```bash
git diff --stat nexcare-react-final -- front-end/    # must print nothing
```

If it prints anything, someone missed a path or restored an extra one. Compare
against the lists above.

---

## 5. Backend fixes (any time after Round 0)

These are the 13 backend files from `f797213` and `4894b28`, grouped by the area
each person owns. Each person makes one commit.

| Person | Branch | Paths | Commit message |
|---|---|---|---|
| Vivian | `vivian/backend-patients` | `back-end/src/patients/patients.service.ts` | `fix(patients): save renames by mapping fullName onto name` |
| Nikitha | `nikitha/backend-beds-leaves` | `back-end/src/beds/beds.service.ts` `back-end/src/leaves/leaves.controller.ts` | `fix(beds,leaves): correct the bed capacity message; stamp the doctor's hospital on new leaves` |
| Poornasri | `poornasri/backend-hospital-scope` | `back-end/src/feedback/feedback.controller.ts` `back-end/src/support-requests/support-requests.controller.ts` `back-end/src/inventory/inventory.controller.ts` `back-end/src/inventory/inventory.service.ts` `back-end/src/inventory/interfaces/inventory.interface.ts` | `fix(backend): scope inventory and feedback per hospital, unblock support tickets` |
| Deekshita | `deekshita/backend-system` | `back-end/src/system/system.controller.ts` `back-end/src/system/system.service.ts` `back-end/docs/swagger.json` | `fix(system): return real metrics from /system/performance; regenerate swagger.json` |
| Poorvishree | `poorvishree/backend-auth` | `back-end/src/auth/auth.service.ts` `back-end/src/auth/interfaces/auth.interface.ts` | `fix(auth): unique patient IDs on registration; return ambulance crew profile on login` |

```bash
git checkout nexcare-react-final -- <your paths>
git commit -m "<message>"
```

Once all five are merged, run `cd back-end && npx jest`. All 10 suites must pass,
and `git diff --stat nexcare-react-final -- back-end/` must print nothing.

---

## 6. Docs (Round 5, after Round 4)

| Person | Paths |
|---|---|
| Deekshita | `ACTOR_CREDENTIALS.md` `DEMO_TEST_CREDENTIALS.md` `LOGIN_CREDENTIALS.md` `TEST_ACCOUNTS.md` |
| Nikitha | `MANUAL_TESTING_CHECKLIST.md` |
| Poornasri | `VERIFICATION.md` |
| **Vivian (last)** | `README.md` `PROJECT_CONTEXT.md` `plan.md` `progress.md` |

Vivian's docs commit goes last, after everyone else's docs are merged:

```bash
git checkout nexcare-react-final -- README.md PROJECT_CONTEXT.md plan.md progress.md
git commit -m "docs: rewrite for the React front end and the current seed"

# Re-apply the edits parked in Round 0 (U004 reset, ownership note)
git stash pop
git add ACTOR_CREDENTIALS.md PROJECT_CONTEXT.md back-end/data/users.json
git checkout -- back-end/data/system-activity.json   # runtime log, not worth committing
git commit -m "docs: record the team split; reset U004's password"
```

Final check:

```bash
git diff --stat nexcare-react-final -- . ':!TEAM_WORK_SPLIT.md'
```

The only differences should be the three files from the stash.

---

## 7. Checklist

- [ ] R0 Vivian: tag pushed, revert merged, this file committed
- [ ] R1 Poorvishree: foundation
- [ ] R2 Deekshita: layout shell + shared features
- [ ] R3 Vivian: patient
- [ ] R3 Nikitha: doctor
- [ ] R3 Nikitha: staff
- [ ] R3 Poornasri: hospital manager
- [ ] R3 Poornasri: ambulance
- [ ] R3 Deekshita: superuser
- [ ] R3 Deekshita: landing page
- [ ] R3 Poorvishree: regional officer
- [ ] R3 Poorvishree: auth pages + hospital registration
- [ ] R4 Poorvishree: router, `npm run build` passes, `front-end/` diff empty
- [ ] Backend: Vivian · Nikitha · Poornasri · Deekshita · Poorvishree, `npx jest` passes
- [ ] R5 docs: Deekshita · Nikitha · Poornasri · Vivian (last)
