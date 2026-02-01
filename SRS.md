<img width="758" height="1882" alt="Bed, Room, and Ward Allocation Process drawio" src="https://github.com/user-attachments/assets/68e8949e-44ad-4cbd-b925-06ef187a2cb4" />
<img width="611" height="1882" alt="Patient Check-In and Movement Tracking drawio (1)" src="https://github.com/user-attachments/assets/98dcd046-4069-4787-8045-9ba6433c87a7" />

# User requirements 

This section describes the services provided by the NexCare system to its users, along with user-visible quality expectations and constraints. The requirements are expressed in natural language and are intended to be understandable by hospital stakeholders. Detailed functional logic and measurable non-functional constraints are specified in later sections of this document.

## 3.1 User Classes

The NexCare system supports the following user classes:

Patients – users who book appointments, request services, make payments, and submit feedback.

Administrative Staff – hospital staff responsible for appointments, check-in, billing, bed allocation, inventory, and staff scheduling.

Ambulance Staff – users responsible for handling ambulance dispatch requests and updates.

Admin (Hospital Management) – users responsible for monitoring hospital operations and performance.

##  3.2 User Service Requirements
### 3.2.1 Appointment Booking & Queue Management
UR-1
The system shall allow patients to request appointments by selecting a department and preferred date and time.

UR-2
The system shall provide patients with a unique appointment token upon successful booking.

UR-3
The system shall allow patients to view the status and queue position of their appointments.

UR-4
The system shall notify patients when appointment timing or queue position changes.

UR-5
The system shall allow administrative staff to view, reschedule, or cancel patient appointments.

### 3.2.2 Feedback & Complaint Management
The system shall allow patients to submit feedback or complaints related to hospital services.

UR-7
The system shall provide patients with an acknowledgement and reference number for submitted feedback or complaints.

UR-8
The system shall allow administrative staff to review and update the status of feedback and complaint records.

### 3.2.3 Ambulance Request & Coordination
UR-9
The system shall allow patients to request ambulance services by providing required location details.

UR-10
The system shall allow ambulance staff to view and accept assigned ambulance requests.

UR-11
The system shall allow ambulance staff to update the status of ambulance dispatch and patient transport.

UR-12
The system shall allow administrative staff to monitor ambulance requests and their current status.

### 3.2.4 Billing & Payments
UR-13
The system shall allow patients to view an itemised bill for hospital services received.

UR-14
The system shall allow patients to make online payments for hospital bills.

UR-15
The system shall allow patients to view or download payment receipts after successful transactions.

UR-16
The system shall allow administrative staff to modify billing details before final bill generation.

### 3.2.5 Patient Check-in & Movement Tracking
UR-17
The system shall allow administrative staff to record patient check-in upon arrival at the hospital.

UR-18
The system shall allow administrative staff to view the current department or location of a checked-in patient.

UR-19
The system shall notify relevant staff when a patient moves to the next stage of care.

UR-20
The system shall maintain a visible movement history for each patient during their hospital visit.

### 3.2.6 Bed / Room / Ward Allocation
UR-21
The system shall allow administrative staff to view real-time availability of beds, rooms, and wards.

UR-22
The system shall allow administrative staff to allocate beds or rooms to patients.

UR-23
The system shall prevent allocation of beds or rooms that are already occupied.

UR-24
The system shall update bed and room availability when patients are discharged or transferred.

### 3.2.7 Inventory & Asset Management
UR-25
The system shall allow administrative staff to view hospital inventory and equipment records.

UR-26
The system shall allow administrative staff to update inventory quantities and asset information.

UR-27
The system shall notify administrative staff when inventory levels or asset conditions require attention.

### 3.2.8 Staff Scheduling
UR-28
The system shall allow administrative staff to create and manage staff duty schedules.

UR-29
The system shall allow approved staff availability changes to be reflected in schedules.

UR-30
The system shall alert administrative staff to scheduling conflicts or understaffed periods.

### 3.2.9 Wait-Time & Bottleneck Monitoring
UR-31
The system shall allow administrative staff to view current patient wait times for hospital services.

UR-32
The system shall notify administrative staff when excessive wait times or service bottlenecks are detected.

### 3.2.10 Operations Dashboard & Reporting
UR-33
The system shall provide hospital management with a consolidated operational dashboard.

