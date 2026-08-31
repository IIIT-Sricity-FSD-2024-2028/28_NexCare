const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ---------------------------------------------------------
// Helper Data & Realistic Synthetic Generator
// ---------------------------------------------------------

const regionsData = [
  {
    id: 'REG-AP-SOUTH',
    rmId: 'RM001',
    name: 'Anirudh Reddy',
    email: 'anirudh.reddy@nexcare.in',
    regionName: 'Andhra Pradesh South',
    cities: ['Tirupati', 'Nellore']
  },
  {
    id: 'REG-KA-SOUTH',
    rmId: 'RM002',
    name: 'Kavya Menon',
    email: 'kavya.menon@nexcare.in',
    regionName: 'Karnataka South',
    cities: ['Bengaluru', 'Mysuru']
  },
  {
    id: 'REG-MH-CENTRAL',
    rmId: 'RM003',
    name: 'Rohan Deshmukh',
    email: 'rohan.deshmukh@nexcare.in',
    regionName: 'Maharashtra Central',
    cities: ['Pune', 'Nashik']
  },
  {
    id: 'REG-TN-NORTH',
    rmId: 'RM004',
    name: 'Nandini Iyer',
    email: 'nandini.iyer@nexcare.in',
    regionName: 'Tamil Nadu North',
    cities: ['Chennai', 'Vellore']
  }
];

const hospitalsData = [
  // Region 1: AP South
  {
    id: 'H001',
    code: 'HOSP-AP01',
    regionId: 'REG-AP-SOUTH',
    rmId: 'RM001',
    name: 'Sri Venkateswara Multispeciality Hospital',
    city: 'Tirupati',
    state: 'Andhra Pradesh',
    pincode: '517501',
    address: '108 SV University Road, Tirupati',
    phone: '+91 877 2288990',
    email: 'contact.svh@nexcare.in',
    totalBeds: 120,
    occupiedBeds: 84,
    availableBeds: 36,
    managerId: 'HM-AP01',
    managerName: 'Priya Reddy',
    managerEmail: 'priya.reddy@nexcare.in',
    wards: [
      { name: 'General Ward', capacity: 45, occupied: 32 },
      { name: 'ICU', capacity: 12, occupied: 9 },
      { name: 'CCU', capacity: 8, occupied: 6 },
      { name: 'Emergency Ward', capacity: 15, occupied: 10 },
      { name: 'Paediatric Ward', capacity: 20, occupied: 14 },
      { name: 'Maternity Ward', capacity: 20, occupied: 13 }
    ]
  },
  {
    id: 'H002',
    code: 'HOSP-AP02',
    regionId: 'REG-AP-SOUTH',
    rmId: 'RM001',
    name: 'Coastal Care Hospital',
    city: 'Nellore',
    state: 'Andhra Pradesh',
    pincode: '524001',
    address: '45 Trunk Road, Dargamitta, Nellore',
    phone: '+91 861 2345678',
    email: 'contact.coastal@nexcare.in',
    totalBeds: 80,
    occupiedBeds: 55,
    availableBeds: 25,
    managerId: 'HM-AP02',
    managerName: 'Arjun Varma',
    managerEmail: 'arjun.varma@nexcare.in',
    wards: [
      { name: 'General Ward', capacity: 35, occupied: 24 },
      { name: 'ICU', capacity: 8, occupied: 6 },
      { name: 'CCU', capacity: 5, occupied: 3 },
      { name: 'Emergency Ward', capacity: 12, occupied: 8 },
      { name: 'Paediatric Ward', capacity: 10, occupied: 7 },
      { name: 'Maternity Ward', capacity: 10, occupied: 7 }
    ]
  },

  // Region 2: KA South
  {
    id: 'H003',
    code: 'HOSP-KA01',
    regionId: 'REG-KA-SOUTH',
    rmId: 'RM002',
    name: 'Namma Health Multispeciality',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    address: '77 MG Road, Indiranagar, Bengaluru',
    phone: '+91 80 41238900',
    email: 'contact.namma@nexcare.in',
    totalBeds: 160,
    occupiedBeds: 112,
    availableBeds: 48,
    managerId: 'HM-KA01',
    managerName: 'Sneha Rao',
    managerEmail: 'sneha.rao@nexcare.in',
    wards: [
      { name: 'General Ward', capacity: 60, occupied: 42 },
      { name: 'ICU', capacity: 20, occupied: 15 },
      { name: 'CCU', capacity: 10, occupied: 7 },
      { name: 'Emergency Ward', capacity: 20, occupied: 14 },
      { name: 'Paediatric Ward', capacity: 25, occupied: 17 },
      { name: 'Maternity Ward', capacity: 25, occupied: 17 }
    ]
  },
  {
    id: 'H004',
    code: 'HOSP-KA02',
    regionId: 'REG-KA-SOUTH',
    rmId: 'RM002',
    name: 'Cauvery City Hospital',
    city: 'Mysuru',
    state: 'Karnataka',
    pincode: '570001',
    address: '12 Sayyaji Rao Road, Mysuru',
    phone: '+91 821 2511223',
    email: 'contact.cauvery@nexcare.in',
    totalBeds: 95,
    occupiedBeds: 73,
    availableBeds: 22,
    managerId: 'HM-KA02',
    managerName: 'Karthik Shetty',
    managerEmail: 'karthik.shetty@nexcare.in',
    wards: [
      { name: 'General Ward', capacity: 40, occupied: 31 },
      { name: 'ICU', capacity: 10, occupied: 8 },
      { name: 'CCU', capacity: 5, occupied: 4 },
      { name: 'Emergency Ward', capacity: 15, occupied: 11 },
      { name: 'Paediatric Ward', capacity: 12, occupied: 9 },
      { name: 'Maternity Ward', capacity: 13, occupied: 10 }
    ]
  },

  // Region 3: MH Central
  {
    id: 'H005',
    code: 'HOSP-MH01',
    regionId: 'REG-MH-CENTRAL',
    rmId: 'RM003',
    name: 'Sahyadri Care Hospital',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411004',
    address: '34 Karve Road, Deccan Gymkhana, Pune',
    phone: '+91 20 25438800',
    email: 'contact.sahyadri@nexcare.in',
    totalBeds: 140,
    occupiedBeds: 98,
    availableBeds: 42,
    managerId: 'HM-MH01',
    managerName: 'Neha Kulkarni',
    managerEmail: 'neha.kulkarni@nexcare.in',
    wards: [
      { name: 'General Ward', capacity: 50, occupied: 35 },
      { name: 'ICU', capacity: 18, occupied: 13 },
      { name: 'CCU', capacity: 10, occupied: 7 },
      { name: 'Emergency Ward', capacity: 18, occupied: 12 },
      { name: 'Paediatric Ward', capacity: 22, occupied: 15 },
      { name: 'Maternity Ward', capacity: 22, occupied: 16 }
    ]
  },
  {
    id: 'H006',
    code: 'HOSP-MH02',
    regionId: 'REG-MH-CENTRAL',
    rmId: 'RM003',
    name: 'Deccan Multispeciality Centre',
    city: 'Nashik',
    state: 'Maharashtra',
    pincode: '422002',
    address: '89 College Road, Nashik',
    phone: '+91 253 2314455',
    email: 'contact.deccan@nexcare.in',
    totalBeds: 110,
    occupiedBeds: 77,
    availableBeds: 33,
    managerId: 'HM-MH02',
    managerName: 'Aditya Patil',
    managerEmail: 'aditya.patil@nexcare.in',
    wards: [
      { name: 'General Ward', capacity: 42, occupied: 29 },
      { name: 'ICU', capacity: 14, occupied: 10 },
      { name: 'CCU', capacity: 8, occupied: 5 },
      { name: 'Emergency Ward', capacity: 16, occupied: 11 },
      { name: 'Paediatric Ward', capacity: 15, occupied: 11 },
      { name: 'Maternity Ward', capacity: 15, occupied: 11 }
    ]
  },

  // Region 4: TN North
  {
    id: 'H007',
    code: 'HOSP-TN01',
    regionId: 'REG-TN-NORTH',
    rmId: 'RM004',
    name: 'Chennai Lifeline Hospital',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600006',
    address: '15 Anna Salai, Thousand Lights, Chennai',
    phone: '+91 44 28290011',
    email: 'contact.lifeline@nexcare.in',
    totalBeds: 150,
    occupiedBeds: 105,
    availableBeds: 45,
    managerId: 'HM-TN01',
    managerName: 'Meera Krishnan',
    managerEmail: 'meera.krishnan@nexcare.in',
    wards: [
      { name: 'General Ward', capacity: 55, occupied: 38 },
      { name: 'ICU', capacity: 20, occupied: 14 },
      { name: 'CCU', capacity: 10, occupied: 7 },
      { name: 'Emergency Ward', capacity: 20, occupied: 14 },
      { name: 'Paediatric Ward', capacity: 22, occupied: 15 },
      { name: 'Maternity Ward', capacity: 23, occupied: 17 }
    ]
  },
  {
    id: 'H008',
    code: 'HOSP-TN02',
    regionId: 'REG-TN-NORTH',
    rmId: 'RM004',
    name: 'Kaveri Medical Centre',
    city: 'Vellore',
    state: 'Tamil Nadu',
    pincode: '632004',
    address: '22 Arcot Road, Vellore',
    phone: '+91 416 2223344',
    email: 'contact.kaverivellore@nexcare.in',
    totalBeds: 100,
    occupiedBeds: 70,
    availableBeds: 30,
    managerId: 'HM-TN02',
    managerName: 'Vignesh Raman',
    managerEmail: 'vignesh.raman@nexcare.in',
    wards: [
      { name: 'General Ward', capacity: 40, occupied: 28 },
      { name: 'ICU', capacity: 12, occupied: 8 },
      { name: 'CCU', capacity: 8, occupied: 5 },
      { name: 'Emergency Ward', capacity: 15, occupied: 10 },
      { name: 'Paediatric Ward', capacity: 12, occupied: 9 },
      { name: 'Maternity Ward', capacity: 13, occupied: 10 }
    ]
  }
];

