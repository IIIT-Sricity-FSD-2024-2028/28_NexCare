// Administrative staff portal state. Owner: Nikitha
//
// The slice keeps the raw API rows; each page still maps them to its own
// table shape with useMemo. Thunks read the staff member's hospital from the
// auth slice, so pages dispatch them with no argument.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Appointments, Beds, Billing, Feedback, Inventory, Leaves, Schedules, Users } from '../api';

export const CHECKIN_KEY = 'nexcare_checkins_session';

const msg = (err, fallback) => err?.message || fallback;
const asList = (res) => (Array.isArray(res?.data) ? res.data : []);
const hospitalOf = (getState) => getState().auth?.user?.hospitalId || '';

const thunk = (type, call, fallback) =>
  createAsyncThunk(type, async (arg, { getState, rejectWithValue }) => {
    try {
      return await call(arg, hospitalOf(getState));
    } catch (err) {
      return rejectWithValue(msg(err, fallback));
    }
  });

const readCheckins = () => {
  try { return JSON.parse(sessionStorage.getItem(CHECKIN_KEY) || '[]'); } catch { return []; }
};

/* ---------- thunks ---------- */

export const fetchStaffAppointments = thunk(
  'staff/fetchAppointments',
  async (_, hospitalId) => asList(await Appointments.getAll({ hospitalId })),
  'Failed to load appointments. Please check your connection and try again.',
);

export const fetchPatientDirectory = thunk(
  'staff/fetchPatients',
  async () => asList(await Users.getAll({ role: 'patient' })),
  'Failed to load patients. Please check your connection and try again.',
);

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

export const updateBedStatus = thunk(
  'staff/updateBedStatus',
  async ({ id, status }) => {
    await Beds.updateStatus(id, status);
    return { id, status };
  },
  'Could not update the bed',
);

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

// The roster needs the schedules, the hospital's doctors and their approved leaves.
export const fetchSchedules = thunk(
  'staff/fetchSchedules',
  async (_, hospitalId) => {
    const list = asList(await Schedules.getAll({ hospitalId }));
    let doctors = asList(await Users.getAll({ role: 'doctor', hospitalId }));
    if (doctors.length === 0) {
      doctors = asList(await Users.getAll()).filter((u) => (u.role || '').toLowerCase() === 'doctor');
    }
    const leaves = asList(await Leaves.getAll({ hospitalId, status: 'approved' })).filter((l) => l.status === 'approved');
    return { list, doctors, leaves };
  },
  'Error fetching scheduling and leaves data.',
);

export const createSchedule = thunk(
  'staff/createSchedule',
  async (data) => (await Schedules.create(data))?.data || null,
  'Could not create the schedule',
);

export const fetchLeaveRequests = thunk(
  'staff/fetchLeaveRequests',
  async (_, hospitalId) => asList(await Leaves.getAll(hospitalId ? { hospitalId } : {})),
  'Failed to load leave requests. Please check your connection and try again.',
);

// Rejects with { message, status } so the page can spot a 409 (overlapping approved leave).
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

export const fetchStaffFeedback = thunk(
  'staff/fetchFeedback',
  async (_, hospitalId) => asList(await Feedback.getAll({ hospitalId })),
  'Failed to load feedback. Please check your connection and try again.',
);

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

/* ---------- slice ---------- */

const sub = (extra) => ({ ...extra, loading: false, error: null });

// A function, so the logout reset re-reads today's check-ins from sessionStorage.
const initialState = () => ({
  appointments: sub({ list: [] }),
  checkins: { list: readCheckins() },
  patients: sub({ list: [] }),
  beds: sub({ list: [], ward: 'Emergency' }),
  inventory: sub({ items: [], requisitions: null, requisitionsError: null }), // null = loading,
  schedules: sub({ list: [], doctors: [], leaves: [], loaded: false }),
  leaveRequests: sub({ list: [] }),
  feedback: sub({ list: [] }),
  billing: sub({ bills: [], current: null }),
});

const track = (builder, asyncThunk, key, apply) => {
  builder
    .addCase(asyncThunk.pending, (state) => { state[key].loading = true; state[key].error = null; })
    .addCase(asyncThunk.rejected, (state, { payload }) => { state[key].loading = false; state[key].error = payload;
      if ('loaded' in state[key]) state[key].loaded = true; // schedules: stop the spinner on failure too
    })
    .addCase(asyncThunk.fulfilled, (state, { payload }) => { state[key].loading = false; apply(state[key], payload); });
};

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    // No check-in endpoint exists: the component writes sessionStorage, the slice mirrors it.
    patientCheckedIn(state, { payload }) { state.checkins.list.unshift(payload); },
    checkinsUpdated(state, { payload }) { state.checkins.list = payload; },
    setWard(state, { payload }) { state.beds.ward = payload; },
    setCurrentBill(state, { payload }) { state.billing.current = payload; },
  },
  extraReducers: (builder) => {
    track(builder, fetchStaffAppointments, 'appointments', (s, list) => { s.list = list; });
    track(builder, fetchPatientDirectory, 'patients', (s, list) => { s.list = list; });
    track(builder, fetchBeds, 'beds', (s, list) => {
      s.list = list;
      const wards = [...new Set(list.map((b) => b.ward))];
      if (wards.length && !wards.includes(s.ward)) s.ward = wards[0];
    });
    track(builder, fetchInventory, 'inventory', (s, items) => { s.items = items; });
    track(builder, fetchSchedules, 'schedules', (s, { list, doctors, leaves }) => {
      Object.assign(s, { list, doctors, leaves, loaded: true });
    });
    track(builder, fetchLeaveRequests, 'leaveRequests', (s, list) => { s.list = list; });
    track(builder, fetchStaffFeedback, 'feedback', (s, list) => { s.list = list; });
    track(builder, fetchBills, 'billing', (s, bills) => { s.bills = bills; });

    builder
      // Requisitions have their own error flag so a failure never blanks the stock table.
      .addCase(fetchRequisitions.pending, (state) => { state.inventory.requisitionsError = null; })
      .addCase(fetchRequisitions.rejected, (state, { payload }) => {
        state.inventory.requisitions = [];
        state.inventory.requisitionsError = payload;
      })
      .addCase(fetchRequisitions.fulfilled, (state, { payload }) => { state.inventory.requisitions = payload; })
      .addCase(updateBedStatus.fulfilled, (state, { payload }) => {
        const bed = state.beds.list.find((b) => b.id === payload.id);
        if (bed) bed.status = payload.status;
      })
      .addCase(createLeaveRequest.fulfilled, (state, { payload }) => {
        if (payload?.id) state.leaveRequests.list.unshift(payload);
      })
      .addCase(generateBill.fulfilled, (state, { payload }) => {
        if (payload?.id) state.billing.bills.unshift(payload);
      });
  },
});

export const { patientCheckedIn, checkinsUpdated, setWard, setCurrentBill } = staffSlice.actions;

/* ---------- selectors ---------- */

export const selectStaffAppointments = (s) => s.staff.appointments;
export const selectCheckins = (s) => s.staff.checkins.list;
export const selectStaffPatients = (s) => s.staff.patients;
export const selectBeds = (s) => s.staff.beds;
export const selectInventory = (s) => s.staff.inventory;
export const selectSchedules = (s) => s.staff.schedules;
export const selectLeaveRequests = (s) => s.staff.leaveRequests;
export const selectStaffFeedback = (s) => s.staff.feedback;
export const selectStaffBilling = (s) => s.staff.billing;

export default staffSlice.reducer;
