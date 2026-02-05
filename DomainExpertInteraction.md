# Summary of the Interaction

## Basic Information

* **Domain:** Healthcare – Hospital Administrative Operations (Non-Clinical Platform)
* **Problem Statement:** Understanding real-world hospital administrative workflows from an expert’s perspective to design a strictly non-clinical, full-stack hospital administrative operations platform.
* **Date of Interaction:** 31-1-26
* **Mode of Interaction:** Video call (recorded domain expert interaction)
* **Duration (in minutes):** 37 minutes
* **Publicly Accessible Video Link:** [https://drive.google.com/drive/u/0/folders/1pxoPQ9ggXqRKsaUnORZCpJNAg6-4CYuM](https://drive.google.com/drive/u/0/folders/1pxoPQ9ggXqRKsaUnORZCpJNAg6-4CYuM)

---

## Domain Expert Details

* **Role / Designation:** Hospital Operations & Administrative Expert
* **Experience in the Domain:**

  * Over 35 years of experience in hospital operational and administrative environments.
  * Extensive involvement in supervising and coordinating front-office staff, housekeeping, security, ambulance coordination teams, and support services.
  * Acts as a key liaison between different hospital departments to ensure smooth administrative functioning.
* **Nature of Work:** Operational oversight, administrative coordination, workflow optimization, staff supervision

---

## Domain Context and Terminology

### Purpose of the Problem Statement in Daily Work

The purpose of this problem statement is to digitally support and streamline hospital administrative processes such as appointment management, ambulance coordination, staff scheduling, insurance handling, referrals, and infrastructure management—without involving or influencing any clinical decision-making or medical treatment activities.

### Primary Goals / Outcomes

* Improve coordination between administrative roles.
* Reduce operational delays in non-clinical workflows.
* Maintain transparency and traceability of administrative actions.
* Enhance patient experience through efficient administrative processes.

### Key Terms and Definitions

| Term                  | Meaning in an Administrative Context                                     |
| --------------------- | ------------------------------------------------------------------------ |
| HMIS                  | Hospital Management Information System used for administrative functions |
| Appointment Token     | Digital queue number assigned during appointment booking                 |
| SPOC                  | Single Point of Contact for emergency and transfer coordination          |
| Administrative Triage | Non-clinical prioritization based on urgency and logistics               |
| Bed Blocking          | Temporarily marking a room unavailable due to maintenance or cleaning    |
| Referral Coordination | Administrative handling of patient transfers between hospitals           |
| Inventory Audit       | Periodic verification of non-clinical hospital resources                 |

---

## Actors and Responsibilities

(Actors aligned with the **non-clinical use case diagram**)

| Actor / Role         | Responsibilities |
|----------------------|------------------|
| Patient              | Books appointments, requests services, provides feedback |
| Admin                | Overall coordination, approvals, monitoring workflows |
| Administrative Staff | Front-office operations, appointment handling, coordination |
| Ambulance Staff      | Patient transport and status updates |

---

## Core Workflows

### Workflow 1: Appointment & Queue Management

* **Trigger / Start Condition:** Patient books an online appointment or walks in
* **Steps Involved:**
  1. Appointment token generated via HMIS
  2. Patient details verified at helpdesk
  3. Token called using digital queue system
  4. No-show tokens are skipped
  5. Walk-in patients are adjusted between slots
* **Outcome / End Condition:** Patient successfully routed for consultation

### Workflow 2: Ambulance Coordination (Administrative)

* **Trigger / Start Condition:** Emergency or transfer request received by helpdesk
* **Steps Involved:**
  1. Request received and logged in the system
  2. Location and basic details collected
  3. Ambulance type identified
  4. Admin approves and dispatches ambulance
  5. Receiving department is informed
* **Outcome / End Condition:** Ambulance dispatched and handover completed

### Workflow 3: Referral and Transfer Management

* **Trigger / Start Condition:** Infrastructure unavailability or transfer requirement
* **Steps Involved:**
  1. Non-clinical feasibility check (beds, equipment)
  2. Consent collected from patient/attendant
  3. Receiving hospital contacted
  4. Transfer details recorded in the system
* **Outcome / End Condition:** Administrative transfer process completed

---

## Rules, Constraints, and Exceptions

### Mandatory Rules / Policies

* Emergency cases receive administrative priority
* Consent is mandatory before transfers
* All billing actions must be logged and auditable

### Constraints / Limitations

* Dependency on infrastructure availability
* Vendor response time for maintenance
* Peak-hour operational load

### Common Exceptions / Edge Cases

* Sudden walk-in emergencies
* Late arrival for scheduled appointments
* Equipment breakdown during peak hours

### Situations Where Things Usually Go Wrong

* Miscommunication between administrative departments
* Delays during peak operational hours
* Patient dissatisfaction due to waiting times or lack of updates

---

## Current Challenges and Pain Points

* Difficulty tracking infrastructure readiness in real time
* Managing patient expectations during delays
* Coordinating multiple non-clinical actors simultaneously

---

## Assumptions & Clarifications

### Confirmed Assumptions

* Core hospital administration is already partially digitized
* Human intervention remains essential in hospital administration

### Corrected Assumptions

* Full automation is not suitable for all administrative workflows

### Open Questions / Follow-ups

* Can infrastructure and vendor maintenance status be integrated in real time?
* Can feedback resolution timelines be better visualized in dashboards?