// Names database for synthetic doctor, admin, patient generation
const indianDoctorNames = [
  // H001 (Tirupati)
  [
    { name: 'Dr. Sunita Sharma', dept: 'Cardiology', spec: 'Interventional Cardiology', fee: 900, exp: 14, qual: 'MBBS, MD, DM', email: 'sunita@nexcare.com', id: 'U005' },
    { name: 'Dr. Harini Reddy', dept: 'General Medicine', spec: 'Internal Medicine', fee: 800, exp: 12, qual: 'MBBS, MD', email: 'harini.reddy@nexcare.in', id: 'DOC-AP01-002' },
    { name: 'Dr. Vikram Patel', dept: 'Orthopaedics', spec: 'Joint Replacement', fee: 850, exp: 11, qual: 'MBBS, MS (Ortho)', email: 'vikram@nexcare.in', id: 'U006' },
    { name: 'Dr. Sarah Smith', dept: 'Neurology', spec: 'Stroke & Neuromuscular', fee: 1000, exp: 15, qual: 'MBBS, DM (Neuro)', email: 'sarah.smith@nexcare.com', id: 'U009' },
    { name: 'Dr. Rajesh Rao', dept: 'Paediatrics', spec: 'Child Care & Neonatology', fee: 700, exp: 9, qual: 'MBBS, DCH, MD', email: 'rajesh.rao@nexcare.in', id: 'DOC-AP01-005' },
    { name: 'Dr. Anjali Desai', dept: 'Dermatology', spec: 'Cosmetic Dermatology', fee: 750, exp: 8, qual: 'MBBS, MD (Derm)', email: 'anjali@nexcare.in', id: 'U007' }
  ],
  // H002 (Nellore)
  [
    { name: 'Dr. Srinivas Varma', dept: 'Cardiology', spec: 'Clinical Cardiology', fee: 800, exp: 13, qual: 'MBBS, MD, DM', email: 'srinivas.varma@nexcare.in', id: 'DOC-AP02-001' },
    { name: 'Dr. Swati Naidu', dept: 'General Medicine', spec: 'Diabetology', fee: 700, exp: 10, qual: 'MBBS, MD', email: 'swati.naidu@nexcare.in', id: 'DOC-AP02-002' },
    { name: 'Dr. Arvind Swamy', dept: 'Orthopaedics', spec: 'Trauma & Arthroscopy', fee: 850, exp: 12, qual: 'MBBS, MS (Ortho)', email: 'arvind.swamy@nexcare.in', id: 'DOC-AP02-003' },
    { name: 'Dr. Bhavana Prasad', dept: 'Paediatrics', spec: 'Pediatric Care', fee: 650, exp: 7, qual: 'MBBS, DCH', email: 'bhavana.prasad@nexcare.in', id: 'DOC-AP02-004' },
    { name: 'Dr. Madhav Raju', dept: 'ENT', spec: 'Otology & Endoscopic Sinus', fee: 750, exp: 11, qual: 'MBBS, MS (ENT)', email: 'madhav.raju@nexcare.in', id: 'DOC-AP02-005' },
    { name: 'Dr. Leela Kothari', dept: 'Gynaecology', spec: 'Obstetrics & High Risk', fee: 900, exp: 15, qual: 'MBBS, MS (OBG)', email: 'leela.kothari@nexcare.in', id: 'DOC-AP02-006' }
  ],
  // H003 (Bengaluru)
  [
    { name: 'Dr. Ananya Hegde', dept: 'Cardiology', spec: 'Electrophysiology', fee: 1100, exp: 16, qual: 'MBBS, MD, DM', email: 'ananya.hegde@nexcare.in', id: 'DOC-KA01-001' },
    { name: 'Dr. Suresh Joshi', dept: 'Neurology', spec: 'Epilepsy & Movement', fee: 1200, exp: 18, qual: 'MBBS, DM (Neuro)', email: 'suresh.joshi@nexcare.in', id: 'DOC-KA01-002' },
    { name: 'Dr. Pradeep Gowda', dept: 'Orthopaedics', spec: 'Spine Surgery', fee: 1000, exp: 14, qual: 'MBBS, MS, MCh', email: 'pradeep.gowda@nexcare.in', id: 'DOC-KA01-003' },
    { name: 'Dr. Maya Kulkarni', dept: 'General Medicine', spec: 'Critical Care', fee: 850, exp: 10, qual: 'MBBS, MD', email: 'maya.kulkarni@nexcare.in', id: 'DOC-KA01-004' },
    { name: 'Dr. Kiran Shetty', dept: 'General Surgery', spec: 'Laparoscopic Surgery', fee: 950, exp: 13, qual: 'MBBS, MS (Gen Surg)', email: 'kiran.shetty@nexcare.in', id: 'DOC-KA01-005' },
    { name: 'Dr. Divya Ramesh', dept: 'Dermatology', spec: 'Dermatosurgery', fee: 800, exp: 9, qual: 'MBBS, MD', email: 'divya.ramesh@nexcare.in', id: 'DOC-KA01-006' }
  ],
  // H004 (Mysuru)
  [
    { name: 'Dr. Gautham Nambiar', dept: 'Cardiology', spec: 'Non-Invasive Cardiology', fee: 850, exp: 12, qual: 'MBBS, MD, DNB', email: 'gautham.nambiar@nexcare.in', id: 'DOC-KA02-001' },
    { name: 'Dr. Radhika Ursu', dept: 'Paediatrics', spec: 'Neonatal ICU', fee: 750, exp: 9, qual: 'MBBS, MD', email: 'radhika.ursu@nexcare.in', id: 'DOC-KA02-002' },
    { name: 'Dr. Chetan Kumar', dept: 'Orthopaedics', spec: 'Sports Injury', fee: 800, exp: 11, qual: 'MBBS, MS', email: 'chetan.kumar@nexcare.in', id: 'DOC-KA02-003' },
    { name: 'Dr. Preeti Shenoy', dept: 'ENT', spec: 'Rhinology', fee: 700, exp: 8, qual: 'MBBS, DLO, MS', email: 'preeti.shenoy@nexcare.in', id: 'DOC-KA02-004' },
    { name: 'Dr. Mahesh Bhat', dept: 'General Medicine', spec: 'Internal Medicine', fee: 700, exp: 10, qual: 'MBBS, MD', email: 'mahesh.bhat@nexcare.in', id: 'DOC-KA02-005' },
    { name: 'Dr. Shalini Rai', dept: 'Gynaecology', spec: 'Reproductive Health', fee: 850, exp: 13, qual: 'MBBS, DGO, MS', email: 'shalini.rai@nexcare.in', id: 'DOC-KA02-006' }
  ],
  // H005 (Pune)
  [
    { name: 'Dr. Tarun Kulkarni', dept: 'Cardiology', spec: 'Interventional Cardiology', fee: 1000, exp: 15, qual: 'MBBS, MD, DM', email: 'tarun.kulkarni@nexcare.in', id: 'DOC-MH01-001' },
    { name: 'Dr. Meenakshi Sundaram', dept: 'Neurology', spec: 'Cognitive Neurology', fee: 1100, exp: 16, qual: 'MBBS, DM', email: 'meenakshi.sundaram@nexcare.in', id: 'DOC-MH01-002' },
    { name: 'Dr. Sachin Shinde', dept: 'Orthopaedics', spec: 'Joint Replacement', fee: 900, exp: 12, qual: 'MBBS, MS', email: 'sachin.shinde@nexcare.in', id: 'DOC-MH01-003' },
    { name: 'Dr. Pooja Deshmukh', dept: 'Paediatrics', spec: 'General Paediatrics', fee: 750, exp: 9, qual: 'MBBS, MD', email: 'pooja.deshmukh@nexcare.in', id: 'DOC-MH01-004' },
    { name: 'Dr. Nitin Gadkari', dept: 'Emergency Medicine', spec: 'Trauma Emergency', fee: 850, exp: 10, qual: 'MBBS, MEM', email: 'nitin.gadkari@nexcare.in', id: 'DOC-MH01-005' },
    { name: 'Dr. Rekha Pawar', dept: 'Dermatology', spec: 'General Dermatology', fee: 750, exp: 8, qual: 'MBBS, DVD', email: 'rekha.pawar@nexcare.in', id: 'DOC-MH01-006' }
  ],
  // H006 (Nashik)
  [
    { name: 'Dr. Deepa Chawla', dept: 'Cardiology', spec: 'Preventive Cardiology', fee: 800, exp: 11, qual: 'MBBS, MD', email: 'deepa.chawla@nexcare.in', id: 'DOC-MH02-001' },
    { name: 'Dr. Amitav Ghosh', dept: 'General Medicine', spec: 'General Health', fee: 700, exp: 10, qual: 'MBBS, MD', email: 'amitav.ghosh@nexcare.in', id: 'DOC-MH02-002' },
    { name: 'Dr. Sanjay Borse', dept: 'Orthopaedics', spec: 'Fracture & Trauma', fee: 800, exp: 12, qual: 'MBBS, MS', email: 'sanjay.borse@nexcare.in', id: 'DOC-MH02-003' },
    { name: 'Dr. Sunita Jadhav', dept: 'Paediatrics', spec: 'Child Development', fee: 700, exp: 8, qual: 'MBBS, DCH', email: 'sunita.jadhav@nexcare.in', id: 'DOC-MH02-004' },
    { name: 'Dr. Rahul Sonawane', dept: 'ENT', spec: 'Throat & Head Neck', fee: 750, exp: 9, qual: 'MBBS, MS', email: 'rahul.sonawane@nexcare.in', id: 'DOC-MH02-005' },
    { name: 'Dr. Smita Wagh', dept: 'Gynaecology', spec: 'Maternal Care', fee: 850, exp: 14, qual: 'MBBS, MS', email: 'smita.wagh@nexcare.in', id: 'DOC-MH02-006' }
  ],
  // H007 (Chennai)
  [
    { name: 'Dr. V. Ramanathan', dept: 'Cardiology', spec: 'Cardiac Surgery & Interventions', fee: 1100, exp: 17, qual: 'MBBS, MS, MCh', email: 'v.ramanathan@nexcare.in', id: 'DOC-TN01-001' },
    { name: 'Dr. S. Jayaraman', dept: 'Neurology', spec: 'Neurovascular Surgery', fee: 1200, exp: 19, qual: 'MBBS, MCh (Neuro)', email: 's.jayaraman@nexcare.in', id: 'DOC-TN01-002' },
    { name: 'Dr. K. Ananthi', dept: 'General Medicine', spec: 'Rheumatology & Autoimmune', fee: 900, exp: 13, qual: 'MBBS, MD', email: 'k.ananthi@nexcare.in', id: 'DOC-TN01-003' },
    { name: 'Dr. R. Karthik', dept: 'Orthopaedics', spec: 'Knee & Shoulder Surgery', fee: 1000, exp: 15, qual: 'MBBS, MS', email: 'r.karthik@nexcare.in', id: 'DOC-TN01-004' },
    { name: 'Dr. M. Chitra', dept: 'Gynaecology', spec: 'Laparoscopic Gynaecology', fee: 950, exp: 14, qual: 'MBBS, MD', email: 'm.chitra@nexcare.in', id: 'DOC-TN01-005' },
    { name: 'Dr. P. Sundar', dept: 'Dermatology', spec: 'Trichology & Aesthetics', fee: 850, exp: 10, qual: 'MBBS, MD', email: 'p.sundar@nexcare.in', id: 'DOC-TN01-006' }
  ],
  // H008 (Vellore)
  [
    { name: 'Dr. T. Venugopal', dept: 'Cardiology', spec: 'Clinical & Invasive Cardiology', fee: 850, exp: 12, qual: 'MBBS, MD, DM', email: 't.venugopal@nexcare.in', id: 'DOC-TN02-001' },
    { name: 'Dr. N. Gayathri', dept: 'General Medicine', spec: 'Infectious Diseases', fee: 750, exp: 10, qual: 'MBBS, MD', email: 'n.gayathri@nexcare.in', id: 'DOC-TN02-002' },
    { name: 'Dr. S. Balaji', dept: 'Orthopaedics', spec: 'Pediatric Orthopaedics', fee: 800, exp: 11, qual: 'MBBS, MS', email: 's.balaji@nexcare.in', id: 'DOC-TN02-003' },
    { name: 'Dr. U. Malathi', dept: 'Paediatrics', spec: 'Adolescent Medicine', fee: 700, exp: 8, qual: 'MBBS, DCH', email: 'u.malathi@nexcare.in', id: 'DOC-TN02-004' },
    { name: 'Dr. G. Loganathan', dept: 'General Surgery', spec: 'Hernia & Gastro Surgery', fee: 850, exp: 13, qual: 'MBBS, MS', email: 'g.loganathan@nexcare.in', id: 'DOC-TN02-005' },
    { name: 'Dr. E. Soundarya', dept: 'ENT', spec: 'Laryngology', fee: 700, exp: 9, qual: 'MBBS, MS', email: 'e.soundarya@nexcare.in', id: 'DOC-TN02-006' }
  ]
];

