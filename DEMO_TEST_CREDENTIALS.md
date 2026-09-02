# NexCare — Demo & Testing Login Credentials & Mock Data

> **Prepared for Product Demo / Testing**  
> **Universal Password for ALL Accounts:** `Password123`  
> **Note:** The backend enforces role-based login matching. Please select the correct **Role** on the login screen.

---

## 🌐 Hierarchy Level & Login URLs

| Hierarchy Level | Role Name | Dedicated Login URL |
| :--- | :--- | :--- |
| **Level 1** | Platform Super User | `front-end/auth/superuser-login.html` |
| **Level 2** | Regional Officer | `front-end/auth/regional-officer-login.html` |
| **Level 3** | Hospital Manager | `front-end/auth/hospital-manager-login.html` |
| **Level 4** | Doctor | `front-end/auth/doctor-login.html` |
| **Level 5** | Administrative Staff | `front-end/auth/staff-login.html` |
| **Level 6** | Ambulance Staff | `front-end/auth/staff-login.html` |
| **Level 7** | Patient | `front-end/auth/patient-login.html` |
| **Unified Portal** | *All Roles* | `http://localhost:8080/auth/login` (`front-end/auth/login.html`) |

---

## 📊 PART 1: Hierarchy View (Multiple Test Credentials Per Role & Hospital)

### 👑 Level 1: Platform Super User (Super Admin)
*Platform-wide oversight across all regions, hospitals, users, and platform analytics.*

| # | Name | Email | Password | Scope |
|---|---|---|---|---|
| 1 | NexCare Platform Office | `superuser@nexcare.com` | `Password123` | Platform-wide (All 12 Hospitals) |

---

### 🗺️ Level 2: Regional Officer / Manager
*Oversees assigned regional hospitals, hospital onboarding, approvals, and regional performance.*

| # | Name | Email | Password | Assigned Region & Cities |
|---|---|---|---|---|
| 1 | Anirudh Reddy | `regional@nexcare.com` | `Password123` | REG-AP-SOUTH (Tirupati, Nellore) |
| 2 | Kavya Menon | `kavya.menon@nexcare.in` | `Password123` | REG-KA-SOUTH (Bengaluru, Mysuru) |
| 3 | Rohan Deshmukh | `rohan.deshmukh@nexcare.in` | `Password123` | REG-MH-CENTRAL (Pune, Nashik) |
| 4 | Nandini Iyer | `nandini.iyer@nexcare.in` | `Password123` | REG-TN-NORTH (Chennai, Vellore) |
| 5 | Kavitha Menon | `regional2@nexcare.com` | `Password123` | Chittoor & Nellore Region |

---

### 🏥 Level 3: Hospital Manager
*Manages single hospital facility operations, staff, subscriptions, departments, and finances.*

| # | Name | Email | Password | Hospital Name (ID) |
|---|---|---|---|---|
| 1 | Priya Reddy | `hospitalmanager@nexcare.com` | `Password123` | Sri Venkateswara Multispeciality Hospital (H001) |
| 2 | Arjun Varma | `arjun.varma@nexcare.in` | `Password123` | Coastal Care Hospital (H002) |
| 3 | Sneha Rao | `sneha.rao@nexcare.in` | `Password123` | Namma Health Multispeciality (H003) |
| 4 | Karthik Shetty | `karthik.shetty@nexcare.in` | `Password123` | Cauvery City Hospital (H004) |
| 5 | Neha Kulkarni | `neha.kulkarni@nexcare.in` | `Password123` | Sahyadri Care Hospital (H005) |

---

### 🩺 Level 4: Doctor (4-5 Doctors per Hospital: H001, H002, H003, H004, H005)
*Accesses doctor portal, manages patient appointments, schedule, leave requests, and views consultation earnings.*

