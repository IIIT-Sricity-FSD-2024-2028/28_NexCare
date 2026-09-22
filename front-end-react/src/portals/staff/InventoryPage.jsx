import { useCallback, useEffect, useState } from 'react';
import { Inventory } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { errorMessage, logActivity, useHospitalId } from './staffData';
import useConfirm from '../../hooks/useConfirm';

// administrative_staff/inventory.html + inventory.js: the stock table with
// restock / use / audit-trail / delete, and the requisition workflow with the
// hospital manager (raise → approved → start purchase → purchased → restocked).

function getStatus(qty, minStock = 20) {
  if (qty === 0) return 'OUT_OF_STOCK';
  if (qty < minStock * 0.25) return 'CRITICAL';
  if (qty < minStock) return 'LOW_STOCK';
  return 'NORMAL';
}
function getStatusClass(statusText) {
  const s = String(statusText || '').toUpperCase();
  if (s.includes('OUT_OF_STOCK') || s.includes('OUT')) return 'overdue';
  if (s.includes('CRITICAL')) return 'overdue';
  if (s.includes('LOW_STOCK') || s.includes('LOW')) return 'pending';
  return 'paid';
}
// Fixed on port: the seed records carry `itemName` and `minimumQuantity`
// (the fields the backend's own create/restock write), while inventory.js
// read only `name` / `minStock` — so the HTML table showed a blank name column
// and "Min: 20" for every item. Both spellings are read here.
function normalizeRow(row) {
  if (!row) return null;
  const qty = Number(row.qty ?? row.quantity ?? row.currentQuantity ?? 0);
  const minStock = Number(row.minStock ?? row.minimumQuantity ?? row.reorderLevel ?? 20);
  return {
    id: row.id,
    name: row.name ?? row.itemName ?? '',
    category: row.category ?? 'General',
    location: row.location ?? 'General',
    qty: Number.isFinite(qty) ? qty : 0,
    minStock: Number.isFinite(minStock) ? minStock : 20,
    status: row.status ?? getStatus(qty, minStock),
  };
}

const REQ_DEPTS = ['Cardiology', 'Emergency & OT', 'General Medicine', 'Pulmonology', 'Orthopaedics', 'Paediatrics'];
const label = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 };
const modalActions = { marginTop: 14, display: 'flex', gap: 10, justifyContent: 'flex-end' };
const today = () => new Date().toISOString().split('T')[0];

function requisitionView(r) {
  const s = (r.status || '').toUpperCase();
  const isApproved = s === 'APPROVED';
  const isPurchasing = s === 'PURCHASE_IN_PROGRESS';
  const isPurchased = s === 'PURCHASED';
  const isRestocked = s === 'RESTOCKED' || s === 'FULFILLED';
  const isRejected = s === 'REJECTED';
  let badge = 'pending';
  let display = 'PENDING APPROVAL';
  if (isApproved) { badge = 'paid'; display = 'APPROVED'; }
  else if (isPurchasing) { badge = 'pending'; display = 'PURCHASE IN PROGRESS'; }
  else if (isPurchased) { badge = 'paid'; display = 'PURCHASED'; }
  else if (isRestocked) { badge = 'paid'; display = 'RESTOCKED'; }
  else if (isRejected) { badge = 'overdue'; display = 'REJECTED'; }
  return { isApproved, isPurchasing, isPurchased, isRestocked, isRejected, badge, display };
}

