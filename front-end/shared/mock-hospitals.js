// Reusable Mock Hospital & Doctor Data for NexCare Frontend
// Structured Hierarchy: Hospital -> Departments -> Doctors -> Availability & Slots
// Synced with real synthetic datastore (H001 - H008)

window.MOCK_HOSPITALS = [
  {
    id: "H001",
    name: "Sri Venkateswara Multispeciality Hospital",
    city: "Tirupati",
    pincode: "517501",
    address: "108 SV University Road, Tirupati, Andhra Pradesh",
    phone: "+91 877 2288990",
    emergencyAvailable: true,
    verificationStatus: "verified",
    availableBeds: 36,
    totalBeds: 120,
    specialities: ["Cardiology", "General Medicine", "Orthopaedics", "Neurology", "Paediatrics", "Dermatology"],
    departments: [
      {
        id: "cardiology",
        name: "Cardiology",
        doctors: [
          {
            id: "U005",
            name: "Dr. Sunita Sharma",
            qualification: "MBBS, MD, DM",
            experience: 14,
            consultationFee: 900,
            availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            slots: {
              "Monday": ["09:00 AM", "10:30 AM", "12:00 PM", "02:00 PM"],
              "Tuesday": ["09:00 AM", "10:30 AM", "12:00 PM", "02:00 PM"],
              "Wednesday": ["09:00 AM", "10:30 AM", "12:00 PM", "02:00 PM"],
              "Thursday": ["09:00 AM", "10:30 AM", "12:00 PM", "02:00 PM"],
              "Friday": ["09:00 AM", "10:30 AM", "12:00 PM", "02:00 PM"],
              "Saturday": ["09:00 AM", "11:00 AM", "12:30 PM"]
            }
          }
        ]
      },
      {
        id: "general-medicine",
        name: "General Medicine",
        doctors: [
          {
            id: "DOC-AP01-002",
            name: "Dr. Harini Reddy",
            qualification: "MBBS, MD",
            experience: 12,
            consultationFee: 800,
            availableDays: ["Monday", "Wednesday", "Friday", "Saturday"],
            slots: {
              "Monday": ["10:00 AM", "11:30 AM", "03:00 PM"],
              "Wednesday": ["10:00 AM", "11:30 AM", "03:00 PM"],
              "Friday": ["10:00 AM", "11:30 AM", "03:00 PM"],
              "Saturday": ["10:00 AM", "12:00 PM"]
            }
          }
        ]
      },
      {
        id: "orthopaedics",
        name: "Orthopaedics",
        doctors: [
          {
            id: "U006",
            name: "Dr. Vikram Patel",
            qualification: "MBBS, MS (Ortho)",
            experience: 11,
            consultationFee: 850,
            availableDays: ["Monday", "Tuesday", "Thursday", "Friday"],
            slots: {
              "Monday": ["09:30 AM", "11:00 AM", "02:00 PM"],
              "Tuesday": ["09:30 AM", "11:00 AM", "02:00 PM"],
              "Thursday": ["09:30 AM", "11:00 AM", "02:00 PM"],
              "Friday": ["09:30 AM", "11:00 AM", "02:00 PM"]
            }
          }
        ]
      },
      {
        id: "neurology",
        name: "Neurology",
        doctors: [
          {
            id: "U009",
            name: "Dr. Sarah Smith",
            qualification: "MBBS, DM (Neuro)",
            experience: 15,
            consultationFee: 1000,
            availableDays: ["Monday", "Wednesday", "Thursday", "Friday"],
            slots: {
              "Monday": ["08:30 AM", "11:00 AM", "02:30 PM"],
              "Wednesday": ["08:30 AM", "11:00 AM", "02:30 PM"],
              "Thursday": ["08:30 AM", "11:00 AM", "02:30 PM"],
              "Friday": ["08:30 AM", "11:00 AM", "02:30 PM"]
            }
          }
        ]
      },
      {
        id: "paediatrics",
        name: "Paediatrics",
        doctors: [
          {
            id: "DOC-AP01-005",
            name: "Dr. Rajesh Rao",
            qualification: "MBBS, DCH, MD",
            experience: 9,
            consultationFee: 700,
            availableDays: ["Tuesday", "Thursday", "Saturday"],
            slots: {
              "Tuesday": ["10:00 AM", "12:00 PM", "03:30 PM"],
              "Thursday": ["10:00 AM", "12:00 PM", "03:30 PM"],
              "Saturday": ["09:30 AM", "11:30 AM"]
            }
          }
        ]
      },
      {
        id: "dermatology",
        name: "Dermatology",
        doctors: [
          {
            id: "U007",
            name: "Dr. Anjali Desai",
            qualification: "MBBS, MD (Derm)",
            experience: 8,
            consultationFee: 750,
            availableDays: ["Monday", "Wednesday", "Friday"],
            slots: {
              "Monday": ["09:00 AM", "11:30 AM", "02:00 PM"],
              "Wednesday": ["09:00 AM", "11:30 AM", "02:00 PM"],
              "Friday": ["09:00 AM", "11:30 AM", "02:00 PM"]
            }
          }
        ]
      }
    ]
  },
  {
    id: "H002",
    name: "Coastal Care Hospital",
    city: "Nellore",
    pincode: "524001",
    address: "45 Trunk Road, Dargamitta, Nellore, Andhra Pradesh",
    phone: "+91 861 2345678",
    emergencyAvailable: true,
    verificationStatus: "verified",
    availableBeds: 25,
    totalBeds: 80,
    specialities: ["Cardiology", "General Medicine", "Orthopaedics", "Paediatrics", "ENT", "Gynaecology"],
    departments: [
      {
        id: "cardiology",
        name: "Cardiology",
        doctors: [
          {
            id: "DOC-AP02-001",
            name: "Dr. Srinivas Varma",
            qualification: "MBBS, MD, DM",
            experience: 13,
            consultationFee: 800,
            availableDays: ["Monday", "Wednesday", "Friday"],
            slots: {
              "Monday": ["09:00 AM", "11:00 AM", "02:00 PM"],
              "Wednesday": ["09:00 AM", "11:00 AM", "02:00 PM"],
              "Friday": ["09:00 AM", "11:00 AM", "02:00 PM"]
            }
          }
        ]
      },
      {
        id: "general-medicine",
        name: "General Medicine",
        doctors: [
          {
            id: "DOC-AP02-002",
            name: "Dr. Swati Naidu",
            qualification: "MBBS, MD",
            experience: 10,
            consultationFee: 700,
            availableDays: ["Tuesday", "Thursday", "Saturday"],
            slots: {
              "Tuesday": ["10:00 AM", "12:00 PM", "03:00 PM"],
              "Thursday": ["10:00 AM", "12:00 PM", "03:00 PM"],
              "Saturday": ["10:00 AM", "01:00 PM"]
            }
          }
        ]
      }
    ]
  },
  {
    id: "H003",
    name: "Namma Health Multispeciality",
    city: "Bengaluru",
    pincode: "560001",
    address: "77 MG Road, Indiranagar, Bengaluru, Karnataka",
    phone: "+91 80 41238900",
    emergencyAvailable: true,
    verificationStatus: "verified",
    availableBeds: 48,
    totalBeds: 160,
    specialities: ["Cardiology", "Neurology", "Orthopaedics", "General Medicine", "General Surgery", "Dermatology"],
    departments: [
      {
        id: "cardiology",
        name: "Cardiology",
        doctors: [
          {
            id: "DOC-KA01-001",
            name: "Dr. Ananya Hegde",
            qualification: "MBBS, MD, DM",
            experience: 16,
            consultationFee: 1100,
            availableDays: ["Monday", "Wednesday", "Friday"],
            slots: {
              "Monday": ["09:30 AM", "11:30 AM", "02:30 PM"],
              "Wednesday": ["09:30 AM", "11:30 AM", "02:30 PM"],
              "Friday": ["09:30 AM", "11:30 AM", "02:30 PM"]
            }
          }
        ]
      },
      {
        id: "neurology",
        name: "Neurology",
        doctors: [
          {
            id: "DOC-KA01-002",
            name: "Dr. Suresh Joshi",
            qualification: "MBBS, DM (Neuro)",
            experience: 18,
            consultationFee: 1200,
            availableDays: ["Tuesday", "Thursday", "Saturday"],
            slots: {
              "Tuesday": ["10:00 AM", "01:00 PM", "04:00 PM"],
              "Thursday": ["10:00 AM", "01:00 PM", "04:00 PM"],
              "Saturday": ["09:00 AM", "12:00 PM"]
            }
          }
        ]
      }
    ]
  },
  {
    id: "H004",
    name: "Cauvery City Hospital",
    city: "Mysuru",
    pincode: "570001",
    address: "12 Sayyaji Rao Road, Mysuru, Karnataka",
    phone: "+91 821 2511223",
    emergencyAvailable: true,
    verificationStatus: "verified",
    availableBeds: 22,
    totalBeds: 95,
    specialities: ["Cardiology", "Paediatrics", "Orthopaedics", "ENT", "General Medicine", "Gynaecology"],
    departments: [
      {
        id: "cardiology",
        name: "Cardiology",
        doctors: [
          {
            id: "DOC-KA02-001",
            name: "Dr. Gautham Nambiar",
            qualification: "MBBS, MD, DNB",
            experience: 12,
            consultationFee: 850,
            availableDays: ["Monday", "Thursday", "Saturday"],
            slots: {
              "Monday": ["09:00 AM", "11:00 AM", "02:00 PM"],
              "Thursday": ["09:00 AM", "11:00 AM", "02:00 PM"],
              "Saturday": ["10:00 AM", "01:00 PM"]
            }
          }
        ]
      }
    ]
  },
  {
    id: "H005",
    name: "Sahyadri Care Hospital",
    city: "Pune",
    pincode: "411004",
    address: "34 Karve Road, Deccan Gymkhana, Pune, Maharashtra",
    phone: "+91 20 25438800",
    emergencyAvailable: true,
    verificationStatus: "verified",
    availableBeds: 42,
    totalBeds: 140,
    specialities: ["Cardiology", "Neurology", "Orthopaedics", "Paediatrics", "Emergency Medicine", "Dermatology"],
    departments: [
      {
        id: "cardiology",
        name: "Cardiology",
        doctors: [
          {
            id: "DOC-MH01-001",
            name: "Dr. Tarun Kulkarni",
            qualification: "MBBS, MD, DM",
            experience: 15,
            consultationFee: 1000,
            availableDays: ["Monday", "Wednesday", "Friday"],
            slots: {
              "Monday": ["09:00 AM", "11:00 AM", "03:00 PM"],
              "Wednesday": ["09:00 AM", "11:00 AM", "03:00 PM"],
              "Friday": ["09:00 AM", "11:00 AM", "03:00 PM"]
            }
          }
        ]
      }
    ]
  },
  {
    id: "H006",
    name: "Deccan Multispeciality Centre",
    city: "Nashik",
    pincode: "422002",
    address: "89 College Road, Nashik, Maharashtra",
    phone: "+91 253 2314455",
    emergencyAvailable: true,
    verificationStatus: "verified",
    availableBeds: 33,
    totalBeds: 110,
    specialities: ["Cardiology", "General Medicine", "Orthopaedics", "Paediatrics", "ENT", "Gynaecology"],
    departments: [
      {
        id: "cardiology",
        name: "Cardiology",
        doctors: [
          {
            id: "DOC-MH02-001",
            name: "Dr. Deepa Chawla",
            qualification: "MBBS, MD",
            experience: 11,
            consultationFee: 800,
            availableDays: ["Tuesday", "Thursday", "Saturday"],
            slots: {
              "Tuesday": ["10:00 AM", "12:00 PM", "03:00 PM"],
              "Thursday": ["10:00 AM", "12:00 PM", "03:00 PM"],
              "Saturday": ["09:30 AM", "12:30 PM"]
            }
          }
        ]
      }
    ]
  },
  {
    id: "H007",
    name: "Chennai Lifeline Hospital",
    city: "Chennai",
    pincode: "600006",
    address: "15 Anna Salai, Thousand Lights, Chennai, Tamil Nadu",
    phone: "+91 44 28290011",
    emergencyAvailable: true,
    verificationStatus: "verified",
    availableBeds: 45,
    totalBeds: 150,
    specialities: ["Cardiology", "Neurology", "General Medicine", "Orthopaedics", "Gynaecology", "Dermatology"],
    departments: [
      {
        id: "cardiology",
        name: "Cardiology",
        doctors: [
          {
            id: "DOC-TN01-001",
            name: "Dr. V. Ramanathan",
            qualification: "MBBS, MS, MCh",
            experience: 17,
            consultationFee: 1100,
            availableDays: ["Monday", "Wednesday", "Friday"],
            slots: {
              "Monday": ["09:00 AM", "11:00 AM", "02:30 PM"],
              "Wednesday": ["09:00 AM", "11:00 AM", "02:30 PM"],
              "Friday": ["09:00 AM", "11:00 AM", "02:30 PM"]
            }
          }
        ]
      }
    ]
  },
  {
    id: "H008",
    name: "Kaveri Medical Centre",
    city: "Vellore",
    pincode: "632004",
    address: "22 Arcot Road, Vellore, Tamil Nadu",
    phone: "+91 416 2223344",
    emergencyAvailable: true,
    verificationStatus: "verified",
    availableBeds: 30,
    totalBeds: 100,
    specialities: ["Cardiology", "General Medicine", "Orthopaedics", "Paediatrics", "General Surgery", "ENT"],
    departments: [
      {
        id: "cardiology",
        name: "Cardiology",
        doctors: [
          {
            id: "DOC-TN02-001",
            name: "Dr. T. Venugopal",
            qualification: "MBBS, MD, DM",
            experience: 12,
            consultationFee: 850,
            availableDays: ["Tuesday", "Thursday", "Saturday"],
            slots: {
              "Tuesday": ["09:30 AM", "11:30 AM", "02:00 PM"],
              "Thursday": ["09:30 AM", "11:30 AM", "02:00 PM"],
              "Saturday": ["09:00 AM", "12:00 PM"]
            }
          }
        ]
      }
    ]
  }
];
