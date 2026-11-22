import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Feedback, Hospitals, Patients, Revenue, System, Users, Beds, Ambulance } from '../api';

const messageFor = (error, fallback) => error?.message || fallback;
const dataOf = (response, fallback) => response?.data ?? fallback;

const run = (type, request, fallback) => createAsyncThunk(
  `superuser/${type}`,
  async (payload, { rejectWithValue }) => {
    try {
      return await request(payload);
    } catch (error) {
      return rejectWithValue(messageFor(error, fallback));
    }
  },
);

export const fetchSuDashboard = run(
  'fetchDashboard',
  async () => {
    const [users, patients, feedback, hospitals, activity] = await Promise.all([
      Users.getAll(),
      Patients.getAll(),
      Feedback.getAll(),
      Hospitals.getAll(),
      System.getRecentActivity(),
    ]);
    const userList = dataOf(users, []);
    const patientList = dataOf(patients, []);
    const feedbackList = dataOf(feedback, []);
    return {
      stats: {
        hospitals: dataOf(hospitals, []).length,
        staff: userList.filter((user) => user.role !== 'patient').length,
        patients: patientList.length,
        doctors: userList.filter((user) => user.role === 'doctor' && user.status === 'Active').length,
        feedback: feedbackList.filter((item) =>
          item.status === 'Open' || item.status === 'Pending' || !item.resolved).length,
      },
      activity: dataOf(activity, []).slice(0, 10),
    };
  },
  'Could not load the Superuser dashboard.',
);

export const fetchRegistrations = run(
  'fetchRegistrations',
  async () => {
    const [hospitals, users] = await Promise.all([Hospitals.getAll(), Users.getAll()]);
    const list = dataOf(hospitals, []);
    const officerList = dataOf(users, []).filter((user) => user.role === 'regional_manager');
    const cityKeys = [...new Set(list
      .map((hospital) => String(hospital.city || '').trim())
      .filter(Boolean))];
    const suggestionEntries = await Promise.all(cityKeys.map(async (city) => {
      try {
        const response = await Users.suggestRegionalManagers(city);
        return [String(city).trim().toLowerCase(), dataOf(response, [])];
      } catch {
        return [String(city).trim().toLowerCase(), []];
      }
    }));
    return {
      list,
      officers: officerList,
      suggestions: Object.fromEntries(suggestionEntries),
    };
  },
  'Could not load hospital registrations.',
);

export const approveRegistration = run(
  'approveRegistration',
  async (id) => ({ id, credentials: dataOf(await Hospitals.approve(id), null) }),
  'Could not approve the hospital registration.',
);

export const rejectRegistration = run(
  'rejectRegistration',
  async ({ id, reason }) => {
    await Hospitals.rejectFinal(id, reason);
    return { id };
  },
  'Could not reject the hospital registration.',
);

export const assignManager = run(
  'assignManager',
  async ({ id, managerId }) => {
    await Hospitals.assignManager(id, managerId);
    return { id, managerId };
  },
  'Could not assign the regional officer.',
);

export const fetchAllPatients = run(
  'fetchAllPatients',
  async () => dataOf(await Patients.getAll(), []),
  'Could not load patients.',
);

export const fetchAllUsers = run(
  'fetchAllUsers',
  async () => dataOf(await Users.getAll(), []),
  'Could not load users.',
);

export const createUser = run(
  'createUser',
  async (payload) => dataOf(await Users.create(payload), payload),
  'Could not create the user.',
);

export const updateUser = run(
  'updateUser',
  async ({ id, data }) => dataOf(await Users.update(id, data), { id, ...data }),
  'Could not update the user.',
);

export const deleteUser = run(
  'deleteUser',
  async (id) => {
    await Users.delete(id);
    return id;
  },
  'Could not delete the user.',
);

export const fetchSystemSettings = run(
  'fetchSystemSettings',
  async () => dataOf(await System.getSettings(), null),
  'Could not load system settings.',
);

export const updateSystemSettings = run(
  'updateSystemSettings',
  async (settings) => dataOf(await System.updateSettings(settings), settings),
  'Could not save system settings.',
);

