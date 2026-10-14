import { useCallback, useEffect, useState } from 'react';
import { Inventory } from '../../api';
import { useHm } from './HmContext';
import { Badge, LoadingCell, isoDay } from './hmShared';
import useApprovals from './useApprovals';

// TAB 4 — Inventory Requirements & Approvals: loadInventoryReqs() /
// filterInventoryReqs(). Statuses walk PENDING → APPROVED →
// PURCHASE_IN_PROGRESS → PURCHASED → RESTOCKED (or REJECTED); only PENDING
// rows get the decision buttons.
const STATUS = {
  PENDING: { cls: 'pending', text: 'PENDING APPROVAL' },
  PENDING_APPROVAL: { cls: 'pending', text: 'PENDING APPROVAL' },
  APPROVED: { cls: 'approved', text: 'APPROVED' },
  PURCHASE_IN_PROGRESS: { cls: 'role', text: 'PURCHASING' },
  PURCHASED: { cls: 'active', text: 'PURCHASED' },
  RESTOCKED: { cls: 'active', text: 'RESTOCKED' },
  FULFILLED: { cls: 'active', text: 'RESTOCKED' },
  REJECTED: { cls: 'rejected', text: 'REJECTED' },
};

function Audit({ req }) {
  const st = (req.status || '').toUpperCase();
  const small = (color, text) => <div style={{ fontSize: 11, color, marginTop: 2 }}>{text}</div>;
  const tiny = (text) => <div style={{ fontSize: 10.5, color: '#64748B' }}>{text}</div>;
  if (st === 'APPROVED') return <>{small('#059669', `Approved by ${req.approvedByName || 'Manager'}`)}{tiny('Awaiting purchasing by Admin Staff')}</>;
  if (st === 'PURCHASE_IN_PROGRESS') return <>{small('#0284c7', `PO in Progress (${req.supplier || 'Vendor'})`)}{tiny(`Invoice: ${req.invoiceNumber || 'Pending'}`)}</>;
  if (st === 'PURCHASED') return <>{small('#7c3aed', 'Purchased by Admin Staff')}{tiny('Awaiting delivery & restock')}</>;
  if (st === 'RESTOCKED' || st === 'FULFILLED') return small('#16a34a', `✓ Restocked (+${req.quantityPurchased || req.requestedQuantity} ${req.unit})`);
  if (st === 'REJECTED') return <div style={{ fontSize: 11, color: '#DC2626', marginTop: 2 }}><strong>Reason:</strong> {req.rejectionReason || 'Rejected by Manager'}</div>;
  return null;
}

export default function InventoryApprovalsPage() {
  const { hospitalId, version } = useHm();
  const [reqs, setReqs] = useState(null);
  const [failed, setFailed] = useState(false);
  const [term, setTerm] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [priority, setPriority] = useState('ALL');

  const load = useCallback(async () => {
    if (!hospitalId) return;
    try {
      const res = await Inventory.getRequirements({ hospitalId });
      setReqs(Array.isArray(res.data) ? res.data : []);
      setFailed(false);
    } catch (e) {
      console.error('Error loading inventory reqs:', e);
      setFailed(true);
      setReqs([]);
    }
  }, [hospitalId]);
  useEffect(() => { load(); }, [load, version]);

  const { approveReq, rejectReq, dialogs } = useApprovals(load);

  const q = term.trim().toLowerCase();
  const filtered = (reqs || []).filter((r) => {
    const st = (r.status || '').toUpperCase();
    const matchStatus = status === 'ALL' || st === status || (status === 'PENDING' && st === 'PENDING_APPROVAL') || (status === 'FULFILLED' && st === 'RESTOCKED');
    return matchStatus
      && (priority === 'ALL' || (r.priority || '').toUpperCase() === priority)
      && (!q || [r.itemName, r.department, r.reason].some((v) => (v || '').toLowerCase().includes(q)));
  });

  return (
    <div className="card">
      <div className="card-header flex-between">
        <div>
          <h2>Inventory Requirements & Approvals</h2>
          <p className="card-subtitle">Approve or reject stock requisition requests raised by administrative staff</p>
        </div>
        <div className="filter-toolbar">
          <input type="text" className="input-search" placeholder="Search item or department..." value={term} onChange={(e) => setTerm(e.target.value)} />
          <select className="select-filter" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="FULFILLED">Fulfilled / Restocked</option>
          </select>
          <select className="select-filter" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr><th>Req ID & Date</th><th>Item & Category</th><th>Current vs Requested Qty</th><th>Department & Requester</th><th>Priority</th><th>Estimated Cost</th><th>Status & Audit</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {failed && <LoadingCell colSpan={8} tone="danger">Failed to load inventory requirements.</LoadingCell>}
            {!failed && reqs === null && <LoadingCell colSpan={8}>Loading inventory requirements...</LoadingCell>}
            {!failed && reqs && filtered.length === 0 && <LoadingCell colSpan={8}>No inventory requisitions match the selected filter.</LoadingCell>}
            {filtered.map((req) => {
              const st = (req.status || '').toUpperCase();
              const s = STATUS[st] || STATUS.PENDING;
              const pending = st === 'PENDING' || st === 'PENDING_APPROVAL';
              return (
                <tr key={req.id}>
                  <td><strong>{req.id}</strong><div style={{ fontSize: 11, color: '#64748B' }}>{req.requestDate || isoDay(req.createdAt)}</div></td>
                  <td><strong>{req.itemName}</strong><div style={{ fontSize: 11, color: '#64748B' }}>{req.category || 'Supplies'}</div></td>
                  <td><div><strong>{req.requestedQuantity}</strong> {req.unit} requested</div><div style={{ fontSize: 11, color: '#64748B' }}>Current Stock: {req.currentQuantity} {req.unit}</div></td>
                  <td><strong>{req.department}</strong><div style={{ fontSize: 11, color: '#64748B' }}>{req.requestedBy || 'Admin Staff'}</div></td>
                  <td><Badge tone={(req.priority || 'medium').toLowerCase()}>{req.priority || 'MEDIUM'}</Badge><div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{req.reason || ''}</div></td>
                  <td><strong>₹{(Number(req.estimatedCost) || 0).toLocaleString('en-IN')}</strong></td>
                  <td><Badge tone={s.cls}>{s.text}</Badge><Audit req={req} /></td>
                  <td>
                    {pending ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" className="btn-action-sm btn-action-approve" onClick={() => approveReq(req.id)}>Approve</button>
                        <button type="button" className="btn-action-sm btn-action-reject" onClick={() => rejectReq(req.id)}>Reject</button>
                      </div>
                    ) : <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Processed</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {dialogs}
    </div>
  );
}