UR-34
The system shall allow hospital management to generate and view operational reports.

UR-35
The system shall allow hospital management to review audit logs of significant system activities.

## 3.3 User-Visible Non-Functional Requirements
The following non-functional requirements describe quality attributes as experienced by users. Detailed, measurable non-functional requirements are specified separately in the Non-Functional Requirements section.

UR-NF-1
The system shall respond to common user actions in a timely manner under normal operating conditions.

UR-NF-2
The system shall be available to users during normal hospital operating hours.

UR-NF-3
The system shall restrict access to system features based on the user’s assigned role.

UR-NF-4
The system shall present information using clear labels, readable layouts, and understandable messages suitable for non-technical users.

UR-NF-5
The system shall protect patient and hospital information from unauthorized access.

## 3.4 Standards and Constraints
UR-SC-1
The system shall comply with standard web application usability and accessibility practices.

UR-SC-2
The system shall handle patient information in accordance with applicable privacy and confidentiality guidelines.

UR-SC-3
The system shall maintain auditability of administrative, billing, and scheduling actions.

UR-SC-4
The system shall support commonly used modern web browsers.

UR-SC-5
The system shall integrate with an approved and secure payment gateway for billing transactions.

## User Requirement – Functional Requirement Traceability Matrix
| User Requirement (UR)      | Mapped Functional Requirement(s) (FR) |
| ------------------------- | ----------------------------------------- |
| UR-1                      | FR-01                                     |
| UR-2                      | FR-02                                     |
| UR-3                      | FR-03                                     |
| UR-4                      | FR-02, FR-03                              |
| UR-5                      | FR-03                                     |
| UR-6                      | FR-09                                     |
| UR-7                      | FR-10                                     |
| UR-8                      | FR-11, FR-12                              |
| UR-9                      | FR-13                                     |
| UR-10                     | FR-14                                     |
| UR-11                     | FR-15                                     |
| UR-12                     | FR-16, FR-17                              |
| UR-13                     | FR-18                                     |
| UR-14                     | FR-19                                     |
| UR-15                     | FR-20                                     |
| UR-16                     | FR-21                                     |
| UR-17                     | FR-22                                     |
| UR-18                     | FR-23                                     |
| UR-19                     | FR-24                                     |
| UR-20                     | FR-25                                     |
| UR-21                     | FR-26                                     |
| UR-22                     | FR-27                                     |
| UR-23                     | FR-27                                     |
| UR-24                     | FR-28, FR-29                              |
| UR-25                     | FR-30                                     |
| UR-26                     | FR-31                                     |
| UR-27                     | FR-32, FR-33                              |
| UR-28                     | FR-34                                     |
| UR-29                     | FR-35                                     |
| UR-30                     | FR-36, FR-37                              |
| UR-31                     | FR-38                                     |
| UR-32                     | FR-39, FR-40                              |
| UR-33                     | FR-41                                     |
| UR-34                     | FR-42, FR-43                              |
| UR-35                     | FR-44                                     |


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

| Category | Requirement IDs | Count |
|----------|----------------|-------|
| Performance | NFR-01 to NFR-04 | 4 |
| Security | NFR-05 to NFR-12 | 8 |
| Usability | NFR-13 to NFR-18 | 6 |
| Reliability | NFR-19 to NFR-23 | 5 |
| Maintainability | NFR-24 to NFR-29 | 6 |
| Testability | NFR-30 to NFR-34 | 5 |
| **Total** | | **34** |

---

## 7. Testing and Validation Guide

This section provides practical guidance on how to test and validate each NFR category within project constraints.

### 7.1 Performance Testing

**Tools:** Browser Developer Tools (Network tab), Apache JMeter (basic load testing), or custom scripts

**Method:**
1. Use browser Developer Tools to measure response times for key actions
2. Create 10 concurrent user sessions and verify no degradation
3. Document response times in a test report with screenshots

---

### 7.2 Security Testing

**Tools:** Manual testing, database inspection, browser DevTools

**Method:**
1. Verify RBAC by attempting to access restricted pages with different user roles
2. Check database to confirm passwords are hashed, not plain text
3. Test session timeout by leaving browser idle for 30 minutes
4. Attempt SQL injection in input fields (e.g., username: `admin' OR '1'='1`)

---

### 7.3 Usability Testing

