import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addToast } from '../../store/toastSlice';
import { selectUser } from '../../store/authSlice';
import {
  createHmBed,
  createHmInventoryItem,
  fetchHmBeds,
  fetchHmInventoryCatalog,
  selectHmBeds,
  selectHmInventoryCatalog,
} from '../../store/hospitalManagerSlice';
import { LoadingCell } from './hmShared';
import { StaffRegisterForm } from './StaffRegistration';

// TAB — Registration, Setup & Assets: the dedicated staff form, "Register
// Ward / Add Beds" + "Existing Infrastructure", and "Add New Inventory Item"
// + "Current Stock Catalog" (loadInfrastructure / handleNewBedSubmit /
// loadInventoryCatalog / handleNewInventorySubmit).
const WARDS = ['General', 'Emergency', 'ICU', 'Pediatrics', 'Maternity', 'Surgery'];
const CATEGORIES = ['Medication', 'Medical Supplies', 'Surgical Equipment', 'Laboratory', 'Office Supplies'];
const pillClass = (status) => `status-pill status-${String(status || '').toLowerCase().replace('_', '-')}`;

function BedsSection() {
  const dispatch = useAppDispatch();
  const hospitalId = useAppSelector(selectUser)?.hospitalId || '';
  const notify = (message, type) => dispatch(addToast({ message, type }));
  const bedsState = useAppSelector(selectHmBeds);
  const [form, setForm] = useState({ ward: 'General', id: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hospitalId) dispatch(fetchHmBeds());
  }, [dispatch, hospitalId]);

  async function submit(e) {
    e.preventDefault();
    if (beds.some(b => b.id === form.id)) {
      notify('Bed ID already exists. Choose a unique ID.', 'error');
      return;
    }
    setBusy(true);
    try {
      await dispatch(createHmBed({ id: form.id, ward: form.ward })).unwrap();
      notify('Bed registered successfully!', 'success');
      setForm({ ward: 'General', id: '' });
    } catch (err) {
      notify(err?.message || 'Failed to register bed.', 'error');
    } finally {
      setBusy(false);
    }
  }

  const beds = bedsState.list;
  const failed = bedsState.error;
  const loading = bedsState.loading && beds.length === 0;

  return (
    <div className="grid-2-col">
      <div className="card">
        <div className="card-header flex-between">
          <div>
            <h2>Register Ward / Add Beds</h2>
            <p className="card-subtitle">Onboard new beds for your hospital.</p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: 12 }}
            onClick={() => dispatch(fetchHmBeds())}
            disabled={bedsState.loading}
            title="Refresh bed list"
          >
            {bedsState.loading ? '⟳' : '🔄'}
          </button>
        </div>
        <div style={{ padding: 24 }}>
          <form onSubmit={submit} className="setup-form">
            <div className="form-group">
              <label>Ward Name</label>
              <select className="form-control" required value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })}>{WARDS.map((w) => <option key={w}>{w}</option>)}</select>
            </div>
            <div className="form-group">
              <label>Bed ID / Number</label>
              <input className="form-control" placeholder="e.g. ICU-01" required value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 10 }} disabled={busy}>Register Bed</button>
          </form>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><h2>Existing Infrastructure</h2></div>
        <div className="table-responsive" style={{ maxHeight: 420, overflowY: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>Bed ID</th><th>Ward</th><th>Status</th><th>Patient ID</th></tr></thead>
            <tbody>
              {failed && <tr><td colSpan={4} className="error-cell" style={{ color: '#DC2626', padding: 16 }}>{failed}</td></tr>}
              {!failed && beds === null && <LoadingCell colSpan={4}>Loading infrastructure...</LoadingCell>}
              {!failed && beds && beds.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#6b7280' }}>No beds registered yet.</td></tr>}
              {(beds || []).map((b) => (
                <tr key={b.id}>
                  <td><strong>{b.id}</strong></td>
                  <td>{b.ward}</td>
                  <td><span className={pillClass(b.status)}>{b.status}</span></td>
                  <td>{b.patientId || b.patient || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InventorySection() {
  const dispatch = useAppDispatch();
  const hospitalId = useAppSelector(selectUser)?.hospitalId || '';
  const notify = (message, type) => dispatch(addToast({ message, type }));
  const catalogState = useAppSelector(selectHmInventoryCatalog);
  const blank = { name: '', category: 'Medication', quantity: '', minStock: '', unit: '', location: '' };
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (hospitalId) dispatch(fetchHmInventoryCatalog());
  }, [dispatch, hospitalId]);

  async function submit(e) {
    e.preventDefault();
    if (items.some(i => (i.name || i.itemName) === form.name)) {
      notify('Item name already exists. Choose a unique name.', 'error');
      return;
    }
    setBusy(true);
    try {
      await dispatch(createHmInventoryItem({
        name: form.name,
        category: form.category,
        quantity: parseInt(form.quantity, 10),
        minStock: parseInt(form.minStock, 10),
        unit: form.unit,
        location: form.location,
      })).unwrap();
      notify('Item added to catalog!', 'success');
      setForm(blank);
    } catch (err) {
      notify(err?.message || 'Failed to add item.', 'error');
    } finally {
      setBusy(false);
    }
  }

  const items = catalogState.list;
  const failed = catalogState.error;
  const loading = catalogState.loading && items.length === 0;

  return (
    <>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h2>Add New Inventory Item</h2><p className="card-subtitle">Register new stock items into your hospital's catalog.</p></div>
        <div style={{ padding: 24 }}>
          <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="form-group"><label>Item Name</label><input className="form-control" placeholder="e.g. Paracetamol 500mg" required value={form.name} onChange={set('name')} /></div>
            <div className="form-group"><label>Category</label><select className="form-control" required value={form.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div className="form-group"><label>Initial Quantity</label><input type="number" className="form-control" min="0" required value={form.quantity} onChange={set('quantity')} /></div>
            <div className="form-group"><label>Minimum Stock Threshold</label><input type="number" className="form-control" min="0" required value={form.minStock} onChange={set('minStock')} /></div>
            <div className="form-group"><label>Unit</label><input className="form-control" placeholder="e.g. tablets, boxes, pairs" required value={form.unit} onChange={set('unit')} /></div>
            <div className="form-group"><label>Location</label><input className="form-control" placeholder="e.g. Pharmacy, ER" required value={form.location} onChange={set('location')} /></div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary" disabled={busy}>Add Item to Catalog</button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex-between">
          <div>
            <h2>Current Stock Catalog</h2>
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: 12 }}
            onClick={() => dispatch(fetchHmInventoryCatalog())}
            disabled={catalogState.loading}
            title="Refresh inventory catalog"
          >
            {catalogState.loading ? '⟳' : '🔄'}
          </button>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead><tr><th>Item Name</th><th>Category</th><th>Location</th><th>Stock Level</th><th>Status</th></tr></thead>
            <tbody>
              {failed && <tr><td colSpan={5} className="error-cell" style={{ color: '#DC2626', padding: 16 }}>{failed}</td></tr>}
              {!failed && items === null && <LoadingCell colSpan={5}>Loading inventory catalog...</LoadingCell>}
              {!failed && items && items.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#6b7280' }}>Catalog is empty. Add items above.</td></tr>}
              {(items || []).map((item) => {
                const qty = Number(item.quantity ?? 0);
                const min = Number(item.minStock ?? 0);
                const low = qty <= min;
                return (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong><br /><small style={{ color: '#6b7280' }}>{item.id}</small></td>
                    <td>{item.category}</td>
                    <td>{item.location || item.department || '—'}</td>
                    <td>{qty} {item.unit} <small style={{ color: '#6b7280' }}>(Min: {min})</small></td>
                    <td><span className={`status-pill ${low ? 'status-critical' : 'status-active'}`} style={low ? { background: '#FEE2E2', color: '#B91C1C' } : undefined}>{low ? 'LOW STOCK' : 'IN STOCK'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function SetupPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <StaffRegisterForm />
      <BedsSection />
      <InventorySection />
    </div>
  );
}
