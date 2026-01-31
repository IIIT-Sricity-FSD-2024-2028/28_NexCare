# Summary of the Interaction

## Basic Information
- **Domain:** Healthcare – Hospital Administrative Operations (Non-Clinical)
- **Problem Statement:** Design and development of a full-stack Hospital Administrative Operations Platform focusing strictly on non-clinical workflows.
- **Date of Interaction:** 31/1/26
- **Mode of Interaction:** Video call (recorded)
- **Duration (in minutes):** 37 minutes
- **Publicly Accessible Video Link:** https://drive.google.com/drive/folders/1pxoPQ9ggXqRKsaUnORZCpJNAg6-4CYuM

---

## Domain Expert Details
- **Role / Designation:** Senior Clinical Educator
- **Experience in the Domain:**
  - 35 years of experience in clinical work.
  - Currently responsible for training and educating nursing students, security staff, housekeeping staff, and front office desk personnel.
  - Conducts onboarding sessions for newly joining staff.
- **Nature of Work:** Administrative, Operational, Educator, Team Lead

---

## Domain Context and Terminology

### Purpose of the Problem Statement in Daily Work
The problem statement supports smooth, efficient, and organized hospital administrative operations such as patient appointments, ambulance coordination, staff scheduling, billing, insurance processing, inventory management, and inter-hospital communication, without interfering with direct clinical care.

### Primary Goals / Outcomes
- Ensure timely patient handling and administrative decision-making.
- Minimize operational delays and confusion.
- Maintain accurate records through electronic systems.
- Provide humane, patient-centric administrative support.

### Key Terms and Definitions

| Term | Meaning as explained by the expert |
|---|---|
| HMIS | Hospital Management Information System used for paperless operations |
| EMR | Electronic Medical Registration system for patient appointments and records |
| SPOC | Single Point of Contact, usually in the emergency department |
| AMC | Annual Maintenance Contract for biomedical equipment |
| CMC | Complete Maintenance Care for medical machinery |
| Pre-authorization | Insurance approval required before cashless treatment |
| Token System | Appointment queue system used to call patients |
| CPR Ambulance | Ambulance equipped with CPR team and advanced support |

---

## Actors and Responsibilities

| Actor / Role | Responsibilities |
|---|---|
| Patient | Books appointments, seeks treatment, provides documents and consent |
| Front Office / Receptionist | Appointment handling, patient registration, SPOC communication |
| Admin / SPOC | Coordinates ambulance, referrals, emergency communication |
| Ambulance Staff | Patient transport, emergency response, inter-hospital transfers |
| Nursing Staff | Assist during ambulance transport and emergency care |
| Insurance Department | Pre-authorization, cashless approvals, reimbursement support |
| Biomedical / Maintenance Team | Equipment maintenance, bed and infrastructure readiness |

---

## Core Workflows

### Workflow 1: Ambulance Request and Dispatch
- **Trigger / Start Condition:** Emergency call requesting an ambulance
- **Steps Involved:**
  1. Receive call from customer/bystander
  2. Collect patient condition (conscious/unconscious)
  3. Decide type of ambulance (normal or CPR)
  4. Collect location, patient details, and contact number
  5. Dispatch ambulance within 5 minutes
  6. Prepare hospital bed and treatment in advance
- **Outcome / End Condition:** Patient safely transported and admitted

### Workflow 2: Patient Appointment and OPD Management
- **Trigger / Start Condition:** Patient books online appointment or walks in
- **Steps Involved:**
  1. Token issued through EMR
  2. Patient called via buzzer system
  3. Late or absent patients are skipped
  4. Walk-ins adjusted between scheduled appointments
- **Outcome / End Condition:** Patient consultation completed

### Workflow 3: Staff Scheduling and Emergency Leave
- **Trigger / Start Condition:** Monthly planning or emergency leave request
- **Steps Involved:**
  1. Staff duties planned monthly
  2. Leave requests noted in leave book
  3. Emergency leave communicated via message
  4. Previous shift staff continues duty
  5. Duty adjusted the following day
- **Outcome / End Condition:** Shift coverage maintained without escalation

---

## Rules, Constraints, and Exceptions

- **Mandatory Rules / Policies:**
  - Emergency patients are prioritized on humanitarian grounds
  - Consent required for patient transfer
  - Pre-authorization mandatory for cashless insurance cases

- **Constraints / Limitations:**
  - Insurance coverage limitations
  - Infrastructure availability (beds, machines)
  - Insurance tariff mismatches

- **Common Exceptions / Edge Cases:**
  - Sudden deterioration of walk-in patients
  - Late or early arrival for appointments
  - Patients overstaying beyond insurance-covered days

- **Situations Where Things Go Wrong:**
  - Delay in insurance approvals
  - Equipment breakdown
  - Infrastructure unavailability

---

## Current Challenges and Pain Points
- Insurance approval delays due to tariff mismatch
- Difficulty managing patients wanting extended stays
- Limited insurance coverage for chronic or cosmetic procedures
- Dependency on infrastructure readiness

---

## Assumptions & Clarifications

- **Confirmed Assumptions:**
  - Most administrative workflows are already digitized
  - Token overlap does not occur due to EMR
  - Human interaction is critical and should not be automated

- **Corrected Assumptions:**
  - Full automation is not always beneficial in healthcare administration

- **Open Questions / Follow-ups:**
  - How to further streamline insurance approval workflows
  - Integration of government ID uploads for specific cases only

