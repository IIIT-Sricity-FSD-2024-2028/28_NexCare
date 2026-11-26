// Doctor portal state. Owner: Nikitha
import { createAsyncThunk, createSlice, createSelector } from '@reduxjs/toolkit';
import { Appointments, Auth, Leaves, Revenue, Users } from '../api';
import { updateSessionUser } from './authSlice';
import { upsert } from './repositoryState';
import { appointmentTime } from '../utils/format';

const msg = (err, fallback) => err?.message || fallback;
const asList = (res) => (Array.isArray(res?.data) ? res.data : []);


const thunk = (type, call, fallback) =>
  createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try {
      return await call(arg);
    } catch (err) {
      return rejectWithValue(msg(err, fallback));
    }
  });



export const fetchDoctorAppointments = thunk(
  'doctor/fetchAppointments',
  async () => asList(await Appointments.mine()).sort((a, b) => appointmentTime(b) - appointmentTime(a)),
  'Could not load your appointments. Check that the backend is running.',
);

export const fetchDoctorStats = thunk(
  'doctor/fetchStats',
  async () => (await Appointments.myStats())?.data || {},
  'Could not load your schedule. Check that the backend is running.',
);

// verb: 'confirm' | 'complete' | any other status string (goes through updateStatus).
export const updateAppointmentStatus = thunk(
  'doctor/updateAppointmentStatus',
  async ({ id, verb }) => {
    if (verb === 'confirm' || verb === 'complete') await Appointments[verb](id);
    else await Appointments.updateStatus(id, verb);
    const status = { confirm: 'Confirmed', complete: 'Completed' }[verb] || verb;
    return { id, status };
  },
  'Could not update the appointment',
);

export const fetchDoctorEarnings = thunk(
  'doctor/fetchEarnings',
  async () => (await Revenue.myEarnings())?.data || null,
  'Could not load your earnings. Check that the backend is running.',
);

export const updateConsultationFee = thunk(
  'doctor/updateConsultationFee',
  async (fee) => {
    await Revenue.updateMyConsultationFee(fee);
    return fee;
  },
  'Could not save your fee',
);

export const fetchDoctorLeaves = thunk(
  'doctor/fetchLeaves',
  async (doctorId) =>
    asList(await Leaves.list({ doctorId })).sort((a, b) => String(b.startDate).localeCompare(String(a.startDate))),
  'Could not load your leave requests. Check that the backend is running.',
);

export const requestLeave = thunk(
  'doctor/requestLeave',
  async (data) => (await Leaves.create(data))?.data || data,
  'Could not submit the request',
);

export const deleteLeave = thunk(
  'doctor/deleteLeave',
  async (id) => {
    await Leaves.remove(id);
    return id;
  },
  'Could not withdraw the request',
);

export const fetchDoctorProfile = thunk(
  'doctor/fetchProfile',
  async (userId) => (await Auth.getCurrentUser(userId))?.data || null,
  'Could not load your profile',
);

export const createReferral = createAsyncThunk('doctor/createReferral', async (data) => (await Appointments.create(data)).data);

export const editPendingLeave = thunk('doctor/editPendingLeave', async ({ id, data }) =>
  (await Leaves.editPending(id, data)).data, 'Could not update the leave request');

export const fetchReferralDoctors = createAsyncThunk('doctor/fetchReferralDoctors', async () => (await Users.getDoctors()).data || []);

const DIRECTORY_FIELDS = [
  'dept', 'department', 'specialization', 'consultationFee', 'experienceYears',
  'qualification', 'consultationTiming', 'medicalRegNumber', 'employeeId', 'hospitalName',
];

export const enrichDoctorSession = createAsyncThunk('doctor/enrichDoctorSession', async (_, { dispatch, getState }) => {
  const user = getState().auth.user;
  if (!user?.id || user.dept) return;
  const doctors = await dispatch(fetchReferralDoctors()).unwrap();
  if (getState().auth.user?.id !== user.id) return;
  const me = doctors.find((doctor) => String(doctor.id) === String(user.id));
  if (!me) return;
  const patch = Object.fromEntries(DIRECTORY_FIELDS
    .filter((key) => me[key] != null && user[key] === undefined)
    .map((key) => [key, me[key]]));
  if (Object.keys(patch).length) dispatch(updateSessionUser(patch));
});

