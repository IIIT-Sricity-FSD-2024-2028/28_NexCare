import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Auth } from '../api';

const errorPayload = (error, fallback) => ({
  message: error?.message || fallback,
  status: error?.status,
});

const emptyAuthForm = () => ({ loading: false, error: null, requestId: null });

const emptyPatientRegister = () => ({
  fields: {
    fullName: '', email: '', phone: '', city: '', pincode: '', password: '', confirmPassword: '',
  },
  message: { text: '', tone: 'error' },
  redirecting: false,
  busyLabel: 'Creating account…',
});

const emptyStaffRegister = () => ({
  fields: {
    fullName: '', email: '', phone: '', role: '', specialization: '', registrationNo: '',
    consultationFee: '', hospitalId: '', department: '', password: '', confirmPassword: '',
  },
  message: { text: '', tone: 'error' },
  redirecting: false,
  busyLabel: 'Creating account…',
});

export const registerPatient = createAsyncThunk(
  'ui/registerPatient',
  async (payload, { rejectWithValue }) => {
    try {
      return await Auth.register(payload);
    } catch (error) {
      return rejectWithValue(errorPayload(error, 'Registration failed. Please try again.'));
    }
  },
);

export const registerStaff = createAsyncThunk(
  'ui/registerStaff',
  async (payload, { rejectWithValue }) => {
    try {
      return await Auth.registerStaff(payload);
    } catch (error) {
      return rejectWithValue(errorPayload(error, 'Registration failed. Please try again.'));
    }
  },
);

export const verifyForgotPassword = createAsyncThunk(
  'ui/verifyForgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      return await Auth.forgotPasswordVerify(email);
    } catch (error) {
      return rejectWithValue(errorPayload(error, 'No account found with this email address.'));
    }
  },
);

export const resetForgotPassword = createAsyncThunk(
  'ui/resetForgotPassword',
  async ({ email, newPassword }, { rejectWithValue }) => {
    try {
      return await Auth.forgotPasswordReset(email, newPassword);
    } catch (error) {
      return rejectWithValue(errorPayload(error, 'Password reset failed. Please try again.'));
    }
  },
);

const initialState = {
  sidebarOpen: true,
  activeModal: null,
  confirmDialog: {
    open: false,
    title: '',
    message: '',
    ownerId: null,
  },
  authForms: {
    registerPatient: emptyAuthForm(),
    registerStaff: emptyAuthForm(),
    verifyForgotPassword: emptyAuthForm(),
    resetForgotPassword: emptyAuthForm(),
  },
  loginForm: { email: '', password: '', role: '', error: '' },
  changePasswordForm: { current: '', next: '', confirm: '', alert: null },
  forgotPassword: {
    step: 1,
    email: '',
    newPwd: '',
    confirmPwd: '',
    showNew: false,
    showConfirm: false,
    error: '',
    confirmError: false,
  },
  patientRegister: emptyPatientRegister(),
  staffRegister: emptyStaffRegister(),
};

