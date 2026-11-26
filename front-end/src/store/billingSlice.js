import { createSlice } from '@reduxjs/toolkit';
import { Billing } from '../api';
import { thunk, asList, requestState, track, upsert } from './repositoryState';

export const fetchBills = thunk(
  'billing/staff/fetchBills',
  async (_, hospitalId) => asList(await Billing.getAll({ hospitalId })),
  'Failed to load bills. Please check your connection and try again.',
);

export const generateBill = thunk(
  'billing/staff/generateBill',
  async (data) => (await Billing.create(data))?.data || null,
  'Could not generate the bill',
);


export const editBill = thunk('billing/edit', async ({ id, data }) => (await Billing.update(id, data)).data, 'Could not update bill');
export const deleteBill = thunk('billing/delete', async (id) => { await Billing.delete(id); return id; }, 'Could not delete bill');

const slice = createSlice({
  name: 'billing',
  initialState: requestState({ bills: [] }),
  reducers: {},
  extraReducers: (builder) => {
    track(builder, fetchBills, (s) => s, (s, bills) => { s.bills = bills; });
    builder
      .addCase(generateBill.fulfilled, (s, a) => upsert(s.bills, a.payload))
      .addCase(editBill.fulfilled, (s, a) => upsert(s.bills, a.payload))
      .addCase(deleteBill.fulfilled, (s, a) => { s.bills = s.bills.filter((row) => row.id !== a.payload); });
  },
});

export const selectStaffBilling = (s) => s.billing;

export default slice.reducer;