/* ---------- slice ---------- */

const sub = (extra) => ({ ...extra, loading: false, error: null });

const initialState = {
  appointments: sub({ list: [], filters: { status: '', search: '' } }),
  referralDoctors: [],
  stats: sub({ data: null }),
  earnings: sub({ data: null }),
  leaves: sub({ list: [] }),
  profile: sub({ data: null }),
};

// pending → loading, rejected → error, fulfilled → apply(state, payload).
const track = (builder, asyncThunk, key, apply) => {
  builder
    .addCase(asyncThunk.pending, (state) => { state[key].loading = true; state[key].error = null; })
    .addCase(asyncThunk.rejected, (state, { payload }) => { state[key].loading = false; state[key].error = payload; })
    .addCase(asyncThunk.fulfilled, (state, { payload }) => { state[key].loading = false; apply(state[key], payload); });
};

const doctorSlice = createSlice({
  name: 'doctor',
  initialState,
  reducers: {
    setStatusFilter(state, { payload }) { state.appointments.filters.status = payload; },
    setSearch(state, { payload }) { state.appointments.filters.search = payload; },
  },
  extraReducers: (builder) => {
    track(builder, fetchDoctorAppointments, 'appointments', (s, list) => { s.list = list; });
    track(builder, fetchDoctorStats, 'stats', (s, stats) => { s.data = stats; });
    track(builder, fetchDoctorEarnings, 'earnings', (s, data) => { s.data = data; });
    track(builder, fetchDoctorLeaves, 'leaves', (s, list) => { s.list = list; });
    track(builder, fetchDoctorProfile, 'profile', (s, data) => { s.data = data; });

    // Mutations don't flip the page-level loading flag (the button shows its own busy state).
    builder
      .addCase(fetchReferralDoctors.fulfilled, (state, { payload }) => { state.referralDoctors = payload; })
      .addCase(editPendingLeave.fulfilled, (state, { payload }) => {
        if (state.leaves.list.some((row) => row.id === payload.id)) upsert(state.leaves.list, payload);
      })
      .addCase(updateAppointmentStatus.fulfilled, (state, { payload }) => {
        const apt = state.appointments.list.find((a) => a.id === payload.id);
        if (apt) apt.status = payload.status;
      })
      .addCase(updateConsultationFee.fulfilled, (state, { payload }) => {
        if (state.earnings.data) state.earnings.data.consultationFee = payload;
      })
      .addCase(requestLeave.fulfilled, (state, { payload }) => {
        if (payload?.id) state.leaves.list.unshift(payload);
      })
      .addCase(deleteLeave.fulfilled, (state, { payload }) => {
        state.leaves.list = state.leaves.list.filter((l) => l.id !== payload);
      });
  },
});

export const { setStatusFilter, setSearch } = doctorSlice.actions;

/* ---------- selectors ---------- */

export const selectDoctorAppointmentsState = (s) => s.doctor.appointments;
export const selectDoctorAppointments = (s) => s.doctor.appointments.list;
export const selectDoctorStats = (s) => s.doctor.stats.data;
export const selectReferralDoctors = (s) => s.doctor.referralDoctors;
export const selectDoctorFilters = (s) => s.doctor.appointments.filters;
export const selectDoctorEarnings = (s) => s.doctor.earnings;
export const selectDoctorLeaves = (s) => s.doctor.leaves;
export const selectDoctorProfile = (s) => s.doctor.profile;

export const selectFilteredDoctorAppointments = createSelector(
  [selectDoctorAppointments, selectDoctorFilters],
  (list, { status, search }) => {
    const term = search.trim().toLowerCase();
    return list.filter((a) => {
      if (status && String(a.status).toLowerCase() !== status.toLowerCase()) return false;
      if (!term) return true;
      return `${a.patientName} ${a.reason} ${a.department}`.toLowerCase().includes(term);
    });
  },
);

export default doctorSlice.reducer;
