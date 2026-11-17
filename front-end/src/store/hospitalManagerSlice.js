import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Ambulance, Feedback, Hospitals, Inventory, Leaves, Revenue, Schedules, SupportRequests, Users } from '../api';

const errorMessage = (error, fallback) => error?.message || fallback;
const hospitalIdOf = (getState) => getState().auth.user?.hospitalId || '';

export const isPendingLeave = (l) => (l.status || '').toLowerCase() === 'pending';
export const isPendingReq = (r) => ['PENDING', 'PENDING_APPROVAL'].includes((r.status || '').toUpperCase());
export const isOnDuty = (a) => ['dispatched', 'en route', 'pending'].includes((a.status || '').toLowerCase());

const asList = (res) => (Array.isArray(res?.data) ? res.data : []);

// Overview stats + the three sidebar badge counters in one round of calls —
// what HmContext's reloadCounts() and OverviewPage's loadOverview() each did.
export const fetchHmOverview = createAsyncThunk(
  'hospitalManager/fetchOverview',
  async (_, { getState, rejectWithValue }) => {
    const hospitalId = hospitalIdOf(getState);
    if (!hospitalId) return rejectWithValue('No hospital assigned to this account.');
    try {
      const [hospital, users, leaves, reqs, fleet] = await Promise.all([
        Hospitals.getById(hospitalId).catch(() => ({ data: null })),
        Users.getAll().catch(() => ({ data: [] })),
        Leaves.getAll({ hospitalId }).catch(() => ({ data: [] })),
        Inventory.getRequirements({ hospitalId }).catch(() => ({ data: [] })),
        Ambulance.getAll().catch(() => ({ data: [] })),
      ]);
      const staff = asList({ data: users.data }).filter((u) => u.hospitalId === hospitalId);
      const pendingLeaves = asList(leaves).filter(isPendingLeave);
      const pendingReqs = asList(reqs).filter(isPendingReq);
      return {
        hospital: hospital.data || null,
        stats: {
          doctors: staff.filter((u) => u.role === 'doctor').length,
          adminStaff: staff.filter((u) => u.role === 'administrative_staff').length,
          pendingLeaves,
          pendingReqs,
          urgentReqs: pendingReqs.filter((r) => (r.priority || '').toUpperCase() === 'URGENT').length,
        },
        counts: {
          pendingLeaves: pendingLeaves.length,
          pendingReqs: pendingReqs.length,
          onDutyAmbulances: asList(fleet).filter(isOnDuty).length,
        },
      };
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not load hospital overview.'));
    }
  },
);

export const fetchHmStaff = createAsyncThunk(
  'hospitalManager/fetchStaff',
  async (_, { getState, rejectWithValue }) => {
    const hospitalId = hospitalIdOf(getState);
    try {
      const res = await Users.getAll();
      return asList(res).filter((u) => u.hospitalId === hospitalId);
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not load staff directory.'));
    }
  },
);

export const updateStaffStatus = createAsyncThunk(
  'hospitalManager/updateStaffStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      await Users.updateStatus(id, status);
      return { id, status };
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not update staff status.'));
    }
  },
);

export const registerStaff = createAsyncThunk(
  'hospitalManager/registerStaff',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await Users.create(payload);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not register staff member.'));
    }
  },
);

export const fetchHmLeaves = createAsyncThunk(
  'hospitalManager/fetchLeaves',
  async (_, { getState, rejectWithValue }) => {
    const hospitalId = hospitalIdOf(getState);
    try {
      const res = await Leaves.getAll({ hospitalId });
      return asList(res);
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not load leave requests.'));
    }
  },
);

export const approveLeave = createAsyncThunk(
  'hospitalManager/approveLeave',
  async (id, { rejectWithValue }) => {
    try {
      await Leaves.approve(id);
      return { id, status: 'approved' };
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not approve leave request.'));
    }
  },
);

export const rejectLeave = createAsyncThunk(
  'hospitalManager/rejectLeave',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      await Leaves.reject(id, reason);
      return { id, status: 'rejected' };
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not reject leave request.'));
    }
  },
);

export const fetchHmSchedules = createAsyncThunk(
  'hospitalManager/fetchSchedules',
  async (_, { getState, rejectWithValue }) => {
    const hospitalId = hospitalIdOf(getState);
    try {
      const res = await Schedules.getAll({ hospitalId });
      return asList(res);
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not load schedules.'));
    }
  },
);

export const decideSchedule = createAsyncThunk(
  'hospitalManager/decideSchedule',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      await Schedules.update(id, { status });
      return { id, status };
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not update schedule.'));
    }
  },
);

