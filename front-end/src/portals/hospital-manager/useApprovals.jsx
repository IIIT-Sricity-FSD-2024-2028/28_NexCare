import { useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { addToast } from '../../store/toastSlice';
import {
  approveInventory,
  approveLeave as approveLeaveThunk,
  fetchHmOverview,
  rejectInventory,
  rejectLeave as rejectLeaveThunk,
} from '../../store/hospitalManagerSlice';
import { ReasonModal } from './hmShared';

// approveLeave / promptRejectLeave / openApprovalModal / promptRejectInventoryReq
// / executeRejection / executeApproval from dashboard.js — the decisions the
// Overview queue, the Leaves section and the Inventory Approvals section all
// offer. Each one dispatches the slice thunk (which updates the list and the
// sidebar counters) and then refreshes the overview, so the Overview queue and
// its stats agree with the section the decision was taken in.
const toast = (dispatch, message, type) => dispatch(addToast({ message, type }));
const messageOf = (err, fallback) => (typeof err === 'string' && err) || err?.message || fallback;

export default function useApprovals() {
  const dispatch = useAppDispatch();
  const [modal, setModal] = useState(null); // { kind: 'reject-leave' | 'reject-req' | 'approve-req', id }
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const done = () => dispatch(fetchHmOverview());

  async function approveLeave(id) {
    try {
      await dispatch(approveLeaveThunk(id)).unwrap();
      toast(dispatch, 'Leave request approved successfully!', 'success');
      await done();
    } catch (err) {
      toast(dispatch, messageOf(err, 'Error approving leave request'), 'error');
    }
  }

  const open = (kind, id) => { setModal({ kind, id }); setText(''); };
  const close = () => setModal(null);

  async function confirm() {
    const value = text.trim();
    if (modal.kind !== 'approve-req' && !value) { toast(dispatch, 'Please provide a rejection reason.', 'error'); return; }
    setBusy(true);
    try {
      if (modal.kind === 'reject-leave') {
        await dispatch(rejectLeaveThunk({ id: modal.id, reason: value })).unwrap();
        toast(dispatch, 'Doctor leave request rejected with reason.', 'success');
      } else if (modal.kind === 'reject-req') {
        await dispatch(rejectInventory({ id: modal.id, reason: value })).unwrap();
        toast(dispatch, 'Inventory requirement rejected with reason.', 'success');
      } else {
        await dispatch(approveInventory({ id: modal.id, remarks: value })).unwrap();
        toast(dispatch, 'Inventory requisition approved successfully! Passed to Admin Staff for purchasing.', 'success');
      }
      close();
      await done();
    } catch (err) {
      const fallback = modal.kind === 'approve-req' ? 'Error approving requirement' : 'Error executing rejection';
      toast(dispatch, messageOf(err, fallback), 'error');
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
