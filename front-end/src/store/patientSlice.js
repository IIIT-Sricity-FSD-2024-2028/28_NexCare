// Patient portal state. Owner: Vivian.
//
// Replaces portals/patient/PatientContext.jsx. The patient record and Care+
// membership are fetched once when the portal mounts (PatientPortal); every
// other sub-state is filled by the page that needs it. Because the store is
// global, the dashboard's counts update as soon as another page dispatches
// (paying a bill drops "Pending Bills" without a refetch).
//
// Every piece of server data the patient portal shows lives here. Pages never
// call src/api themselves: they dispatch a thunk (createAsyncThunk, so each
// call goes pending → fulfilled | rejected) and read the result with a selector.
// Only form inputs, wizard steps, open/closed flags and one-button busy flags
// stay in component state.
//
// Sub-states follow the backend repositories (NestJS modules) the patient
// touches. CRUD per repository, as the patient role is allowed by the backend:
//
//   Repository      Create                Read                         Update                               Delete
//   patients        (registration page)   fetchPatientProfile          updatePatientProfile, changePassword (staff only)
//   appointments    createAppointment     fetchAppointments            rescheduleAppointment, cancel…       deleteAppointment
//   billing         (staff: generateBill) fetchBills                   payBill                              (staff only)
//   feedback        submitFeedback        fetchFeedback                updateFeedback                       deleteFeedback
//   ambulance       requestAmbulance      fetchAmbulanceRequests,      cancelAmbulanceRequest               (staff only)
//                                         fetchAmbulanceFleet (counts per hospital)
//   membership      subscribeMembership   fetchMembership, …Plans      subscribeMembership (plan change)    cancelMembership
//   hospitals       —                     fetchHospitals, fetchNearbyHospitals, searchHospitals (read-only for patients)
//   users/doctors   —                     fetchDoctorDirectory          (read-only for patients)
//   schedules       —                     fetchPublishedSchedules       (read-only for patients)
//   payments        payBill (intent)      fetchTestCards                —                                    —
//
// "(staff only)" means the backend's @Roles refuses the patient: those writes
// exist in the staff / superuser slices, not here.
//
// Logout resets this slice through the root reducer in store/index.js.
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { Ambulance, Appointments, Auth, Billing, Feedback, Hospitals, Patients, Payments, Revenue } from '../api';
import { loadCatalogue } from '../features/doctor-directory/catalogue';
import { loadPublishedSchedules } from '../features/doctor-directory/hospitalSchedule';
import { payBill as payBillThroughGateway } from '../features/payments/payBill';

/**
 * The booking wizard's draft. Defined here, not in BookingWizard.jsx, so the
 * slice does not import a component (BookingWizard re-exports it).
 */
export const EMPTY_BOOKING = {
  rescheduleId: null, hospital: null, department: null, doctorId: null, doctor: null,
  fee: null, date: null, time: null, lastToken: null,
};

const errorMessage = (error, fallback) => error?.message || fallback;
// Some endpoints answer `{ data: [...] }`, a few wrap it once more.
const asList = (res) => (Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : []);
const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
// GET /hospitals has answered as a bare array, `{ data }` and `{ hospitals }` over time.
const asHospitalList = (res) => {
  const raw = res?.data;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  return Array.isArray(raw?.hospitals) ? raw.hospitals : [];
};
const isVerified = (h) => !h.verificationStatus || h.verificationStatus === 'verified';

/**
 * The message from a `dispatch(thunk).unwrap()` rejection: the string passed to
 * rejectWithValue, or a SerializedError's message.
 */
export const errorText = (err, fallback) => (typeof err === 'string' ? err : err?.message) || fallback;

/** Whether a membership is a paid plan rather than pay-as-you-go. */
export function isPaidMembership(m) {
  return Boolean(m && m.monthlyFee > 0 && m.planId !== 'CARE-PAYG');
}

/* ── Thunks: profile + membership ─────────────────────────────────────────── */

export const fetchPatientProfile = createAsyncThunk('patient/fetchProfile', async (id, { rejectWithValue }) => {
  try {
    return (await Patients.getById(id)).data || null;
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Could not fetch the patient profile.'));
  }
});

export const updatePatientProfile = createAsyncThunk('patient/updateProfile', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await Patients.update(id, data);
    return { ...data, ...(res.data || {}) };
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Could not save your profile.'));
  }
});