export const fetchSupportTickets = createAsyncThunk(
  'hospitalManager/fetchSupportTickets',
  async (_, { getState, rejectWithValue }) => {
    const hospitalId = hospitalIdOf(getState);
    try {
      const res = await SupportRequests.getAll(hospitalId);
      return asList(res);
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not load support tickets.'));
    }
  },
);

export const createSupportTicket = createAsyncThunk(
  'hospitalManager/createSupportTicket',
  async (data, { getState, rejectWithValue }) => {
    try {
      const hospitalId = hospitalIdOf(getState);
      const res = await SupportRequests.create({ hospitalId, ...data });
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not create support ticket.'));
    }
  },
);

export const fetchHmFeedback = createAsyncThunk(
  'hospitalManager/fetchFeedback',
  async (filters = {}, { getState, rejectWithValue }) => {
    const hospitalId = hospitalIdOf(getState);
    try {
      const res = await Feedback.getAll({ hospitalId, ...filters });
      return asList(res);
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not load feedback.'));
    }
  },
);

export const updateFeedbackStatus = createAsyncThunk(
  'hospitalManager/updateFeedbackStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      await Feedback.updateStatus(id, status);
      return { id, status };
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not update feedback status.'));
    }
  },
);

export const fetchInventoryApprovals = createAsyncThunk(
  'hospitalManager/fetchInventoryApprovals',
  async (_, { getState, rejectWithValue }) => {
    const hospitalId = hospitalIdOf(getState);
    try {
      const res = await Inventory.getRequirements({ hospitalId });
      return asList(res);
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not load inventory approvals.'));
    }
  },
);

export const approveInventory = createAsyncThunk(
  'hospitalManager/approveInventory',
  async ({ id, remarks = '' }, { rejectWithValue }) => {
    try {
      await Inventory.approveRequirement(id, remarks);
      return { id, status: 'APPROVED' };
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not approve requisition.'));
    }
  },
);

export const rejectInventory = createAsyncThunk(
  'hospitalManager/rejectInventory',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      await Inventory.rejectRequirement(id, reason);
      return { id, status: 'REJECTED' };
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not reject requisition.'));
    }
  },
);

export const fetchFleet = createAsyncThunk(
  'hospitalManager/fetchFleet',
  async (_, { rejectWithValue }) => {
    try {
      const res = await Ambulance.getAll();
      return asList(res);
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not load ambulance fleet.'));
    }
  },
);

export const saveAmbulance = createAsyncThunk(
  'hospitalManager/saveAmbulance',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = id ? await Ambulance.update(id, data) : await Ambulance.create(data);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not save ambulance.'));
    }
  },
);

export const fetchHmRevenue = createAsyncThunk(
  'hospitalManager/fetchRevenue',
  async (_, { getState, rejectWithValue }) => {
    const hospitalId = hospitalIdOf(getState);
    try {
      const res = await Revenue.getHospitalRevenue(hospitalId);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not load revenue data.'));
    }
  },
);

export const fetchSubscription = createAsyncThunk(
  'hospitalManager/fetchSubscription',
  async (_, { getState, rejectWithValue }) => {
    const hospitalId = hospitalIdOf(getState);
    if (!hospitalId) return rejectWithValue('No hospital assigned to this account.');
    try {
      const [sub, plans] = await Promise.all([
        Hospitals.getSubscription(hospitalId).catch(() => ({ data: null })),
        Revenue.getHospitalPlans().catch(() => ({ data: [] })),
      ]);
      return { plan: sub.data || null, plans: asList(plans) };
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not load subscription.'));
    }
  },
);

export const updateSubscription = createAsyncThunk(
  'hospitalManager/updateSubscription',
  async (changes, { getState, rejectWithValue }) => {
    const hospitalId = hospitalIdOf(getState);
    try {
      const res = await Revenue.updateHospitalSubscription(hospitalId, changes);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not update subscription.'));
    }
  },
);

export const renewSubscription = createAsyncThunk(
  'hospitalManager/renewSubscription',
  async (payment = {}, { getState, rejectWithValue }) => {
    const hospitalId = hospitalIdOf(getState);
    try {
      const res = await Hospitals.renewSubscription(hospitalId, payment);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not renew subscription.'));
    }
  },
);

const listState = () => ({ list: [], loading: false, error: null });

