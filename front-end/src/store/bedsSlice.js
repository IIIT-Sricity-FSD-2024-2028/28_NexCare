import { createSlice } from '@reduxjs/toolkit';
import { Beds } from '../api';
import { thunk, asList, requestState, track, upsert } from './repositoryState';

export const fetchBeds = thunk(
  'beds/staff/fetchBeds',
  async (_, hospitalId) => asList(await Beds.getAll({ hospitalId })),
  'Failed to load bed data. Please check your connection and try again.',
);

export const allocateBed = thunk(
  'beds/staff/allocateBed',
  async ({ id, allocation }) => (await Beds.allocate(id, allocation))?.data || null,
  'Could not allocate the bed',
);

export const updateBed = thunk('beds/staff/updateBed', async ({ bed, target, patient }) => {
  const { id } = bed;
  const current = (bed.status || 'available').toLowerCase();
  if (target === current) {
    if (['occupied', 'critical'].includes(target) && patient && patient !== bed.patient) {
      return (await Beds.update(id, { status: target, patient })).data;
    }
    return bed;
  }
  if (target === 'available' && ['occupied', 'critical'].includes(current)) return (await Beds.release(id)).data;
  if (['occupied', 'critical'].includes(target)) {
    if (!bed.patient) {
      const allocated = (await Beds.allocate(id, { patientId: patient })).data;
      if (target === 'occupied') return allocated;
    } else if (patient && patient !== bed.patient) {
      await Beds.update(id, { status: current, patient });
    }
  }
  return (await Beds.updateStatus(id, target)).data;
}, 'Could not update the bed');


export const createBed = thunk('beds/create', async (data) => (await Beds.create(data)).data, 'Could not create bed');
export const deleteBed = thunk('beds/delete', async (id) => { await Beds.delete(id); return id; }, 'Could not delete bed');

const slice = createSlice({
  name: 'beds',
  initialState: requestState({ list: [], ward: "Emergency" }),
  reducers: { setWard(state, { payload }) { state.ward = payload; } },
  extraReducers: (builder) => {
    track(builder, fetchBeds, (s) => s, (s, list) => {
      s.list = list;
      const wards = [...new Set(list.map((bed) => bed.ward))];
      if (wards.length && !wards.includes(s.ward)) s.ward = wards[0];
    });
    builder
      .addCase(createBed.fulfilled, (s, { payload }) => {
        upsert(s.list, payload);
        if (payload?.ward) s.ward = payload.ward;
      })
      .addCase(deleteBed.fulfilled, (s, { payload }) => {
        s.list = s.list.filter((row) => row.id !== payload);
        if (!s.list.some((bed) => bed.ward === s.ward)) s.ward = s.list[0]?.ward || 'Emergency';
      })
      .addCase(allocateBed.fulfilled, (s, a) => upsert(s.list, a.payload))
      .addCase(updateBed.fulfilled, (s, a) => upsert(s.list, a.payload));
  },
});

export const { setWard } = slice.actions;
export const selectBeds = (s) => s.beds;

export default slice.reducer;
