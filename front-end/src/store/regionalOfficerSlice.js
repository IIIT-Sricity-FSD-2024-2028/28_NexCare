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
  dashboard: { stats: null, loading: false, error: null },
  approvals: { list: [], filter: 'pending_verification', loading: false, error: null },
  hospitalDetails: { data: null, loading: false, error: null },
  comparison: { hospitals: [], selected: [], result: null, loading: false, error: null },
  alerts: {
    list: [],
    summary: null,
    filters: { severity: 'all', category: 'all', hospital: 'all', term: '' },
    loading: false,
    error: null,
  },
  complaints: { list: [], loading: false, error: null },
  revenue: {
    data: null, loading: false, detailLoading: false, error: null, detailError: null,
  },
};

const regionalOfficerSlice = createSlice({
  name: 'regionalOfficer',
  initialState,
  reducers: {
    setApprovalFilter: (state, action) => {
      state.approvals.filter = action.payload;
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
      .addCase(fetchRoDashboard.pending, (state) => {
        state.dashboard.loading = true;
        state.dashboard.error = null;
      })
      .addCase(fetchRoDashboard.fulfilled, (state, action) => {
        state.dashboard.stats = action.payload;
        state.dashboard.loading = false;
      })
      .addCase(fetchRoDashboard.rejected, (state, action) => {
        state.dashboard.loading = false;
        state.dashboard.error = action.payload;
      })
      .addCase(fetchHospitalApprovals.pending, (state) => {
        state.approvals.loading = true;
        state.approvals.error = null;
      })
      .addCase(fetchHospitalApprovals.fulfilled, (state, action) => {
        state.approvals.list = action.payload;
        state.approvals.loading = false;
      })
      .addCase(fetchHospitalApprovals.rejected, (state, action) => {
        state.approvals.loading = false;
        state.approvals.error = action.payload;
      })
      .addCase(reviewHospital.fulfilled, (state, action) => {
        const hospital = state.approvals.list.find((item) => item.id === action.payload.id);
        if (hospital) hospital.regionalReviewStatus = action.payload.decision;
      })
      .addCase(fetchHospitalDetails.pending, (state) => {
        state.hospitalDetails.data = null;
        state.hospitalDetails.loading = true;
        state.hospitalDetails.error = null;
      })
      .addCase(fetchHospitalDetails.fulfilled, (state, action) => {
        state.hospitalDetails.data = action.payload;
        state.hospitalDetails.loading = false;
      })
      .addCase(fetchHospitalDetails.rejected, (state, action) => {
        state.hospitalDetails.loading = false;
        state.hospitalDetails.error = action.payload;
      })
      .addCase(fetchHospitalComparison.pending, (state) => {
        state.comparison.loading = true;
        state.comparison.error = null;
      })
      .addCase(fetchHospitalComparison.fulfilled, (state, action) => {
        if (action.payload.options) state.comparison.hospitals = action.payload.options;
        state.comparison.selected = action.payload.selected;
        state.comparison.result = action.payload.result;
        state.comparison.loading = false;
      })
      .addCase(fetchHospitalComparison.rejected, (state, action) => {
        state.comparison.loading = false;
        state.comparison.error = action.payload;
      })
      .addCase(fetchPerformanceAlerts.pending, (state) => {
        state.alerts.loading = true;
        state.alerts.error = null;
      })
      .addCase(fetchPerformanceAlerts.fulfilled, (state, action) => {
        state.alerts.summary = action.payload;
        state.alerts.list = action.payload.alerts || [];
        state.alerts.loading = false;
      })
      .addCase(fetchPerformanceAlerts.rejected, (state, action) => {
        state.alerts.loading = false;
        state.alerts.error = action.payload;
      })
      .addCase(fetchComplaints.pending, (state) => {
        state.complaints.loading = true;
        state.complaints.error = null;
      })
      .addCase(fetchComplaints.fulfilled, (state, action) => {
        state.complaints.list = action.payload;
        state.complaints.loading = false;
      })
      .addCase(fetchComplaints.rejected, (state, action) => {
        state.complaints.loading = false;
        state.complaints.error = action.payload;
      })
      .addCase(updateComplaintStatus.fulfilled, (state, action) => {
        const complaint = state.complaints.list.find((item) => item.id === action.payload.id);
        if (complaint) complaint.status = action.payload.status;
      })
      .addCase(fetchRoRevenue.pending, (state) => {
        state.revenue.loading = true;
        state.revenue.error = null;
      })
      .addCase(fetchRoRevenue.fulfilled, (state, action) => {
        state.revenue.data = action.payload;
        state.revenue.loading = false;
      })
      .addCase(fetchRoRevenue.rejected, (state, action) => {
        state.revenue.loading = false;
        state.revenue.error = action.payload;
      })
      .addCase(fetchRoHospitalRevenue.pending, (state) => {
        state.revenue.detailLoading = true;
        state.revenue.detailError = null;
      })
      .addCase(fetchRoHospitalRevenue.fulfilled, (state, action) => {
        state.revenue.detailLoading = false;
        state.revenue.data.detailsByHospital[action.payload.hospitalId] = action.payload.detail;
      })
      .addCase(fetchRoHospitalRevenue.rejected, (state, action) => {
        state.revenue.detailLoading = false;
        state.revenue.detailError = action.payload;
      });
  },
});

export const {
  setAlertFilter,
  setApprovalFilter,
  setComparisonSelection,
  toggleComparisonHospital,
} = regionalOfficerSlice.actions;

export const selectRoDashboard = (state) => state.regionalOfficer.dashboard;
export const selectRoApprovals = (state) => state.regionalOfficer.approvals;
export const selectRoHospitalDetails = (state) => state.regionalOfficer.hospitalDetails;
export const selectRoComparison = (state) => state.regionalOfficer.comparison;
export const selectRoAlerts = (state) => state.regionalOfficer.alerts;
export const selectRoComplaints = (state) => state.regionalOfficer.complaints;
export const selectRoRevenue = (state) => state.regionalOfficer.revenue;

export default regionalOfficerSlice.reducer;
