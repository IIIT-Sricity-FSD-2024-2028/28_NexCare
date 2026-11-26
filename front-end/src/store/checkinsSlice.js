import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Checkins } from '../api';

export const fetchCheckins = createAsyncThunk('checkins/read', async () => (await Checkins.list()).data);
export const createCheckin = createAsyncThunk('checkins/create', async (data) => (await Checkins.create(data)).data);
export const moveCheckin = createAsyncThunk('checkins/update', async ({ id, location }) => (await Checkins.update(id, location)).data);
export const deleteCheckin = createAsyncThunk('checkins/delete', async (id) => {
  await Checkins.delete(id);
  return id;
});

export const selectCheckins = (state) => state.checkins;

export default createSlice({
  name: 'checkins',
  initialState: { list: [], loading: true, error: '' },
  reducers: {},
  extraReducers: (builder) => builder
    .addCase(fetchCheckins.pending, (state) => { state.loading = true; state.error = ''; })
    .addCase(fetchCheckins.rejected, (state, { error }) => { state.loading = false; state.error = error.message; })
    .addCase(fetchCheckins.fulfilled, (state, { payload }) => { state.loading = false; state.list = payload; })
    .addCase(createCheckin.fulfilled, (state, { payload }) => { state.list.unshift(payload); })
    .addCase(moveCheckin.fulfilled, (state, { payload }) => {
      const index = state.list.findIndex((row) => row.id === payload.id);
      if (index >= 0) state.list[index] = payload;
    })
    .addCase(deleteCheckin.fulfilled, (state, { payload }) => {
      state.list = state.list.filter((row) => row.id !== payload);
    }),
}).reducer;
