import { combineReducers, configureStore } from '@reduxjs/toolkit';
import auth, { logoutUser, sessionCleared } from './authSlice';
import { usersReducer, hospitalsReducer } from './directorySlices';
import checkins from './checkinsSlice';
import uploads from './uploadsSlice';
import toast from './toastSlice';
import ui from './uiSlice';
import patient from './patientSlice';
import patientRecords from './patientRecordsSlice';
import appointments from './appointmentsSlice';
import leaves from './leavesSlice';
import revenue from './revenueSlice';
import beds from './bedsSlice';
import inventory from './inventorySlice';
import schedules from './schedulesSlice';
import feedback from './feedbackSlice';
import billing from './billingSlice';
import hospitalManager from './hospitalManagerSlice';
import ambulance from './ambulanceSlice';
import regionalOfficer from './regionalOfficerSlice';
import superuser from './superuserSlice';
import layout from './layoutSlice';
import notifications from './notificationsSlice';
import activity from './activitySlice';
import hierarchy from './hierarchySlice';

export const appReducer = combineReducers({
  auth, users: usersReducer, hospitals: hospitalsReducer, notifications, uploads, checkins, toast, ui, patient, patientRecords,
  appointments, leaves, revenue, beds, inventory, schedules, feedback, billing,
  hospitalManager, ambulance, regionalOfficer, superuser, layout, activity, hierarchy,
});

export const resetActions = [logoutUser.fulfilled.type, sessionCleared.type];
export const rootReducer = (state, action) =>
  appReducer(resetActions.includes(action.type) ? undefined : state, action);

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: true,
      serializableCheck: true,
    }),
});
export default store;
