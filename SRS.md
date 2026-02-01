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
## Hospital Administrative Operations Platform *(Non-Clinical Workflows)*

---

## 1. Scope

This document defines the non-functional requirements for the Hospital Administrative Operations Platform. Non-functional requirements constrain the overall qualities of the system — how well it performs, how reliably it operates, how securely it handles data, and how it is maintained and deployed — rather than what it does. Every requirement here applies to the system as a whole and is derived from the constraints, pain points, and operational rules identified in the domain expert interaction and the system integrations defined in the use case diagram. The platform must meet these qualities across all eleven use-case modules simultaneously.

---

## 2. Definitions

| Term | Definition |
|---|---|
| **Response Time** | The duration between a user action or system event and the delivery of the corresponding result back to the user or integrated system. |
| **Availability** | The percentage of scheduled operating time during which the system is accessible and functioning correctly. |
| **Throughput** | The number of transactions or operations the system can process per unit of time. |
| **MTBF** | Mean Time Between Failures — the average operating duration between successive system failures. |
| **MTTR** | Mean Time To Recovery — the average time required to restore normal system operation after a failure. |
| **Role-Based Access Control (RBAC)** | A security model that grants each user permissions exclusively on the basis of their assigned role within the organisation. |
| **PCI-DSS** | Payment Card Industry Data Security Standard — the compliance framework that governs the secure handling of payment-card data. |
| **Graceful Degradation** | The system's ability to continue offering core functionality at reduced capacity when a component or external integration fails, rather than failing entirely. |
| **API** | Application Programming Interface — a defined contract through which two systems exchange data and operations. |

---

## 3. NFR Categories and Rationale

The eight categories below follow the standard NFR taxonomy. Each is grounded in specific evidence from the domain expert interaction or the use case diagram.

| Category | Rationale / Source |
|---|---|
| **Performance** | The domain expert specified a 5-minute ambulance dispatch target. The use case diagram connects the GPS Tracking System and the Automated Wait-Time & Bottleneck Detection module to multiple use cases, all of which require low-latency data flow. The expert also identified operational delays as a recurring pain point. |
| **Reliability** | The expert listed equipment breakdown and infrastructure unavailability as common failure scenarios. Ambulance status tracking via the GPS Tracking System must remain live even under degraded conditions. |
| **Security** | Patient consent is a mandatory rule. The use case diagram includes a Payment Gateway integration, which requires PCI-DSS compliance. The Admin actor's monitoring use case demands a full audit trail. The expert raised government ID upload as an open integration point. |
| **Usability** | The expert confirmed that human interaction is critical and must not be fully automated. Four distinct actor types with different responsibilities exist in the diagram, requiring role-appropriate interfaces. The expert's own role involves onboarding new staff, implying the system must be learnable quickly. |
| **Availability** | Ambulance dispatch is time-critical and can occur at any hour. The Reporting System and Wait-Time Detection module require continuous data access. The expert noted that delays in one area cause cascading failures across other operations. |
| **Maintainability** | The use case diagram defines five external system integrations (Notification Service, Payment Gateway, Triage System, GPS Tracking System, Reporting System). The platform itself spans eleven distinct use-case modules, both of which demand a modular, loosely coupled architecture. |
| **Scalability** | The platform must accommodate multiple departments, wards, ambulance units, and staff members simultaneously. The Reporting System aggregates data across every module, so data-handling capacity must grow proportionally. |
| **Portability** | Ambulance Staff require real-time access to dispatch and tracking data while on the move. Administrative Staff operate from multiple locations within the hospital. The system must therefore be accessible across device types without loss of functionality. |

---

## 4. Non-Functional Requirements

Each requirement is written as a testable, measurable statement describing a quality the system as a whole must satisfy. The "Applies To" column identifies which use-case modules or system integrations are directly constrained by the requirement.

---

### 4.1 Performance

Performance requirements define speed and responsiveness targets for the system and its integrations with external services.