#### H001 — Sri Venkateswara Multispeciality Hospital
| # | Name | Email | Password | Department | Hospital | Status |
|---|---|---|---|---|---|---|
| 1 | Dr. Sunita Sharma | `sunita@nexcare.com` | `Password123` | Cardiology | H001 | Active |
| 2 | Dr. Vikram Patel | `vikram@nexcare.in` | `Password123` | Orthopaedics | H001 | Active |
| 3 | Dr. Sarah Smith | `sarah.smith@nexcare.com` | `Password123` | Cardiology | H001 | Active |
| 4 | Dr. Rajesh Rao | `rajesh.rao@nexcare.in` | `Password123` | Cardiology | H001 | Active |
| 5 | Dr. Harini Reddy | `harini.reddy@nexcare.in` | `Password123` | General Medicine | H001 | Active |
| 6 | Dr. Anjali Desai | `anjali@nexcare.in` | `Password123` | General Medicine | H001 | **On Leave** |

#### H002 — Coastal Care Hospital
| # | Name | Email | Password | Department | Hospital | Status |
|---|---|---|---|---|---|---|
| 1 | Dr. Srinivas Varma | `srinivas.varma@nexcare.in` | `Password123` | General Medicine | H002 | Active |
| 2 | Dr. Swati Naidu | `swati.naidu@nexcare.in` | `Password123` | Paediatrics | H002 | Active |
| 3 | Dr. Arvind Swamy | `arvind.swamy@nexcare.in` | `Password123` | Orthopaedics | H002 | Active |
| 4 | Dr. Bhavana Prasad | `bhavana.prasad@nexcare.in` | `Password123` | Gynaecology | H002 | Active |
| 5 | Dr. Madhav Raju | `madhav.raju@nexcare.in` | `Password123` | Cardiology | H002 | Active |

#### H003 — Namma Health Multispeciality
| # | Name | Email | Password | Department | Hospital | Status |
|---|---|---|---|---|---|---|
| 1 | Dr. Ananya Hegde | `ananya.hegde@nexcare.in` | `Password123` | Cardiology | H003 | Active |
| 2 | Dr. Suresh Joshi | `suresh.joshi@nexcare.in` | `Password123` | General Medicine | H003 | Active |
| 3 | Dr. Pradeep Gowda | `pradeep.gowda@nexcare.in` | `Password123` | Orthopaedics | H003 | Active |
| 4 | Dr. Maya Kulkarni | `maya.kulkarni@nexcare.in` | `Password123` | Gynaecology | H003 | Active |
| 5 | Dr. Kiran Shetty | `kiran.shetty@nexcare.in` | `Password123` | Neurology | H003 | Active |

#### H004 — Cauvery City Hospital
| # | Name | Email | Password | Department | Hospital | Status |
|---|---|---|---|---|---|---|
| 1 | Dr. Gautham Nambiar | `gautham.nambiar@nexcare.in` | `Password123` | Cardiology | H004 | Active |
| 2 | Dr. Radhika Ursu | `radhika.ursu@nexcare.in` | `Password123` | Gynaecology | H004 | Active |
| 3 | Dr. Chetan Kumar | `chetan.kumar@nexcare.in` | `Password123` | Orthopaedics | H004 | Active |
| 4 | Dr. Preeti Shenoy | `preeti.shenoy@nexcare.in` | `Password123` | Paediatrics | H004 | Active |
| 5 | Dr. Mahesh Bhat | `mahesh.bhat@nexcare.in` | `Password123` | General Medicine | H004 | Active |

#### H005 — Sahyadri Care Hospital
| # | Name | Email | Password | Department | Hospital | Status |
|---|---|---|---|---|---|---|
| 1 | Dr. Tarun Kulkarni | `tarun.kulkarni@nexcare.in` | `Password123` | Cardiology | H005 | Active |
| 2 | Dr. Meenakshi Sundaram | `meenakshi.sundaram@nexcare.in` | `Password123` | General Medicine | H005 | Active |
| 3 | Dr. Sachin Shinde | `sachin.shinde@nexcare.in` | `Password123` | Orthopaedics | H005 | Active |
| 4 | Dr. Pooja Deshmukh | `pooja.deshmukh@nexcare.in` | `Password123` | Paediatrics | H005 | Active |
| 5 | Dr. Nitin Gadkari | `nitin.gadkari@nexcare.in` | `Password123` | Neurology | H005 | Active |

---

### 📋 Level 5: Administrative Staff
*Front-desk operations, patient admissions/registration, appointment scheduling, and billing management.*