const adminStaffData = [
  // H001
  [
    { name: 'Lakshmi Naidu', dept: 'Front Desk / Patient Registration', email: 'admin@nexcare.com', id: 'U002' },
    { name: 'Suresh Babu', dept: 'Inventory / Procurement', email: 'suresh.babu@nexcare.in', id: 'ADM-AP01-02' },
    { name: 'Divya Reddy', dept: 'Billing / Appointments', email: 'divya.reddy@nexcare.in', id: 'ADM-AP01-03' },
    { name: 'Kiran Kumar', dept: 'Bed Allocation & Admissions', email: 'kiran.kumar@nexcare.in', id: 'ADM-AP01-04' }
  ],
  // H002
  [
    { name: 'Ramesh Verma', dept: 'Front Desk', email: 'ramesh.verma@nexcare.in', id: 'ADM-AP02-01' },
    { name: 'Latha Raju', dept: 'Billing', email: 'latha.raju@nexcare.in', id: 'ADM-AP02-02' },
    { name: 'Venu Gopal', dept: 'Inventory', email: 'venu.gopal@nexcare.in', id: 'ADM-AP02-03' },
    { name: 'Kavitha Swamy', dept: 'Scheduling', email: 'kavitha.swamy@nexcare.in', id: 'ADM-AP02-04' }
  ],
  // H003
  [
    { name: 'Nikhil Rao', dept: 'Front Desk', email: 'nikhil.rao@nexcare.in', id: 'ADM-KA01-01' },
    { name: 'Deepika Gowda', dept: 'Billing & TPA', email: 'deepika.gowda@nexcare.in', id: 'ADM-KA01-02' },
    { name: 'Prashanth Bhat', dept: 'Inventory & Supplies', email: 'prashanth.bhat@nexcare.in', id: 'ADM-KA01-03' },
    { name: 'Vidya Murthy', dept: 'Admissions & Beds', email: 'vidya.murthy@nexcare.in', id: 'ADM-KA01-04' }
  ],
  // H004
  [
    { name: 'Shruti Ursu', dept: 'Front Desk', email: 'shruti.ursu@nexcare.in', id: 'ADM-KA02-01' },
    { name: 'Manjunath Hegde', dept: 'Billing', email: 'manjunath.hegde@nexcare.in', id: 'ADM-KA02-02' },
    { name: 'Sowmya Rai', dept: 'Inventory', email: 'sowmya.rai@nexcare.in', id: 'ADM-KA02-03' },
    { name: 'Ganesh Shetty', dept: 'Scheduling', email: 'ganesh.shetty@nexcare.in', id: 'ADM-KA02-04' }
  ],
  // H005
  [
    { name: 'Amit Shinde', dept: 'Front Desk', email: 'amit.shinde@nexcare.in', id: 'ADM-MH01-01' },
    { name: 'Pooja Kadam', dept: 'Billing & Cashless', email: 'pooja.kadam@nexcare.in', id: 'ADM-MH01-02' },
    { name: 'Rohan More', dept: 'Inventory', email: 'rohan.more@nexcare.in', id: 'ADM-MH01-03' },
    { name: 'Snehal Joshi', dept: 'Patient Experience', email: 'snehal.joshi@nexcare.in', id: 'ADM-MH01-04' }
  ],
  // H006
  [
    { name: 'Vikas Pawar', dept: 'Front Desk', email: 'vikas.pawar@nexcare.in', id: 'ADM-MH02-01' },
    { name: 'Anagha Deshpande', dept: 'Billing', email: 'anagha.deshpande@nexcare.in', id: 'ADM-MH02-02' },
    { name: 'Sujay Patil', dept: 'Inventory', email: 'sujay.patil@nexcare.in', id: 'ADM-MH02-03' },
    { name: 'Mansi Borse', dept: 'Admissions', email: 'mansi.borse@nexcare.in', id: 'ADM-MH02-04' }
  ],
  // H007
  [
    { name: 'S. Vijay', dept: 'Front Desk', email: 's.vijay@nexcare.in', id: 'ADM-TN01-01' },
    { name: 'R. Priyadarshini', dept: 'Billing', email: 'r.priyadarshini@nexcare.in', id: 'ADM-TN01-02' },
    { name: 'M. Saravanan', dept: 'Inventory', email: 'm.saravanan@nexcare.in', id: 'ADM-TN01-03' },
    { name: 'K. Nithya', dept: 'Scheduling', email: 'k.nithya@nexcare.in', id: 'ADM-TN01-04' }
  ],
  // H008
  [
    { name: 'A. Dinesh', dept: 'Front Desk', email: 'a.dinesh@nexcare.in', id: 'ADM-TN02-01' },
    { name: 'P. Revathi', dept: 'Billing', email: 'p.revathi@nexcare.in', id: 'ADM-TN02-02' },
    { name: 'T. Sathish', dept: 'Inventory', email: 't.sathish@nexcare.in', id: 'ADM-TN02-03' },
    { name: 'V. Keerthana', dept: 'Patient Helpdesk', email: 'v.keerthana@nexcare.in', id: 'ADM-TN02-04' }
  ]
];

