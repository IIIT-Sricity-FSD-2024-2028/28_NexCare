// Reusable Mock Hospital & Doctor Data for NexCare Frontend
// Structured Hierarchy: Hospital -> Departments -> Doctors -> Availability & Slots
//
// GENERATED FILE — do not edit by hand.
// Regenerate with:  node back-end/scripts/generate-mock-hospitals.js
// Source of truth:  back-end/data/hospitals.json + back-end/data/users.json
//
// This is the offline fallback for the patient booking wizard. Every hospital
// id and doctor id here is a real record, so a booking made against it resolves
// on the server once connectivity returns.

window.MOCK_HOSPITALS = [
  {
    "id": "H001",
    "name": "Sri Venkateswara Multispeciality Hospital",
    "city": "Tirupati",
    "pincode": "517501",
    "address": "108 SV University Road, Tirupati, Andhra Pradesh",
    "phone": "+91 877 2288990",
    "emergencyAvailable": true,
    "verificationStatus": "verified",
    "availableBeds": 36,
    "totalBeds": 120,
    "specialities": [
      "Cardiology",
      "General Medicine",
      "Orthopaedics",
      "Neurology",
      "Paediatrics",
      "Dermatology"
    ],
    "departments": [
      {
        "id": "cardiology",
        "name": "Cardiology",
        "doctors": [
          {
            "id": "U005",
            "name": "Dr. Sunita Sharma",
            "qualification": "MBBS, MD, DM",
            "experience": 14,
            "consultationFee": 900,
            "availableDays": [
              "Monday",
              "Tuesday",
              "Thursday",
              "Friday",
              "Saturday"
            ],
            "slots": {
              "Monday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Tuesday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Thursday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Friday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Saturday": [
                "08:00 AM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "general-medicine",
        "name": "General Medicine",
        "doctors": [
          {
            "id": "DOC-AP01-002",
            "name": "Dr. Harini Reddy",
            "qualification": "MBBS, MD",
            "experience": 12,
            "consultationFee": 800,
            "availableDays": [
              "Monday",
              "Wednesday",
              "Friday",
              "Saturday"
            ],
            "slots": {
              "Monday": [
                "09:00 AM",
                "05:00 PM"
              ],
              "Wednesday": [
                "09:00 AM",
                "05:00 PM"
              ],
              "Friday": [
                "09:00 AM",
                "05:00 PM"
              ],
              "Saturday": [
                "09:00 AM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "orthopaedics",
        "name": "Orthopaedics",
        "doctors": [
          {
            "id": "U006",
            "name": "Dr. Vikram Patel",
            "qualification": "MBBS, MS (Ortho)",
            "experience": 11,
            "consultationFee": 850,
            "availableDays": [
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Saturday"
            ],
            "slots": {
              "Tuesday": [
                "10:00 AM",
                "05:00 PM"
              ],
              "Wednesday": [
                "10:00 AM",
                "05:00 PM"
              ],
              "Thursday": [
                "10:00 AM",
                "05:00 PM"
              ],
              "Saturday": [
                "10:00 AM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "neurology",
        "name": "Neurology",
        "doctors": [
          {
            "id": "U009",
            "name": "Dr. Sarah Smith",
            "qualification": "MBBS, DM (Neuro)",
            "experience": 15,
            "consultationFee": 1000,
            "availableDays": [
              "Monday",
              "Tuesday",
              "Friday"
            ],
            "slots": {
              "Monday": [
                "11:00 AM",
                "05:00 PM"
              ],
              "Tuesday": [
                "11:00 AM",
                "05:00 PM"
              ],
              "Friday": [
                "11:00 AM",
                "05:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "paediatrics",
        "name": "Paediatrics",
        "doctors": [
          {
            "id": "DOC-AP01-005",
            "name": "Dr. Rajesh Rao",
            "qualification": "MBBS, DCH, MD",
            "experience": 9,
            "consultationFee": 700,
            "availableDays": [
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday"
            ],
            "slots": {
              "Wednesday": [
                "12:00 PM",
                "05:00 PM"
              ],
              "Thursday": [
                "12:00 PM",
                "05:00 PM"
              ],
              "Friday": [
                "12:00 PM",
                "05:00 PM"
              ],
              "Saturday": [
                "12:00 PM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "dermatology",
        "name": "Dermatology",
        "doctors": [
          {
            "id": "U007",
            "name": "Dr. Anjali Desai",
            "qualification": "MBBS, MD (Derm)",
            "experience": 8,
            "consultationFee": 750,
            "availableDays": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday"
            ],
            "slots": {
              "Monday": [
                "09:30 AM",
                "05:00 PM"
              ],
              "Tuesday": [
                "09:30 AM",
                "05:00 PM"
              ],
              "Wednesday": [
                "09:30 AM",
                "05:00 PM"
              ],
              "Thursday": [
                "09:30 AM",
                "05:00 PM"
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "id": "H002",
    "name": "Coastal Care Hospital",
    "city": "Nellore",
    "pincode": "524001",
    "address": "45 Trunk Road, Dargamitta, Nellore, Andhra Pradesh",
    "phone": "+91 861 2345678",
    "emergencyAvailable": true,
    "verificationStatus": "verified",
    "availableBeds": 25,
    "totalBeds": 80,
    "specialities": [
      "Cardiology",
      "General Medicine",
      "Orthopaedics",
      "Paediatrics",
      "ENT",
      "Gynaecology"
    ],
    "departments": [
      {
        "id": "cardiology",
        "name": "Cardiology",
        "doctors": [
          {
            "id": "DOC-AP02-001",
            "name": "Dr. Srinivas Varma",
            "qualification": "MBBS, MD, DM",
            "experience": 13,
            "consultationFee": 800,
            "availableDays": [
              "Monday",
              "Tuesday",
              "Thursday",
              "Friday",
              "Saturday"
            ],
            "slots": {
              "Monday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Tuesday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Thursday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Friday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Saturday": [
                "08:00 AM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "general-medicine",
        "name": "General Medicine",
        "doctors": [
          {
            "id": "DOC-AP02-002",
            "name": "Dr. Swati Naidu",
            "qualification": "MBBS, MD",
            "experience": 10,
            "consultationFee": 700,
            "availableDays": [
              "Monday",
              "Wednesday",
              "Friday",
              "Saturday"
            ],
            "slots": {
              "Monday": [
                "09:00 AM",
                "05:00 PM"
              ],
              "Wednesday": [
                "09:00 AM",
                "05:00 PM"
              ],
              "Friday": [
                "09:00 AM",
                "05:00 PM"
              ],
              "Saturday": [
                "09:00 AM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "orthopaedics",
        "name": "Orthopaedics",
        "doctors": [
          {
            "id": "DOC-AP02-003",
            "name": "Dr. Arvind Swamy",
            "qualification": "MBBS, MS (Ortho)",
            "experience": 12,
            "consultationFee": 850,
            "availableDays": [
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Saturday"
            ],
            "slots": {
              "Tuesday": [
                "10:00 AM",
                "05:00 PM"
              ],
              "Wednesday": [
                "10:00 AM",
                "05:00 PM"
              ],
              "Thursday": [
                "10:00 AM",
                "05:00 PM"
              ],
              "Saturday": [
                "10:00 AM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "paediatrics",
        "name": "Paediatrics",
        "doctors": [
          {
            "id": "DOC-AP02-004",
            "name": "Dr. Bhavana Prasad",
            "qualification": "MBBS, DCH",
            "experience": 7,
            "consultationFee": 650,
            "availableDays": [
              "Monday",
              "Tuesday",
              "Friday"
            ],
            "slots": {
              "Monday": [
                "11:00 AM",
                "05:00 PM"
              ],
              "Tuesday": [
                "11:00 AM",
                "05:00 PM"
              ],
              "Friday": [
                "11:00 AM",
                "05:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "ent",
        "name": "ENT",
        "doctors": [
          {
            "id": "DOC-AP02-005",
            "name": "Dr. Madhav Raju",
            "qualification": "MBBS, MS (ENT)",
            "experience": 11,
            "consultationFee": 750,
            "availableDays": [
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday"
            ],
            "slots": {
              "Wednesday": [
                "12:00 PM",
                "05:00 PM"
              ],
              "Thursday": [
                "12:00 PM",
                "05:00 PM"
              ],
              "Friday": [
                "12:00 PM",
                "05:00 PM"
              ],
              "Saturday": [
                "12:00 PM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "gynaecology",
        "name": "Gynaecology",
        "doctors": [
          {
            "id": "DOC-AP02-006",
            "name": "Dr. Leela Kothari",
            "qualification": "MBBS, MS (OBG)",
            "experience": 15,
            "consultationFee": 900,
            "availableDays": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday"
            ],
            "slots": {
              "Monday": [
                "09:30 AM",
                "05:00 PM"
              ],
              "Tuesday": [
                "09:30 AM",
                "05:00 PM"
              ],
              "Wednesday": [
                "09:30 AM",
                "05:00 PM"
              ],
              "Thursday": [
                "09:30 AM",
                "05:00 PM"
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "id": "H003",
    "name": "Namma Health Multispeciality",
    "city": "Bengaluru",
    "pincode": "560001",
    "address": "77 MG Road, Indiranagar, Bengaluru, Karnataka",
    "phone": "+91 80 41238900",
    "emergencyAvailable": true,
    "verificationStatus": "verified",
    "availableBeds": 48,
    "totalBeds": 160,
    "specialities": [
      "Cardiology",
      "Neurology",
      "Orthopaedics",
      "General Medicine",
      "General Surgery",
      "Dermatology"
    ],
    "departments": [
      {
        "id": "cardiology",
        "name": "Cardiology",
        "doctors": [
          {
            "id": "DOC-KA01-001",
            "name": "Dr. Ananya Hegde",
            "qualification": "MBBS, MD, DM",
            "experience": 16,
            "consultationFee": 1100,
            "availableDays": [
              "Monday",
              "Tuesday",
              "Thursday",
              "Friday",
              "Saturday"
            ],
            "slots": {
              "Monday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Tuesday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Thursday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Friday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Saturday": [
                "08:00 AM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "neurology",
        "name": "Neurology",
        "doctors": [
          {
            "id": "DOC-KA01-002",
            "name": "Dr. Suresh Joshi",
            "qualification": "MBBS, DM (Neuro)",
            "experience": 18,
            "consultationFee": 1200,
            "availableDays": [
              "Monday",
              "Wednesday",
              "Friday",
              "Saturday"
            ],
            "slots": {
              "Monday": [
                "09:00 AM",
                "05:00 PM"
              ],
              "Wednesday": [
                "09:00 AM",
                "05:00 PM"
              ],
              "Friday": [
                "09:00 AM",
                "05:00 PM"
              ],
              "Saturday": [
                "09:00 AM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "orthopaedics",
        "name": "Orthopaedics",
        "doctors": [
          {
            "id": "DOC-KA01-003",
            "name": "Dr. Pradeep Gowda",
            "qualification": "MBBS, MS, MCh",
            "experience": 14,
            "consultationFee": 1000,
            "availableDays": [
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Saturday"
            ],
            "slots": {
              "Tuesday": [
                "10:00 AM",
                "05:00 PM"
              ],
              "Wednesday": [
                "10:00 AM",
                "05:00 PM"
              ],
              "Thursday": [
                "10:00 AM",
                "05:00 PM"
              ],
              "Saturday": [
                "10:00 AM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "general-medicine",
        "name": "General Medicine",
        "doctors": [
          {
            "id": "DOC-KA01-004",
            "name": "Dr. Maya Kulkarni",
            "qualification": "MBBS, MD",
            "experience": 10,
            "consultationFee": 850,
            "availableDays": [
              "Monday",
              "Tuesday",
              "Friday"
            ],
            "slots": {
              "Monday": [
                "11:00 AM",
                "05:00 PM"
              ],
              "Tuesday": [
                "11:00 AM",
                "05:00 PM"
              ],
              "Friday": [
                "11:00 AM",
                "05:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "general-surgery",
        "name": "General Surgery",
        "doctors": [
          {
            "id": "DOC-KA01-005",
            "name": "Dr. Kiran Shetty",
            "qualification": "MBBS, MS (Gen Surg)",
            "experience": 13,
            "consultationFee": 950,
            "availableDays": [
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday"
            ],
            "slots": {
              "Wednesday": [
                "12:00 PM",
                "05:00 PM"
              ],
              "Thursday": [
                "12:00 PM",
                "05:00 PM"
              ],
              "Friday": [
                "12:00 PM",
                "05:00 PM"
              ],
              "Saturday": [
                "12:00 PM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "dermatology",
        "name": "Dermatology",
        "doctors": [
          {
            "id": "DOC-KA01-006",
            "name": "Dr. Divya Ramesh",
            "qualification": "MBBS, MD",
            "experience": 9,
            "consultationFee": 800,
            "availableDays": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday"
            ],
            "slots": {
              "Monday": [
                "09:30 AM",
                "05:00 PM"
              ],
              "Tuesday": [
                "09:30 AM",
                "05:00 PM"
              ],
              "Wednesday": [
                "09:30 AM",
                "05:00 PM"
              ],
              "Thursday": [
                "09:30 AM",
                "05:00 PM"
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "id": "H004",
    "name": "Cauvery City Hospital",
    "city": "Mysuru",
    "pincode": "570001",
    "address": "12 Sayyaji Rao Road, Mysuru, Karnataka",
    "phone": "+91 821 2511223",
    "emergencyAvailable": true,
    "verificationStatus": "verified",
    "availableBeds": 22,
    "totalBeds": 95,
    "specialities": [
      "Cardiology",
      "Paediatrics",
      "Orthopaedics",
      "ENT",
      "General Medicine",
      "Gynaecology"
    ],
    "departments": [
      {
        "id": "cardiology",
        "name": "Cardiology",
        "doctors": [
          {
            "id": "DOC-KA02-001",
            "name": "Dr. Gautham Nambiar",
            "qualification": "MBBS, MD, DNB",
            "experience": 12,
            "consultationFee": 850,
            "availableDays": [
              "Monday",
              "Tuesday",
              "Thursday",
              "Friday",
              "Saturday"
            ],
            "slots": {
              "Monday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Tuesday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Thursday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Friday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Saturday": [
                "08:00 AM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "paediatrics",
        "name": "Paediatrics",
        "doctors": [
          {
            "id": "DOC-KA02-002",
            "name": "Dr. Radhika Ursu",
            "qualification": "MBBS, MD",
            "experience": 9,
            "consultationFee": 750,
            "availableDays": [
              "Monday",
              "Wednesday",
              "Friday",
              "Saturday"
            ],
            "slots": {
              "Monday": [
                "09:00 AM",
                "05:00 PM"
              ],
              "Wednesday": [
                "09:00 AM",
                "05:00 PM"
              ],
              "Friday": [
                "09:00 AM",
                "05:00 PM"
              ],
              "Saturday": [
                "09:00 AM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "orthopaedics",
        "name": "Orthopaedics",
        "doctors": [
          {
            "id": "DOC-KA02-003",
            "name": "Dr. Chetan Kumar",
            "qualification": "MBBS, MS",
            "experience": 11,
            "consultationFee": 800,
            "availableDays": [
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Saturday"
            ],
            "slots": {
              "Tuesday": [
                "10:00 AM",
                "05:00 PM"
              ],
              "Wednesday": [
                "10:00 AM",
                "05:00 PM"
              ],
              "Thursday": [
                "10:00 AM",
                "05:00 PM"
              ],
              "Saturday": [
                "10:00 AM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "ent",
        "name": "ENT",
        "doctors": [
          {
            "id": "DOC-KA02-004",
            "name": "Dr. Preeti Shenoy",
            "qualification": "MBBS, DLO, MS",
            "experience": 8,
            "consultationFee": 700,
            "availableDays": [
              "Monday",
              "Tuesday",
              "Friday"
            ],
            "slots": {
              "Monday": [
                "11:00 AM",
                "05:00 PM"
              ],
              "Tuesday": [
                "11:00 AM",
                "05:00 PM"
              ],
              "Friday": [
                "11:00 AM",
                "05:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "general-medicine",
        "name": "General Medicine",
        "doctors": [
          {
            "id": "DOC-KA02-005",
            "name": "Dr. Mahesh Bhat",
            "qualification": "MBBS, MD",
            "experience": 10,
            "consultationFee": 700,
            "availableDays": [
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday"
            ],
            "slots": {
              "Wednesday": [
                "12:00 PM",
                "05:00 PM"
              ],
              "Thursday": [
                "12:00 PM",
                "05:00 PM"
              ],
              "Friday": [
                "12:00 PM",
                "05:00 PM"
              ],
              "Saturday": [
                "12:00 PM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "gynaecology",
        "name": "Gynaecology",
        "doctors": [
          {
            "id": "DOC-KA02-006",
            "name": "Dr. Shalini Rai",
            "qualification": "MBBS, DGO, MS",
            "experience": 13,
            "consultationFee": 850,
            "availableDays": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday"
            ],
            "slots": {
              "Monday": [
                "09:30 AM",
                "05:00 PM"
              ],
              "Tuesday": [
                "09:30 AM",
                "05:00 PM"
              ],
              "Wednesday": [
                "09:30 AM",
                "05:00 PM"
              ],
              "Thursday": [
                "09:30 AM",
                "05:00 PM"
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "id": "H005",
    "name": "Sahyadri Care Hospital",
    "city": "Pune",
    "pincode": "411004",
    "address": "34 Karve Road, Deccan Gymkhana, Pune, Maharashtra",
    "phone": "+91 20 25438800",
    "emergencyAvailable": true,
    "verificationStatus": "verified",
    "availableBeds": 42,
    "totalBeds": 140,
    "specialities": [
      "Cardiology",
      "Neurology",
      "Orthopaedics",
      "Paediatrics",
      "Emergency Medicine",
      "Dermatology"
    ],
    "departments": [
      {
        "id": "cardiology",
        "name": "Cardiology",
        "doctors": [
          {
            "id": "DOC-MH01-001",
            "name": "Dr. Tarun Kulkarni",
            "qualification": "MBBS, MD, DM",
            "experience": 15,
            "consultationFee": 1000,
            "availableDays": [
              "Monday",
              "Tuesday",
              "Thursday",
              "Friday",
              "Saturday"
            ],
            "slots": {
              "Monday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Tuesday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Thursday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Friday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Saturday": [
                "08:00 AM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "neurology",
        "name": "Neurology",
        "doctors": [
          {
            "id": "DOC-MH01-002",
            "name": "Dr. Meenakshi Sundaram",
            "qualification": "MBBS, DM",
            "experience": 16,
            "consultationFee": 1100,
            "availableDays": [
              "Monday",
              "Wednesday",
              "Friday",
              "Saturday"
            ],
            "slots": {
              "Monday": [
                "09:00 AM",
                "05:00 PM"
              ],
              "Wednesday": [
                "09:00 AM",
                "05:00 PM"
              ],
              "Friday": [
                "09:00 AM",
                "05:00 PM"
              ],
              "Saturday": [
                "09:00 AM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "orthopaedics",
        "name": "Orthopaedics",
        "doctors": [
          {
            "id": "DOC-MH01-003",
            "name": "Dr. Sachin Shinde",
            "qualification": "MBBS, MS",
            "experience": 12,
            "consultationFee": 900,
            "availableDays": [
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Saturday"
            ],
            "slots": {
              "Tuesday": [
                "10:00 AM",
                "05:00 PM"
              ],
              "Wednesday": [
                "10:00 AM",
                "05:00 PM"
              ],
              "Thursday": [
                "10:00 AM",
                "05:00 PM"
              ],
              "Saturday": [
                "10:00 AM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "paediatrics",
        "name": "Paediatrics",
        "doctors": [
          {
            "id": "DOC-MH01-004",
            "name": "Dr. Pooja Deshmukh",
            "qualification": "MBBS, MD",
            "experience": 9,
            "consultationFee": 750,
            "availableDays": [
              "Monday",
              "Tuesday",
              "Friday"
            ],
            "slots": {
              "Monday": [
                "11:00 AM",
                "05:00 PM"
              ],
              "Tuesday": [
                "11:00 AM",
                "05:00 PM"
              ],
              "Friday": [
                "11:00 AM",
                "05:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "emergency-medicine",
        "name": "Emergency Medicine",
        "doctors": [
          {
            "id": "DOC-MH01-005",
            "name": "Dr. Nitin Gadkari",
            "qualification": "MBBS, MEM",
            "experience": 10,
            "consultationFee": 850,
            "availableDays": [
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday"
            ],
            "slots": {
              "Wednesday": [
                "12:00 PM",
                "05:00 PM"
              ],
              "Thursday": [
                "12:00 PM",
                "05:00 PM"
              ],
              "Friday": [
                "12:00 PM",
                "05:00 PM"
              ],
              "Saturday": [
                "12:00 PM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "dermatology",
        "name": "Dermatology",
        "doctors": [
          {
            "id": "DOC-MH01-006",
            "name": "Dr. Rekha Pawar",
            "qualification": "MBBS, DVD",
            "experience": 8,
            "consultationFee": 750,
            "availableDays": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday"
            ],
            "slots": {
              "Monday": [
                "09:30 AM",
                "05:00 PM"
              ],
              "Tuesday": [
                "09:30 AM",
                "05:00 PM"
              ],
              "Wednesday": [
                "09:30 AM",
                "05:00 PM"
              ],
              "Thursday": [
                "09:30 AM",
                "05:00 PM"
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "id": "H006",
    "name": "Deccan Multispeciality Centre",
    "city": "Nashik",
    "pincode": "422002",
    "address": "89 College Road, Nashik, Maharashtra",
    "phone": "+91 253 2314455",
    "emergencyAvailable": true,
    "verificationStatus": "verified",
    "availableBeds": 33,
    "totalBeds": 110,
    "specialities": [
      "Cardiology",
      "General Medicine",
      "Orthopaedics",
      "Paediatrics",
      "ENT",
      "Gynaecology"
    ],
    "departments": [
      {
        "id": "cardiology",
        "name": "Cardiology",
        "doctors": [
          {
            "id": "DOC-MH02-001",
            "name": "Dr. Deepa Chawla",
            "qualification": "MBBS, MD",
            "experience": 11,
            "consultationFee": 800,
            "availableDays": [
              "Monday",
              "Tuesday",
              "Thursday",
              "Friday",
              "Saturday"
            ],
            "slots": {
              "Monday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Tuesday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Thursday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Friday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Saturday": [
                "08:00 AM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "general-medicine",
        "name": "General Medicine",
        "doctors": [
          {
            "id": "DOC-MH02-002",
            "name": "Dr. Amitav Ghosh",
            "qualification": "MBBS, MD",
            "experience": 10,
            "consultationFee": 700,
            "availableDays": [
              "Monday",
              "Wednesday",
              "Friday",
              "Saturday"
            ],
            "slots": {
              "Monday": [
                "09:00 AM",
                "05:00 PM"
              ],
              "Wednesday": [
                "09:00 AM",
                "05:00 PM"
              ],
              "Friday": [
                "09:00 AM",
                "05:00 PM"
              ],
              "Saturday": [
                "09:00 AM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "orthopaedics",
        "name": "Orthopaedics",
        "doctors": [
          {
            "id": "DOC-MH02-003",
            "name": "Dr. Sanjay Borse",
            "qualification": "MBBS, MS",
            "experience": 12,
            "consultationFee": 800,
            "availableDays": [
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Saturday"
            ],
            "slots": {
              "Tuesday": [
                "10:00 AM",
                "05:00 PM"
              ],
              "Wednesday": [
                "10:00 AM",
                "05:00 PM"
              ],
              "Thursday": [
                "10:00 AM",
                "05:00 PM"
              ],
              "Saturday": [
                "10:00 AM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "paediatrics",
        "name": "Paediatrics",
        "doctors": [
          {
            "id": "DOC-MH02-004",
            "name": "Dr. Sunita Jadhav",
            "qualification": "MBBS, DCH",
            "experience": 8,
            "consultationFee": 700,
            "availableDays": [
              "Monday",
              "Tuesday",
              "Friday"
            ],
            "slots": {
              "Monday": [
                "11:00 AM",
                "05:00 PM"
              ],
              "Tuesday": [
                "11:00 AM",
                "05:00 PM"
              ],
              "Friday": [
                "11:00 AM",
                "05:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "ent",
        "name": "ENT",
        "doctors": [
          {
            "id": "DOC-MH02-005",
            "name": "Dr. Rahul Sonawane",
            "qualification": "MBBS, MS",
            "experience": 9,
            "consultationFee": 750,
            "availableDays": [
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday"
            ],
            "slots": {
              "Wednesday": [
                "12:00 PM",
                "05:00 PM"
              ],
              "Thursday": [
                "12:00 PM",
                "05:00 PM"
              ],
              "Friday": [
                "12:00 PM",
                "05:00 PM"
              ],
              "Saturday": [
                "12:00 PM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "gynaecology",
        "name": "Gynaecology",
        "doctors": [
          {
            "id": "DOC-MH02-006",
            "name": "Dr. Smita Wagh",
            "qualification": "MBBS, MS",
            "experience": 14,
            "consultationFee": 850,
            "availableDays": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday"
            ],
            "slots": {
              "Monday": [
                "09:30 AM",
                "05:00 PM"
              ],
              "Tuesday": [
                "09:30 AM",
                "05:00 PM"
              ],
              "Wednesday": [
                "09:30 AM",
                "05:00 PM"
              ],
              "Thursday": [
                "09:30 AM",
                "05:00 PM"
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "id": "H007",
    "name": "Chennai Lifeline Hospital",
    "city": "Chennai",
    "pincode": "600001",
    "address": "15 Anna Salai, Thousand Lights, Chennai, Tamil Nadu",
    "phone": "+91 44 28290011",
    "emergencyAvailable": true,
    "verificationStatus": "verified",
    "availableBeds": 45,
    "totalBeds": 150,
    "specialities": [
      "Cardiology",
      "Neurology",
      "General Medicine",
      "Orthopaedics",
      "Gynaecology",
      "Dermatology"
    ],
    "departments": [
      {
        "id": "cardiology",
        "name": "Cardiology",
        "doctors": [
          {
            "id": "DOC-TN01-001",
            "name": "Dr. V. Ramanathan",
            "qualification": "MBBS, MS, MCh",
            "experience": 17,
            "consultationFee": 1100,
            "availableDays": [
              "Monday",
              "Tuesday",
              "Thursday",
              "Friday",
              "Saturday"
            ],
            "slots": {
              "Monday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Tuesday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Thursday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Friday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Saturday": [
                "08:00 AM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "neurology",
        "name": "Neurology",
        "doctors": [
          {
            "id": "DOC-TN01-002",
            "name": "Dr. S. Jayaraman",
            "qualification": "MBBS, MCh (Neuro)",
            "experience": 19,
            "consultationFee": 1200,
            "availableDays": [
              "Monday",
              "Wednesday",
              "Friday",
              "Saturday"
            ],
            "slots": {
              "Monday": [
                "09:00 AM",
                "05:00 PM"
              ],
              "Wednesday": [
                "09:00 AM",
                "05:00 PM"
              ],
              "Friday": [
                "09:00 AM",
                "05:00 PM"
              ],
              "Saturday": [
                "09:00 AM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "general-medicine",
        "name": "General Medicine",
        "doctors": [
          {
            "id": "DOC-TN01-003",
            "name": "Dr. K. Ananthi",
            "qualification": "MBBS, MD",
            "experience": 13,
            "consultationFee": 900,
            "availableDays": [
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Saturday"
            ],
            "slots": {
              "Tuesday": [
                "10:00 AM",
                "05:00 PM"
              ],
              "Wednesday": [
                "10:00 AM",
                "05:00 PM"
              ],
              "Thursday": [
                "10:00 AM",
                "05:00 PM"
              ],
              "Saturday": [
                "10:00 AM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "orthopaedics",
        "name": "Orthopaedics",
        "doctors": [
          {
            "id": "DOC-TN01-004",
            "name": "Dr. R. Karthik",
            "qualification": "MBBS, MS",
            "experience": 15,
            "consultationFee": 1000,
            "availableDays": [
              "Monday",
              "Tuesday",
              "Friday"
            ],
            "slots": {
              "Monday": [
                "11:00 AM",
                "05:00 PM"
              ],
              "Tuesday": [
                "11:00 AM",
                "05:00 PM"
              ],
              "Friday": [
                "11:00 AM",
                "05:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "gynaecology",
        "name": "Gynaecology",
        "doctors": [
          {
            "id": "DOC-TN01-005",
            "name": "Dr. M. Chitra",
            "qualification": "MBBS, MD",
            "experience": 14,
            "consultationFee": 950,
            "availableDays": [
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday"
            ],
            "slots": {
              "Wednesday": [
                "12:00 PM",
                "05:00 PM"
              ],
              "Thursday": [
                "12:00 PM",
                "05:00 PM"
              ],
              "Friday": [
                "12:00 PM",
                "05:00 PM"
              ],
              "Saturday": [
                "12:00 PM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "dermatology",
        "name": "Dermatology",
        "doctors": [
          {
            "id": "DOC-TN01-006",
            "name": "Dr. P. Sundar",
            "qualification": "MBBS, MD",
            "experience": 10,
            "consultationFee": 850,
            "availableDays": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday"
            ],
            "slots": {
              "Monday": [
                "09:30 AM",
                "05:00 PM"
              ],
              "Tuesday": [
                "09:30 AM",
                "05:00 PM"
              ],
              "Wednesday": [
                "09:30 AM",
                "05:00 PM"
              ],
              "Thursday": [
                "09:30 AM",
                "05:00 PM"
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "id": "H008",
    "name": "Kaveri Medical Centre",
    "city": "Vellore",
    "pincode": "632004",
    "address": "22 Arcot Road, Vellore, Tamil Nadu",
    "phone": "+91 416 2223344",
    "emergencyAvailable": true,
    "verificationStatus": "verified",
    "availableBeds": 30,
    "totalBeds": 100,
    "specialities": [
      "Cardiology",
      "General Medicine",
      "Orthopaedics",
      "Paediatrics",
      "General Surgery",
      "ENT"
    ],
    "departments": [
      {
        "id": "cardiology",
        "name": "Cardiology",
        "doctors": [
          {
            "id": "DOC-TN02-001",
            "name": "Dr. T. Venugopal",
            "qualification": "MBBS, MD, DM",
            "experience": 12,
            "consultationFee": 850,
            "availableDays": [
              "Monday",
              "Tuesday",
              "Thursday",
              "Friday",
              "Saturday"
            ],
            "slots": {
              "Monday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Tuesday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Thursday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Friday": [
                "08:00 AM",
                "05:00 PM"
              ],
              "Saturday": [
                "08:00 AM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "general-medicine",
        "name": "General Medicine",
        "doctors": [
          {
            "id": "DOC-TN02-002",
            "name": "Dr. N. Gayathri",
            "qualification": "MBBS, MD",
            "experience": 10,
            "consultationFee": 750,
            "availableDays": [
              "Monday",
              "Wednesday",
              "Friday",
              "Saturday"
            ],
            "slots": {
              "Monday": [
                "09:00 AM",
                "05:00 PM"
              ],
              "Wednesday": [
                "09:00 AM",
                "05:00 PM"
              ],
              "Friday": [
                "09:00 AM",
                "05:00 PM"
              ],
              "Saturday": [
                "09:00 AM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "orthopaedics",
        "name": "Orthopaedics",
        "doctors": [
          {
            "id": "DOC-TN02-003",
            "name": "Dr. S. Balaji",
            "qualification": "MBBS, MS",
            "experience": 11,
            "consultationFee": 800,
            "availableDays": [
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Saturday"
            ],
            "slots": {
              "Tuesday": [
                "10:00 AM",
                "05:00 PM"
              ],
              "Wednesday": [
                "10:00 AM",
                "05:00 PM"
              ],
              "Thursday": [
                "10:00 AM",
                "05:00 PM"
              ],
              "Saturday": [
                "10:00 AM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "paediatrics",
        "name": "Paediatrics",
        "doctors": [
          {
            "id": "DOC-TN02-004",
            "name": "Dr. U. Malathi",
            "qualification": "MBBS, DCH",
            "experience": 8,
            "consultationFee": 700,
            "availableDays": [
              "Monday",
              "Tuesday",
              "Friday"
            ],
            "slots": {
              "Monday": [
                "11:00 AM",
                "05:00 PM"
              ],
              "Tuesday": [
                "11:00 AM",
                "05:00 PM"
              ],
              "Friday": [
                "11:00 AM",
                "05:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "general-surgery",
        "name": "General Surgery",
        "doctors": [
          {
            "id": "DOC-TN02-005",
            "name": "Dr. G. Loganathan",
            "qualification": "MBBS, MS",
            "experience": 13,
            "consultationFee": 850,
            "availableDays": [
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday"
            ],
            "slots": {
              "Wednesday": [
                "12:00 PM",
                "05:00 PM"
              ],
              "Thursday": [
                "12:00 PM",
                "05:00 PM"
              ],
              "Friday": [
                "12:00 PM",
                "05:00 PM"
              ],
              "Saturday": [
                "12:00 PM",
                "01:00 PM"
              ]
            }
          }
        ]
      },
      {
        "id": "ent",
        "name": "ENT",
        "doctors": [
          {
            "id": "DOC-TN02-006",
            "name": "Dr. E. Soundarya",
            "qualification": "MBBS, MS",
            "experience": 9,
            "consultationFee": 700,
            "availableDays": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday"
            ],
            "slots": {
              "Monday": [
                "09:30 AM",
                "05:00 PM"
              ],
              "Tuesday": [
                "09:30 AM",
                "05:00 PM"
              ],
              "Wednesday": [
                "09:30 AM",
                "05:00 PM"
              ],
              "Thursday": [
                "09:30 AM",
                "05:00 PM"
              ]
            }
          }
        ]
      }
    ]
  }
];
