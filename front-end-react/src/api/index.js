// The whole NexCare API surface, one object per backend area — a module port
// of front-end/shared/api.js (window.NexCareAPI.*). Method names follow the
// original so a page's calls can be moved across one-for-one; the few extra
// short names (Appointments.mine, Notifications.list, …) are what the doctor
// portal was written against and are kept as aliases.
//
// Every call resolves to { success: true, data, message } or throws ApiError.
import { http, q, setAuthToken, clearAuthToken, getAuthToken, BASE_URL, ApiError } from './client';

const enc = encodeURIComponent;

/** Accept the HTML layer's loose query forms: a string, or an object of params. */
const query = (value, allowed) => {
  if (typeof value === 'string') return value ? (value.startsWith('?') ? value : `?${value}`) : '';
  if (!value || typeof value !== 'object') return '';
  const picked = allowed ? Object.fromEntries(allowed.filter((k) => k in value).map((k) => [k, value[k]])) : value;
  return q(picked);
};

export const Auth = {
  /** `role` is what the login page was for; the backend rejects a mismatch. */
  async login(email, password, role) {
    const res = await http.post('/auth/login', { email, password, role });
    if (res.data?.token) setAuthToken(res.data.token);
    return res;
  },
  register: (userData) => http.post('/auth/register', userData),
  /** Self-registration for administrative staff, ambulance crew and doctors. */
  registerStaff: (data) => http.post('/auth/register-staff', data),
  async logout(userId) {
    try {
      if (userId) await http.post(`/auth/logout/${enc(userId)}`);
    } finally {
      clearAuthToken();
    }
  },
  getCurrentUser: (userId) => http.get(`/auth/current/${enc(userId)}`),
  /** The backend binds this to the authenticated user — no id is sent. */
  changePassword: (currentPassword, newPassword) =>
    http.patch('/auth/change-password', { currentPassword, newPassword }),
  forgotPasswordVerify: (email) => http.post('/auth/forgot-password/verify', { email }),
  forgotPasswordReset: (email, newPassword) => http.post('/auth/forgot-password/reset', { email, newPassword }),
};

export const Users = {
  /** Optional `{ role, status, hospitalId }` — the staff pages ask for `?role=patient`. */
  getAll: (filters = {}) => http.get(`/users${query(filters, ['role', 'status', 'hospitalId'])}`),
  getById: (id) => http.get(`/users/${enc(id)}`),
  create: (userData) => http.post('/users', userData),
  update: (id, userData) => http.put(`/users/${enc(id)}`, userData),
  delete: (id) => http.delete(`/users/${enc(id)}`),
  updateStatus: (id, status) => http.patch(`/users/${enc(id)}/status`, { status }),
  previewEmail: (name) => http.get(`/users/preview-email${q({ name: name || '' })}`),
  /** Active doctors, optionally filtered by department. Patients may call this. */
  getDoctors: (dept) => http.get(`/users/doctors${q({ dept })}`),
  doctors: (dept) => Users.getDoctors(dept),
  // Regional manager assignment (superuser): who covers a city, how loaded each
  // officer is, and who should take the next hospital.
  getRegionalManagersByCity: (city) => http.get(`/users/regional-managers/city/${enc(city)}`),
  getRegionalManagerWorkload: (managerId) => http.get(`/users/regional-managers/${enc(managerId)}/workload`),
  /** Ranked suggestions for a hospital's city: coverage first, then lightest load. */
  suggestRegionalManagers: (city) => http.get(`/users/regional-managers/suggest/${enc(city)}`),
  getRegionalManagerWorkloads: () => http.get('/users/regional-managers/workloads'),
};

export const Patients = {
  getAll: () => http.get('/patients'),
  getById: (id) => http.get(`/patients/${enc(id)}`),
  byId: (id) => Patients.getById(id),
  create: (data) => http.post('/patients', data),
  update: (id, data) => http.put(`/patients/${enc(id)}`, data),
  delete: (id) => http.delete(`/patients/${enc(id)}`),
};

