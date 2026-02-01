<img width="758" height="1882" alt="Bed, Room, and Ward Allocation Process drawio" src="https://github.com/user-attachments/assets/d53740fe-e76f-4383-95ef-9afd2895f976" />
<img width="611" height="1882" alt="Patient Check-In and Movement Tracking drawio (1)" src="https://github.com/user-attachments/assets/0f45bcf1-c8db-4b83-81ca-d7d342deef1a" />
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

**Actor:** Patient | **System Integration:** Triage System, Notification Service

| ID | Requirement | Actor |
|---|---|---|
| FR-01 | The system shall allow a patient to initiate a triage-based appointment booking by selecting a department and a preferred date and time slot. | Patient |
| FR-02 | The system shall integrate with the Triage System to automatically assign a priority level to each booking request before confirming the appointment. | Patient |
| FR-03 | The system shall issue a unique token to each patient upon successful appointment confirmation via EMR. | Patient |
| FR-04 | The system shall send an appointment confirmation notification to the patient through the Notification Service immediately after booking. | Patient |
| FR-05 | The system shall allow Administrative Staff to view, reschedule, or cancel any existing appointment. | Admin. Staff |
| FR-06 | The system shall integrate with the Triage System to re-sort the appointment queue whenever a new triage-prioritised booking is added. | Admin. Staff |
| FR-07 | The system shall trigger a notification via the Notification Service to the patient when their token is called or their appointment status changes. | Admin. Staff |
| FR-08 | The system shall prevent duplicate token assignment for the same appointment slot to avoid scheduling conflicts. | Admin. Staff |

---

### 4.2 Submit Feedback / Complaint

**Actor:** Patient, Administrative Staff | **System Integration:** Notification Service

| ID | Requirement | Actor |
|---|---|---|
| FR-09 | The system shall provide a dedicated form that allows a patient to submit a feedback entry or complaint, including a text description and an optional category tag. | Patient |
| FR-10 | The system shall record each submission with a unique reference number and a timestamp upon receipt. | Patient |
| FR-11 | The system shall automatically route the submitted feedback to the relevant department and send an acknowledgement notification to the patient via the Notification Service. | Patient |
| FR-12 | The system shall allow Administrative Staff to view, filter, and update the status of all feedback and complaint entries. | Admin. Staff |

---

### 4.3 Request Ambulance

**Actor:** Patient | **System Integration:** GPS Tracking System

| ID | Requirement | Actor |
|---|---|---|
| FR-13 | The system shall provide a request form that allows a patient to submit an ambulance request, including location details and a brief description of the situation. | Patient |
| FR-14 | The system shall integrate with the GPS Tracking System to determine the nearest available ambulance unit upon request submission. | Patient |

---

### 4.4 Ambulance Assignment & Status Tracking

**Actor:** Ambulance Staff | **System Integration:** GPS Tracking System

| ID | Requirement | Actor |
|---|---|---|
| FR-15 | The system shall allow Ambulance Staff to view assigned dispatch requests, accept or acknowledge an assignment, and update the unit status in real time. | Amb. Staff |
| FR-16 | The system shall integrate with the GPS Tracking System to display the live location and estimated arrival time of every dispatched ambulance unit. | Amb. Staff |
| FR-17 | The system shall flag any ambulance dispatch that exceeds a configurable target response time and escalate it for administrative review. | Amb. Staff |

---

### 4.5 View & Pay Bill

**Actor:** Patient, Administrative Staff | **System Integration:** Payment Gateway

| ID | Requirement | Actor |
|---|---|---|
| FR-18 | The system shall display an itemised bill summary to the patient, showing all charges associated with their visit or stay. | Patient |
| FR-19 | The system shall allow a patient to initiate online payment of the displayed bill through the integrated Payment Gateway. | Patient |
| FR-20 | The system shall update the bill status to 'Paid' and generate a downloadable receipt upon successful transaction confirmation from the Payment Gateway. | Patient |
| FR-21 | The system shall allow Administrative Staff to manually adjust or add line items to a patient bill before final submission. | Admin. Staff |

---

### 4.6 Patient Check-in & Movement Tracking

**Actor:** Administrative Staff | **System Integration:** Notification Service

| ID | Requirement | Actor |
|---|---|---|
| FR-22 | The system shall allow Administrative Staff to register a patient check-in by scanning or entering a unique patient identifier, recording the date and time of arrival. | Admin. Staff |
| FR-23 | The system shall track and display the current location or department of a checked-in patient within the hospital premises. | Admin. Staff |
| FR-24 | The system shall send an automatic notification via the Notification Service to relevant staff when a patient is checked in and ready for the next step. | Admin. Staff |
| FR-25 | The system shall maintain a movement log for each patient, recording every department transition with timestamps. | Admin. Staff |

---

### 4.7 Bed / Room / Ward Allocation

**Actor:** Administrative Staff

