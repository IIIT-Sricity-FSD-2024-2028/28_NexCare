import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Billing } from '../../api';
import { useToast } from '../../context/ToastContext';
import CardPaymentForm from '../../features/payments/CardPaymentForm';
import { payBill as payBillThroughGateway } from '../../features/payments/payBill';
import InvoiceModal from '../../features/invoice/InvoiceModal';
import { checkAmbulanceStatus, downloadInvoicePDF, getBillTotals } from '../../features/invoice/invoice';
import { moneyFixed } from '../../utils/format';
import PatientHeader from './PatientHeader';
import { usePatient } from './PatientContext';

// patient/billing.html + billing.js.
//
// The bill the details panel shows was handed over in sessionStorage
// (`nexcare_selected_bill_id`) because the static host dropped query strings.
// The SPA uses ?bill=<id> instead (plan.md §4) and still falls back to the
// first pending bill, then the first bill of any kind.

export default function BillingPage() {
  const [params, setParams] = useSearchParams();
  const { notify } = useToast();
  const { patient, displayName, displayId } = usePatient();

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [invoiceBill, setInvoiceBill] = useState(null);

  const load = useCallback(async () => {
    try {
      setBills((await Billing.getAll()).data || []);
    } catch (err) {
      notify(err.message || 'Could not load your bills', 'error');
      setBills([]);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  const pendingBills = bills.filter((b) => String(b.status).toLowerCase() === 'pending');
  const paidBills = bills.filter((b) => String(b.status).toLowerCase() === 'paid');

  const selectedId = params.get('bill');
  const bill = (selectedId && bills.find((b) => String(b.id) === String(selectedId))) || pendingBills[0] || bills[0] || null;

  const select = (id) => setParams({ bill: id }, { replace: true });

  const totals = bill ? getBillTotals(bill) : null;
  const amb = bill ? checkAmbulanceStatus(bill) : null;
  const isPaid = bill ? bill.status === 'Paid' : false;

  async function handlePayment(card) {
    if (!bill) {
      setPayError('Could not work out which bill you are paying');
      return;
    }
    setPaying(true);
    setPayError('');
    try {
      const result = await payBillThroughGateway(bill.id, card);
      console.info('[NexCare] Platform fees recorded:', result?.platformFees || []);
      setPayOpen(false);
      notify(`Payment of ${moneyFixed(totals.total)} approved for ${bill.id}.`, 'success');
      await load();
    } catch (err) {
      // A decline is a normal outcome — show why, leave the bill open.
      setPayError(err.message || 'The payment could not be processed');
    } finally {
      setPaying(false);
    }
  }

  const info = [
    ['Patient Name', displayName],
    ['Patient ID', displayId],
    ['Phone', patient?.phone],
    ['Email', patient?.email],
    ['Visit Date', bill?.visitDate || bill?.dueDate],
    ['Bill ID', bill?.id],
    ['Due Date', bill?.dueDate],
    ['Status', bill?.status],
  ];

  const itemRows = (items) => {
    if (!items || items.length === 0) {
      return <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20, color: '#6B7280' }}>No items on this bill yet</td></tr>;
    }
    return items.map((it, i) => {
      const itemType = it.type ? it.type.charAt(0).toUpperCase() + it.type.slice(1).toLowerCase() : it.department || 'Consultation';
      const isAmb = String(it.type || it.description || '').toLowerCase().includes('ambulance');
      return (
        <tr key={i}>
          <td style={{ fontWeight: 500, color: '#1E293B' }}>{it.description}</td>
          <td><span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 600, background: isAmb ? '#FEF3C7' : '#EFF6FF', color: isAmb ? '#B45309' : '#1D4ED8' }}>{itemType}</span></td>
          <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748B' }}>{it.referenceId || '—'}</span></td>
          <td style={{ fontWeight: 600, color: '#0F172A' }}>{moneyFixed(it.amount)}</td>
        </tr>
      );
    });
  };

  return (
    <main className="main-content">
      <PatientHeader searchPlaceholder="Search bills, records, history..." />

      <div className="billing-page">
        <div className="billing-header">
          <div className="billing-title">
            <h1>Billing &amp; Payment</h1>
            <p>View your bills, payment history, and manage your payment methods securely.</p>
          </div>
        </div>

        <div className="billing-content">
          <div className="billing-left">
            {/* Pending bills */}
            <div className="billing-card" id="pendingBillsCard">
              <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span>Pending Bills</span>
                <span className="badge badge-pending" id="pendingBillsCount">{pendingBills.length}</span>
              </h2>
              <div className="billing-table-container" style={{ marginTop: 12 }}>
                <table className="billing-table-full">
                  <thead>
                    <tr><th>Bill ID</th><th>Visit Date</th><th>Amount</th><th>Status</th><th style={{ textAlign: 'right' }}>Action</th></tr>
                  </thead>
                  <tbody id="pendingBillsBody">
                    {loading && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 16, color: '#6A7282' }}>Loading…</td></tr>}
                    {!loading && pendingBills.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 16, color: '#6A7282' }}>No pending bills.</td></tr>}
                    {!loading && pendingBills.map((b) => (
                      <tr key={b.id} data-id={b.id}>
                        <td><strong>{b.id}</strong></td>
                        <td>{b.visitDate || b.dueDate || ''}</td>
                        <td><strong>{moneyFixed(getBillTotals(b).total)}</strong></td>
                        <td><span className="badge badge-pending">Pending</span></td>
                        <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                          <button type="button" className="btn-view-invoice" onClick={() => { select(b.id); setInvoiceBill(b); }}>View</button>
                          <button type="button" className="btn-pay" onClick={() => { select(b.id); setPayError(''); setPayOpen(true); }}>Pay Now</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending / paid alert for the active bill */}
            {bill && (
              <div
                className="pending-bill-alert"
                id="pendingBillAlert"
                style={{ borderLeft: isPaid ? '4px solid #00A63E' : '4px solid #F59E0B', background: isPaid ? '#F0FDF4' : '#FFF7ED' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9v4M12 17h.01" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="10" stroke="#10B981" strokeWidth="2" />
                </svg>
                <div>
                  <h3 id="pendingBillTitle">
                    {isPaid ? 'Paid Invoice' : `${pendingBills.length || 1} Pending Invoice${(pendingBills.length || 1) > 1 ? 's' : ''}`}
                  </h3>
                  <p id="pendingBillText">
                    {isPaid ? 'Thank you for your timely payment.' : `Amount ${moneyFixed(totals.total)} is due by ${bill.dueDate}`}
                  </p>
                </div>
                <span className={`badge ${isPaid ? 'badge-completed-lg' : 'badge-pending-lg'}`} id="pendingBillBadge">{bill.status}</span>
              </div>
            )}

            {/* Patient information */}
            <div className="billing-card">
              <h2>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="7" r="3" stroke="#0F172A" strokeWidth="1.5" />
                  <path d="M17 18c0-3.866-3.134-7-7-7s-7 3.134-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>{' '}
                Patient Information (<span id="activePatientNameDisplay">{displayName}</span>)
              </h2>
              <div className="patient-info-grid">
                {info.map(([label, value]) => (
                  <div className="info-field" key={label}>
                    <label>{label}</label>
                    <p className="info-value">{value || 'N/A'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Itemized bill */}
            <div className="billing-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                <div>
                  <h2 style={{ margin: 0 }}>Itemized Bill</h2>
                  <p className="card-subtitle" style={{ margin: '4px 0 0' }}>Detailed breakdown of charges &amp; services</p>
                </div>
                <button
                  type="button"
                  id="btnDownloadCurrentBill"
                  className="btn-outline-sm"
                  disabled={!bill}
                  onClick={() => downloadInvoicePDF(bill, patient, (m) => notify(m, 'warning'))}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A', padding: '7px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M14 10v3.333A1.333 1.333 0 0112.667 14.667H3.333A1.333 1.333 0 012 13.333V10" stroke="#0F172A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4.667 6.667L8 10l3.333-3.333M8 10V1.333" stroke="#0F172A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>{' '}
                  Download PDF Invoice
                </button>
              </div>

              <div className="itemized-table">
                <table>
                  <thead>
                    <tr><th>Description</th><th>Type</th><th>Reference</th><th>Amount</th></tr>
                  </thead>
                  <tbody id="billItemsBody">{itemRows(bill?.items)}</tbody>
                </table>
              </div>

              {/* Ambulance callout */}
              <div
                id="billingAmbulanceCallout"
                style={{ padding: '12px 16px', borderRadius: 8, margin: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: amb?.availed ? '#FFFBEB' : '#F8FAFC', border: amb?.availed ? '1px solid #FDE68A' : '1px solid #E2E8F0' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span id="ambIcon" style={{ fontSize: 18 }}>{amb?.availed ? '🚑' : '🏥'}</span>
                  <div>
                    <strong id="ambTitle" style={{ fontSize: 13, color: amb?.availed ? '#92400E' : '#475569' }}>
                      {amb?.availed ? 'Ambulance Service: Availed (Transport Charge Included)' : 'Ambulance Service: Not Availed'}
                    </strong>
                    <p id="ambSubtitle" style={{ margin: '2px 0 0', fontSize: 12, color: amb?.availed ? '#B45309' : '#64748B' }}>
                      {amb?.availed ? `Emergency transport availed (${amb.description}, Ref: ${amb.referenceId})` : 'No ambulance transport requested for this visit'}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span id="ambFeeDisplay" style={{ fontSize: 13, fontWeight: 700, color: amb?.availed ? '#92400E' : '#64748B' }}>
                    {amb?.availed ? moneyFixed(amb.fee) : '₹0.00 (No fee)'}
                  </span>
                </div>
              </div>

              <div className="bill-summary">
                <div className="summary-row"><span>Subtotal</span><span className="amount">{moneyFixed(totals?.subtotal)}</span></div>
                <div className="summary-row"><span>CGST (9%)</span><span className="amount">{moneyFixed(totals?.cgstAmount)}</span></div>
                <div className="summary-row"><span>SGST (9%)</span><span className="amount">{moneyFixed(totals?.sgstAmount)}</span></div>
                <div className="summary-row total"><span>Total Amount</span><span className="amount">{moneyFixed(totals?.total)}</span></div>
              </div>
            </div>

            {/* Payment history */}
            <div className="billing-card" id="paymentHistoryCard">
              <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span>Payment History</span>
                <span className="badge badge-paid" id="paidBillsCount">{paidBills.length}</span>
              </h2>
              <p className="card-subtitle">Completed payments and settled invoices</p>
              <div className="billing-table-container" style={{ marginTop: 12 }}>
                <table className="billing-table-full">
                  <thead>
                    <tr><th>Bill ID</th><th>Visit Date</th><th>Amount</th><th>Status</th><th style={{ textAlign: 'right' }}>Receipt</th></tr>
                  </thead>
                  <tbody id="paidBillsBody">
                    {loading && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 16, color: '#6A7282' }}>Loading…</td></tr>}
                    {!loading && paidBills.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 16, color: '#6A7282' }}>No payment history yet.</td></tr>}
                    {!loading && paidBills.map((b) => (
                      <tr key={b.id} data-id={b.id}>
                        <td><strong>{b.id}</strong></td>
                        <td>{b.visitDate || b.dueDate || ''}</td>
                        <td><strong>{moneyFixed(getBillTotals(b).total)}</strong></td>
                        <td><span className="badge badge-paid">Paid</span></td>
                        <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                          <button type="button" className="btn-view-invoice" onClick={() => { select(b.id); setInvoiceBill(b); }}>View</button>
                          <button
                            type="button"
                            className="btn-outline-sm"
                            onClick={() => { select(b.id); downloadInvoicePDF(b, patient, (m) => notify(m, 'warning')); }}
                            style={{ padding: '4px 10px', fontSize: 12, borderRadius: 6, fontWeight: 600, cursor: 'pointer', background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A' }}
                          >
                            PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Payment sidebar — hidden when there is no bill at all */}
          {bill && (
            <div className="billing-right">
              <div className="payment-card">
                <h2>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="4" width="16" height="12" rx="2" stroke="#0F172A" strokeWidth="1.5" />
                    <path d="M2 8h16" stroke="#0F172A" strokeWidth="1.5" />
                  </svg>{' '}
                  Payment
                </h2>
                <p className="card-subtitle">Complete your payment securely</p>
                <div className="amount-display">
                  <p className="amount-label">Total Amount Due</p>
                  <h1 className="amount-value" style={{ color: isPaid ? '#00A63E' : '#111827' }}>{isPaid ? 'PAID' : moneyFixed(totals.total)}</h1>
                </div>
                {!isPaid && (
                  <button type="button" className="btn-proceed-payment" onClick={() => { setPayError(''); setPayOpen(true); }}>Proceed to Payment</button>
                )}
                <p className="payment-security">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1L1 3.5v3a4.5 4.5 0 004.5 4.5h.5a4.5 4.5 0 004.5-4.5v-3L6 1z" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4.5 6l1 1L7.5 5" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>{' '}
                  Secure payment powered by NexCare Payment Gateway
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment modal */}
      {payOpen && bill && (
        <div id="paymentModal" className="modal" style={{ display: 'block' }} onMouseDown={(e) => { if (e.target === e.currentTarget) setPayOpen(false); }}>
          <div className="modal-content payment-modal-content">
            <div className="modal-header">
              <h2>NexCare Hospital</h2>
              <p>Billing &amp; Payment Portal</p>
              <button type="button" className="modal-close" onClick={() => setPayOpen(false)} aria-label="Close">&times;</button>
            </div>
            <div className="modal-body">
              <div className="payment-layout">
                <div className="payment-left-section">
                  <div className="modal-patient-info">
                    <h3>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <circle cx="9" cy="6.5" r="2.5" stroke="#0F172A" strokeWidth="1.5" />
                        <path d="M15 16a6 6 0 00-12 0" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>{' '}
                      Patient Information
                    </h3>
                    <div className="modal-info-grid">
                      <div><label>Patient Name</label><p>{displayName || 'N/A'}</p></div>
                      <div><label>Patient ID</label><p>{displayId || 'N/A'}</p></div>
                      <div><label>Phone</label><p>{patient?.phone || 'N/A'}</p></div>
                      <div><label>Email</label><p>{patient?.email || 'N/A'}</p></div>
                      <div><label>Visit Date</label><p>{bill.visitDate || bill.dueDate || 'N/A'}</p></div>
                      <div><label>Bill ID</label><p>{bill.id}</p></div>
                    </div>
                  </div>

                  <div className="modal-itemized">
                    <h3>Itemized Bill</h3>
                    <p>Detailed breakdown of charges</p>
                    <table className="modal-table">
                      <thead>
                        <tr><th>Description</th><th>Department</th><th>Date</th><th>Amount</th></tr>
                      </thead>
                      <tbody id="modalBillItemsBody">{itemRows(bill.items)}</tbody>
                    </table>
                    <div className="modal-summary">
                      <div className="summary-row"><span>Subtotal</span><span id="modalSubtotal">{moneyFixed(totals.subtotal)}</span></div>
                      <div className="summary-row"><span>CGST (9%)</span><span id="modalCGST">{moneyFixed(totals.cgstAmount)}</span></div>
                      <div className="summary-row"><span>SGST (9%)</span><span id="modalSGST">{moneyFixed(totals.sgstAmount)}</span></div>
                      <div className="summary-row total"><span>Total Amount</span><span id="modalTotal">{moneyFixed(totals.total)}</span></div>
                    </div>
                  </div>
                </div>

                <div className="payment-right-section">
                  <CardPaymentForm
                    amountLabel={moneyFixed(totals.total)}
                    busy={paying}
                    error={payError}
                    onSubmit={handlePayment}
                    onCancel={() => setPayOpen(false)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <InvoiceModal
        bill={invoiceBill}
        patient={patient}
        onClose={() => setInvoiceBill(null)}
        onPay={() => { setPayError(''); setPayOpen(true); }}
      />
    </main>
  );
}
