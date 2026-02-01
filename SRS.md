# Functional Requirements
## Hospital Administrative Operations Platform *(Non-Clinical Workflows)*

---

## 1. Scope

This document defines the functional requirements for the Hospital Administrative Operations Platform. All actors, use cases, and system integrations are derived directly from the use case diagram. Every requirement in this document pertains exclusively to non-clinical, administrative workflows — including appointment scheduling, patient check-in and movement tracking, billing, ambulance coordination, inventory management, staff scheduling, and hospital operations monitoring. The platform is designed to support, and not to replace, human decision-making in hospital administration.

---

## 2. Definitions

| Term | Definition |
|---|---|
| **HMIS** | Hospital Management Information System – the core system enabling paperless hospital operations. |
| **EMR** | Electronic Medical Registration – system used for patient appointment tokens and record keeping. |
| **Token System** | A queue-based appointment numbering system integrated with EMR that calls patients in order. |
| **Triage** | A prioritisation process that classifies patients by urgency to determine appointment order. |
| **CPR Ambulance** | An ambulance unit equipped with a Cardiopulmonary Resuscitation team and advanced life-support equipment. |
| **Pre-authorisation** | Mandatory insurance approval required before a cashless treatment can be initiated. |
| **AMC** | Annual Maintenance Contract – a scheduled service agreement for biomedical equipment. |
| **CMC** | Complete Maintenance Care – a comprehensive care plan covering medical machinery upkeep. |
| **SPOC** | Single Point of Contact – the administrative coordinator in the emergency department. |

---

## 3. Actors

### 3.1 Primary Actors

Primary actors are the human users who interact directly with the system.

| Actor | Description |
|---|---|
| **Patient** | End user who books appointments, submits feedback, requests ambulance services, and views or pays bills through the platform. |
| **Administrative Staff** | Front-office and operations personnel who manage appointments, handle patient check-in, allocate beds/rooms/wards, manage inventory and assets, and plan staff shifts. |
| **Ambulance Staff** | Personnel responsible for accepting ambulance assignments and updating real-time status of dispatched units. |
| **Admin** | Senior administrator who monitors overall hospital operations dashboards and reviews system-generated reports. |

### 3.2 System Actors (External Integrations)

System actors represent external services that integrate with the platform to fulfill use cases.

| System Actor | Role in the Platform |
|---|---|
| **Notification Service** | Sends automated alerts to patients and staff regarding feedback acknowledgement, appointment updates, and check-in status changes. Also receives triggers from the Wait-Time & Bottleneck Detection module. |
| **Payment Gateway** | Processes online bill payments initiated by patients and confirms transaction status back to the platform. |
| **Triage System** | Classifies incoming patients by urgency and feeds priority data into the appointment booking and management workflows. |
| **GPS Tracking System** | Provides real-time geolocation of ambulance units during dispatch and en-route travel. |
| **Reporting System** | Aggregates operational data across all modules and generates dashboards and summary reports for the Admin. |

---

## 4. Functional Requirements

Each requirement is written as a testable statement describing what the system shall do. The Actor column identifies which primary actor initiates or is primarily involved in the use case. "System" denotes an automated process with no direct primary-actor trigger.

---

### 4.1 Triage-Based Appointment Booking

| ID | Functional Requirement | Actor |
|---|---|---|
| FR-01 | The system shall allow patients to book appointments by selecting department, date, and time slot. | Patient |
| FR-02 | The system shall assign a unique appointment token to each confirmed booking. | System |
| FR-03 | The system shall prevent duplicate token assignment for the same time slot. | System |
| FR-04 | The system shall allow administrative staff to view, reschedule, or cancel appointments. | Admin. Staff |
| FR-05 | The system shall notify patients when their token is called or appointment status changes. | System |

---

### 4.2 Patient Check-in & Movement Tracking

| ID | Functional Requirement | Actor |
|---|---|---|
| FR-06 | The system shall allow administrative staff to register patient check-in with timestamp. | Admin. Staff |
| FR-07 | The system shall track the current department/location of a checked-in patient. | Admin. Staff |
| FR-08 | The system shall maintain a movement history log for each patient visit. | System |