| ID | Requirement | Actor |
|---|---|---|
| FR-26 | The system shall maintain a real-time inventory of all beds, rooms, and wards, displaying their current occupancy status. | Admin. Staff |
| FR-27 | The system shall allow Administrative Staff to allocate a specific bed, room, or ward to a checked-in patient. | Admin. Staff |
| FR-28 | The system shall prevent allocation of a bed or room that is already marked as occupied. | Admin. Staff |
| FR-29 | The system shall automatically update bed/room status to 'Available' once a patient discharge or transfer is recorded. | Admin. Staff |

---

### 4.8 Inventory & Asset Management

**Actor:** Administrative Staff

| ID | Requirement | Actor |
|---|---|---|
| FR-30 | The system shall maintain a registry of all hospital assets and consumable inventory items, including current stock levels and maintenance contract type (AMC or CMC). | Admin. Staff |
| FR-31 | The system shall allow Administrative Staff to add, update, or remove inventory and asset records. | Admin. Staff |
| FR-32 | The system shall send automated alerts when any inventory item falls below a configurable minimum threshold. | Admin. Staff |
| FR-33 | The system shall send automated alerts when an equipment item's next scheduled maintenance date is within a configurable lead-time window. | Admin. Staff |

---

### 4.9 Staff Shift & Availability Management

**Actor:** Administrative Staff

| ID | Requirement | Actor |
|---|---|---|
| FR-34 | The system shall allow Administrative Staff to create, publish, and modify monthly staff duty rosters. | Admin. Staff |
| FR-35 | The system shall allow staff members to submit leave requests that are recorded and visible to their supervisors within the system. | Admin. Staff |
| FR-36 | The system shall flag scheduling conflicts such as overlapping shifts or understaffed periods when a roster is saved or modified. | Admin. Staff |
| FR-37 | The system shall support manual duty reassignment by Administrative Staff when a leave request is approved, including extending the previous shift until a replacement is confirmed. | Admin. Staff |

---

### 4.10 Automated Wait-Time & Bottleneck Detection

**Actor:** System (automated) | **System Integration:** Notification Service

| ID | Requirement | Actor |
|---|---|---|
| FR-38 | The system shall continuously monitor appointment queue wait times and automatically detect bottlenecks where expected wait exceeds a configurable threshold. | System |
| FR-39 | The system shall trigger an alert through the Notification Service to Administrative Staff whenever a bottleneck or excessive wait time is detected. | System |
| FR-40 | The system shall display a real-time wait-time dashboard accessible to Administrative Staff for ongoing monitoring. | System |

---

### 4.11 Monitor Hospital Operations & Reports

**Actor:** Admin | **System Integration:** Reporting System

| ID | Requirement | Actor |
|---|---|---|
| FR-41 | The system shall provide the Admin with a consolidated operations dashboard covering appointments, bed occupancy, ambulance status, inventory levels, and staff availability. | Admin |
| FR-42 | The system shall integrate with the Reporting System to generate scheduled and on-demand reports on any operational module. | Admin |
| FR-43 | The system shall allow the Admin to filter and drill down into reports by date range, department, or category. | Admin |
| FR-44 | The system shall maintain a full audit trail of all user actions across the platform, accessible to the Admin. | Admin |

---

## 5. Summary

| Category | Requirement IDs | Count |
|---|---|---|
| Triage-Based Appointment Booking | FR-01 – FR-08 | 8 |
| Submit Feedback / Complaint | FR-09 – FR-12 | 4 |
| Request Ambulance | FR-13 – FR-14 | 2 |
| Ambulance Assignment & Status Tracking | FR-15 – FR-17 | 3 |
| View & Pay Bill | FR-18 – FR-21 | 4 |
| Patient Check-in & Movement Tracking | FR-22 – FR-25 | 4 |
| Bed / Room / Ward Allocation | FR-26 – FR-29 | 4 |
| Inventory & Asset Management | FR-30 – FR-33 | 4 |
| Staff Shift & Availability Management | FR-34 – FR-37 | 4 |
| Automated Wait-Time & Bottleneck Detection | FR-38 – FR-40 | 3 |
| Monitor Hospital Operations & Reports | FR-41 – FR-44 | 4 |
| **Total** | | **44** |


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
| **Load Test** | A test that simulates multiple concurrent users to verify system performance. |

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

### 4.1 Performance

Performance requirements ensure the system responds quickly for practical use and demonstration.

| ID | Requirement | Applies To |
|----|-------------|------------|
| **NFR-01** | The system shall respond to any user action (login, appointment booking, form submission) within 3 seconds under normal load (up to 10 concurrent users). | All user-facing modules |
| **NFR-02** | The system shall display appointment availability results within 2 seconds of a search request. | Appointment Booking |
| **NFR-03** | The system shall process bill payment transactions and display confirmation within 5 seconds. | Billing module |
| **NFR-04** | Database queries for common operations (view appointments, patient check-in, bed allocation) shall execute in under 1 second with up to 1000 records per table. | All modules |

---

### 4.2 Security

Security requirements protect patient data and ensure proper access control.