| ID | Requirement | Applies To |
|---|---|---|
| NFR-01 | The system shall process any user-initiated action (appointment booking, check-in, bill payment, feedback submission) and return a visible response within 3 seconds under normal load. | All patient- and staff-facing modules |
| NFR-02 | The system shall deliver Notification Service alerts (appointment updates, check-in confirmations, feedback acknowledgements) to end users within 10 seconds of the triggering event. | Notification Service integration |
| NFR-03 | The system shall refresh GPS-based ambulance location data at intervals of no more than 5 seconds during an active dispatch. | GPS Tracking System integration |
| NFR-04 | The system shall evaluate appointment queue wait times and detect bottlenecks within 30 seconds of a threshold breach. | Automated Wait-Time & Bottleneck Detection |
| NFR-05 | The system shall support a sustained throughput of at least 200 concurrent user sessions without degradation in response times specified in NFR-01. | All modules |

---

### 4.2 Reliability

Reliability requirements ensure the system continues to function correctly and recovers predictably when failures occur.

| ID | Requirement | Applies To |
|---|---|---|
| NFR-06 | The system shall achieve a Mean Time Between Failures (MTBF) of no less than 720 hours (30 days) of continuous operation. | Platform as a whole |
| NFR-07 | The system shall achieve a Mean Time To Recovery (MTTR) of no more than 15 minutes following any single-component failure. | Platform as a whole |
| NFR-08 | The system shall implement graceful degradation so that a failure in any one external integration (Notification Service, Payment Gateway, Triage System, GPS Tracking System, or Reporting System) does not prevent the remaining modules from functioning. | All external integrations |
| NFR-09 | The system shall retain and make recoverable all data entered within the last 24 hours in the event of a full system restart. | All modules |
| NFR-10 | The system shall log every detected failure, including the affected component, a timestamp, and an error classification, without requiring manual intervention. | Platform as a whole |

---

### 4.3 Security

Security requirements govern data protection, access control, and compliance obligations across the platform.

| ID | Requirement | Applies To |
|---|---|---|
| NFR-11 | The system shall enforce Role-Based Access Control (RBAC) so that each actor (Patient, Administrative Staff, Ambulance Staff, Admin) can only access and modify data permitted by their assigned role. | All modules |
| NFR-12 | The system shall uniquely authenticate every user before granting access, using a secure credential mechanism (e.g., hospital-issued identity card or multi-factor authentication). | All modules |
| NFR-13 | The system shall encrypt all data in transit between the platform and each external integration using TLS 1.2 or higher. | All external integrations |
| NFR-14 | The system shall encrypt all stored patient and billing data at rest using AES-256 or an equivalent standard. | Patient data, billing data |
| NFR-15 | The Payment Gateway integration shall comply with PCI-DSS requirements; no raw payment-card data shall be stored by the platform. | Payment Gateway integration |
| NFR-16 | The system shall record patient consent digitally before any transfer or inter-hospital referral is processed, and shall store the consent record for the duration of the patient's association with the hospital. | Patient transfers, referrals |
| NFR-17 | The system shall maintain a comprehensive audit trail of all user logins, data reads, data writes, and configuration changes, accessible to the Admin for a minimum retention period of 3 years. | All modules |

---

### 4.4 Usability

Usability requirements ensure the system is learnable, efficient to operate, and appropriate for each actor type.

| ID | Requirement | Applies To |
|---|---|---|
| NFR-18 | The system shall present each actor with an interface tailored to their role, displaying only the actions, data, and navigation relevant to their assigned responsibilities. | All modules |
| NFR-19 | A new staff member with no prior experience of the platform shall be able to complete their core daily tasks independently within 2 working days of first use, supported only by in-system guidance. | All staff-facing modules |
| NFR-20 | The system shall provide contextual help or tooltip guidance at every step where a staff member performs a data-entry or decision action, without requiring navigation to a separate help section. | All staff-facing modules |
| NFR-21 | The system shall confirm every irreversible action (deletion, cancellation, status change to 'Discharged') with an explicit user confirmation prompt before executing. | Appointment management, Bed allocation, Patient check-in |
| NFR-22 | The system shall display all status updates, alerts, and notifications in plain language without internal error codes or technical identifiers. | All modules |

---

### 4.5 Availability

Availability requirements define the uptime and access guarantees the platform must meet.