function bindAuthForm(builder, thunk, key, extras = {}) {
  builder
    .addCase(thunk.pending, (state, action) => {
      state.authForms[key].loading = true;
      state.authForms[key].error = null;
      state.authForms[key].requestId = action.meta.requestId;
    })
    .addCase(thunk.fulfilled, (state, action) => {
      if (state.authForms[key].requestId !== action.meta.requestId) return;
      state.authForms[key].loading = false;
      state.authForms[key].requestId = null;
      extras.onFulfilled?.(state, action);
    })
    .addCase(thunk.rejected, (state, action) => {
      if (state.authForms[key].requestId !== action.meta.requestId) return;
      state.authForms[key].loading = false;
      state.authForms[key].error = action.payload;
      state.authForms[key].requestId = null;
      extras.onRejected?.(state, action);
    });
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    openModal(state, action) {
      state.activeModal = action.payload;
    },
    closeModal(state) {
      state.activeModal = null;
    },
    showConfirmDialog(state, action) {
      state.confirmDialog = {
        open: true,
        title: action.payload?.title || '',
        message: action.payload?.message || '',
        ownerId: action.payload?.ownerId || null,
      };
    },
    hideConfirmDialog(state, action) {
      if (action.payload && state.confirmDialog.ownerId !== action.payload) return;
      state.confirmDialog = initialState.confirmDialog;
    },
    setLoginField(state, action) {
      const { key, value } = action.payload;
      if (Object.hasOwn(state.loginForm, key)) state.loginForm[key] = value;
    },
    setLoginError(state, action) {
      state.loginForm.error = action.payload || '';
    },
    setChangePasswordField(state, action) {
      const { key, value } = action.payload;
      if (Object.hasOwn(state.changePasswordForm, key)) state.changePasswordForm[key] = value;
    },
    setChangePasswordAlert(state, action) {
      state.changePasswordForm.alert = action.payload;
    },
    setForgotField(state, action) {
      const { key, value } = action.payload;
      if (Object.hasOwn(state.forgotPassword, key)) state.forgotPassword[key] = value;
    },
    toggleForgotVisibility(state, action) {
      const key = action.payload;
      if (key === 'showNew' || key === 'showConfirm') state.forgotPassword[key] = !state.forgotPassword[key];
    },
    setForgotError(state, action) {
      state.forgotPassword.error = action.payload || '';
    },
    setForgotConfirmError(state, action) {
      state.forgotPassword.confirmError = Boolean(action.payload);
    },
    setPatientRegisterField(state, action) {
      const { key, value } = action.payload;
      if (Object.hasOwn(state.patientRegister.fields, key)) state.patientRegister.fields[key] = value;
    },
    setPatientRegisterMessage(state, action) {
      state.patientRegister.message = action.payload;
    },
    setPatientRegisterStatus(state, action) {
      if (action.payload.busyLabel !== undefined) state.patientRegister.busyLabel = action.payload.busyLabel;
      if (action.payload.redirecting !== undefined) state.patientRegister.redirecting = action.payload.redirecting;
    },
    setStaffRegisterField(state, action) {
      const { key, value } = action.payload;
      if (Object.hasOwn(state.staffRegister.fields, key)) state.staffRegister.fields[key] = value;
    },
    setStaffRegisterMessage(state, action) {
      state.staffRegister.message = action.payload;
    },
    setStaffRegisterStatus(state, action) {
      if (action.payload.busyLabel !== undefined) state.staffRegister.busyLabel = action.payload.busyLabel;
      if (action.payload.redirecting !== undefined) state.staffRegister.redirecting = action.payload.redirecting;
    },
  },
  extraReducers: (builder) => {
    bindAuthForm(builder, registerPatient, 'registerPatient');
    bindAuthForm(builder, registerStaff, 'registerStaff');
    bindAuthForm(builder, verifyForgotPassword, 'verifyForgotPassword', {
      onFulfilled: (state) => {
        state.forgotPassword.step = 2;
        state.forgotPassword.error = '';
      },
      onRejected: (state, action) => {
        const payload = action.payload;
        state.forgotPassword.error = payload?.status === 0
          ? 'Unable to reach NexCare server. Please try again.'
          : payload?.message || 'No account found with this email address.';
      },
    });
    bindAuthForm(builder, resetForgotPassword, 'resetForgotPassword', {
      onFulfilled: (state) => {
        state.forgotPassword.step = 3;
        state.forgotPassword.error = '';
      },
      onRejected: (state, action) => {
        const payload = action.payload;
        state.forgotPassword.error = payload?.status === 0
          ? 'Unable to reach NexCare server. Please try again.'
          : payload?.message || 'Password reset failed. Please try again.';
      },
    });
  },
});

export const {
  toggleSidebar,
  openModal,
  closeModal,
  showConfirmDialog,
  hideConfirmDialog,
  setLoginField,
  setLoginError,
  setChangePasswordField,
  setChangePasswordAlert,
  setForgotField,
  toggleForgotVisibility,
  setForgotError,
  setForgotConfirmError,
  setPatientRegisterField,
  setPatientRegisterMessage,
  setPatientRegisterStatus,
  setStaffRegisterField,
  setStaffRegisterMessage,
  setStaffRegisterStatus,
} = uiSlice.actions;

export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectActiveModal = (state) => state.ui.activeModal;
export const selectConfirmDialog = (state) => state.ui.confirmDialog;
export const selectRegisterPatient = (state) => state.ui.authForms.registerPatient;
export const selectRegisterStaff = (state) => state.ui.authForms.registerStaff;
export const selectVerifyForgotPassword = (state) => state.ui.authForms.verifyForgotPassword;
export const selectResetForgotPassword = (state) => state.ui.authForms.resetForgotPassword;
export const selectLoginForm = (state) => state.ui.loginForm;
export const selectChangePasswordForm = (state) => state.ui.changePasswordForm;
export const selectForgotPassword = (state) => state.ui.forgotPassword;
export const selectPatientRegister = (state) => state.ui.patientRegister;
export const selectStaffRegister = (state) => state.ui.staffRegister;

export default uiSlice.reducer;