| ID | Requirement | Applies To |
|----|-------------|------------|
| **NFR-05** | The system shall implement Role-Based Access Control (RBAC) with three distinct roles: Patient, Administrative Staff, and Admin. | All modules |
| **NFR-06** | The system shall require user authentication (username and password) before granting access to any functionality. | All modules |
| **NFR-07** | Patient passwords shall be hashed using bcrypt or equivalent before storage. Plain-text passwords shall never be stored. | Authentication |
| **NFR-08** | The system shall automatically log out inactive users after 30 minutes of inactivity. | All modules |
| **NFR-09** | The system shall lock user accounts after 5 consecutive failed login attempts, requiring admin reset. | Authentication |
| **NFR-10** | The system shall use HTTPS for all client-server communication in production deployment. | Platform as a whole |
| **NFR-11** | The system shall validate and sanitize all user inputs to prevent SQL injection and cross-site scripting (XSS) attacks. | All modules |
| **NFR-12** | Payment gateway integration (if implemented) shall use a sandbox environment and shall not store any credit card information directly in the database. | Payment module |

---

### 4.3 Usability

Usability requirements ensure the system is learnable and easy to use for evaluators and demo purposes.

| ID | Requirement | Applies To |
|----|-------------|------------|
| **NFR-13** | The system shall provide a role-specific dashboard for each user type showing only relevant functions and data. | All modules |
| **NFR-14** | All forms shall include clear field labels, placeholder text, and validation messages to guide user input. | All user-facing modules |
| **NFR-15** | The system shall display meaningful error messages (e.g., "Appointment slot already booked") instead of technical error codes. | All modules |
| **NFR-16** | The system shall confirm all destructive actions (delete, cancel appointment, discharge patient) with a confirmation dialog before execution. | All modules |
| **NFR-17** | The user interface shall be responsive and usable on desktop screens (minimum 1280x720 resolution) and tablet devices (minimum 768px width). | All modules |
| **NFR-18** | A new user shall be able to complete core tasks (book appointment, check-in patient, allocate bed) within 5 minutes with only README documentation, no live training required. | All modules |

---

### 4.4 Reliability

Reliability requirements ensure consistent system behavior during testing and demonstrations.

| ID | Requirement | Applies To |
|----|-------------|------------|
| **NFR-19** | The system shall handle expected errors gracefully (invalid inputs, duplicate bookings, missing data) without crashing or showing stack traces to users. | All modules |
| **NFR-20** | The system shall maintain data consistency: a single appointment slot shall not be bookable by multiple patients simultaneously. | Appointment Booking |
| **NFR-21** | The system shall maintain database transaction integrity: all related operations (e.g., appointment creation + notification trigger) shall complete together or roll back together. | All modules with database operations |
| **NFR-22** | The system shall run continuously for at least 4 hours during load testing without crashes or memory leaks. | Platform as a whole |
| **NFR-23** | All critical errors shall be logged to a file with timestamp, error type, and context for debugging purposes. | Platform as a whole |

---

### 4.5 Maintainability

Maintainability requirements ensure the codebase can be understood, modified, and extended by team members.

| ID | Requirement | Applies To |
|----|-------------|------------|
| **NFR-24** | The system shall follow a clear separation of concerns architecture: frontend (UI), backend (API/business logic), and database layers shall be distinct and loosely coupled. | Platform architecture |
| **NFR-25** | All API endpoints shall follow RESTful conventions with consistent naming (e.g., GET /appointments, POST /appointments, DELETE /appointments/:id). | Backend API |
| **NFR-26** | The codebase shall include inline comments explaining complex business logic and non-obvious design decisions. | All code |
| **NFR-27** | The project repository shall include a README with setup instructions, technology stack description, and how to run the application. | Project documentation |
| **NFR-28** | Database schema shall use meaningful table and column names (e.g., 'appointments', 'patient_id') with foreign key constraints properly defined. | Database layer |
| **NFR-29** | Each functional module (Appointment, Billing, Check-in, etc.) shall be organized in separate directories/packages to enable independent development and testing. | Platform architecture |

---

### 4.6 Testability

Testability requirements ensure the system can be properly validated within project constraints.

| ID | Requirement | Applies To |
|----|-------------|------------|
| **NFR-30** | All backend API endpoints shall be testable independently using tools like Postman or automated API tests. | Backend API |
| **NFR-31** | The system shall include at least one automated test per critical user flow (login, book appointment, process payment, check-in patient). | Core modules |
| **NFR-32** | The database shall support easy reset to a known test state through seed scripts for repeatable testing. | Database layer |
| **NFR-33** | The system shall include sample test data (at least 5 patients, 3 staff members, 10 appointments, 5 beds) that can be loaded automatically for demonstration and testing purposes. | All modules |
| **NFR-34** | All external integrations (payment gateway, notification service, GPS tracking) shall be mockable or have sandbox/test modes for development and testing. | External integrations |

---

## 6. Summary

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