const initialState = {
  hospital: { name: '', loading: false, error: null },
  counts: { pendingLeaves: 0, pendingReqs: 0, onDutyAmbulances: 0 },
  ui: { staffModalOpen: false, renewalModalOpen: false, registered: null },
  overview: { stats: null, loading: false, error: null },
  staff: listState(),
  leaves: listState(),
  schedules: listState(),
  support: { tickets: [], loading: false, error: null },
  feedback: listState(),
  inventory: { approvals: [], loading: false, error: null },
  ambulance: { fleet: [], loading: false, error: null },
  revenue: { data: null, loading: false, error: null },
  subscription: { plan: null, plans: [], loading: false, error: null },
  setup: { config: null, loading: false, error: null },
};

const hospitalManagerSlice = createSlice({
  name: 'hospitalManager',
  initialState,
  reducers: {
    openStaffModal: (state) => { state.ui.staffModalOpen = true; },
    closeStaffModal: (state) => { state.ui.staffModalOpen = false; },
    openRenewalModal: (state) => { state.ui.renewalModalOpen = true; },
    closeRenewalModal: (state) => { state.ui.renewalModalOpen = false; },
    setRegistered: (state, action) => { state.ui.registered = action.payload; },
  },
  extraReducers: (builder) => {
    const pending = (slot) => (state) => {
      state[slot].loading = true;
      state[slot].error = null;
    };
    const rejected = (slot) => (state, action) => {
      state[slot].loading = false;
      state[slot].error = action.payload;
    };

    builder
      .addCase(fetchHmOverview.pending, pending('overview'))
      .addCase(fetchHmOverview.fulfilled, (state, action) => {
        state.overview.stats = action.payload.stats;
        state.overview.loading = false;
        state.counts = action.payload.counts;
        if (action.payload.hospital?.name) state.hospital.name = action.payload.hospital.name;
      })
      .addCase(fetchHmOverview.rejected, rejected('overview'))

      .addCase(fetchHmStaff.pending, pending('staff'))
      .addCase(fetchHmStaff.fulfilled, (state, action) => {
        state.staff.list = action.payload;
        state.staff.loading = false;
      })
      .addCase(fetchHmStaff.rejected, rejected('staff'))
      .addCase(updateStaffStatus.fulfilled, (state, action) => {
        const member = state.staff.list.find((u) => u.id === action.payload.id);
        if (member) member.status = action.payload.status;
      })
      .addCase(registerStaff.fulfilled, (state, action) => {
        if (action.payload) state.staff.list.unshift(action.payload);
      })

      .addCase(fetchHmLeaves.pending, pending('leaves'))
      .addCase(fetchHmLeaves.fulfilled, (state, action) => {
        state.leaves.list = action.payload;
        state.leaves.loading = false;
      })
      .addCase(fetchHmLeaves.rejected, rejected('leaves'))
      .addCase(approveLeave.fulfilled, (state, action) => {
        const leave = state.leaves.list.find((l) => l.id === action.payload.id);
        if (leave && isPendingLeave(leave)) {
          leave.status = action.payload.status;
          state.counts.pendingLeaves = Math.max(0, state.counts.pendingLeaves - 1);
        }
      })
      .addCase(rejectLeave.fulfilled, (state, action) => {
        const leave = state.leaves.list.find((l) => l.id === action.payload.id);
        if (leave && isPendingLeave(leave)) {
          leave.status = action.payload.status;
          state.counts.pendingLeaves = Math.max(0, state.counts.pendingLeaves - 1);
        }
      })

      .addCase(fetchHmSchedules.pending, pending('schedules'))
      .addCase(fetchHmSchedules.fulfilled, (state, action) => {
        state.schedules.list = action.payload;
        state.schedules.loading = false;
      })
      .addCase(fetchHmSchedules.rejected, rejected('schedules'))
      .addCase(decideSchedule.fulfilled, (state, action) => {
        const item = state.schedules.list.find((s) => s.id === action.payload.id);
        if (item) item.status = action.payload.status;
      })

      .addCase(fetchSupportTickets.pending, (state) => {
        state.support.loading = true;
        state.support.error = null;
      })
      .addCase(fetchSupportTickets.fulfilled, (state, action) => {
        state.support.tickets = action.payload;
        state.support.loading = false;
      })
      .addCase(fetchSupportTickets.rejected, (state, action) => {
        state.support.loading = false;
        state.support.error = action.payload;
      })
      .addCase(createSupportTicket.fulfilled, (state, action) => {
        if (action.payload) state.support.tickets.unshift(action.payload);
      })

      .addCase(fetchHmFeedback.pending, pending('feedback'))
      .addCase(fetchHmFeedback.fulfilled, (state, action) => {
        state.feedback.list = action.payload;
        state.feedback.loading = false;
      })
      .addCase(fetchHmFeedback.rejected, rejected('feedback'))
      .addCase(updateFeedbackStatus.fulfilled, (state, action) => {
        const item = state.feedback.list.find((f) => f.id === action.payload.id);
        if (item) item.status = action.payload.status;
      })

      .addCase(fetchInventoryApprovals.pending, (state) => {
        state.inventory.loading = true;
        state.inventory.error = null;
      })
      .addCase(fetchInventoryApprovals.fulfilled, (state, action) => {
        state.inventory.approvals = action.payload;
        state.inventory.loading = false;
      })
      .addCase(fetchInventoryApprovals.rejected, (state, action) => {
        state.inventory.loading = false;
        state.inventory.error = action.payload;
      })
      .addCase(approveInventory.fulfilled, (state, action) => {
        const req = state.inventory.approvals.find((r) => r.id === action.payload.id);
        if (req) req.status = action.payload.status;
        state.counts.pendingReqs = Math.max(0, state.counts.pendingReqs - 1);
      })
      .addCase(rejectInventory.fulfilled, (state, action) => {
        const req = state.inventory.approvals.find((r) => r.id === action.payload.id);
        if (req) req.status = action.payload.status;
        state.counts.pendingReqs = Math.max(0, state.counts.pendingReqs - 1);
      })

      .addCase(fetchFleet.pending, (state) => {
        state.ambulance.loading = true;
        state.ambulance.error = null;
      })
      .addCase(fetchFleet.fulfilled, (state, action) => {
        state.ambulance.fleet = action.payload;
        state.ambulance.loading = false;
      })
      .addCase(fetchFleet.rejected, (state, action) => {
        state.ambulance.loading = false;
        state.ambulance.error = action.payload;
      })
      .addCase(saveAmbulance.fulfilled, (state, action) => {
        if (!action.payload) return;
        const index = state.ambulance.fleet.findIndex((a) => a.id === action.payload.id);
        if (index >= 0) state.ambulance.fleet[index] = { ...state.ambulance.fleet[index], ...action.payload };
        else state.ambulance.fleet.unshift(action.payload);
      })

      .addCase(fetchHmRevenue.pending, pending('revenue'))
      .addCase(fetchHmRevenue.fulfilled, (state, action) => {
        state.revenue.data = action.payload;
        state.revenue.loading = false;
      })
      .addCase(fetchHmRevenue.rejected, rejected('revenue'))

      .addCase(fetchSubscription.pending, (state) => {
        state.subscription.loading = true;
        state.subscription.error = null;
      })
      .addCase(fetchSubscription.fulfilled, (state, action) => {
        state.subscription.plan = action.payload.plan;
        state.subscription.plans = action.payload.plans;
        state.subscription.loading = false;
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        state.subscription.loading = false;
        state.subscription.error = action.payload;
      })
      .addCase(updateSubscription.fulfilled, (state, action) => {
        if (action.payload) state.subscription.plan = { ...state.subscription.plan, ...action.payload };
      })
      .addCase(renewSubscription.fulfilled, (state, action) => {
        if (action.payload) state.subscription.plan = { ...state.subscription.plan, ...action.payload };
      });
  },
});

export const {
  openStaffModal,
  closeStaffModal,
  openRenewalModal,
  closeRenewalModal,
  setRegistered,
} = hospitalManagerSlice.actions;

export const selectHm = (state) => state.hospitalManager;
export const selectHmHospital = (state) => state.hospitalManager.hospital;
export const selectHmCounts = (state) => state.hospitalManager.counts;
export const selectHmUi = (state) => state.hospitalManager.ui;
export const selectHmOverview = (state) => state.hospitalManager.overview;
export const selectHmStaff = (state) => state.hospitalManager.staff;
export const selectHmLeaves = (state) => state.hospitalManager.leaves;
export const selectHmSchedules = (state) => state.hospitalManager.schedules;
export const selectHmSupport = (state) => state.hospitalManager.support;
export const selectHmFeedback = (state) => state.hospitalManager.feedback;
export const selectHmInventory = (state) => state.hospitalManager.inventory;
export const selectHmAmbulance = (state) => state.hospitalManager.ambulance;
export const selectHmRevenue = (state) => state.hospitalManager.revenue;
export const selectHmSubscription = (state) => state.hospitalManager.subscription;
export const selectHmSetup = (state) => state.hospitalManager.setup;

export default hospitalManagerSlice.reducer;