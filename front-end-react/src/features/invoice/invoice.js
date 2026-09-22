// Bill arithmetic and the PDF export, ported from front-end/shared/invoice-pdf.js
// (window.NexCareInvoice). The on-screen breakdown modal is InvoiceModal.jsx.
//
// jsPDF was a CDN <script> in the HTML pages; here it is a dependency, imported
// dynamically so ~600 kB of PDF machinery is only fetched when somebody
// actually downloads an invoice. The print-to-PDF fallback runs if that import
// or the export itself fails.
import { moneyFixed } from '../../utils/format';

/** Whether the bill carries an ambulance transport charge, and its details. */
export function checkAmbulanceStatus(bill) {
  const items = bill?.items || [];
  const ambItem = items.find(
    (it) => String(it.type || '').toUpperCase() === 'AMBULANCE' || String(it.description || '').toLowerCase().includes('ambulance'),
  );
  if (ambItem) {
    return {
      availed: true,
      fee: Number(ambItem.amount) || 500,
      referenceId: ambItem.referenceId || 'AMB-TRANS',
      description: ambItem.description || 'Ambulance Transport',
    };
  }
  return { availed: false, fee: 0, referenceId: 'N/A', description: 'Ambulance Transport (Not Availed)' };
}

/** Subtotal, GST and total — stored figures win, otherwise computed from the items. */
export function getBillTotals(bill) {
  const subtotal = Number(bill?.subtotal) || (bill?.items || []).reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const cgstRate = Number(bill?.cgstRate) || 0.09;
  const sgstRate = Number(bill?.sgstRate) || 0.09;
  const cgstAmount = Number(bill?.cgstAmount) || Number((subtotal * cgstRate).toFixed(2));
  const sgstAmount = Number(bill?.sgstAmount) || Number((subtotal * sgstRate).toFixed(2));
  const total = Number(bill?.total) || Number((subtotal + cgstAmount + sgstAmount).toFixed(2));
  return { subtotal, cgstRate, sgstRate, cgstAmount, sgstAmount, total };
}

/** The line items to print — a single consultation line when the bill has none. */
export function billItems(bill, totals = getBillTotals(bill)) {
  return bill?.items && bill.items.length
    ? bill.items
    : [{ description: 'Hospital Consultation Services', type: 'Consultation', referenceId: 'APT-GEN', amount: totals.subtotal }];
}

function patientFields(bill, patient) {
  return {
    pName: patient?.fullName || patient?.name || 'Patient',
    pId: patient?.patientIdDisplay || patient?.id || bill?.patientId || 'PAT-000',
    pPhone: patient?.phone || patient?.contact || 'N/A',
    pEmail: patient?.email || 'N/A',
    isPaid: String(bill?.status).toLowerCase() === 'paid',
    billId: bill?.id || 'BILL-000',
    visitDate:
      bill?.visitDate || bill?.dueDate || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
  };
}

/**
 * Generate and save `NexCare_Invoice_<id>.pdf`.
 *
 * `onError` lets the calling page report through the shared toast; this module
 * is plain JS with no access to the React context, and it used to raise a
 * native window.alert, which no other part of the app does.
 */
