// NEXCARE FRONTEND API LAYER
// Centralized backend communication service
// Base URL: http://localhost:3001/api

class NexCareAPI {
    constructor() {
        // ── Dynamic backend URL resolution ─────────────────────────────────
        // The backend always runs on port 3001.
        // The frontend could be served on ANY port (8080, 3000, 80, etc.) or
        // any host (localhost, 172.18.x.x, LAN IP, WSL IP…).
        //
        // Strategy: mirror the frontend's hostname, but always port 3001.
        // This works for every evaluation scenario without hardcoding anything.
        //
        // Edge cases handled:
        //   - file:// protocol (opened directly as a file) → fallback localhost
        //   - empty hostname                               → fallback localhost
        //   - any HTTP/HTTPS host                         → use that host:3001
        const protocol = window.location.protocol;
        const hostname  = window.location.hostname;
        const backendHost = (protocol === 'http:' || protocol === 'https:') && hostname
            ? hostname
            : 'localhost';
        this.baseURL = `http://${backendHost}:3001/api`;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    // Core HTTP Methods
    async get(endpoint) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error, 'GET', endpoint);
        }
    }

    async post(endpoint, data = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error, 'POST', endpoint);
        }
    }

    async put(endpoint, data = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error, 'PUT', endpoint);
        }
    }

    async patch(endpoint, data = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error, 'PATCH', endpoint);
        }
    }

    async delete(endpoint) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error, 'DELETE', endpoint);
        }
    }

    // Helper Methods
    getHeaders() {
        const headers = { ...this.defaultHeaders };
        
        // Add auth token if available
        const token = this.getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    getAuthToken() {
        // Try to get token from sessionStorage or localStorage
        return sessionStorage.getItem('nexcare_auth_token') || 
               localStorage.getItem('nexcare_auth_token');
    }

    setAuthToken(token) {
        // Store token in both storages for persistence
        sessionStorage.setItem('nexcare_auth_token', token);
        localStorage.setItem('nexcare_auth_token', token);
    }

    clearAuthToken() {
        sessionStorage.removeItem('nexcare_auth_token');
        localStorage.removeItem('nexcare_auth_token');
    }

    async handleResponse(response) {
        try {
            const data = await response.json();
            
            // If the backend JSON explicitly sets success: false, respect it!
            // Even if the HTTP status is 2xx (like 201 Created default for NestJS Post)
            if (data && typeof data.success === 'boolean' && !data.success) {
                return {
                    success: false,
                    data: data.data || null,
                    message: data.message || 'API Error'
                };
            }

            if (response.ok) {
                return {
                    success: true,
                    data: data.data !== undefined ? data.data : data,
                    message: data.message || 'Success'
                };
            } else {
                return {
                    success: false,
                    data: null,
                    message: data.message || `HTTP Error: ${response.status}`
                };
            }
        } catch (error) {
            return {
                success: false,
                data: null,
                message: `Response parsing error: ${error.message}`
            };
        }
    }

    handleError(error, method, endpoint) {
        console.error(`API Error (${method} ${endpoint}):`, error);
        
        // Show toast notification for better user feedback
        if (window.NexCareUI && window.NexCareUI.showToast) {
            let errorMessage = 'An unexpected error occurred';
            let errorType = 'error';
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Network error: Unable to connect to server. Please check your connection.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            window.NexCareUI.showToast({ message: errorMessage, type: errorType });
        }
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return {
                success: false,
                data: null,
                message: 'Network error: Unable to connect to server. Please check your connection.'
            };
        }
        
        return {
            success: false,
            data: null,
            message: error.message || 'An unexpected error occurred'
        };
    }
}

// Create global API instance
const api = new NexCareAPI();

// API MODULES

// Auth API
const AuthAPI = {
    async login(credentials) {
        const response = await api.post('/auth/login', credentials);
        if (response.success && response.data?.token) {
            api.setAuthToken(response.data.token);
        }
        return response;
    },

    async register(userData) {
        return await api.post('/auth/register', userData);
    },

    async logout(userId) {
        const response = await api.post(`/auth/logout/${userId}`);
        if (response.success) {
            api.clearAuthToken();
        }
        return response;
    },

    async getCurrentUser(userId) {
        return await api.get(`/auth/current/${userId}`);
    }
};

// Users API
const UsersAPI = {
    async getAll() {
        return await api.get('/users');
    },

    async getById(id) {
        return await api.get(`/users/${id}`);
    },

    async create(userData) {
        return await api.post('/users', userData);
    },

    async update(id, userData) {
        return await api.put(`/users/${id}`, userData);
    },

    async delete(id) {
        return await api.delete(`/users/${id}`);
    }
};

