import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { requestState, thunk, track } from './repositoryState';
import { Auth } from '../api';
import { clearAuthToken, getAuthToken, UNAUTHORIZED_EVENT } from '../api/client';
import { isExpired, parseJwtPayload } from '../utils/jwt';
import { normalizeRole } from '../utils/roles';

const USER_KEY = 'nexcare_user_data';
const ROLE_KEY = 'nexcare_current_role';
const EMAIL_KEY = 'nexcare_user_email';
const LEGACY_LOCAL_KEYS = ['nexcare_patients', 'nexcare_db_v3'];

export function wipeSession() {
  try {
    sessionStorage.clear();
  } catch {
    // Storage can be unavailable in private browsing; the in-memory state still resets.
  }
  clearAuthToken();
  LEGACY_LOCAL_KEYS.forEach((key) => localStorage.removeItem(key));
}

function validPayload() {
  const token = getAuthToken();
  if (!token) return null;
  const payload = parseJwtPayload(token);
  if (!payload) return null;
  if (isExpired(payload)) {
    wipeSession();
    return null;
  }
  return payload;
}

export function readStoredUser() {
  const payload = validPayload();
  if (!payload) return null;
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    if (raw) {
      const user = JSON.parse(raw);
      if (user && user.id) return { ...user, role: normalizeRole(user.role || payload.role) };
    }
  } catch {
    // Fall through to the JWT claims when cached user data is malformed.
  }
  return {
    id: payload.sub,
    name: payload.name,
    email: payload.email,
    role: normalizeRole(payload.role),
    patientId: payload.patientId,
    hospitalId: payload.hospitalId,
  };
}

const makeInitialState = () => {
  const user = readStoredUser();
  return {
    user,
    doctorProfile: requestState({ data: null }),
    role: user?.role || null,
    isLoggedIn: Boolean(user),
    loading: false,
    error: null,
  };
};

export const loginUser = createAsyncThunk('auth/loginUser', async ({ email, password, role }) => {
  const res = await Auth.login(email, password, role);
  const user = res.data?.user;
  if (!user) throw new Error('Login succeeded but no user was returned');
  const stored = { ...user, role: normalizeRole(user.role || role) };
  sessionStorage.setItem('isLoggedIn', 'true');
  sessionStorage.setItem(ROLE_KEY, stored.role);
  sessionStorage.setItem(EMAIL_KEY, email);
  sessionStorage.setItem(USER_KEY, JSON.stringify(stored));
  return stored;
});

export const logoutUser = createAsyncThunk('auth/logoutUser', async (_, { getState }) => {
  try {
    await Auth.logout(getState().auth.user?.id);
  } catch {
    // The local session must still be removed when the backend is unavailable.
  } finally {
    wipeSession();
  }
});

export const fetchDoctorProfile = thunk(
  'auth/fetchProfile',
  async (userId) => (await Auth.getCurrentUser(userId))?.data || null,
  'Could not load your profile',
);

export const changePassword = createAsyncThunk('auth/changePassword', async ({ current, next }) => {
  await Auth.changePassword(current, next);
});

export const checkSession = createAsyncThunk('auth/checkSession', async () => readStoredUser());

export const updateSessionUser = (patch) => (dispatch, getState) => {
  const user = selectUser(getState());
  if (!user) return;
  sessionStorage.setItem(USER_KEY, JSON.stringify({ ...user, ...patch }));
  dispatch(userUpdated(patch));
};

function clearAuthState(state) {
  state.user = null;
  state.role = null;
  state.isLoggedIn = false;
  state.loading = false;
  state.error = null;
}

export const authSlice = createSlice({
  name: 'auth',
  initialState: makeInitialState,
  reducers: {
    sessionCleared: clearAuthState,
    userUpdated: (state, action) => {
      if (state.user) state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    track(builder, fetchDoctorProfile, (s) => s.doctorProfile, (s, data) => { s.data = data; });
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.role = action.payload.role;
        state.isLoggedIn = true;
        state.loading = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, clearAuthState)
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Logout failed';
      })
      .addCase(checkSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.role = action.payload?.role || null;
        state.isLoggedIn = Boolean(action.payload);
      });
  },
});

export const { sessionCleared, userUpdated } = authSlice.actions;
export const selectUser = (state) => state.auth.user;
export const selectRole = (state) => state.auth.role;
export const selectIsLoggedIn = (state) => state.auth.isLoggedIn;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export { UNAUTHORIZED_EVENT };
export default authSlice.reducer;

export const selectDoctorProfile = (state) => state.auth.doctorProfile;