const patientData = [
  // H001 (Tirupati)
  [
    { name: 'John Anderson', age: 34, gender: 'Male', city: 'Tirupati', phone: '+91 98480 11223', email: 'patient@gmail.com', pid: 'P001', userId: 'U004', bloodGroup: 'O+' },
    { name: 'Sravani Reddy', age: 27, gender: 'Female', city: 'Tirupati', phone: '+91 98480 22334', email: 'sravani.reddy@example.in', pid: 'P002', userId: 'PAT-LOGIN-H1-2', bloodGroup: 'A+' },
    { name: 'Venkat Rao', age: 48, gender: 'Male', city: 'Tirupati', phone: '+91 98480 33445', email: 'venkat.rao@example.in', pid: 'P003', userId: 'PAT-LOGIN-H1-3', bloodGroup: 'B+' },
    { name: 'Kavitha Naidu', age: 42, gender: 'Female', city: 'Tirupati', phone: '+91 98480 44556', email: 'kavitha.n@example.in', pid: 'P004', bloodGroup: 'AB+' },
    { name: 'Subrahmanyam Sharma', age: 61, gender: 'Male', city: 'Tirupati', phone: '+91 98480 55667', email: 'subrah.s@example.in', pid: 'P005', bloodGroup: 'O-' },
    { name: 'Padmavathi K', age: 53, gender: 'Female', city: 'Tirupati', phone: '+91 98480 66778', email: 'padma.k@example.in', pid: 'P006', bloodGroup: 'B-' },
    { name: 'Bhaskar Raju', age: 39, gender: 'Male', city: 'Tirupati', phone: '+91 98480 77889', email: 'bhaskar.r@example.in', pid: 'P007', bloodGroup: 'A-' },
    { name: 'Master Aarav', age: 6, gender: 'Male', city: 'Tirupati', phone: '+91 98480 88990', email: 'aarav.parent@example.in', pid: 'P008', bloodGroup: 'O+' }
  ],
  // H002 (Nellore)
  [
    { name: 'Karthik Varma', age: 31, gender: 'Male', city: 'Nellore', phone: '+91 98481 11223', email: 'karthik.v@example.in', pid: 'P009', userId: 'PAT-LOGIN-H2-1', bloodGroup: 'B+' },
    { name: 'Gayathri Devi', age: 29, gender: 'Female', city: 'Nellore', phone: '+91 98481 22334', email: 'gayathri.d@example.in', pid: 'P010', userId: 'PAT-LOGIN-H2-2', bloodGroup: 'A+' },
    { name: 'Rahul Verma', age: 38, gender: 'Male', city: 'Nellore', phone: '+91 98481 33445', email: 'rahul.v@example.in', pid: 'P011', userId: 'PAT-LOGIN-H2-3', bloodGroup: 'O+' },
    { name: 'Sailaja Rani', age: 45, gender: 'Female', city: 'Nellore', phone: '+91 98481 44556', email: 'sailaja.r@example.in', pid: 'P012', bloodGroup: 'AB-' },
    { name: 'Narayana Murthy', age: 67, gender: 'Male', city: 'Nellore', phone: '+91 98481 55667', email: 'narayana.m@example.in', pid: 'P013', bloodGroup: 'A+' },
    { name: 'Lakshmi Kantham', age: 58, gender: 'Female', city: 'Nellore', phone: '+91 98481 66778', email: 'lakshmi.k@example.in', pid: 'P014', bloodGroup: 'O+' },
    { name: 'Srinivasulu P', age: 50, gender: 'Male', city: 'Nellore', phone: '+91 98481 77889', email: 'srini.p@example.in', pid: 'P015', bloodGroup: 'B+' },
    { name: 'Deepthi S', age: 24, gender: 'Female', city: 'Nellore', phone: '+91 98481 88990', email: 'deepthi.s@example.in', pid: 'P016', bloodGroup: 'AB+' }
  ],
  // H003 (Bengaluru)
  [
    { name: 'Manoj Prasad', age: 52, gender: 'Male', city: 'Bengaluru', phone: '+91 98800 11223', email: 'manoj.prasad@example.in', pid: 'P017', userId: 'PAT-LOGIN-H3-1', bloodGroup: 'O+' },
    { name: 'Pooja Hegde', age: 28, gender: 'Female', city: 'Bengaluru', phone: '+91 98800 22334', email: 'pooja.h@example.in', pid: 'P018', userId: 'PAT-LOGIN-H3-2', bloodGroup: 'A+' },
    { name: 'Varun Gowda', age: 36, gender: 'Male', city: 'Bengaluru', phone: '+91 98800 33445', email: 'varun.gowda@example.in', pid: 'P019', userId: 'PAT-LOGIN-H3-3', bloodGroup: 'B+' },
    { name: 'Shweta Bhat', age: 33, gender: 'Female', city: 'Bengaluru', phone: '+91 98800 44556', email: 'shweta.b@example.in', pid: 'P020', bloodGroup: 'AB+' },
    { name: 'Ananth Kumar', age: 60, gender: 'Male', city: 'Bengaluru', phone: '+91 98800 55667', email: 'ananth.k@example.in', pid: 'P021', bloodGroup: 'O-' },
    { name: 'Sujatha Shenoy', age: 55, gender: 'Female', city: 'Bengaluru', phone: '+91 98800 66778', email: 'sujatha.s@example.in', pid: 'P022', bloodGroup: 'A-' },
    { name: 'Tejas Murthy', age: 26, gender: 'Male', city: 'Bengaluru', phone: '+91 98800 77889', email: 'tejas.m@example.in', pid: 'P023', bloodGroup: 'B+' },
    { name: 'Rashmi Rao', age: 41, gender: 'Female', city: 'Bengaluru', phone: '+91 98800 88990', email: 'rashmi.r@example.in', pid: 'P024', bloodGroup: 'O+' }
  ],
  // H004 (Mysuru)
  [
    { name: 'Basavaraj Ursu', age: 59, gender: 'Male', city: 'Mysuru', phone: '+91 98801 11223', email: 'basavaraj.u@example.in', pid: 'P025', userId: 'PAT-LOGIN-H4-1', bloodGroup: 'B+' },
    { name: 'Divya Shetty', age: 30, gender: 'Female', city: 'Mysuru', phone: '+91 98801 22334', email: 'divya.s@example.in', pid: 'P026', userId: 'PAT-LOGIN-H4-2', bloodGroup: 'A+' },
    { name: 'Chetan Rai', age: 44, gender: 'Male', city: 'Mysuru', phone: '+91 98801 33445', email: 'chetan.r@example.in', pid: 'P027', userId: 'PAT-LOGIN-H4-3', bloodGroup: 'O+' },
    { name: 'Anupama Bhat', age: 49, gender: 'Female', city: 'Mysuru', phone: '+91 98801 44556', email: 'anupama.b@example.in', pid: 'P028', bloodGroup: 'AB+' },
    { name: 'Girish Prasad', age: 37, gender: 'Male', city: 'Mysuru', phone: '+91 98801 55667', email: 'girish.p@example.in', pid: 'P029', bloodGroup: 'A-' },
    { name: 'Nayana Gowda', age: 25, gender: 'Female', city: 'Mysuru', phone: '+91 98801 66778', email: 'nayana.g@example.in', pid: 'P030', bloodGroup: 'O+' },
    { name: 'Soma Sekhar', age: 63, gender: 'Male', city: 'Mysuru', phone: '+91 98801 77889', email: 'soma.s@example.in', pid: 'P031', bloodGroup: 'B-' },
    { name: 'Roopa Naik', age: 32, gender: 'Female', city: 'Mysuru', phone: '+91 98801 88990', email: 'roopa.n@example.in', pid: 'P032', bloodGroup: 'O+' }
  ],
  // H005 (Pune)
  [
    { name: 'Rohan Joshi', age: 35, gender: 'Male', city: 'Pune', phone: '+91 98220 11223', email: 'rohan.j@example.in', pid: 'P033', userId: 'PAT-LOGIN-H5-1', bloodGroup: 'O+' },
    { name: 'Swati Kulkarni', age: 40, gender: 'Female', city: 'Pune', phone: '+91 98220 22334', email: 'swati.k@example.in', pid: 'P034', userId: 'PAT-LOGIN-H5-2', bloodGroup: 'A+' },
    { name: 'Ajinkya Shinde', age: 47, gender: 'Male', city: 'Pune', phone: '+91 98220 33445', email: 'ajinkya.s@example.in', pid: 'P035', userId: 'PAT-LOGIN-H5-3', bloodGroup: 'B+' },
    { name: 'Snehal Deshpande', age: 29, gender: 'Female', city: 'Pune', phone: '+91 98220 44556', email: 'snehal.d@example.in', pid: 'P036', bloodGroup: 'AB+' },
    { name: 'Milind Patil', age: 56, gender: 'Male', city: 'Pune', phone: '+91 98220 55667', email: 'milind.p@example.in', pid: 'P037', bloodGroup: 'O-' },
    { name: 'Tanvi Pawar', age: 31, gender: 'Female', city: 'Pune', phone: '+91 98220 66778', email: 'tanvi.p@example.in', pid: 'P038', bloodGroup: 'A+' },
    { name: 'Dnyaneshwar More', age: 68, gender: 'Male', city: 'Pune', phone: '+91 98220 77889', email: 'dnyan.m@example.in', pid: 'P039', bloodGroup: 'B+' },
    { name: 'Ashwini Gadkari', age: 43, gender: 'Female', city: 'Pune', phone: '+91 98220 88990', email: 'ashwini.g@example.in', pid: 'P040', bloodGroup: 'O+' }
  ],
  // H006 (Nashik)
  [
    { name: 'Sanjay Borse', age: 50, gender: 'Male', city: 'Nashik', phone: '+91 98221 11223', email: 'sanjay.b@example.in', pid: 'P041', userId: 'PAT-LOGIN-H6-1', bloodGroup: 'B+' },
    { name: 'Pallavi Sonawane', age: 32, gender: 'Female', city: 'Nashik', phone: '+91 98221 22334', email: 'pallavi.s@example.in', pid: 'P042', userId: 'PAT-LOGIN-H6-2', bloodGroup: 'A+' },
    { name: 'Ganesh Jadhav', age: 45, gender: 'Male', city: 'Nashik', phone: '+91 98221 33445', email: 'ganesh.j@example.in', pid: 'P043', userId: 'PAT-LOGIN-H6-3', bloodGroup: 'O+' },
    { name: 'Priyanka Wagh', age: 27, gender: 'Female', city: 'Nashik', phone: '+91 98221 44556', email: 'priyanka.w@example.in', pid: 'P044', bloodGroup: 'AB-' },
    { name: 'Kashinath Khairnar', age: 65, gender: 'Male', city: 'Nashik', phone: '+91 98221 55667', email: 'kashi.k@example.in', pid: 'P045', bloodGroup: 'A+' },
    { name: 'Archana Ahire', age: 39, gender: 'Female', city: 'Nashik', phone: '+91 98221 66778', email: 'archana.a@example.in', pid: 'P046', bloodGroup: 'O+' },
    { name: 'Bhushan Chaudhari', age: 34, gender: 'Male', city: 'Nashik', phone: '+91 98221 77889', email: 'bhushan.c@example.in', pid: 'P047', bloodGroup: 'B+' },
    { name: 'Nisha Bhamre', age: 28, gender: 'Female', city: 'Nashik', phone: '+91 98221 88990', email: 'nisha.b@example.in', pid: 'P048', bloodGroup: 'O+' }
  ],
  // H007 (Chennai)
  [
    { name: 'S. Karthikeyan', age: 42, gender: 'Male', city: 'Chennai', phone: '+91 94440 11223', email: 's.karthik@example.in', pid: 'P049', userId: 'PAT-LOGIN-H7-1', bloodGroup: 'O+' },
    { name: 'R. Vijayalakshmi', age: 51, gender: 'Female', city: 'Chennai', phone: '+91 94440 22334', email: 'r.vijaya@example.in', pid: 'P050', userId: 'PAT-LOGIN-H7-2', bloodGroup: 'A+' },
    { name: 'M. Saravanan', age: 36, gender: 'Male', city: 'Chennai', phone: '+91 94440 33445', email: 'm.saravana@example.in', pid: 'P051', userId: 'PAT-LOGIN-H7-3', bloodGroup: 'B+' },
    { name: 'K. Thenmozhi', age: 29, gender: 'Female', city: 'Chennai', phone: '+91 94440 44556', email: 'k.thenu@example.in', pid: 'P052', bloodGroup: 'AB+' },
    { name: 'P. Balasubramanian', age: 64, gender: 'Male', city: 'Chennai', phone: '+91 94440 55667', email: 'p.balu@example.in', pid: 'P053', bloodGroup: 'O-' },
    { name: 'T. Kavitha', age: 46, gender: 'Female', city: 'Chennai', phone: '+91 94440 66778', email: 't.kavitha@example.in', pid: 'P054', bloodGroup: 'A-' },
    { name: 'G. Dinesh', age: 31, gender: 'Male', city: 'Chennai', phone: '+91 94440 77889', email: 'g.dinesh@example.in', pid: 'P055', bloodGroup: 'B+' },
    { name: 'N. Anusuya', age: 37, gender: 'Female', city: 'Chennai', phone: '+91 94440 88990', email: 'n.anusuya@example.in', pid: 'P056', bloodGroup: 'O+' }
  ],
  // H008 (Vellore)
  [
    { name: 'A. Sathish', age: 39, gender: 'Male', city: 'Vellore', phone: '+91 94441 11223', email: 'a.sathish@example.in', pid: 'P057', userId: 'PAT-LOGIN-H8-1', bloodGroup: 'B+' },
    { name: 'V. Sangeetha', age: 33, gender: 'Female', city: 'Vellore', phone: '+91 94441 22334', email: 'v.sangeetha@example.in', pid: 'P058', userId: 'PAT-LOGIN-H8-2', bloodGroup: 'A+' },
    { name: 'E. Srinivasan', age: 58, gender: 'Male', city: 'Vellore', phone: '+91 94441 33445', email: 'e.srini@example.in', pid: 'P059', userId: 'PAT-LOGIN-H8-3', bloodGroup: 'O+' },
    { name: 'D. Kalpana', age: 47, gender: 'Female', city: 'Vellore', phone: '+91 94441 44556', email: 'd.kalpana@example.in', pid: 'P060', bloodGroup: 'AB+' },
    { name: 'K. Mohan', age: 62, gender: 'Male', city: 'Vellore', phone: '+91 94441 55667', email: 'k.mohan@example.in', pid: 'P061', bloodGroup: 'A-' },
    { name: 'S. Hemalatha', age: 40, gender: 'Female', city: 'Vellore', phone: '+91 94441 66778', email: 's.hema@example.in', pid: 'P062', bloodGroup: 'O+' },
    { name: 'M. Vignesh', age: 28, gender: 'Male', city: 'Vellore', phone: '+91 94441 77889', email: 'm.vignesh@example.in', pid: 'P063', bloodGroup: 'B+' },
    { name: 'R. Abirami', age: 26, gender: 'Female', city: 'Vellore', phone: '+91 94441 88990', email: 'r.abirami@example.in', pid: 'P064', bloodGroup: 'O+' }
  ]
];