export async function downloadInvoicePDF(bill, patient, onError) {
  if (!bill) {
    if (onError) onError('No bill data available to download.');
    return false;
  }
  const totals = getBillTotals(bill);
  const ambStatus = checkAmbulanceStatus(bill);
  const { pName, pId, pPhone, pEmail, isPaid, billId, visitDate } = patientFields(bill, patient);

  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 35;

    // Header banner
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 80, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('NexCare Healthcare Systems', 40, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(148, 163, 184);
    doc.text('Official Hospital Itemized Bill & Tax Invoice', 40, y + 28);

    // Status badge, top right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    if (isPaid) doc.setFillColor(16, 185, 129);
    else doc.setFillColor(245, 158, 11);
    doc.roundedRect(pageWidth - 190, y - 5, 150, 24, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(isPaid ? 'STATUS: PAID' : 'STATUS: PENDING PAYMENT', pageWidth - 180, y + 11);

    y = 105;

    // Patient + invoice meta box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(40, y, pageWidth - 80, 80, 6, 6, 'FD');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT INFORMATION', 55, y + 20);
    doc.text('INVOICE DETAILS', pageWidth / 2 + 10, y + 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Name: ${pName}`, 55, y + 38);
    doc.text(`Patient ID: ${pId}`, 55, y + 54);
    doc.text(`Contact: ${pPhone} | ${pEmail}`, 55, y + 70);
    doc.text(`Bill ID: ${billId}`, pageWidth / 2 + 10, y + 38);
    doc.text(`Visit Date: ${visitDate}`, pageWidth / 2 + 10, y + 54);
    doc.text(`Due Date: ${bill.dueDate || visitDate}`, pageWidth / 2 + 10, y + 70);

    y = 205;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('ITEMIZED COST BREAKDOWN', 40, y);
    y += 12;

    // Table header
    doc.setFillColor(241, 245, 249);
    doc.rect(40, y, pageWidth - 80, 24, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Description', 50, y + 16);
    doc.text('Service Type', 260, y + 16);
    doc.text('Reference', 360, y + 16);
    doc.text('Amount (INR)', pageWidth - 120, y + 16);
    y += 24;

    doc.setFont('helvetica', 'normal');
    billItems(bill, totals).forEach((item, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(40, y, pageWidth - 80, 22, 'F');
      }
      doc.setTextColor(30, 41, 59);
      doc.text(String(item.description || 'Service'), 50, y + 15);
      doc.text(String(item.type || item.department || 'Consultation'), 260, y + 15);
      doc.text(String(item.referenceId || '—'), 360, y + 15);
      doc.setFont('helvetica', 'bold');
      doc.text(moneyFixed(item.amount), pageWidth - 120, y + 15);
      doc.setFont('helvetica', 'normal');
      doc.setDrawColor(241, 245, 249);
      doc.line(40, y + 22, pageWidth - 40, y + 22);
      y += 22;
    });

    // Ambulance callout
    y += 10;
    if (ambStatus.availed) {
      doc.setFillColor(254, 243, 199);
      doc.setDrawColor(245, 158, 11);
      doc.roundedRect(40, y, pageWidth - 80, 28, 4, 4, 'FD');
      doc.setTextColor(146, 64, 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`✓ Ambulance Service: AVAILED (${ambStatus.description}) — Fixed Transport Fee: ₹${ambStatus.fee.toFixed(2)}`, 50, y + 18);
    } else {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(40, y, pageWidth - 80, 28, 4, 4, 'FD');
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('ℹ Ambulance Service: NOT AVAILED for this visit (Transport Fee: ₹0.00)', 50, y + 18);
    }
    y += 40;

    // Summary box
    const summaryWidth = 230;
    const summaryX = pageWidth - 40 - summaryWidth;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(summaryX, y, summaryWidth, 100, 6, 6, 'FD');
    let sY = y + 20;
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text('Subtotal:', summaryX + 15, sY);
    doc.text(moneyFixed(totals.subtotal), summaryX + summaryWidth - 15, sY, { align: 'right' });
    sY += 18;
    doc.text(`CGST (${(totals.cgstRate * 100).toFixed(0)}%):`, summaryX + 15, sY);
    doc.text(moneyFixed(totals.cgstAmount), summaryX + summaryWidth - 15, sY, { align: 'right' });
    sY += 18;
    doc.text(`SGST (${(totals.sgstRate * 100).toFixed(0)}%):`, summaryX + 15, sY);
    doc.text(moneyFixed(totals.sgstAmount), summaryX + summaryWidth - 15, sY, { align: 'right' });
    sY += 22;
    doc.setDrawColor(203, 213, 225);
    doc.line(summaryX + 10, sY - 8, summaryX + summaryWidth - 10, sY - 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Total Amount:', summaryX + 15, sY + 6);
    doc.text(moneyFixed(totals.total), summaryX + summaryWidth - 15, sY + 6, { align: 'right' });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 40;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('This is an authentic, computer-generated tax invoice issued by NexCare Hospital Management System.', 40, footerY);
    doc.text('For billing inquiries or support, please contact billing@nexcare.com.', 40, footerY + 14);

    doc.save(`NexCare_Invoice_${billId}.pdf`);
  } catch (err) {
    console.error('[InvoicePDF] jsPDF export failed, falling back to print-to-PDF:', err);
    printInvoiceHTML(bill, patient);
  }
}

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Fallback: a printable invoice in a new window. */
export function printInvoiceHTML(bill, patient) {
  const totals = getBillTotals(bill);
  const ambStatus = checkAmbulanceStatus(bill);
  const { pName, pId, pPhone, isPaid, billId, visitDate } = patientFields(bill, patient);
  const items = billItems(bill, totals);

  const html = `<!DOCTYPE html><html><head><title>NexCare Invoice - ${esc(billId)}</title>
<style>
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #0F172A; max-width: 800px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0F172A; padding-bottom: 16px; margin-bottom: 24px; }
.header h1 { margin: 0; font-size: 24px; color: #0F172A; }
.badge { display: inline-block; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 12px; }
.badge-paid { background: #D1FAE5; color: #065F46; } .badge-pending { background: #FEF3C7; color: #92400E; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #F8FAFC; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #E2E8F0; } th { background: #F1F5F9; font-weight: 600; } .num { text-align: right; }
.callout { padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; }
.callout-availed { background: #FEF3C7; border: 1px solid #F59E0B; color: #92400E; font-weight: 600; }
.callout-not-availed { background: #F1F5F9; border: 1px solid #CBD5E1; color: #475569; }
.summary { width: 280px; margin-left: auto; background: #F8FAFC; padding: 16px; border-radius: 8px; }
.summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
.summary-total { font-size: 16px; font-weight: bold; border-top: 1px solid #CBD5E1; padding-top: 8px; margin-top: 8px; }
.footer { text-align: center; font-size: 12px; color: #94A3B8; margin-top: 40px; }
@media print { button { display: none; } body { padding: 0; } }
</style></head><body>
<div class="header"><div><h1>NexCare Healthcare Systems</h1><p style="margin: 4px 0 0; color: #64748B;">Official Hospital Itemized Bill &amp; Tax Invoice</p></div>
<div><span class="badge ${isPaid ? 'badge-paid' : 'badge-pending'}">${isPaid ? 'PAID' : 'PENDING PAYMENT'}</span></div></div>
<div class="grid"><div><strong>PATIENT DETAILS:</strong><br>Name: ${esc(pName)}<br>Patient ID: ${esc(pId)}<br>Phone: ${esc(pPhone)}</div>
<div><strong>INVOICE DETAILS:</strong><br>Bill ID: ${esc(billId)}<br>Visit Date: ${esc(visitDate)}<br>Due Date: ${esc(bill.dueDate || visitDate)}</div></div>
<h3>Itemized Cost Breakdown</h3>
<table><thead><tr><th>Description</th><th>Service Type</th><th>Reference</th><th class="num">Amount</th></tr></thead><tbody>
${items.map((it) => `<tr><td>${esc(it.description)}</td><td>${esc(it.type || it.department || 'Consultation')}</td><td>${esc(it.referenceId || '—')}</td><td class="num"><strong>${moneyFixed(it.amount)}</strong></td></tr>`).join('')}
</tbody></table>
<div class="callout ${ambStatus.availed ? 'callout-availed' : 'callout-not-availed'}">${ambStatus.availed
    ? `✓ Ambulance Service: AVAILED (${esc(ambStatus.description)}) — Transport Fee: ₹${ambStatus.fee.toFixed(2)}`
    : 'ℹ Ambulance Service: NOT AVAILED for this visit (Transport Fee: ₹0.00)'}</div>
<div class="summary">
<div class="summary-row"><span>Subtotal:</span><span>${moneyFixed(totals.subtotal)}</span></div>
<div class="summary-row"><span>CGST (9%):</span><span>${moneyFixed(totals.cgstAmount)}</span></div>
<div class="summary-row"><span>SGST (9%):</span><span>${moneyFixed(totals.sgstAmount)}</span></div>
<div class="summary-row summary-total"><span>Total Amount:</span><span>${moneyFixed(totals.total)}</span></div>
</div>
<div class="footer"><p>This is a computer-generated tax invoice from NexCare Healthcare Systems.</p></div>
</body></html>`;

  const printWin = window.open('', '_blank');
  if (printWin) {
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 400);
  }
}