| # | Name | Email | Password | User ID | Hospital |
|---|---|---|---|---|---|
| 1 | Lakshmi Naidu | `admin@nexcare.com` | `Password123` | U002 | H001 — Sri Venkateswara Hospital |
| 2 | Suresh Babu | `suresh.babu@nexcare.in` | `Password123` | ADM-AP01-02 | H001 — Sri Venkateswara Hospital |
| 3 | Ramesh Verma | `ramesh.verma@nexcare.in` | `Password123` | ADM-AP02-01 | H002 — Coastal Care Hospital |
| 4 | Nikhil Rao | `nikhil.rao@nexcare.in` | `Password123` | ADM-KA01-01 | H003 — Namma Health Multispeciality |
| 5 | Shruti Ursu | `shruti.ursu@nexcare.in` | `Password123` | ADM-KA02-01 | H004 — Cauvery City Hospital |
| 6 | Amit Shinde | `amit.shinde@nexcare.in` | `Password123` | ADM-MH01-01 | H005 — Sahyadri Care Hospital |

---

### 🚑 Level 6: Ambulance Staff
*Emergency dispatch management, driver availability status, and live tracking of emergency ambulance requests.*

| # | Crew Name | Email | Password | User ID | Hospital |
|---|---|---|---|---|---|
| 1 | Tirupati Crew Alpha | `ambulance@nexcare.com` | `Password123` | U003 | H001 — Sri Venkateswara Hospital |
| 2 | Tirupati Crew Bravo | `ambulance.h0012@nexcare.in` | `Password123` | AMB-H001-02 | H001 — Sri Venkateswara Hospital |
| 3 | Nellore Crew Alpha | `ambulance.h0021@nexcare.in` | `Password123` | AMB-H002-01 | H002 — Coastal Care Hospital |
| 4 | Bengaluru Crew Alpha | `ambulance.h0031@nexcare.in` | `Password123` | AMB-H003-01 | H003 — Namma Health Multispeciality |
| 5 | Mysuru Crew Alpha | `ambulance.h0041@nexcare.in` | `Password123` | AMB-H004-01 | H004 — Cauvery City Hospital |
| 6 | Pune Crew Alpha | `ambulance.h0051@nexcare.in` | `Password123` | AMB-H005-01 | H005 — Sahyadri Care Hospital |

---

### 👤 Level 7: Patient
*End-user care recipient portal: books consultations, requests emergency ambulances, purchases memberships, and views medical history.*

| # | Name | Email | Password | User ID | Primary Hospital |
|---|---|---|---|---|---|
| 1 | Raghav Rao | `patient@gmail.com` | `Password123` | U004 | H001 |
| 2 | Sravani Reddy | `sravani.reddy@example.in` | `Password123` | PAT-LOGIN-H1-2 | H001 |
| 3 | Karthik Varma | `karthik.v@example.in` | `Password123` | PAT-LOGIN-H2-1 | H002 |
| 4 | Manoj Prasad | `manoj.prasad@example.in` | `Password123` | PAT-LOGIN-H3-1 | H003 |
| 5 | Basavaraj Ursu | `basavaraj.u@example.in` | `Password123` | PAT-LOGIN-H4-1 | H004 |
| 6 | Rohan Joshi | `rohan.j@example.in` | `Password123` | PAT-LOGIN-H5-1 | H005 |

---

## 🏥 PART 2: Hospital-Wise Complete Mock Data & Credentials Breakdown

---

### 🏥 H001 — Sri Venkateswara Multispeciality Hospital (Tirupati, AP)
* **Regional Officer:** Anirudh Reddy (`regional@nexcare.com`)
* **Hospital Manager:** Priya Reddy (`hospitalmanager@nexcare.com`)

#### Login Accounts & Hierarchy:

