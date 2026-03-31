// Shared localStorage data layer for Patient Portal pages (front-end only)
// This intentionally avoids any backend dependency and keeps all pages in sync.

const NexCareStore = (() => {
  const KEY = "nexcare_patients";

  function nowISO() {
    return new Date().toISOString();
  }

  function uid(prefix) {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  }

  function loadRaw() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveRaw(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function ensureSeed() {
    const existing = loadRaw();
    if (existing) return existing;

    const seed = {
      version: 1,
      activePatientId: "patient_default",
      patients: {
        patient_default: {
          id: "patient_default",
          fullName: "John Anderson",
          phone: "+1 (555) 123-4567",
          email: "john.anderson@email.com",
          patientIdDisplay: "PAT-2026-001234",
          memberSince: "January 2024",
          status: "Active",
          updatedAt: nowISO(),
        },
      },
      appointments: [
        {
          id: uid("apt"),
          patientId: "patient_default",
          department: "Cardiology",
          doctor: "Dr. Priya Sharma",
          dateLabel: "Mar 10, 2026",
          timeLabel: "10:00 AM",
          token: "TKN-1234",
          fee: 100,
          status: "Confirmed", // Confirmed | Pending | Completed | Canceled
          reason: "",
          createdAt: nowISO(),
          updatedAt: nowISO(),
        },
      ],
      ambulanceRequests: [
        {
          id: "AMB-2026-001",
          patientId: "patient_default",
          pickupLocation: "123 Main Street, Downtown",
          contact: "+1 (555) 123-4567",
          notes: "",
          status: "Completed", // Pending | Dispatched | Completed | Canceled
          createdAt: nowISO(),
          updatedAt: nowISO(),
        },
      ],
      bills: [
        {
          id: "BILL-2026-03-00789",
          patientId: "patient_default",
          visitDate: "7 March, 2026",
          dueDate: "14 March, 2026",
          status: "Pending", // Pending | Paid
          currency: "₹",
          subtotal: 2900,
          cgstRate: 0.09,
          sgstRate: 0.09,
          items: [
            { description: "Consultation Fee - Dr. Priya Sharma", department: "Cardiology", date: "07-03-2026", amount: 1200 },
            { description: "Blood Test - Complete Blood Count", department: "Laboratory", date: "07-03-2026", amount: 450 },
            { description: "ECG Test", department: "Cardiology", date: "07-03-2026", amount: 600 },
            { description: "Medications - Prescribed", department: "Pharmacy", date: "07-03-2026", amount: 650 },
          ],
          createdAt: nowISO(),
          updatedAt: nowISO(),
          payments: [],
        },
      ],
      feedback: [
        {
          id: "REF-2026-00432",
          patientId: "patient_default",
          category: "billing",
          description: "Billing page is confusing; please show clearer breakdowns.",
          rating: 4,
          status: "Open", // Open | In Progress | Resolved
          createdAt: nowISO(),
          updatedAt: nowISO(),
        },
      ],
    };

    saveRaw(seed);
    return seed;
  }

  function read() {
    return ensureSeed();
  }

  function write(mutator) {
    const state = read();
    const next = mutator(structuredClone(state)) || state;
    saveRaw(next);
    return next;
  }

  // -------- Patient --------
  function getActivePatient() {
    const state = read();
    return state.patients[state.activePatientId];
  }

  function updateActivePatient(patch) {
    return write((s) => {
      const p = s.patients[s.activePatientId];
      s.patients[s.activePatientId] = { ...p, ...patch, updatedAt: nowISO() };
      return s;
    });
  }

  // -------- Appointments --------
  function listAppointments() {
    const state = read();
    return state.appointments
      .filter((a) => a.patientId === state.activePatientId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  function createAppointment(data) {
    const state = read();
    const appt = {
      id: uid("apt"),
      patientId: state.activePatientId,
      department: data.department,
      doctor: data.doctor || "TBD",
      dateLabel: data.dateLabel,
      timeLabel: data.timeLabel,
      token: data.token || `TKN-${Math.floor(Math.random() * 9000 + 1000)}`,
      fee: Number.isFinite(data.fee) ? data.fee : 100,
      status: data.status || "Confirmed",
      reason: data.reason || "",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    write((s) => {
      s.appointments.unshift(appt);
      return s;
    });
    return appt;
  }

  function updateAppointment(id, patch) {
    return write((s) => {
      const idx = s.appointments.findIndex((a) => a.id === id);
      if (idx === -1) return s;
      s.appointments[idx] = { ...s.appointments[idx], ...patch, updatedAt: nowISO() };
      return s;
    });
  }

  function deleteAppointment(id) {
    return write((s) => {
      s.appointments = s.appointments.filter((a) => a.id !== id);
      return s;
    });
  }

  // -------- Ambulance --------
  function listAmbulanceRequests() {
    const state = read();
    return state.ambulanceRequests
      .filter((r) => r.patientId === state.activePatientId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  function createAmbulanceRequest(data) {
    const state = read();
    const id = data.id || `AMB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900 + 100)).padStart(3, "0")}`;
    const req = {
      id,
      patientId: state.activePatientId,
      pickupLocation: data.pickupLocation,
      contact: data.contact,
      notes: data.notes || "",
      status: data.status || "Pending",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    write((s) => {
      s.ambulanceRequests.unshift(req);
      return s;
    });
    return req;
  }

  function updateAmbulanceRequest(id, patch) {
    return write((s) => {
      const idx = s.ambulanceRequests.findIndex((r) => r.id === id);
      if (idx === -1) return s;
      s.ambulanceRequests[idx] = { ...s.ambulanceRequests[idx], ...patch, updatedAt: nowISO() };
      return s;
    });
  }

  function deleteAmbulanceRequest(id) {
    return write((s) => {
      s.ambulanceRequests = s.ambulanceRequests.filter((r) => r.id !== id);
      return s;
    });
  }

  // -------- Bills / Payments --------
  function listBills() {
    const state = read();
    return state.bills
      .filter((b) => b.patientId === state.activePatientId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  function getBill(id) {
    const state = read();
    return state.bills.find((b) => b.id === id) || null;
  }

  function markBillPaid(id, payment) {
    return write((s) => {
      const idx = s.bills.findIndex((b) => b.id === id);
      if (idx === -1) return s;
      const bill = s.bills[idx];
      const paymentRecord = {
        id: uid("pay"),
        method: payment.method || "CARD",
        amount: payment.amount,
        transactionId: payment.transactionId || `TXN${Date.now().toString().slice(-10)}`,
        createdAt: nowISO(),
      };
      s.bills[idx] = {
        ...bill,
        status: "Paid",
        payments: [...(bill.payments || []), paymentRecord],
        updatedAt: nowISO(),
      };
      return s;
    });
  }

  // -------- Feedback --------
  function listFeedback() {
    const state = read();
    return state.feedback
      .filter((f) => f.patientId === state.activePatientId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  function createFeedback(data) {
    const state = read();
    const id = data.id || `REF-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`;
    const item = {
      id,
      patientId: state.activePatientId,
      category: data.category,
      description: data.description,
      rating: Number(data.rating) || 0,
      status: data.status || "Open",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    write((s) => {
      s.feedback.unshift(item);
      return s;
    });
    return item;
  }

  function updateFeedback(id, patch) {
    return write((s) => {
      const idx = s.feedback.findIndex((f) => f.id === id);
      if (idx === -1) return s;
      s.feedback[idx] = { ...s.feedback[idx], ...patch, updatedAt: nowISO() };
      return s;
    });
  }

  function deleteFeedback(id) {
    return write((s) => {
      s.feedback = s.feedback.filter((f) => f.id !== id);
      return s;
    });
  }

  return {
    read,
    getActivePatient,
    updateActivePatient,

    listAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,

    listAmbulanceRequests,
    createAmbulanceRequest,
    updateAmbulanceRequest,
    deleteAmbulanceRequest,

    listBills,
    getBill,
    markBillPaid,

    listFeedback,
    createFeedback,
    updateFeedback,
    deleteFeedback,
  };
})();

window.NexCareStore = NexCareStore;

