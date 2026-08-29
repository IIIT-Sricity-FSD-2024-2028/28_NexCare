export const HOSPITALS = [
  {
    id: "apollo",
    name: "Apollo Hospitals",
    city: "Chennai",
    pincode: "600006",
    address: "21 Greams Lane, Thousand Lights, Chennai, Tamil Nadu",
    phone: "+91 44 2829 0200",
    emergencyAvailable: true,
    verificationStatus: "verified",
    availableBeds: 35,
    totalBeds: 250,
    specialities: ["Cardiology", "Neurology", "Orthopaedics", "General Medicine"],
    departments: [
      {
        id: "cardiology",
        name: "Cardiology",
        doctors: [
          {
            id: "doc_apollo_card_01",
            name: "Dr. Arjun Reddy",
            qualification: "MD, DM Cardiology",
            experience: 12,
            availableDays: ["Monday", "Wednesday", "Friday"],
            slots: {
              "Monday": ["09:00 AM", "10:30 AM", "12:00 PM"],
              "Wednesday": ["10:00 AM", "11:30 AM", "03:00 PM"],
              "Friday": ["09:30 AM", "01:00 PM", "04:00 PM"]
            }
          },
          {
            id: "doc_apollo_card_02",
            name: "Dr. Meera Iyer",
            qualification: "MD, DM Cardiology",
            experience: 9,
            availableDays: ["Tuesday", "Thursday", "Saturday"],
            slots: {
              "Tuesday": ["10:00 AM", "11:00 AM", "02:30 PM"],
              "Thursday": ["09:30 AM", "12:30 PM", "03:30 PM"],
              "Saturday": ["10:00 AM", "12:00 PM"]
            }
          }
        ]
      },
      {
        id: "neurology",
        name: "Neurology",
        doctors: [
          {
            id: "doc_apollo_neuro_01",
            name: "Dr. Kavya Sharma",
            qualification: "MD, DM Neurology",
            experience: 14,
            availableDays: ["Monday", "Tuesday", "Thursday"],
            slots: {
              "Monday": ["09:30 AM", "11:00 AM", "02:00 PM"],
              "Tuesday": ["10:00 AM", "01:00 PM", "03:30 PM"],
              "Thursday": ["09:00 AM", "11:30 AM", "04:00 PM"]
            }
          },
          {
            id: "doc_apollo_neuro_02",
            name: "Dr. Vivek Krishnan",
            qualification: "MD, DM Neurology",
            experience: 10,
            availableDays: ["Wednesday", "Friday", "Saturday"],
            slots: {
              "Wednesday": ["09:00 AM", "11:30 AM", "02:30 PM"],
              "Friday": ["10:00 AM", "12:00 PM", "03:00 PM"],
              "Saturday": ["09:30 AM", "11:00 AM"]
            }
          }
        ]
      },
      {
        id: "orthopaedics",
        name: "Orthopaedics",
        doctors: [
          {
            id: "doc_apollo_ortho_01",
            name: "Dr. Subhash Chandra",
            qualification: "MS Orthopaedics",
            experience: 16,
            availableDays: ["Monday", "Wednesday", "Saturday"],
            slots: {
              "Monday": ["08:30 AM", "11:00 AM", "02:00 PM"],
              "Wednesday": ["09:30 AM", "12:00 PM", "03:30 PM"],
              "Saturday": ["09:00 AM", "11:30 AM"]
            }
          },
          {
            id: "doc_apollo_ortho_02",
            name: "Dr. Aditya Rao",
            qualification: "MS Orthopaedics",
            experience: 11,
            availableDays: ["Tuesday", "Thursday", "Friday"],
            slots: {
              "Tuesday": ["09:00 AM", "11:00 AM", "02:30 PM"],
              "Thursday": ["10:00 AM", "01:00 PM", "04:00 PM"],
              "Friday": ["08:30 AM", "11:30 AM", "03:00 PM"]
            }
          }
        ]
      },
      {
        id: "general_medicine",
        name: "General Medicine",
        doctors: [
          {
            id: "doc_apollo_gen_01",
            name: "Dr. R. K. Namboodiri",
            qualification: "MD General Medicine",
            experience: 20,
            availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            slots: {
              "Monday": ["08:30 AM", "10:00 AM", "01:00 PM"],
              "Tuesday": ["09:00 AM", "11:00 AM", "02:00 PM"],
              "Wednesday": ["08:30 AM", "10:30 AM", "01:30 PM"],
              "Thursday": ["09:00 AM", "11:30 AM", "03:00 PM"],
              "Friday": ["08:30 AM", "11:00 AM", "02:30 PM"],
              "Saturday": ["09:00 AM", "11:00 AM"]
            }
          },
          {
            id: "doc_apollo_gen_02",
            name: "Dr. Sandeep Reddy",
            qualification: "MD Internal Medicine",
            experience: 10,
            availableDays: ["Monday", "Wednesday", "Friday"],
            slots: {
              "Monday": ["10:00 AM", "02:00 PM", "04:30 PM"],
              "Wednesday": ["09:00 AM", "01:00 PM", "03:30 PM"],
              "Friday": ["10:30 AM", "02:30 PM", "05:00 PM"]
            }
          }
        ]
      }
    ]
  },
  {
    id: "fortis",
    name: "Fortis Hospital",
    city: "Bangalore",
    pincode: "560076",
    address: "154/9 Bannerghatta Road, Opposite IIM-B, Bangalore, Karnataka",
    phone: "+91 80 6621 4444",
    emergencyAvailable: true,
    verificationStatus: "verified",
    availableBeds: 28,
    totalBeds: 200,
    specialities: ["Cardiology", "Dermatology", "ENT", "Paediatrics"],
    departments: [
      {
        id: "cardiology",
        name: "Cardiology",
        doctors: [
          {
            id: "doc_fortis_card_01",
            name: "Dr. Rahul Menon",
            qualification: "MD Cardiology",
            experience: 15,
            availableDays: ["Monday", "Tuesday", "Thursday"],
            slots: {
              "Monday": ["09:00 AM", "11:00 AM", "02:00 PM"],
              "Tuesday": ["10:00 AM", "12:30 PM", "03:30 PM"],
              "Thursday": ["08:30 AM", "11:30 AM", "04:00 PM"]
            }
          },
          {
            id: "doc_fortis_card_02",
            name: "Dr. Priya Nair",
            qualification: "MD, DM Cardiology",
            experience: 11,
            availableDays: ["Wednesday", "Friday", "Saturday"],
            slots: {
              "Wednesday": ["09:30 AM", "12:00 PM", "03:00 PM"],
              "Friday": ["09:00 AM", "11:30 AM", "02:30 PM"],
              "Saturday": ["10:00 AM", "12:00 PM"]
            }
          }
        ]
      },
      {
        id: "dermatology",
        name: "Dermatology",
        doctors: [
          {
            id: "doc_fortis_derm_01",
            name: "Dr. Sneha Kulkarni",
            qualification: "MD Dermatology",
            experience: 10,
            availableDays: ["Monday", "Wednesday", "Friday"],
            slots: {
              "Monday": ["10:00 AM", "01:00 PM", "03:30 PM"],
              "Wednesday": ["09:30 AM", "11:30 AM", "02:30 PM"],
              "Friday": ["10:00 AM", "12:30 PM", "04:00 PM"]
            }
          },
          {
            id: "doc_fortis_derm_02",
            name: "Dr. Rhea Kapoor",
            qualification: "DNB Dermatology",
            experience: 7,
            availableDays: ["Tuesday", "Thursday", "Saturday"],
            slots: {
              "Tuesday": ["09:00 AM", "11:30 AM", "02:00 PM"],
              "Thursday": ["10:30 AM", "01:00 PM", "03:30 PM"],
              "Saturday": ["09:00 AM", "11:00 AM"]
            }
          }
        ]
      },
      {
        id: "ent",
        name: "ENT",
        doctors: [
          {
            id: "doc_fortis_ent_01",
            name: "Dr. Karthik Iyer",
            qualification: "MS ENT",
            experience: 13,
            availableDays: ["Monday", "Tuesday", "Thursday", "Friday"],
            slots: {
              "Monday": ["09:00 AM", "11:00 AM", "03:00 PM"],
              "Tuesday": ["09:30 AM", "12:00 PM", "02:30 PM"],
              "Thursday": ["10:00 AM", "01:00 PM", "04:00 PM"],
              "Friday": ["08:30 AM", "11:30 AM", "02:00 PM"]
            }
          },
          {
            id: "doc_fortis_ent_02",
            name: "Dr. Harish Babu",
            qualification: "MS ENT",
            experience: 9,
            availableDays: ["Wednesday", "Saturday"],
            slots: {
              "Wednesday": ["10:00 AM", "01:00 PM", "03:30 PM"],
              "Saturday": ["09:30 AM", "11:30 AM"]
            }
          }
        ]
      },
      {
        id: "paediatrics",
        name: "Paediatrics",
        doctors: [
          {
            id: "doc_fortis_paed_01",
            name: "Dr. Aditi Deshmukh",
            qualification: "MD Paediatrics",
            experience: 14,
            availableDays: ["Monday", "Wednesday", "Friday", "Saturday"],
            slots: {
              "Monday": ["08:30 AM", "10:30 AM", "01:30 PM"],
              "Wednesday": ["09:00 AM", "11:30 AM", "02:30 PM"],
              "Friday": ["09:30 AM", "12:00 PM", "03:30 PM"],
              "Saturday": ["09:00 AM", "11:00 AM"]
            }
          },
          {
            id: "doc_fortis_paed_02",
            name: "Dr. Varun Nair",
            qualification: "MD Paediatrics",
            experience: 8,
            availableDays: ["Tuesday", "Thursday", "Friday"],
            slots: {
              "Tuesday": ["10:00 AM", "01:00 PM", "04:00 PM"],
              "Thursday": ["09:00 AM", "11:30 AM", "03:00 PM"],
              "Friday": ["02:00 PM", "04:30 PM"]
            }
          }
        ]
      }
    ]
  },
  {
    id: "manipal",
    name: "Manipal Hospital",
    city: "Hyderabad",
    pincode: "500081",
    address: "Mindspace Road, Gachibowli, Hyderabad, Telangana",
    phone: "+91 40 4344 5555",
    emergencyAvailable: true,
    verificationStatus: "verified",
    availableBeds: 40,
    totalBeds: 300,
    specialities: ["Neurology", "Orthopaedics", "General Medicine", "Gynaecology"],
    departments: [
      {
        id: "neurology",
        name: "Neurology",
        doctors: [
          {
            id: "doc_manipal_neuro_01",
            name: "Dr. Ananya Gupta",
            qualification: "MD Neurology",
            experience: 12,
            availableDays: ["Monday", "Wednesday", "Friday"],
            slots: {
              "Monday": ["09:00 AM", "11:30 AM", "02:30 PM"],
              "Wednesday": ["10:00 AM", "12:30 PM", "03:30 PM"],
              "Friday": ["09:30 AM", "01:00 PM", "04:00 PM"]
            }
          },
          {
            id: "doc_manipal_neuro_02",
            name: "Dr. Karthik Iyer",
            qualification: "MD Neurology",
            experience: 15,
            availableDays: ["Tuesday", "Thursday", "Saturday"],
            slots: {
              "Tuesday": ["08:30 AM", "11:00 AM", "02:00 PM"],
              "Thursday": ["09:00 AM", "12:00 PM", "03:00 PM"],
              "Saturday": ["09:30 AM", "11:30 AM"]
            }
          }
        ]
      },
      {
        id: "orthopaedics",
        name: "Orthopaedics",
        doctors: [
          {
            id: "doc_manipal_ortho_01",
            name: "Dr. Rohit Verma",
            qualification: "MS Orthopaedics",
            experience: 14,
            availableDays: ["Monday", "Tuesday", "Thursday"],
            slots: {
              "Monday": ["09:30 AM", "12:00 PM", "03:00 PM"],
              "Tuesday": ["09:00 AM", "11:30 AM", "02:30 PM"],
              "Thursday": ["10:00 AM", "01:00 PM", "04:00 PM"]
            }
          },
          {
            id: "doc_manipal_ortho_02",
            name: "Dr. Sandeep Reddy",
            qualification: "MS Orthopaedics",
            experience: 11,
            availableDays: ["Wednesday", "Friday", "Saturday"],
            slots: {
              "Wednesday": ["08:30 AM", "11:00 AM", "02:00 PM"],
              "Friday": ["09:00 AM", "12:00 PM", "03:30 PM"],
              "Saturday": ["10:00 AM", "12:00 PM"]
            }
          }
        ]
      },
      {
        id: "general_medicine",
        name: "General Medicine",
        doctors: [
          {
            id: "doc_manipal_gen_01",
            name: "Dr. Lakshmi Narayanan",
            qualification: "MD Medicine",
            experience: 18,
            availableDays: ["Monday", "Wednesday", "Thursday", "Friday"],
            slots: {
              "Monday": ["08:30 AM", "10:30 AM", "01:30 PM"],
              "Wednesday": ["09:00 AM", "11:30 AM", "02:30 PM"],
              "Thursday": ["09:30 AM", "12:00 PM", "03:30 PM"],
              "Friday": ["08:30 AM", "11:00 AM", "02:00 PM"]
            }
          },
          {
            id: "doc_manipal_gen_02",
            name: "Dr. Neha Agarwal",
            qualification: "MD General Medicine",
            experience: 9,
            availableDays: ["Tuesday", "Friday", "Saturday"],
            slots: {
              "Tuesday": ["10:00 AM", "01:00 PM", "04:00 PM"],
              "Friday": ["02:30 PM", "05:00 PM"],
              "Saturday": ["09:00 AM", "11:30 AM"]
            }
          }
        ]
      },
      {
        id: "gynaecology",
        name: "Gynaecology",
        doctors: [
          {
            id: "doc_manipal_gyn_01",
            name: "Dr. Anjali Menon",
            qualification: "MS OBG",
            experience: 16,
            availableDays: ["Monday", "Tuesday", "Wednesday", "Friday"],
            slots: {
              "Monday": ["09:00 AM", "11:30 AM", "02:00 PM"],
              "Tuesday": ["09:30 AM", "12:00 PM", "03:00 PM"],
              "Wednesday": ["10:00 AM", "01:00 PM", "03:30 PM"],
              "Friday": ["09:00 AM", "11:30 AM", "02:30 PM"]
            }
          },
          {
            id: "doc_manipal_gyn_02",
            name: "Dr. Nandini Rao",
            qualification: "MD Gynaecology",
            experience: 10,
            availableDays: ["Thursday", "Saturday"],
            slots: {
              "Thursday": ["09:00 AM", "12:00 PM", "03:30 PM"],
              "Saturday": ["09:30 AM", "11:30 AM"]
            }
          }
        ]
      }
    ]
  },
  {
    id: "aster",
    name: "Aster Hospital",
    city: "Kochi",
    pincode: "682027",
    address: "Aster Medcity, Kuttisarakadavu, Cheranalloor, Kochi, Kerala",
    phone: "+91 484 6699 999",
    emergencyAvailable: true,
    verificationStatus: "verified",
    availableBeds: 22,
    totalBeds: 180,
    specialities: ["Cardiology", "Gastroenterology", "Paediatrics", "ENT"],
    departments: [
      {
        id: "cardiology",
        name: "Cardiology",
        doctors: [
          {
            id: "doc_aster_card_01",
            name: "Dr. Aditya Rao",
            qualification: "DM Cardiology",
            experience: 13,
            availableDays: ["Monday", "Wednesday", "Friday"],
            slots: {
              "Monday": ["09:00 AM", "11:30 AM", "02:30 PM"],
              "Wednesday": ["10:00 AM", "12:30 PM", "03:30 PM"],
              "Friday": ["09:30 AM", "01:00 PM", "04:00 PM"]
            }
          },
          {
            id: "doc_aster_card_02",
            name: "Dr. Meera Iyer",
            qualification: "MD Cardiology",
            experience: 9,
            availableDays: ["Tuesday", "Thursday", "Saturday"],
            slots: {
              "Tuesday": ["08:30 AM", "11:00 AM", "02:00 PM"],
              "Thursday": ["09:00 AM", "12:00 PM", "03:00 PM"],
              "Saturday": ["09:30 AM", "11:30 AM"]
            }
          }
        ]
      },
      {
        id: "gastroenterology",
        name: "Gastroenterology",
        doctors: [
          {
            id: "doc_aster_gastro_01",
            name: "Dr. Aditya Rao",
            qualification: "DM Gastroenterology",
            experience: 15,
            availableDays: ["Monday", "Tuesday", "Thursday"],
            slots: {
              "Monday": ["10:00 AM", "01:00 PM", "04:00 PM"],
              "Tuesday": ["09:30 AM", "12:00 PM", "03:00 PM"],
              "Thursday": ["09:00 AM", "11:30 AM", "02:30 PM"]
            }
          },
          {
            id: "doc_aster_gastro_02",
            name: "Dr. Nandini Rao",
            qualification: "MD Gastro",
            experience: 11,
            availableDays: ["Wednesday", "Friday", "Saturday"],
            slots: {
              "Wednesday": ["09:00 AM", "11:30 AM", "02:00 PM"],
              "Friday": ["10:00 AM", "12:30 PM", "03:30 PM"],
              "Saturday": ["09:00 AM", "11:00 AM"]
            }
          }
        ]
      },
      {
        id: "paediatrics",
        name: "Paediatrics",
        doctors: [
          {
            id: "doc_aster_paed_01",
            name: "Dr. Anjali Menon",
            qualification: "MD Paediatrics",
            experience: 14,
            availableDays: ["Monday", "Wednesday", "Saturday"],
            slots: {
              "Monday": ["08:30 AM", "11:00 AM", "02:00 PM"],
              "Wednesday": ["09:30 AM", "12:00 PM", "03:00 PM"],
              "Saturday": ["09:00 AM", "11:30 AM"]
            }
          },
          {
            id: "doc_aster_paed_02",
            name: "Dr. Aditi Deshmukh",
            qualification: "MD Paediatrics",
            experience: 10,
            availableDays: ["Tuesday", "Thursday", "Friday"],
            slots: {
              "Tuesday": ["09:00 AM", "11:30 AM", "02:30 PM"],
              "Thursday": ["10:00 AM", "01:00 PM", "04:00 PM"],
              "Friday": ["08:30 AM", "11:00 AM", "02:30 PM"]
            }
          }
        ]
      },
      {
        id: "ent",
        name: "ENT",
        doctors: [
          {
            id: "doc_aster_ent_01",
            name: "Dr. Rohit Verma",
            qualification: "MS ENT",
            experience: 12,
            availableDays: ["Monday", "Tuesday", "Thursday"],
            slots: {
              "Monday": ["09:00 AM", "11:30 AM", "02:30 PM"],
              "Tuesday": ["10:00 AM", "12:30 PM", "03:30 PM"],
              "Thursday": ["09:30 AM", "12:00 PM", "03:00 PM"]
            }
          },
          {
            id: "doc_aster_ent_02",
            name: "Dr. Rhea Kapoor",
            qualification: "MS ENT",
            experience: 8,
            availableDays: ["Wednesday", "Friday", "Saturday"],
            slots: {
              "Wednesday": ["09:00 AM", "11:30 AM", "02:00 PM"],
              "Friday": ["09:30 AM", "12:00 PM", "03:30 PM"],
              "Saturday": ["09:00 AM", "11:00 AM"]
            }
          }
        ]
      }
    ]
  },
  {
    id: "HSP001",
    name: "Sri Venkateswara Multi Speciality Hospital",
    city: "Tirupati",
    pincode: "517501",
    address: "Alipiri Road, Tirupati, Andhra Pradesh",
    phone: "0877-2233445",
    emergencyAvailable: true,
    verificationStatus: "verified",
    availableBeds: 24,
    totalBeds: 120,
    specialities: ["Cardiology", "Neurology", "Orthopaedics", "General Medicine", "Dermatology", "Emergency Medicine"],
    departments: [
      {
        id: "cardiology",
        name: "Cardiology",
        doctors: [
          {
            id: "doc_hsp1_card_01",
            name: "Dr. Rajesh Sharma",
            qualification: "MD, DM Cardiology",
            experience: 16,
            availableDays: ["Monday", "Wednesday", "Friday"],
            slots: {
              "Monday": ["09:00 AM", "10:30 AM", "12:00 PM", "03:00 PM"],
              "Wednesday": ["09:30 AM", "11:00 AM", "02:30 PM"],
              "Friday": ["09:00 AM", "12:00 PM", "04:00 PM"]
            }
          },
          {
            id: "doc_hsp1_card_02",
            name: "Dr. Sunita Rao",
            qualification: "MD Cardiology",
            experience: 10,
            availableDays: ["Tuesday", "Thursday", "Saturday"],
            slots: {
              "Tuesday": ["10:00 AM", "11:30 AM", "02:00 PM"],
              "Thursday": ["09:30 AM", "01:00 PM", "03:30 PM"],
              "Saturday": ["09:00 AM", "11:00 AM"]
            }
          }
        ]
      },
      {
        id: "neurology",
        name: "Neurology",
        doctors: [
          {
            id: "doc_hsp1_neuro_01",
            name: "Dr. Sanjay Gupta",
            qualification: "MD, DM Neurology",
            experience: 14,
            availableDays: ["Monday", "Tuesday", "Thursday"],
            slots: {
              "Monday": ["10:00 AM", "11:30 AM", "02:30 PM"],
              "Tuesday": ["09:30 AM", "12:00 PM", "03:00 PM"],
              "Thursday": ["10:00 AM", "01:00 PM", "04:00 PM"]
            }
          },
          {
            id: "doc_hsp1_neuro_02",
            name: "Dr. Priya Patel",
            qualification: "MD Neurology",
            experience: 9,
            availableDays: ["Wednesday", "Friday", "Saturday"],
            slots: {
              "Wednesday": ["09:00 AM", "11:30 AM", "02:00 PM"],
              "Friday": ["10:00 AM", "12:30 PM", "03:30 PM"],
              "Saturday": ["09:30 AM", "11:30 AM"]
            }
          }
        ]
      },
      {
        id: "orthopaedics",
        name: "Orthopaedics",
        doctors: [
          {
            id: "doc_hsp1_ortho_01",
            name: "Dr. Vikram Patel",
            qualification: "MS Orthopaedics",
            experience: 18,
            availableDays: ["Monday", "Wednesday", "Friday", "Saturday"],
            slots: {
              "Monday": ["09:30 AM", "11:00 AM", "04:00 PM"],
              "Wednesday": ["08:30 AM", "11:30 AM", "02:30 PM"],
              "Friday": ["09:00 AM", "12:00 PM", "03:30 PM"],
              "Saturday": ["10:00 AM", "12:00 PM"]
            }
          },
          {
            id: "doc_hsp1_ortho_02",
            name: "Dr. Alok Verma",
            qualification: "MS Orthopaedics",
            experience: 11,
            availableDays: ["Tuesday", "Thursday"],
            slots: {
              "Tuesday": ["09:00 AM", "11:30 AM", "02:00 PM"],
              "Thursday": ["10:00 AM", "01:00 PM", "04:00 PM"]
            }
          }
        ]
      },
      {
        id: "general_medicine",
        name: "General Medicine",
        doctors: [
          {
            id: "doc_hsp1_gen_01",
            name: "Dr. Anjali Desai",
            qualification: "MD Medicine",
            experience: 15,
            availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            slots: {
              "Monday": ["08:30 AM", "10:00 AM", "01:00 PM", "05:00 PM"],
              "Tuesday": ["09:00 AM", "11:00 AM", "02:00 PM"],
              "Wednesday": ["08:30 AM", "10:30 AM", "01:30 PM"],
              "Thursday": ["09:00 AM", "11:30 AM", "03:00 PM"],
              "Friday": ["08:30 AM", "11:00 AM", "02:30 PM"],
              "Saturday": ["09:00 AM", "11:00 AM"]
            }
          },
          {
            id: "doc_hsp1_gen_02",
            name: "Dr. Arjun Mehta",
            qualification: "MD Medicine",
            experience: 12,
            availableDays: ["Monday", "Wednesday", "Friday"],
            slots: {
              "Monday": ["10:30 AM", "02:00 PM", "04:30 PM"],
              "Wednesday": ["09:30 AM", "01:00 PM", "03:30 PM"],
              "Friday": ["10:00 AM", "02:30 PM", "05:00 PM"]
            }
          }
        ]
      },
      {
        id: "dermatology",
        name: "Dermatology",
        doctors: [
          {
            id: "doc_hsp1_derm_01",
            name: "Dr. Pooja Chawla",
            qualification: "MD Dermatology",
            experience: 8,
            availableDays: ["Tuesday", "Thursday", "Saturday"],
            slots: {
              "Tuesday": ["11:00 AM", "01:30 PM", "03:30 PM"],
              "Thursday": ["10:00 AM", "01:00 PM", "04:00 PM"],
              "Saturday": ["09:30 AM", "11:30 AM"]
            }
          },
          {
            id: "doc_hsp1_derm_02",
            name: "Dr. Rohit Kapoor",
            qualification: "DNB Dermatology",
            experience: 10,
            availableDays: ["Monday", "Wednesday", "Friday"],
            slots: {
              "Monday": ["09:00 AM", "11:30 AM", "02:00 PM"],
              "Wednesday": ["10:00 AM", "12:30 PM", "03:30 PM"],
              "Friday": ["09:30 AM", "12:00 PM", "03:00 PM"]
            }
          }
        ]
      }
    ]
  },
  {
    id: "H001",
    name: "NexCare AIIMS Super Speciality Hospital",
    city: "Tirupati",
    pincode: "517501",
    address: "Renigunta Road, Near Central Bus Stand, Tirupati, Andhra Pradesh",
    phone: "+91 877 2255000",
    emergencyAvailable: true,
    verificationStatus: "verified",
    availableBeds: 40,
    totalBeds: 250,
    specialities: ["Cardiology", "Neurology", "General Medicine", "Orthopaedics", "Paediatrics"],
    departments: [
      {
        id: "cardiology",
        name: "Cardiology",
        doctors: [
          {
            id: "doc_h001_card_01",
            name: "Dr. Rajesh Sharma",
            qualification: "MD, DM Cardiology",
            experience: 16,
            availableDays: ["Monday", "Wednesday", "Friday"],
            slots: {
              "Monday": ["09:00 AM", "10:30 AM", "12:00 PM", "03:00 PM"],
              "Wednesday": ["09:30 AM", "11:00 AM", "02:30 PM"],
              "Friday": ["09:00 AM", "12:00 PM", "04:00 PM"]
            }
          },
          {
            id: "doc_h001_card_02",
            name: "Dr. Sunita Rao",
            qualification: "MD Cardiology",
            experience: 10,
            availableDays: ["Tuesday", "Thursday", "Saturday"],
            slots: {
              "Tuesday": ["10:00 AM", "11:30 AM", "02:00 PM"],
              "Thursday": ["09:30 AM", "01:00 PM", "03:30 PM"],
              "Saturday": ["09:00 AM", "11:00 AM"]
            }
          }
        ]
      },
      {
        id: "neurology",
        name: "Neurology",
        doctors: [
          {
            id: "doc_h001_neuro_01",
            name: "Dr. Sanjay Gupta",
            qualification: "MD, DM Neurology",
            experience: 14,
            availableDays: ["Monday", "Tuesday", "Thursday"],
            slots: {
              "Monday": ["10:00 AM", "11:30 AM", "02:30 PM"],
              "Tuesday": ["09:30 AM", "12:00 PM", "03:00 PM"],
              "Thursday": ["10:00 AM", "01:00 PM", "04:00 PM"]
            }
          },
          {
            id: "doc_h001_neuro_02",
            name: "Dr. Priya Patel",
            qualification: "MD Neurology",
            experience: 9,
            availableDays: ["Wednesday", "Friday", "Saturday"],
            slots: {
              "Wednesday": ["09:00 AM", "11:30 AM", "02:00 PM"],
              "Friday": ["10:00 AM", "12:30 PM", "03:30 PM"],
              "Saturday": ["09:30 AM", "11:30 AM"]
            }
          }
        ]
      },
      {
        id: "general_medicine",
        name: "General Medicine",
        doctors: [
          {
            id: "doc_h001_gen_01",
            name: "Dr. Anjali Desai",
            qualification: "MD Medicine",
            experience: 15,
            availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            slots: {
              "Monday": ["08:30 AM", "10:00 AM", "01:00 PM", "05:00 PM"],
              "Tuesday": ["09:00 AM", "11:00 AM", "02:00 PM"],
              "Wednesday": ["08:30 AM", "10:30 AM", "01:30 PM"],
              "Thursday": ["09:00 AM", "11:30 AM", "03:00 PM"],
              "Friday": ["08:30 AM", "11:00 AM", "02:30 PM"],
              "Saturday": ["09:00 AM", "11:00 AM"]
            }
          }
        ]
      }
    ]
  }
];
