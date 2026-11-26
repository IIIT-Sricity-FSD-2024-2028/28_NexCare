import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Hierarchy } from '../api';

export const fetchHierarchy = createAsyncThunk(
  'hierarchy/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const [tree, scope] = await Promise.all([Hierarchy.getTree(), Hierarchy.getScope()]);
      return { tree: tree.data, scope: scope.data };
    } catch (error) {
      return rejectWithValue(error?.message || 'Could not load the hierarchy. Check that the backend is running.');
    }
  },
);

const initialState = { tree: null, scope: null, loading: false, error: null };

const hierarchySlice = createSlice({
  name: 'hierarchy',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHierarchy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHierarchy.fulfilled, (state, action) => {
        state.tree = action.payload.tree;
        state.scope = action.payload.scope;
        state.loading = false;
      })
      .addCase(fetchHierarchy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const selectHierarchy = (state) => state.hierarchy;
export default hierarchySlice.reducer;