export const Appointments = {
  /** A patientId string, or `{ patientId, status, department, hospitalId }`. */
  getAll: (filters) => http.get(`/appointments${typeof filters === 'string' ? q({ patientId: filters }) : query(filters, ['patientId', 'status', 'department', 'hospitalId'])}`),
  getById: (id) => http.get(`/appointments/${enc(id)}`),
  create: (data) => http.post('/appointments', data),
  update: (id, data) => http.put(`/appointments/${enc(id)}`, data),
  updateStatus: (id, status) => http.patch(`/appointments/${enc(id)}/status`, { status }),
  confirm: (id) => http.patch(`/appointments/${enc(id)}/confirm`),
  complete: (id) => http.patch(`/appointments/${enc(id)}/complete`),
  cancel: (id) => http.patch(`/appointments/${enc(id)}/cancel`),
  delete: (id) => http.delete(`/appointments/${enc(id)}`),
  /**
   * A doctor's own schedule. Pass 'me' as the id — the backend refuses any
   * other id for a doctor account.
   */
  getByDoctor: (doctorId = 'me', filters = {}) =>
    http.get(`/appointments/doctor/${enc(doctorId)}${query(filters, ['status', 'date'])}`),
  getDoctorStats: (doctorId = 'me') => http.get(`/appointments/doctor/${enc(doctorId)}/stats`),
  mine: (filters) => Appointments.getByDoctor('me', filters),
  myStats: () => Appointments.getDoctorStats('me'),
};

export const Billing = {
  /** A patientId string, or `{ patientId, status, hospitalId }`. */
  getAll: (filters) => http.get(`/billing${typeof filters === 'string' ? q({ patientId: filters }) : query(filters, ['patientId', 'status', 'hospitalId'])}`),
  getById: (id) => http.get(`/billing/${enc(id)}`),
  create: (data) => http.post('/billing', data),
  update: (id, data) => http.put(`/billing/${enc(id)}`, data),
  updateStatus: (id, status) => http.patch(`/billing/${enc(id)}/status`, { status }),
  markPaid: (id, paymentData) => http.patch(`/billing/${enc(id)}/pay`, paymentData),
};

export const Ambulance = {
  getAll: (filters = {}) => http.get(`/ambulance${query(filters, ['status', 'patientId'])}`),
  getAllRequests: () => http.get('/ambulance'),
  getById: (id) => http.get(`/ambulance/${enc(id)}`),
  getRequestById: (id) => Ambulance.getById(id),
  /** One patient's requests — the patient portal's status table. */
  getByPatient: (patientId) => http.get(`/ambulance/patient/${enc(patientId)}`),
  create: (data) => http.post('/ambulance', data),
  createRequest: (data) => Ambulance.create(data),
  update: (id, data) => http.put(`/ambulance/${enc(id)}`, data),
  updateRequest: (id, data) => Ambulance.update(id, data),
  updateStatus: (id, status) => http.patch(`/ambulance/${enc(id)}/status`, { status }),
  dispatch: (id, assignedTo, vehicleNumber) =>
    http.patch(`/ambulance/${enc(id)}/dispatch`, { assignedTo, vehicleNumber }),
  complete: (id) => http.patch(`/ambulance/${enc(id)}/complete`, {}),
  /** Soft cancel — the row is kept with a CANCELLED status. */
  cancelRequest: (id, reason) => http.patch(`/ambulance/${enc(id)}/cancel`, reason ? { reason } : {}),
  /** Hard delete — staff only, and it refuses completed or cancelled rows. */
  delete: (id) => http.delete(`/ambulance/${enc(id)}`),
  deleteRequest: (id) => Ambulance.delete(id),
  getStats: () => http.get('/ambulance/stats/overview'),
  getActive: () => http.get('/ambulance/active'),
};

export const Feedback = {
  getAll: (filters = {}) => http.get(`/feedback${query(filters)}`),
  getById: (id) => http.get(`/feedback/${enc(id)}`),
  getByPatient: (patientId) => http.get(`/feedback/patient/${enc(patientId)}`),
  create: (data) => http.post('/feedback', data),
  update: (id, data) => http.put(`/feedback/${enc(id)}`, data),
  updateStatus: (id, status) => http.patch(`/feedback/${enc(id)}/status`, { status }),
  delete: (id) => http.delete(`/feedback/${enc(id)}`),
  getRegional: (filters = {}) => http.get(`/feedback/regional${query(filters, ['status', 'category', 'hospitalId'])}`),
};

