import { createSlice } from '@reduxjs/toolkit';
import { Revenue } from '../api';
import { thunk, requestState, track } from './repositoryState';

export const fetchDoctorEarnings = thunk(
  'revenue/doctor/fetchEarnings',
  async () => (await Revenue.myEarnings())?.data || null,
  'Could not load your earnings. Check that the backend is running.',
);

export const updateConsultationFee = thunk(
  'revenue/doctor/updateConsultationFee',
  async (fee) => {
    await Revenue.updateMyConsultationFee(fee);
    return fee;
  },
  'Could not save your fee',
);


const slice = createSlice({
  name: 'revenue',
  initialState: requestState({ data: null }),
  reducers: {},
  extraReducers: (builder) => {
    track(builder, fetchDoctorEarnings, (s) => s, (s, data) => { s.data = data; });
    builder.addCase(updateConsultationFee.fulfilled, (state, { payload }) => {
      if (state.data) state.data.consultationFee = payload;
    });
  },
});

export const selectDoctorEarnings = (s) => s.revenue;

export default slice.reducer;
