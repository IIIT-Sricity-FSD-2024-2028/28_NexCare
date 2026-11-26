import { createSlice } from '@reduxjs/toolkit';
import { Schedules } from '../api';
import { thunk, asList, requestState, track, upsert } from './repositoryState';

export const fetchSchedules = thunk(
  'schedules/staff/fetchSchedules',
  async (_, hospitalId) => asList(await Schedules.getAll({ hospitalId })),
  'Error fetching scheduling and leaves data.',
);

export const createSchedule = thunk(
  'schedules/staff/createSchedule',
  async (data) => (await Schedules.create(data))?.data || null,
  'Could not create the schedule',
);

export const deleteSchedule = thunk('schedules/staff/deleteSchedule', async (id) => { await Schedules.delete(id); return id; }, 'Could not delete schedule');


export const editPendingSchedule = thunk('schedules/editPending', async ({ id, data }) =>
  (await Schedules.editPending(id, data)).data, 'Could not update schedule');

const slice = createSlice({
  name: 'schedules',
  initialState: requestState({ list: [], loaded: false }),
  reducers: {},
  extraReducers: (builder) => {
    track(builder, fetchSchedules, (s) => s, (s, list) => { Object.assign(s, { list, loaded: true }); });
    builder
      .addCase(createSchedule.fulfilled, (s, a) => upsert(s.list, a.payload))
      .addCase(editPendingSchedule.fulfilled, (s, a) => upsert(s.list, a.payload))
      .addCase(deleteSchedule.fulfilled, (s, a) => { s.list = s.list.filter((row) => row.id !== a.payload); });
  },
});

export const selectSchedules = (s) => s.schedules;

export default slice.reducer;