export const Beds = {
  getAll: (filters = {}) => http.get(`/beds${query(filters, ['ward', 'status', 'hospitalId'])}`),
  getById: (id) => http.get(`/beds/${enc(id)}`),
  getAvailable: () => http.get('/beds/available'),
  create: (data) => http.post('/beds', data),
  /** Accepts either a bare patientId string or a full payload object. */
  allocate: (id, allocation) =>
    http.patch(`/beds/${enc(id)}/allocate`, typeof allocation === 'string' ? { patientId: allocation } : allocation),
  release: (id) => http.patch(`/beds/${enc(id)}/release`),
  update: (id, data) => http.put(`/beds/${enc(id)}`, data),
  /** Goes through BedStatusChangeMiddleware — an illegal transition is a 400 with the reason. */
  updateStatus: (id, status) => http.patch(`/beds/${enc(id)}/status`, { status }),
};

export const Inventory = {
  getAll: (filters = {}) => http.get(`/inventory${query(filters, ['category', 'status', 'location', 'hospitalId'])}`),
  getById: (id) => http.get(`/inventory/${enc(id)}`),
  create: (data) => http.post('/inventory', data),
  update: (id, data) => http.put(`/inventory/${enc(id)}`, data),
  delete: (id) => http.delete(`/inventory/${enc(id)}`),
  updateStock: (id, quantity) => http.patch(`/inventory/${enc(id)}/stock`, { quantity }),
  restock: (id, data) => http.patch(`/inventory/${enc(id)}/restock`, data),
  /** A bare quantity, or `{ quantity, notes }`. */
  use: (id, usage) => http.patch(`/inventory/${enc(id)}/use`, typeof usage === 'object' ? usage : { quantity: usage }),
  getAudit: (id) => http.get(`/inventory/audit/${enc(id)}`),
  // Requirement requests: staff raise them, the hospital manager approves.
  getRequirements: (filters = {}) =>
    http.get(`/inventory/requirements${query(filters, ['hospitalId', 'status', 'priority', 'department'])}`),
  getRequirementById: (id) => http.get(`/inventory/requirements/${enc(id)}`),
  createRequirement: (data) => http.post('/inventory/requirements', data),
  approveRequirement: (id, managerRemarks = '') =>
    http.patch(`/inventory/requirements/${enc(id)}/approve`, { managerRemarks }),
  rejectRequirement: (id, rejectionReason) =>
    http.patch(`/inventory/requirements/${enc(id)}/reject`, { rejectionReason }),
  startPurchase: (id, data = {}) => http.patch(`/inventory/requirements/${enc(id)}/start-purchase`, data),
  markPurchased: (id) => http.patch(`/inventory/requirements/${enc(id)}/mark-purchased`, {}),
  markRestocked: (id) => http.patch(`/inventory/requirements/${enc(id)}/mark-restocked`, {}),
  fulfillRequirement: (id) => http.patch(`/inventory/requirements/${enc(id)}/fulfill`, {}),
};

export const Hospitals = {
  getAll: (filters = {}) => http.get(`/hospitals${query(filters, ['status', 'speciality', 'city', 'pincode'])}`),
  getNearby: (city, state, pincode) => http.get(`/hospitals/nearby${q({ city, state, pincode })}`),
  getById: (id) => http.get(`/hospitals/${enc(id)}`),
  byId: (id) => Hospitals.getById(id),
  getReviewQueue: () => http.get('/hospitals/review-queue'),
  update: (id, data) => http.put(`/hospitals/${enc(id)}`, data),
  /** Public registration. Validation and duplicate checks are enforced server-side. */
  register: (data) => http.post('/hospitals/register', data),
  /** Final activation is reserved for the superuser after regional clearance. */
  verify: (id) => http.patch(`/hospitals/${enc(id)}/verify`, {}),
  reject: (id, notes) => http.patch(`/hospitals/${enc(id)}/reject`, notes ? { notes } : {}),
  /** The superuser's final rejection (superuser/hospital-registrations.js sent `reason`). */
  rejectFinal: (id, reason) => http.patch(`/hospitals/${enc(id)}/reject`, { reason }),
  /** Superuser final approval: activates the hospital and mints its manager login. */
  approve: (id) => http.post(`/hospitals/${enc(id)}/approve`, {}),
  assignManager: (id, managerId) => http.patch(`/hospitals/${enc(id)}/assign-manager`, { managerId }),
  regionalReview: (id, decision, notes) => http.patch(`/hospitals/${enc(id)}/regional-review`, { decision, notes }),
  getSubscription: (id) => http.get(`/hospitals/${enc(id)}/subscription`),
  renewSubscription: (id, paymentData = {}) => http.post(`/hospitals/${enc(id)}/renew-subscription`, paymentData),
  getPaymentHistory: (id) => http.get(`/hospitals/${enc(id)}/payment-history`),
  getRegionalOverview: () => http.get('/hospitals/regional/overview'),
  getPerformanceAlerts: () => http.get('/hospitals/regional/performance-alerts'),
  getComparison: (hospitalIds) =>
    http.get(`/hospitals/regional/comparison${q({ ids: Array.isArray(hospitalIds) ? hospitalIds.join(',') : hospitalIds })}`),
  getMyHospitals: () => http.get('/hospitals/regional/my-hospitals'),
};

