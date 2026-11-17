// uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  confirmDialog: {
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'default', // 'default' | 'danger' | 'warning'
  },
  activeModals: {},
  notifications: [],
  globalLoading: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openConfirmDialog: (state, action) => {
      const {
        title,
        message,
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        type = 'default',
      } = action.payload || {};

      state.confirmDialog = {
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        type,
      };
    },
    closeConfirmDialog: (state) => {
      state.confirmDialog.isOpen = false;
    },
    setModalOpen: (state, action) => {
      const { modalName, isOpen } = action.payload;
      state.activeModals[modalName] = isOpen;
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        type: action.payload.type || 'info',
        message: action.payload.message,
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },
  },
});

export const {
  openConfirmDialog,
  closeConfirmDialog,
  setModalOpen,
  addNotification,
  removeNotification,
  setGlobalLoading,
} = uiSlice.actions;

export default uiSlice.reducer;

