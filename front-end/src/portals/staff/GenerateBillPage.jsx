import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ambulance, Appointments, Beds, Billing, Users } from '../../api';
import { useToast } from '../../context/ToastContext';
import { errorMessage, findPatient, logActivity, useHospitalId } from './staffData';

// administrative_staff/generate-bill.html + billing.js.

// billing.js keyed these on bare ward names (`Emergency`, `General`, …) while
// the seeded beds are in `Emergency Ward`, `General Ward`, `Paediatric Ward`,
// `ICU`, … so the automatic ward line never appeared. Matched by keyword now,
// and the bed's own `dailyRate` wins over the table when the record has one.
const WARD_RATES = [
  { match: /emergency/i, service: 'Emergency Ward Care & Monitoring', amount: 5000 },
  { match: /icu|ccu|intensive|critical/i, service: 'Intensive Care Unit Services', amount: 8000 },
  { match: /p(a)?ediatric/i, service: 'Pediatric Care & Ward Services', amount: 2500 },
  { match: /maternity/i, service: 'Maternity Ward Services', amount: 4000 },
  { match: /general/i, service: 'General Ward Stay', amount: 1500 },
];

/** The ward charge for an occupied bed, or null when the ward is unknown. */
function wardLineItem(bed) {
  const ward = bed.ward || bed.wardName || '';
  const rate = WARD_RATES.find((r) => r.match.test(ward));
  if (!rate && !bed.dailyRate) return null;
  return {
    description: rate ? rate.service : `${ward} Stay`,
    amount: Number(bed.dailyRate) || rate.amount,
  };
}

