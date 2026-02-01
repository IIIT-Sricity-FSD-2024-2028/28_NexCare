# NexCare  
## Hospital Administrative Operations Platform (Non-Clinical)

---

## 1. Problem Statement

In many hospitals, everyday administrative operations remain slow and fragmented. Activities such as appointment scheduling, bed allocation, ambulance coordination, and inventory management are often handled through manual processes or disconnected systems. This results in long patient waiting times, poor inter-department coordination, and inefficient utilization of hospital resources.

**NexCare** addresses these challenges by consolidating all non-clinical hospital operations into a single centralized platform. It enables better coordination among staff, reduces operational delays, and improves overall efficiency—while ensuring that all decision-making authority remains with hospital personnel.

---

## 2. Identified Actors

### Patient (User / Customer)

The patient is the primary service requester who interacts with the system to:
- Book appointments based on urgency  
- Request emergency ambulance services  
- View and pay hospital bills  
- Submit feedback or complaints  

---

### Administrative and Ambulance Staff (Service Providers)

This group includes front-office staff and ambulance personnel responsible for:
- Processing and managing patient requests  
- Allocating hospital resources such as beds, wards, and assets  
- Updating operational statuses in real time  

---

### Admin (System Administrator)

The admin oversees the overall platform and hospital operations, with responsibilities including:
- Monitoring operational performance  
- Reviewing system activity and audit logs  
- Managing reports and system configurations  

---

## 3. Planned Features

### Patient Features

#### Triage-Based Appointment Booking
Patients can request appointments that are automatically prioritized using a triage mechanism. Each request generates a unique EMR token for tracking and reference.

#### Emergency Ambulance Requests
Patients can submit emergency requests with location details, allowing the system to identify and dispatch the nearest available ambulance using GPS integration.

#### Bill Viewing and Online Payments
Patients can access itemized billing information and complete secure online payments through an integrated payment gateway.

#### Feedback and Complaint Management
Patients can submit feedback or complaints, each assigned a unique reference ID for tracking and automated routing to the appropriate department.

---

### Administrative and Ambulance Staff Features

#### Patient Movement Tracking
Staff can record patient check-ins and transfers, maintaining a real-time movement history across departments and facilities.

#### Resource Allocation and Bed Management
The system maintains live occupancy status of beds, rooms, and wards to prevent double allocation and support efficient resource planning.

#### Inventory and Asset Management
Administrative staff can manage hospital assets and consumables with automated alerts for:
- Low stock levels  

#### Staff Shift and Availability Management
Duty rosters and leave schedules can be managed digitally, with automated conflict detection to identify understaffed shifts in advance.

---

### Admin Features

#### Centralized Operations Dashboard
Provides a consolidated, real-time view of key operational metrics such as bed occupancy, staff availability, and ambulance deployment.

#### Reporting and Analytics
Enables generation of scheduled or on-demand reports with configurable filters based on department, date range, and operational metrics.

#### System Audit Trails
Maintains a detailed log of all user actions across the platform to support compliance, accountability, and security audits.

---