// Patients API
const PatientsAPI = {
    async getAll() {
        return await api.get('/patients');
    },

    async getById(id) {
        return await api.get(`/patients/${id}`);
    },

    async create(patientData) {
        return await api.post('/patients', patientData);
    },

    async update(id, patientData) {
        return await api.put(`/patients/${id}`, patientData);
    },

    async delete(id) {
        return await api.delete(`/patients/${id}`);
    }
};

// Appointments API
const AppointmentsAPI = {
    async getAll(patientId) {
        const query = patientId ? `?patientId=${encodeURIComponent(patientId)}` : '';
        return await api.get(`/appointments${query}`);
    },

    async getById(id) {
        return await api.get(`/appointments/${id}`);
    },

    async create(appointmentData) {
        return await api.post('/appointments', appointmentData);
    },

    async update(id, appointmentData) {
        return await api.put(`/appointments/${id}`, appointmentData);
    },

    async updateStatus(id, status) {
        return await api.patch(`/appointments/${id}/status`, { status });
    },

    async cancel(id) {
        return await api.patch(`/appointments/${id}/cancel`);
    },

    async delete(id) {
        return await api.delete(`/appointments/${id}`);
    }
};

// Billing API
const BillingAPI = {
    async getAll(patientId) {
        const query = patientId ? `?patientId=${encodeURIComponent(patientId)}` : '';
        return await api.get(`/billing${query}`);
    },

    async getById(id) {
        return await api.get(`/billing/${id}`);
    },

    async create(billData) {
        return await api.post('/billing', billData);
    },

    async update(id, billData) {
        return await api.put(`/billing/${id}`, billData);
    },

    async updateStatus(id, status) {
        return await api.patch(`/billing/${id}/status`, { status });
    },

    async markPaid(id, paymentData) {
        return await api.patch(`/billing/${id}/pay`, paymentData);
    }
};

// Ambulance API
const AmbulanceAPI = {
    async getAllRequests() {
        return await api.get('/ambulance');
    },

    async getRequestById(id) {
        return await api.get(`/ambulance/${id}`);
    },

    async createRequest(requestData) {
        return await api.post('/ambulance', requestData);
    },

    async updateRequest(id, requestData) {
        return await api.put(`/ambulance/${id}`, requestData);
    },

    async updateStatus(id, status) {
        return await api.patch(`/ambulance/${id}/status`, { status });
    },

    async cancelRequest(id) {
        return await api.delete(`/ambulance/${id}`);
    }
};

// Feedback API
const FeedbackAPI = {
    async getAll() {
        return await api.get('/feedback');
    },

    async getById(id) {
        return await api.get(`/feedback/${id}`);
    },

    async create(feedbackData) {
        return await api.post('/feedback', feedbackData);
    },

    async update(id, feedbackData) {
        return await api.put(`/feedback/${id}`, feedbackData);
    },

    async updateStatus(id, status) {
        return await api.patch(`/feedback/${id}/status`, { status });
    },

    async delete(id) {
        return await api.delete(`/feedback/${id}`);
    },

    async getRegional(params = {}) {
        const qs = new URLSearchParams();
        if (params.status) qs.append('status', params.status);
        if (params.category) qs.append('category', params.category);
        if (params.hospitalId) qs.append('hospitalId', params.hospitalId);
        const s = qs.toString();
        return await api.get(`/feedback/regional${s ? `?${s}` : ''}`);
    }
};

// Beds API
const BedsAPI = {
    async getAll() {
        return await api.get('/beds');
    },

    async getById(id) {
        return await api.get(`/beds/${id}`);
    },

    async getAvailable() {
        return await api.get('/beds/available');
    },

    async allocate(id, allocationData) {
        // Use the dedicated allocate endpoint (PATCH /beds/:id/allocate).
        // Accept either a bare patientId string or a full payload object.
        const body = typeof allocationData === 'string'
            ? { patientId: allocationData }
            : allocationData;
        return await api.patch(`/beds/${id}/allocate`, body);
    },

    async release(id) {
        return await api.patch(`/beds/${id}/release`);
    }
};

