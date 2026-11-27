import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { Ambulance, Hospitals } from '../api';

const errorMessage = (error, fallback) => error?.message || fallback;
const asList = (res) => (Array.isArray(res?.data) ? res.data : []);

export const CHECKLIST_ITEMS = ['Vehicle fuel checked', 'Medical equipment ready', 'Route planned', 'Communication system tested'];
export const CHECKLIST_KEY = 'nexcare_checklist_v1';
export const PROFILE_KEY = 'ambulanceProfile';
export const REFRESH_MS = 5000;

const readJson = (key) => {
  try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
};

// GET /ambulance is one list for the crew's whole HOSPITAL — "pending",
// "assigned", "in transit" and "completed" are statuses on it, so the slice
// keeps one list and the pages filter with the selectors below. A waiting
// (Pending) request is open to every crew of the hospital; once a crew accepts
// it, it belongs to that crew alone (assignedTo), so the Assigned, Active and
// Completed views show only the signed-in crew's own jobs.
export const fetchAmbulanceRequests = createAsyncThunk(
  'ambulance/fetchRequests',
  async (_, { rejectWithValue }) => {
    try {
      const res = await Ambulance.getAll();
      return asList(res);
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Failed to load ambulance requests.'));
    }
  },
);

export const dispatchAmbulance = createAsyncThunk(
  'ambulance/dispatch',
  async ({ id, assignedTo, vehicleNumber }, { rejectWithValue }) => {
    try {
      const res = await Ambulance.dispatch(id, assignedTo, vehicleNumber);
      return { id, ...(res.data || {}), status: res.data?.status || 'Dispatched' };
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not dispatch ambulance.'));
    }
  },
);

export const updateTransportStatus = createAsyncThunk(
  'ambulance/updateTransportStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await Ambulance.updateStatus(id, status);
      return { id, status, ...(res.data || {}) };
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not update transport status.'));
    }
  },
);

export const updateRequest = createAsyncThunk(
  'ambulance/updateRequest',
  async ({ id, data }, { getState, rejectWithValue }) => {
    // Validation: prevent invalid status transitions
    const state = getState();
    const request = state.ambulance?.requests?.list?.find((r) => r.id === id);
    if (request && data.status) {
      const currentStatus = request.status;
      const newStatus = data.status;
      // Prevent reverting from in-transit statuses
      const inTransitStatuses = ['En Route', 'Picked Up', 'At Hospital'];
      if (inTransitStatuses.includes(currentStatus) && newStatus === 'Pending') {
        return rejectWithValue('Cannot revert an in-transit transport to Pending');
      }
      // Prevent setting status to Completed without going through completeTransport
      if (newStatus === 'Completed' && currentStatus !== 'At Hospital') {
        return rejectWithValue('Transport must reach hospital before completion');
      }
    }
    try {
      const res = await Ambulance.update(id, data);
      return { id, ...(res.data || {}) };
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not update request.'));
    }
  },
);

export const completeTransport = createAsyncThunk(
  'ambulance/completeTransport',
  async (id, { rejectWithValue }) => {
    try {
      const res = await Ambulance.complete(id);
      return { id, status: 'Completed', ...(res.data || {}) };
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not complete transport.'));
    }
  },
);

export const fetchHospitalName = createAsyncThunk(
  'ambulance/fetchHospitalName',
  async (_, { getState }) => {
    const state = getState();
    const user = state.auth.user || {};
    const existingName = state.ambulance?.hospitalName;
    if (existingName) return existingName;
    if (user.hospitalName) return user.hospitalName;
    if (!user.hospitalId) return '';
    try {
      const res = await Hospitals.getById(user.hospitalId);
      return res.data?.name || '';
    } catch {
      return '';
    }
  },
);

const mergeRequest = (state, payload) => {
  const index = state.requests.list.findIndex((r) => r.id === payload.id);
  if (index >= 0) state.requests.list[index] = { ...state.requests.list[index], ...payload };
};

