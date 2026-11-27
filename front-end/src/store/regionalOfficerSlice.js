import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Feedback, Hospitals, Revenue } from '../api';

const errorMessage = (error, fallback) => error?.message || fallback;

export const fetchRoDashboard = createAsyncThunk(
  'regionalOfficer/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const [overview, revenue, alerts] = await Promise.all([
        Hospitals.getRegionalOverview(),
        Revenue.compareMyHospitals().catch(() => ({ data: [] })),
        Hospitals.getPerformanceAlerts().catch(() => ({ data: { total: 0, alerts: [] } })),
      ]);
      return {
        ...(overview.data || {}),
        revenueComparison: revenue.data || [],
        alerts: alerts.data || { total: 0, alerts: [] },
      };
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not load regional overview.'));
    }
  },
);

export const fetchHospitalApprovals = createAsyncThunk(
  'regionalOfficer/fetchHospitalApprovals',
  async (_, { rejectWithValue }) => {
    try {
      const response = await Hospitals.getReviewQueue();
      return response.data || [];
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not load hospital registrations.'));
    }
  },
);

export const reviewHospital = createAsyncThunk(
  'regionalOfficer/reviewHospital',
  async ({ id, decision, notes = '' }, { rejectWithValue }) => {
    try {
      await Hospitals.regionalReview(id, decision, notes);
      return { id, decision };
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not save the regional review.'));
    }
  },
);

const DETAIL_TAB_FETCHERS = {
  staff: Hospitals.getHospitalDoctors,
  beds: Hospitals.getHospitalBeds,
  inventory: Hospitals.getHospitalInventory,
  ambulances: Hospitals.getHospitalAmbulances,
};

const emptyDetailTab = () => ({ rows: [], loading: false, error: null, requestId: null, loaded: false });
const emptyDetailTabs = () => ({
  staff: emptyDetailTab(),
  beds: emptyDetailTab(),
  inventory: emptyDetailTab(),
  ambulances: emptyDetailTab(),
});

function rowsForHospital(list, hospitalId) {
  return (list || []).filter((row) => {
    if (!row) return false;
    const hid = row.hospitalId || row.hospital_id;
    return !hid || hid === hospitalId;
  });
}

export const fetchHospitalDetails = createAsyncThunk(
  'regionalOfficer/fetchHospitalDetails',
  async (id, { rejectWithValue }) => {
    try {
      const [hospital, revenue] = await Promise.all([
        Hospitals.getById(id),
        Revenue.getHospitalRevenue(id).catch(() => ({ data: null })),
      ]);
      if (!hospital.data) throw new Error(hospital.message || 'Hospital not found');
      return { hospital: hospital.data, revenue: revenue.data };
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not load hospital details.'));
    }
  },
);

export const fetchHospitalDetailCounts = createAsyncThunk(
  'regionalOfficer/fetchHospitalDetailCounts',
  async (id, { rejectWithValue }) => {
    try {
      const [beds, inventory] = await Promise.all([
        Hospitals.getHospitalBeds(id).then((res) => res.data || []).catch(() => []),
        Hospitals.getHospitalInventory(id).then((res) => res.data || []).catch(() => []),
      ]);
      return { id, beds: rowsForHospital(beds, id), inventory: rowsForHospital(inventory, id) };
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not load hospital snapshot counts.'));
    }
  },
);

export const fetchHospitalDetailTab = createAsyncThunk(
  'regionalOfficer/fetchHospitalDetailTab',
  async ({ id, tab }, { rejectWithValue }) => {
    const fetchTab = DETAIL_TAB_FETCHERS[tab];
    if (!fetchTab) return rejectWithValue('Unknown hospital details tab.');
    try {
      const response = await fetchTab(id);
      let rows = rowsForHospital(response.data, id);
      if (tab === 'staff') {
        rows = rows.filter((user) => String(user.role || '').toLowerCase() === 'doctor');
      }
      return { id, tab, rows };
    } catch (error) {
      return rejectWithValue(errorMessage(error, `Could not load ${tab}.`));
    }
  },
);