/** PATCH /auth/change-password. The account row is the patient's own; nothing is stored. */
export const changePassword = createAsyncThunk('patient/changePassword', async ({ currentPassword, newPassword }, { rejectWithValue }) => {
  try {
    await Auth.changePassword(currentPassword, newPassword);
    return true;
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Failed to change password. Please check your current password.'));
  }
});

export const fetchMembership = createAsyncThunk('patient/fetchMembership', async (_, { rejectWithValue }) => {
  try {
    return (await Revenue.getMyMembership()).data || null;
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Could not load your membership.'));
  }
});

export const fetchPatientPlans = createAsyncThunk('patient/fetchPlans', async (_, { rejectWithValue }) => {
  try {
    return asList(await Revenue.getPatientPlans());
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Could not load your membership. Check that the backend is running.'));
  }
});

/** Joins (or, with CARE-PAYG, cancels) a plan. The page refetches the membership afterwards. */
export const subscribeMembership = createAsyncThunk('patient/subscribeMembership', async ({ planId, paymentDetails }, { rejectWithValue }) => {
  try {
    return (await Revenue.setMyMembership(planId, paymentDetails)).data || null;
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Could not update your membership.'));
  }
});

/** Leaves the paid plan: the backend's "delete" for a membership is a move back to pay-as-you-go. */
export const cancelMembership = createAsyncThunk('patient/cancelMembership', async (_, { rejectWithValue }) => {
  try {
    return (await Revenue.setMyMembership('CARE-PAYG', {})).data || null;
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Could not cancel membership'));
  }
});

/* ── Thunks: appointments + booking ───────────────────────────────────────── */

// GET /appointments is scoped by the backend to the signed-in patient.
export const fetchAppointments = createAsyncThunk('patient/fetchAppointments', async (_, { rejectWithValue }) => {
  try {
    return asList(await Appointments.getAll());
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Could not load your appointments.'));
  }
});

export const createAppointment = createAsyncThunk('patient/createAppointment', async (data, { rejectWithValue }) => {
  try {
    const result = (await Appointments.create(data)).data;
    if (!result || !result.id) throw new Error('The hospital did not create an appointment record.');
    return result;
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Failed to confirm appointment'));
  }
});

export const rescheduleAppointment = createAsyncThunk('patient/rescheduleAppointment', async ({ id, slot }, { rejectWithValue }) => {
  try {
    const result = (await Appointments.reschedule(id, slot)).data;
    if (!result || !result.id) throw new Error('The hospital did not update the appointment.');
    return result;
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Failed to reschedule appointment'));
  }
});

export const cancelAppointment = createAsyncThunk('patient/cancelAppointment', async (id, { rejectWithValue }) => {
  try {
    const res = await Appointments.cancel(id);
    return { ...(res.data || {}), id, status: 'Cancelled' };
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Could not cancel the appointment'));
  }
});

export const deleteAppointment = createAsyncThunk('patient/deleteAppointment', async (id, { rejectWithValue }) => {
  try {
    await Appointments.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Could not delete the appointment'));
  }
});

/* ── Thunks: billing ──────────────────────────────────────────────────────── */

export const fetchBills = createAsyncThunk('patient/fetchBills', async (_, { rejectWithValue }) => {
  try {
    return asList(await Billing.getAll());
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Could not load your bills'));
  }
});

/** Intent + gateway confirm. A decline rejects with the gateway's reason; the bill stays open. */
export const payBill = createAsyncThunk('patient/payBill', async ({ billId, card }, { rejectWithValue }) => {
  try {
    const result = await payBillThroughGateway(billId, card);
    // Only the serializable bits go in the action: the fee rows are logged, not stored.
    return { billId, platformFees: result?.platformFees || [] };
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'The payment could not be processed'));
  }
});

/* ── Thunks: feedback ─────────────────────────────────────────────────────── */

export const fetchFeedback = createAsyncThunk('patient/fetchFeedback', async (patientId, { rejectWithValue }) => {
  try {
    return asList(await Feedback.getByPatient(patientId));
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Could not load your submissions.'));
  }
});

export const submitFeedback = createAsyncThunk('patient/submitFeedback', async (data, { rejectWithValue }) => {
  try {
    return (await Feedback.create(data)).data || null;
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Could not submit your feedback'));
  }
});

export const updateFeedback = createAsyncThunk('patient/updateFeedback', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await Feedback.update(id, data);
    return { ...data, ...(res.data || {}), id };
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Could not update the submission'));
  }
});

