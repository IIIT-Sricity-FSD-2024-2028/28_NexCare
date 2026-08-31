const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const regions = ['North', 'South', 'East', 'West'];
const cities = ['Delhi', 'Chennai', 'Kolkata', 'Mumbai'];

let users = [];
let hospitals = [];
let patients = [];
let wards = [];
let beds = [];
let inventory = [];
let appointments = [];
let billing = [];
let docSubscriptions = [];

// Superuser
users.push({
  id: 'U001',
  name: 'Super Admin',
  email: 'superuser@nexcare.com',
  role: 'superuser',
  status: 'Active',
  password: 'Password123'
});

// Patient Logins
const patientLogins = [
  { id: 'PL01', name: 'Ravi Kumar', email: 'patient1@gmail.com', password: 'Password123', patientId: 'P01' },
  { id: 'PL02', name: 'Priya Sharma', email: 'patient2@gmail.com', password: 'Password123', patientId: 'P02' },
  { id: 'PL03', name: 'Amit Singh', email: 'patient3@gmail.com', password: 'Password123', patientId: 'P03' }
];
users.push(...patientLogins);

let hospitalIdCounter = 1;
let docIdCounter = 1;
let adminIdCounter = 1;
let patientIdCounter = 1;
let bedIdCounter = 1;
let invIdCounter = 1;
let aptIdCounter = 1;
let billIdCounter = 1;