export default function GenerateBillPage() {
  const hospitalId = useHospitalId();
  const { notify } = useToast();
  const [bills, setBills] = useState([]);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modal, setModal] = useState(null); // { patientId, name, items: [{description, amount}] }
  const [view, setView] = useState(null); // a bill row
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [billsResp, patientsResp] = await Promise.all([Billing.getAll({ hospitalId }), Users.getAll({ role: 'patient' })]);
      const patients = patientsResp.data || [];
      setBills((billsResp.data || []).map((db) => {
        const patient = patients.find((p) => p.id === db.patientId || p.patientId === db.patientId);
        return {
          id: db.id,
          patientId: db.patientId,
          patient: patient ? (patient.fullName || patient.name) : (db.patientName || 'Unknown Patient'),
          date: db.visitDate || db.date || '',
          services: db.items && db.items.length > 0 ? db.items[0].description : 'Medical Services',
          amount: db.subtotal || db.amount || 0,
          status: db.status || 'Pending',
          payment: db.payments && db.payments.length > 0 ? 'Paid' : '-',
        };
      }));
      setLoadError(false);
    } catch (err) {
      console.error('Error loading bills:', err);
      notify('Failed to load bills. Please check your connection and try again.', 'error');
      setLoadError(true);
    }
  }, [hospitalId, notify]);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => ({
    total: bills.length,
    revenue: bills.filter((b) => b.status === 'Paid').reduce((sum, b) => sum + Number(b.amount), 0),
    pending: bills.filter((b) => b.status !== 'Paid').reduce((sum, b) => sum + Number(b.amount), 0),
    paid: bills.filter((b) => b.status === 'Paid').length,
  }), [bills]);

  const q = search.toLowerCase();
  const filtered = bills.filter((b) => (b.patient.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)) && (status ? b.status === status : true));

  const subtotal = (modal?.items || []).reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const setItems = (items) => setModal((m) => ({ ...m, items }));

  async function fetchPatientDetails() {
    const pid = modal.patientId.trim();
    if (!pid) { notify('Please enter a Patient ID first.', 'warning'); return; }
    try {
      const patient = findPatient((await Users.getAll({ role: 'patient' })).data || [], pid);
      if (!patient) { notify('Patient not found. Please check the ID.', 'warning'); return; }
      const pName = patient.name || patient.fullName;
      const items = [];

      // 1. Beds
      try {
        const beds = (await Beds.getAll({ hospitalId })).data || [];
        // `patient` is the login account (U004); beds carry the patient record id (P001).
        const bed = beds.find((b) => b.patientId === patient.patientId || b.patientId === patient.id || (b.patient && b.patient === pName));
        const wardItem = bed ? wardLineItem(bed) : null;
        if (wardItem) items.push(wardItem);
      } catch (e) { console.warn('Failed fetching beds', e); }

      // 2. Appointments
      try {
        const appts = (await Appointments.getAll({ hospitalId })).data || [];
        appts
          .filter((a) => (a.patientId === patient.id || a.patientId === patient.patientId) && a.status !== 'Cancelled')
          .forEach((a) => {
            let doctorName = a.doctor || 'Unknown';
            if (doctorName.startsWith('Dr. ')) doctorName = doctorName.substring(4).trim();
            items.push({ description: `Consultation: Dr. ${doctorName} (${a.department || 'General'})`, amount: a.fee || a.amount || 500 });
          });
      } catch (e) { console.warn('Failed fetching appts', e); }

      // 3. Ambulance
      try {
        const ambs = (await Ambulance.getAll()).data || [];
        ambs.filter((a) => a.patientName === pName).forEach((a) => {
          items.push({ description: `Ambulance Transport: ${a.type || 'Standard'}`, amount: a.amount || 1200 });
        });
      } catch (e) { console.warn('Failed fetching ambulance', e); }

      if (items.length === 0) {
        notify('No active charges found for this patient. Please enter items manually.', 'info');
        items.push({ description: '', amount: 0 });
      }
      setModal((m) => ({ ...m, name: pName || 'Unknown', items }));
    } catch (err) {
      console.error('fetchPatientDetails error:', err);
      notify('Failed to fetch patient details. Backend may be offline.', 'error');
    }
  }

  async function save() {
    const pid = modal.patientId.trim();
    if (!pid) { notify('Patient ID is required.', 'warning'); return; }
    if (modal.items.length === 0) { notify('Please add at least one line item.', 'warning'); return; }
    for (const item of modal.items) {
      if (!item.description.trim() || item.amount <= 0) {
        notify('All line items must have a valid description and amount greater than 0.', 'warning');
        return;
      }
    }
    setBusy(true);
    try {
      const patient = findPatient((await Users.getAll({ role: 'patient' })).data || [], pid);
      if (!patient) { notify('Patient not found. Please verify the Patient ID.', 'warning'); return; }
      const payload = {
        patientId: patient.patientId || patient.id,
        visitDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: modal.items.map((item) => ({ description: item.description, department: 'Administrative', amount: Number(item.amount) })),
      };
      if (hospitalId) payload.hospitalId = hospitalId;
      await Billing.create(payload);
      logActivity('Create', 'Billing', `Admin generated new bill for ${modal.name} (ID: ${patient.id})`);
      setModal(null);
      await load();
    } catch (err) {
      console.error('Save bill error:', err);
      notify(errorMessage(err, 'Failed to save bill. Please try again.'), 'error');
    } finally {
      setBusy(false);
    }
  }

  function exportData() {
    let csv = 'ID,Patient,Date,Services,Amount,Status,Payment\n';
    bills.forEach((b) => { csv += `${b.id},${b.patient},${b.date},${b.services},${b.amount},${b.status},${b.payment}\n`; });
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bills.csv';
    a.click();
  }

  const billLines = (b) => [
    ['Bill ID', b.id], ['Patient', b.patient], ['Date', b.date], ['Services', b.services],
    ['Amount', `₹${b.amount}`], ['Status', b.status], ['Payment', b.payment],
  ];

  function printBillContent() {
    const content = billLines(view).map(([k, v]) => `<p><strong>${k}:</strong> ${v}</p>`).join('');
    const win = window.open('', '', 'width=600,height=600');
    if (!win) return;
    win.document.write(`<html><head><title>Print Bill</title></head><body>${content}</body></html>`);
    win.document.close();
    win.print();
  }

  async function downloadPDF() {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.text(billLines(view).map(([k, v]) => `${k}: ${v}`).join('\n'), 10, 10);
    doc.save('bill.pdf');
  }

  return (
    <div className="sp-bill">
      <div className="header-row">
        <div>
          <h1>Generate Bill</h1>
          <p className="sub">Create and manage patient bills and invoices</p>
        </div>
        <button type="button" className="btn" onClick={() => setModal({ patientId: '', name: '', items: [] })}>+ New Bill</button>
      </div>

      <div className="cards">
        <div className="card stat"><p>Total Bills</p><h3 id="totalBills">{totals.total}</h3></div>
        <div className="card stat green"><p>Total Revenue</p><h3 id="revenue">₹{totals.revenue.toFixed(2)}</h3></div>
        <div className="card stat yellow"><p>Pending Amount</p><h3 id="pending">₹{totals.pending.toFixed(2)}</h3></div>
        <div className="card stat purple"><p>Paid Bills</p><h3 id="paid">{totals.paid}</h3></div>
      </div>

      <div className="filters">
        <input id="searchInput" className="search" placeholder="Search by patient name, bill ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select id="statusFilter" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option>Paid</option>
          <option>Pending</option>
          <option>Overdue</option>
        </select>
        <button type="button" className="btn-outline" onClick={exportData}>Export</button>
      </div>

      <div className="card table-container">
        <table>
          <thead>
            <tr><th>Bill ID</th><th>Patient</th><th>Date</th><th>Services</th><th>Amount</th><th>Status</th><th>Payment</th><th>Actions</th></tr>
          </thead>
          <tbody id="bills">
            {loadError ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20, color: '#dc2626' }}>Failed to load bills. Backend may be offline.</td></tr>
            ) : filtered.map((b) => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>{b.patient}</td>
                <td>{b.date}</td>
                <td>{b.services}</td>
                <td>₹{b.amount}</td>
                <td><span className={`status ${b.status.toLowerCase()}`}>{b.status}</span></td>
                <td>{b.payment}</td>
                <td>
                  <div className="actions">
                    <button type="button" className="icon-btn" title="View" onClick={() => setView(b)}>
                      <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
                    </button>
                    <button type="button" className="icon-btn" title="Print" onClick={() => setView(b)}>
                      <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 9V4h12v5M6 18h12v-5H6v5z" /><rect x="6" y="13" width="12" height="5" /></svg>
                    </button>
                    <button type="button" className="icon-btn" title="Download" onClick={() => setView(b)}>
                      <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 3v12" /><path d="M8 11l4 4 4-4" /><path d="M4 21h16" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div id="modal" className="modal" style={{ display: 'flex' }}>
          <div className="card modal-card" style={{ width: 550 }}>
            <h3>New Bill</h3>
            <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
              <input id="patientId" className="input" placeholder="Patient ID (e.g. P001)" style={{ flex: 1, marginBottom: 0 }} value={modal.patientId} onChange={(e) => setModal({ ...modal, patientId: e.target.value })} />
              <button type="button" className="btn-outline" style={{ padding: '0 15px' }} onClick={fetchPatientDetails}>Fetch Details</button>
            </div>
            <input id="name" className="input" placeholder="Patient Name" readOnly style={{ background: '#f3f4f6' }} value={modal.name} />
            <div id="lineItemsContainer" style={{ marginBottom: 15 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 style={{ margin: 0, color: '#374151' }}>Line Items</h4>
                <button type="button" className="btn-outline" style={{ padding: '4px 10px', fontSize: 12, height: 28 }} onClick={() => setItems([...modal.items, { description: '', amount: 0 }])}>+ Add Item</button>
              </div>
              <div id="lineItemsList" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {modal.items.map((item, index) => (
                  <div key={index} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input className="input" style={{ flex: 2, marginBottom: 0 }} placeholder="Description" title={item.description} value={item.description} onChange={(e) => setItems(modal.items.map((it, i) => (i === index ? { ...it, description: e.target.value } : it)))} />
                    <input className="input" style={{ flex: 1, marginBottom: 0 }} type="number" placeholder="Amount" value={item.amount} onChange={(e) => setItems(modal.items.map((it, i) => (i === index ? { ...it, amount: Number(e.target.value) } : it)))} />
                    <button type="button" className="btn-outline" style={{ color: 'red', borderColor: 'red', padding: '4px 8px' }} onClick={() => setItems(modal.items.filter((_, i) => i !== index))}>X</button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontWeight: 'bold', marginBottom: 15, fontSize: 16 }}>
              Subtotal: ₹<span id="billTotalAmount">{subtotal.toFixed(2)}</span>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={save} disabled={busy}>Save</button>
              <button type="button" className="btn-outline" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {view && (
        <div id="viewModal" className="modal" style={{ display: 'flex' }}>
          <div className="card modal-card" style={{ width: 500 }}>
            <h3>Bill Details</h3>
            <div id="billContent">
              {billLines(view).map(([k, v]) => <p key={k}><strong>{k}:</strong> {v}</p>)}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={printBillContent}>Print</button>
              <button type="button" className="btn-outline" onClick={downloadPDF}>Download PDF</button>
              <button type="button" className="btn-outline" onClick={() => setView(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
