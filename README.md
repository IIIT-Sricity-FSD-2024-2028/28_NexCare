# NexCare  
## Hospital Administrative Operations Platform (Non-Clinical)

---

## 1. Problem Statement

In many hospitals, everyday administrative operations remain slow and fragmented. Activities such as appointment scheduling, bed allocation, ambulance coordination, and inventory management are often handled through manual processes or disconnected systems. This results in long patient waiting times, poor inter-department coordination, and inefficient utilization of hospital resources.

**NexCare** addresses these challenges by consolidating all non-clinical hospital operations into a single centralized platform. It enables better coordination among staff, reduces operational delays, and improves overall efficiency—while ensuring that all decision-making authority remains with hospital personnel.

---

## 2. Identified Actors

### Patient

The patient is the primary service requester who interacts with the system to:
- Book appointments based on urgency  
- Request emergency ambulance services  
- View and pay hospital bills  
- Submit feedback or complaints  

---

### Administrative Staff 

Administrative staff manage internal hospital operations and resources. Their responsibilities include:
- Processing and managing patient requests
- Allocating beds, wards, and non-clinical resources
- Managing inventory, assets, and staff schedules
- Updating operational statuses in real time

---

### Ambulance Staff 

Ambulance staff are responsible for emergency response and patient transport operations, including:
- Receiving and responding to ambulance dispatch requests
- Updating ambulance availability and location status
- Recording pickup, transfer, and drop-off events
- Coordinating with administrative staff during emergencies

---

### Admin 

The admin oversees the overall platform and hospital operations, with responsibilities including:
- Monitoring operational performance  
- Reviewing system activity and audit logs  
- Managing reports and system configurations  

---

## 3. Planned Features

### Patient Features

#### Priority-Based Appointment Booking
Patients can request appointments that are automatically prioritized using a triage mechanism. Each request generates a unique EMR token for tracking and reference.

#### Emergency Ambulance Requests
Patients can submit emergency requests with location details, allowing the system to identify and dispatch the nearest available ambulance using GPS integration.

#### Bill Viewing and Online Payments
Patients can access itemized billing information and complete secure online payments through an integrated payment gateway.

#### Feedback and Complaint Management
Patients can submit feedback or complaints, each assigned a unique reference ID for tracking and automated routing to the appropriate department.

---
### Administrative Staff Features

#### Appointment and Request Management
Review and process patient appointment requests
Handle escalations from triage-based prioritization

#### Bed, Ward, and Resource Allocation
Maintain real-time bed and ward occupancy
Prevent double allocation of hospital resources
Support efficient capacity planning

#### Inventory and Asset Management
Administrative staff can manage hospital assets and consumables with automated alerts for:
Low stock levels
Asset maintenance or replacement needs

#### Staff Shift and Availability Management
Manage duty rosters and leave schedules
Detect staffing conflicts or understaffed shifts in advance

---

### Ambulance Staff Features

#### Ambulance Dispatch Management
Receive emergency dispatch requests
Accept or acknowledge assigned trips

#### Real-Time Location and Availability Updates
Update ambulance availability status
Share live location data for routing and coordination

#### Emergency Transport Tracking
Record pickup time, transport progress, and patient drop-off
Notify administrative staff upon patient arrival

---

### Admin Features

#### Centralized Operations Dashboard
Provides a consolidated, real-time view of key operational metrics such as bed occupancy, staff availability, and ambulance deployment.

#### Reporting and Analytics
Enables generation of scheduled or on-demand reports with configurable filters based on department, date range, and operational metrics.

#### System Audit Trails
Maintains a detailed log of all user actions across the platform to support compliance, accountability, and security audits.

---
