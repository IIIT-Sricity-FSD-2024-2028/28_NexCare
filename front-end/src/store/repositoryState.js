import { createAsyncThunk } from '@reduxjs/toolkit';

export const msg = (error, fallback) => error?.message || fallback;
export const asList = (response) => Array.isArray(response?.data) ? response.data : [];
export const requestState = (data) => ({ ...data, loading: false, error: null });

export const thunk = (type, call, fallback) =>
  createAsyncThunk(type, async (arg, { getState, rejectWithValue }) => {
    try {
      return await call(arg, getState().auth.user?.hospitalId || '');
    } catch (error) {
      return rejectWithValue(msg(error, fallback));
    }
  });

export function track(builder, action, select, apply) {
  builder
    .addCase(action.pending, (state) => {
      Object.assign(select(state), { loading: true, error: null });
    })
    .addCase(action.rejected, (state, { payload, error }) => {
      const target = select(state);
      Object.assign(target, { loading: false, error: payload ?? error.message });
      if ('loaded' in target) target.loaded = true;
    })
    .addCase(action.fulfilled, (state, { payload }) => {
      const target = select(state);
      target.loading = false;
      apply(target, payload);
    });
}

export function upsert(list, row) {
  if (!row?.id) return;
  const index = list.findIndex((item) => item.id === row.id);
  if (index < 0) list.unshift(row);
  else list[index] = row;
}