export const fetchHospitalComparison = createAsyncThunk(
  'regionalOfficer/fetchHospitalComparison',
  async (hospitalIds, { rejectWithValue }) => {
    try {
      let options;
      let ids = hospitalIds;
      if (!Array.isArray(ids)) {
        const assigned = await Hospitals.getMyHospitals();
        options = (assigned.data || []).map((hospital) => ({
          hospitalId: hospital.hospitalId || hospital.id,
          hospitalName: hospital.hospitalName || hospital.name,
          city: hospital.city,
        }));
        ids = options.map((hospital) => hospital.hospitalId).filter(Boolean);
      }
      const response = await Hospitals.getComparison(ids);
      return {
        options,
        selected: ids,
        result: response.data?.hospitals || [],
      };
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not load hospital comparison data.'));
    }
  },
);

export const fetchPerformanceAlerts = createAsyncThunk(
  'regionalOfficer/fetchPerformanceAlerts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await Hospitals.getPerformanceAlerts();
      return response.data || { total: 0, alerts: [] };
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not load performance alerts.'));
    }
  },
);

export const fetchComplaints = createAsyncThunk(
  'regionalOfficer/fetchComplaints',
  async (_, { rejectWithValue }) => {
    try {
      const [feedback, hospitals] = await Promise.all([
        Feedback.getRegional(),
        Hospitals.getMyHospitals().catch(() => ({ data: [] })),
      ]);
      const names = Object.fromEntries(
        (hospitals.data || []).map((hospital) => [
          hospital.hospitalId || hospital.id,
          hospital.hospitalName || hospital.name,
        ]),
      );
      return (feedback.data?.items || []).map((item) => ({
        ...item,
        hospitalName: names[item.hospitalId] || item.hospitalName || item.hospitalId,
      }));
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not load complaints.'));
    }
  },
);

export const updateComplaintStatus = createAsyncThunk(
  'regionalOfficer/updateComplaintStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      await Feedback.updateStatus(id, status);
      return { id, status };
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not update complaint status.'));
    }
  },
);

export const fetchRoRevenue = createAsyncThunk(
  'regionalOfficer/fetchRevenue',
  async (_, { rejectWithValue }) => {
    try {
      const comparison = await Revenue.compareMyHospitals();
      const rows = comparison.data || [];
      const firstId = rows[0]?.hospitalId;
      const detail = firstId
        ? await Revenue.getHospitalRevenue(firstId).then((response) => response.data)
        : null;
      return {
        rows,
        detailsByHospital: firstId ? { [firstId]: detail } : {},
      };
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not load regional revenue.'));
    }
  },
);

export const fetchRoHospitalRevenue = createAsyncThunk(
  'regionalOfficer/fetchHospitalRevenue',
  async (hospitalId, { rejectWithValue }) => {
    try {
      const response = await Revenue.getHospitalRevenue(hospitalId);
      return { hospitalId, detail: response.data };
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Could not load the department breakdown.'));
    }
  },
);

const initialState = {
  dashboard: { stats: null, loading: false, error: null, requestId: null },
  approvals: {
    list: [],
    filter: 'pending_verification',
    term: '',
    busyId: null,
    reject: null,
    loading: false,
    error: null,
    requestId: null,
  },
  hospitalDetails: {
    data: null,
    loading: false,
    error: null,
    requestId: null,
    hospitalId: null,
    tab: 'overview',
    counts: null,
    countsLoading: false,
    countsError: null,
    countsRequestId: null,
    tabs: emptyDetailTabs(),
  },
  profilePassword: { current: '', next: '' },
  comparison: {
    hospitals: [], selected: [], result: null, loading: false, error: null, requestId: null,
  },
  alerts: {
    list: [],
    summary: null,
    filters: { severity: 'all', category: 'all', hospital: 'all', term: '' },
    loading: false,
    error: null,
    requestId: null,
  },
  complaints: {
    list: [],
    filters: { status: 'all', category: 'all', hospital: 'all', term: '' },
    editing: null,
    saving: false,
    loading: false,
    error: null,
    requestId: null,
  },
  revenue: {
    data: null,
    picked: '',
    loading: false,
    detailLoading: false,
    error: null,
    detailError: null,
    requestId: null,
    detailRequestId: null,
  },
};

