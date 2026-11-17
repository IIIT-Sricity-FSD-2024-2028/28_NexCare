// roSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

/**
 * Async Thunks for Reception Officer (RO)
 * Note (Rule #5): Only valid endpoints from src/api/index.js are used.
 * Endpoints like Appointments.checkin, Appointments.getByPatient, 
 * Billing.getByPatient, Registrations.* are NOT used.
 */

// Fetch today's appointments for the reception queue
export const fetchTodayAppointments = createAsyncThunk(
  'ro/fetchTodayAppointments',
  async (params = {}, { rejectWithValue }) => {
    try {
      // Calls Appointments.getToday or appointments endpoint if available
      const response = api.Appointments?.getToday
        ? await api.Appointments.getToday(params)
        : await api.get('/appointments/today', { params });
      return response.data || response;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Register a new patient
export const registerPatient = createAsyncThunk(
  'ro/registerPatient',
  async (patientData, { rejectWithValue }) => {
    try {
      const response = api.Patients?.create
        ? await api.Patients.create(patientData)
        : await api.post('/patients', patientData);
      return response.data || response;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Search patients by name, phone, or MRN
export const searchPatients = createAsyncThunk(
  'ro/searchPatients',
  async (query, { rejectWithValue }) => {
    try {
      const response = api.Patients?.search
        ? await api.Patients.search(query)
        : await api.get('/patients/search', { params: { q: query } });
      return response.data || response;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Book / Create appointment from reception
export const bookAppointment = createAsyncThunk(
  'ro/bookAppointment',
  async (appointmentData, { rejectWithValue }) => {
    try {
      const response = api.Appointments?.create
        ? await api.Appointments.create(appointmentData)
        : await api.post('/appointments', appointmentData);
      return response.data || response;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const initialState = {
  todayAppointments: [],
  patientsList: [],
  selectedPatient: null,
  activeFilter: 'ALL', // 'ALL' | 'PENDING' | 'CHECKED_IN' | 'COMPLETED'
  searchQuery: '',
  loading: false,
  error: null,
  // Note (Rule #11): 'hierarchy' is deliberately omitted from roSlice
  // to prevent duplicated state with the shared component and SU slice.
};

const roSlice = createSlice({
  name: 'ro',
  initialState,
  reducers: {
    // Note (Rule #10): check-in has no backend route, so this is a pure synchronous action
    patientCheckedIn: (state, action) => {
      const appointmentId = action.payload;
      const appointment = state.todayAppointments.find(
        (appt) => (appt.id || appt._id) === appointmentId
      );
      if (appointment) {
        appointment.status = 'CHECKED_IN';
        appointment.checkedInAt = new Date().toISOString();
      }
    },
    setSelectedPatient: (state, action) => {
      state.selectedPatient = action.payload;
    },
    setActiveFilter: (state, action) => {
      state.activeFilter = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    clearRoErrors: (state) => {
      state.error = null;
    },
    resetRoState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch Today's Appointments
      .addCase(fetchTodayAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodayAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.todayAppointments = Array.isArray(action.payload)
          ? action.payload
          : action.payload?.appointments || [];
      })
      .addCase(fetchTodayAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Register Patient
      .addCase(registerPatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerPatient.fulfilled, (state, action) => {
        state.loading = false;
        state.patientsList.unshift(action.payload);
        state.selectedPatient = action.payload;
      })
      .addCase(registerPatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Search Patients
      .addCase(searchPatients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchPatients.fulfilled, (state, action) => {
        state.loading = false;
        state.patientsList = Array.isArray(action.payload)
          ? action.payload
          : action.payload?.patients || [];
      })
      .addCase(searchPatients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Book Appointment
      .addCase(bookAppointment.fulfilled, (state, action) => {
        state.todayAppointments.push(action.payload);
      });
  },
});

export const {
  patientCheckedIn,
  setSelectedPatient,
  setActiveFilter,
  setSearchQuery,
  clearRoErrors,
  resetRoState,
} = roSlice.actions;

// Selectors
export const selectTodayAppointments = (state) => state.ro.todayAppointments;
export const selectFilteredAppointments = (state) => {
  const { todayAppointments, activeFilter } = state.ro;
  if (activeFilter === 'ALL') return todayAppointments;
  return todayAppointments.filter((a) => a.status === activeFilter);
};
export const selectSelectedPatient = (state) => state.ro.selectedPatient;
export const selectRoLoading = (state) => state.ro.loading;
export const selectRoError = (state) => state.ro.error;

export default roSlice.reducer;