const inventoryItemTemplates = [
  { name: 'Surgical Gloves (Powder Free)', category: 'Consumables', unit: 'Boxes', baseMin: 50, cost: 450 },
  { name: 'N95 Respirator Masks', category: 'PPE', unit: 'Boxes', baseMin: 60, cost: 1200 },
  { name: 'ECG Electrodes (Adult)', category: 'Consumables', unit: 'Packs', baseMin: 40, cost: 350 },
  { name: 'IV Fluids (Normal Saline 500ml)', category: 'Pharmaceuticals', unit: 'Bottles', baseMin: 100, cost: 65 },
  { name: 'Disposable Syringes (5ml)', category: 'Consumables', unit: 'Boxes', baseMin: 80, cost: 280 },
  { name: 'Oxygen Masks (Adult High Flow)', category: 'Equipment', unit: 'Units', baseMin: 30, cost: 180 },
  { name: 'Defibrillator Disposable Pads', category: 'Equipment', unit: 'Pairs', baseMin: 15, cost: 1500 },
  { name: 'Sterile Gauze Rolls (10cm)', category: 'Consumables', unit: 'Rolls', baseMin: 120, cost: 45 },
  { name: 'Ringer Lactate Solution 500ml', category: 'Pharmaceuticals', unit: 'Bottles', baseMin: 90, cost: 75 },
  { name: 'IV Cannula (20G Pink)', category: 'Consumables', unit: 'Boxes', baseMin: 50, cost: 600 },
  { name: 'Surgical Sutures (Absorbable 3-0)', category: 'Surgical Supplies', unit: 'Packs', baseMin: 25, cost: 950 },
  { name: 'Insulin Syringes (1ml 31G)', category: 'Consumables', unit: 'Boxes', baseMin: 40, cost: 380 },
  { name: 'Disposable Isolation Gowns', category: 'PPE', unit: 'Pieces', baseMin: 70, cost: 220 },
  { name: 'Pulse Oximeter Finger Sensor Probes', category: 'Equipment', unit: 'Units', baseMin: 10, cost: 1800 },
  { name: 'Nebuliser Mask & Tubing Kits', category: 'Consumables', unit: 'Kits', baseMin: 35, cost: 140 }
];