---

### 4.3 Request Ambulance & Dispatch

| ID | Functional Requirement | Actor |
|---|---|---|
| FR-09 | The system shall allow patients or staff to submit an ambulance request with location details. | Patient / Admin. Staff |
| FR-10 | The system shall allow ambulance staff to accept assignments and update dispatch status. | Ambulance Staff |
| FR-11 | The system shall display real-time ambulance status and estimated arrival time. | System |

---

### 4.4 Bed / Room / Ward Allocation

| ID | Functional Requirement | Actor |
|---|---|---|
| FR-12 | The system shall maintain real-time availability status of beds and rooms. | System |
| FR-13 | The system shall allow administrative staff to allocate a bed or room to a patient. | Admin. Staff |
| FR-14 | The system shall prevent allocation of unavailable or blocked beds. | System |

---

### 4.5 View & Pay Bill

| ID | Functional Requirement | Actor |
|---|---|---|
| FR-15 | The system shall display an itemized bill to the patient. | Patient |
| FR-16 | The system shall allow patients to pay bills online through an integrated payment gateway. | Patient |
| FR-17 | The system shall generate a receipt upon successful payment. | System |

---

### 4.6 Inventory & Asset Management

| ID | Functional Requirement | Actor |
|---|---|---|
| FR-18 | The system shall maintain a registry of hospital assets and inventory items. | Admin. Staff |
| FR-19 | The system shall alert administrative staff when inventory levels fall below a defined threshold. | System |

---

### 4.7 Staff Shift & Availability Management

| ID | Functional Requirement | Actor |
|---|---|---|
| FR-20 | The system shall allow administrative staff to create and modify staff duty rosters. | Admin. Staff |
| FR-21 | The system shall allow staff leave requests to be recorded and reviewed. | Admin. Staff |

---

### 4.8 Monitor Hospital Operations & Reports

| ID | Functional Requirement | Actor |
|---|---|---|
| FR-22 | The system shall provide an operational dashboard for administrators. | Admin |
| FR-23 | The system shall generate summary reports on appointments, beds, ambulances, and inventory. | System |
| FR-24 | The system shall maintain an audit trail of critical administrative actions. | System |

---

## 5. Summary

| Category | FR Count |
|---|---|
| Appointment & Queue Management | 5 |
| Patient Check-in & Movement | 3 |
| Ambulance Operations | 3 |
| Bed / Room Allocation | 3 |
| Billing & Payments | 3 |
| Inventory Management | 2 |
| Staff Management | 2 |
| Monitoring & Reports | 3 |
| **Total Functional Requirements** | **24** |

---


# Non-Functional Requirements
## Hospital Administrative Operations Platform
### (Student Full-Stack Development Project)

---

## 1. Scope

This document defines the non-functional requirements (NFRs) for the Hospital Administrative Operations Platform student project. These requirements have been streamlined and scoped appropriately for a full-stack development project with realistic testing and validation constraints.

The NFRs focus on essential system qualities that can be implemented, demonstrated, and tested within an academic project timeline, while maintaining professional development standards. All overly ambitious enterprise-grade requirements have been removed or scaled to student-project-appropriate levels.

---

## 2. Definitions

| Term | Definition |
|------|------------|
| **Response Time** | The duration between a user action and the system's visible response. |
| **Session** | A period of continuous user activity from login to logout or timeout. |
| **Concurrent Users** | The number of users actively using the system at the same time. |
| **Functional Module** | A distinct feature set (e.g., Appointment Booking, Billing, Ambulance Tracking). |
| **API** | Application Programming Interface – the contract for communication between system components. |

---

## 3. NFR Categories and Rationale

The requirements are organized into six essential categories suitable for a student project:

