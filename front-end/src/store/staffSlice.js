import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Ambulance, Appointments, Beds, Billing, Checkins, Feedback, Inventory, Leaves, Schedules, Uploads, Users } from '../api';
import { asList, msg, requestState, thunk, track, upsert } from './repositoryState';

export const fetchStaffAppointments = thunk(
  'staff/fetchStaffAppointments',
  async (_, hospitalId) => asList(await Appointments.getAll({ hospitalId })),
  'Failed to load appointments. Please check your connection and try again.',
);

export const createStaffAppointment = thunk('staff/createStaffAppointment', async (data, hospitalId) => (await Appointments.create({ ...data, hospitalId: hospitalId || undefined })).data, 'Could not create appointment');

export const editStaffAppointment = thunk('staff/editStaffAppointment', async ({ id, data }) => (await Appointments.update(id, data)).data, 'Could not update appointment');

export const deleteStaffAppointment = thunk('staff/deleteStaffAppointment', async (id) => { await Appointments.delete(id); return id; }, 'Could not delete appointment');

export const fetchLeaveRequests = thunk(
  'staff/fetchLeaveRequests',
  async (_, hospitalId) => asList(await Leaves.getAll(hospitalId ? { hospitalId } : {})),
  'Failed to load leave requests. Please check your connection and try again.',
);

export const createLeaveRequest = createAsyncThunk(
  'staff/createLeaveRequest',
  async (data, { rejectWithValue }) => {
    try {
      return (await Leaves.create(data))?.data || null;
    } catch (err) {
      return rejectWithValue({ message: msg(err, 'Failed to record leave request'), status: err?.status ?? null });
    }
  },
);

export const deleteStaffLeave = thunk('staff/deleteStaffLeave', async (id) => { await Leaves.remove(id); return id; }, 'Could not withdraw request');


export const editPendingLeave = thunk('staff/editPendingLeave', async ({ id, data }) =>
  (await Leaves.editPending(id, data)).data, 'Could not update the leave request');

export const fetchPatientDirectory = thunk(
  'staff/fetchPatientDirectory',
  async () => asList(await Users.getAll({ role: 'patient' })),
  'Failed to load patients. Please check your connection and try again.',
);

export const fetchStaffUsers = createAsyncThunk('staff/fetchStaffUsers', async () => (await Users.getAll()).data || []);

export const fetchBeds = thunk(
  'staff/fetchBeds',
  async (_, hospitalId) => asList(await Beds.getAll({ hospitalId })),
  'Failed to load bed data. Please check your connection and try again.',
);

export const allocateBed = thunk(
  'staff/allocateBed',
  async ({ id, allocation }) => (await Beds.allocate(id, allocation))?.data || null,
  'Could not allocate the bed',
);