| Role | Name | Email | Password | User ID / Dept |
|---|---|---|---|---|
| Hospital Manager | Priya Reddy | `hospitalmanager@nexcare.com` | `Password123` | HM-AP01 |
| Doctor | Dr. Sunita Sharma | `sunita@nexcare.com` | `Password123` | Cardiology |
| Doctor | Dr. Harini Reddy | `harini.reddy@nexcare.in` | `Password123` | General Medicine |
| Doctor | Dr. Vikram Patel | `vikram@nexcare.in` | `Password123` | Orthopaedics |
| Doctor | Dr. Sarah Smith | `sarah.smith@nexcare.com` | `Password123` | Cardiology |
| Doctor | Dr. Rajesh Rao | `rajesh.rao@nexcare.in` | `Password123` | Cardiology |
| Doctor | Dr. Anjali Desai | `anjali@nexcare.in` | `Password123` | General Medicine *(On Leave)* |
| Admin Staff | Lakshmi Naidu | `admin@nexcare.com` | `Password123` | U002 |
| Admin Staff | Suresh Babu | `suresh.babu@nexcare.in` | `Password123` | ADM-AP01-02 |
| Admin Staff | Divya Reddy | `divya.reddy@nexcare.in` | `Password123` | ADM-AP01-03 |
| Admin Staff | Kiran Kumar | `kiran.kumar@nexcare.in` | `Password123` | ADM-AP01-04 |
| Admin Staff | Naveen Reddy | `naveen.reddy@nexcare.in` | `Password123` | ADM-H001-05 |
| Ambulance Staff | Tirupati Crew Alpha | `ambulance@nexcare.com` | `Password123` | U003 |
| Ambulance Staff | Tirupati Crew Bravo | `ambulance.h0012@nexcare.in` | `Password123` | AMB-H001-02 |
| Patient | Raghav Rao | `patient@gmail.com` | `Password123` | U004 |
| Patient | Sravani Reddy | `sravani.reddy@example.in` | `Password123` | PAT-LOGIN-H1-2 |
| Patient | Venkat Rao | `venkat.rao@example.in` | `Password123` | PAT-LOGIN-H1-3 |

---

### 🏥 H002 — Coastal Care Hospital (Nellore, AP)
* **Regional Officer:** Anirudh Reddy (`regional@nexcare.com`)
* **Hospital Manager:** Arjun Varma (`arjun.varma@nexcare.in`)

#### Login Accounts & Hierarchy:

| Role | Name | Email | Password | User ID / Dept |
|---|---|---|---|---|
| Hospital Manager | Arjun Varma | `arjun.varma@nexcare.in` | `Password123` | HM-AP02 |
| Doctor | Dr. Srinivas Varma | `srinivas.varma@nexcare.in` | `Password123` | General Medicine |
| Doctor | Dr. Swati Naidu | `swati.naidu@nexcare.in` | `Password123` | Paediatrics |
| Doctor | Dr. Arvind Swamy | `arvind.swamy@nexcare.in` | `Password123` | Orthopaedics |
| Doctor | Dr. Bhavana Prasad | `bhavana.prasad@nexcare.in` | `Password123` | Gynaecology |
| Doctor | Dr. Madhav Raju | `madhav.raju@nexcare.in` | `Password123` | Cardiology |
| Doctor | Dr. Leela Kothari | `leela.kothari@nexcare.in` | `Password123` | Neurology |
| Admin Staff | Ramesh Verma | `ramesh.verma@nexcare.in` | `Password123` | ADM-AP02-01 |
| Admin Staff | Latha Raju | `latha.raju@nexcare.in` | `Password123` | ADM-AP02-02 |
| Admin Staff | Venu Gopal | `venu.gopal@nexcare.in` | `Password123` | ADM-AP02-03 |
| Admin Staff | Kavitha Swamy | `kavitha.swamy@nexcare.in` | `Password123` | ADM-AP02-04 |
| Admin Staff | Keerthana Devi | `keerthana.devi@nexcare.in` | `Password123` | ADM-H002-05 |
| Ambulance Staff | Nellore Crew Alpha | `ambulance.h0021@nexcare.in` | `Password123` | AMB-H002-01 |
| Ambulance Staff | Nellore Crew Bravo | `ambulance.h0022@nexcare.in` | `Password123` | AMB-H002-02 |
| Patient | Karthik Varma | `karthik.v@example.in` | `Password123` | PAT-LOGIN-H2-1 |
| Patient | Gayathri Devi | `gayathri.d@example.in` | `Password123` | PAT-LOGIN-H2-2 |
| Patient | Rahul Verma | `rahul.v@example.in` | `Password123` | PAT-LOGIN-H2-3 |

