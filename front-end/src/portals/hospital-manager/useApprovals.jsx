import { useState } from 'react';
import { Inventory, Leaves } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useHm } from './HmContext';
import { ReasonModal } from './hmShared';

// approveLeave / promptRejectLeave / openApprovalModal / promptRejectInventoryReq
// / executeRejection / executeApproval from dashboard.js — the decisions the
// Overview queue, the Leaves section and the Inventory Approvals section all
// offer. `onDone` is the section's reload; the context counters refresh too.
export default function useApprovals(onDone) {
  const { notify } = useToast();
  const { refresh } = useHm();
  const [modal, setModal] = useState(null); // { kind: 'reject-leave' | 'reject-req' | 'approve-req', id }
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const done = async () => { refresh(); if (onDone) await onDone(); };

  async function approveLeave(id) {
    try {
      await Leaves.approve(id);
      notify('Leave request approved successfully!', 'success');
      await done();
    } catch (err) {
      notify(err?.message || 'Error approving leave request', 'error');
    }
  }

  const open = (kind, id) => { setModal({ kind, id }); setText(''); };
  const close = () => setModal(null);

  async function confirm() {
    const value = text.trim();
    if (modal.kind !== 'approve-req' && !value) { notify('Please provide a rejection reason.', 'error'); return; }
    setBusy(true);
    try {
      if (modal.kind === 'reject-leave') {
        await Leaves.reject(modal.id, value);
        notify('Doctor leave request rejected with reason.', 'success');
      } else if (modal.kind === 'reject-req') {
        await Inventory.rejectRequirement(modal.id, value);
        notify('Inventory requirement rejected with reason.', 'success');
      } else {
        await Inventory.approveRequirement(modal.id, value);
        notify('Inventory requisition approved successfully! Passed to Admin Staff for purchasing.', 'success');
      }
      close();
      await done();
    } catch (err) {
      const fallback = modal.kind === 'approve-req' ? 'Error approving requirement' : 'Error executing rejection';
      notify(err?.message || fallback, 'error');
    } finally {
      setBusy(false);
    }
  }

  const dialogs = (
    <>
      <ReasonModal
        open={modal?.kind === 'reject-leave'}
        onClose={close}
        title="Reject Doctor Leave Request"
        prompt="Please provide a clear administrative reason for rejecting this doctor leave request:"
        placeholder="Enter specific reason for rejection..."
        confirmLabel="Confirm Rejection"
        danger
        required
        busy={busy}
        value={text}
        onChange={setText}
        onConfirm={confirm}
      />
      <ReasonModal
        open={modal?.kind === 'reject-req'}
        onClose={close}
        title="Reject Inventory Requisition"
        prompt="Please provide an administrative reason for rejecting this stock requirement:"
        placeholder="Enter specific reason for rejection..."
        confirmLabel="Confirm Rejection"
        danger
        required
        busy={busy}
        value={text}
        onChange={setText}
        onConfirm={confirm}
      />
      <ReasonModal
        open={modal?.kind === 'approve-req'}
        onClose={close}
        title="Approve Inventory Requirement"
        prompt="Confirm approval for this stock requisition request. You may optionally enter remarks for administrative staff:"
        label="Manager Remarks / Instructions (Optional)"
        placeholder="e.g. Approved. Please expedite delivery with approved vendor."
        confirmLabel="Approve Request"
        busy={busy}
        value={text}
        onChange={setText}
        onConfirm={confirm}
      />
    </>
  );

  return {
    approveLeave,
    rejectLeave: (id) => open('reject-leave', id),
    approveReq: (id) => open('approve-req', id),
    rejectReq: (id) => open('reject-req', id),
    dialogs,
  };
}
