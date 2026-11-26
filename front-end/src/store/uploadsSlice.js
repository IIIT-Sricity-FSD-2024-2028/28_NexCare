import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Uploads } from '../api';
import { upsert } from './repositoryState';

export const fetchPatientDocuments = createAsyncThunk('uploads/fetchPatient', async (id) =>
  (await Uploads.getAll('patient', id)).data || []);
export const uploadPatientDocument = createAsyncThunk('uploads/createPatient', async ({ file, patientId, description }) =>
  (await Uploads.upload({ file, entityType: 'patient', entityId: patientId, description })).data);
export const editPatientDocument = createAsyncThunk('uploads/updatePatient', async ({ id, description }) =>
  (await Uploads.editDescription(id, description)).data);
export const deletePatientDocument = createAsyncThunk('uploads/deletePatient', async ({ id }) => {
  await Uploads.delete(id);
  return id;
});

// Binary downloads go straight to the browser; Redux holds the document metadata.
export const downloadPatientDocument = (id) => () => Uploads.download(id);

export default createSlice({
  name: 'uploads',
  initialState: {},
  reducers: {},
  extraReducers: (builder) => builder
    .addCase(fetchPatientDocuments.pending, (state, { meta }) => { state[meta.arg] = { list: null, error: '' }; })
    .addCase(fetchPatientDocuments.fulfilled, (state, { payload, meta }) => { state[meta.arg] = { list: payload, error: '' }; })
    .addCase(fetchPatientDocuments.rejected, (state, { error, meta }) => { state[meta.arg] = { list: [], error: error.message }; })
    .addCase(uploadPatientDocument.fulfilled, (state, { payload, meta }) => {
      const list = state[meta.arg.patientId]?.list;
      if (list) upsert(list, payload);
    })
    .addCase(editPatientDocument.fulfilled, (state, { payload, meta }) => {
      const list = state[meta.arg.patientId]?.list;
      if (list) upsert(list, payload);
    })
    .addCase(deletePatientDocument.fulfilled, (state, { payload, meta }) => {
      const documents = state[meta.arg.patientId];
      if (documents?.list) documents.list = documents.list.filter((doc) => doc.id !== payload);
    }),
}).reducer;
