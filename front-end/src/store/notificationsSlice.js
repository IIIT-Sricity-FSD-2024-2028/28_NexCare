import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Notifications } from '../api';

const message = (error, fallback) => error?.message || fallback;

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchList',
  async (_, { rejectWithValue }) => {
    try {
      const response = await Notifications.list();
      return Array.isArray(response?.data) ? response.data.slice(0, 15) : [];
    } catch (error) {
      return rejectWithValue(message(error, 'Could not load notifications.'));
    }
  },
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await Notifications.unreadCount();
      return Number(response?.data?.unreadCount) || 0;
    } catch (error) {
      return rejectWithValue(message(error, 'Could not load unread notification count.'));
    }
  },
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (id, { rejectWithValue }) => {
    try {
      await Notifications.markRead(id);
      return id;
    } catch (error) {
      return rejectWithValue(message(error, 'Could not mark notification as read.'));
    }
  },
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await Notifications.markAllRead();
      return true;
    } catch (error) {
      return rejectWithValue(message(error, 'Could not mark notifications as read.'));
    }
  },
);

const initialState = {
  list: [],
  unreadCount: 0,
  listLoading: false,
  unreadLoading: false,
  listError: null,
  unreadError: null,
  actionError: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.list = action.payload;
        state.listLoading = false;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload || action.error.message;
      })
      .addCase(fetchUnreadCount.pending, (state) => {
        state.unreadLoading = true;
        state.unreadError = null;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
        state.unreadLoading = false;
      })
      .addCase(fetchUnreadCount.rejected, (state, action) => {
        state.unreadLoading = false;
        state.unreadError = action.payload || action.error.message;
      })
      .addCase(markNotificationRead.pending, (state) => {
        state.actionError = null;
      })
      .addCase(markNotificationRead.rejected, (state, action) => {
        state.actionError = action.payload || action.error.message;
      })
      .addCase(markAllNotificationsRead.pending, (state) => {
        state.actionError = null;
      })
      .addCase(markAllNotificationsRead.rejected, (state, action) => {
        state.actionError = action.payload || action.error.message;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const notification = state.list.find((item) => item.id === action.payload);
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.list.forEach((notification) => { notification.read = true; });
        state.unreadCount = 0;
      });
  },
});

export const selectNotifications = (state) => state.notifications;
export default notificationsSlice.reducer;