**Tools:** Peer review, instructor evaluation

**Method:**
1. Give system to a peer who hasn't seen it before with only README instructions
2. Ask them to complete 5 core tasks and time how long it takes
3. Test on different screen sizes (desktop, tablet) to verify responsiveness
4. Intentionally trigger errors and verify messages are user-friendly

---

### 7.4 Reliability Testing

**Tools:** Load testing scripts, log files

**Method:**
1. Run the system continuously for 4 hours with periodic test actions
2. Monitor memory usage to detect leaks (should remain stable)
3. Test duplicate appointment booking by two users simultaneously
4. Review error logs to confirm all errors are properly logged

---

### 7.5 Maintainability Validation

**Tools:** Code review, architecture documentation

**Method:**
1. Review code structure to verify clear separation of frontend/backend/database
2. Check API endpoints follow RESTful naming conventions
3. Verify README includes all necessary setup and run instructions
4. Have another team member attempt to add a new feature to assess code clarity

---

### 7.6 Testability Validation

**Tools:** Postman, Jest/Mocha/PyTest (depending on stack), database seed scripts

**Method:**
1. Test all API endpoints independently using Postman or curl
2. Run database seed script to verify test data loads correctly
3. Execute automated tests (if implemented) and document results
4. Verify external integrations can be tested in sandbox/mock mode

---

##  8. UML Diagrams

### 8.1 Use Case Diagram

<img width="683" height="1006" alt="use_case_2 drawio" src="https://github.com/user-attachments/assets/efe131ad-b08c-4bd9-97c5-0e488fe49f7d" />


### 8.2 Activity Diagrams

 ### 1. Triage-Based Appointment Booking, Rescheduling and Cancelling

<img width="1151" height="1261" alt="activity_appointment2 drawio (1)" src="https://github.com/user-attachments/assets/e7ff2d33-9ac1-4853-bb7d-aa4dc323e610" />

 ### 2. Billing and Payment processing

<img width="1351" height="1971" alt="billingandpayment drawio" src="https://github.com/user-attachments/assets/76f2d07a-26a5-4473-84f7-7c3e86aec8b7" />

 ### 3. Feedback and complaint handling

<img width="1261" height="1541" alt="feedbackandcomplaint drawio" src="https://github.com/user-attachments/assets/204f35fa-8511-4de8-b3a3-fa5512b84d6d" />

 ### 4.Inventory & Asset Stock Management

<img width="531" height="1081" alt="I drawio" src="https://github.com/user-attachments/assets/e062b433-22f5-4ddf-9e30-61d1712cc351" />

 ### 5.Ambulance Request, Assignment & Tracking

<img width="811" height="1071" alt="Ambulance drawio" src="https://github.com/user-attachments/assets/d73203ae-4ff4-4a69-86e6-149a7a479698" />


### 8.3 Sequence diagram


<img width="1502" height="1507" alt="sequence drawio" src="https://github.com/user-attachments/assets/fd7c1253-c977-4a08-9d82-a4b4b9e3a760" />




## Quick Reference: Critical NFRs Checklist

Use this checklist during development and before final submission:

- [ ] **Performance**: Response times under 3 seconds (NFR-01)
- [ ] **Security**: RBAC implemented with 3 roles (NFR-05)
- [ ] **Security**: Passwords hashed with bcrypt (NFR-07)
- [ ] **Security**: SQL injection prevention implemented (NFR-11)
- [ ] **Usability**: Role-specific dashboards created (NFR-13)
- [ ] **Usability**: User-friendly error messages (NFR-15)
- [ ] **Reliability**: Duplicate booking prevention (NFR-20)
- [ ] **Reliability**: 4-hour continuous operation test passed (NFR-22)
- [ ] **Maintainability**: Clear 3-tier architecture (NFR-24)
- [ ] **Maintainability**: RESTful API conventions followed (NFR-25)
- [ ] **Maintainability**: Comprehensive README included (NFR-27)
- [ ] **Testability**: API endpoints testable with Postman (NFR-30)
- [ ] **Testability**: Database seed scripts created (NFR-32)
- [ ] **Testability**: Sample test data included (NFR-33)

---

**Document Version:** 1.0 - Student Project Edition  
**Last Updated:** February 2026  
**Total Requirements:** 34 NFRs across 6 categories
