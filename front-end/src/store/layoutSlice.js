import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Hospitals } from '../api';

export const fetchSidebarHospital = createAsyncThunk(
  'layout/fetchSidebarHospital',
  async (hospitalId, { rejectWithValue }) => {
    try {
      const response = await Hospitals.getById(hospitalId);
      return response.data?.name || '';
    } catch (error) {
      return rejectWithValue(error?.message || 'Could not load hospital name.');
    }
  },
);

const initialState = {
  sidebarHospital: { id: null, name: '', loading: false, error: null },
};

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSidebarHospital.pending, (state, action) => {
        state.sidebarHospital = { id: action.meta.arg, name: '', loading: true, error: null };
      })
      .addCase(fetchSidebarHospital.fulfilled, (state, action) => {
        if (state.sidebarHospital.id !== action.meta.arg) return;
        state.sidebarHospital.name = action.payload;
        state.sidebarHospital.loading = false;
      })
      .addCase(fetchSidebarHospital.rejected, (state, action) => {
        if (state.sidebarHospital.id !== action.meta.arg) return;
        state.sidebarHospital.loading = false;
        state.sidebarHospital.error = action.payload || action.error.message;
      });
  },
});

export const selectSidebarHospital = (state) => state.layout.sidebarHospital;
export default layoutSlice.reducer;