// Inventory API
const InventoryAPI = {
    async getAll() {
        return await api.get('/inventory');
    },

    async getById(id) {
        return await api.get(`/inventory/${id}`);
    },

    async create(itemData) {
        return await api.post('/inventory', itemData);
    },

    async update(id, itemData) {
        return await api.put(`/inventory/${id}`, itemData);
    },

    async delete(id) {
        return await api.delete(`/inventory/${id}`);
    },

    async updateStock(id, quantity) {
        return await api.patch(`/inventory/${id}/stock`, { quantity });
    },

    async restock(id, restockData) {
        return await api.patch(`/inventory/${id}/restock`, restockData);
    },

    async use(id, quantity) {
        return await api.patch(`/inventory/${id}/use`, { quantity });
    },

    async getAudit(id) {
        return await api.get(`/inventory/audit/${id}`);
    }
};

// Hospitals API
const HospitalsAPI = {
    async getAll(query = {}) {
        let qStr = '';
        if (typeof query === 'string') {
            qStr = query.startsWith('?') ? query : `?${query}`;
        } else if (query && typeof query === 'object') {
            const params = new URLSearchParams();
            if (query.status) params.append('status', query.status);
            if (query.speciality) params.append('speciality', query.speciality);
            if (query.city) params.append('city', query.city);
            if (query.pincode) params.append('pincode', query.pincode);
            const s = params.toString();
            if (s) qStr = `?${s}`;
        }
        return await api.get(`/hospitals${qStr}`);
    },

    async getNearby(city, state, pincode) {
        const params = new URLSearchParams();
        if (city) params.append('city', city);
        if (state) params.append('state', state);
        if (pincode) params.append('pincode', pincode);
        const s = params.toString();
        return await api.get(`/hospitals/nearby${s ? `?${s}` : ''}`);
    },

    async getById(id) {
        return await api.get(`/hospitals/${id}`);
    },

    async getReviewQueue() {
        return await api.get('/hospitals/review-queue');
    },

    async update(id, data) {
        return await api.put(`/hospitals/${id}`, data);
    },

    // Public registration. Validation and duplicate checks are enforced server-side.
    async register(data) {
        return await api.post('/hospitals/register', data);
    },

    // Final activation is reserved for the superuser after regional clearance.
    async verify(id) {
        return await api.patch(`/hospitals/${id}/verify`, {});
    },

    async reject(id, notes) {
        return await api.patch(`/hospitals/${id}/reject`, notes ? { notes } : {});
    },

    async assignManager(id, managerId) {
        return await api.patch(`/hospitals/${id}/assign-manager`, { managerId });
    },

    async regionalReview(id, decision, notes) {
        return await api.patch(`/hospitals/${id}/regional-review`, { decision, notes });
    },

    async getRegionalOverview() {
        return await api.get('/hospitals/regional/overview');
    },

    async getPerformanceAlerts() {
        return await api.get('/hospitals/regional/performance-alerts');
    },

    async getComparison(hospitalIds) {
        const ids = Array.isArray(hospitalIds) ? hospitalIds.join(',') : hospitalIds;
        const q = ids ? `?ids=${encodeURIComponent(ids)}` : '';
        return await api.get(`/hospitals/regional/comparison${q}`);
    },

    async getMyHospitals() {
        return await api.get('/hospitals/regional/my-hospitals');
    }
};

// Compatibility for older registration pages that used the generic request helper.
window.NexCareAPIRequest = (endpoint, method, data) => api[method.toLowerCase()](endpoint, data);

// Support Requests API
// The backend scopes GET by the caller's role: a regional_manager sees requests
// across the hospitals assigned to them, hospital staff see only their own.
const SupportRequestsAPI = {
    async getAll(hospitalId) {
        const s = hospitalId ? `?hospitalId=${encodeURIComponent(hospitalId)}` : '';
        return await api.get(`/support-requests${s}`);
    },

    async create(data) {
        return await api.post('/support-requests', data);
    },

    async update(id, data) {
        return await api.put(`/support-requests/${id}`, data);
    }
};

// System API
const SystemAPI = {
    async getActivity() {
        return await api.get('/system/activity');
    },

    async getSettings() {
        return await api.get('/system/settings');
    },

    async updateSettings(settings) {
        return await api.put('/system/settings', settings);
    },

    async logActivity(activityData) {
        return await api.post('/system/activity', activityData);
    }
};

