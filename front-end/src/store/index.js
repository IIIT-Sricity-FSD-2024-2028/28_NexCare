import { combineReducers, configureStore } from '@reduxjs/toolkit';
import auth, { logoutUser, sessionCleared } from './authSlice';
import toast from './toastSlice';
import ui from './uiSlice';
import patient from './patientSlice';
import doctor from './doctorSlice';
import staff from './staffSlice';
import hospitalManager from './hospitalManagerSlice';
import ambulance from './ambulanceSlice';
import regionalOfficer from './regionalOfficerSlice';
import superuser from './superuserSlice';
import layout from './layoutSlice';
import notifications from './notificationsSlice';
import activity from './activitySlice';
import hierarchy from './hierarchySlice';

export const appReducer = combineReducers({
  auth, toast, ui, patient, doctor, staff, hospitalManager, ambulance, regionalOfficer, superuser,
  layout, notifications, activity, hierarchy,
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