const regionalOfficerSlice = createSlice({
  name: 'regionalOfficer',
  initialState,
  reducers: {
    setApprovalFilter: (state, action) => {
      state.approvals.filter = action.payload;
    },
    setApprovalTerm: (state, action) => {
      state.approvals.term = action.payload;
    },
    setApprovalReject: (state, action) => {
      state.approvals.reject = action.payload;
    },
    setApprovalRejectNotes: (state, action) => {
      if (state.approvals.reject) state.approvals.reject.notes = action.payload;
    },
    setHospitalDetailsTab: (state, action) => {
      state.hospitalDetails.tab = action.payload;
    },
    setProfilePasswordField: (state, action) => {
      const { key, value } = action.payload;
      if (Object.hasOwn(state.profilePassword, key)) state.profilePassword[key] = value;
    },
    clearProfilePassword: (state) => {
      state.profilePassword = { current: '', next: '' };
    },
    setComplaintFilter: (state, action) => {
      const { key, value } = action.payload;
      if (Object.hasOwn(state.complaints.filters, key)) state.complaints.filters[key] = value;
    },
    setComplaintEditing: (state, action) => {
      state.complaints.editing = action.payload;
    },
    setComplaintEditingStatus: (state, action) => {
      if (state.complaints.editing) state.complaints.editing.status = action.payload;
    },
    setRevenuePicked: (state, action) => {
      state.revenue.picked = action.payload;
    },
    setAlertFilter: (state, action) => {
      const { key, value } = action.payload;
      if (Object.hasOwn(state.alerts.filters, key)) state.alerts.filters[key] = value;
    },
    toggleComparisonHospital: (state, action) => {
      const id = action.payload;
      const index = state.comparison.selected.indexOf(id);
      if (index >= 0) state.comparison.selected.splice(index, 1);
      else state.comparison.selected.push(id);
    },
    setComparisonSelection: (state, action) => {
      state.comparison.selected = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoDashboard.pending, (state, action) => {
        state.dashboard.loading = true;
        state.dashboard.error = null;
        state.dashboard.requestId = action.meta.requestId;
      })
      .addCase(fetchRoDashboard.fulfilled, (state, action) => {
        if (state.dashboard.requestId !== action.meta.requestId) return;
        state.dashboard.stats = action.payload;
        state.dashboard.loading = false;
        state.dashboard.requestId = null;
      })
      .addCase(fetchRoDashboard.rejected, (state, action) => {
        if (state.dashboard.requestId !== action.meta.requestId) return;
        state.dashboard.loading = false;
        state.dashboard.error = action.payload;
        state.dashboard.requestId = null;
      })
      .addCase(fetchHospitalApprovals.pending, (state, action) => {
        state.approvals.loading = true;
        state.approvals.error = null;
        state.approvals.requestId = action.meta.requestId;
      })
      .addCase(fetchHospitalApprovals.fulfilled, (state, action) => {
        if (state.approvals.requestId !== action.meta.requestId) return;
        state.approvals.list = action.payload;
        state.approvals.loading = false;
        state.approvals.requestId = null;
      })
      .addCase(fetchHospitalApprovals.rejected, (state, action) => {
        if (state.approvals.requestId !== action.meta.requestId) return;
        state.approvals.loading = false;
        state.approvals.error = action.payload;
        state.approvals.requestId = null;
      })
      .addCase(reviewHospital.pending, (state, action) => {
        state.approvals.error = null;
        state.approvals.busyId = action.meta.arg?.id || null;
      })
      .addCase(reviewHospital.fulfilled, (state, action) => {
        const hospital = state.approvals.list.find((item) => item.id === action.payload.id);
        if (hospital) hospital.regionalReviewStatus = action.payload.decision;
        if (state.approvals.busyId === action.payload.id) state.approvals.busyId = null;
        state.approvals.reject = null;
      })
      .addCase(reviewHospital.rejected, (state, action) => {
        state.approvals.error = action.payload;
        state.approvals.busyId = null;
      })
      .addCase(fetchHospitalDetails.pending, (state, action) => {
        state.hospitalDetails.data = null;
        state.hospitalDetails.loading = true;
        state.hospitalDetails.error = null;
        state.hospitalDetails.requestId = action.meta.requestId;
        state.hospitalDetails.hospitalId = action.meta.arg;
        state.hospitalDetails.tab = 'overview';
        state.hospitalDetails.counts = null;
        state.hospitalDetails.countsLoading = false;
        state.hospitalDetails.countsError = null;
        state.hospitalDetails.countsRequestId = null;
        state.hospitalDetails.tabs = emptyDetailTabs();
      })
      .addCase(fetchHospitalDetails.fulfilled, (state, action) => {
        if (state.hospitalDetails.requestId !== action.meta.requestId) return;
        state.hospitalDetails.data = action.payload;
        state.hospitalDetails.loading = false;
        state.hospitalDetails.requestId = null;
      })
      .addCase(fetchHospitalDetails.rejected, (state, action) => {
        if (state.hospitalDetails.requestId !== action.meta.requestId) return;
        state.hospitalDetails.loading = false;
        state.hospitalDetails.error = action.payload;
        state.hospitalDetails.requestId = null;
      })
      .addCase(fetchHospitalDetailCounts.pending, (state, action) => {
        state.hospitalDetails.countsLoading = true;
        state.hospitalDetails.countsError = null;
        state.hospitalDetails.countsRequestId = action.meta.requestId;
      })
      .addCase(fetchHospitalDetailCounts.fulfilled, (state, action) => {
        if (state.hospitalDetails.countsRequestId !== action.meta.requestId) return;
        if (state.hospitalDetails.hospitalId !== action.payload.id) return;
        state.hospitalDetails.counts = {
          beds: action.payload.beds,
          inventory: action.payload.inventory,
        };
        state.hospitalDetails.countsLoading = false;
        state.hospitalDetails.countsRequestId = null;
      })
      .addCase(fetchHospitalDetailCounts.rejected, (state, action) => {
        if (state.hospitalDetails.countsRequestId !== action.meta.requestId) return;
        state.hospitalDetails.countsLoading = false;
        state.hospitalDetails.countsError = action.payload;
        state.hospitalDetails.countsRequestId = null;
      })
      .addCase(fetchHospitalDetailTab.pending, (state, action) => {
        const tab = action.meta.arg?.tab;
        if (!state.hospitalDetails.tabs[tab]) return;
        state.hospitalDetails.tabs[tab].loading = true;
        state.hospitalDetails.tabs[tab].error = null;
        state.hospitalDetails.tabs[tab].requestId = action.meta.requestId;
      })
      .addCase(fetchHospitalDetailTab.fulfilled, (state, action) => {
        const { id, tab, rows } = action.payload;
        const current = state.hospitalDetails.tabs[tab];
        if (!current || current.requestId !== action.meta.requestId) return;
        if (state.hospitalDetails.hospitalId !== id) return;
        current.rows = rows;
        current.loading = false;
        current.loaded = true;
        current.requestId = null;
        if (tab === 'beds' || tab === 'inventory') {
          const counts = state.hospitalDetails.counts || { beds: [], inventory: [] };
          state.hospitalDetails.counts = {
            ...counts,
            [tab]: rows,
          };
        }
      })
      .addCase(fetchHospitalDetailTab.rejected, (state, action) => {
        const tab = action.meta.arg?.tab;
        const current = state.hospitalDetails.tabs[tab];
        if (!current || current.requestId !== action.meta.requestId) return;
        current.loading = false;
        current.error = action.payload;
        current.requestId = null;
      })
      .addCase(fetchHospitalComparison.pending, (state, action) => {
        state.comparison.loading = true;
        state.comparison.error = null;
        state.comparison.requestId = action.meta.requestId;
      })
      .addCase(fetchHospitalComparison.fulfilled, (state, action) => {
        if (state.comparison.requestId !== action.meta.requestId) return;
        if (action.payload.options) state.comparison.hospitals = action.payload.options;
        state.comparison.selected = action.payload.selected;
        state.comparison.result = action.payload.result;
        state.comparison.loading = false;
        state.comparison.requestId = null;
      })
      .addCase(fetchHospitalComparison.rejected, (state, action) => {
        if (state.comparison.requestId !== action.meta.requestId) return;
        state.comparison.loading = false;
        state.comparison.error = action.payload;
        state.comparison.requestId = null;
      })
      .addCase(fetchPerformanceAlerts.pending, (state, action) => {
        state.alerts.loading = true;
        state.alerts.error = null;
        state.alerts.requestId = action.meta.requestId;
      })
      .addCase(fetchPerformanceAlerts.fulfilled, (state, action) => {
        if (state.alerts.requestId !== action.meta.requestId) return;
        state.alerts.summary = action.payload;
        state.alerts.list = action.payload.alerts || [];
        state.alerts.loading = false;
        state.alerts.requestId = null;
      })
      .addCase(fetchPerformanceAlerts.rejected, (state, action) => {
        if (state.alerts.requestId !== action.meta.requestId) return;
        state.alerts.loading = false;
        state.alerts.error = action.payload;
        state.alerts.requestId = null;
      })
      .addCase(fetchComplaints.pending, (state, action) => {
        state.complaints.loading = true;
        state.complaints.error = null;
        state.complaints.requestId = action.meta.requestId;
      })
      .addCase(fetchComplaints.fulfilled, (state, action) => {
        if (state.complaints.requestId !== action.meta.requestId) return;
        state.complaints.list = action.payload;
        state.complaints.loading = false;
        state.complaints.requestId = null;
      })
      .addCase(fetchComplaints.rejected, (state, action) => {
        if (state.complaints.requestId !== action.meta.requestId) return;
        state.complaints.loading = false;
        state.complaints.error = action.payload;
        state.complaints.requestId = null;
      })
      .addCase(updateComplaintStatus.pending, (state) => {
        state.complaints.error = null;
        state.complaints.saving = true;
      })
      .addCase(updateComplaintStatus.fulfilled, (state, action) => {
        const complaint = state.complaints.list.find((item) => item.id === action.payload.id);
        if (complaint) complaint.status = action.payload.status;
        state.complaints.saving = false;
        state.complaints.editing = null;
      })
      .addCase(updateComplaintStatus.rejected, (state, action) => {
        state.complaints.error = action.payload;
        state.complaints.saving = false;
      })
      .addCase(fetchRoRevenue.pending, (state, action) => {
        state.revenue.loading = true;
        state.revenue.error = null;
        state.revenue.requestId = action.meta.requestId;
      })
      .addCase(fetchRoRevenue.fulfilled, (state, action) => {
        if (state.revenue.requestId !== action.meta.requestId) return;
        state.revenue.data = action.payload;
        state.revenue.loading = false;
        state.revenue.requestId = null;
        if (!state.revenue.picked && action.payload.rows?.[0]?.hospitalId) {
          state.revenue.picked = action.payload.rows[0].hospitalId;
        }
      })
      .addCase(fetchRoRevenue.rejected, (state, action) => {
        if (state.revenue.requestId !== action.meta.requestId) return;
        state.revenue.loading = false;
        state.revenue.error = action.payload;
        state.revenue.requestId = null;
      })
      .addCase(fetchRoHospitalRevenue.pending, (state, action) => {
        state.revenue.detailLoading = true;
        state.revenue.detailError = null;
        state.revenue.detailRequestId = action.meta.requestId;
      })
      .addCase(fetchRoHospitalRevenue.fulfilled, (state, action) => {
        if (state.revenue.detailRequestId !== action.meta.requestId) return;
        state.revenue.detailLoading = false;
        state.revenue.data.detailsByHospital[action.payload.hospitalId] = action.payload.detail;
        state.revenue.detailRequestId = null;
      })
      .addCase(fetchRoHospitalRevenue.rejected, (state, action) => {
        if (state.revenue.detailRequestId !== action.meta.requestId) return;
        state.revenue.detailLoading = false;
        state.revenue.detailError = action.payload;
        state.revenue.detailRequestId = null;
      });
  },
});