const rollbackRequest = (state, action) => {
  // On rejection, refetch to ensure consistency
  state.requests.loaded = false;
};

// A function, so the logout reset re-reads checklist/profile from sessionStorage.
const initialState = () => ({
  requests: { list: [], loaded: false, loading: false, error: null },
  hospitalName: '',
  checklist: readJson(CHECKLIST_KEY),
  profile: readJson(PROFILE_KEY),
});

const ambulanceSlice = createSlice({
  name: 'ambulance',
  initialState,
  reducers: {
    checklistToggled: (state, action) => {
      const key = `checklist-${action.payload}`;
      state.checklist[key] = !state.checklist[key];
    },
    profileSaved: (state, action) => {
      state.profile = { ...state.profile, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAmbulanceRequests.pending, (state) => {
        state.requests.loading = true;
        state.requests.error = null;
      })
      .addCase(fetchAmbulanceRequests.fulfilled, (state, action) => {
        state.requests.list = action.payload;
        state.requests.loaded = true;
        state.requests.loading = false;
      })
      .addCase(fetchAmbulanceRequests.rejected, (state, action) => {
        state.requests.loading = false;
        state.requests.error = action.payload;
        state.requests.loaded = true;
      })
      .addCase(dispatchAmbulance.fulfilled, (state, action) => mergeRequest(state, action.payload))
      .addCase(dispatchAmbulance.rejected, (state) => rollbackRequest(state))
      .addCase(updateTransportStatus.fulfilled, (state, action) => mergeRequest(state, action.payload))
      .addCase(updateTransportStatus.rejected, (state) => rollbackRequest(state))
      .addCase(updateRequest.fulfilled, (state, action) => mergeRequest(state, action.payload))
      .addCase(updateRequest.rejected, (state) => rollbackRequest(state))
      .addCase(completeTransport.fulfilled, (state, action) => mergeRequest(state, action.payload))
      .addCase(completeTransport.rejected, (state) => rollbackRequest(state))
      .addCase(fetchHospitalName.fulfilled, (state, action) => {
        if (action.payload) state.hospitalName = action.payload;
      });
  },
});

export const { checklistToggled, profileSaved } = ambulanceSlice.actions;

export const selectAmbulanceRequests = (state) => state.ambulance.requests;
export const selectAmbulanceHospitalName = (state) => state.ambulance.hospitalName;
export const selectAmbulanceChecklist = (state) => state.ambulance.checklist;
export const selectAmbulanceProfile = (state) => state.ambulance.profile;

const selectList = (state) => state.ambulance.requests.list;
const selectCrewId = (state) => state.auth.user?.id || '';
const IN_TRANSIT = ['En Route', 'Picked Up', 'At Hospital'];

/** Waiting requests of the hospital: any free crew of it may accept one. */
export const selectPendingRequests = createSelector([selectList], (list) =>
  list.filter((r) => r.status === 'Pending'));
/** Jobs this crew has taken (any status). */
export const selectMyRequests = createSelector([selectList, selectCrewId], (list, me) =>
  list.filter((r) => me && r.assignedTo === me));
/** What this crew's screens show: the hospital's waiting requests + its own jobs. */
export const selectCrewRequests = createSelector([selectPendingRequests, selectMyRequests], (pending, mine) =>
  [...pending, ...mine]);
export const selectAssigned = createSelector([selectMyRequests], (mine) =>
  mine.filter((r) => r.status === 'Dispatched'));
export const selectActiveTransport = createSelector([selectMyRequests], (mine) =>
  mine.find((r) => IN_TRANSIT.includes(r.status)) || null);
export const selectCompletedTransports = createSelector([selectMyRequests], (mine) =>
  mine.filter((r) => ['Completed', 'Cancelled'].includes(r.status)));
export const selectChecklistComplete = (state) =>
  CHECKLIST_ITEMS.every((_, i) => state.ambulance.checklist[`checklist-${i}`]);

export default ambulanceSlice.reducer;
