// ConfirmDialog.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { useConfirm } from './useConfirm';

/**
 * ConfirmDialog component
 * Part of Poornasri's UI kit.
 * Renders dynamically when uiSlice.confirmDialog.isOpen is true.
 */
export const ConfirmDialog = () => {
  const {
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'default',
  } = useSelector((state) => state.ui.confirmDialog);

  const { handleConfirm, handleCancel } = useConfirm();

  if (!isOpen) return null;

  const isDanger = type === 'danger';
  const isWarning = type === 'warning';

  let confirmBtnClasses = 'bg-blue-600 hover:bg-blue-700 text-white';
  if (isDanger) confirmBtnClasses = 'bg-red-600 hover:bg-red-700 text-white';
  if (isWarning) confirmBtnClasses = 'bg-yellow-500 hover:bg-yellow-600 text-black';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 transition-opacity backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 text-left shadow-2xl transition-all sm:my-8">
        <div className="flex items-start gap-4">
          {/* Icon based on type */}
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
              isDanger
                ? 'bg-red-100 text-red-600'
                : isWarning
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-blue-100 text-blue-600'
            }`}
          >
            {isDanger ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          <div className="flex-1">
            <h3
              id="confirm-dialog-title"
              className="text-lg font-semibold leading-6 text-gray-900"
            >
              {title}
            </h3>
            <div className="mt-2 text-sm text-gray-600">
              <p>{message}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmBtnClasses}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

