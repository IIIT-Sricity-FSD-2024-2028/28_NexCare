# NexCare  
## Hospital Administrative Operations Platform (Non-Clinical)

---

## 1. Problem Statement

In many hospitals, everyday administrative operations remain slow and fragmented. Activities such as appointment scheduling, bed allocation, ambulance coordination, and inventory management are often handled through manual processes or disconnected systems. This results in long patient waiting times, poor inter-department coordination, and inefficient utilization of hospital resources.

**NexCare** addresses these challenges by consolidating all non-clinical hospital operations into a single centralized platform. It enables better coordination among staff, reduces operational delays, and improves overall efficiency—while ensuring that all decision-making authority remains with hospital personnel.

NexCare is delivered as a **multi-tenant product**, not as a single hospital's internal tool. Hospitals subscribe to it, doctors list their practice on it, and patients book through it — each pays for a different thing, and the platform's revenue model is built on all three. See §4.

---

## 2. Identified Actors

Seven login actors: **Patient**, **Doctor**, **Administrative Staff**, **Ambulance Staff**, **Hospital Manager**, **Regional Officer**, **Admin**. Nurses exist as directory records only — they have no portal.


### Patient

The patient is the primary service requester who interacts with the system to:
- Book appointments based on urgency  
- Request emergency ambulance services  
- View and pay hospital bills  
- Submit feedback or complaints  

---

### Administrative Staff 

Administrative staff manage internal hospital operations and resources. Their responsibilities include:
- Processing and managing patient requests
- Allocating beds, wards, and non-clinical resources
- Managing inventory, assets, and staff schedules
- Updating operational statuses in real time

---

### Ambulance Staff 

Ambulance staff are responsible for emergency response and patient transport operations, including:
- Receiving and responding to ambulance dispatch requests
- Updating ambulance availability and location status
- Recording pickup, transfer, and drop-off events
- Coordinating with administrative staff during emergencies

---

### Doctor

Doctors are practitioners listed on the platform. Their portal is administrative, never clinical — NexCare never touches diagnosis, treatment or medical records. A doctor:
- Sees the appointments booked with them, and confirms or completes each one
- Manages their own schedule and requests leave (their hospital manager approves it)
- Sets their consultation fee and chooses a listing tier
- Reviews their earnings and what the platform charged them

---

### Hospital Manager

Runs one hospital: its staff roster, leave approvals, support escalations, and that hospital's own collections against what it owes NexCare.

---

### Regional Officer

Oversees a set of hospitals in an assigned area. Performs due diligence on new hospital registrations, triages support requests, and compares operational performance across the hospitals under them — **and only those**. A regional officer cannot see another officer's region.

---

### Admin 

The admin oversees the overall platform and hospital operations, with responsibilities including:
- Monitoring operational performance  
- Reviewing system activity and audit logs  
- Managing reports and system configurations  
- Setting platform pricing across all three payer types
- Viewing the full organisational hierarchy: every region, hospital and staff account

---

## 2A. Visibility scope

Every oversight role sees **its own node and everything below it — nothing above it, nothing beside it.**

```
Platform            Admin (superuser)
  └── Region        Regional Officer — the hospitals in their area
        └── Hospital        Hospital Manager
              └── Department
                    └── Administrative staff · Doctors · Ambulance crew
```

This is enforced server-side, not merely displayed: `GET /api/hierarchy` returns the caller's subtree computed from their token — there is no route that asks for somebody else's — and `GET /api/hierarchy/scope` returns the machine-readable scope the portals render. Revenue, user and hospital reads are filtered against the same rule.

---

## 2B. Revenue model — how NexCare makes money

Seven streams, three payers. Nothing is stored pre-aggregated, and **hospital subscriptions were deliberately removed** — a subscription is *declared*, not *earned*, so it cannot be demonstrated or tested. Everything below is triggered by a real event.

