import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class BillPdfService {
  /** Format a bill date, tolerating the field being absent or unparseable. */
  private static formatDate(value: unknown): string {
    if (!value) return 'Not recorded';
    const parsed = new Date(value as string);
    return Number.isNaN(parsed.getTime()) ? 'Not recorded' : parsed.toLocaleDateString('en-IN');
  }

  /** Render a rupee amount, defaulting a missing figure to zero rather than 'undefined'. */
  private static money(value: unknown): string {
    const amount = Number(value);
    return `Rs. ${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}`;
  }

  /**
   * Generates a PDF buffer for a given bill object.
   *
   * Bills carry visitDate/dueDate and split GST into cgstAmount + sgstAmount —
   * there is no `date` and no `tax` field. Reading those non-existent fields
   * printed 'Invalid Date' and silently dropped GST from a document headed
   * 'Tax Invoice'.
   */
  async generatePdf(bill: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text('NEXCARE PLATFORM', { align: 'center' })
          .fontSize(12)
          .font('Helvetica')
          .text(`Hospital ID: ${bill.hospitalId}`, { align: 'center' })
          .moveDown(2);

        // Invoice Meta
        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .text('Tax Invoice', { align: 'left' })
          .moveDown(1);
        
        doc.fontSize(10).font('Helvetica');
        doc.text(`Invoice Number: ${bill.id}`);
        doc.text(`Date: ${BillPdfService.formatDate(bill.visitDate ?? bill.createdAt)}`);
        if (bill.dueDate) doc.text(`Due Date: ${BillPdfService.formatDate(bill.dueDate)}`);
        doc.text(`Status: ${String(bill.status ?? 'unknown').toUpperCase()}`);
        doc.moveDown(1);

        // Patient Details
        doc.font('Helvetica-Bold').text('Patient Details:');
        doc.font('Helvetica').text(`Patient ID: ${bill.patientId}`);
        doc.text(`Patient Name: ${bill.patientName ?? 'Not recorded'}`);
        doc.moveDown(2);

        // Line Items Table Header
        doc.font('Helvetica-Bold');
        doc.text('Description', 50, doc.y, { continued: true, width: 250 });
        doc.text('Qty', 300, doc.y, { continued: true, width: 50, align: 'right' });
        doc.text('Price', 350, doc.y, { continued: true, width: 70, align: 'right' });
        doc.text('Amount', 420, doc.y, { align: 'right' });
        
        doc.moveTo(50, doc.y + 5).lineTo(500, doc.y + 5).stroke();
        doc.moveDown(1);

        // Line Items
        doc.font('Helvetica');
        if (bill.items && Array.isArray(bill.items)) {
          bill.items.forEach(item => {
            const y = doc.y;
            // Line items record a description and an amount; quantity and unit
            // price are optional, so derive them rather than printing undefined.
            const quantity = item.quantity ?? 1;
            const unitPrice = item.unitPrice ?? (quantity ? Number(item.amount) / quantity : item.amount);
            doc.text(item.description, 50, y, { width: 250, continued: false });
            doc.text(String(quantity), 300, y, { width: 50, align: 'right', continued: false });
            doc.text(BillPdfService.money(unitPrice), 350, y, { width: 70, align: 'right', continued: false });
            doc.text(BillPdfService.money(item.amount), 420, y, { align: 'right' });
          });
        }
        
        doc.moveDown(1);
        doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
        doc.moveDown(1);

        // Totals — the bill already carries a correct `subtotal`; use it rather
        // than recomputing, and show CGST and SGST as the separate components
        // an Indian tax invoice is required to itemise.
        const cgst = Number(bill.cgstAmount ?? 0);
        const sgst = Number(bill.sgstAmount ?? 0);
        const tax = cgst + sgst || Number(bill.tax ?? 0);
        const subtotal = bill.subtotal ?? Number(bill.total ?? 0) - tax;

        doc.font('Helvetica');
        doc.text('Subtotal:', 300, doc.y, { continued: true, width: 100, align: 'right' });
        doc.text(BillPdfService.money(subtotal), 400, doc.y, { align: 'right' });

        if (cgst || sgst) {
          const pct = (rate: unknown) => (rate ? ` (${(Number(rate) * 100).toFixed(0)}%)` : '');
          doc.text(`CGST${pct(bill.cgstRate)}:`, 300, doc.y, { continued: true, width: 100, align: 'right' });
          doc.text(BillPdfService.money(cgst), 400, doc.y, { align: 'right' });
          doc.text(`SGST${pct(bill.sgstRate)}:`, 300, doc.y, { continued: true, width: 100, align: 'right' });
          doc.text(BillPdfService.money(sgst), 400, doc.y, { align: 'right' });
        } else {
          doc.text('GST:', 300, doc.y, { continued: true, width: 100, align: 'right' });
          doc.text(BillPdfService.money(tax), 400, doc.y, { align: 'right' });
        }

        doc.moveDown(0.5);
        doc.font('Helvetica-Bold');
        doc.text('Total:', 300, doc.y, { continued: true, width: 100, align: 'right' });
        doc.text(BillPdfService.money(bill.total), 400, doc.y, { align: 'right' });

        // Footer
        doc.moveDown(4);
        doc.font('Helvetica').fontSize(9).fillColor('gray');
        doc.text('This is a computer generated invoice and does not require a signature.', { align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
