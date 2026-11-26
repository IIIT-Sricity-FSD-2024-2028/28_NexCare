import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { Appointments } from '../api';
import { thunk, asList, requestState, track, upsert } from './repositoryState';
import { appointmentTime } from '../utils/format';

export const fetchDoctorAppointments = thunk(
  'appointments/doctor/fetchAppointments',
  async () => asList(await Appointments.mine()).sort((a, b) => appointmentTime(b) - appointmentTime(a)),
  'Could not load your appointments. Check that the backend is running.',
);

export const fetchDoctorStats = thunk(
  'appointments/doctor/fetchStats',
  async () => (await Appointments.myStats())?.data || {},
  'Could not load your schedule. Check that the backend is running.',
);

export const createReferral = createAsyncThunk('appointments/doctor/createReferral', async (data) => (await Appointments.create(data)).data);

export const updateAppointmentStatus = thunk(
  'appointments/doctor/updateAppointmentStatus',
  async ({ id, verb }) => {
    const result = verb === 'confirm' || verb === 'complete'
      ? await Appointments[verb](id)
      : await Appointments.updateStatus(id, verb);
    return result.data;
  },
  'Could not update the appointment',
);

export const fetchStaffAppointments = thunk(
  'appointments/staff/fetchAppointments',
  async (_, hospitalId) => asList(await Appointments.getAll({ hospitalId })),
  'Failed to load appointments. Please check your connection and try again.',
);

export const createStaffAppointment = thunk('appointments/staff/createAppointment', async (data, hospitalId) => (await Appointments.create({ ...data, hospitalId: hospitalId || undefined })).data, 'Could not create appointment');

export const editStaffAppointment = thunk('appointments/staff/editAppointment', async ({ id, data }) => (await Appointments.update(id, data)).data, 'Could not update appointment');

export const deleteStaffAppointment = thunk('appointments/staff/deleteAppointment', async (id) => { await Appointments.delete(id); return id; }, 'Could not delete appointment');


const slice = createSlice({
  name: 'appointments',
  initialState: {
    doctor: requestState({ list: [], stats: null, filters: { status: '', search: '' } }),
    staff: requestState({ list: [] }),
  },
  reducers: {
    setStatusFilter(state, { payload }) { state.doctor.filters.status = payload; },
    setSearch(state, { payload }) { state.doctor.filters.search = payload; },
  },
  extraReducers: (builder) => {
    track(builder, fetchDoctorAppointments, (s) => s.doctor, (s, list) => { s.list = list; });
    track(builder, fetchDoctorStats, (s) => s.doctor, (s, stats) => { s.stats = stats; });
    track(builder, fetchStaffAppointments, (s) => s.staff, (s, list) => { s.list = list; });
    builder
      .addCase(createStaffAppointment.fulfilled, (s, a) => upsert(s.staff.list, a.payload))
      .addCase(editStaffAppointment.fulfilled, (s, a) => upsert(s.staff.list, a.payload))
      .addCase(deleteStaffAppointment.fulfilled, (s, a) => { s.staff.list = s.staff.list.filter((row) => row.id !== a.payload); })
      .addCase(updateAppointmentStatus.fulfilled, (state, { payload }) => {
        upsert(state.doctor.list, payload);
      });
  },
});

export const { setStatusFilter, setSearch } = slice.actions;
export const selectStaffAppointments = (s) => s.appointments.staff;
export const selectDoctorAppointmentsState = (s) => s.appointments.doctor;
export const selectDoctorAppointments = (s) => s.appointments.doctor.list;
export const selectDoctorStats = (s) => s.appointments.doctor.stats;
export const selectDoctorFilters = (s) => s.appointments.doctor.filters;

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
