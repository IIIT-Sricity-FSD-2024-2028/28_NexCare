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
| Pre-Authorization     | Insurance approval process for cashless administrative cases             |
| Inventory Audit       | Periodic verification of non-clinical hospital resources                 |

---

## Actors and Responsibilities

(Actors aligned with the **non-clinical use case diagram**)

| Actor / Role         | Responsibilities                                                          |
| -------------------- | ------------------------------------------------------------------------- |
| Patient              | Books appointments, provides required documents, requests services        |
| Admin                | Overall coordination, approvals, monitoring workflows, policy enforcement |
| Administrative Staff | Front-office operations, appointment handling, SPOC communication         |
| Ambulance Staff      | Patient transport coordination and communication with admin/helpdesk      |

---

## Core Workflows

### Workflow 1: Non-Clinical Appointment Management

* **Trigger / Start Condition:** Patient books an online appointment or arrives as a walk-in
* **Steps Involved:**

  1. Appointment token generated through HMIS
  2. Patient details verified at the helpdesk
  3. Token called using a digital queue or display system
  4. No-show tokens are skipped automatically
  5. Walk-in patients are adjusted between available slots
* **Outcome / End Condition:** Appointment process completed and patient routed to the appropriate administrative stage

---

### Workflow 2: Ambulance Coordination (Administrative)

* **Trigger / Start Condition:** Emergency or transfer request received by helpdesk or SPOC
* **Steps Involved:**

  1. Request received and logged in the system
  2. Basic location and urgency details collected
  3. Ambulance type identified based on logistical needs
  4. Admin approval obtained and ambulance dispatched
  5. Receiving department or facility notified
* **Outcome / End Condition:** Ambulance dispatched and administrative handover completed

---

### Workflow 3: Referral and Transfer Management

* **Trigger / Start Condition:** Infrastructure unavailability or administrative transfer requirement
* **Steps Involved:**

  1. Non-clinical feasibility check (beds, rooms, equipment availability)
  2. Consent collected from patient or attendant
  3. Receiving hospital or facility contacted
  4. Transfer details recorded in the system
* **Outcome / End Condition:** Transfer completed with proper administrative closure

---

## Rules, Constraints, and Exceptions

### Mandatory Rules / Policies

* Emergency-related requests receive administrative priority
* Consent is mandatory before any transfer or referral
* Insurance pre-authorization is required for cashless processing

### Constraints / Limitations

* Dependency on infrastructure and resource availability
* Insurance policy and provider restrictions
* Vendor response time for maintenance and logistics

### Common Exceptions / Edge Cases

* Sudden walk-in emergencies
* Late arrivals for scheduled appointments
* Infrastructure or equipment breakdown during peak hours

### Situations Where Things Usually Go Wrong

* Delays in insurance approvals
* Miscommunication between administrative departments
* Patient dissatisfaction due to waiting times or lack of updates

---

## Current Challenges and Pain Points

* Delays in insurance processing due to documentation or policy mismatches
* Limited real-time visibility into infrastructure readiness
* Managing patient expectations during administrative delays
* Coordinating multiple non-clinical actors simultaneously

---

## Assumptions & Clarifications

### Confirmed Assumptions

* Core hospital administrative processes are partially digitized
* Human intervention remains essential in hospital administration

### Corrected Assumptions

* Full automation is not suitable for all administrative workflows

### Open Questions / Follow-ups

* Can insurance workflows be further streamlined using automation?
* Can vendor and maintenance status be integrated in real time into the system?