| Category | Rationale |
|----------|-----------|
| **Performance** | Ensures the system responds quickly enough for practical use during demos and testing. Critical for appointment booking and real-time ambulance tracking. |
| **Security** | Protects patient data and ensures proper access control. Essential for any healthcare-related system, even in academic contexts. |
| **Usability** | Makes the system learnable and usable by teaching assistants, instructors, and demo users without extensive training. |
| **Reliability** | Ensures the system works consistently during testing, demos, and evaluation periods without frequent crashes. |
| **Maintainability** | Enables team members to understand, modify, and extend the codebase. Critical for iterative development and bug fixes. |
| **Testability** | Ensures the system can be properly tested and validated within project constraints. |

---

## 4. Non-Functional Requirements

Each requirement is testable and measurable within the constraints of a student project.

## 4.1 Performance Requirements

| ID         | Requirement                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **NFR-01** | The system shall respond to any user action (login, booking, form submission) within **3 seconds** under normal load (up to 10 concurrent users). |
| **NFR-02** | The system shall display appointment availability or queue status within **2 seconds** of a user request.                                         |
| **NFR-03** | The system shall complete bill payment processing and display confirmation within **5 seconds** using a sandbox payment gateway.                  |

**Rationale:** These cover all performance expectations required for demos and evaluations without load-testing complexity.

---

## 4.2 Security Requirements

| ID         | Requirement                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------- |
| **NFR-04** | The system shall implement **Role-Based Access Control (RBAC)** for Patient, Administrative Staff, and Admin roles. |
| **NFR-05** | The system shall require authenticated login before allowing access to any protected functionality.                 |
| **NFR-06** | User passwords shall be securely hashed (e.g., bcrypt) and never stored in plain text.                              |
| **NFR-07** | The system shall automatically log out users after **30 minutes of inactivity**.                                    |
| **NFR-08** | The system shall validate and sanitize all user inputs to prevent SQL injection and XSS attacks.                    |

**Removed as out-of-scope:** Account lockout policies, enterprise security audits, and production-grade compliance rules.

---

## 4.3 Usability Requirements

| ID         | Requirement                                                                                              |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| **NFR-09** | The system shall provide **role-specific dashboards** showing only relevant data and actions.            |
| **NFR-10** | All user forms shall include clear labels, validation messages, and meaningful error feedback.           |
| **NFR-11** | The system shall confirm all destructive actions (delete, cancel, discharge) before execution.           |
| **NFR-12** | A new user shall be able to complete core tasks using only README instructions, without formal training. |

**Rationale:** These ensure evaluator-friendly demos and good UX without advanced UI research requirements.

---

## 4.4 Reliability Requirements

| ID         | Requirement                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| **NFR-13** | The system shall prevent duplicate operations such as double booking of appointments or beds.                 |
| **NFR-14** | The system shall handle invalid inputs or system errors gracefully without crashing or exposing stack traces. |
| **NFR-15** | All critical operations shall maintain data consistency using basic database transactions.                    |

**Removed:** Long-duration uptime guarantees and production monitoring metrics.

---

## 4.5 Maintainability & Testability Requirements

| ID         | Requirement                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| **NFR-16** | The system shall follow a **clear separation of concerns** between frontend, backend, and database layers. |
| **NFR-17** | The project repository shall include a README with setup instructions and execution steps.                 |
| **NFR-18** | Backend APIs shall be independently testable using tools such as Postman.                                  |
| **NFR-19** | The system shall include seed data to support repeatable testing and demonstration.                        |

**Rationale:** These are essential for grading, collaboration, and reproducibility.

---

## 4.6 Summary

| Category                      | Count  |
| ----------------------------- | ------ |
| Performance                   | 3      |
| Security                      | 5      |
| Usability                     | 4      |
| Reliability                   | 3      |
| Maintainability & Testability | 4      |
| **Total NFRs**                | **19** |

---

## 4.7 Academic Justification

This NFR set:

* Aligns directly with the defined functional requirements
* Avoids enterprise-only concerns unsuitable for student projects
* Is fully **implementable, testable, and defendable** during project reviews, demos, and viva

**Final Count:** ✅ **19 Non-Functional Requirements**