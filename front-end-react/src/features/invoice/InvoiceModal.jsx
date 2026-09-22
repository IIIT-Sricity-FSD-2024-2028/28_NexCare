import { useEffect } from 'react';
import { billItems, checkAmbulanceStatus, downloadInvoicePDF, getBillTotals } from './invoice';
import { moneyFixed } from '../../utils/format';

// The "Tax Invoice & Cost Breakdown" overlay from shared/invoice-pdf.js
// (openViewBillModal). `onPay` is only offered for an unpaid bill.
export default function InvoiceModal({ bill, patient, onClose, onPay }) {
  useEffect(() => {
    if (!bill) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [bill]);

  if (!bill) return null;

  const totals = getBillTotals(bill);
  const amb = checkAmbulanceStatus(bill);
  const pName = patient?.fullName || patient?.name || 'Patient';
  const pId = patient?.patientIdDisplay || patient?.id || bill.patientId || 'PAT-000';
  const pPhone = patient?.phone || patient?.contact || 'N/A';
  const isPaid = String(bill.status).toLowerCase() === 'paid';
  const billId = bill.id || 'BILL-000';
  const visitDate = bill.visitDate || bill.dueDate || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const items = billItems(bill, totals);

  return (
    <div
      id="viewBillModal"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ display: 'flex', position: 'fixed', zIndex: 99999, left: 0, top: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(5px)', alignItems: 'center', justifyContent: 'center', overflowY: 'auto', padding: 20 }}
    >
      <div style={{ background: '#fff', borderRadius: 16, maxWidth: 680, width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#fff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>Tax Invoice &amp; Cost Breakdown</h3>
              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 700, background: isPaid ? '#10B981' : '#F59E0B', color: '#fff' }}>{isPaid ? 'PAID' : 'PENDING'}</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94A3B8' }}>Invoice ID: <strong>{billId}</strong> | Visit: {visitDate}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 8, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
        </div>

        <div style={{ padding: 24, maxHeight: 'calc(85vh - 140px)', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: '#F8FAFC', padding: 16, borderRadius: 10, border: '1px solid #E2E8F0', marginBottom: 20 }}>
            <div>
              <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Patient Name</span>
              <strong style={{ fontSize: 14, color: '#0F172A' }}>{pName}</strong>
              <span style={{ display: 'block', fontSize: 12, color: '#64748B', marginTop: 2 }}>ID: {pId}</span>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Contact &amp; Date</span>
              <span style={{ fontSize: 13, color: '#0F172A' }}>{pPhone}</span>
              <span style={{ display: 'block', fontSize: 12, color: '#64748B', marginTop: 2 }}>Due: {bill.dueDate || visitDate}</span>
            </div>
          </div>

          <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Itemized Breakdown</h4>
          <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F1F5F9', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Description</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Type</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Reference</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => {
                  const isAmb = String(it.type || it.description || '').toLowerCase().includes('ambulance');
                  return (
                    <tr key={i} style={{ borderTop: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '10px 12px', color: '#1E293B', fontWeight: 500 }}>{it.description}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 600, background: isAmb ? '#FEF3C7' : '#EFF6FF', color: isAmb ? '#B45309' : '#1D4ED8' }}>{it.type || it.department || 'Consultation'}</span>
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#64748B', fontSize: 12 }}>{it.referenceId || '—'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#0F172A' }}>{moneyFixed(it.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: amb.availed ? '#FFFBEB' : '#F8FAFC', border: amb.availed ? '1px solid #FDE68A' : '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{amb.availed ? '🚑' : '🏥'}</span>
              <div>
                <strong style={{ fontSize: 13, color: amb.availed ? '#92400E' : '#475569' }}>Ambulance Service: {amb.availed ? 'Availed' : 'Not Availed'}</strong>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: amb.availed ? '#B45309' : '#64748B' }}>
                  {amb.availed ? `Emergency transport utilized (Ref: ${amb.referenceId})` : 'No ambulance transport requested for this visit'}
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: amb.availed ? '#92400E' : '#64748B' }}>{amb.availed ? moneyFixed(amb.fee) : '₹0.00 (No fee)'}</span>
            </div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 8 }}><span>Subtotal</span><strong style={{ color: '#0F172A' }}>{moneyFixed(totals.subtotal)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 8 }}><span>Central GST (CGST 9%)</span><span>{moneyFixed(totals.cgstAmount)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 12 }}><span>State GST (SGST 9%)</span><span>{moneyFixed(totals.sgstAmount)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: '#0F172A', borderTop: '1px solid #CBD5E1', paddingTop: 10 }}><span>Grand Total</span><span style={{ color: '#155DFC' }}>{moneyFixed(totals.total)}</span></div>
          </div>
        </div>

        <div style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <button type="button" onClick={onClose} style={{ background: '#fff', border: '1px solid #CBD5E1', color: '#475569', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Close</button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => downloadInvoicePDF(bill, patient)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0F172A', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M14 10v3.333A1.333 1.333 0 0112.667 14.667H3.333A1.333 1.333 0 012 13.333V10" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4.667 6.667L8 10l3.333-3.333M8 10V1.333" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>{' '}
              Download PDF
            </button>
            {!isPaid && onPay && (
              <button type="button" onClick={() => { onClose(); onPay(); }} style={{ background: '#155DFC', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Pay Now</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
