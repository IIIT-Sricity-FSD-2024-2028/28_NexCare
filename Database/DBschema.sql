CREATE DATABASE nexcare_hospital;
USE nexcare_hospital;

-- USERS (centralized like farm schema)
CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    password_hash VARCHAR(255),
    role ENUM('PATIENT','DOCTOR','STAFF','AMBULANCE','MANAGEMENT')
);

-- PATIENT DETAILS
CREATE TABLE Patients (
    patient_id INT PRIMARY KEY,
    date_of_birth DATE,
    gender ENUM('MALE','FEMALE','OTHER'),
    address VARCHAR(255),
    FOREIGN KEY (patient_id) REFERENCES Users(user_id)
);

-- DOCTOR DETAILS
CREATE TABLE Doctors (
    doctor_id INT PRIMARY KEY,
    specialization VARCHAR(100),
    FOREIGN KEY (doctor_id) REFERENCES Users(user_id)
);

-- STAFF DETAILS
CREATE TABLE Staff (
    staff_id INT PRIMARY KEY,
    role VARCHAR(100),
    FOREIGN KEY (staff_id) REFERENCES Users(user_id)
);

-- AMBULANCE STAFF
CREATE TABLE AmbulanceStaff (
    ambulance_id INT PRIMARY KEY,
    vehicle_number VARCHAR(50),
    status ENUM('AVAILABLE','BUSY','OFFLINE'),
    FOREIGN KEY (ambulance_id) REFERENCES Users(user_id)
);

-- MANAGEMENT
CREATE TABLE Management (
    management_id INT PRIMARY KEY,
    FOREIGN KEY (management_id) REFERENCES Users(user_id)
);

---------------------------------------------------
-- APPOINTMENT / CARE PLAN (like CropPlans)
---------------------------------------------------
CREATE TABLE Appointments (
    appointment_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    doctor_id INT,
    appointment_date DATE,
    appointment_time TIME,
    status ENUM('BOOKED','ONGOING','COMPLETED','CANCELLED'),
    FOREIGN KEY (patient_id) REFERENCES Patients(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES Doctors(doctor_id)
);

---------------------------------------------------
-- TREATMENT ACTIVITIES (like Activities)
---------------------------------------------------
CREATE TABLE Treatments (
    treatment_id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT,
    type ENUM('DIAGNOSIS','MEDICATION','SURGERY','FOLLOWUP'),
    description TEXT,
    schedule DATETIME,
    status ENUM('UPCOMING','ONGOING','DONE'),
    FOREIGN KEY (appointment_id) REFERENCES Appointments(appointment_id)
);

---------------------------------------------------
-- REMINDERS (same concept reused)
---------------------------------------------------
CREATE TABLE Reminders (
    reminder_id INT PRIMARY KEY AUTO_INCREMENT,
    treatment_id INT,
    user_id INT,
    remind_time DATETIME,
    sent BOOLEAN,
    FOREIGN KEY (treatment_id) REFERENCES Treatments(treatment_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

---------------------------------------------------
-- EMERGENCY / AMBULANCE REQUESTS
---------------------------------------------------
CREATE TABLE AmbulanceRequests (
    request_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    ambulance_id INT,
    pickup_location VARCHAR(255),
    request_time DATETIME,
    status ENUM('REQUESTED','ASSIGNED','COMPLETED','CANCELLED'),
    FOREIGN KEY (patient_id) REFERENCES Patients(patient_id),
    FOREIGN KEY (ambulance_id) REFERENCES AmbulanceStaff(ambulance_id)
);

---------------------------------------------------
-- WARNINGS / ALERTS (like farm warnings)
---------------------------------------------------
CREATE TABLE Alerts (
    alert_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    type ENUM('CRITICAL','MEDICATION','FOLLOWUP'),
    message TEXT,
    issued_at TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES Patients(patient_id)
);

---------------------------------------------------
-- INVENTORY (same concept)
---------------------------------------------------
CREATE TABLE Inventory (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT,
    item_name VARCHAR(100),
    quantity INT,
    unit VARCHAR(20),
    FOREIGN KEY (staff_id) REFERENCES Staff(staff_id)
);

---------------------------------------------------
-- BILLING SYSTEM
---------------------------------------------------
CREATE TABLE Bills (
    bill_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    amount DECIMAL(10,2),
    bill_date DATE,
    status ENUM('PENDING','PAID','CANCELLED'),
    FOREIGN KEY (patient_id) REFERENCES Patients(patient_id)
);

CREATE TABLE Payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    bill_id INT,
    method VARCHAR(50),
    payment_date DATETIME,
    amount DECIMAL(10,2),
    FOREIGN KEY (bill_id) REFERENCES Bills(bill_id)
);

---------------------------------------------------
-- FEEDBACK
---------------------------------------------------
CREATE TABLE Feedback (
    feedback_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    message TEXT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    feedback_date DATE,
    FOREIGN KEY (patient_id) REFERENCES Patients(patient_id)
);

---------------------------------------------------
-- STAFF TASKS (like WorkerTasks)
---------------------------------------------------
CREATE TABLE StaffTasks (
    task_id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT,
    treatment_id INT,
    assign_date DATE,
    status ENUM('ASSIGNED','DONE'),
    FOREIGN KEY (staff_id) REFERENCES Staff(staff_id),
    FOREIGN KEY (treatment_id) REFERENCES Treatments(treatment_id)
);

---------------------------------------------------
-- MANAGEMENT REPORTS
---------------------------------------------------
CREATE TABLE Reports (
    report_id INT PRIMARY KEY AUTO_INCREMENT,
    management_id INT,
    report_type VARCHAR(100),
    generated_date DATE,
    content TEXT,
    FOREIGN KEY (management_id) REFERENCES Management(management_id)
);
