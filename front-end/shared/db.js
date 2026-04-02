// Universal LocalStorage DB Controller across all 4 Portals
const NexCareDB = (() => {
    const DB_KEY = 'nexcare_db_v3';

    // The universal seed database if empty
    const FALLBACK_SEED = {
        "version": 3,
        "users": [
            { "id": "U001", "name": "System Administrator", "email": "superuser@nexcare.com", "role": "superuser", "status": "Active", "password": "Password123" },
            { "id": "U002", "name": "Jane Doe (Desk)", "email": "admin@nexcare.com", "role": "administrative_staff", "status": "Active", "password": "Password123" },
            { "id": "U003", "name": "Driver Bob", "email": "ambulance@nexcare.com", "role": "ambulance", "status": "Active", "password": "Password123" },
            { "id": "U004", "name": "John Anderson", "email": "patient@gmail.com", "role": "patient", "status": "Active", "password": "Password123", "patientId": "P001" },
            { "id": "U005", "name": "Dr. Sarah Smith", "email": "sarah.smith@nexcare.com", "role": "doctor", "dept": "Cardiology", "status": "Active", "password": "Password123" },
            { "id": "U006", "name": "Dr. Vikram Patel", "email": "vikram.patel@nexcare.com", "role": "doctor", "dept": "Orthopedics", "status": "Active", "password": "Password123" },
            { "id": "U007", "name": "Dr. Anjali Desai", "email": "anjali.desai@nexcare.com", "role": "doctor", "dept": "General Medicine", "status": "On Leave", "password": "Password123" },
            { "id": "U008", "name": "Nurse Emily Davis", "email": "emily.davis@nexcare.com", "role": "nurse", "dept": "ER", "status": "Active", "password": "Password123" },
            { "id": "U009", "name": "Maria Garcia", "email": "maria@example.com", "role": "patient", "status": "Active", "password": "Password123", "patientId": "P002" }
        ],
        "patients": [
            { "id": "P001", "fullName": "John Anderson", "phone": "+1 (555) 123-4567", "email": "patient@gmail.com", "patientIdDisplay": "PAT-2026-001", "memberSince": "January 2024", "status": "Active", "bloodGroup": "O+", "age": 45 },
            { "id": "P002", "fullName": "Maria Garcia", "phone": "+1 (555) 987-6543", "email": "maria@example.com", "patientIdDisplay": "PAT-2026-002", "memberSince": "March 2025", "status": "Critical", "bloodGroup": "AB-", "age": 62 },
            { "id": "P003", "fullName": "Ravi Kumar", "phone": "+91 98765 43210", "email": "ravi.kumar@example.com", "patientIdDisplay": "PAT-2026-003", "memberSince": "February 2026", "status": "Active", "bloodGroup": "B+", "age": 28 },
            { "id": "P004", "fullName": "Anita Sharma", "phone": "+91 87654 32109", "email": "anita.sharma@example.com", "patientIdDisplay": "PAT-2026-004", "memberSince": "February 2026", "status": "Critical", "bloodGroup": "A-", "age": 35 },
            { "id": "P005", "fullName": "Priya Singh", "phone": "+91 76543 21098", "email": "priya.singh@example.com", "patientIdDisplay": "PAT-2026-005", "memberSince": "February 2026", "status": "Active", "bloodGroup": "O-", "age": 31 },
            { "id": "P006", "fullName": "Amit Verma", "phone": "+91 65432 10987", "email": "amit.verma@example.com", "patientIdDisplay": "PAT-2026-006", "memberSince": "February 2026", "status": "Active", "bloodGroup": "B-", "age": 42 },
            { "id": "P007", "fullName": "Kiran Rao", "phone": "+91 54321 09876", "email": "kiran.rao@example.com", "patientIdDisplay": "PAT-2026-007", "memberSince": "February 2026", "status": "Active", "bloodGroup": "AB+", "age": 29 },
            { "id": "P008", "fullName": "Rahul Jain", "phone": "+91 43210 98765", "email": "rahul.jain@example.com", "patientIdDisplay": "PAT-2026-008", "memberSince": "February 2026", "status": "Active", "bloodGroup": "A+", "age": 38 },
            { "id": "P009", "fullName": "Deepak Kumar", "phone": "+91 32109 87654", "email": "deepak.kumar@example.com", "patientIdDisplay": "PAT-2026-009", "memberSince": "February 2026", "status": "Active", "bloodGroup": "O+", "age": 47 },
            { "id": "P010", "fullName": "Arjun Reddy", "phone": "+91 21098 76543", "email": "arjun.reddy@example.com", "patientIdDisplay": "PAT-2026-010", "memberSince": "February 2026", "status": "Active", "bloodGroup": "B+", "age": 33 },
            { "id": "P011", "fullName": "Neha Gupta", "phone": "+91 10987 65432", "email": "neha.gupta@example.com", "patientIdDisplay": "PAT-2026-011", "memberSince": "February 2026", "status": "Active", "bloodGroup": "A-", "age": 26 },
            { "id": "P012", "fullName": "Kid A", "phone": "+91 99999 00001", "email": "kid.a@example.com", "patientIdDisplay": "PAT-2026-012", "memberSince": "February 2026", "status": "Active", "bloodGroup": "O+", "age": 8 },
            { "id": "P013", "fullName": "Mother A", "phone": "+91 99999 00002", "email": "mother.a@example.com", "patientIdDisplay": "PAT-2026-013", "memberSince": "February 2026", "status": "Active", "bloodGroup": "B-", "age": 30 },
            { "id": "P014", "fullName": "Mother B", "phone": "+91 99999 00003", "email": "mother.b@example.com", "patientIdDisplay": "PAT-2026-014", "memberSince": "February 2026", "status": "Active", "bloodGroup": "AB-", "age": 34 },
            { "id": "P015", "fullName": "John Doe", "phone": "+91 99999 00004", "email": "johndoe@example.com", "patientIdDisplay": "PAT-2026-015", "memberSince": "January 2026", "status": "Active", "bloodGroup": "O+", "age": 32 }
        ],
        "appointments": [
            { "id": "APT-001", "patientId": "P001", "patientName": "John Anderson", "department": "Cardiology", "doctor": "Dr. Sarah Smith", "dateLabel": "March 15, 2026", "timeLabel": "10:00 AM", "token": "TKN-1234", "fee": 150, "status": "Confirmed", "reason": "Routine heart checkup", "createdAt": new Date().toISOString() },
            { "id": "APT-002", "patientId": "P002", "patientName": "Maria Garcia", "department": "Orthopedics", "doctor": "Dr. Vikram Patel", "dateLabel": "April 02, 2026", "timeLabel": "02:30 PM", "token": "TKN-5678", "fee": 200, "status": "Pending", "reason": "Severe knee pain - Emergency Consult", "createdAt": new Date().toISOString() },
            { "id": "APT-003", "patientId": "P001", "patientName": "John Anderson", "department": "General Medicine", "doctor": "Dr. Anjali Desai", "dateLabel": "March 01, 2026", "timeLabel": "11:00 AM", "token": "TKN-9012", "fee": 100, "status": "Completed", "reason": "Annual physical", "createdAt": new Date().toISOString() }
        ],
        "ambulanceRequests": [
            { "id": "AMB-001", "patientId": "P002", "patientName": "Maria Garcia", "pickupLocation": "742 Evergreen Terrace, Springfield", "contact": "+1 (555) 987-6543", "notes": "Patient is experiencing severe chest pains and shortness of breath.", "status": "Dispatched", "assignedTo": "U003", "createdAt": "2026-04-02T10:15:00Z" },
            { "id": "AMB-002", "patientId": "P001", "patientName": "John Anderson", "pickupLocation": "123 Main Street, Downtown", "contact": "+1 (555) 123-4567", "notes": "Mild concussion from a fall.", "status": "Completed", "assignedTo": "U003", "createdAt": "2026-03-25T14:20:00Z" }
        ],
        "bills": [
            { "id": "BILL-001", "patientId": "P001", "visitDate": "1 March, 2026", "dueDate": "15 March, 2026", "status": "Paid", "currency": "₹", "subtotal": 1000, "cgstRate": 0.09, "sgstRate": 0.09, "items": [ { "description": "General Consultation", "department": "General Medicine", "amount": 1000 } ], "payments": [] },
            { "id": "BILL-002", "patientId": "P002", "visitDate": "2 April, 2026", "dueDate": "16 April, 2026", "status": "Pending", "currency": "₹", "subtotal": 5500, "cgstRate": 0.09, "sgstRate": 0.09, "items": [ { "description": "Emergency Room Admittance", "department": "ER", "amount": 2500 }, { "description": "MRI Scan", "department": "Radiology", "amount": 3000 } ], "payments": [] }
        ],
        "feedback": [
            { "id": "FB-001", "patientId": "P001", "sender": "John Anderson", "type": "Patient", "category": "service", "subject": "Great doctors", "summary": "Dr. Smith was incredibly thorough and attentive.", "rating": 5, "status": "Resolved", "createdAt": new Date().toISOString() },
            { "id": "FB-002", "patientId": "P002", "sender": "Maria Garcia", "type": "Patient", "category": "facilities", "subject": "Wait times in ER", "summary": "Waiting room was cold and wait was an hour.", "rating": 2, "status": "Open", "createdAt": new Date().toISOString() },
            { "id": "FB-003", "patientId": "U005", "sender": "Dr. Sarah Smith", "type": "Staff", "category": "software", "subject": "System crash", "summary": "EHR system frequently times out on large files.", "rating": 3, "status": "In Progress", "createdAt": new Date().toISOString() }
        ],
        "inventory": [
            { "id": "INV-1", "name": "Surgical Masks (N95)", "category": "Consumables", "quantity": 120, "status": "Low Stock" },
            { "id": "INV-2", "name": "ECG Machines", "category": "Equipment", "quantity": 15, "status": "In Stock" },
            { "id": "INV-3", "name": "Paracetamol 500mg", "category": "Pharmacy", "quantity": 0, "status": "Out of Stock" }
        ],
        "beds": [
            { "id": "E1", "ward": "Emergency", "status": "occupied", "patient": "Ravi Kumar" },
            { "id": "E2", "ward": "Emergency", "status": "critical", "patient": "Anita Sharma" },
            { "id": "E3", "ward": "Emergency", "status": "available", "patient": "" },
            { "id": "G1", "ward": "General", "status": "occupied", "patient": "John Doe" },
            { "id": "G2", "ward": "General", "status": "occupied", "patient": "Priya Singh" },
            { "id": "G3", "ward": "General", "status": "occupied", "patient": "Amit Verma" },
            { "id": "G4", "ward": "General", "status": "occupied", "patient": "Kiran Rao" },
            { "id": "G5", "ward": "General", "status": "occupied", "patient": "Rahul Jain" },
            { "id": "G6", "ward": "General", "status": "occupied", "patient": "Deepak Kumar" },
            { "id": "G7", "ward": "General", "status": "occupied", "patient": "Arjun Reddy" },
            { "id": "G8", "ward": "General", "status": "occupied", "patient": "Neha Gupta" },
            { "id": "G9", "ward": "General", "status": "available", "patient": "" },
            { "id": "G10", "ward": "General", "status": "available", "patient": "" },
            { "id": "P1", "ward": "Pediatrics", "status": "occupied", "patient": "Kid A" },
            { "id": "P2", "ward": "Pediatrics", "status": "available", "patient": "" },
            { "id": "P3", "ward": "Pediatrics", "status": "available", "patient": "" },
            { "id": "M1", "ward": "Maternity", "status": "occupied", "patient": "Mother A" },
            { "id": "M2", "ward": "Maternity", "status": "occupied", "patient": "Mother B" },
            { "id": "M3", "ward": "Maternity", "status": "available", "patient": "" },
            { "id": "M4", "ward": "Maternity", "status": "available", "patient": "" }
        ]
    };

    function read() {
        try {
            const raw = localStorage.getItem(DB_KEY);
            if (!raw) {
                // Initialize synchronously on first read using fallback
                localStorage.setItem(DB_KEY, JSON.stringify(FALLBACK_SEED));
                return FALLBACK_SEED;
            }
            return JSON.parse(raw);
        } catch {
            return FALLBACK_SEED;
        }
    }

    function write(data) {
        localStorage.setItem(DB_KEY, JSON.stringify(data));
    }

    // Smart Migration Logic
    function migrate() {
        const db = read();
        let changed = false;

        // Ensure all patients from FALLBACK_SEED exist
        FALLBACK_SEED.patients.forEach(p => {
            if (!db.patients.find(existing => existing.id === p.id)) {
                db.patients.push(p);
                changed = true;
            }
        });

        // Ensure beds table exists and has latest seed
        if (!db.beds || db.beds.length === 0) {
            db.beds = FALLBACK_SEED.beds;
            changed = true;
        } else {
            // Check for missing beds specifically
            FALLBACK_SEED.beds.forEach(b => {
                if (!db.beds.find(existing => existing.id === b.id)) {
                    db.beds.push(b);
                    changed = true;
                }
            });
        }

        if (changed) {
            db.version = FALLBACK_SEED.version;
            write(db);
            console.log("NexCareDB: Migration complete. Added missing mock subjects and beds.");
        }
    }

    // Run migration on boot
    migrate();

    // Generic Table Getters & Modifiers
    function getTable(tableName) {
        return read()[tableName] || [];
    }

    function addRow(tableName, row) {
        const db = read();
        if (!db[tableName]) db[tableName] = [];
        db[tableName].unshift(row);
        write(db);
        return row;
    }

    function updateRow(tableName, id, patch) {
        const db = read();
        if (!db[tableName]) return;
        const idx = db[tableName].findIndex(r => r.id === id);
        if (idx > -1) {
            db[tableName][idx] = { ...db[tableName][idx], ...patch, updatedAt: new Date().toISOString() };
            write(db);
        }
    }

    function deleteRow(tableName, id) {
        const db = read();
        if (!db[tableName]) return;
        db[tableName] = db[tableName].filter(r => r.id !== id);
        write(db);
    }
    
    // Auth Helpers
    function authenticate(email, password, role) {
        const users = getTable('users');
        return users.find(u => u.email === email && u.password === password && u.role === role);
    }

    function getActiveUser(email) {
        const users = getTable('users');
        return users.find(u => u.email === email);
    }
    
    function registerPatient(patientData, password) {
        const userId = 'U' + Math.floor(Math.random() * 90000 + 10000);
        const pId = 'P' + Math.floor(Math.random() * 90000 + 10000);
        
        // Add User Auth Row
        addRow('users', {
            id: userId,
            name: patientData.fullName,
            email: patientData.email,
            role: "patient",
            status: "Active",
            password: password,
            patientId: pId
        });
        
        // Add Patient Profile Row
        addRow('patients', {
            id: pId,
            fullName: patientData.fullName,
            phone: patientData.phone || "",
            email: patientData.email,
            patientIdDisplay: "PAT-" + new Date().getFullYear() + "-" + Math.floor(Math.random() * 9000),
            memberSince: new Date().toLocaleDateString('default', { month: 'long', year: 'numeric' }),
            status: "Active",
            bloodGroup: patientData.bloodGroup || "Unknown",
            age: patientData.age || 0
        });
        
        return { userId, pId };
    }

    // Explicit Context Bridge (Backwards compatibility for Patient Portal)
    // Patient portal currently hardcodes its own 'activePatientId' or similar scopes based on login.
    function getActivePatientScope() {
        const email = sessionStorage.getItem("nexcare_user_email");
        if(email) {
            const u = getActiveUser(email);
            if(u && u.patientId) return u.patientId;
        }
        return "P001"; // Default mockup
    }

    return {
        // Raw access
        read,
        write,
        getTable,
        addRow,
        updateRow,
        deleteRow,
        
        // Auth
        authenticate,
        getActiveUser,
        registerPatient,
        
        // Legacy DataStore Bridging Context
        getActivePatientScope,
        
        // Custom Helpers
        generateId: (prefix) => prefix + "-" + Math.floor(Math.random() * 90000 + 10000)
    };
})();

