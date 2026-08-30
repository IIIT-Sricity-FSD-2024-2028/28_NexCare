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
        const hostname = window.location.hostname;
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
            const response = await this.sendWrite('POST', endpoint, data);
            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error, 'POST', endpoint);
        }
    }

    async put(endpoint, data = {}) {
        try {
            const response = await this.sendWrite('PUT', endpoint, data);
            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error, 'PUT', endpoint);
        }
    }

    async patch(endpoint, data = {}) {
        try {
            const response = await this.sendWrite('PATCH', endpoint, data);
            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error, 'PATCH', endpoint);
        }
    }

    async delete(endpoint) {
        try {
            const response = await this.sendWrite('DELETE', endpoint);
            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error, 'DELETE', endpoint);
        }
    }

    /**
     * One write, retried once if the server rejects it for a missing or stale
     * CSRF token. The retry matters for a page whose first action is a write:
     * nothing has issued a GET yet, so no token has been handed out.
     */
    async sendWrite(method, endpoint, data) {
        const build = () => {
            const options = { method, headers: this.getHeaders() };
            if (data !== undefined) options.body = JSON.stringify(data);
            return options;
        };

        let response = await fetch(`${this.baseURL}${endpoint}`, build());
        if (response.status !== 403) return response;

        // Peek without consuming the body the caller still needs.
        const copy = response.clone();
        let message = '';
        try {
            message = String((await copy.json()).message || '');
        } catch (e) {
            return response;
        }
        if (!/csrf/i.test(message)) return response;

        this.captureCsrfToken(response);
        await this.primeCsrfToken();
        response = await fetch(`${this.baseURL}${endpoint}`, build());
        return response;
    }

    // Helper Methods
    getHeaders() {
        const headers = { ...this.defaultHeaders };

        // Add auth token if available
        const token = this.getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        // CsrfMiddleware challenges state-changing requests that carry no Bearer
        // credential — in practice the public hospital registration. Replaying
        // the token the server last handed us costs nothing on the requests it
        // does not challenge, so it is sent unconditionally.
        const csrf = this.getCsrfToken() || sessionStorage.getItem('nexcare_csrf_token') || localStorage.getItem('nexcare_csrf_token');
        if (csrf) {
            headers['x-csrf-token'] = csrf;
        }

        return headers;
    }

    // ── CSRF ────────────────────────────────────────────────────────────────
    // The backend returns a token in the `x-csrf-token` response header on every
    // request. Cache it in sessionStorage so it survives navigation between the
    // static pages, which each reload this script from scratch.

    getCsrfToken() {
        try {
            return sessionStorage.getItem('nexcare_csrf_token');
        } catch (e) {
            return this._csrfToken || null;
        }
    }

    captureCsrfToken(response) {
        try {
            const token = response.headers && response.headers.get('x-csrf-token');
            if (!token) return;
            this._csrfToken = token;
            sessionStorage.setItem('nexcare_csrf_token', token);
        } catch (e) {
            // Private-mode storage failures must never break the request itself.
        }
    }

    /**
     * Fetch a CSRF token by making a safe request, for the case where the very
     * first thing a page does is a write — the public hospital registration
     * form submits before anything has issued a GET.
     */
    async primeCsrfToken() {
        try {
            const response = await fetch(`${this.baseURL}/hospitals`, {
                method: 'GET',
                headers: this.defaultHeaders,
            });
            this.captureCsrfToken(response);
        } catch (e) {
            // Offline; the caller's own error handling takes over.
        }
        return this.getCsrfToken();
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
        this.captureCsrfToken(response);
        try {
            // Capture CSRF token header if sent
            const newCsrf = response.headers?.get('x-csrf-token');
            if (newCsrf) {
                sessionStorage.setItem('nexcare_csrf_token', newCsrf);
                localStorage.setItem('nexcare_csrf_token', newCsrf);
            }

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
    },

    /** The backend binds this to the authenticated user — no id is sent. */
    async changePassword(currentPassword, newPassword) {
        return await api.patch('/auth/change-password', { currentPassword, newPassword });
    },

    /** Self-registration for administrative staff, ambulance crew and doctors. */
    async registerStaff(data) {
        return await api.post('/auth/register-staff', data);
    }
};

