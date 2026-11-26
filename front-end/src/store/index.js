import { combineReducers, configureStore } from '@reduxjs/toolkit';
import auth, { logoutUser, sessionCleared } from './authSlice';
import toast from './toastSlice';
import ui from './uiSlice';
import patient from './patientSlice';
import patientRecords from './patientRecordsSlice';
import hospitalManager from './hospitalManagerSlice';
import ambulance from './ambulanceSlice';
import regionalOfficer from './regionalOfficerSlice';
import superuser from './superuserSlice';
import layout from './layoutSlice';
import notifications from './notificationsSlice';
import activity from './activitySlice';
import hierarchy from './hierarchySlice';
import doctor from './doctorSlice';
import staff from './staffSlice';

export const appReducer = combineReducers({
  auth, doctor, staff, notifications, toast, ui, patient, patientRecords,
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
