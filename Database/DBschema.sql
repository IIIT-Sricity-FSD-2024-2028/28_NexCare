CREATE DATABASE nexcare_hospital;
USE nexcare_hospital;

CREATE TABLE spoc (
    spoc_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20)
);

CREATE TABLE doctor (
    doctor_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    specialization VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100)
);

CREATE TABLE administrative_staff (
    staff_id INT PRIMARY KEY AUTO_INCREMENT,
    spoc_id INT,
    name VARCHAR(100),
    role VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    FOREIGN KEY (spoc_id) REFERENCES spoc(spoc_id)
);

CREATE TABLE hospital_management (
    management_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(180),
    email VARCHAR(100),
    phone VARCHAR(20),
    password VARCHAR(255)
);

CREATE TABLE patient (
    patient_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(100),
    address VARCHAR(255)
);

CREATE TABLE ambulance_staff (
    ambulance_staff_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    phone VARCHAR(20),
    vehicle_number VARCHAR(50),
    status VARCHAR(50)
);

CREATE TABLE ambulance_request (
    request_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    ambulance_staff_id INT,
    pickup_location VARCHAR(255),
    request_time DATETIME,
    status VARCHAR(50),
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id),
    FOREIGN KEY (ambulance_staff_id) REFERENCES ambulance_staff(ambulance_staff_id)
);

CREATE TABLE inventory (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT,
    item_name VARCHAR(100),
    quantity INT,
    status VARCHAR(50),
    last_updated DATETIME,
    FOREIGN KEY (staff_id) REFERENCES administrative_staff(staff_id)
);

CREATE TABLE appointment (
    appointment_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    doctor_id INT,
    staff_id INT,
    appointment_date DATE,
    appointment_time TIME,
    triage_level VARCHAR(50),
    status VARCHAR(50),
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id),
    FOREIGN KEY (staff_id) REFERENCES administrative_staff(staff_id)
);

CREATE TABLE feedback (
    feedback_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    message TEXT,
    rating INT,
    feedback_date DATE,
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id)
);

CREATE TABLE bill (
    bill_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    staff_id INT,
    amount DECIMAL(10,2),
    bill_date DATE,
    status VARCHAR(50),
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id),
    FOREIGN KEY (staff_id) REFERENCES administrative_staff(staff_id)
);

CREATE TABLE payment_gateway (
    gateway_id INT PRIMARY KEY AUTO_INCREMENT,
    gateway_name VARCHAR(100),
    provider VARCHAR(100)
);

CREATE TABLE payment (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    bill_id INT,
    gateway_id INT,
    payment_method VARCHAR(50),
    payment_date DATETIME,
    amount DECIMAL(10,2),
    FOREIGN KEY (bill_id) REFERENCES bill(bill_id),
    FOREIGN KEY (gateway_id) REFERENCES payment_gateway(gateway_id)
);

CREATE TABLE report (
    report_id INT PRIMARY KEY AUTO_INCREMENT,
    management_id INT,
    report_type VARCHAR(100),
    generated_date DATE,
    content TEXT,
    FOREIGN KEY (management_id) REFERENCES hospital_management(management_id)
);