// Users API
const UsersAPI = {
    async getAll(query = {}) {
        let qStr = '';
        if (typeof query === 'string') {
            qStr = query.startsWith('?') ? query : `?${query}`;
        } else if (query && typeof query === 'object') {
            const params = new URLSearchParams();
            if (query.role) params.append('role', query.role);
            if (query.status) params.append('status', query.status);
            if (query.hospitalId) params.append('hospitalId', query.hospitalId);
            const s = params.toString();
            if (s) qStr = `?${s}`;
        }
        return await api.get(`/users${qStr}`);
    },

    async getById(id) {
        return await api.get(`/users/${id}`);
    },

    async create(userData) {
        return await api.post('/users', userData);
    },

    async previewEmail(name) {
        return await api.get(`/users/preview-email?name=${encodeURIComponent(name || '')}`);
    },

    async getDoctors(dept, hospitalId) {
        const params = new URLSearchParams();
        if (dept) params.append('dept', dept);
        if (hospitalId) params.append('hospitalId', hospitalId);
        const s = params.toString();
        return await api.get(`/users/doctors${s ? '?' + s : ''}`);
    },

    async update(id, userData) {
        return await api.put(`/users/${id}`, userData);
    },

    async delete(id) {
        return await api.delete(`/users/${id}`);
    },

    async updateStatus(id, status) {
        return await api.patch(`/users/${id}/status`, { status });
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

    async confirm(id) {
        return await api.patch(`/appointments/${id}/confirm`);
    },

    async complete(id) {
        return await api.patch(`/appointments/${id}/complete`);
    },

    async cancel(id) {
        return await api.patch(`/appointments/${id}/cancel`);
    },

    async delete(id) {
        return await api.delete(`/appointments/${id}`);
    },

    /**
     * A doctor's own schedule. Pass 'me' as the id — the backend refuses any
     * other id for a doctor account, so 'me' is the only form the doctor portal
     * should ever send.
     */
    async getByDoctor(doctorId = 'me', query = {}) {
        const params = new URLSearchParams();
        if (query.status) params.append('status', query.status);
        if (query.date) params.append('date', query.date);
        const s = params.toString();
        return await api.get(`/appointments/doctor/${encodeURIComponent(doctorId)}${s ? `?${s}` : ''}`);
    },

    async getDoctorStats(doctorId = 'me') {
        return await api.get(`/appointments/doctor/${encodeURIComponent(doctorId)}/stats`);
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
    },

    // Inventory Requirement Requests (Staff -> Hospital Manager Approval)
    async getRequirements(query = {}) {
        let qStr = '';
        if (typeof query === 'string') {
            qStr = query.startsWith('?') ? query : `?${query}`;
        } else if (query && typeof query === 'object') {
            const params = new URLSearchParams();
            if (query.hospitalId) params.append('hospitalId', query.hospitalId);
            if (query.status) params.append('status', query.status);
            if (query.priority) params.append('priority', query.priority);
            if (query.department) params.append('department', query.department);
            const s = params.toString();
            if (s) qStr = `?${s}`;
        }
        return await api.get(`/inventory/requirements${qStr}`);
    },

    async getRequirementById(id) {
        return await api.get(`/inventory/requirements/${id}`);
    },

    async createRequirement(data) {
        return await api.post('/inventory/requirements', data);
    },

    async approveRequirement(id, managerRemarks = '') {
        return await api.patch(`/inventory/requirements/${id}/approve`, { managerRemarks });
    },

    async rejectRequirement(id, rejectionReason) {
        return await api.patch(`/inventory/requirements/${id}/reject`, { rejectionReason });
    },

    async startPurchase(id, purchaseData = {}) {
        return await api.patch(`/inventory/requirements/${id}/start-purchase`, purchaseData);
    },

    async markPurchased(id) {
        return await api.patch(`/inventory/requirements/${id}/mark-purchased`, {});
    },

    async markRestocked(id) {
        return await api.patch(`/inventory/requirements/${id}/mark-restocked`, {});
    },

    async fulfillRequirement(id) {
        return await api.patch(`/inventory/requirements/${id}/fulfill`, {});
    }
};

// Ambulance API
const AmbulanceAPI = {
    async getAll(query = {}) {
        let qStr = '';
        if (typeof query === 'string') {
            qStr = query.startsWith('?') ? query : `?${query}`;
        } else if (query && typeof query === 'object') {
            const params = new URLSearchParams();
            if (query.status) params.append('status', query.status);
            if (query.patientId) params.append('patientId', query.patientId);
            const s = params.toString();
            if (s) qStr = `?${s}`;
        }
        return await api.get(`/ambulance${qStr}`);
    },

    async getAllRequests(patientId = null) {
        return await api.get(`/ambulance`, patientId ? { patientId } : {});
    },

    async getById(id) {
        return await api.get(`/ambulance/${id}`);
    },

    async create(requestData) {
        return await api.post('/ambulance', requestData);
    },

    async createRequest(requestData) {
        return await api.post('/ambulance', requestData);
    },

    async update(id, updateData) {
        return await api.put(`/ambulance/${id}`, updateData);
    },

    async updateRequest(id, updateData) {
        return await api.put(`/ambulance/${id}`, updateData);
    },

    async updateStatus(id, status) {
        return await api.patch(`/ambulance/${id}/status`, { status });
    },

    async dispatch(id, assignedTo, vehicleNumber) {
        return await api.patch(`/ambulance/${id}/dispatch`, { assignedTo, vehicleNumber });
    },

    async complete(id) {
        return await api.patch(`/ambulance/${id}/complete`, {});
    },

    async delete(id) {
        return await api.delete(`/ambulance/${id}`);
    },

    async getStats() {
        return await api.get('/ambulance/stats/overview');
    },

    async getActive() {
        return await api.get('/ambulance/active');
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

    // Subscription & Renewal
    async getSubscription(id) {
        return await api.get(`/hospitals/${id}/subscription`);
    },

    async renewSubscription(id, paymentData = {}) {
        return await api.post(`/hospitals/${id}/renew-subscription`, paymentData);
    },

    async getPaymentHistory(id) {
        return await api.get(`/hospitals/${id}/payment-history`);
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

    async approve(id) {
        return await api.patch(`/leaves/${id}`, { status: 'approved' });
    },

    async reject(id, rejectionReason) {
        return await api.patch(`/leaves/${id}`, { status: 'rejected', rejectionReason });
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

const SchedulesAPI = {
    async getAll(query = {}) {
        const params = new URLSearchParams();
        if (query.hospitalId) params.append('hospitalId', query.hospitalId);
        if (query.status) params.append('status', query.status);
        const s = params.toString();
        return await api.get(`/schedules${s ? `?${s}` : ''}`);
    },
    async create(data) {
        return await api.post('/schedules', data);
    },
    async update(id, data) {
        return await api.patch(`/schedules/${id}`, data);
    }
};

// Revenue API
// Four audiences, deliberately separate:
//   /platform/*                NexCare's own commercials — superuser only
//   /hospital/:id              a hospital's own collections
//   /doctor/me, /doctor/:id    a practitioner's earnings and platform charges
//   /patient/me/membership     a patient's Care+ plan and what it saved them
const RevenueAPI = {
    async getPlans() {
        return await api.get('/revenue/plans');
    },

    async updatePlan(planId, changes) {
        return await api.patch(`/revenue/plans/${encodeURIComponent(planId)}`, changes);
    },

    async getSubscriptions() {
        return await api.get('/revenue/subscriptions');
    },

    async updateSubscription(hospitalId, changes) {
        return await api.patch(`/revenue/subscriptions/${encodeURIComponent(hospitalId)}`, changes);
    },

    async getPlatformOverview(query = {}) {
        const params = new URLSearchParams();
        if (query.from) params.append('from', query.from);
        if (query.to) params.append('to', query.to);
        const s = params.toString();
        return await api.get(`/revenue/platform/overview${s ? `?${s}` : ''}`);
    },

    async getPlatformTrend(months) {
        return await api.get(`/revenue/platform/trend${months ? `?months=${months}` : ''}`);
    },

    async getHospitalRevenue(hospitalId, query = {}) {
        const params = new URLSearchParams();
        if (query.from) params.append('from', query.from);
        if (query.to) params.append('to', query.to);
        const s = params.toString();
        return await api.get(`/revenue/hospital/${encodeURIComponent(hospitalId)}${s ? `?${s}` : ''}`);
    },

    async compareMyHospitals(query = {}) {
        const params = new URLSearchParams();
        if (query.from) params.append('from', query.from);
        if (query.to) params.append('to', query.to);
        const s = params.toString();
        return await api.get(`/revenue/my-hospitals/compare${s ? `?${s}` : ''}`);
    },

    // ── Multi-stream roll-up (superuser) ────────────────────────────────────

    async getPlatformStreams(query = {}) {
        const params = new URLSearchParams();
        if (query.from) params.append('from', query.from);
        if (query.to) params.append('to', query.to);
        const s = params.toString();
        return await api.get(`/revenue/platform/streams${s ? `?${s}` : ''}`);
    },

    async getFees() {
        return await api.get('/revenue/fees');
    },

    async updateFees(changes) {
        return await api.patch('/revenue/fees', changes);
    },

    // ── Doctor listing tiers ────────────────────────────────────────────────

    async getDoctorPlans() {
        return await api.get('/revenue/doctor-plans');
    },

    async updateDoctorPlan(planId, changes) {
        return await api.patch(`/revenue/doctor-plans/${encodeURIComponent(planId)}`, changes);
    },

    async getDoctorSubscriptions(doctorId) {
        const s = doctorId ? `?doctorId=${encodeURIComponent(doctorId)}` : '';
        return await api.get(`/revenue/doctor-subscriptions${s}`);
    },

    async updateDoctorSubscription(doctorId, changes) {
        return await api.patch(`/revenue/doctor-subscriptions/${encodeURIComponent(doctorId)}`, changes);
    },

    /** The signed-in doctor's own statement. */
    async getMyDoctorEarnings(query = {}) {
        const params = new URLSearchParams();
        if (query.from) params.append('from', query.from);
        if (query.to) params.append('to', query.to);
        const s = params.toString();
        return await api.get(`/revenue/doctor/me${s ? `?${s}` : ''}`);
    },

    async getMyDoctorSubscription() {
        return await api.get('/revenue/doctor/me/subscription');
    },

    /** A doctor changing their own tier or consultation fee. */
    async updateMyDoctorSubscription(changes) {
        return await api.patch('/revenue/doctor/me/subscription', changes);
    },

    async getDoctorEarnings(doctorId, query = {}) {
        const params = new URLSearchParams();
        if (query.from) params.append('from', query.from);
        if (query.to) params.append('to', query.to);
        const s = params.toString();
        return await api.get(`/revenue/doctor/${encodeURIComponent(doctorId)}${s ? `?${s}` : ''}`);
    },

    // ── Patient memberships ─────────────────────────────────────────────────

    async getPatientPlans() {
        return await api.get('/revenue/patient-plans');
    },

    async updatePatientPlan(planId, changes) {
        return await api.patch(`/revenue/patient-plans/${encodeURIComponent(planId)}`, changes);
    },

    async getPatientSubscriptions() {
        return await api.get('/revenue/patient-subscriptions');
    },

    async getMyMembership() {
        return await api.get('/revenue/patient/me/membership');
    },

    /** Join, switch or cancel — CARE-PAYG is how a patient cancels. */
    async setMyMembership(planId) {
        return await api.patch('/revenue/patient/me/membership', { planId });
    }
};

// Hierarchy API
// There is no way to ask for someone else's subtree — you get yours, derived
// from the token. `getScope()` answers "what may I see", `getTree()` answers
// "show it to me".
const HierarchyAPI = {
    async getTree() {
        return await api.get('/hierarchy');
    },

    async getScope() {
        return await api.get('/hierarchy/scope');

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
    Schedules: SchedulesAPI,
    SupportRequests: SupportRequestsAPI,
    Revenue: RevenueAPI,
    Hierarchy: HierarchyAPI,
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