export const deleteFeedback = createAsyncThunk('patient/deleteFeedback', async (id, { rejectWithValue }) => {
  try {
    await Feedback.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Could not delete the submission'));
  }
});

/* ── Thunks: ambulance ────────────────────────────────────────────────────── */

export const fetchAmbulanceRequests = createAsyncThunk('patient/fetchAmbulanceRequests', async (patientId, { rejectWithValue }) => {
  try {
    return asList(await Ambulance.getByPatient(patientId)).sort(byNewest);
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Failed to load ambulance requests.'));
  }
});

/** How many ambulances each hospital has and how many are free (counts only for a patient). */
export const fetchAmbulanceFleet = createAsyncThunk('patient/fetchAmbulanceFleet', async (_, { rejectWithValue }) => {
  try {
    const res = await Ambulance.getFleet();
    return Array.isArray(res?.data) ? res.data : [];
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Could not load ambulance availability.'));
  }
});

export const requestAmbulance = createAsyncThunk('patient/requestAmbulance', async (data, { rejectWithValue }) => {
  try {
    return (await Ambulance.createRequest(data)).data || null;
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Failed to dispatch ambulance.'));
  }
});

export const cancelAmbulanceRequest = createAsyncThunk('patient/cancelAmbulanceRequest', async (id, { rejectWithValue }) => {
  try {
    const res = await Ambulance.cancelRequest(id);
    return { ...(res.data || {}), id, status: res.data?.status || 'Cancelled' };
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'The request could not be cancelled.'));
  }
});

/* ── Thunks: payments ─────────────────────────────────────────────────────── */

/** The simulated gateway's test cards, listed on the card form. */
export const fetchTestCards = createAsyncThunk('patient/fetchTestCards', async (_, { rejectWithValue }) => {
  try {
    const cards = (await Payments.getTestCards()).data?.cards;
    return Array.isArray(cards) ? cards : [];
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Could not load the test cards.'));
  }
});

/* ── Thunks: hospitals, doctor directory, schedules (read-only) ───────────── */

/** GET /hospitals: the whole network (the feedback hospital picker). */
export const fetchHospitals = createAsyncThunk('patient/fetchHospitals', async (_, { rejectWithValue }) => {
  try {
    return asHospitalList(await Hospitals.getAll());
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Could not load hospitals.'));
  }
});

/**
 * GET /hospitals/nearby for the patient's address, falling back to the whole
 * network when the lookup fails or finds nothing, so the dashboard and the
 * ambulance form are never left empty.
 */
export const fetchNearbyHospitals = createAsyncThunk('patient/fetchNearbyHospitals', async ({ city = '', state = '', pincode = '' } = {}, { rejectWithValue }) => {
  try {
    let list = [];
    if (city || state || pincode) {
      try { list = asHospitalList(await Hospitals.getNearby(city, state, pincode)); } catch { list = []; }
    }
    if (!list.length) list = asHospitalList(await Hospitals.getAll());
    return list;
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Hospital information is temporarily unavailable.'));
  }
});

/** GET /hospitals?speciality&city&pincode: the Find Hospitals page. */
export const searchHospitals = createAsyncThunk('patient/searchHospitals', async (filters = {}, { rejectWithValue }) => {
  try {
    const trimmed = {
      speciality: String(filters.speciality || '').trim(),
      city: String(filters.city || '').trim(),
      pincode: String(filters.pincode || '').trim(),
    };
    return asHospitalList(await Hospitals.getAll(trimmed));
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to load hospital data. Please check the connection and try again.'));
  }
});

/** GET /hospitals + GET /users/doctors, grouped into the booking wizard's catalogue. */
export const fetchDoctorDirectory = createAsyncThunk('patient/fetchDoctorDirectory', async (_, { rejectWithValue }) => {
  try {
    return await loadCatalogue();
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Could not load the hospital directory'));
  }
});

/** GET /schedules?hospitalId&status=approved: the rosters the wizard trims slots to. */
export const fetchPublishedSchedules = createAsyncThunk('patient/fetchPublishedSchedules', async (hospitalId, { rejectWithValue }) => {
  try {
    return await loadPublishedSchedules(hospitalId);
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'The published hospital schedule could not be loaded.'));
  }
});

/* ── Slice ────────────────────────────────────────────────────────────────── */