// Leaves API
const LeavesAPI = {
    async getAll(query = {}) {
        let qStr = '';
        if (typeof query === 'string') {
            qStr = query.startsWith('?') ? query : `?${query}`;
        } else if (query && typeof query === 'object') {
            const params = new URLSearchParams();
            if (query.doctorId) params.append('doctorId', query.doctorId);
            if (query.hospitalId) params.append('hospitalId', query.hospitalId);
            if (query.status) params.append('status', query.status);
            const s = params.toString();
            if (s) qStr = `?${s}`;
        }
        return await api.get(`/leaves${qStr}`);
    },

    async getById(id) {
        return await api.get(`/leaves/${id}`);
    },

    async create(leaveData) {
        return await api.post('/leaves', leaveData);
    },

    async update(id, updateData) {
        return await api.patch(`/leaves/${id}`, updateData);
    },

    async delete(id) {
        return await api.delete(`/leaves/${id}`);
    },

    async getCalendarView(query = {}) {
        const params = new URLSearchParams();
        if (query.hospitalId) params.append('hospitalId', query.hospitalId);
        if (query.startDate) params.append('startDate', query.startDate);
        if (query.endDate) params.append('endDate', query.endDate);
        const s = params.toString();
        return await api.get(`/leaves/calendar${s ? `?${s}` : ''}`);
    }
};

// Export all APIs as global window object for easy access
/**
 * Build an in-app link that survives however the frontend is being served.
 *
 * Static hosts like `npx serve` respond to `/page.html?x=1` with a
 * `301 -> /page` and DROP the query string, so any page linked with an explicit
 * `.html` silently loses its parameters. Match whatever form the current page is
 * already using: keep `.html` when the URL has it, omit it when the host is
 * serving clean URLs.
 *
 *   pageLink('hospital-details', { id: 'H001' })
 *     served as /regional-officer/dashboard       -> 'hospital-details?id=H001'
 *     served as /regional-officer/dashboard.html  -> 'hospital-details.html?id=H001'
 *
 * @param {string} page  Page name WITHOUT the .html extension (may include a path).
 * @param {Object} params Optional query parameters.
 */
function pageLink(page, params = {}) {
    const base = /\.html$/i.test(window.location.pathname) ? `${page}.html` : page;
    const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    return qs ? `${base}?${qs}` : base;
}

window.pageLink = pageLink;

window.NexCareAPI = {
    // Core methods
    get: api.get.bind(api),
    post: api.post.bind(api),
    put: api.put.bind(api),
    patch: api.patch.bind(api),
    delete: api.delete.bind(api),
    
    // Token management
    setAuthToken: api.setAuthToken.bind(api),
    clearAuthToken: api.clearAuthToken.bind(api),
    getAuthToken: api.getAuthToken.bind(api),
    
    // API Modules
    Auth: AuthAPI,
    Users: UsersAPI,
    Patients: PatientsAPI,
    Appointments: AppointmentsAPI,
    Billing: BillingAPI,
    Ambulance: AmbulanceAPI,
    Feedback: FeedbackAPI,
    Beds: BedsAPI,
    Inventory: InventoryAPI,
    Hospitals: HospitalsAPI,
    Leaves: LeavesAPI,
    SupportRequests: SupportRequestsAPI,
    System: SystemAPI
};


// Legacy compatibility aliases for gradual migration
window.NexCareAPI.login = AuthAPI.login;
window.NexCareAPI.register = AuthAPI.register;
window.NexCareAPI.logout = AuthAPI.logout;
window.NexCareAPI.getUsers = UsersAPI.getAll;
window.NexCareAPI.getPatients = PatientsAPI.getAll;
window.NexCareAPI.getAppointments = AppointmentsAPI.getAll;
window.NexCareAPI.createAppointment = AppointmentsAPI.create;
window.NexCareAPI.updateAppointment = AppointmentsAPI.update;
window.NexCareAPI.cancelAppointment = AppointmentsAPI.cancel;
window.NexCareAPI.deleteAppointment = AppointmentsAPI.delete;
window.NexCareAPI.getBills = BillingAPI.getAll;
window.NexCareAPI.createBill = BillingAPI.create;
window.NexCareAPI.updateBillStatus = BillingAPI.updateStatus;
window.NexCareAPI.getAmbulanceRequests = AmbulanceAPI.getAllRequests;
window.NexCareAPI.createAmbulanceRequest = AmbulanceAPI.createRequest;
window.NexCareAPI.updateAmbulanceRequest = AmbulanceAPI.updateRequest;
window.NexCareAPI.getFeedback = FeedbackAPI.getAll;
window.NexCareAPI.createFeedback = FeedbackAPI.create;
window.NexCareAPI.getBeds = BedsAPI.getAll;
window.NexCareAPI.getInventory = InventoryAPI.getAll;
window.NexCareAPI.getHospitals = HospitalsAPI.getAll;
window.NexCareAPI.getSystemActivity = SystemAPI.getActivity;