// The backend scopes GET by the caller's role: a regional_manager sees requests
// across the hospitals assigned to them, hospital staff see only their own.
export const SupportRequests = {
  getAll: (hospitalId) => http.get(`/support-requests${q({ hospitalId })}`),
  create: (data) => http.post('/support-requests', data),
  update: (id, data) => http.put(`/support-requests/${enc(id)}`, data),
};

export const Leaves = {
  getAll: (filters = {}) => http.get(`/leaves${query(filters, ['doctorId', 'hospitalId', 'status'])}`),
  list: (filters) => Leaves.getAll(filters),
  getById: (id) => http.get(`/leaves/${enc(id)}`),
  create: (data) => http.post('/leaves', data),
  update: (id, data) => http.patch(`/leaves/${enc(id)}`, data),
  delete: (id) => http.delete(`/leaves/${enc(id)}`),
  remove: (id) => Leaves.delete(id),
  getCalendarView: (filters = {}) => http.get(`/leaves/calendar${query(filters, ['hospitalId', 'startDate', 'endDate'])}`),
  approve: (id) => http.patch(`/leaves/${enc(id)}`, { status: 'approved' }),
  reject: (id, rejectionReason) => http.patch(`/leaves/${enc(id)}`, { status: 'rejected', rejectionReason }),
};

// Four audiences, deliberately separate:
//   /platform/*             NexCare's own commercials — superuser only
//   /hospital/:id           a hospital's own collections and what it owes
//   /doctor/me, /doctor/:id a practitioner's consultation revenue
//   /patient/me/membership  a patient's Care+ plan and what it saved them
const range = (f) => query(f, ['from', 'to']);
export const Revenue = {
  getPlatformOverview: (filters = {}) => http.get(`/revenue/platform/overview${range(filters)}`),
  getPlatformTrend: (months) => http.get(`/revenue/platform/trend${q({ months })}`),
  getPlatformStreams: (filters = {}) => http.get(`/revenue/platform/streams${range(filters)}`),
  /** Revenue and operational data per regional officer, for the superuser. */
  getRegionalOfficerOverview: (filters = {}) => http.get(`/revenue/regional-officers${range(filters)}`),
  getHospitalRevenue: (hospitalId, filters = {}) => http.get(`/revenue/hospital/${enc(hospitalId)}${range(filters)}`),
  compareMyHospitals: (filters = {}) => http.get(`/revenue/my-hospitals/compare${range(filters)}`),
  getFees: () => http.get('/revenue/fees'),
  updateFees: (changes) => http.patch('/revenue/fees', changes),
  // Hospital subscription plans (priced by staff headcount)
  getHospitalPlans: () => http.get('/revenue/hospital-plans'),
  updateHospitalPlan: (planId, changes) => http.patch(`/revenue/hospital-plans/${enc(planId)}`, changes),
  getHospitalSubscriptions: (hospitalId) => http.get(`/revenue/hospital-subscriptions${q({ hospitalId })}`),
  updateHospitalSubscription: (hospitalId, changes) =>
    http.patch(`/revenue/hospital-subscriptions/${enc(hospitalId)}`, changes),
  // A doctor's own statement
  getMyDoctorEarnings: (filters = {}) => http.get(`/revenue/doctor/me${range(filters)}`),
  myEarnings: (filters) => Revenue.getMyDoctorEarnings(filters),
  /** The one price NexCare does not set — the doctor's own consultation fee. */
  updateMyConsultationFee: (consultationFee) =>
    http.patch('/revenue/doctor/me/consultation-fee', { consultationFee }),
  getDoctorEarnings: (doctorId, filters = {}) => http.get(`/revenue/doctor/${enc(doctorId)}${range(filters)}`),
  // Patient memberships
  getPatientPlans: () => http.get('/revenue/patient-plans'),
  updatePatientPlan: (planId, changes) => http.patch(`/revenue/patient-plans/${enc(planId)}`, changes),
  getPatientSubscriptions: () => http.get('/revenue/patient-subscriptions'),
  getMyMembership: () => http.get('/revenue/patient/me/membership'),
  /** Join, switch or cancel — CARE-PAYG is how a patient cancels. */
  setMyMembership: (planId, paymentDetails = {}) =>
    http.patch('/revenue/patient/me/membership', { planId, ...paymentDetails }),
};

