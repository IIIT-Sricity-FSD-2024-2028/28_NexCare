// useConfirm.js
import { useDispatch } from 'react-redux';
import { openConfirmDialog, closeConfirmDialog } from '../../store/slices/uiSlice';

// Module-level reference to hold promise resolution
// This guarantees that non-serializable functions (onConfirm, onCancel)
// are NEVER passed into or stored inside the Redux state (satisfying Rule #8).
let resolveCallback = null;

export const useConfirm = () => {
  const dispatch = useDispatch();

  const confirm = ({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'default', // 'default' | 'danger' | 'warning'
  } = {}) => {
    // If a string was passed directly: confirm('Are you sure?')
    const payload =
      typeof arguments[0] === 'string'
        ? { title: 'Confirm', message: arguments[0], confirmText: 'Confirm', cancelText: 'Cancel', type: 'default' }
        : { title, message, confirmText, cancelText, type };

    dispatch(openConfirmDialog(payload));

    return new Promise((resolve) => {
      resolveCallback = resolve;
    });
  };

  const handleConfirm = () => {
    if (typeof resolveCallback === 'function') {
      resolveCallback(true);
    }
    dispatch(closeConfirmDialog());
    resolveCallback = null;
  };

  const handleCancel = () => {
    if (typeof resolveCallback === 'function') {
      resolveCallback(false);
    }
    dispatch(closeConfirmDialog());
    resolveCallback = null;
  };

  return {
    confirm,
    handleConfirm,
    handleCancel,
  };
};

export default useConfirm;

