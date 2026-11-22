import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Ambulance, Hospitals } from '../api';
import { isInTransit } from '../features/ambulance/transportSteps';

const errorMessage = (error, fallback) => error?.message || fallback;
const asList = (res) => (Array.isArray(res?.data) ? res.data : []);

export const CHECKLIST_ITEMS = ['Vehicle fuel checked', 'Medical equipment ready', 'Route planned', 'Communication system tested'];
export const CHECKLIST_KEY = 'nexcare_checklist_v1';
export const PROFILE_KEY = 'ambulanceProfile';
export const REFRESH_MS = 5000;

const readJson = (key) => {
  try { return JSON.parse(sessionStorage.getItem(key)) || {}; } catch { return {}; }
};

// GET /ambulance is one list for the whole crew — "pending", "assigned",
// "in transit" and "completed" are statuses on it, so the slice keeps one
// list and the pages filter with the selectors below.
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
  async ({ id, data }, { rejectWithValue }) => {
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
    const user = getState().auth.user || {};
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
      .addCase(updateTransportStatus.fulfilled, (state, action) => mergeRequest(state, action.payload))
      .addCase(updateRequest.fulfilled, (state, action) => mergeRequest(state, action.payload))
      .addCase(completeTransport.fulfilled, (state, action) => mergeRequest(state, action.payload))
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

export const selectPendingRequests = (state) =>
  state.ambulance.requests.list.filter((r) => r.status === 'Pending');
export const selectAssigned = (state) =>
  state.ambulance.requests.list.filter((r) => r.status === 'Dispatched');
export const selectActiveTransport = (state) =>
  state.ambulance.requests.list.find(isInTransit) || null;
export const selectCompletedTransports = (state) =>
  state.ambulance.requests.list.filter((r) => ['Completed', 'Cancelled'].includes(r.status));
export const selectChecklistComplete = (state) =>
  CHECKLIST_ITEMS.every((_, i) => state.ambulance.checklist[`checklist-${i}`]);

export default ambulanceSlice.reducer;
