// Dialogs.jsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setModalOpen, removeNotification } from '../../store/slices/uiSlice';
import ConfirmDialog from './ConfirmDialog';

/**
 * Generic Modal Dialog component powered by uiSlice
 */
export const Modal = ({ name, title, children, maxWidth = 'max-w-lg' }) => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => !!state.ui.activeModals[name]);

  if (!isOpen) return null;

  const handleClose = () => {
    dispatch(setModalOpen({ modalName: name, isOpen: false }));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
    >
      <div className={`relative w-full ${maxWidth} rounded-xl bg-white p-6 shadow-2xl transition-all`}>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1 text-sm inline-flex items-center"
          >
            <span className="sr-only">Close modal</span>
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};

/**
 * Toast Container component powered by uiSlice.notifications
 */
export const ToastContainer = () => {
  const dispatch = useDispatch();
  const notifications = useSelector((state) => state.ui.notifications || []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
      {notifications.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';

        const bgClass = isError
          ? 'bg-red-600 text-white'
          : isSuccess
          ? 'bg-green-600 text-white'
          : isWarning
          ? 'bg-yellow-500 text-black'
          : 'bg-gray-800 text-white';

        return (
          <div
            key={toast.id}
            className={`flex items-center justify-between rounded-lg px-4 py-3 shadow-lg ${bgClass} transition-all`}
          >
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => dispatch(removeNotification(toast.id))}
              className="ml-3 text-sm font-bold opacity-75 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Poornasri's UI Dialogs Kit bundle
 */
export const Dialogs = {
  Confirm: ConfirmDialog,
  Modal,
  Toasts: ToastContainer,
};

export default Dialogs;

