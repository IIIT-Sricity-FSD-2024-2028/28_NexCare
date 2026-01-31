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
