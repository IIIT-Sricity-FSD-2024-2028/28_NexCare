import { createSlice } from '@reduxjs/toolkit';
import { Feedback } from '../api';
import { thunk, asList, requestState, track, upsert } from './repositoryState';

export const fetchStaffFeedback = thunk(
  'feedback/staff/fetchFeedback',
  async (_, hospitalId) => asList(await Feedback.getAll({ hospitalId })),
  'Failed to load feedback. Please check your connection and try again.',
);


export const createStaffFeedback = thunk('feedback/create', async (data, hospitalId) =>
  (await Feedback.create({ ...data, hospitalId })).data, 'Could not record feedback');
export const editStaffFeedback = thunk('feedback/edit', async ({ id, data }) =>
  (await Feedback.update(id, data)).data, 'Could not update feedback');
export const deleteStaffFeedback = thunk('feedback/delete', async (id) => {
  await Feedback.delete(id);
  return id;
}, 'Could not delete feedback');

const slice = createSlice({
  name: 'feedback',
  initialState: requestState({ list: [] }),
  reducers: {},
  extraReducers: (builder) => {
    track(builder, fetchStaffFeedback, (s) => s, (s, list) => { s.list = list; });
    builder
      .addCase(createStaffFeedback.fulfilled, (s, { payload }) => upsert(s.list, payload))
      .addCase(editStaffFeedback.fulfilled, (s, { payload }) => upsert(s.list, payload))
      .addCase(deleteStaffFeedback.fulfilled, (s, { payload }) => {
        s.list = s.list.filter((row) => row.id !== payload);
      });
  },
});

export const selectStaffFeedback = (s) => s.feedback;

export default slice.reducer;