const initialState = {
  profile: { data: null, loading: false, error: null },
  membership: { data: null, plans: [], loading: false, error: null },
  appointments: { list: [], loading: false, error: null },
  billing: { bills: [], loading: false, error: null },
  feedback: { list: [], loading: false, error: null },
  booking: { draft: EMPTY_BOOKING, submitting: false },
  ambulance: { requests: [], loading: false, error: null },
  // One row per hospital: { hospitalId, ambulanceService, total, available, onTransport, waiting }.
  ambulanceFleet: { list: [], loading: false, error: null },
  payments: { testCards: [], loading: false, error: null },
  hospitals: { list: [], loading: false, error: null },
  nearbyHospitals: { list: [], loading: false, error: null },
  // `query` is the filter set the results answer (null before the first search).
  hospitalSearch: { results: [], query: null, loading: false, error: null },
  // status: idle | loading | succeeded | failed. The appointments page waits for
  // the first load to settle before it reads a ?hospitalId deep link.
  directory: { catalogue: [], status: 'idle', error: null },
  // `hospitalId` is the hospital the list belongs to (the wizard ignores a list
  // for a hospital the patient has since moved away from).
  schedules: { hospitalId: null, list: [], loading: false, error: null },
};

const replaceById = (list, item) => {
  const i = list.findIndex((x) => x.id === item.id);
  if (i >= 0) list[i] = { ...list[i], ...item };
  else list.unshift(item);
};

/** pending → loading, rejected → error, for a sub-state. `onFulfilled` writes the payload. */
function track(builder, thunk, key, onFulfilled) {
  builder
    .addCase(thunk.pending, (state) => { state[key].loading = true; state[key].error = null; })
    .addCase(thunk.fulfilled, (state, action) => { state[key].loading = false; onFulfilled(state[key], action.payload); })
    .addCase(thunk.rejected, (state, action) => { state[key].loading = false; state[key].error = action.payload || action.error.message; });
}

/**
 * A write (cancel, pay, delete…): same as `track` but leaves `loading` alone, so
 * the page's list does not flip back to "Loading…" while one row is being saved.
 * The button that started it keeps its own busy flag.
 */
function mutate(builder, thunk, key, onFulfilled) {
  builder
    .addCase(thunk.pending, (state) => { state[key].error = null; })
    .addCase(thunk.fulfilled, (state, action) => { onFulfilled(state[key], action.payload); })
    .addCase(thunk.rejected, (state, action) => { state[key].error = action.payload || action.error.message; });
}

