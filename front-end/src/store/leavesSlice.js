import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Leaves } from '../api';
import { thunk, asList, msg, requestState, track, upsert } from './repositoryState';

export const fetchDoctorLeaves = thunk(
  'leaves/doctor/fetchLeaves',
  async (doctorId) =>
    asList(await Leaves.list({ doctorId })).sort((a, b) => String(b.startDate).localeCompare(String(a.startDate))),
  'Could not load your leave requests. Check that the backend is running.',
);

export const requestLeave = thunk(
  'leaves/doctor/requestLeave',
  async (data) => (await Leaves.create(data))?.data || data,
  'Could not submit the request',
);

export const deleteLeave = thunk(
  'leaves/doctor/deleteLeave',
  async (id) => {
    await Leaves.remove(id);
    return id;
  },
  'Could not withdraw the request',
);

export const fetchLeaveRequests = thunk(
  'leaves/staff/fetchLeaveRequests',
  async (_, hospitalId) => asList(await Leaves.getAll(hospitalId ? { hospitalId } : {})),
  'Failed to load leave requests. Please check your connection and try again.',
);

export const createLeaveRequest = createAsyncThunk(
  'leaves/staff/createLeaveRequest',
  async (data, { rejectWithValue }) => {
    try {
      return (await Leaves.create(data))?.data || null;
    } catch (err) {
      return rejectWithValue({ message: msg(err, 'Failed to record leave request'), status: err?.status ?? null });
    }
  },
);

export const deleteStaffLeave = thunk('leaves/staff/deleteLeave', async (id) => { await Leaves.remove(id); return id; }, 'Could not withdraw request');


export const editPendingLeave = thunk('leaves/editPending', async ({ id, data }) =>
  (await Leaves.editPending(id, data)).data, 'Could not update the leave request');

const slice = createSlice({
  name: 'leaves',
  initialState: { doctor: requestState({ list: [] }), staff: requestState({ list: [] }) },
  reducers: {},
  extraReducers: (builder) => {
    track(builder, fetchDoctorLeaves, (s) => s.doctor, (s, list) => { s.list = list; });
    track(builder, fetchLeaveRequests, (s) => s.staff, (s, list) => { s.list = list; });
    builder
      .addCase(editPendingLeave.fulfilled, (state, { payload }) => {
        for (const view of [state.doctor, state.staff]) {
          if (view.list.some((row) => row.id === payload.id)) upsert(view.list, payload);
        }
      })
      .addCase(requestLeave.fulfilled, (s, a) => upsert(s.doctor.list, a.payload))
      .addCase(deleteLeave.fulfilled, (s, a) => { s.doctor.list = s.doctor.list.filter((row) => row.id !== a.payload); })
      .addCase(createLeaveRequest.fulfilled, (s, a) => upsert(s.staff.list, a.payload))
      .addCase(deleteStaffLeave.fulfilled, (s, a) => { s.staff.list = s.staff.list.filter((row) => row.id !== a.payload); });
  },
});

export const selectDoctorLeaves = (s) => s.leaves.doctor;
export const selectLeaveRequests = (s) => s.leaves.staff;

export default slice.reducer;
