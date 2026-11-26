import { createSlice } from '@reduxjs/toolkit';
import { Inventory } from '../api';
import { thunk, asList, requestState, track, upsert } from './repositoryState';

export const fetchInventory = thunk(
  'inventory/staff/fetchInventory',
  async (_, hospitalId) => asList(await Inventory.getAll({ hospitalId })),
  'Failed to load inventory. Please check your connection and try again.',
);

export const consumeInventoryItem = thunk(
  'inventory/staff/consumeInventoryItem',
  async ({ id, usage }) => (await Inventory.use(id, usage))?.data || null,
  'Could not record usage',
);

export const restockItem = thunk(
  'inventory/staff/restockItem',
  async ({ id, data }) => (await Inventory.restock(id, data))?.data || null,
  'Could not restock the item',
);

export const fetchRequisitions = thunk(
  'inventory/staff/fetchRequisitions',
  async (_, hospitalId) => asList(await Inventory.getRequirements({ hospitalId })),
  'Failed to load requisitions.',
);

export const createRequisition = thunk(
  'inventory/staff/createRequisition',
  async (data) => (await Inventory.createRequirement(data))?.data || null,
  'Could not create the requisition',
);

export const createInventoryItem = thunk('inventory/staff/createInventoryItem', async (data) => (await Inventory.create(data)).data, 'Could not add item');

export const deleteInventoryItem = thunk('inventory/staff/deleteInventoryItem', async (id) => { await Inventory.delete(id); return id; }, 'Could not delete item');

export const startPurchase = thunk('inventory/staff/startPurchase', async ({ id, data }) => (await Inventory.startPurchase(id, data)).data, 'Could not start purchase');

export const markPurchased = thunk('inventory/staff/markPurchased', async (id) => (await Inventory.markPurchased(id)).data, 'Could not mark purchased');

export const markRestocked = thunk('inventory/staff/markRestocked', async (id) => (await Inventory.markRestocked(id)).data, 'Could not mark restocked');

export const fetchInventoryAudit = thunk('inventory/staff/fetchInventoryAudit', async (id) => asList(await Inventory.getAudit(id)), 'Could not load audit history');


const slice = createSlice({
  name: 'inventory',
  initialState: requestState({ items: [], audits: {}, requisitions: null, requisitionsError: null }),
  reducers: {},
  extraReducers: (builder) => {
    track(builder, fetchInventory, (s) => s, (s, items) => { s.items = items; });
    builder
      .addCase(createInventoryItem.fulfilled, (s, a) => upsert(s.items, a.payload))
      .addCase(consumeInventoryItem.fulfilled, (s, a) => upsert(s.items, a.payload))
      .addCase(restockItem.fulfilled, (s, a) => upsert(s.items, a.payload))
      .addCase(deleteInventoryItem.fulfilled, (s, a) => { s.items = s.items.filter((row) => row.id !== a.payload); })
      .addCase(fetchInventoryAudit.pending, (s, a) => { s.audits[a.meta.arg] = { list: null }; })
      .addCase(fetchInventoryAudit.fulfilled, (s, a) => { s.audits[a.meta.arg] = { list: a.payload }; })
      .addCase(fetchInventoryAudit.rejected, (s, a) => { s.audits[a.meta.arg] = { list: [], error: a.payload }; })
      .addCase(fetchRequisitions.pending, (s) => { s.requisitionsError = null; })
      .addCase(fetchRequisitions.rejected, (s, { payload }) => {
        s.requisitions ??= [];
        s.requisitionsError = payload;
      })
      .addCase(fetchRequisitions.fulfilled, (s, { payload }) => { s.requisitions = payload; });
    for (const action of [createRequisition, startPurchase, markPurchased, markRestocked]) {
      builder.addCase(action.fulfilled, (s, { payload }) => upsert(s.requisitions ??= [], payload));
    }
  },
});

export const selectInventory = (s) => s.inventory;

export default slice.reducer;
