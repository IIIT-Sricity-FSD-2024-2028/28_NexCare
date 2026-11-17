// store/index.js
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import roReducer from './slices/roSlice';

// Combine reducers
const appReducer = combineReducers({
  ui: uiReducer,
  ro: roReducer,
  // Placeholder slices registered in Phase 0 to avoid merge conflicts (Rule #3)
  auth: (state = { user: null, isAuthenticated: false, loading: false }, action) => state,
  hm: (state = { counts: {}, registered: [], modals: {} }, action) => state,
  su: (state = { users: [], logs: [] }, action) => state,
  ambulance: (state = { requests: [], activeRequest: null }, action) => state,
  patient: (state = { records: [], appointments: [] }, action) => state,
});

/**
 * Root Reducer with Logout Reset (Rule #4)
 * When 'auth/logout' or 'RESET_APP' is dispatched, reset the entire Redux state
 * so previous user data doesn't leak into subsequent sessions.
 */
const rootReducer = (state, action) => {
  if (action.type === 'auth/logout' || action.type === 'RESET_APP') {
    // Preserve ui notifications or reset all except non-persisted UI if needed
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Enforces Rule #8 across all actions and slices
        warnAfter: 64,
      },
    }),
});

export default store;