for (let r = 0; r < 4; r++) {
  const rmId = `RM00${r + 1}`;
  users.push({
    id: rmId,
    name: `${regions[r]} Manager`,
    email: `rm_${regions[r].toLowerCase()}@nexcare.com`,
    role: 'regional_manager',
    status: 'Active',
    password: 'Password123',
    areas: [cities[r]]
  });

  // 2 Hospitals per region
  for (let h = 0; h < 2; h++) {
    const hospId = `H${String(hospitalIdCounter).padStart(3, '0')}`;
    hospitalIdCounter++;
    
    hospitals.push({
      id: hospId,
      name: `NexCare ${cities[r]} ${h === 0 ? 'General' : 'Speciality'} Hospital`,
      registrationNumber: `REG-${cities[r].substring(0,3).toUpperCase()}-${hospId}`,
      type: h === 0 ? 'General' : 'Super Speciality',
      ownershipType: 'Private',
      address: `${10 + h} Main Road`,
      city: cities[r],
      state: `${regions[r]} State`,
      pincode: `10000${r}${h}`,
      phone: `+91 999990000${r}${h}`,
      email: `contact@${hospId.toLowerCase()}.nexcare.com`,
      totalBeds: 100 + (h * 50),
      icuBeds: 20 + (h * 10),
      specialities: ['Cardiology', 'Orthopaedics', 'General Medicine'],
      emergency24x7: true,
      ambulanceService: true,
      verificationStatus: 'verified',
      assignedManagerId: rmId,
      regionName: regions[r]
    });

    // 1 Hospital Manager
    users.push({
      id: `HM_${hospId}`,
      name: `Manager ${hospId}`,
      email: `hm_${hospId.toLowerCase()}@nexcare.com`,
      role: 'hospital_manager',
      status: 'Active',
      password: 'Password123',
      hospitalId: hospId,
      hospitalName: `NexCare ${cities[r]}`
    });

    // 3-4 Admin staff
    const numAdmins = Math.floor(Math.random() * 2) + 3;
    for (let a = 0; a < numAdmins; a++) {
      users.push({
        id: `ADM_${adminIdCounter}`,
        name: `Admin Staff ${adminIdCounter}`,
        email: `admin${adminIdCounter}@nexcare.com`,
        role: 'administrative_staff',
        status: 'Active',
        password: 'Password123',
        hospitalId: hospId,
        dept: 'Front Desk'
      });
      adminIdCounter++;
    }

    // 5-6 Doctors
    const numDocs = Math.floor(Math.random() * 2) + 5;
    const depts = ['Cardiology', 'Orthopaedics', 'General Medicine', 'Neurology', 'Paediatrics', 'Dermatology'];
    let hospDocs = [];
    for (let d = 0; d < numDocs; d++) {
      const doc = {
        id: `DOC_${docIdCounter}`,
        name: `Dr. Doctor ${docIdCounter}`,
        email: `doc${docIdCounter}@nexcare.com`,
        role: 'doctor',
        dept: depts[d % depts.length],
        status: 'Active',
        password: 'Password123',
        hospitalId: hospId,
        consultationFee: 500 + (d * 100),
        schedule: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' }
        }
      };
      users.push(doc);
      hospDocs.push(doc);
      docSubscriptions.push({
        id: `DSUB-${doc.id}`,
        doctorId: doc.id,
        doctorName: doc.name,
        hospitalId: hospId,
        planId: 'DOC-FREE',
        status: 'active'
      });
      docIdCounter++;
    }

    // Wards and Beds
    const wardTypes = ['Emergency', 'General', 'ICU'];
    wardTypes.forEach((w, idx) => {
      wards.push({
        id: `W-${hospId}-${idx}`,
        name: w,
        hospitalId: hospId
      });
      
      const numBeds = w === 'ICU' ? 10 : 20;
      for (let b = 0; b < numBeds; b++) {
        const isOccupied = Math.random() > 0.5;
        beds.push({
          id: `B-${hospId}-${bedIdCounter}`,
          ward: w,
          status: isOccupied ? 'occupied' : 'available',
          patient: isOccupied ? `Random Patient ${bedIdCounter}` : '',
          hospitalId: hospId
        });
        bedIdCounter++;
      }
    });

    // Inventory
    const invItems = ['Gloves', 'Syringes', 'Saline', 'Masks', 'Bandages'];
    invItems.forEach(item => {
      const qty = Math.floor(Math.random() * 200);
      const min = 50;
      inventory.push({
        id: `INV-${invIdCounter}`,
        name: item,
        category: 'Consumables',
        quantity: qty,
        minStock: min,
        status: qty < min ? 'Low Stock' : 'In Stock',
        hospitalId: hospId
      });
      invIdCounter++;
    });

    // Patients & Appointments
    const numPatients = Math.floor(Math.random() * 6) + 5; // 5-10
    for (let p = 0; p < numPatients; p++) {
      const pId = `P${String(patientIdCounter).padStart(3, '0')}`;
      patients.push({
        id: pId,
        fullName: `Patient ${patientIdCounter}`,
        phone: `9800000${String(patientIdCounter).padStart(3, '0')}`,
        email: `p${patientIdCounter}@example.com`,
        status: 'Active',
        age: 30 + (p % 30)
      });

      // 1-2 Appointments per patient
      const docForApt = hospDocs[p % hospDocs.length];
      const isCompleted = Math.random() > 0.5;
      const apt = {
        id: `APT-${aptIdCounter}`,
        patientId: pId,
        patientName: `Patient ${patientIdCounter}`,
        department: docForApt.dept,
        doctor: docForApt.name,
        doctorId: docForApt.id,
        dateLabel: '2026-08-30',
        timeLabel: '10:00 AM',
        fee: docForApt.consultationFee,
        status: isCompleted ? 'Completed' : 'Pending',
        hospitalId: hospId
      };
      appointments.push(apt);
      
      if (isCompleted) {
        billing.push({
          id: `BILL-${billIdCounter}`,
          patientId: pId,
          hospitalId: hospId,
          status: 'PAID',
          total: apt.fee,
          items: [
            { description: 'Consultation', department: apt.department, amount: apt.fee }
          ],
          payments: [{ amount: apt.fee }]
        });
        billIdCounter++;
      }
      
      aptIdCounter++;
      patientIdCounter++;
    }
  }
}

// Add the fixed patients
patientLogins.forEach(pl => {
  patients.push({
    id: pl.patientId,
    fullName: pl.name,
    email: pl.email,
    status: 'Active',
    age: 25
  });
});

fs.writeFileSync(path.join(DATA_DIR, 'users.json'), JSON.stringify(users, null, 2));
fs.writeFileSync(path.join(DATA_DIR, 'hospitals.json'), JSON.stringify(hospitals, null, 2));
fs.writeFileSync(path.join(DATA_DIR, 'patients.json'), JSON.stringify(patients, null, 2));
fs.writeFileSync(path.join(DATA_DIR, 'wards.json'), JSON.stringify(wards, null, 2));
fs.writeFileSync(path.join(DATA_DIR, 'beds.json'), JSON.stringify(beds, null, 2));
fs.writeFileSync(path.join(DATA_DIR, 'inventory.json'), JSON.stringify(inventory, null, 2));
fs.writeFileSync(path.join(DATA_DIR, 'appointments.json'), JSON.stringify(appointments, null, 2));
fs.writeFileSync(path.join(DATA_DIR, 'billing.json'), JSON.stringify(billing, null, 2));
fs.writeFileSync(path.join(DATA_DIR, 'doctor-subscriptions.json'), JSON.stringify(docSubscriptions, null, 2));

console.log('Seed data generated successfully!');
