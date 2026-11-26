import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { Appointments, Auth, Leaves, Revenue, Users } from '../api';
import { appointmentTime } from '../utils/format';
import { updateSessionUser } from './authSlice';
import { asList, requestState, thunk, track, upsert } from './repositoryState';

export const fetchDoctorAppointments = thunk(
  'doctor/fetchDoctorAppointments',
  async () => asList(await Appointments.mine()).sort((a, b) => appointmentTime(b) - appointmentTime(a)),
  'Could not load your appointments. Check that the backend is running.',
);

export const fetchDoctorStats = thunk(
  'doctor/fetchDoctorStats',
  async () => (await Appointments.myStats())?.data || {},
  'Could not load your schedule. Check that the backend is running.',
);

export const createReferral = createAsyncThunk('doctor/createReferral', async (data) => (await Appointments.create(data)).data);

export const updateAppointmentStatus = thunk(
  'doctor/updateAppointmentStatus',
  async ({ id, verb }) => {
    const result = verb === 'confirm' || verb === 'complete'
      ? await Appointments[verb](id)
      : await Appointments.updateStatus(id, verb);
    return result.data;
  },
  'Could not update the appointment',
);

export const fetchDoctorLeaves = thunk(
  'doctor/fetchDoctorLeaves',
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

export const editPendingLeave = thunk('doctor/editPendingLeave', async ({ id, data }) =>
  (await Leaves.editPending(id, data)).data, 'Could not update the leave request');

export const fetchDoctorEarnings = thunk(
  'doctor/fetchDoctorEarnings',
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

export const fetchDoctorProfile = thunk(
  'doctor/fetchDoctorProfile',
  async (userId) => (await Auth.getCurrentUser(userId))?.data || null,
  'Could not load your profile',
);

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

const slice = createSlice({
  name: 'doctor',
  initialState: {
    appointments: requestState({ list: [], filters: { status: '', search: '' } }),
    stats: requestState({ data: null }),
    leaves: requestState({ list: [] }),
    earnings: requestState({ data: null }),
    profile: requestState({ data: null }),
    referralDoctors: [],
  },
  reducers: {
    setStatusFilter(state, { payload }) { state.appointments.filters.status = payload; },
    setSearch(state, { payload }) { state.appointments.filters.search = payload; },
  },
  extraReducers: (builder) => {
    track(builder, fetchDoctorAppointments, (s) => s.appointments, (s, list) => { s.list = list; });
    track(builder, fetchDoctorStats, (s) => s.stats, (s, stats) => { s.data = stats; });
    builder.addCase(updateAppointmentStatus.fulfilled, (state, { payload }) => {
      upsert(state.appointments.list, payload);
    });

    track(builder, fetchDoctorLeaves, (s) => s.leaves, (s, list) => { s.list = list; });
    builder
      .addCase(requestLeave.fulfilled, (s, a) => upsert(s.leaves.list, a.payload))
      .addCase(deleteLeave.fulfilled, (s, a) => { s.leaves.list = s.leaves.list.filter((row) => row.id !== a.payload); });
    builder.addCase(editPendingLeave.fulfilled, (state, { payload }) => {
      if (state.leaves.list.some((row) => row.id === payload.id)) upsert(state.leaves.list, payload);
    });

    track(builder, fetchDoctorEarnings, (s) => s.earnings, (s, data) => { s.data = data; });
    builder.addCase(updateConsultationFee.fulfilled, (state, { payload }) => {
      if (state.earnings.data) state.earnings.data.consultationFee = payload;
    });

    track(builder, fetchDoctorProfile, (s) => s.profile, (s, data) => { s.data = data; });
    builder.addCase(fetchReferralDoctors.fulfilled, (state, { payload }) => { state.referralDoctors = payload; });
  },
});

export const { setStatusFilter, setSearch } = slice.actions;
export const selectDoctorAppointmentsState = (s) => s.doctor.appointments;
export const selectDoctorAppointments = (s) => s.doctor.appointments.list;
export const selectDoctorStats = (s) => s.doctor.stats.data;
export const selectDoctorFilters = (s) => s.doctor.appointments.filters;
export const selectDoctorLeaves = (s) => s.doctor.leaves;
export const selectDoctorEarnings = (s) => s.doctor.earnings;
export const selectDoctorProfile = (s) => s.doctor.profile;
export const selectReferralDoctors = (s) => s.doctor.referralDoctors;

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

export default slice.reducer;