---

### 🏥 H003 — Namma Health Multispeciality (Bengaluru, KA)
* **Regional Officer:** Kavya Menon (`kavya.menon@nexcare.in`)
* **Hospital Manager:** Sneha Rao (`sneha.rao@nexcare.in`)

#### Login Accounts & Hierarchy:

| Role | Name | Email | Password | User ID / Dept |
|---|---|---|---|---|
| Hospital Manager | Sneha Rao | `sneha.rao@nexcare.in` | `Password123` | HM-KA01 |
| Doctor | Dr. Ananya Hegde | `ananya.hegde@nexcare.in` | `Password123` | Cardiology |
| Doctor | Dr. Suresh Joshi | `suresh.joshi@nexcare.in` | `Password123` | General Medicine |
| Doctor | Dr. Pradeep Gowda | `pradeep.gowda@nexcare.in` | `Password123` | Orthopaedics |
| Doctor | Dr. Maya Kulkarni | `maya.kulkarni@nexcare.in` | `Password123` | Gynaecology |
| Doctor | Dr. Kiran Shetty | `kiran.shetty@nexcare.in` | `Password123` | Neurology |
| Doctor | Dr. Divya Ramesh | `divya.ramesh@nexcare.in` | `Password123` | Paediatrics |
| Admin Staff | Nikhil Rao | `nikhil.rao@nexcare.in` | `Password123` | ADM-KA01-01 |
| Admin Staff | Deepika Gowda | `deepika.gowda@nexcare.in` | `Password123` | ADM-KA01-02 |
| Admin Staff | Prashanth Bhat | `prashanth.bhat@nexcare.in` | `Password123` | ADM-KA01-03 |
| Admin Staff | Vidya Murthy | `vidya.murthy@nexcare.in` | `Password123` | ADM-KA01-04 |
| Admin Staff | Ritu Malhotra | `ritu.malhotra@nexcare.in` | `Password123` | ADM-H003-05 |
| Ambulance Staff | Bengaluru Crew Alpha | `ambulance.h0031@nexcare.in` | `Password123` | AMB-H003-01 |
| Ambulance Staff | Bengaluru Crew Bravo | `ambulance.h0032@nexcare.in` | `Password123` | AMB-H003-02 |
| Patient | Manoj Prasad | `manoj.prasad@example.in` | `Password123` | PAT-LOGIN-H3-1 |
| Patient | Pooja Hegde | `pooja.h@example.in` | `Password123` | PAT-LOGIN-H3-2 |
| Patient | Varun Gowda | `varun.gowda@example.in` | `Password123` | PAT-LOGIN-H3-3 |

---

### 🏥 H004 — Cauvery City Hospital (Mysuru, KA)
* **Regional Officer:** Kavya Menon (`kavya.menon@nexcare.in`)
* **Hospital Manager:** Karthik Shetty (`karthik.shetty@nexcare.in`)

#### Login Accounts & Hierarchy:

| Role | Name | Email | Password | User ID / Dept |
|---|---|---|---|---|
| Hospital Manager | Karthik Shetty | `karthik.shetty@nexcare.in` | `Password123` | HM-KA02 |
| Doctor | Dr. Gautham Nambiar | `gautham.nambiar@nexcare.in` | `Password123` | Cardiology |
| Doctor | Dr. Radhika Ursu | `radhika.ursu@nexcare.in` | `Password123` | Gynaecology |
| Doctor | Dr. Chetan Kumar | `chetan.kumar@nexcare.in` | `Password123` | Orthopaedics |
| Doctor | Dr. Preeti Shenoy | `preeti.shenoy@nexcare.in` | `Password123` | Paediatrics |
| Doctor | Dr. Mahesh Bhat | `mahesh.bhat@nexcare.in` | `Password123` | General Medicine |
| Doctor | Dr. Shalini Rai | `shalini.rai@nexcare.in` | `Password123` | Neurology |
| Admin Staff | Shruti Ursu | `shruti.ursu@nexcare.in` | `Password123` | ADM-KA02-01 |
| Admin Staff | Manjunath Hegde | `manjunath.hegde@nexcare.in` | `Password123` | ADM-KA02-02 |
| Admin Staff | Sowmya Rai | `sowmya.rai@nexcare.in` | `Password123` | ADM-KA02-03 |
| Admin Staff | Ganesh Shetty | `ganesh.shetty@nexcare.in` | `Password123` | ADM-KA02-04 |
| Admin Staff | Anusha Shetty | `anusha.shetty@nexcare.in` | `Password123` | ADM-H004-05 |
| Ambulance Staff | Mysuru Crew Alpha | `ambulance.h0041@nexcare.in` | `Password123` | AMB-H004-01 |
| Ambulance Staff | Mysuru Crew Bravo | `ambulance.h0042@nexcare.in` | `Password123` | AMB-H004-02 |
| Patient | Basavaraj Ursu | `basavaraj.u@example.in` | `Password123` | PAT-LOGIN-H4-1 |
| Patient | Divya Shetty | `divya.s@example.in` | `Password123` | PAT-LOGIN-H4-2 |
| Patient | Chetan Rai | `chetan.r@example.in` | `Password123` | PAT-LOGIN-H4-3 |

