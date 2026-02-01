# Summary of the Interaction

## Basic Information

* **Domain:** Healthcare – Hospital Administrative Operations (Non-Clinical Platform)
* **Problem Statement:** Understanding real-world hospital workflows from a clinical expert’s perspective to design a strictly non-clinical, full-stack hospital administrative operations platform.
* **Date of Interaction:** 31-1-12
* **Mode of Interaction:** Video call (recorded domain expert interaction)
* **Duration (in minutes):** 37 minutes
* **Publicly Accessible Video Link:** https://drive.google.com/drive/u/0/folders/1pxoPQ9ggXqRKsaUnORZCpJNAg6-4CYuM

---

## Domain Expert Details

* **Role / Designation:** Clinical Educator (Domain Expert)
* **Experience in the Domain:**

  * Over 35 years of experience in hospital clinical environments.
  * Currently involved in training and supervising nursing students, front-office staff, housekeeping, security, and support staff.
  * Acts as a bridge between clinical operations and administrative coordination.
* **Nature of Work:** Operational oversight, Administrative coordination, Training and supervision

> **Note:** Although the expert has a clinical background, inputs were intentionally mapped only to *non-clinical administrative workflows* for this platform.

---

## Domain Context and Terminology

### Purpose of the Problem Statement in Daily Work

The purpose of this problem statement is to digitally support and streamline hospital administrative processes such as appointments, ambulance coordination, staff scheduling, insurance handling, referrals, and infrastructure management—without interfering with clinical decision-making or treatment.

### Primary Goals / Outcomes

* Improve coordination between administrative roles.
* Reduce operational delays in non-clinical workflows.
* Maintain transparency and traceability of administrative actions.
* Support patient experience through efficient administration.

### Key Terms and Definitions

| Term                  | Meaning as explained by the expert                                        |
| --------------------- | ------------------------------------------------------------------------- |
| HMIS                  | Hospital Management Information System used for administrative operations |
| Appointment Token     | Digital queue number assigned for OPD appointments                        |
| SPOC                  | Single Point of Contact for emergency and inter-hospital coordination     |
| Administrative Triage | Non-clinical prioritization of patients based on urgency                  |
| Bed Blocking          | Temporarily marking a room unavailable due to maintenance                 |
| Referral Coordination | Administrative process of transferring patients to another hospital       |
| Pre-Authorization     | Approval process for insurance-based cashless treatment                   |
| Inventory Audit       | Periodic check of non-clinical hospital resources                         |

---

## Actors and Responsibilities

(Actors aligned with the **non-clinical use case diagram**)

| Actor / Role         | Responsibilities                                                          |
| ------------------   | ------------------------------------------------------------------------- |
| Patient              | Books appointments, provides documents, requests services, gives consent  |
| Admin                | Overall coordination, approvals, monitoring workflows, policy enforcement |
| Administrative Staff | Front-office operations, appointment handling, SPOC communication         |
| Ambulance Staff      | Patient transport, coordination with admin and helpdesk                   |

---

## Core Workflows

### Workflow 1: Non-Clinical Appointment Management

* **Trigger / Start Condition:** Patient books an online appointment or walks in
* **Steps Involved:**

  1. Appointment token generated via HMIS
  2. Patient details verified at helpdesk
  3. Token called using digital/buzzer system
  4. No-show tokens are skipped
  5. Walk-in patients are adjusted between slots
* **Outcome / End Condition:** Patient successfully routed to consultation or emergency

### Workflow 2: Ambulance Coordination (Administrative)

* **Trigger / Start Condition:** Emergency or transfer request received by helpdesk/SPOC
* **Steps Involved:**

  1. Call received and logged
  2. Basic condition and location details collected
  3. Ambulance type identified (normal / advanced)
  4. Admin approves and dispatches ambulance
  5. Receiving department is informed
* **Outcome / End Condition:** Ambulance dispatched and patient handover completed

### Workflow 3: Referral and Transfer Management

* **Trigger / Start Condition:** Infrastructure unavailability or patient transfer need
* **Steps Involved:**

  1. Non-clinical feasibility check (beds, equipment)
  2. Consent collected from patient/attendant
  3. Receiving hospital contacted
  4. Transfer details documented in system
* **Outcome / End Condition:** Patient safely referred with administrative closure

---

## Rules, Constraints, and Exceptions

* **Mandatory Rules / Policies:**

  * Emergency cases receive administrative priority
  * Consent is mandatory before transfers
  * Insurance pre-authorization required for cashless cases

* **Constraints / Limitations:**

  * Dependency on infrastructure availability
  * Insurance policy restrictions
  * Vendor response time for maintenance

* **Common Exceptions / Edge Cases:**

  * Sudden walk-in emergencies
  * Late arrival for scheduled appointments
  * Equipment breakdown during peak hours

* **Situations Where Things Usually Go Wrong:**

  * Insurance approval delays
  * Miscommunication between departments
  * Patient dissatisfaction due to administrative waiting

---

## Current Challenges and Pain Points

* Delay in insurance approvals due to tariff mismatches
* Difficulty tracking infrastructure readiness in real time
* Managing patient expectations during delays
* Coordinating multiple non-clinical actors simultaneously

---

## Assumptions & Clarifications

* **Confirmed Assumptions:**

  * Core hospital administration is already partially digitized
  * Human interaction remains essential in healthcare administration

* **Corrected Assumptions:**

  * Full automation is not suitable for all hospital workflows

* **Open Questions / Follow-ups:**

  * Can insurance workflows be partially automated?
  * Can vendor maintenance status be integrated in real time?