const patientSlice = createSlice({
  name: 'patient',
  initialState,
  reducers: {
    updateBookingDraft: (state, action) => { state.booking.draft = { ...state.booking.draft, ...action.payload }; },
    resetBooking: (state, action) => { state.booking.draft = { ...EMPTY_BOOKING, ...(action.payload || {}) }; },
  },
  extraReducers: (builder) => {
    track(builder, fetchPatientProfile, 'profile', (s, data) => { s.data = data; });
    mutate(builder, updatePatientProfile, 'profile', (s, patch) => { s.data = { ...(s.data || {}), ...patch }; });
    mutate(builder, changePassword, 'profile', () => {});

    track(builder, fetchMembership, 'membership', (s, data) => { s.data = data; });
    track(builder, fetchPatientPlans, 'membership', (s, plans) => { s.plans = plans; });
    mutate(builder, subscribeMembership, 'membership', (s, data) => { if (data?.planId) s.data = data; });
    mutate(builder, cancelMembership, 'membership', (s, data) => { if (data?.planId) s.data = data; });

    track(builder, fetchAppointments, 'appointments', (s, list) => { s.list = list; });
    mutate(builder, cancelAppointment, 'appointments', (s, appt) => { replaceById(s.list, appt); });
    mutate(builder, deleteAppointment, 'appointments', (s, id) => { s.list = s.list.filter((a) => a.id !== id); });

    // Booking uses `submitting`, not `loading`, and reports errors with a toast.
    for (const thunk of [createAppointment, rescheduleAppointment]) {
      builder
        .addCase(thunk.pending, (state) => { state.booking.submitting = true; })
        .addCase(thunk.fulfilled, (state, action) => {
          state.booking.submitting = false;
          replaceById(state.appointments.list, action.payload);
          state.booking.draft.lastToken = action.payload.token || action.payload.id;
        })
        .addCase(thunk.rejected, (state) => { state.booking.submitting = false; });
    }

    track(builder, fetchBills, 'billing', (s, bills) => { s.bills = bills; });
    // Mark the bill paid in place, so every page reading billing.bills updates at once.
    mutate(builder, payBill, 'billing', (s, { billId }) => {
      const bill = s.bills.find((b) => String(b.id) === String(billId));
      if (bill) bill.status = 'Paid';
    });

    track(builder, fetchFeedback, 'feedback', (s, list) => { s.list = list; });
    mutate(builder, submitFeedback, 'feedback', (s, item) => { if (item?.id) s.list.unshift(item); });
    mutate(builder, updateFeedback, 'feedback', (s, item) => { replaceById(s.list, item); });
    mutate(builder, deleteFeedback, 'feedback', (s, id) => { s.list = s.list.filter((f) => f.id !== id); });

    track(builder, fetchAmbulanceRequests, 'ambulance', (s, list) => { s.requests = list; });
    track(builder, fetchAmbulanceFleet, 'ambulanceFleet', (s, list) => { s.list = list; });
    mutate(builder, requestAmbulance, 'ambulance', (s, req) => { if (req?.id) s.requests.unshift(req); });
    mutate(builder, cancelAmbulanceRequest, 'ambulance', (s, req) => { replaceById(s.requests, req); });

    track(builder, fetchTestCards, 'payments', (s, cards) => { s.testCards = cards; });

    track(builder, fetchHospitals, 'hospitals', (s, list) => { s.list = list; });
    track(builder, fetchNearbyHospitals, 'nearbyHospitals', (s, list) => { s.list = list; });
    // Like track(), but pending also records which filters the results will answer.
    builder
      .addCase(searchHospitals.pending, (state, action) => {
        Object.assign(state.hospitalSearch, { loading: true, error: null, query: action.meta.arg || {} });
      })
      .addCase(searchHospitals.fulfilled, (state, action) => { state.hospitalSearch.loading = false; state.hospitalSearch.results = action.payload; })
      .addCase(searchHospitals.rejected, (state, action) => {
        state.hospitalSearch.loading = false;
        state.hospitalSearch.results = [];
        state.hospitalSearch.error = action.payload || action.error.message;
      });

    builder
      .addCase(fetchDoctorDirectory.pending, (state) => { state.directory.status = 'loading'; state.directory.error = null; })
      .addCase(fetchDoctorDirectory.fulfilled, (state, action) => { state.directory.status = 'succeeded'; state.directory.catalogue = action.payload; })
      .addCase(fetchDoctorDirectory.rejected, (state, action) => {
        state.directory.status = 'failed';
        state.directory.catalogue = [];
        state.directory.error = action.payload || action.error.message;
      });

    // Only the answer for the hospital last asked about is kept, so a slow
    // response for a hospital the patient has moved away from is ignored.
    builder
      .addCase(fetchPublishedSchedules.pending, (state, action) => {
        state.schedules = { hospitalId: action.meta.arg, list: [], loading: true, error: null };
      })
      .addCase(fetchPublishedSchedules.fulfilled, (state, action) => {
        if (state.schedules.hospitalId !== action.meta.arg) return;
        state.schedules.loading = false;
        state.schedules.list = action.payload;
      })
      .addCase(fetchPublishedSchedules.rejected, (state, action) => {
        if (state.schedules.hospitalId !== action.meta.arg) return;
        state.schedules.loading = false;
        state.schedules.error = action.payload || action.error.message;
      });
  },
});

export const { updateBookingDraft, resetBooking } = patientSlice.actions;
export default patientSlice.reducer;

/* ── Selectors ────────────────────────────────────────────────────────────── */

const selectAuthUser = (state) => state.auth.user;

export const selectPatientId = (state) => state.auth.user?.patientId || state.auth.user?.id || '';
/** The raw patient record from GET /patients/:id (null until it loads). */
export const selectPatientRecord = (state) => state.patient.profile.data;
export const selectPatientProfileState = (state) => state.patient.profile;

/** The session user overlaid with the fresher patient record. */
export const selectPatientProfile = createSelector(
  [selectAuthUser, selectPatientRecord],
  (user, patient) => ({ ...(user || {}), ...(patient || {}) }),
);

export const selectPatientDisplayName = (state) => {
  const patient = selectPatientRecord(state);
  const user = selectAuthUser(state);
  return patient?.fullName || patient?.name || user?.name || String(user?.email || '').split('@')[0] || 'Patient';
};

export const selectPatientDisplayId = (state) => {
  const patient = selectPatientRecord(state);
  return patient?.patientId || patient?.patientIdDisplay || patient?.id || selectPatientId(state);
};