function calculateInventoryStatus(qty, min) {
  if (qty === 0) return 'OUT_OF_STOCK';
  if (qty < min * 0.25) return 'CRITICAL';
  if (qty < min) return 'LOW_STOCK';
  return 'NORMAL';
}

// ---------------------------------------------------------
// Build Comprehensive Entities
// ---------------------------------------------------------

let users = [];
let hospitals = [];
let patients = [];
let wards = [];
let beds = [];
let inventory = [];
let appointments = [];
let leaves = [];
let schedules = [];
let billing = [];
let ambulances = [];

// 1. Superuser
users.push({
  id: 'U001',
  name: 'Super Admin',
  email: 'superuser@nexcare.com',
  role: 'superuser',
  status: 'Active',
  password: 'Password123'
});

// 2. Regional Officers (4 ROs)
regionsData.forEach((reg) => {
  users.push({
    id: reg.rmId,
    name: reg.name,
    email: reg.email,
    role: 'regional_manager',
    status: 'Active',
    password: 'Password123',
    regionId: reg.id,
    regionName: reg.regionName,
    areas: reg.cities
  });
});

// Add canonical legacy fallback alias for Regional Officer 1
users.push({
  id: 'RM000',
  name: 'Anirudh Reddy (Alias)',
  email: 'regional@nexcare.com',
  role: 'regional_manager',
  status: 'Active',
  password: 'Password123',
  regionId: 'REG-AP-SOUTH',
  regionName: 'Andhra Pradesh South',
  areas: ['Tirupati', 'Nellore']
});