export const fetchSuFeedback = run(
  'fetchFeedback',
  async () => {
    const [feedback, hospitals] = await Promise.all([
      Feedback.getAll(),
      Hospitals.getAll(),
    ]);
    const names = Object.fromEntries(
      dataOf(hospitals, []).map((hospital) => [hospital.id, hospital.name]),
    );
    return dataOf(feedback, []).map((item) => ({
      ...item,
      hospitalName: names[item.hospitalId] || item.hospitalName || item.hospitalId || 'Unknown Hospital',
    }));
  },
  'Could not load feedback.',
);

export const deleteFeedback = run(
  'deleteFeedback',
  async (id) => {
    await Feedback.delete(id);
    return id;
  },
  'Could not delete feedback.',
);

export const fetchPlatformRevenue = run(
  'fetchPlatformRevenue',
  async () => {
    const [overview, streams, trend, regions, hospitalPlans, hospitalSubs, patientPlans, patientSubs, fees] =
      await Promise.all([
        Revenue.getPlatformOverview(),
        Revenue.getPlatformStreams(),
        Revenue.getPlatformTrend(6),
        Revenue.getRegionalOfficerOverview(),
        Revenue.getHospitalPlans(),
        Revenue.getHospitalSubscriptions(),
        Revenue.getPatientPlans(),
        Revenue.getPatientSubscriptions(),
        Revenue.getFees(),
      ]);
    return {
      overview: dataOf(overview, null),
      streams: dataOf(streams, null),
      trend: dataOf(trend, []),
      regions: dataOf(regions, null),
      hospitalPlans: dataOf(hospitalPlans, []),
      hospitalSubs: dataOf(hospitalSubs, []),
      patientPlans: dataOf(patientPlans, []),
      patientSubs: dataOf(patientSubs, []),
      fees: dataOf(fees, null),
    };
  },
  'Could not load platform revenue.',
);

export const updatePricingRates = run(
  'updatePricingRates',
  async (changes) => dataOf(await Revenue.updateFees(changes), changes),
  'Could not update pricing rates.',
);

export const updateHospitalPlan = run(
  'updateHospitalPlan',
  async ({ planId, monthlyFee }) =>
    dataOf(await Revenue.updateHospitalPlan(planId, { monthlyFee }), { planId, monthlyFee }),
  'Could not update the hospital plan.',
);

export const updatePatientPlan = run(
  'updatePatientPlan',
  async ({ planId, monthlyFee }) =>
    dataOf(await Revenue.updatePatientPlan(planId, { monthlyFee }), { planId, monthlyFee }),
  'Could not update the patient plan.',
);

export const fetchReports = run(
  'fetchReports',
  async () => {
    const [users, activities, streams, trend, patientSubs, patientPlans, health,
      patients, feedback, hospitals, beds, trips] = await Promise.all([
      Users.getAll(),
      System.getRecentActivity(1000),
      Revenue.getPlatformStreams(),
      Revenue.getPlatformTrend(6),
      Revenue.getPatientSubscriptions(),
      Revenue.getPatientPlans(),
      System.getHealth(),
      Patients.getAll(),
      Feedback.getAll(),
      Hospitals.getAll(),
      Beds.getAll(),
      Ambulance.getAll(),
    ]);
    return {
      usage: {
        users: dataOf(users, []), activities: dataOf(activities, []),
        streams: dataOf(streams, null), trend: dataOf(trend, []),
        patSubs: dataOf(patientSubs, []), patPlans: dataOf(patientPlans, []),
      },
      performance: { health: dataOf(health, null) },
      operational: {
        patients: dataOf(patients, []), feedback: dataOf(feedback, []),
        hospitals: dataOf(hospitals, []), beds: dataOf(beds, []), trips: dataOf(trips, []),
      },
      security: { available: true, activities: dataOf(activities, []) },
    };
  },
  'Could not load reports.',
);

const initialState = {
  dashboard: { stats: null, activity: [], loading: false, error: null },
  registrations: { list: [], officers: [], suggestions: {}, credentials: null, loading: false, error: null },
  patients: { list: [], loading: false, error: null },
  users: { list: [], loading: false, error: null },
  settings: { config: null, loading: false, error: null },
  feedback: { list: [], loading: false, error: null },
  revenue: { data: null, tab: 'streams', loading: false, error: null },
  reports: { data: null, loading: false, error: null },
};

const requestGroups = [
  [fetchSuDashboard, 'dashboard'],
  [fetchRegistrations, 'registrations'],
  [fetchAllPatients, 'patients'],
  [fetchAllUsers, 'users'],
  [fetchSystemSettings, 'settings'],
  [fetchSuFeedback, 'feedback'],
  [fetchPlatformRevenue, 'revenue'],
  [fetchReports, 'reports'],
];