export const updateBed = thunk('staff/updateBed', async ({ bed, target, patient }) => {
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


export const createBed = thunk('staff/createBed', async (data) => (await Beds.create(data)).data, 'Could not create bed');
export const deleteBed = thunk('staff/deleteBed', async (id) => { await Beds.delete(id); return id; }, 'Could not delete bed');

export const fetchInventory = thunk(
  'staff/fetchInventory',
  async (_, hospitalId) => asList(await Inventory.getAll({ hospitalId })),
  'Failed to load inventory. Please check your connection and try again.',
);

export const consumeInventoryItem = thunk(
  'staff/consumeInventoryItem',
  async ({ id, usage }) => (await Inventory.use(id, usage))?.data || null,
  'Could not record usage',
);

export const restockItem = thunk(
  'staff/restockItem',
  async ({ id, data }) => (await Inventory.restock(id, data))?.data || null,
  'Could not restock the item',
);

export const fetchRequisitions = thunk(
  'staff/fetchRequisitions',
  async (_, hospitalId) => asList(await Inventory.getRequirements({ hospitalId })),
  'Failed to load requisitions.',
);

export const createRequisition = thunk(
  'staff/createRequisition',
  async (data) => (await Inventory.createRequirement(data))?.data || null,
  'Could not create the requisition',
);

export const createInventoryItem = thunk('staff/createInventoryItem', async (data) => (await Inventory.create(data)).data, 'Could not add item');

export const deleteInventoryItem = thunk('staff/deleteInventoryItem', async (id) => { await Inventory.delete(id); return id; }, 'Could not delete item');

export const startPurchase = thunk('staff/startPurchase', async ({ id, data }) => (await Inventory.startPurchase(id, data)).data, 'Could not start purchase');

export const markPurchased = thunk('staff/markPurchased', async (id) => (await Inventory.markPurchased(id)).data, 'Could not mark purchased');

export const markRestocked = thunk('staff/markRestocked', async (id) => (await Inventory.markRestocked(id)).data, 'Could not mark restocked');

export const fetchInventoryAudit = thunk('staff/fetchInventoryAudit', async (id) => asList(await Inventory.getAudit(id)), 'Could not load audit history');

export const fetchSchedules = thunk(
  'staff/fetchSchedules',
  async (_, hospitalId) => asList(await Schedules.getAll({ hospitalId })),
  'Error fetching scheduling and leaves data.',
);

export const createSchedule = thunk(
  'staff/createSchedule',
  async (data) => (await Schedules.create(data))?.data || null,
  'Could not create the schedule',
);

export const deleteSchedule = thunk('staff/deleteSchedule', async (id) => { await Schedules.delete(id); return id; }, 'Could not delete schedule');


export const editPendingSchedule = thunk('staff/editPendingSchedule', async ({ id, data }) =>
  (await Schedules.editPending(id, data)).data, 'Could not update schedule');

export const fetchStaffFeedback = thunk(
  'staff/fetchStaffFeedback',
  async (_, hospitalId) => asList(await Feedback.getAll({ hospitalId })),
  'Failed to load feedback. Please check your connection and try again.',
);


export const createStaffFeedback = thunk('staff/createStaffFeedback', async (data, hospitalId) =>
  (await Feedback.create({ ...data, hospitalId })).data, 'Could not record feedback');
export const editStaffFeedback = thunk('staff/editStaffFeedback', async ({ id, data }) =>
  (await Feedback.update(id, data)).data, 'Could not update feedback');
export const deleteStaffFeedback = thunk('staff/deleteStaffFeedback', async (id) => {
  await Feedback.delete(id);
  return id;
}, 'Could not delete feedback');

export const fetchBills = thunk(
  'staff/fetchBills',
  async (_, hospitalId) => asList(await Billing.getAll({ hospitalId })),
  'Failed to load bills. Please check your connection and try again.',
);

export const generateBill = thunk(
  'staff/generateBill',
  async (data) => (await Billing.create(data))?.data || null,
  'Could not generate the bill',
);


export const editBill = thunk('staff/editBill', async ({ id, data }) => (await Billing.update(id, data)).data, 'Could not update bill');
export const deleteBill = thunk('staff/deleteBill', async (id) => { await Billing.delete(id); return id; }, 'Could not delete bill');

export const fetchCheckins = createAsyncThunk('staff/fetchCheckins', async () => (await Checkins.list()).data);
export const createCheckin = createAsyncThunk('staff/createCheckin', async (data) => (await Checkins.create(data)).data);
export const moveCheckin = createAsyncThunk('staff/moveCheckin', async ({ id, location }) => (await Checkins.update(id, location)).data);
export const deleteCheckin = createAsyncThunk('staff/deleteCheckin', async (id) => {
  await Checkins.delete(id);
  return id;
});

export const fetchPatientDocuments = createAsyncThunk('staff/fetchPatientDocuments', async (id) =>
  (await Uploads.getAll('patient', id)).data || []);
export const uploadPatientDocument = createAsyncThunk('staff/uploadPatientDocument', async ({ file, patientId, description }) =>
  (await Uploads.upload({ file, entityType: 'patient', entityId: patientId, description })).data);
export const editPatientDocument = createAsyncThunk('staff/editPatientDocument', async ({ id, description }) =>
  (await Uploads.editDescription(id, description)).data);
export const deletePatientDocument = createAsyncThunk('staff/deletePatientDocument', async ({ id }) => {
  await Uploads.delete(id);
  return id;
});

// Binary downloads go straight to the browser; Redux holds the document metadata.
export const downloadPatientDocument = (id) => () => Uploads.download(id);

export const fetchStaffAmbulanceRequests = thunk(
  'staff/fetchStaffAmbulanceRequests',
  async () => asList(await Ambulance.getAll()),
  'Failed to load ambulance requests.',
);

const slice = createSlice({
  name: 'staff',
  initialState: {
    appointments: requestState({ list: [] }),
    leaves: requestState({ list: [] }),
    patients: requestState({ list: [] }),
    users: { status: 'idle', list: [] },
    beds: requestState({ list: [], ward: 'Emergency' }),
    inventory: requestState({ items: [], audits: {}, requisitions: null, requisitionsError: null }),
    schedules: requestState({ list: [], loaded: false }),
    feedback: requestState({ list: [] }),
    billing: requestState({ bills: [] }),
    checkins: { list: [], loading: true, error: '' },
    documents: {},
    ambulanceRequests: requestState({ list: [] }),
  },
  reducers: {
    setWard(state, { payload }) { state.beds.ward = payload; },
  },
  extraReducers: (builder) => {
    track(builder, fetchStaffAppointments, (s) => s.appointments, (s, list) => { s.list = list; });
    builder
      .addCase(createStaffAppointment.fulfilled, (s, a) => upsert(s.appointments.list, a.payload))
      .addCase(editStaffAppointment.fulfilled, (s, a) => upsert(s.appointments.list, a.payload))
      .addCase(deleteStaffAppointment.fulfilled, (s, a) => { s.appointments.list = s.appointments.list.filter((row) => row.id !== a.payload); });

    track(builder, fetchLeaveRequests, (s) => s.leaves, (s, list) => { s.list = list; });
    builder
      .addCase(createLeaveRequest.fulfilled, (s, a) => upsert(s.leaves.list, a.payload))
      .addCase(deleteStaffLeave.fulfilled, (s, a) => { s.leaves.list = s.leaves.list.filter((row) => row.id !== a.payload); });
    builder.addCase(editPendingLeave.fulfilled, (state, { payload }) => {
      if (state.leaves.list.some((row) => row.id === payload.id)) upsert(state.leaves.list, payload);
    });

    track(builder, fetchPatientDirectory, (s) => s.patients, (s, list) => { s.list = list; });
    builder
      .addCase(fetchStaffUsers.pending, (state) => { state.users.status = 'loading'; })
      .addCase(fetchStaffUsers.rejected, (state) => { state.users.status = 'error'; })
      .addCase(fetchStaffUsers.fulfilled, (state, { payload }) => { state.users = { status: 'ready', list: payload }; });

    track(builder, fetchBeds, (s) => s.beds, (s, list) => {
      s.list = list;
      const wards = [...new Set(list.map((bed) => bed.ward))];
      if (wards.length && !wards.includes(s.ward)) s.ward = wards[0];
    });
    builder
      .addCase(createBed.fulfilled, (s, { payload }) => {
        upsert(s.beds.list, payload);
        if (payload?.ward) s.beds.ward = payload.ward;
      })
      .addCase(deleteBed.fulfilled, (s, { payload }) => {
        s.beds.list = s.beds.list.filter((row) => row.id !== payload);
        if (!s.beds.list.some((bed) => bed.ward === s.beds.ward)) s.beds.ward = s.beds.list[0]?.ward || 'Emergency';
      })
      .addCase(allocateBed.fulfilled, (s, a) => upsert(s.beds.list, a.payload))
      .addCase(updateBed.fulfilled, (s, a) => upsert(s.beds.list, a.payload));

    track(builder, fetchInventory, (s) => s.inventory, (s, items) => { s.items = items; });
    builder
      .addCase(createInventoryItem.fulfilled, (s, a) => upsert(s.inventory.items, a.payload))
      .addCase(consumeInventoryItem.fulfilled, (s, a) => upsert(s.inventory.items, a.payload))
      .addCase(restockItem.fulfilled, (s, a) => upsert(s.inventory.items, a.payload))
      .addCase(deleteInventoryItem.fulfilled, (s, a) => { s.inventory.items = s.inventory.items.filter((row) => row.id !== a.payload); })
      .addCase(fetchInventoryAudit.pending, (s, a) => { s.inventory.audits[a.meta.arg] = { list: null }; })
      .addCase(fetchInventoryAudit.fulfilled, (s, a) => { s.inventory.audits[a.meta.arg] = { list: a.payload }; })
      .addCase(fetchInventoryAudit.rejected, (s, a) => { s.inventory.audits[a.meta.arg] = { list: [], error: a.payload }; })
      .addCase(fetchRequisitions.pending, (s) => { s.inventory.requisitionsError = null; })
      .addCase(fetchRequisitions.rejected, (s, { payload }) => {
        s.inventory.requisitions ??= [];
        s.inventory.requisitionsError = payload;
      })
      .addCase(fetchRequisitions.fulfilled, (s, { payload }) => { s.inventory.requisitions = payload; });
    for (const action of [createRequisition, startPurchase, markPurchased, markRestocked]) {
      builder.addCase(action.fulfilled, (s, { payload }) => upsert(s.inventory.requisitions ??= [], payload));
    }

    track(builder, fetchSchedules, (s) => s.schedules, (s, list) => { Object.assign(s, { list, loaded: true }); });
    builder
      .addCase(createSchedule.fulfilled, (s, a) => upsert(s.schedules.list, a.payload))
      .addCase(editPendingSchedule.fulfilled, (s, a) => upsert(s.schedules.list, a.payload))
      .addCase(deleteSchedule.fulfilled, (s, a) => { s.schedules.list = s.schedules.list.filter((row) => row.id !== a.payload); });

    track(builder, fetchStaffFeedback, (s) => s.feedback, (s, list) => { s.list = list; });
    builder
      .addCase(createStaffFeedback.fulfilled, (s, { payload }) => upsert(s.feedback.list, payload))
      .addCase(editStaffFeedback.fulfilled, (s, { payload }) => upsert(s.feedback.list, payload))
      .addCase(deleteStaffFeedback.fulfilled, (s, { payload }) => {
        s.feedback.list = s.feedback.list.filter((row) => row.id !== payload);
      });

    track(builder, fetchBills, (s) => s.billing, (s, bills) => { s.bills = bills; });
    builder
      .addCase(generateBill.fulfilled, (s, a) => upsert(s.billing.bills, a.payload))
      .addCase(editBill.fulfilled, (s, a) => upsert(s.billing.bills, a.payload))
      .addCase(deleteBill.fulfilled, (s, a) => { s.billing.bills = s.billing.bills.filter((row) => row.id !== a.payload); });

    builder
      .addCase(fetchCheckins.pending, (state) => { state.checkins.loading = true; state.checkins.error = ''; })
      .addCase(fetchCheckins.rejected, (state, { error }) => { state.checkins.loading = false; state.checkins.error = error.message; })
      .addCase(fetchCheckins.fulfilled, (state, { payload }) => { state.checkins.loading = false; state.checkins.list = payload; })
      .addCase(createCheckin.fulfilled, (state, { payload }) => { state.checkins.list.unshift(payload); })
      .addCase(moveCheckin.fulfilled, (state, { payload }) => {
        const index = state.checkins.list.findIndex((row) => row.id === payload.id);
        if (index >= 0) state.checkins.list[index] = payload;
      })
      .addCase(deleteCheckin.fulfilled, (state, { payload }) => {
        state.checkins.list = state.checkins.list.filter((row) => row.id !== payload);
      });

    builder
      .addCase(fetchPatientDocuments.pending, (state, { meta }) => { state.documents[meta.arg] = { list: null, error: '' }; })
      .addCase(fetchPatientDocuments.fulfilled, (state, { payload, meta }) => { state.documents[meta.arg] = { list: payload, error: '' }; })
      .addCase(fetchPatientDocuments.rejected, (state, { error, meta }) => { state.documents[meta.arg] = { list: [], error: error.message }; })
      .addCase(uploadPatientDocument.fulfilled, (state, { payload, meta }) => {
        const list = state.documents[meta.arg.patientId]?.list;
        if (list) upsert(list, payload);
      })
      .addCase(editPatientDocument.fulfilled, (state, { payload, meta }) => {
        const list = state.documents[meta.arg.patientId]?.list;
        if (list) upsert(list, payload);
      })
      .addCase(deletePatientDocument.fulfilled, (state, { payload, meta }) => {
        const documents = state.documents[meta.arg.patientId];
        if (documents?.list) documents.list = documents.list.filter((doc) => doc.id !== payload);
      });

    track(builder, fetchStaffAmbulanceRequests, (s) => s.ambulanceRequests, (s, list) => { s.list = list; });
  },
});

export const { setWard } = slice.actions;
export const selectStaffAppointments = (s) => s.staff.appointments;
export const selectLeaveRequests = (s) => s.staff.leaves;
export const selectStaffPatients = (s) => s.staff.patients;
export const selectStaffUsers = (s) => s.staff.users;
export const selectBeds = (s) => s.staff.beds;
export const selectInventory = (s) => s.staff.inventory;
export const selectSchedules = (s) => s.staff.schedules;
export const selectStaffFeedback = (s) => s.staff.feedback;
export const selectStaffBilling = (s) => s.staff.billing;
export const selectCheckins = (s) => s.staff.checkins;
export const selectPatientDocuments = (s, patientId) => s.staff.documents[patientId];
export const selectStaffAmbulanceRequests = (s) => s.staff.ambulanceRequests;

export default slice.reducer;