| ID | Requirement | Applies To |
|---|---|---|
| NFR-23 | The system shall be available 24 hours a day, 7 days a week, with a target uptime of 99.5% or higher measured on a rolling 30-day basis. | Platform as a whole |
| NFR-24 | Scheduled maintenance windows shall not exceed 2 hours per calendar month and shall be communicated to all users at least 48 hours in advance. | Platform as a whole |
| NFR-25 | The system shall remain fully operational for all ambulance-related modules (Request Ambulance, Ambulance Assignment & Status Tracking) even when non-critical modules are undergoing maintenance. | Ambulance modules |
| NFR-26 | The system shall automatically redirect user sessions to a standby instance within 60 seconds if the primary instance becomes unresponsive. | Platform as a whole |

---

### 4.6 Maintainability

Maintainability requirements govern how easily the system can be updated, debugged, and extended over time.

| ID | Requirement | Applies To |
|---|---|---|
| NFR-27 | Each external integration (Notification Service, Payment Gateway, Triage System, GPS Tracking System, Reporting System) shall be implemented behind a dedicated API adapter layer, so that changes to an external service's interface can be accommodated without modifying core platform logic. | All external integrations |
| NFR-28 | The system shall be structured as independent, loosely coupled modules corresponding to the eleven use-case categories, so that a change in one module does not require regression testing of unrelated modules. | Platform architecture |
| NFR-29 | All configuration values (alert thresholds, response-time targets, maintenance windows) shall be externalisable and changeable without redeployment of the application. | All modules |
| NFR-30 | The system shall include automated unit and integration tests covering a minimum of 80% of all business logic paths, maintained alongside the source code. | Platform as a whole |

---

### 4.7 Scalability

Scalability requirements ensure the platform can grow with increasing numbers of users, departments, and data volumes.

| ID | Requirement | Applies To |
|---|---|---|
| NFR-31 | The system shall support scaling from a single hospital site to a minimum of 5 hospital sites without architectural redesign, sharing a common data layer where appropriate. | Platform as a whole |
| NFR-32 | The system shall handle a 3× increase in concurrent user sessions over its baseline capacity (defined in NFR-05) by adding compute resources horizontally, without changes to application code. | Platform as a whole |
| NFR-33 | The Reporting System integration shall remain responsive (query results returned within 10 seconds) as the cumulative data volume grows up to 5 years of operational records. | Reporting System integration |
| NFR-34 | The database layer shall support partitioning or sharding strategies so that growth in one module's data (e.g., ambulance logs or billing records) does not degrade query performance in other modules. | Platform data layer |

---

### 4.8 Portability

Portability requirements ensure the system is accessible and functional across the range of devices and environments used by its actors.

| ID | Requirement | Applies To |
|---|---|---|
| NFR-35 | The system shall deliver a fully functional experience on desktop browsers (Chrome, Firefox, Edge — latest two major versions) and on mobile browsers (iOS Safari, Android Chrome — latest two major versions) without requiring a separate native application. | All modules |
| NFR-36 | All patient- and staff-facing interfaces shall comply with WCAG 2.1 Level AA accessibility standards to ensure usability for users with disabilities. | All modules |
| NFR-37 | The Ambulance Staff interface shall remain usable on small-screen mobile devices (minimum viewport width of 320 px) with no loss of critical functionality for dispatch acceptance and status updates. | Ambulance Assignment & Status Tracking |
| NFR-38 | The system shall be deployable on any standard cloud infrastructure provider (e.g., AWS, Azure, GCP) without vendor-specific dependencies in the application code. | Platform as a whole |

---

## 5. Summary

| Category | Requirement IDs | Count |
|---|---|---|
| Performance | NFR-01 – NFR-05 | 5 |
| Reliability | NFR-06 – NFR-10 | 5 |
| Security | NFR-11 – NFR-17 | 7 |
| Usability | NFR-18 – NFR-22 | 5 |
| Availability | NFR-23 – NFR-26 | 4 |
| Maintainability | NFR-27 – NFR-30 | 4 |
| Scalability | NFR-31 – NFR-34 | 4 |
| Portability | NFR-35 – NFR-38 | 4 |
| **Total** | | **38** |