// Drives the SIMULATED gateway. The amount always comes from the bill, never
// from here, and only the last four digits of a card are ever retained.
export const Payments = {
  /** The cards the simulation recognises, and what each one does. */
  getTestCards: () => http.get('/payments/test-cards'),
  createIntent: (billId) => http.post('/payments/intent', { billId }),
  /** `idempotencyKey` makes a replay return the original outcome instead of charging again. */
  confirm: (intentId, card, idempotencyKey) =>
    http.post(`/payments/${enc(intentId)}/confirm`, {
      cardNumber: card.cardNumber,
      expiryMonth: Number(card.expiryMonth),
      expiryYear: Number(card.expiryYear),
      cvv: card.cvv,
      idempotencyKey,
    }),
  getMine: () => http.get('/payments'),
  /** The platform earnings ledger — superuser only. */
  getLedger: (filters = {}) => http.get(`/payments/ledger${query(filters, ['stream', 'hospitalId'])}`),
};

export const Schedules = {
  getAll: (filters = {}) => http.get(`/schedules${query(filters, ['hospitalId', 'status'])}`),
  create: (data) => http.post('/schedules', data),
  update: (id, data) => http.patch(`/schedules/${enc(id)}`, data),
  delete: (id) => http.delete(`/schedules/${enc(id)}`),
};

// There is no way to ask for someone else's subtree — you get yours, derived
// from the token. getScope() answers "what may I see", getTree() "show it to me".
export const Hierarchy = {
  getTree: () => http.get('/hierarchy'),
  getScope: () => http.get('/hierarchy/scope'),
};

export const Notifications = {
  getAll: () => http.get('/notifications'),
  list: () => Notifications.getAll(),
  getUnreadCount: () => http.get('/notifications/unread-count'),
  unreadCount: () => Notifications.getUnreadCount(),
  markAsRead: (id) => http.patch(`/notifications/${enc(id)}/read`),
  markRead: (id) => Notifications.markAsRead(id),
  markAllAsRead: () => http.patch('/notifications/read-all'),
  markAllRead: () => Notifications.markAllAsRead(),
  create: (data) => http.post('/notifications', data),
};

// Patient documents (administrative_staff/patient-directory.js). The field
// name must be `file` — FileInterceptor('file') on the backend. Download needs
// the Authorization header, so it fetches the bytes and returns a Blob rather
// than handing the browser a URL.
export const Uploads = {
  getAll: (entityType, entityId) => http.get(`/uploads${q({ entityType, entityId })}`),
  upload: ({ file, entityType, entityId, description }) =>
    http.upload('/uploads', { file, entityType, entityId, description }),
  delete: (id) => http.delete(`/uploads/${enc(id)}`),
  async download(id) {
    const res = await fetch(`${BASE_URL}/uploads/${enc(id)}/download`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    if (!res.ok) throw new ApiError(`Download failed (${res.status})`, res.status);
    return res.blob();
  },
};

export const System = {
  getActivity: () => http.get('/system/activity'),
  /** Newest first; the superuser dashboard reads 10, the reports page 1,000. */
  getRecentActivity: (limit) => http.get(`/system/activity/recent${q({ limit })}`),
  getStats: () => http.get('/system/stats'),
  getHealth: () => http.get('/system/health'),
  getPerformance: () => http.get('/system/performance'),
  getSettings: () => http.get('/system/settings'),
  updateSettings: (settings) => http.put('/system/settings', settings),
  logActivity: (data) => http.post('/system/activity', data),
};

export { http, ApiError, BASE_URL, getAuthToken, setAuthToken, clearAuthToken } from './client';
