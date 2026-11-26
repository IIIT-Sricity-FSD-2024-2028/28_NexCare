import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Notifications } from '../api';
import { asList } from './repositoryState';

export const fetchUnread = createAsyncThunk('notifications/unread', async () =>
  (await Notifications.unreadCount()).data?.unreadCount || 0);
export const fetchNotifications = createAsyncThunk('notifications/read', async () =>
  asList(await Notifications.list()).slice(0, 15));

export const markNotificationRead = createAsyncThunk('notifications/markRead', async (id, { dispatch }) => {
  await Notifications.markRead(id);
  dispatch(fetchUnread());
  return id;
});

export const markAllNotificationsRead = createAsyncThunk('notifications/markAllRead', async (_, { dispatch }) => {
  await Notifications.markAllRead();
  dispatch(fetchUnread());
  dispatch(fetchNotifications());
});

export default createSlice({
  name: 'notifications',
  initialState: { unread: 0, items: null, error: false },
  reducers: {},
  extraReducers: (builder) => builder
    .addCase(fetchUnread.fulfilled, (state, { payload }) => { state.unread = payload; })
    .addCase(fetchNotifications.pending, (state) => { state.items = null; state.error = false; })
    .addCase(fetchNotifications.fulfilled, (state, { payload }) => { state.items = payload; })
    .addCase(fetchNotifications.rejected, (state) => { state.items = []; state.error = true; })
    .addCase(markNotificationRead.fulfilled, (state, { payload }) => {
      const item = state.items?.find((row) => row.id === payload);
      if (item) item.read = true;
    })
    .addCase(markAllNotificationsRead.fulfilled, (state) => {
      state.items?.forEach((item) => { item.read = true; });
    }),
}).reducer;
