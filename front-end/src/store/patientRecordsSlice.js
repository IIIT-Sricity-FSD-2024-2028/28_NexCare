import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Patients } from '../api';

export const fetchPatientRecord = createAsyncThunk('patientRecords/read', async (patientId) =>
  (await Patients.byId(patientId)).data);

export default createSlice({
  name: 'patientRecords',
  initialState: {},
  reducers: {},
  extraReducers: (builder) => builder
    .addCase(fetchPatientRecord.pending, (state, { meta }) => {
      state[meta.arg] = { status: 'loading', requestId: meta.requestId };
    })
    .addCase(fetchPatientRecord.fulfilled, (state, { meta, payload }) => {
      if (state[meta.arg]?.requestId !== meta.requestId) return;
      state[meta.arg] = { status: payload ? 'ok' : 'error', data: payload };
    })
    .addCase(fetchPatientRecord.rejected, (state, { meta }) => {
      if (state[meta.arg]?.requestId === meta.requestId) state[meta.arg] = { status: 'error' };
    }),
}).reducer;
