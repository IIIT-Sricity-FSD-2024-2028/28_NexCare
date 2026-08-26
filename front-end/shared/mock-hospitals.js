// Reusable Mock Hospital Data for NexCare Frontend with Availability Schedules
window.MOCK_HOSPITALS = [
  {
    id: "HSP001",
    name: "Sri Venkateswara Multi Speciality Hospital",
    city: "tirupati",
    pincode: "517501",
    address: "Alipiri Road, Tirupati, Andhra Pradesh",
    specialities: [
      "Cardiology",
      "Neurology",
      "Orthopaedics",
      "General Medicine",
      "Dermatology",
      "Emergency Medicine"
    ],
    availableBeds: 24,
    totalBeds: 120,
    phone: "0877-2233445",
    emergencyAvailable: true,
    latitude: 13.6500,
    longitude: 79.4200,
    verificationStatus: "verified",
    availability: {
      "Cardiology": {
        days: [1, 2, 3, 4, 5],
        slots: ["09:00 AM", "10:30 AM", "12:00 PM", "03:00 PM"]
      },
      "Neurology": {
        days: [1, 3, 5],
        slots: ["10:00 AM", "11:30 AM", "02:30 PM"]
      },
      "Orthopaedics": {
        days: [2, 3, 4, 5, 6],
        slots: ["09:30 AM", "11:00 AM", "04:00 PM"]
      },
      "General Medicine": {
        days: [1, 2, 3, 4, 5, 6],
        slots: ["08:30 AM", "10:00 AM", "01:00 PM", "05:00 PM"]
      },
      "Dermatology": {
        days: [2, 4, 6],
        slots: ["11:00 AM", "01:30 PM", "03:30 PM"]
      },
      "Emergency Medicine": {
        days: [0, 1, 2, 3, 4, 5, 6],
        slots: ["08:00 AM", "12:00 PM", "04:00 PM", "08:00 PM"]
      }
    }
  },
  {
    id: "HSP002",
    name: "Padmavathi Women and Children Hospital",
    city: "tirupati",
    pincode: "517501",
    address: "MR Palli Road, Tirupati, Andhra Pradesh",
    specialities: [
      "Gynaecology",
      "Paediatrics",
      "General Medicine"
    ],
    availableBeds: 13,
    totalBeds: 75,
    phone: "0877-2256789",
    emergencyAvailable: true,
    latitude: 13.6288,
    longitude: 79.4192,
    verificationStatus: "verified",
    availability: {
      "Gynaecology": {
        days: [1, 2, 3, 4, 5, 6],
        slots: ["09:30 AM", "11:30 AM", "02:30 PM", "04:00 PM"]
      },
      "Paediatrics": {
        days: [1, 2, 3, 5, 6],
        slots: ["08:30 AM", "10:00 AM", "12:30 PM", "03:00 PM"]
      },
      "General Medicine": {
        days: [1, 2, 3, 4, 5],
        slots: ["10:00 AM", "01:00 PM", "05:00 PM"]
      }
    }
  },
  {
    id: "HSP003",
    name: "Tirumala Orthopaedic and Trauma Centre",
    city: "tirupati",
    pincode: "517502",
    address: "Renigunta Road, Tirupati, Andhra Pradesh",
    specialities: [
      "Orthopaedics",
      "Emergency Medicine",
      "Physiotherapy"
    ],
    availableBeds: 8,
    totalBeds: 45,
    phone: "0877-2278901",
    emergencyAvailable: true,
    latitude: 13.6355,
    longitude: 79.4471,
    verificationStatus: "verified",
    availability: {
      "Orthopaedics": {
        days: [1, 2, 3, 4, 5, 6],
        slots: ["08:30 AM", "10:30 AM", "01:30 PM", "04:30 PM"]
      },
      "Emergency Medicine": {
        days: [0, 1, 2, 3, 4, 5, 6],
        slots: ["06:00 AM", "12:00 PM", "06:00 PM"]
      },
      "Physiotherapy": {
        days: [1, 2, 3, 4, 5],
        slots: ["09:00 AM", "11:00 AM", "03:00 PM", "05:00 PM"]
      }
    }
  },
  {
    id: "HSP004",
    name: "Rayalaseema Heart Institute",
    city: "tirupati",
    pincode: "517501",
    address: "Air Bypass Road, Tirupati, Andhra Pradesh",
    specialities: [
      "Cardiology",
      "Cardiothoracic Surgery",
      "General Medicine"
    ],
    availableBeds: 6,
    totalBeds: 60,
    phone: "0877-2290123",
    emergencyAvailable: true,
    latitude: 13.6211,
    longitude: 79.4098,
    verificationStatus: "verified",
    availability: {
      "Cardiology": {
        days: [1, 2, 3, 4, 5, 6],
        slots: ["08:00 AM", "09:30 AM", "11:00 AM", "02:00 PM"]
      },
      "Cardiothoracic Surgery": {
        days: [1, 3, 5],
        slots: ["10:00 AM", "12:30 PM"]
      },
      "General Medicine": {
        days: [2, 4, 6],
        slots: ["09:00 AM", "11:30 AM", "04:00 PM"]
      }
    }
  },
  {
    id: "HSP005",
    name: "Chittoor District General Hospital",
    city: "chittoor",
    pincode: "517001",
    address: "Government Hospital Road, Chittoor, Andhra Pradesh",
    specialities: [
      "General Medicine",
      "Dermatology",
      "Paediatrics",
      "Orthopaedics",
      "Emergency Medicine"
    ],
    availableBeds: 31,
    totalBeds: 150,
    phone: "08572-241234",
    emergencyAvailable: true,
    latitude: 13.2172,
    longitude: 79.1003,
    verificationStatus: "verified",
    availability: {
      "General Medicine": {
        days: [1, 2, 3, 4, 5, 6],
        slots: ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"]
      },
      "Dermatology": {
        days: [2, 4],
        slots: ["10:00 AM", "12:30 PM"]
      },
      "Paediatrics": {
        days: [1, 3, 5],
        slots: ["09:30 AM", "11:30 AM", "03:30 PM"]
      },
      "Orthopaedics": {
        days: [2, 4, 6],
        slots: ["08:30 AM", "01:00 PM", "04:30 PM"]
      },
      "Emergency Medicine": {
        days: [0, 1, 2, 3, 4, 5, 6],
        slots: ["07:00 AM", "01:00 PM", "07:00 PM"]
      }
    }
  },
  {
    id: "HSP006",
    name: "Renigunta Community Hospital",
    city: "renigunta",
    pincode: "517520",
    address: "Station Road, Renigunta, Andhra Pradesh",
    specialities: [
      "General Medicine",
      "Paediatrics",
      "Emergency Medicine"
    ],
    availableBeds: 17,
    totalBeds: 50,
    phone: "0877-2543210",
    emergencyAvailable: true,
    latitude: 13.6365,
    longitude: 79.5035,
    verificationStatus: "verified",
    availability: {
      "General Medicine": {
        days: [1, 2, 3, 4, 5, 6],
        slots: ["09:00 AM", "11:00 AM", "01:00 PM", "04:30 PM"]
      },
      "Paediatrics": {
        days: [1, 2, 3, 5, 6],
        slots: ["08:30 AM", "10:30 AM", "02:00 PM"]
      },
      "Emergency Medicine": {
        days: [0, 1, 2, 3, 4, 5, 6],
        slots: ["07:00 AM", "01:00 PM", "07:00 PM"]
      }
    }
  },
  {
    id: "HSP007",
    name: "Nellore Neuro Care Centre",
    city: "nellore",
    pincode: "524001",
    address: "Magunta Layout, Nellore, Andhra Pradesh",
    specialities: [
      "Neurology",
      "Neurosurgery",
      "Physiotherapy"
    ],
    availableBeds: 9,
    totalBeds: 55,
    phone: "0861-2324567",
    emergencyAvailable: false,
    latitude: 14.4426,
    longitude: 79.9865,
    verificationStatus: "verified",
    availability: {
      "Neurology": {
        days: [1, 2, 3, 4, 5, 6],
        slots: ["10:00 AM", "12:00 PM", "03:00 PM"]
      },
      "Neurosurgery": {
        days: [2, 4],
        slots: ["09:30 AM", "11:30 AM", "02:30 PM"]
      },
      "Physiotherapy": {
        days: [1, 3, 5],
        slots: ["10:30 AM", "01:00 PM", "04:00 PM"]
      }
    }
  },
  {
    id: "HSP008",
    name: "Apollo Specialty Clinic Tirupati",
    city: "tirupati",
    pincode: "517507",
    address: "Mangalam Road, Tirupati, Andhra Pradesh",
    specialities: [
      "Dermatology",
      "Cardiology",
      "Neurology"
    ],
    availableBeds: 4,
    totalBeds: 30,
    phone: "0877-2314567",
    emergencyAvailable: false,
    latitude: 13.6692,
    longitude: 79.4458,
    verificationStatus: "verified",
    availability: {
      "Dermatology": {
        days: [1, 3, 6],
        slots: ["10:00 AM", "12:00 PM", "03:00 PM"]
      },
      "Cardiology": {
        days: [2, 5],
        slots: ["09:30 AM", "11:30 AM", "02:30 PM"]
      },
      "Neurology": {
        days: [4, 6],
        slots: ["10:30 AM", "01:00 PM", "04:00 PM"]
      }
    }
  },
  {
    id: "H001",
    name: "NexCare AIIMS Super Speciality Hospital",
    city: "Tirupati",
    pincode: "517501",
    address: "Renigunta Road, Near Central Bus Stand, Tirupati, Andhra Pradesh",
    specialities: [
      "Cardiology",
      "Neurology",
      "General Medicine",
      "Orthopaedics",
      "Paediatrics"
    ],
    availableBeds: 40,
    totalBeds: 250,
    phone: "+91 877 2255000",
    emergencyAvailable: true,
    verificationStatus: "verified",
    availability: {
      "Cardiology": {
        days: [1, 2, 3, 4, 5],
        slots: ["09:00 AM", "10:30 AM", "12:00 PM", "03:00 PM"]
      },
      "Neurology": {
        days: [1, 3, 5],
        slots: ["10:00 AM", "11:30 AM", "02:30 PM"]
      },
      "General Medicine": {
        days: [1, 2, 3, 4, 5, 6],
        slots: ["08:30 AM", "10:00 AM", "01:00 PM", "05:00 PM"]
      },
      "Orthopaedics": {
        days: [2, 3, 4, 5, 6],
        slots: ["09:30 AM", "11:00 AM", "04:00 PM"]
      },
      "Paediatrics": {
        days: [1, 3, 5],
        slots: ["11:00 AM", "01:30 PM", "03:30 PM"]
      }
    }
  },
  {
    id: "H002",
    name: "Apollo Health City",
    city: "Tirupati",
    pincode: "517502",
    address: "Bairagipatteda, Chittoor Road, Tirupati, Andhra Pradesh",
    specialities: [
      "Cardiology",
      "Neurology",
      "Orthopaedics",
      "General Medicine",
      "Dermatology",
      "Paediatrics",
      "Gynaecology"
    ],
    availableBeds: 25,
    totalBeds: 180,
    phone: "+91 877 2288999",
    emergencyAvailable: true,
    verificationStatus: "verified",
    availability: {
      "Cardiology": {
        days: [1, 3, 5],
        slots: ["09:45 AM", "11:15 AM", "03:15 PM"]
      },
      "Neurology": {
        days: [2, 4, 6],
        slots: ["10:15 AM", "12:15 PM", "04:15 PM"]
      },
      "Orthopaedics": {
        days: [1, 2, 3, 4, 5],
        slots: ["08:45 AM", "01:45 PM", "05:15 PM"]
      },
      "General Medicine": {
        days: [1, 2, 3, 4, 5, 6],
        slots: ["09:00 AM", "12:00 PM", "03:00 PM"]
      },
      "Dermatology": {
        days: [1, 4, 6],
        slots: ["11:00 AM", "02:00 PM"]
      },
      "Paediatrics": {
        days: [1, 3, 5],
        slots: ["10:00 AM", "02:00 PM"]
      },
      "Gynaecology": {
        days: [2, 4, 6],
        slots: ["09:00 AM", "01:00 PM"]
      }
    }
  },
  {
    id: "H003",
    name: "Fortis Care Hospital",
    city: "Chennai",
    pincode: "600001",
    address: "Anna Salai, Guindy, Chennai, Tamil Nadu",
    specialities: [
      "Cardiology",
      "Neurology",
      "Orthopaedics",
      "General Medicine",
      "Emergency Medicine"
    ],
    availableBeds: 30,
    totalBeds: 200,
    phone: "+91 44 24331111",
    emergencyAvailable: true,
    verificationStatus: "verified",
    availability: {
      "Cardiology": {
        days: [1, 2, 3, 4, 5],
        slots: ["08:45 AM", "10:15 AM", "01:15 PM", "04:15 PM"]
      },
      "Neurology": {
        days: [1, 3, 5],
        slots: ["09:45 AM", "12:15 PM", "03:45 PM"]
      },
      "Orthopaedics": {
        days: [2, 4, 6],
        slots: ["09:00 AM", "11:00 AM", "02:00 PM"]
      },
      "General Medicine": {
        days: [1, 2, 3, 4, 5, 6],
        slots: ["08:00 AM", "10:00 AM", "12:00 PM", "05:00 PM"]
      },
      "Emergency Medicine": {
        days: [0, 1, 2, 3, 4, 5, 6],
        slots: ["06:00 AM", "10:00 AM", "02:00 PM", "06:00 PM"]
      }
    }
  },
  {
    id: "H004",
    name: "Sri Venkateswara Care Center",
    city: "Tirupati",
    pincode: "517501",
    address: "Alipiri Bypass Road, Tirupati, Andhra Pradesh",
    specialities: [
      "General Medicine",
      "Paediatrics"
    ],
    availableBeds: 10,
    totalBeds: 90,
    phone: "+91 877 2266777",
    emergencyAvailable: false,
    verificationStatus: "pending_verification",
    availability: {
      "General Medicine": {
        days: [1, 2, 3, 4, 5, 6],
        slots: ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"]
      },
      "Paediatrics": {
        days: [1, 3, 5],
        slots: ["09:30 AM", "11:30 AM", "03:30 PM"]
      }
    }
  }
];
