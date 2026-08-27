// Patient portal data store – thin proxy to global NexCareStore (API-first with fallback)
// Forwards calls to globally available window.NexCareStore defined in front-end/shared/db.js.

function getStore() {
  if (typeof window !== "undefined" && window.NexCareStore) {
    return window.NexCareStore;
  }
  return null;
}

export default {
  // Raw access
  read: () => getStore()?.read?.(),

  // Patient profile
  getActivePatient: () => getStore()?.getActivePatient?.(),
  updateActivePatient: (patch) => getStore()?.updateActivePatient?.(patch),

  // Appointments
  listAppointments: () => getStore()?.listAppointments?.(),
  createAppointment: (data) => getStore()?.createAppointment?.(data),
  updateAppointment: (id, patch) => getStore()?.updateAppointment?.(id, patch),
  deleteAppointment: (id) => getStore()?.deleteAppointment?.(id),

  // Ambulance requests
  listAmbulanceRequests: () => getStore()?.listAmbulanceRequests?.(),
  createAmbulanceRequest: (data) => getStore()?.createAmbulanceRequest?.(data),
  updateAmbulanceRequest: (id, patch) => getStore()?.updateAmbulanceRequest?.(id, patch),
  deleteAmbulanceRequest: (id) => getStore()?.deleteAmbulanceRequest?.(id),

  // Billing
  listBills: () => getStore()?.listBills?.(),
  getBill: (id) => getStore()?.getBill?.(id),
  markBillPaid: (id, payment) => getStore()?.markBillPaid?.(id, payment),

  // Feedback
  listFeedback: () => getStore()?.listFeedback?.(),
  createFeedback: (data) => getStore()?.createFeedback?.(data),
  updateFeedback: (id, patch) => getStore()?.updateFeedback?.(id, patch),
  deleteFeedback: (id) => getStore()?.deleteFeedback?.(id),

  // Activity log helper bridge
  logActivity: (action, details) => getStore()?.logActivity?.(action, details),
};


