import { useCallback, useEffect, useRef } from 'react';
import { ConfirmDialog } from '../components/ui';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  hideConfirmDialog,
  selectConfirmDialog,
  showConfirmDialog,
} from '../store/uiSlice';

let nextOwnerId = 0;

// `if (!confirm('…')) return;` as a promise: `if (!(await ask('…'))) return;`.
// Render `dialog` once somewhere in the page. The pages that used window
// prompts keep their one-line flow; the dialog is the shared ConfirmDialog.
export default function useConfirm() {
  const dispatch = useAppDispatch();
  const state = useAppSelector(selectConfirmDialog);
  const ownerIdRef = useRef(null);
  const resolveRef = useRef(null);
  const optionsRef = useRef({});
  if (ownerIdRef.current === null) ownerIdRef.current = `confirm-${++nextOwnerId}`;
  const ownerId = ownerIdRef.current;
  const ownsDialog = state.open && state.ownerId === ownerId;

  const ask = useCallback((message, opts = {}) => {
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
    optionsRef.current = opts;

    dispatch(showConfirmDialog({
      title: opts.title || 'Are you sure?',
      message,
      ownerId,
    }));

    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, [dispatch, ownerId]);

  const settle = useCallback((answer) => {
    if (!ownsDialog) return;
    const resolve = resolveRef.current;
    resolveRef.current = null;
    optionsRef.current = {};
    dispatch(hideConfirmDialog(ownerId));
    resolve?.(answer);
  }, [dispatch, ownerId, ownsDialog]);

  useEffect(() => () => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    dispatch(hideConfirmDialog(ownerId));
  }, [dispatch, ownerId]);

  const dialog = (
    <ConfirmDialog
      open={ownsDialog}
      title={state.title}
      message={state.message}
      confirmLabel={optionsRef.current.confirmLabel || 'OK'}
      danger={optionsRef.current.danger}
      onCancel={() => settle(false)}
      onConfirm={() => settle(true)}
    />
  );

  return { ask, dialog };
}