export const {
  setAlertFilter,
  setApprovalFilter,
  setApprovalTerm,
  setApprovalReject,
  setApprovalRejectNotes,
  setHospitalDetailsTab,
  setProfilePasswordField,
  clearProfilePassword,
  setComplaintFilter,
  setComplaintEditing,
  setComplaintEditingStatus,
  setRevenuePicked,
  setComparisonSelection,
  toggleComparisonHospital,
} = regionalOfficerSlice.actions;

export const selectRoDashboard = (state) => state.regionalOfficer.dashboard;
export const selectRoAssignedHospitalCount = (state) => {
  const stats = state.regionalOfficer.dashboard.stats;
  return stats?.summary?.assignedHospitals ?? stats?.hospitals?.length ?? 0;
};
export const selectRoApprovals = (state) => state.regionalOfficer.approvals;
export const selectRoHospitalDetails = (state) => state.regionalOfficer.hospitalDetails;
export const selectRoProfilePassword = (state) => state.regionalOfficer.profilePassword;
export const selectRoComparison = (state) => state.regionalOfficer.comparison;
export const selectRoAlerts = (state) => state.regionalOfficer.alerts;
export const selectRoComplaints = (state) => state.regionalOfficer.complaints;
export const selectRoRevenue = (state) => state.regionalOfficer.revenue;

export default regionalOfficerSlice.reducer;
