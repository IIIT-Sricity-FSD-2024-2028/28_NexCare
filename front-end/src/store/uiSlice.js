import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: true,
  activeModal: null,
  confirmDialog: {
    open: false,
    title: '',
    message: '',
    ownerId: null,
  },
};

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
  },
});

export const {
  toggleSidebar,
  openModal,
  closeModal,
  showConfirmDialog,
  hideConfirmDialog,
} = uiSlice.actions;

export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectActiveModal = (state) => state.ui.activeModal;
export const selectConfirmDialog = (state) => state.ui.confirmDialog;

export default uiSlice.reducer;