// 3. Hospitals & Managers & Staff & Doctors & Patients
hospitalsData.forEach((h, hIdx) => {
  // Add Hospital
  hospitals.push({
    id: h.id,
    code: h.code,
    name: h.name,
    registrationNumber: `REG-${h.city.substring(0, 3).toUpperCase()}-${h.id}`,
    type: hIdx % 2 === 0 ? 'Super Speciality' : 'Multispeciality',
    ownershipType: 'Private',
    address: h.address,
    city: h.city,
    state: h.state,
    pincode: h.pincode,
    phone: h.phone,
    email: h.email,
    regionId: h.regionId,
    regionName: regionsData.find(r => r.id === h.regionId)?.regionName || '',
    assignedManagerId: h.rmId,
    hospitalManagerId: h.managerId,
    hospitalManagerName: h.managerName,
    totalBeds: h.totalBeds,
    occupiedBeds: h.occupiedBeds,
    availableBeds: h.availableBeds,
    icuBeds: h.wards.find(w => w.name === 'ICU')?.capacity || 10,
    specialities: ['Cardiology', 'General Medicine', 'Orthopaedics', 'Neurology', 'Paediatrics', 'Dermatology'],
    emergency24x7: true,
    ambulanceCount: 3 + (hIdx % 3),
    ambulanceService: true,
    verificationStatus: 'verified',
    subscriptionStatus: 'ACTIVE',
    subscriptionPlan: hIdx % 2 === 0 ? 'ENTERPRISE' : 'PREMIUM',
    subscriptionExpiryDate: '2027-12-31'
  });

  // Add Hospital Manager
  users.push({
    id: h.managerId,
    name: h.managerName,
    email: h.managerEmail,
    role: 'hospital_manager',
    status: 'Active',
    password: 'Password123',
    hospitalId: h.id,
    hospitalName: h.name,
    regionId: h.regionId,
    employeeId: `HM-${h.id}-001`
  });

  // Alias for H001 Hospital Manager
  if (h.id === 'H001') {
    users.push({
      id: 'HM001',
      name: 'Priya Reddy (Alias)',
      email: 'hospitalmanager@nexcare.com',
      role: 'hospital_manager',
      status: 'Active',
      password: 'Password123',
      hospitalId: 'H001',
      hospitalName: h.name,
      regionId: 'REG-AP-SOUTH',
      employeeId: 'HM-H001-001'
    });
  }

  // Add Doctors (6 per hospital)
  const doctorsList = indianDoctorNames[hIdx];
  doctorsList.forEach((doc, dIdx) => {
    users.push({
      id: doc.id,
      name: doc.name,
      email: doc.email,
      role: 'doctor',
      dept: doc.dept,
      department: doc.dept,
      specialization: doc.spec,
      consultationFee: doc.fee,
      experienceYears: doc.exp,
      qualification: doc.qual,
      status: dIdx === 1 && hIdx === 0 ? 'On Leave' : 'Active',
      password: 'Password123',
      hospitalId: h.id,
      hospitalName: h.name,
      regionId: h.regionId,
      employeeId: `DOC-${h.id}-${String(dIdx + 1).padStart(3, '0')}`,
      medicalRegNumber: `MCI-${h.id}-${100 + dIdx}`,
      consultationTiming: '09:00 AM - 05:00 PM',
      schedule: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
        saturday: { start: '09:00', end: '13:00' },
        sunday: null
      }
    });

    // Doctor Leave Request for 1 doctor per hospital
    if (dIdx === 1) {
      leaves.push({
        id: `LV-${h.id}-${dIdx + 1}`,
        doctorId: doc.id,
        doctorName: doc.name,
        hospitalId: h.id,
        regionId: h.regionId,
        department: doc.dept,
        startDate: '2026-09-10',
        endDate: '2026-09-15',
        type: 'CASUAL',
        reason: 'Personal leave',
        status: hIdx === 0 ? 'approved' : 'pending',
        requestedAt: '2026-08-28'
      });
    }
  });

  // Add Administrative Staff (4 per hospital)
  const adminList = adminStaffData[hIdx];
  adminList.forEach((adm, aIdx) => {
    users.push({
      id: adm.id,
      name: adm.name,
      email: adm.email,
      role: 'administrative_staff',
      status: 'Active',
      password: 'Password123',
      hospitalId: h.id,
      hospitalName: h.name,
      regionId: h.regionId,
      dept: adm.dept,
      responsibility: adm.dept,
      employeeId: `ADM-${h.id}-${String(aIdx + 1).padStart(3, '0')}`
    });
  });

  // Add Ambulance Staff (2 per hospital)
  const ambStaff = [
    { id: h.id === 'H001' ? 'U003' : `AMB-${h.id}-01`, name: `${h.city} Crew Alpha`, email: h.id === 'H001' ? 'ambulance@nexcare.com' : `ambulance.${h.id.toLowerCase()}1@nexcare.in` },
    { id: `AMB-${h.id}-02`, name: `${h.city} Crew Bravo`, email: `ambulance.${h.id.toLowerCase()}2@nexcare.in` }
  ];
  ambStaff.forEach((amb) => {
    users.push({
      id: amb.id,
      name: amb.name,
      email: amb.email,
      role: 'ambulance',
      status: 'Active',
      password: 'Password123',
      hospitalId: h.id,
      hospitalName: h.name,
      regionId: h.regionId,
      employeeId: `AMB-EMP-${amb.id}`
    });
  });

  // Add Wards & Beds
  let bedCounter = 1;
  h.wards.forEach((w, wIdx) => {
    const wardId = `WARD-${h.id}-0${wIdx + 1}`;
    wards.push({
      id: wardId,
      hospitalId: h.id,
      name: w.name,
      capacity: w.capacity,
      occupied: w.occupied,
      available: w.capacity - w.occupied,
      department: w.name.replace(' Ward', '')
    });

    for (let b = 1; b <= w.capacity; b++) {
      const isOccupied = b <= w.occupied;
      const bedId = `BED-${h.id}-${wardId.slice(-3)}-${String(b).padStart(3, '0')}`;
      beds.push({
        id: bedId,
        bedNumber: `${w.name.substring(0, 2).toUpperCase()}-${String(b).padStart(3, '0')}`,
        hospitalId: h.id,
        wardId: wardId,
        wardName: w.name,
        type: w.name === 'ICU' ? 'ICU' : w.name === 'CCU' ? 'CCU' : 'Standard',
        status: isOccupied ? 'OCCUPIED' : 'AVAILABLE',
        patientId: isOccupied ? `PAT-${h.id}-${String((b % 8) + 1).padStart(3, '0')}` : null,
        dailyRate: w.name === 'ICU' ? 5000 : w.name === 'CCU' ? 4000 : 1500
      });
      bedCounter++;
    }
  });

  // Add Patients (8 per hospital)
  const pList = patientData[hIdx];
  pList.forEach((pat, pIdx) => {
    patients.push({
      id: pat.pid,
      patientId: pat.pid,
      userId: pat.userId || null,
      name: pat.name,
      age: pat.age,
      gender: pat.gender,
      city: pat.city,
      state: h.state,
      phone: pat.phone,
      email: pat.email,
      hospitalId: h.id,
      regionId: h.regionId,
      bloodGroup: pat.bloodGroup,
      address: `${100 + pIdx} Residential Colony, ${pat.city}`,
      emergencyContact: `+91 98480 0000${pIdx}`
    });

    // Create user login record if patient login enabled
    if (pat.userId) {
      users.push({
        id: pat.userId,
        name: pat.name,
        email: pat.email,
        role: 'patient',
        status: 'Active',
        password: 'Password123',
        patientId: pat.pid,
        hospitalId: h.id,
        regionId: h.regionId
      });
    }

    // Create Appointments
    const assignedDoc = doctorsList[pIdx % doctorsList.length];
    const apptId = `APT-${h.id}-${String(pIdx + 1).padStart(3, '0')}`;
    appointments.push({
      id: apptId,
      appointmentId: apptId,
      patientId: pat.pid,
      patientName: pat.name,
      patientEmail: pat.email,
      patientPhone: pat.phone,
      doctorId: assignedDoc.id,
      doctor: assignedDoc.name,
      hospitalId: h.id,
      hospitalName: h.name,
      regionId: h.regionId,
      department: assignedDoc.dept,
      dateLabel: 'September 20, 2026',
      timeLabel: `${10 + (pIdx % 4)}:00 AM`,
      fee: assignedDoc.fee,
      consultationFee: assignedDoc.fee,
      status: pIdx % 4 === 0 ? 'COMPLETED' : pIdx % 4 === 1 ? 'CONFIRMED' : pIdx % 4 === 2 ? 'BOOKED' : 'CANCELLED',
      createdAt: '2026-08-25T10:00:00Z'
    });

    // Create Bill for completed appointments
    if (pIdx % 4 === 0) {
      billing.push({
        id: `BILL-${h.id}-${String(pIdx + 1).padStart(3, '0')}`,
        patientId: pat.pid,
        hospitalId: h.id,
        hospitalName: h.name,
        visitDate: '2026-08-25',
        dueDate: '2026-09-08',
        status: 'Pending',
        currency: '₹',
        subtotal: assignedDoc.fee,
        cgstRate: 0.09,
        sgstRate: 0.09,
        cgstAmount: assignedDoc.fee * 0.09,
        sgstAmount: assignedDoc.fee * 0.09,
        total: Math.round(assignedDoc.fee * 1.18),
        items: [
          {
            description: `Consultation — ${assignedDoc.name} (${assignedDoc.dept})`,
            department: assignedDoc.dept,
            amount: assignedDoc.fee,
            type: 'CONSULTATION',
            referenceId: apptId
          }
        ],
        createdAt: '2026-08-25T11:00:00Z'
      });
    }
  });

  // Add Inventory (15 items per hospital with dynamic stock values)
  inventoryItemTemplates.forEach((item, iIdx) => {
    // Variety per hospital
    const multiplier = 0.5 + ((hIdx * 3 + iIdx * 7) % 10) / 5;
    const minQty = Math.round(item.baseMin * multiplier);
    
    let currentQty = Math.round(minQty * (0.2 + ((hIdx + iIdx) % 4) * 0.4));
    if (iIdx % 5 === 0) currentQty = 0; // OUT_OF_STOCK
    else if (iIdx % 5 === 1) currentQty = Math.round(minQty * 0.15); // CRITICAL
    else if (iIdx % 5 === 2) currentQty = Math.round(minQty * 0.7); // LOW_STOCK

    const status = calculateInventoryStatus(currentQty, minQty);

    inventory.push({
      id: `INV-${h.id}-${String(iIdx + 1).padStart(3, '0')}`,
      hospitalId: h.id,
      hospitalName: h.name,
      regionId: h.regionId,
      itemName: item.name,
      category: item.category,
      department: item.category === 'PPE' ? 'Emergency' : item.category === 'Pharmaceuticals' ? 'Pharmacy' : 'General',
      currentQuantity: currentQty,
      quantity: currentQty,
      minimumQuantity: minQty,
      reorderLevel: minQty,
      unit: item.unit,
      unitCost: item.cost,
      status: status,
      lastUpdated: '2026-08-30'
    });
  });

  // Add Weekly Hospital Schedule
  schedules.push({
    id: `SCH-${h.id}`,
    hospitalId: h.id,
    hospitalName: h.name,
    regionId: h.regionId,
    validFrom: '2026-01-01',
    validTo: '2027-12-31',
    slots: [
      { department: 'Cardiology', shift: 'Morning (08:00 - 16:00)', startTime: '08:00', endTime: '16:00' },
      { department: 'General Medicine', shift: 'Morning (08:00 - 16:00)', startTime: '08:00', endTime: '16:00' },
      { department: 'Orthopaedics', shift: 'Morning (08:00 - 16:00)', startTime: '08:00', endTime: '16:00' },
      { department: 'Neurology', shift: 'Morning (08:00 - 16:00)', startTime: '08:00', endTime: '16:00' },
      { department: 'Paediatrics', shift: 'Morning (08:00 - 16:00)', startTime: '08:00', endTime: '16:00' },
      { department: 'Dermatology', shift: 'Morning (08:00 - 16:00)', startTime: '08:00', endTime: '16:00' },
      { department: 'Emergency Medicine', shift: '24x7 Shift', startTime: '00:00', endTime: '23:59' }
    ],
    notes: 'Published hospital-wide OPD roster',
    status: 'approved',
    submittedBy: h.managerId,
    approvedBy: h.managerId,
    approvedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  });
  // Add Ambulance Fleet for hospital
  const ambRegs = [
    ['AP 03 AB 4821', 'AP 03 AB 4822', 'AP 03 AB 4823'],
    ['AP 26 CD 1042', 'AP 26 CD 1043'],
    ['KA 01 MN 7534', 'KA 01 MN 7535', 'KA 01 MN 7536', 'KA 01 MN 7537'],
    ['KA 09 PQ 3021', 'KA 09 PQ 3022'],
    ['MH 12 QR 2846', 'MH 12 QR 2847', 'MH 12 QR 2848'],
    ['MH 15 ST 9102', 'MH 15 ST 9103'],
    ['TN 10 XY 6182', 'TN 10 XY 6183', 'TN 10 XY 6184', 'TN 10 XY 6185'],
    ['TN 23 ZW 4410', 'TN 23 ZW 4411']
  ];
  const ambDrivers = [
    ['Ramesh Naidu', 'Suresh Kumar', 'K. Venkatesh'],
    ['Venu Gopal', 'Sailesh Raju'],
    ['Pradeep Shetty', 'Manjunath Gowda', 'Kiran Bhat', 'Siddharth Murthy'],
    ['Basavaraj Rai', 'Girish Ursu'],
    ['Vijay Patil', 'Sachin Pawar', 'Ajinkya Shinde'],
    ['Ganesh Borse', 'Vikas Jadhav'],
    ['Manikandan R', 'S. Vijay', 'R. Karthik', 'M. Saravanan'],
    ['A. Sathish', 'T. Loganathan']
  ];

  const hRegs = ambRegs[hIdx] || ['AP 03 AB 9999'];
  const hDrv = ambDrivers[hIdx] || ['Emergency Driver'];

  hRegs.forEach((vNum, vIdx) => {
    const ambId = `AMB-${h.id}-${String(vIdx + 1).padStart(2, '0')}`;
    ambulances.push({
      id: ambId,
      vehicleNumber: vNum,
      type: vIdx === 0 ? 'Advanced Life Support (ALS)' : 'Basic Life Support (BLS)',
      driverName: hDrv[vIdx % hDrv.length],
      driverPhone: `+91 98480 ${hIdx + 1}${vIdx + 1}00${vIdx}`,
      status: vIdx === 0 ? 'Available' : 'Available',
      hospitalId: h.id,
      hospitalName: h.name,
      assignedTo: ambStaff[vIdx % ambStaff.length]?.id || 'U003',
      createdAt: '2026-08-25T10:00:00Z',
      updatedAt: '2026-08-25T10:00:00Z'
    });
  });
});

// Write to back-end/data JSON files
function writeDataFile(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Saved ${filename}: ${data.length} records`);
}

writeDataFile('users.json', users);
writeDataFile('hospitals.json', hospitals);
writeDataFile('patients.json', patients);
writeDataFile('wards.json', wards);
writeDataFile('beds.json', beds);
writeDataFile('inventory.json', inventory);
writeDataFile('appointments.json', appointments);
writeDataFile('leaves.json', leaves);
writeDataFile('schedules.json', schedules);
writeDataFile('billing.json', billing);
writeDataFile('ambulance.json', ambulances);

console.log('\n========================================================');
console.log('COMPREHENSIVE INDIANISED DATASET GENERATED SUCCESSFULLY!');
console.log('========================================================');