const superuserSlice = createSlice({
  name: 'superuser',
  initialState,
  reducers: {
    setRevenueTab: (state, action) => {
      state.revenue.tab = action.payload;
    },
  },
  extraReducers: (builder) => {
    requestGroups.forEach(([thunk, group]) => {
      builder
        .addCase(thunk.pending, (state) => {
          state[group].loading = true;
          state[group].error = null;
        })
        .addCase(thunk.rejected, (state, action) => {
          state[group].loading = false;
          state[group].error = action.payload || action.error.message;
        });
    });

    builder
      .addCase(fetchSuDashboard.fulfilled, (state, action) => {
        state.dashboard.stats = action.payload.stats;
        state.dashboard.activity = action.payload.activity;
        state.dashboard.loading = false;
      })
      .addCase(fetchRegistrations.fulfilled, (state, action) => {
        state.registrations.list = action.payload.list;
        state.registrations.officers = action.payload.officers;
        state.registrations.suggestions = action.payload.suggestions;
        state.registrations.loading = false;
      })
      .addCase(approveRegistration.fulfilled, (state, action) => {
        state.registrations.credentials = action.payload.credentials;
      })
      .addCase(assignManager.fulfilled, (state, action) => {
        const hospital = state.registrations.list.find((item) => item.id === action.payload.id);
        if (hospital) hospital.assignedManagerId = action.payload.managerId;
      })
      .addCase(fetchAllPatients.fulfilled, (state, action) => {
        state.patients.list = action.payload;
        state.patients.loading = false;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.users.list = action.payload;
        state.users.loading = false;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.list.push(action.payload);
        state.users.loading = false;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.list.findIndex((user) => user.id === action.payload.id);
        if (index >= 0) state.users.list[index] = { ...state.users.list[index], ...action.payload };
        state.users.loading = false;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users.list = state.users.list.filter((user) => user.id !== action.payload);
        state.users.loading = false;
      })
      .addCase(fetchSystemSettings.fulfilled, (state, action) => {
        state.settings.config = action.payload;
        state.settings.loading = false;
      })
      .addCase(updateSystemSettings.fulfilled, (state, action) => {
        state.settings.config = action.payload;
        state.settings.loading = false;
      })
      .addCase(fetchSuFeedback.fulfilled, (state, action) => {
        state.feedback.list = action.payload;
        state.feedback.loading = false;
      })
      .addCase(deleteFeedback.fulfilled, (state, action) => {
        state.feedback.list = state.feedback.list.filter((item) => item.id !== action.payload);
        state.feedback.loading = false;
      })
      .addCase(fetchPlatformRevenue.fulfilled, (state, action) => {
        state.revenue.data = action.payload;
        state.revenue.loading = false;
      })
      .addCase(updatePricingRates.fulfilled, (state, action) => {
        if (state.revenue.data) state.revenue.data.fees = action.payload;
        state.revenue.loading = false;
      })
      .addCase(updateHospitalPlan.fulfilled, (state, action) => {
        if (state.revenue.data) {
          const plan = state.revenue.data.hospitalPlans.find((item) => item.id === action.payload.planId);
          if (plan) plan.monthlyFee = action.payload.monthlyFee;
        }
      })
      .addCase(updatePatientPlan.fulfilled, (state, action) => {
        if (state.revenue.data) {
          const plan = state.revenue.data.patientPlans.find((item) => item.id === action.payload.planId);
          if (plan) plan.monthlyFee = action.payload.monthlyFee;
        }
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.reports.data = action.payload;
        state.reports.loading = false;
      });
  },
});

export const { setRevenueTab } = superuserSlice.actions;
export const selectSuperuser = (state) => state.superuser;
export const selectSuDashboard = (state) => state.superuser.dashboard;
export const selectRegistrations = (state) => state.superuser.registrations;
export const selectAllPatients = (state) => state.superuser.patients;
export const selectAllUsers = (state) => state.superuser.users;
export const selectSystemSettings = (state) => state.superuser.settings;
export const selectSuFeedback = (state) => state.superuser.feedback;
export const selectPlatformRevenue = (state) => state.superuser.revenue;
export const selectReports = (state) => state.superuser.reports;

export default superuserSlice.reducer;