---

### 🏥 H005 — Sahyadri Care Hospital (Pune, MH)
* **Regional Officer:** Rohan Deshmukh (`rohan.deshmukh@nexcare.in`)
* **Hospital Manager:** Neha Kulkarni (`neha.kulkarni@nexcare.in`)

#### Login Accounts & Hierarchy:

| Role | Name | Email | Password | User ID / Dept |
|---|---|---|---|---|
| Hospital Manager | Neha Kulkarni | `neha.kulkarni@nexcare.in` | `Password123` | HM-MH01 |
| Doctor | Dr. Tarun Kulkarni | `tarun.kulkarni@nexcare.in` | `Password123` | Cardiology |
| Doctor | Dr. Meenakshi Sundaram | `meenakshi.sundaram@nexcare.in` | `Password123` | General Medicine |
| Doctor | Dr. Sachin Shinde | `sachin.shinde@nexcare.in` | `Password123` | Orthopaedics |
| Doctor | Dr. Pooja Deshmukh | `pooja.deshmukh@nexcare.in` | `Password123` | Paediatrics |
| Doctor | Dr. Nitin Gadkari | `nitin.gadkari@nexcare.in` | `Password123` | Neurology |
| Doctor | Dr. Rekha Pawar | `rekha.pawar@nexcare.in` | `Password123` | Gynaecology |
| Admin Staff | Amit Shinde | `amit.shinde@nexcare.in` | `Password123` | ADM-MH01-01 |
| Admin Staff | Pooja Kadam | `pooja.kadam@nexcare.in` | `Password123` | ADM-MH01-02 |
| Admin Staff | Rohan More | `rohan.more@nexcare.in` | `Password123` | ADM-MH01-03 |
| Admin Staff | Snehal Joshi | `snehal.joshi@nexcare.in` | `Password123` | ADM-MH01-04 |
| Admin Staff | Tejas Kulkarni | `tejas.kulkarni@nexcare.in` | `Password123` | ADM-H005-05 |
| Ambulance Staff | Pune Crew Alpha | `ambulance.h0051@nexcare.in` | `Password123` | AMB-H005-01 |
| Ambulance Staff | Pune Crew Bravo | `ambulance.h0052@nexcare.in` | `Password123` | AMB-H005-02 |
| Patient | Rohan Joshi | `rohan.j@example.in` | `Password123` | PAT-LOGIN-H5-1 |
| Patient | Swati Kulkarni | `swati.k@example.in` | `Password123` | PAT-LOGIN-H5-2 |
| Patient | Ajinkya Shinde | `ajinkya.s@example.in` | `Password123` | PAT-LOGIN-H5-3 |

---

## 💡 Key Highlights & Testing Notes

1. **Role Selection Mandatory:** Make sure to select the matching role in the login dropdown or radio buttons.
2. **Global Password:** All accounts share `Password123`.
3. **Data Scoping Test:** Regional Officer `kavya.menon@nexcare.in` sees H003 (Bengaluru) and H004 (Mysuru), but cannot view H001 (Tirupati) or H005 (Pune).
