import { useCallback, useEffect, useRef } from 'react';
import { ConfirmDialog } from '../components/ui';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  hideConfirmDialog,
  selectConfirmDialog,
  showConfirmDialog,
} from '../store/uiSlice';

// `if (!confirm('…')) return;` as a promise: `if (!(await ask('…'))) return;`.
// Render `dialog` once somewhere in the page. The pages that used window
// prompts keep their one-line flow; the dialog is the shared ConfirmDialog.
export default function useConfirm() {
  const dispatch = useAppDispatch();
  const state = useAppSelector(selectConfirmDialog);
  const resolveRef = useRef(null);
  const optionsRef = useRef({});

  const ask = useCallback((message, opts = {}) => {
    if (resolveRef.current) resolveRef.current(false);
    optionsRef.current = opts;

    dispatch(showConfirmDialog({
      title: opts.title || 'Are you sure?',
      message,
    }));

    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, [dispatch]);

  const settle = useCallback((answer) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    optionsRef.current = {};
    dispatch(hideConfirmDialog());
    resolve?.(answer);
  }, [dispatch]);

  useEffect(() => () => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    dispatch(hideConfirmDialog());
  }, [dispatch]);

  const dialog = (
    <ConfirmDialog
      open={state.open}
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
