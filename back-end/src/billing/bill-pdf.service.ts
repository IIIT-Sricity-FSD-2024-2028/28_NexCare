import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class BillPdfService {
  /**
   * Generates a PDF buffer for a given bill object.
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
        doc.text(`Date: ${new Date(bill.date).toLocaleString()}`);
        doc.text(`Status: ${bill.status.toUpperCase()}`);
        doc.moveDown(1);

        // Patient Details
        doc.font('Helvetica-Bold').text('Patient Details:');
        doc.font('Helvetica').text(`Patient ID: ${bill.patientId}`);
        doc.text(`Patient Name: ${bill.patientName}`);
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
            doc.text(item.description, 50, y, { width: 250, continued: false });
            doc.text(String(item.quantity), 300, y, { width: 50, align: 'right', continued: false });
            doc.text(`Rs. ${item.unitPrice}`, 350, y, { width: 70, align: 'right', continued: false });
            doc.text(`Rs. ${item.amount}`, 420, y, { align: 'right' });
          });
        }
        
        doc.moveDown(1);
        doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
        doc.moveDown(1);

        // Totals
        const subtotal = bill.total - (bill.tax || 0);
        doc.font('Helvetica');
        doc.text('Subtotal:', 300, doc.y, { continued: true, width: 100, align: 'right' });
        doc.text(`Rs. ${subtotal}`, 400, doc.y, { align: 'right' });
        
        doc.text('GST:', 300, doc.y, { continued: true, width: 100, align: 'right' });
        doc.text(`Rs. ${bill.tax || 0}`, 400, doc.y, { align: 'right' });

        doc.moveDown(0.5);
        doc.font('Helvetica-Bold');
        doc.text('Total:', 300, doc.y, { continued: true, width: 100, align: 'right' });
        doc.text(`Rs. ${bill.total}`, 400, doc.y, { align: 'right' });

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