// Assign to global
window.NexCareDB = NexCareDB;

// Override `NexCareStore` to use `NexCareDB` directly so patient logic works implicitly!
window.NexCareStore = {
    read: () => NexCareDB.read(),
    getActivePatient: () => {
        const pId = NexCareDB.getActivePatientScope();
        return NexCareDB.getTable('patients').find(p => p.id === pId);
    },
    updateActivePatient: (patch) => {
        NexCareDB.updateRow('patients', NexCareDB.getActivePatientScope(), patch);
    },
    
    // Appointments
    listAppointments: () => NexCareDB.getTable('appointments').filter(a => a.patientId === NexCareDB.getActivePatientScope()),
    createAppointment: (data) => {
        return NexCareDB.addRow('appointments', {
            id: NexCareDB.generateId("APT"),
            patientId: NexCareDB.getActivePatientScope(),
            patientName: NexCareDB.getTable('patients').find(p => p.id === NexCareDB.getActivePatientScope())?.fullName || 'Self',
            department: data.department,
            doctor: data.doctor || "TBD",
            dateLabel: data.dateLabel,
            timeLabel: data.timeLabel,
            token: data.token || NexCareDB.generateId("TKN"),
            fee: data.fee || 100,
            status: data.status || "Confirmed",
            reason: data.reason || "",
            createdAt: new Date().toISOString()
        });
    },
    updateAppointment: (id, patch) => NexCareDB.updateRow('appointments', id, patch),
    deleteAppointment: (id) => NexCareDB.deleteRow('appointments', id),
    
    // Ambulance
    listAmbulanceRequests: () => NexCareDB.getTable('ambulanceRequests').filter(r => r.patientId === NexCareDB.getActivePatientScope()),
    createAmbulanceRequest: (data) => {
        return NexCareDB.addRow('ambulanceRequests', {
            id: NexCareDB.generateId("AMB"),
            patientId: NexCareDB.getActivePatientScope(),
            patientName: NexCareDB.getTable('patients').find(p => p.id === NexCareDB.getActivePatientScope())?.fullName || 'Self',
            pickupLocation: data.pickupLocation,
            contact: data.contact,
            notes: data.notes || "",
            status: data.status || "Pending",
            createdAt: new Date().toISOString()
        });
    },
    updateAmbulanceRequest: (id, patch) => NexCareDB.updateRow('ambulanceRequests', id, patch),
    deleteAmbulanceRequest: (id) => NexCareDB.deleteRow('ambulanceRequests', id),
    
    // Bills
    listBills: () => NexCareDB.getTable('bills').filter(b => b.patientId === NexCareDB.getActivePatientScope()),
    getBill: (id) => NexCareDB.getTable('bills').find(b => b.id === id),
    createBill: (data) => {
        return NexCareDB.addRow('bills', {
            id: NexCareDB.generateId("BILL"),
            patientId: NexCareDB.getActivePatientScope(),
            visitDate: data.visitDate,
            dueDate: data.dueDate,
            status: "Pending",
            currency: "₹",
            subtotal: data.subtotal || 0,
            cgstRate: 0.09,
            sgstRate: 0.09,
            items: data.items || [],
            payments: []
        });
    },
    markBillPaid: (id, payment) => {
        const bill = NexCareDB.getTable('bills').find(b => b.id === id);
        if(!bill) return;
        const payments = [...(bill.payments || []), {
            id: NexCareDB.generateId("PAY"), amount: payment.amount, method: payment.method || "CARD", createdAt: new Date().toISOString()
        }];
        NexCareDB.updateRow('bills', id, { status: "Paid", payments: payments });
    },
    
    // Feedback
    listFeedback: () => NexCareDB.getTable('feedback').filter(f => f.patientId === NexCareDB.getActivePatientScope()),
    createFeedback: (data) => {
        return NexCareDB.addRow('feedback', {
            id: NexCareDB.generateId("FB"),
            patientId: NexCareDB.getActivePatientScope(),
            sender: NexCareDB.getTable('patients').find(p => p.id === NexCareDB.getActivePatientScope())?.fullName || 'Self',
            type: "Patient",
            category: data.category,
            summary: data.description,
            subject: data.category + " Feedback",
            rating: data.rating,
            status: data.status || "Open",
            createdAt: new Date().toISOString()
        });
    },
    updateFeedback: (id, patch) => NexCareDB.updateRow('feedback', id, patch),
    deleteFeedback: (id) => NexCareDB.deleteRow('feedback', id)
};
