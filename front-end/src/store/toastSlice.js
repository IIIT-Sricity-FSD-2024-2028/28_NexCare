import { createSlice, nanoid } from '@reduxjs/toolkit';

const toastSlice = createSlice({
  name: 'toast',
  initialState: { notifications: [] },
  reducers: {
    addToast: {
      reducer: (state, action) => {
        state.notifications.push(action.payload);
      },
      prepare: ({ message, type = 'info', duration = 3500 }) => ({
        payload: {
          id: nanoid(),
          message: String(message ?? ''),
          type: ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info',
          duration,
          show: false,
        },
      }),
    },
    hideToast: (state, action) => {
      const toast = state.notifications.find((item) => item.id === action.payload);
      if (toast) toast.show = false;
    },
    removeToast: (state, action) => {
      state.notifications = state.notifications.filter((item) => item.id !== action.payload);
    },
    showToast: (state, action) => {
      const toast = state.notifications.find((item) => item.id === action.payload);
      if (toast) toast.show = true;
    },
  },
});

export const { addToast, hideToast, removeToast, showToast } = toastSlice.actions;
export const selectNotifications = (state) => state.toast.notifications;
export default toastSlice.reducer;
