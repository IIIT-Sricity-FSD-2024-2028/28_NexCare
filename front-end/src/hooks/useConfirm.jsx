import { useCallback, useState } from 'react';
import { ConfirmDialog } from '../components/ui';

// `if (!confirm('…')) return;` as a promise: `if (!(await ask('…'))) return;`.
// Render `dialog` once somewhere in the page. The pages that used window
// prompts keep their one-line flow; the dialog is the shared ConfirmDialog.
export default function useConfirm() {
  const [state, setState] = useState(null);

  const ask = useCallback((message, opts = {}) => new Promise((resolve) => {
    setState({ message, ...opts, resolve });
  }), []);

  const settle = (answer) => {
    if (state) state.resolve(answer);
    setState(null);
  };

  const dialog = (
    <ConfirmDialog
      open={Boolean(state)}
      title={state?.title}
      message={state?.message}
      confirmLabel={state?.confirmLabel || 'OK'}
      danger={state?.danger}
      onCancel={() => settle(false)}
      onConfirm={() => settle(true)}
    />
  );

  return { ask, dialog };
}