export const selectPatientMembership = (state) => state.patient.membership.data;
export const selectMembershipState = (state) => state.patient.membership;
export const selectPatientPlans = (state) => state.patient.membership.plans;
export const selectIsPaidMembership = (state) => isPaidMembership(state.patient.membership.data);

export const selectAppointments = (state) => state.patient.appointments.list;
export const selectAppointmentsState = (state) => state.patient.appointments;
export const selectUpcomingAppointments = createSelector([selectAppointments], (list) =>
  list.filter((a) => a.status !== 'Completed' && a.status !== 'Cancelled'));
export const selectPastAppointments = createSelector([selectAppointments], (list) =>
  list.filter((a) => a.status === 'Completed' || a.status === 'Cancelled'));
export const selectCompletedAppointments = createSelector([selectAppointments], (list) =>
  list.filter((a) => a.status === 'Completed'));

export const selectBills = (state) => state.patient.billing.bills;
export const selectBillingState = (state) => state.patient.billing;
export const selectPendingBills = createSelector([selectBills], (bills) =>
  bills.filter((b) => String(b.status).toLowerCase() === 'pending'));
export const selectPaidBills = createSelector([selectBills], (bills) =>
  bills.filter((b) => String(b.status).toLowerCase() === 'paid'));

export const selectFeedbackList = (state) => state.patient.feedback.list;

export const selectAmbulanceRequests = (state) => state.patient.ambulance.requests;
export const selectAmbulanceFleetState = (state) => state.patient.ambulanceFleet;
/** hospitalId → fleet row, for the ambulance form's hospital picker. */
export const selectAmbulanceFleetByHospital = createSelector([(state) => state.patient.ambulanceFleet.list], (list) =>
  Object.fromEntries(list.map((row) => [row.hospitalId, row])));
/** Requests that are not finished yet (the dashboard's "Ambulance Requests" card). */
export const selectOpenAmbulanceCount = (state) =>
  state.patient.ambulance.requests.filter((r) => r.status !== 'Completed').length;

export const selectBillById = (state, id) =>
  (id == null ? null : state.patient.billing.bills.find((b) => String(b.id) === String(id)) || null);

export const selectTestCards = (state) => state.patient.payments.testCards;

/** Verified hospitals, A→Z (the feedback picker). `null` until the first load settles. */
export const selectVerifiedHospitals = createSelector([(state) => state.patient.hospitals], (h) =>
  (h.loading && !h.list.length ? null
    : h.list.filter(isVerified).sort((a, b) => String(a.name).localeCompare(String(b.name)))));
/** Hospitals near the patient (dashboard + ambulance form). `null` while the first load runs. */
export const selectNearbyHospitals = createSelector([(state) => state.patient.nearbyHospitals], (h) =>
  (h.loading && !h.list.length ? null : h.list));
export const selectHospitalSearch = (state) => state.patient.hospitalSearch;

export const selectDoctorDirectory = (state) => state.patient.directory;
export const selectSchedulesState = (state) => state.patient.schedules;

/**
 * Time labels already taken for a doctor on a date (appointments.js
 * getBookedSlotsForDoctor). GET /appointments is scoped by the backend to the
 * signed-in patient, so this catches the patient's own clashes; the server
 * refuses everyone else's at booking time. `ignoreId` is the appointment being
 * rescheduled, whose own slot stays free. Returns an array (a Set is not
 * serializable); the wizard wraps it in a Set itself.
 */
export function bookedSlotsFrom(appointments, doctorName, dateStr, ignoreId) {
  if (!doctorName || !dateStr) return [];
  const normDoc = String(doctorName).toLowerCase().replace(/^dr\.\s*/i, '').trim();
  const normDate = String(dateStr).trim();
  const taken = [];
  (appointments || []).forEach((a) => {
    if (a.status === 'Cancelled' || (ignoreId && a.id === ignoreId)) return;
    const aDoc = String(a.doctor || a.doctorName || '').toLowerCase().replace(/^dr\.\s*/i, '').trim();
    const aDate = String(a.dateLabel || a.date || '').trim();
    if ((aDoc === normDoc || aDoc.includes(normDoc) || normDoc.includes(aDoc))
      && (aDate === normDate || aDate.includes(normDate) || normDate.includes(aDate))) {
      if (a.timeLabel) taken.push(a.timeLabel);
      if (a.time) taken.push(a.time);
    }
  });
  return taken;
}

export const selectBookingDraft = (state) => state.patient.booking.draft;
export const selectBookingSubmitting = (state) => state.patient.booking.submitting;
