import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Hospitals, Users } from '../api';
import { asList, requestState, thunk, track } from './repositoryState';
import { updateSessionUser } from './authSlice';

export const fetchPatientDirectory = thunk(
  'users/staff/fetchPatients',
  async () => asList(await Users.getAll({ role: 'patient' })),
  'Failed to load patients. Please check your connection and try again.',
);

export const fetchStaffUsers = createAsyncThunk('users/fetchStaffDirectory', async () => (await Users.getAll()).data || []);
export const fetchReferralDoctors = createAsyncThunk('users/fetchDoctors', async () => (await Users.getDoctors()).data || []);
export const fetchStaffHospital = createAsyncThunk('hospitals/fetchStaffHospital', async (id) => (await Hospitals.getById(id)).data);

const DIRECTORY_FIELDS = [
  'dept', 'department', 'specialization', 'consultationFee', 'experienceYears',
  'qualification', 'consultationTiming', 'medicalRegNumber', 'employeeId', 'hospitalName',
];

export const enrichDoctorSession = createAsyncThunk('users/enrichDoctorSession', async (_, { dispatch, getState }) => {
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

export const usersReducer = createSlice({
  name: 'users',
  initialState: { staff: { status: 'idle', list: [] }, doctors: [], patients: requestState({ list: [] }) },
  reducers: {},
  extraReducers: (builder) => {
    track(builder, fetchPatientDirectory, (s) => s.patients, (s, list) => { s.list = list; });
    builder.addCase(fetchStaffUsers.pending, (state) => { state.staff.status = 'loading'; })
    .addCase(fetchStaffUsers.rejected, (state) => { state.staff.status = 'error'; })
    .addCase(fetchStaffUsers.fulfilled, (state, { payload }) => { state.staff = { status: 'ready', list: payload }; })
    .addCase(fetchReferralDoctors.fulfilled, (state, { payload }) => { state.doctors = payload; });
  },
}).reducer;

export const hospitalsReducer = createSlice({
  name: 'hospitals',
  initialState: {},
  reducers: {},
  extraReducers: (builder) => builder.addCase(fetchStaffHospital.fulfilled, (state, { payload, meta }) => {
    state[meta.arg] = payload;
  }),
}).reducer;

export const selectStaffUsers = (state) => state.users.staff;
export const selectReferralDoctors = (state) => state.users.doctors;
export const selectStaffHospital = (state, id) => state.hospitals[id];

export const selectStaffPatients = (state) => state.users.patients;
