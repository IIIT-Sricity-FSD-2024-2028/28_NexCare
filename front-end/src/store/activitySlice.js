import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { System } from '../api';

export const logActivity = createAsyncThunk(
  'activity/log',
  async ({ action, module, details, severity = 'INFO' }, { getState, rejectWithValue }) => {
    const user = getState().auth.user;
    try {
      const response = await System.logActivity({
        userId: String(user?.id || user?.email || 'System'),
        action,
        module,
        details,
        severity,
      });
      return response.data;
    } catch (error) {
      const message = error?.message || 'Could not record system activity.';
      console.warn('Activity log API failed:', message);
      return rejectWithValue(message);
    }
  },
);

const activitySlice = createSlice({
  name: 'activity',
  initialState: { loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(logActivity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logActivity.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(logActivity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export default activitySlice.reducer;