| # | Stream | Payer | Type | Charged on |
|---|---|---|---|---|
| 1 | Commission on collections | Hospital | usage | A share of what the hospital collected through NexCare |
| 2 | Payment processing | Hospital | usage | A percentage of every payment taken through the gateway |
| 3 | Doctor listing subscription | Doctor | recurring | Monthly fee for the Verified and Featured tiers |
| 4 | Commission on consultations | Doctor | usage | A share of each consultation fee, only when the appointment completes |
| 5 | Care+ membership | Patient | recurring | Monthly membership that waives booking fees |
| 6 | Booking convenience fee | Patient | usage | Per appointment booked, waived for Care+ members |
| 7 | Ambulance dispatch fee | Patient | usage | Per completed dispatch, discounted for Care+ members |

**Hospitals pay only on what they collect.** No licence, no base fee, no per-bed charge — a hospital that collects nothing owes nothing.

**The doctor ladder is inverted on purpose.** Practice Free costs nothing but takes 12% of each consultation; Practice Featured costs ₹2,499/month and takes 5%. A busy consultant saves money by upgrading, so nobody is coerced — and NexCare earns from every practitioner either way. The doctor's own Earnings page computes what each tier would cost *them* at *their* volume and recommends the cheaper one.

**Patients pay for convenience, never for care.** Hospital bills belong to the hospital and are never counted as platform revenue.

Every rate is repriced at runtime by the Admin at `front-end/superuser/revenue.html`.

---

## 2C. Payments — how the revenue model is actually tested

Because every rupee is now transactional, the payment path *is* the revenue model. NexCare ships a **simulated payment gateway** (`back-end/src/payments/`) that behaves like a processor's test mode: the outcome is chosen by the card number, so approvals and declines can both be demonstrated on demand.

| Card | Outcome |
|---|---|
| `4242 4242 4242 4242` | approved |
| `4000 0000 0000 0002` | declined |
| `4000 0000 0000 0069` | expired card |

No real card is accepted, contacted or stored — only the last four digits are retained.

When a payment is **approved**, the bill is settled and the fees NexCare earned are written to a **platform ledger** (`platform-transactions.json`) with the rate stored on each row. When it is **declined**, the bill stays outstanding and the platform earns nothing. Recording the fee at the moment it is charged means repricing changes what happens next rather than silently restating last month.

Run the suite with `npx jest` in `back-end/` — 8 suites, 51 tests, including an end-to-end that takes one card payment and asserts the dashboard moves by exactly the right amount.

---

## 3. Planned Features

### Patient Features

#### Priority-Based Appointment Booking
Patients can request appointments that are automatically prioritized using a triage mechanism. Each request generates a unique EMR token for tracking and reference.

#### Emergency Ambulance Requests
Patients can submit emergency requests with location details, allowing the system to identify and dispatch the nearest available ambulance using GPS integration.

#### Bill Viewing and Online Payments
Patients can access itemized billing information and complete secure online payments through an integrated payment gateway.

#### Feedback and Complaint Management
Patients can submit feedback or complaints, each assigned a unique reference ID for tracking and automated routing to the appropriate department.

---
### Administrative Staff Features

#### Appointment and Request Management
Review and process patient appointment requests
Handle escalations from triage-based prioritization

#### Bed, Ward, and Resource Allocation
Maintain real-time bed and ward occupancy
Prevent double allocation of hospital resources
Support efficient capacity planning

#### Inventory and Asset Management
Administrative staff can manage hospital assets and consumables with automated alerts for:
Low stock levels
Asset maintenance or replacement needs

#### Staff Shift and Availability Management
Manage duty rosters and leave schedules
Detect staffing conflicts or understaffed shifts in advance

---

### Ambulance Staff Features

#### Ambulance Dispatch Management
Receive emergency dispatch requests
Accept or acknowledge assigned trips

#### Real-Time Location and Availability Updates
Update ambulance availability status
Share live location data for routing and coordination

#### Emergency Transport Tracking
Record pickup time, transport progress, and patient drop-off
Notify administrative staff upon patient arrival

---

### Admin Features

#### Centralized Operations Dashboard
Provides a consolidated, real-time view of key operational metrics such as bed occupancy, staff availability, and ambulance deployment.

#### Reporting and Analytics
Enables generation of scheduled or on-demand reports with configurable filters based on department, date range, and operational metrics.

#### System Audit Trails
Maintains a detailed log of all user actions across the platform to support compliance, accountability, and security audits.

---
