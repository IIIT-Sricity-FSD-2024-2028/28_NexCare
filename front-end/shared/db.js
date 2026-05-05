// NEXCARE COMPATIBILITY BRIDGE - Backend API + LocalStorage Fallback
// This file provides backward compatibility while routing to backend API when available

// Global helper: check if the NexCareAPI layer is loaded
function isAPIAvailable() {
    return window.NexCareAPI && typeof window.NexCareAPI.get === 'function';
}

const NexCareDB = (() => {
    const DB_KEY = 'nexcare_db_v3';
    let activePatientId = null;

    // Helper function to check if API is available (uses global)
    // Kept for internal IIFE usage — delegates to the global function
    // so NexCareStore (defined outside the IIFE) can also call it.

    // Helper function to try API first, fallback to localStorage
    async function tryAPIFirst(apiCall, fallbackCall, tableName = null) {
        if (isAPIAvailable()) {
            try {
                const result = await apiCall();
                if (result.success) {
                    return result.data || result;
                }
                // API failed, fall back to localStorage
                console.warn(`API call failed, falling back to localStorage for ${tableName || 'data'}`);
            } catch (error) {
                console.warn(`API error, falling back to localStorage for ${tableName || 'data'}:`, error.message);
            }
        }
        return fallbackCall();
    }

    // Fallback seed data for offline/demo mode (minimal)
    const FALLBACK_SEED = {
        "version": 3,
        "users": [
            { "id": "U001", "name": "System Administrator", "email": "superuser@nexcare.com", "role": "superuser", "status": "Active", "password": "Password123" },
            { "id": "U002", "name": "Jane Doe (Desk)", "email": "admin@nexcare.com", "role": "administrative_staff", "status": "Active", "password": "Password123" },
            { "id": "U003", "name": "Alex Martinez", "email": "ambulance@nexcare.com", "role": "ambulance", "status": "Active", "password": "Password123" },
            { "id": "U004", "name": "John Anderson", "email": "patient@gmail.com", "role": "patient", "status": "Active", "password": "Password123", "patientId": "P001" }
        ],
        "patients": [
            { "id": "P001", "fullName": "John Anderson", "phone": "5551234567", "email": "patient@gmail.com", "patientIdDisplay": "PAT-2026-001", "memberSince": "January 2024", "status": "Active", "bloodGroup": "O+", "age": 45 }
        ],
        "appointments": [],
        "systemActivity": [],
        "ambulanceRequests": [],
        "bills": [],
        "feedback": [],
        "inventory": [],
        "beds": [],
        "settings": {
            "hospitalName": "NexCare General Hospital",
            "supportEmail": "support@nexcare.com",
            "emergencyPhone": "911",
            "enableRegistration": true,
            "maintenanceMode": false
        }
    };

    // LocalStorage fallback functions
    function read() {
        try {
            const raw = localStorage.getItem(DB_KEY);
            if (!raw) {
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

    // Auth Helpers with API fallback
    async function authenticate(email, password, role) {
        if (isAPIAvailable()) {
            try {
                const result = await window.NexCareAPI.Auth.login({ email, password, role });
                if (result.success) {
                    return result.data.user;
                }
            } catch (error) {
                console.warn('Auth API failed, using fallback:', error.message);
            }
        }
        // Fallback to localStorage
        const users = getTable('users');
        return users.find(u => u.email === email && u.password === password && u.role === role);
    }

    async function getActiveUser(email) {
        if (isAPIAvailable()) {
            try {
                const userData = sessionStorage.getItem('nexcare_user_data');
                if (userData) {
                    return JSON.parse(userData);
                }
                const result = await window.NexCareAPI.Users.getAll();
                if (result.success) {
                    return result.data.find(u => u.email === email);
                }
            } catch (error) {
                console.warn('Get user API failed, using fallback:', error.message);
            }
        }
        // Fallback to localStorage
        const users = getTable('users');
        return users.find(u => u.email === email);
    }
    
    async function registerPatient(patientData, password) {
        if (isAPIAvailable()) {
            try {
                const result = await window.NexCareAPI.Auth.register({
                    fullName: patientData.fullName,
                    email: patientData.email,
                    phone: patientData.phone,
                    password: password,
                    bloodGroup: patientData.bloodGroup,
                    age: patientData.age
                });
                if (result.success) {
                    return { userId: result.data.user.id, pId: result.data.patientId };
                }
            } catch (error) {
                console.warn('Register API failed, using fallback:', error.message);
            }
        }
        
        // Fallback to localStorage
        const userId = 'U' + Math.floor(Math.random() * 90000 + 10000);
        const pId = 'P' + Math.floor(Math.random() * 90000 + 10000);
        
        addRow('users', {
            id: userId,
            name: patientData.fullName,
            email: patientData.email,
            role: "patient",
            status: "Active",
            password: password,
            patientId: pId
        });
        
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
        
        logActivity('Create', 'Registration', `New patient registered: ${patientData.fullName} (ID: ${pId})`);
        
        return { userId, pId };
    }

    function setActivePatientScope(id) {
        activePatientId = id;
    }

    function getActivePatientScope() {
        // 1. Check in-memory override (set by portals from JWT)
        if (activePatientId) return activePatientId;

        // 2. Try to get from JWT token (most reliable)
        const token = sessionStorage.getItem('nexcare_auth_token') || localStorage.getItem('nexcare_auth_token');
        if (token) {
            try {
                const parts = token.split('.');
                if (parts.length === 3) {
                    let raw = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                    while (raw.length % 4) raw += '=';
                    const json = decodeURIComponent(atob(raw).split('').map(function(c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                    const payload = JSON.parse(json);
                    if (payload.patientId) {
                        activePatientId = payload.patientId; // Cache it
                        return payload.patientId;
                    }
                }
            } catch (e) {
                console.warn('JWT decode failed in getActivePatientScope:', e);
            }
        }

        // 3. Fallback to session storage user blob
        const userData = sessionStorage.getItem('nexcare_user_data');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (user.patientId) return user.patientId;
            } catch (e) {}
        }

        // 4. Final fallback
        return "P001";
    }

    async function logActivity(action, module, details) {
        if (isAPIAvailable()) {
            try {
                await window.NexCareAPI.System.logActivity({
                    action,
                    module,
                    details,
                    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                    createdAt: new Date().toISOString()
                });
                return;
            } catch (error) {
                console.warn('Activity log API failed, using fallback:', error.message);
            }
        }
        
        // Fallback to localStorage
        const email = sessionStorage.getItem("nexcare_user_email") || "System";
        const userPromise = getActiveUser(email);
        const user = userPromise instanceof Promise ? await userPromise : userPromise;
        const actorName = user ? user.name : "System Admin";
        
        const activity = {
            id: "ACT-" + Math.floor(Math.random() * 90000 + 10000),
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            actor: actorName,
            action: action,
            module: module,
            details: details,
            createdAt: new Date().toISOString()
        };
        
        addRow('systemActivity', activity);
        return activity;
    }

    // Return compatibility bridge
    return {
        // Raw access (localStorage fallback only)
        read,
        write,
        getTable,
        addRow,
        updateRow,
        deleteRow,
        
        // Auth (API + fallback)
        authenticate,
        getActiveUser,
        registerPatient,
        
        // Legacy DataStore Bridging Context
        getActivePatientScope,
        setActivePatientScope,
        
        // Custom Helpers
        logActivity,
        generateId: (prefix) => prefix + "-" + Math.floor(Math.random() * 90000 + 10000)
    };
})();

// Assign to global
window.NexCareDB = NexCareDB;

// NexCareStore Compatibility Bridge with API integration
window.NexCareStore = {
    read: () => NexCareDB.read(),
    
    async getActivePatient() {
        const pId = NexCareDB.getActivePatientScope();
        
        if (isAPIAvailable()) {
            try {
                const result = await window.NexCareAPI.Patients.getById(pId);
                if (result.success) {
                    return result.data;
                }
            } catch (error) {
                console.warn('Get patient API failed, using fallback:', error.message);
            }
        }
        
        return NexCareDB.getTable('patients').find(p => p.id === pId);
    },
    
    async updateActivePatient(patch) {
        const patientId = NexCareDB.getActivePatientScope();
        
        if (isAPIAvailable()) {
            try {
                const result = await window.NexCareAPI.Patients.update(patientId, patch);
                if (result.success) {
                    // Update session data if name/email changed
                    const sessionEmail = sessionStorage.getItem("nexcare_user_email");
                    if (patch.fullName || patch.email) {
                        const userData = sessionStorage.getItem('nexcare_user_data');
                        if (userData) {
                            const user = JSON.parse(userData);
                            if (patch.fullName) user.name = patch.fullName;
                            if (patch.email) user.email = patch.email;
                            sessionStorage.setItem('nexcare_user_data', JSON.stringify(user));
                        }
                    }
                    await NexCareDB.logActivity('Update', 'Profile', `Updated profile details for ${patch.fullName || 'Patient'} (ID: ${patientId}).`);
                    return result.data;
                }
            } catch (error) {
                console.warn('Update patient API failed, using fallback:', error.message);
            }
        }
        
        // Fallback to localStorage
        const existingPatient = NexCareDB.getTable('patients').find(p => p.id === patientId);
        NexCareDB.updateRow('patients', patientId, patch);

        // Keep auth user row in sync
        const sessionEmail = sessionStorage.getItem("nexcare_user_email");
        const userRow = sessionEmail ? await NexCareDB.getActiveUser(sessionEmail) : null;
        if (userRow && userRow.patientId === patientId) {
            const nextName = patch.fullName ?? patch.name ?? userRow.name;
            const nextEmail = patch.email ?? userRow.email;
            NexCareDB.updateRow('users', userRow.id, { name: nextName, email: nextEmail });

            if (nextEmail && nextEmail !== sessionEmail) {
                sessionStorage.setItem("nexcare_user_email", nextEmail);
            }
        }

        const newName = patch.fullName ?? patch.name ?? existingPatient?.fullName ?? "Patient";
        NexCareDB.logActivity('Update', 'Profile', `Updated profile details for ${newName} (ID: ${patientId}).`);
    },
    
    // Appointments with API integration
    async listAppointments() {
        const patientId = NexCareDB.getActivePatientScope();
        
        if (isAPIAvailable()) {
            try {
                const result = await window.NexCareAPI.Appointments.getAll(patientId);
                if (result.success) {
                    return result.data;
                }
            } catch (error) {
                console.warn('List appointments API failed, using fallback:', error.message);
            }
        }
        
        return NexCareDB.getTable('appointments').filter(a => a.patientId === patientId);
    },
    
    async createAppointment(data) {
        const patientId = NexCareDB.getActivePatientScope();
        const patient = await this.getActivePatient();
        
        if (isAPIAvailable()) {
            try {
                // White-list fields for backend DTO validation
                const payload = {
                    patientId,
                    department: data.department,
                    doctor: data.doctor || "TBD",
                    dateLabel: data.dateLabel,
                    timeLabel: data.timeLabel,
                    reason: data.reason || "",
                    fee: data.fee || 100
                };
                const result = await window.NexCareAPI.Appointments.create(payload);
                if (result.success) {
                    await NexCareDB.logActivity('Create', 'Appointments', `Booked appointment (${result.data.id}) for ${data.department} with ${data.doctor} on ${data.dateLabel} at ${data.timeLabel}.`);
                    return result.data;
                }
            } catch (error) {
                console.warn('Create appointment API failed, using fallback:', error.message);
            }
        }
        
        // Fallback to localStorage
        const appt = NexCareDB.addRow('appointments', {
            id: NexCareDB.generateId("APT"),
            patientId,
            patientName: patient?.fullName || 'Self',
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
        NexCareDB.logActivity('Create', 'Appointments', `Booked appointment (${appt.id}) for ${appt.department} with ${appt.doctor} on ${appt.dateLabel} at ${appt.timeLabel}.`);
        return appt;
    },
    
    async updateAppointment(id, patch) {
        if (isAPIAvailable()) {
            try {
                const result = await window.NexCareAPI.Appointments.update(id, patch);
                if (result.success) {
                    const status = patch?.status ? ` Status: ${patch.status}.` : '';
                    await NexCareDB.logActivity('Update', 'Appointments', `Updated appointment (${id}).${status}`);
                    return result.data;
                }
            } catch (error) {
                console.warn('Update appointment API failed, using fallback:', error.message);
            }
        }
        
        NexCareDB.updateRow('appointments', id, patch);
        const updated = NexCareDB.getTable('appointments').find(a => a.id === id);
        const status = patch?.status ? ` Status: ${patch.status}.` : '';
        NexCareDB.logActivity('Update', 'Appointments', `Updated appointment (${id}).${status}`);
        return updated;
    },
    
    async deleteAppointment(id) {
        if (isAPIAvailable()) {
            try {
                const result = await window.NexCareAPI.Appointments.delete(id);
                if (result.success) {
                    await NexCareDB.logActivity('Delete', 'Appointments', `Deleted appointment record (${id}).`);
                    return;
                }
            } catch (error) {
                console.warn('Delete appointment API failed, using fallback:', error.message);
            }
        }
        
        NexCareDB.deleteRow('appointments', id);
        NexCareDB.logActivity('Delete', 'Appointments', `Deleted appointment record (${id}).`);
    },
    
    // Ambulance with API integration
    async listAllAmbulanceRequests() {
        if (isAPIAvailable()) {
            try {
                const result = await window.NexCareAPI.Ambulance.getAllRequests();
                if (result.success) return result.data;
            } catch (error) {
                console.warn('List ambulance requests API failed, using fallback:', error.message);
            }
        }
        return NexCareDB.getTable('ambulanceRequests');
    },
    
    async listAmbulanceRequests() {
        const patientId = NexCareDB.getActivePatientScope();
        
        if (isAPIAvailable()) {
            try {
                const result = await window.NexCareAPI.Ambulance.getAllRequests();
                if (result.success) {
                    return result.data.filter(r => r.patientId === patientId);
                }
            } catch (error) {
                console.warn('List ambulance requests API failed, using fallback:', error.message);
            }
        }
        
        return NexCareDB.getTable('ambulanceRequests').filter(r => r.patientId === patientId);
    },
    
    async createAmbulanceRequest(data) {
        const patientId = NexCareDB.getActivePatientScope();
        const patient = await this.getActivePatient();
        
        if (isAPIAvailable()) {
            try {
                const result = await window.NexCareAPI.Ambulance.createRequest({
                    ...data,
                    patientId,
                    patientName: patient?.fullName || 'Self'
                });
                if (result.success) {
                    await NexCareDB.logActivity('Create', 'Ambulance', `New ambulance request (${result.data.id}) created. Location: ${data.pickupLocation}.`);
                    return result.data;
                }
            } catch (error) {
                console.warn('Create ambulance request API failed, using fallback:', error.message);
            }
        }
        
        const req = NexCareDB.addRow('ambulanceRequests', {
            id: NexCareDB.generateId("AMB"),
            patientId,
            patientName: patient?.fullName || 'Self',
            pickupLocation: data.pickupLocation,
            contact: data.contact,
            notes: data.notes || "",
            status: data.status || "Pending",
            createdAt: new Date().toISOString()
        });
        NexCareDB.logActivity('Create', 'Ambulance', `New ambulance request (${req.id}) created. Location: ${req.pickupLocation}.`);
        return req;
    },
    
    async updateAmbulanceRequest(id, patch) {
        if (isAPIAvailable()) {
            try {
                const result = await window.NexCareAPI.Ambulance.updateRequest(id, patch);
                if (result.success) {
                    const status = patch?.status ? ` Status: ${patch.status}.` : '';
                    await NexCareDB.logActivity('Update', 'Ambulance', `Updated ambulance request (${id}).${status}`);
                    return result.data;
                }
            } catch (error) {
                console.warn('Update ambulance request API failed, using fallback:', error.message);
            }
        }
        
        NexCareDB.updateRow('ambulanceRequests', id, patch);
        const status = patch?.status ? ` Status: ${patch.status}.` : '';
        NexCareDB.logActivity('Update', 'Ambulance', `Updated ambulance request (${id}).${status}`);
    },
    
    async deleteAmbulanceRequest(id) {
        if (isAPIAvailable()) {
            try {
                const result = await window.NexCareAPI.Ambulance.cancelRequest(id);
                if (result.success) {
                    await NexCareDB.logActivity('Delete', 'Ambulance', `Deleted ambulance request (${id}).`);
                    return;
                }
            } catch (error) {
                console.warn('Delete ambulance request API failed, using fallback:', error.message);
            }
        }
        
        NexCareDB.deleteRow('ambulanceRequests', id);
        NexCareDB.logActivity('Delete', 'Ambulance', `Deleted ambulance request (${id}).`);
    },
    
    // Bills with API integration
    async listBills() {
        const patientId = NexCareDB.getActivePatientScope();
        
        if (isAPIAvailable()) {
            try {
                const result = await window.NexCareAPI.Billing.getAll(patientId);
                if (result.success) {
                    return result.data;
                }
            } catch (error) {
                console.warn('List bills API failed, using fallback:', error.message);
            }
        }
        
        return NexCareDB.getTable('bills').filter(b => b.patientId === patientId);
    },
    
    async getBill(id) {
        if (isAPIAvailable()) {
            try {
                const result = await window.NexCareAPI.Billing.getById(id);
                if (result.success) return result.data;
            } catch (error) {
                console.warn('Get bill API failed, using fallback:', error.message);
            }
        }
        return NexCareDB.getTable('bills').find(b => b.id === id);
    },
    
    async createBill(data) {
        const patientId = NexCareDB.getActivePatientScope();
        
        if (isAPIAvailable()) {
            try {
                const result = await window.NexCareAPI.Billing.create({
                    patientId,
                    visitDate: data.visitDate,
                    dueDate: data.dueDate,
                    items: data.items || []
                });
                if (result.success) {
                    const amt = result.data.total || data.subtotal || 0;
                    await NexCareDB.logActivity('Create', 'Billing', `Generated bill (${result.data.id}) amount ${data.currency || '₹'}${amt}.`);
                    return result.data;
                }
            } catch (error) {
                console.warn('Create bill API failed, using fallback:', error.message);
            }
        }
        
        const bill = NexCareDB.addRow('bills', {
            id: NexCareDB.generateId("BILL"),
            patientId,
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
        NexCareDB.logActivity('Create', 'Billing', `Generated bill (${bill.id}) amount ${bill.currency}${bill.subtotal}.`);
        return bill;
    },
    
    async markBillPaid(id, payment) {
        if (isAPIAvailable()) {
            try {
                // Whitelist fields for ProcessPaymentDto validation
                const payload = {
                    method: payment.method || 'CARD',
                    amount: Number(payment.amount) || 0
                };
                if (payment.transactionId) payload.transactionId = payment.transactionId;
                const result = await window.NexCareAPI.Billing.markPaid(id, payload);
                if (result.success) {
                    await NexCareDB.logActivity('Update', 'Billing', `Payment received for ${id}. Amount: ${payment.amount}.`);
                    return result.data;
                }
            } catch (error) {
                console.warn('Mark bill paid API failed, using fallback:', error.message);
            }
        }
        
        const bill = NexCareDB.getTable('bills').find(b => b.id === id);
        if(!bill) return;
        const payments = [...(bill.payments || []), {
            id: NexCareDB.generateId("PAY"), amount: payment.amount, method: payment.method || "CARD", createdAt: new Date().toISOString()
        }];
        NexCareDB.updateRow('bills', id, { status: "Paid", payments: payments });
        NexCareDB.logActivity('Update', 'Billing', `Payment received for ${bill.id}. Amount: ${bill.currency}${payment.amount}.`);
    },
    
    async deleteBill(id) {
        if (isAPIAvailable()) {
            try {
                const result = await window.NexCareAPI.Billing.delete(id);
                if (result.success) {
                    await NexCareDB.logActivity('Delete', 'Billing', `Deleted bill record (${id}).`);
                    return;
                }
            } catch (error) {
                console.warn('Delete bill API failed, using fallback:', error.message);
            }
        }
        
        NexCareDB.deleteRow('bills', id);
        NexCareDB.logActivity('Delete', 'Billing', `Deleted bill record (${id}).`);
    },
    
    // Feedback with API integration
    async listFeedback() {
        const patientId = NexCareDB.getActivePatientScope();
        
        if (isAPIAvailable()) {
            try {
                const result = await window.NexCareAPI.Feedback.getAll();
                if (result.success) {
                    return result.data.filter(f => f.patientId === patientId);
                }
            } catch (error) {
                console.warn('List feedback API failed, using fallback:', error.message);
            }
        }
        
        return NexCareDB.getTable('feedback').filter(f => f.patientId === patientId);
    },
    
    async createFeedback(data) {
        const patientId = NexCareDB.getActivePatientScope();
        const patient = await this.getActivePatient();
        
        if (isAPIAvailable()) {
            try {
                const result = await window.NexCareAPI.Feedback.create({
                    patientId,
                    sender: patient?.fullName || 'Patient',
                    type: 'Patient',
                    category: data.category,
                    subject: data.category + " Feedback",
                    summary: data.description || data.summary || '',
                    rating: Number(data.rating) || 1
                });
                if (result.success) {
                    await NexCareDB.logActivity('Create', 'Feedback', `New feedback submitted (${result.data.id}) in category "${data.category}".`);
                    return result.data;
                }
            } catch (error) {
                console.warn('Create feedback API failed, using fallback:', error.message);
            }
        }
        
        const fb = NexCareDB.addRow('feedback', {
            id: NexCareDB.generateId("FB"),
            patientId,
            sender: patient?.fullName || 'Self',
            type: "Patient",
            category: data.category,
            summary: data.description,
            subject: data.category + " Feedback",
            rating: data.rating,
            status: data.status || "Open",
            createdAt: new Date().toISOString()
        });
        NexCareDB.logActivity('Create', 'Feedback', `New feedback submitted (${fb.id}) in category "${fb.category}".`);
        return fb;
    },
    
    async updateFeedback(id, patch) {
        if (isAPIAvailable()) {
            try {
                const result = await window.NexCareAPI.Feedback.update(id, patch);
                if (result.success) {
                    const status = patch?.status ? ` Status: ${patch.status}.` : '';
                    await NexCareDB.logActivity('Update', 'Feedback', `Updated feedback (${id}).${status}`);
                    return result.data;
                }
            } catch (error) {
                console.warn('Update feedback API failed, using fallback:', error.message);
            }
        }
        
        NexCareDB.updateRow('feedback', id, patch);
        const status = patch?.status ? ` Status: ${patch.status}.` : '';
        NexCareDB.logActivity('Update', 'Feedback', `Updated feedback (${id}).${status}`);
    },
    
    async deleteFeedback(id) {
        if (isAPIAvailable()) {
            try {
                const result = await window.NexCareAPI.Feedback.delete(id);
                if (result.success) {
                    await NexCareDB.logActivity('Delete', 'Feedback', `Deleted feedback record (${id}).`);
                    return;
                }
            } catch (error) {
                console.warn('Delete feedback API failed, using fallback:', error.message);
            }
        }
        
        NexCareDB.deleteRow('feedback', id);
        NexCareDB.logActivity('Delete', 'Feedback', `Deleted feedback record (${id}).`);
    },
    
    // System Activity
    async listActivity() {
        if (isAPIAvailable()) {
            try {
                const result = await window.NexCareAPI.System.getActivity();
                if (result.success) return result.data;
            } catch (error) {
                console.warn('List activity API failed, using fallback:', error.message);
            }
        }
        return NexCareDB.getTable('systemActivity');
    },
    
    async logActivity(action, module, details) {
        return await NexCareDB.logActivity(action, module, details);
    },

    // Password Security
    getPassword: () => {
        const email = sessionStorage.getItem("nexcare_user_email");
        return NexCareDB.getActiveUser(email).then(user => user ? user.password : null);
    },
    
    async updatePassword(newPw) {
        const email = sessionStorage.getItem("nexcare_user_email");
        const user = await NexCareDB.getActiveUser(email);
        if (user) {
            if (isAPIAvailable()) {
                try {
                    const result = await window.NexCareAPI.Users.update(user.id, { password: newPw });
                    if (result.success) {
                        await NexCareDB.logActivity('Update', 'Security', `User successfully updated their password.`);
                        return true;
                    }
                } catch (error) {
                    console.warn('Update password API failed, using fallback:', error.message);
                }
            }
            
            NexCareDB.updateRow('users', user.id, { password: newPw });
            NexCareDB.logActivity('Update', 'Security', `User successfully updated their password.`);
            return true;
        }
        return false;
    }
};