export default function InventoryPage() {
  const hospitalId = useHospitalId();
  const { user } = useAuth();
  const { notify } = useToast();
  const { ask, dialog } = useConfirm();
  const [inventory, setInventory] = useState([]);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [requisitions, setRequisitions] = useState(null); // null = loading
  const [reqError, setReqError] = useState(false);
  const [modal, setModal] = useState(null); // { kind, item?, req?, form }

  const loadInventory = useCallback(async () => {
    try {
      const resp = await Inventory.getAll({ hospitalId });
      setInventory((resp.data || []).map(normalizeRow).filter(Boolean));
      setLoadError(false);
    } catch (err) {
      console.error('Error loading inventory:', err);
      notify('Failed to load inventory. Please check your connection and try again.', 'error');
      setLoadError(true);
    }
  }, [hospitalId, notify]);

  const loadRequisitions = useCallback(async () => {
    try {
      const resp = await Inventory.getRequirements({ hospitalId });
      setRequisitions(resp.data || []);
      setReqError(false);
    } catch (err) {
      console.error('Failed to load requisitions:', err);
      setRequisitions([]);
      setReqError(true);
    }
  }, [hospitalId]);

  useEffect(() => { loadInventory(); loadRequisitions(); }, [loadInventory, loadRequisitions]);

  const q = search.toLowerCase().trim();
  const filtered = inventory.filter((i) =>
    String(i.name || '').toLowerCase().includes(q) || String(i.category || '').toLowerCase().includes(q) || String(i.id || '').toLowerCase().includes(q));
  const inStock = inventory.filter((i) => i.qty >= (i.minStock || 20)).length;
  const lowStock = inventory.filter((i) => i.qty > 0 && i.qty < (i.minStock || 20)).length;

  const open = (kind, extra = {}, form = {}) => setModal({ kind, ...extra, form });
  const close = () => setModal(null);
  const setField = (k, v) => setModal((m) => ({ ...m, form: { ...m.form, [k]: v } }));
  const f = modal?.form || {};

  /* ── stock actions ────────────────────────────────────────────────────── */
  async function saveItem() {
    const name = (f.name || '').trim();
    const category = (f.category || '').trim() || 'General';
    const unit = (f.unit || '').trim() || 'units';
    const location = (f.location || '').trim() || 'Pharmacy';
    if (!name || name.length < 2) { notify('Please enter a valid item name (minimum 2 characters).', 'warning'); return; }
    const qty = Number(f.quantity);
    if (Number.isNaN(qty) || qty < 0 || !Number.isInteger(qty)) { notify('Please enter a valid initial quantity (0 or positive integer).', 'warning'); return; }
    const minStock = Number(f.minStock);
    if (Number.isNaN(minStock) || minStock < 1 || !Number.isInteger(minStock)) { notify('Please enter a valid minimum stock threshold (positive integer).', 'warning'); return; }
    try {
      // Fixed on port: inventory.js also sent `status`, which CreateInventoryDto
      // does not declare — a 400 under forbidNonWhitelisted, so "Add Item"
      // never worked. The backend derives the status itself.
      await Inventory.create({ name, category, quantity: qty, minStock, unit, location });
      logActivity('Create', 'Inventory', `Added inventory item: ${name} (Qty: ${qty}, Min: ${minStock})`);
      close();
      await loadInventory();
    } catch (err) {
      console.error(err);
      notify(errorMessage(err, 'Failed to create inventory item.'), 'error');
    }
  }

  async function deleteItem(item) {
    if (!(await ask(`Delete "${item.name}"?`, { title: 'Delete item', confirmLabel: 'Delete', danger: true }))) return;
    try {
      await Inventory.delete(item.id);
      logActivity('Delete', 'Inventory', `Deleted inventory item: ${item.name} (${item.id})`);
    } catch (err) {
      console.error(err);
      notify('Failed to delete inventory item.', 'error');
      return;
    }
    await loadInventory();
  }

  async function submitRestock() {
    const item = modal.item;
    const quantity = Number(f.quantity);
    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) { notify('Please enter a valid positive integer quantity to add.', 'warning'); return; }
    try {
      await Inventory.restock(item.id, {
        quantity,
        supplier: (f.supplier || '').trim() || undefined,
        batchNumber: (f.batch || '').trim() || undefined,
        notes: (f.notes || '').trim() || undefined,
        restockedBy: user?.id || user?.email || 'ADMIN',
      });
      logActivity('Restock', 'Inventory', `Restocked ${item.name}: +${quantity} units (new total: ${item.qty + quantity})`);
      close();
      await loadInventory();
    } catch (err) {
      console.error('Restock error:', err);
      notify(errorMessage(err, 'Failed to restock item. Please check network/backend.'), 'error');
    }
  }

  function openUse(item) {
    if (item.qty <= 0) { notify(`"${item.name}" is currently Out of Stock.`, 'warning'); return; }
    open('use', { item }, { quantity: '', notes: '' });
  }

  async function submitUse() {
    const item = modal.item;
    const quantity = Number(f.quantity);
    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) { notify('Please enter a valid positive integer quantity to consume.', 'warning'); return; }
    if (quantity > item.qty) { notify(`Cannot use ${quantity} units. Only ${item.qty} units available.`, 'warning'); return; }
    try {
      await Inventory.use(item.id, { quantity, notes: (f.notes || '').trim() || undefined });
      logActivity('Use', 'Inventory', `Used ${item.name}: -${quantity} units (remaining: ${item.qty - quantity})`);
      close();
      await loadInventory();
    } catch (err) {
      console.error('Use/Consume error:', err);
      notify(errorMessage(err, 'Failed to consume item. Please check network/backend.'), 'error');
    }
  }

  async function openAudit(item) {
    open('audit', { item, logs: null, auditError: false });
    try {
      const resp = await Inventory.getAudit(item.id);
      setModal((m) => (m && m.kind === 'audit' ? { ...m, logs: resp.data || [] } : m));
    } catch (err) {
      console.error('Failed to load audit trail:', err);
      setModal((m) => (m && m.kind === 'audit' ? { ...m, logs: [], auditError: true } : m));
    }
  }

  /* ── requisition workflow ─────────────────────────────────────────────── */
  async function submitRequisition() {
    const itemName = (f.itemName || '').trim();
    const category = (f.category || '').trim();
    const requestedQuantity = Number(f.quantity);
    const reason = (f.reason || '').trim();
    if (!itemName || !category || !requestedQuantity || requestedQuantity <= 0 || !reason) {
      notify('Please fill in all required fields (Item Name, Category, Requested Quantity, and Reason).', 'warning');
      return;
    }
    try {
      await Inventory.createRequirement({
        itemName,
        category,
        department: f.department,
        requestedQuantity,
        unit: (f.unit || '').trim() || 'units',
        priority: f.priority || 'MEDIUM',
        estimatedCost: Number(f.estimatedCost) || 0,
        reason,
      });
      notify('Inventory requirement submitted to Hospital Manager for approval!', 'success');
      close();
      loadRequisitions();
    } catch (err) {
      console.error('Error creating requirement:', err);
      notify(errorMessage(err, 'Error submitting requirement. Please try again.'), 'error');
    }
  }

  function openStartPurchase(req) {
    open('purchase', { req }, {
      supplier: req.supplier || 'MedTech Surgicals Pvt. Ltd.',
      invoice: req.invoiceNumber || `PO-${String(req.department || 'GEN').slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      date: today(),
      quantity: req.requestedQuantity || 100,
      cost: req.estimatedCost || 9500,
      notes: req.purchaseNotes || '',
    });
  }

  async function submitStartPurchase() {
    const req = modal.req;
    const supplier = (f.supplier || '').trim();
    const invoiceNumber = (f.invoice || '').trim();
    const quantityPurchased = Number(f.quantity);
    if (!supplier || !invoiceNumber || !quantityPurchased || quantityPurchased <= 0) {
      notify('Please provide supplier name, invoice/PO number, and valid purchase quantity.', 'warning');
      return;
    }
    try {
      await Inventory.startPurchase(req.id, {
        supplier, invoiceNumber, purchaseDate: f.date, quantityPurchased, finalCost: Number(f.cost), purchaseNotes: (f.notes || '').trim(),
      });
      notify(`Purchase details recorded for ${req.itemName}! Status updated to Purchase in Progress.`, 'success');
      close();
      await loadRequisitions();
    } catch (err) {
      console.error('Error starting purchase:', err);
      notify(errorMessage(err, 'Error recording purchase details.'), 'error');
    }
  }

  async function markPurchased(reqId) {
    if (!(await ask('Confirm marking this item as purchased from the vendor?', { title: 'Mark purchased' }))) return;
    try {
      await Inventory.markPurchased(reqId);
      notify('Item marked as Purchased. Next step: Mark Restocked once delivered to hospital.', 'success');
      await loadRequisitions();
    } catch (err) {
      console.error('Error marking purchased:', err);
      notify(errorMessage(err, 'Error updating status.'), 'error');
    }
  }

  async function markRestocked(reqId) {
    if (!(await ask('Confirm goods received and restocked into central hospital inventory? This will automatically increase the stock quantity.', { title: 'Mark restocked' }))) return;
    try {
      await Inventory.markRestocked(reqId);
      notify('Requirement marked as RESTOCKED! Central inventory item quantity has been automatically updated.', 'success');
      await loadRequisitions();
      await loadInventory();
    } catch (err) {
      console.error('Error marking restocked:', err);
      notify(errorMessage(err, 'Error updating status and restocking.'), 'error');
    }
  }

  const openReq = () => open('req', {}, { itemName: '', category: '', department: 'Cardiology', quantity: '', unit: 'units', priority: 'MEDIUM', estimatedCost: '', reason: '' });

  return (
    <div className="sp-inventory">
      <div className="header-row">
        <div>
          <h2>Inventory Management</h2>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Stock levels and requisition approval tracking with Hospital Administration</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" type="button" style={{ background: '#2563EB' }} onClick={openReq}>+ Raise Requisition</button>
          <button className="btn" type="button" onClick={() => open('create', {}, { name: '', category: '', quantity: '', minStock: '20', unit: '', location: '' })}>+ Add Item</button>
        </div>
      </div>

      <div className="cards">
        <div className="card stat"><p>Total Items</p><h3 id="totalItems" className="blue-text">{inventory.length}</h3></div>
        <div className="card stat green"><p>In Stock</p><h3 id="inStock" className="green-text">{inStock}</h3></div>
        <div className="card stat yellow"><p>Low Stock</p><h3 id="lowStock" className="orange-text">{lowStock}</h3></div>
      </div>

      <input id="searchInput" className="search" placeholder="Search inventory items..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="card table-container">
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #E2E8F0', fontWeight: 700, fontSize: 15, color: '#0F172A' }}>Current Stock Inventory</div>
        <table>
          <thead><tr><th>Item Name</th><th>Quantity Available</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="inventoryTable">
            {loadError ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20, color: '#dc2626' }}>Failed to load inventory. Backend may be offline.</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20 }}>No items found</td></tr>
            ) : filtered.map((item) => {
              const statusText = getStatus(item.qty, item.minStock);
              return (
                <tr key={item.id}>
                  <td>
                    <strong style={{ color: '#1e293b' }}>{item.name}</strong>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{item.category} • {item.id}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{item.qty}</span>
                    <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 4 }}>(Min: {item.minStock})</span>
                  </td>
                  <td><span className={`status ${getStatusClass(statusText)}`}>{statusText}</span></td>
                  <td>
                    <div className="actions" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button type="button" className="btn" style={{ padding: '6px 12px', fontSize: 12, background: '#10b981' }} onClick={() => open('restock', { item }, { quantity: '', supplier: '', batch: '', notes: '' })}>Restock</button>
                      <button type="button" className="btn" style={{ padding: '6px 12px', fontSize: 12, background: '#f59e0b' }} onClick={() => openUse(item)}>Use</button>
                      <button type="button" className="btn-outline" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => openAudit(item)}>History</button>
                      <button type="button" className="btn-outline" style={{ padding: '6px 10px', fontSize: 12, color: '#dc2626', borderColor: '#fca5a5' }} onClick={() => deleteItem(item)}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card table-container" style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #E2E8F0' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Requisitions &amp; Hospital Manager Approvals</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>Live approval status of inventory requirement requests</p>
          </div>
          <button type="button" className="btn" style={{ padding: '6px 12px', fontSize: 12, background: '#2563EB' }} onClick={openReq}>+ Raise New Request</button>
        </div>
        <table>
          <thead>
            <tr><th>Req ID</th><th>Item &amp; Category</th><th>Requested Qty</th><th>Department</th><th>Priority</th><th>Status &amp; Manager Audit</th><th>Purchasing &amp; Restock Actions</th></tr>
          </thead>
          <tbody id="requisitionsTable">
            {requisitions === null ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#64748B' }}>Loading requisition requests...</td></tr>
            ) : reqError ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#dc2626' }}>Failed to load requisitions.</td></tr>
            ) : requisitions.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>No requisition requests raised yet.</td></tr>
            ) : requisitions.map((r) => {
              const v = requisitionView(r);
              return (
                <tr key={r.id}>
                  <td><strong>{r.id}</strong></td>
                  <td><strong>{r.itemName}</strong><div style={{ fontSize: 11, color: '#64748B' }}>{r.category || 'General'}</div></td>
                  <td><strong>{Number(r.requestedQuantity || 0)}</strong> {r.unit || 'units'}</td>
                  <td>{r.department || 'General'}</td>
                  <td><span className={`status ${r.priority === 'URGENT' ? 'overdue' : (r.priority === 'HIGH' ? 'pending' : 'paid')}`}>{r.priority || 'MEDIUM'}</span></td>
                  <td>
                    <span className={`status ${v.badge}`}>{v.display}</span>
                    {v.isApproved && (
                      <>
                        <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>Approved by {r.approvedByName || 'Manager'}</div>
                        {r.managerRemarks && <div style={{ fontSize: 10.5, color: '#475569' }}>"{r.managerRemarks}"</div>}
                      </>
                    )}
                    {v.isPurchasing && (
                      <>
                        <div style={{ fontSize: 11, color: '#0284c7', marginTop: 2 }}>Vendor: <strong>{r.supplier || 'Vendor'}</strong></div>
                        <div style={{ fontSize: 10.5, color: '#64748B' }}>Inv: {r.invoiceNumber || 'PO-PENDING'} | Cost: ₹{Number(r.finalCost || r.estimatedCost || 0).toLocaleString('en-IN')}</div>
                      </>
                    )}
                    {v.isPurchased && (
                      <>
                        <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 2 }}>Purchased by Admin Staff</div>
                        <div style={{ fontSize: 10.5, color: '#64748B' }}>Awaiting delivery receipt &amp; restock</div>
                      </>
                    )}
                    {v.isRestocked && (
                      <>
                        <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>✓ Restocked (+{Number(r.quantityPurchased || r.requestedQuantity)} {r.unit || 'units'})</div>
                        <div style={{ fontSize: 10.5, color: '#64748B' }}>Stock level updated in central inventory</div>
                      </>
                    )}
                    {v.isRejected && (
                      <div style={{ fontSize: 11, color: '#DC2626', marginTop: 2 }}><strong>Reason:</strong> {r.rejectionReason || 'Rejected by Hospital Manager'}</div>
                    )}
                  </td>
                  <td>
                    {v.isApproved ? <button type="button" className="btn" style={{ padding: '5px 10px', fontSize: 12, background: '#2563EB' }} onClick={() => openStartPurchase(r)}>Start Purchase</button>
                      : v.isPurchasing ? <button type="button" className="btn" style={{ padding: '5px 10px', fontSize: 12, background: '#7c3aed' }} onClick={() => markPurchased(r.id)}>Mark Purchased</button>
                      : v.isPurchased ? <button type="button" className="btn" style={{ padding: '5px 10px', fontSize: 12, background: '#10b981' }} onClick={() => markRestocked(r.id)}>Mark Restocked</button>
                      : v.isRestocked ? <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>Completed</span>
                      : v.isRejected ? <span style={{ fontSize: 12, color: '#dc2626' }}>Closed</span>
                      : <span style={{ fontSize: 12, color: '#94A3B8' }}>Awaiting Manager Review</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── modals ─────────────────────────────────────────────────────── */}
      {modal?.kind === 'create' && (
        <div id="modal" className="modal" style={{ display: 'flex' }}>
          <div className="card modal-card" style={{ width: 380 }}>
            <h3 style={{ marginTop: 0 }}>Add Item</h3>
            <label style={label}>Item Name *</label>
            <input className="input" placeholder="e.g. Paracetamol" autoFocus value={f.name} onChange={(e) => setField('name', e.target.value)} />
            <label style={label}>Category</label>
            <input className="input" placeholder="e.g. Medication, Supplies, PPE" value={f.category} onChange={(e) => setField('category', e.target.value)} />
            <label style={label}>Initial Quantity *</label>
            <input type="number" min="0" className="input" placeholder="e.g. 500" value={f.quantity} onChange={(e) => setField('quantity', e.target.value)} />
            <label style={label}>Minimum Stock Threshold (Min Stock) *</label>
            <input type="number" min="1" className="input" placeholder="e.g. 50" value={f.minStock} onChange={(e) => setField('minStock', e.target.value)} />
            <label style={label}>Unit</label>
            <input className="input" placeholder="e.g. tablets, pairs, units" value={f.unit} onChange={(e) => setField('unit', e.target.value)} />
            <label style={label}>Location</label>
            <input className="input" placeholder="e.g. Pharmacy, ER, Reception" value={f.location} onChange={(e) => setField('location', e.target.value)} />
            <div className="modal-actions" style={modalActions}>
              <button type="button" className="btn" onClick={saveItem}>Save</button>
              <button type="button" className="btn-outline" onClick={close}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {modal?.kind === 'restock' && (
        <div id="restockModal" className="modal" style={{ display: 'flex' }}>
          <div className="card modal-card" style={{ width: 380 }}>
            <h3 style={{ marginTop: 0 }}>Restock {modal.item.name}</h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '-4px 0 14px 0' }}>Current Stock: {modal.item.qty} units (ID: {modal.item.id})</p>
            <label style={label}>Quantity to Add *</label>
            <input type="number" min="1" className="input" placeholder="e.g. 50" autoFocus value={f.quantity} onChange={(e) => setField('quantity', e.target.value)} />
            <label style={label}>Supplier (Optional)</label>
            <input className="input" placeholder="Supplier name (e.g. PharmaCorp)" value={f.supplier} onChange={(e) => setField('supplier', e.target.value)} />
            <label style={label}>Batch Number (Optional)</label>
            <input className="input" placeholder="Batch No. (e.g. BATCH-2026-04)" value={f.batch} onChange={(e) => setField('batch', e.target.value)} />
            <label style={label}>Notes (Optional)</label>
            <input className="input" placeholder="Notes (e.g. Monthly emergency refill)" value={f.notes} onChange={(e) => setField('notes', e.target.value)} />
            <div className="modal-actions" style={modalActions}>
              <button type="button" className="btn" style={{ background: '#10b981' }} onClick={submitRestock}>Add Stock</button>
              <button type="button" className="btn-outline" onClick={close}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {modal?.kind === 'use' && (
        <div id="useModal" className="modal" style={{ display: 'flex' }}>
          <div className="card modal-card" style={{ width: 380 }}>
            <h3 style={{ marginTop: 0 }}>Use / Consume {modal.item.name}</h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '-4px 0 14px 0' }}>Available Stock: {modal.item.qty} units (ID: {modal.item.id})</p>
            <label style={label}>Quantity to Use/Consume *</label>
            <input type="number" min="1" max={modal.item.qty} className="input" placeholder="e.g. 10" autoFocus value={f.quantity} onChange={(e) => setField('quantity', e.target.value)} />
            <label style={label}>Purpose / Destination (Optional)</label>
            <input className="input" placeholder="e.g. Dispensed to Ward B / ER usage" value={f.notes} onChange={(e) => setField('notes', e.target.value)} />
            <div className="modal-actions" style={modalActions}>
              <button type="button" className="btn" style={{ background: '#f59e0b' }} onClick={submitUse}>Consume Stock</button>
              <button type="button" className="btn-outline" onClick={close}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {modal?.kind === 'audit' && (
        <div id="auditModal" className="modal" style={{ display: 'flex' }}>
          <div className="card modal-card" style={{ width: 720, maxWidth: '92vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0' }}>Audit Trail: {modal.item.name}</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Item ID: {modal.item.id} | Current Stock: {modal.item.qty} units</p>
              </div>
              <button type="button" className="btn-outline" onClick={close} style={{ padding: '2px 8px', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, maxHeight: 420, border: '1px solid #f1f5f9', borderRadius: 8 }}>
              <table>
                <thead><tr><th>Date &amp; Time</th><th>Action</th><th>Before</th><th>Change</th><th>After</th><th>User ID</th><th>Notes</th></tr></thead>
                <tbody id="auditHistoryTable">
                  {modal.logs === null ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>Loading audit history...</td></tr>
                  ) : modal.auditError ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#dc2626' }}>Failed to load audit history.</td></tr>
                  ) : modal.logs.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#6b7280' }}>No audit records found for this item yet.</td></tr>
                  ) : modal.logs.map((entry, i) => {
                    const isRestock = entry.action === 'restock';
                    const diff = (entry.quantityAfter ?? 0) - (entry.quantityBefore ?? 0);
                    return (
                      <tr key={entry.id || i}>
                        <td style={{ fontSize: 12, whiteSpace: 'nowrap', color: '#4b5563' }}>{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A'}</td>
                        <td><span className={`status ${isRestock ? 'paid' : 'pending'}`} style={{ fontSize: 11, fontWeight: 600 }}>{isRestock ? 'RESTOCK' : 'USE'}</span></td>
                        <td style={{ fontWeight: 500 }}>{Number(entry.quantityBefore ?? 0)}</td>
                        <td style={{ fontWeight: 700, color: diff >= 0 ? '#16a34a' : '#dc2626' }}>{diff >= 0 ? `+${diff}` : `${diff}`}</td>
                        <td style={{ fontWeight: 600, color: '#1e293b' }}>{Number(entry.quantityAfter ?? 0)}</td>
                        <td style={{ fontSize: 12, color: '#6b7280' }}>{entry.userId || 'ADMIN'}</td>
                        <td style={{ fontSize: 12, color: '#6b7280' }}>{entry.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="modal-actions" style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-outline" onClick={close}>Close</button>
            </div>
          </div>
        </div>
      )}

      {modal?.kind === 'req' && (
        <div id="reqModal" className="modal" style={{ display: 'flex' }}>
          <div className="card modal-card" style={{ width: 440 }}>
            <h3 style={{ marginTop: 0 }}>Raise Inventory Requirement</h3>
            <p style={{ fontSize: 12.5, color: '#64748B', margin: '-4px 0 14px 0' }}>Submit stock requisition request to Hospital Manager for approval</p>
            <label style={label}>Item Name *</label>
            <input className="input" placeholder="e.g. ECG Electrodes, Surgical Gloves" required value={f.itemName} onChange={(e) => setField('itemName', e.target.value)} />
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={label}>Category *</label>
                <input className="input" placeholder="e.g. Cardiology Supplies, PPE" required value={f.category} onChange={(e) => setField('category', e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={label}>Department *</label>
                <select className="input" style={{ height: 38 }} value={f.department} onChange={(e) => setField('department', e.target.value)}>
                  {REQ_DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={label}>Requested Qty *</label>
                <input type="number" min="1" className="input" placeholder="e.g. 100" required value={f.quantity} onChange={(e) => setField('quantity', e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={label}>Unit *</label>
                <input className="input" placeholder="e.g. packs, pairs, units" required value={f.unit} onChange={(e) => setField('unit', e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={label}>Priority *</label>
                <select className="input" style={{ height: 38 }} value={f.priority} onChange={(e) => setField('priority', e.target.value)}>
                  <option value="LOW">Low (Routine)</option>
                  <option value="MEDIUM">Medium (Standard)</option>
                  <option value="HIGH">High (Important)</option>
                  <option value="URGENT">Urgent (Immediate)</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={label}>Est. Cost (₹)</label>
                <input type="number" min="0" className="input" placeholder="e.g. 12500" value={f.estimatedCost} onChange={(e) => setField('estimatedCost', e.target.value)} />
              </div>
            </div>
            <label style={{ ...label, marginTop: 8 }}>Reason / Clinical Need *</label>
            <textarea className="input" style={{ height: 60, resize: 'none' }} placeholder="Describe why this stock is required..." required value={f.reason} onChange={(e) => setField('reason', e.target.value)} />
            <div className="modal-actions" style={modalActions}>
              <button type="button" className="btn" style={{ background: '#2563EB' }} onClick={submitRequisition}>Submit for Approval</button>
              <button type="button" className="btn-outline" onClick={close}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {modal?.kind === 'purchase' && (
        <div id="startPurchaseModal" className="modal" style={{ display: 'flex' }}>
          <div className="card modal-card" style={{ width: 460 }}>
            <h3 style={{ marginTop: 0 }}>Initiate Purchase: {modal.req.itemName}</h3>
            <p style={{ fontSize: 12.5, color: '#64748B', margin: '-4px 0 14px 0' }}>Requisition #{modal.req.id} • Approved Qty: {modal.req.requestedQuantity} {modal.req.unit}</p>
            <label style={label}>Supplier / Vendor Name *</label>
            <input className="input" placeholder="e.g. MedTech Surgicals Pvt. Ltd." required value={f.supplier} onChange={(e) => setField('supplier', e.target.value)} />
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={label}>Invoice / PO Number *</label>
                <input className="input" placeholder="e.g. PO-MTS-2026-8819" required value={f.invoice} onChange={(e) => setField('invoice', e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={label}>Purchase Date *</label>
                <input type="date" className="input" required value={f.date} onChange={(e) => setField('date', e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={label}>Quantity Purchased *</label>
                <input type="number" min="1" className="input" placeholder="100" required value={f.quantity} onChange={(e) => setField('quantity', e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={label}>Final Cost (₹) *</label>
                <input type="number" min="0" className="input" placeholder="9200" required value={f.cost} onChange={(e) => setField('cost', e.target.value)} />
              </div>
            </div>
            <label style={{ ...label, marginTop: 8 }}>Purchase Notes / Tracking</label>
            <textarea className="input" style={{ height: 55, resize: 'none' }} placeholder="e.g. Dispatched via express courier, tracking #EXP-992144" value={f.notes} onChange={(e) => setField('notes', e.target.value)} />
            <div className="modal-actions" style={modalActions}>
              <button type="button" className="btn" style={{ background: '#2563EB' }} onClick={submitStartPurchase}>Save Purchase Details</button>
              <button type="button" className="btn-outline" onClick={close}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {dialog}
    </div>
  );
}
