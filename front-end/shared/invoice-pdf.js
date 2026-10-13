/**
 * NexCare Invoice PDF & Breakdown Modal Generator
 * Handles itemized cost breakdown, ambulance status checks, and PDF exports.
 */

(function () {
    // Helper to format currency
    function formatINR(val) {
        const n = Number(val) || 0;
        return '₹' + n.toFixed(2);
    }

    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m]));
    }

    /**
     * Inspects whether the bill includes an ambulance transport charge.
     */
    function checkAmbulanceStatus(bill) {
        const items = bill.items || [];
        const ambItem = items.find(it => 
            String(it.type || '').toUpperCase() === 'AMBULANCE' ||
            String(it.description || '').toLowerCase().includes('ambulance')
        );

        if (ambItem) {
            return {
                availed: true,
                fee: Number(ambItem.amount) || 500,
                referenceId: ambItem.referenceId || 'AMB-TRANS',
                description: ambItem.description || 'Ambulance Transport'
            };
        }
        return {
            availed: false,
            fee: 0,
            referenceId: 'N/A',
            description: 'Ambulance Transport (Not Availed)'
        };
    }

    /**
     * Computes bill subtotal and taxes.
     */
    function getBillTotals(bill) {
        const subtotal = Number(bill.subtotal) || (bill.items || []).reduce((s, it) => s + (Number(it.amount) || 0), 0);
        const cgstRate = Number(bill.cgstRate) || 0.09;
        const sgstRate = Number(bill.sgstRate) || 0.09;
        const cgstAmount = Number(bill.cgstAmount) || Number((subtotal * cgstRate).toFixed(2));
        const sgstAmount = Number(bill.sgstAmount) || Number((subtotal * sgstRate).toFixed(2));
        const total = Number(bill.total) || Number((subtotal + cgstAmount + sgstAmount).toFixed(2));

        return { subtotal, cgstRate, sgstRate, cgstAmount, sgstAmount, total };
    }

    /**
     * Generates and downloads the PDF bill using jsPDF or a clean printable layout.
     */
    async function downloadInvoicePDF(bill, patient) {
        if (!bill) {
            alert('No bill data available to download.');
            return;
        }

        const totals = getBillTotals(bill);
        const ambStatus = checkAmbulanceStatus(bill);
        const pName = patient?.fullName || patient?.name || 'Patient';
        const pId = patient?.patientIdDisplay || patient?.id || bill.patientId || 'PAT-000';
        const pPhone = patient?.phone || patient?.contact || 'N/A';
        const pEmail = patient?.email || 'N/A';
        const isPaid = String(bill.status).toLowerCase() === 'paid';
        const billId = bill.id || 'BILL-000';
        const visitDate = bill.visitDate || bill.dueDate || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

        // If jsPDF is available, generate standalone PDF
        if (window.jspdf && window.jspdf.jsPDF) {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
                const pageWidth = doc.internal.pageSize.getWidth();
                let y = 35;

                // Header Banner
                doc.setFillColor(15, 23, 42); // slate-900
                doc.rect(0, 0, pageWidth, 80, 'F');

                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(22);
                doc.text('NexCare Healthcare Systems', 40, y + 10);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.setTextColor(148, 163, 184); // slate-400
                doc.text('Official Hospital Itemized Bill & Tax Invoice', 40, y + 28);

                // Invoice Status Badge (Top Right)
                const statusText = isPaid ? 'STATUS: PAID' : 'STATUS: PENDING PAYMENT';
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                if (isPaid) {
                    doc.setFillColor(16, 185, 129); // green
                } else {
                    doc.setFillColor(245, 158, 11); // amber
                }
                doc.roundedRect(pageWidth - 190, y - 5, 150, 24, 4, 4, 'F');
                doc.setTextColor(255, 255, 255);
                doc.text(statusText, pageWidth - 180, y + 11);

                y = 105;

                // Invoice Meta & Patient Details Box
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

                // Section Title: Cost Breakdown
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(13);
                doc.setTextColor(15, 23, 42);
                doc.text('ITEMIZED COST BREAKDOWN', 40, y);
                y += 12;

                // Table Header
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

                // Line Items
                const items = (bill.items && bill.items.length) ? bill.items : [
                    { description: 'Hospital Consultation Services', type: 'Consultation', referenceId: 'APT-GEN', amount: totals.subtotal }
                ];

                doc.setFont('helvetica', 'normal');
                items.forEach((item, idx) => {
                    if (idx % 2 === 1) {
                        doc.setFillColor(248, 250, 252);
                        doc.rect(40, y, pageWidth - 80, 22, 'F');
                    }
                    doc.setTextColor(30, 41, 59);
                    doc.text(String(item.description || 'Service'), 50, y + 15);
                    doc.text(String(item.type || item.department || 'Consultation'), 260, y + 15);
                    doc.text(String(item.referenceId || '—'), 360, y + 15);
                    doc.setFont('helvetica', 'bold');
                    doc.text(formatINR(item.amount), pageWidth - 120, y + 15);
                    doc.setFont('helvetica', 'normal');

                    doc.setDrawColor(241, 245, 249);
                    doc.line(40, y + 22, pageWidth - 40, y + 22);
                    y += 22;
                });

                // Ambulance Status Callout Row
                y += 10;
                if (ambStatus.availed) {
                    doc.setFillColor(254, 243, 199); // amber-100
                    doc.setDrawColor(245, 158, 11);
                    doc.roundedRect(40, y, pageWidth - 80, 28, 4, 4, 'FD');
                    doc.setTextColor(146, 64, 14);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(10);
                    doc.text(`✓ Ambulance Service: AVAILED (${ambStatus.description}) — Fixed Transport Fee: ₹${ambStatus.fee.toFixed(2)}`, 50, y + 18);
                } else {
                    doc.setFillColor(241, 245, 249); // slate-100
                    doc.setDrawColor(203, 213, 225);
                    doc.roundedRect(40, y, pageWidth - 80, 28, 4, 4, 'FD');
                    doc.setTextColor(100, 116, 139);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    doc.text('ℹ Ambulance Service: NOT AVAILED for this visit (Transport Fee: ₹0.00)', 50, y + 18);
                }
                y += 40;

                // Summary & Tax Breakdown Box
                const summaryWidth = 230;
                const summaryX = pageWidth - 40 - summaryWidth;
                doc.setFillColor(248, 250, 252);
                doc.setDrawColor(226, 232, 240);
                doc.roundedRect(summaryX, y, summaryWidth, 100, 6, 6, 'FD');

                let sY = y + 20;
                doc.setFontSize(10);
                doc.setTextColor(71, 85, 105);
                doc.text('Subtotal:', summaryX + 15, sY);
                doc.text(formatINR(totals.subtotal), summaryX + summaryWidth - 15, sY, { align: 'right' });

                sY += 18;
                doc.text(`CGST (${(totals.cgstRate * 100).toFixed(0)}%):`, summaryX + 15, sY);
                doc.text(formatINR(totals.cgstAmount), summaryX + summaryWidth - 15, sY, { align: 'right' });

                sY += 18;
                doc.text(`SGST (${(totals.sgstRate * 100).toFixed(0)}%):`, summaryX + 15, sY);
                doc.text(formatINR(totals.sgstAmount), summaryX + summaryWidth - 15, sY, { align: 'right' });

                sY += 22;
                doc.setDrawColor(203, 213, 225);
                doc.line(summaryX + 10, sY - 8, summaryX + summaryWidth - 10, sY - 8);

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.setTextColor(15, 23, 42);
                doc.text('Total Amount:', summaryX + 15, sY + 6);
                doc.text(formatINR(totals.total), summaryX + summaryWidth - 15, sY + 6, { align: 'right' });

                // Footer
                const footerY = doc.internal.pageSize.getHeight() - 40;
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(9);
                doc.setTextColor(148, 163, 184);
                doc.text('This is an authentic, computer-generated tax invoice issued by NexCare Hospital Management System.', 40, footerY);
                doc.text('For billing inquiries or support, please contact billing@nexcare.com.', 40, footerY + 14);

                // Save PDF
                doc.save(`NexCare_Invoice_${billId}.pdf`);
                return;
            } catch (err) {
                console.error('[InvoicePDF] jsPDF export failed, falling back to print-to-PDF:', err);
            }
        }

        // Fallback: Browser Print to PDF
        printInvoiceHTML(bill, patient);
    }

    /**
     * Fallback printable HTML invoice window
     */
    function printInvoiceHTML(bill, patient) {
        const totals = getBillTotals(bill);
        const ambStatus = checkAmbulanceStatus(bill);
        const pName = patient?.fullName || patient?.name || 'Patient';
        const pId = patient?.patientIdDisplay || patient?.id || bill.patientId || 'PAT-000';
        const pPhone = patient?.phone || patient?.contact || 'N/A';
        const isPaid = String(bill.status).toLowerCase() === 'paid';
        const billId = bill.id || 'BILL-000';
        const visitDate = bill.visitDate || bill.dueDate || new Date().toLocaleDateString();

        const items = (bill.items && bill.items.length) ? bill.items : [
            { description: 'Hospital Consultation Services', type: 'Consultation', referenceId: 'APT-GEN', amount: totals.subtotal }
        ];

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>NexCare Invoice - ${escapeHtml(billId)}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #0F172A; max-width: 800px; margin: 0 auto; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0F172A; padding-bottom: 16px; margin-bottom: 24px; }
                    .header h1 { margin: 0; font-size: 24px; color: #0F172A; }
                    .badge { display: inline-block; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 12px; }
                    .badge-paid { background: #D1FAE5; color: #065F46; }
                    .badge-pending { background: #FEF3C7; color: #92400E; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #F8FAFC; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #E2E8F0; }
                    th { background: #F1F5F9; font-weight: 600; }
                    .num { text-align: right; }
                    .callout { padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; }
                    .callout-availed { background: #FEF3C7; border: 1px solid #F59E0B; color: #92400E; font-weight: 600; }
                    .callout-not-availed { background: #F1F5F9; border: 1px solid #CBD5E1; color: #475569; }
                    .summary { width: 280px; margin-left: auto; background: #F8FAFC; padding: 16px; border-radius: 8px; }
                    .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
                    .summary-total { font-size: 16px; font-weight: bold; border-top: 1px solid #CBD5E1; padding-top: 8px; margin-top: 8px; }
                    .footer { text-align: center; font-size: 12px; color: #94A3B8; margin-top: 40px; }
                    @media print { button { display: none; } body { padding: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1>NexCare Healthcare Systems</h1>
                        <p style="margin: 4px 0 0; color: #64748B;">Official Hospital Itemized Bill & Tax Invoice</p>
                    </div>
                    <div>
                        <span class="badge ${isPaid ? 'badge-paid' : 'badge-pending'}">${isPaid ? 'PAID' : 'PENDING PAYMENT'}</span>
                    </div>
                </div>

                <div class="grid">
                    <div>
                        <strong>PATIENT DETAILS:</strong><br>
                        Name: ${escapeHtml(pName)}<br>
                        Patient ID: ${escapeHtml(pId)}<br>
                        Phone: ${escapeHtml(pPhone)}
                    </div>
                    <div>
                        <strong>INVOICE DETAILS:</strong><br>
                        Bill ID: ${escapeHtml(billId)}<br>
                        Visit Date: ${escapeHtml(visitDate)}<br>
                        Due Date: ${escapeHtml(bill.dueDate || visitDate)}
                    </div>
                </div>

                <h3>Itemized Cost Breakdown</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Service Type</th>
                            <th>Reference</th>
                            <th class="num">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(it => `
                            <tr>
                                <td>${escapeHtml(it.description)}</td>
                                <td>${escapeHtml(it.type || it.department || 'Consultation')}</td>
                                <td>${escapeHtml(it.referenceId || '—')}</td>
                                <td class="num"><strong>${formatINR(it.amount)}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="callout ${ambStatus.availed ? 'callout-availed' : 'callout-not-availed'}">
                    ${ambStatus.availed 
                        ? `✓ Ambulance Service: AVAILED (${escapeHtml(ambStatus.description)}) — Transport Fee: ₹${ambStatus.fee.toFixed(2)}`
                        : `ℹ Ambulance Service: NOT AVAILED for this visit (Transport Fee: ₹0.00)`
                    }
                </div>

                <div class="summary">
                    <div class="summary-row"><span>Subtotal:</span><span>${formatINR(totals.subtotal)}</span></div>
                    <div class="summary-row"><span>CGST (9%):</span><span>${formatINR(totals.cgstAmount)}</span></div>
                    <div class="summary-row"><span>SGST (9%):</span><span>${formatINR(totals.sgstAmount)}</span></div>
                    <div class="summary-row summary-total"><span>Total Amount:</span><span>${formatINR(totals.total)}</span></div>
                </div>

                <div class="footer">
                    <p>This is a computer-generated tax invoice from NexCare Healthcare Systems.</p>
                </div>
            </body>
            </html>
        `;

        const printWin = window.open('', '_blank');
        if (printWin) {
            printWin.document.write(html);
            printWin.document.close();
            printWin.focus();
            setTimeout(() => { printWin.print(); }, 400);
        }
    }

    /**
     * Opens the rich View Bill Breakdown Modal on screen
     */
    function openViewBillModal(bill, patient) {
        if (!bill) return;
        const totals = getBillTotals(bill);
        const ambStatus = checkAmbulanceStatus(bill);
        const pName = patient?.fullName || patient?.name || 'Patient';
        const pId = patient?.patientIdDisplay || patient?.id || bill.patientId || 'PAT-000';
        const pPhone = patient?.phone || patient?.contact || 'N/A';
        const pEmail = patient?.email || 'N/A';
        const isPaid = String(bill.status).toLowerCase() === 'paid';
        const billId = bill.id || 'BILL-000';
        const visitDate = bill.visitDate || bill.dueDate || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

        let modal = document.getElementById('viewBillModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'viewBillModal';
            modal.style.cssText = 'display:none; position:fixed; z-index:99999; left:0; top:0; width:100%; height:100%; background:rgba(15,23,42,0.65); backdrop-filter:blur(5px); align-items:center; justify-content:center; overflow-y:auto; padding:20px;';
            document.body.appendChild(modal);
        }

        const items = (bill.items && bill.items.length) ? bill.items : [
            { description: 'Hospital Consultation Services', type: 'Consultation', referenceId: 'APT-GEN', amount: totals.subtotal }
        ];

        modal.innerHTML = `
            <div style="background:#fff; border-radius:16px; max-width:680px; width:100%; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); border:1px solid #E2E8F0; overflow:hidden; animation:fadeIn 0.2s ease;">
                <!-- Header -->
                <div style="background:linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color:#fff; padding:20px 24px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <h3 style="margin:0; font-size:18px; font-weight:700; color:#fff;">Tax Invoice & Cost Breakdown</h3>
                            <span style="font-size:11px; padding:3px 8px; border-radius:6px; font-weight:700; ${isPaid ? 'background:#10B981; color:#fff;' : 'background:#F59E0B; color:#fff;'}">${isPaid ? 'PAID' : 'PENDING'}</span>
                        </div>
                        <p style="margin:4px 0 0; font-size:12px; color:#94A3B8;">Invoice ID: <strong>${escapeHtml(billId)}</strong> | Visit: ${escapeHtml(visitDate)}</p>
                    </div>
                    <button type="button" onclick="closeViewBillModal()" style="background:rgba(255,255,255,0.1); border:none; color:#fff; width:32px; height:32px; border-radius:8px; font-size:20px; cursor:pointer; display:flex; align-items:center; justify-content:center;">&times;</button>
                </div>

                <!-- Modal Body -->
                <div style="padding:24px; max-height:calc(85vh - 140px); overflow-y:auto;">
                    <!-- Patient Info Grid -->
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; background:#F8FAFC; padding:16px; border-radius:10px; border:1px solid #E2E8F0; margin-bottom:20px;">
                        <div>
                            <span style="display:block; font-size:11px; font-weight:600; color:#64748B; text-transform:uppercase;">Patient Name</span>
                            <strong style="font-size:14px; color:#0F172A;">${escapeHtml(pName)}</strong>
                            <span style="display:block; font-size:12px; color:#64748B; margin-top:2px;">ID: ${escapeHtml(pId)}</span>
                        </div>
                        <div>
                            <span style="display:block; font-size:11px; font-weight:600; color:#64748B; text-transform:uppercase;">Contact & Date</span>
                            <span style="font-size:13px; color:#0F172A;">${escapeHtml(pPhone)}</span>
                            <span style="display:block; font-size:12px; color:#64748B; margin-top:2px;">Due: ${escapeHtml(bill.dueDate || visitDate)}</span>
                        </div>
                    </div>

                    <!-- Cost Breakdown Table -->
                    <h4 style="margin:0 0 10px; font-size:14px; font-weight:700; color:#0F172A;">Itemized Breakdown</h4>
                    <div style="border:1px solid #E2E8F0; border-radius:8px; overflow:hidden; margin-bottom:16px;">
                        <table style="width:100%; border-collapse:collapse; font-size:13px;">
                            <thead>
                                <tr style="background:#F1F5F9; color:#475569; text-align:left;">
                                    <th style="padding:10px 12px; font-weight:600;">Description</th>
                                    <th style="padding:10px 12px; font-weight:600;">Type</th>
                                    <th style="padding:10px 12px; font-weight:600;">Reference</th>
                                    <th style="padding:10px 12px; font-weight:600; text-align:right;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map(it => {
                                    const isAmb = String(it.type || it.description || '').toLowerCase().includes('ambulance');
                                    const badgeBg = isAmb ? '#FEF3C7' : '#EFF6FF';
                                    const badgeColor = isAmb ? '#B45309' : '#1D4ED8';
                                    return `
                                        <tr style="border-top:1px solid #E2E8F0;">
                                            <td style="padding:10px 12px; color:#1E293B; font-weight:500;">${escapeHtml(it.description)}</td>
                                            <td style="padding:10px 12px;"><span style="font-size:11px; padding:3px 8px; border-radius:6px; font-weight:600; background:${badgeBg}; color:${badgeColor};">${escapeHtml(it.type || it.department || 'Consultation')}</span></td>
                                            <td style="padding:10px 12px; font-family:monospace; color:#64748B; font-size:12px;">${escapeHtml(it.referenceId || '—')}</td>
                                            <td style="padding:10px 12px; text-align:right; font-weight:600; color:#0F172A;">${formatINR(it.amount)}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>

                    <!-- Explicit Ambulance Status Box -->
                    <div style="padding:12px 16px; border-radius:8px; margin-bottom:20px; display:flex; align-items:center; justify-content:space-between; ${ambStatus.availed ? 'background:#FFFBEB; border:1px solid #FDE68A;' : 'background:#F8FAFC; border:1px solid #E2E8F0;'}">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span style="font-size:18px;">${ambStatus.availed ? '🚑' : '🏥'}</span>
                            <div>
                                <strong style="font-size:13px; color:${ambStatus.availed ? '#92400E' : '#475569'};">Ambulance Service: ${ambStatus.availed ? 'Availed' : 'Not Availed'}</strong>
                                <p style="margin:2px 0 0; font-size:12px; color:${ambStatus.availed ? '#B45309' : '#64748B'};">${ambStatus.availed ? `Emergency transport utilized (Ref: ${escapeHtml(ambStatus.referenceId)})` : 'No ambulance transport requested for this visit'}</p>
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <span style="font-size:14px; font-weight:700; color:${ambStatus.availed ? '#92400E' : '#64748B'};">${ambStatus.availed ? formatINR(ambStatus.fee) : '₹0.00 (No fee)'}</span>
                        </div>
                    </div>

                    <!-- Financial Totals Summary -->
                    <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:16px;">
                        <div style="display:flex; justify-content:space-between; font-size:13px; color:#475569; margin-bottom:8px;">
                            <span>Subtotal</span>
                            <strong style="color:#0F172A;">${formatINR(totals.subtotal)}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:13px; color:#475569; margin-bottom:8px;">
                            <span>Central GST (CGST 9%)</span>
                            <span>${formatINR(totals.cgstAmount)}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:13px; color:#475569; margin-bottom:12px;">
                            <span>State GST (SGST 9%)</span>
                            <span>${formatINR(totals.sgstAmount)}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:700; color:#0F172A; border-top:1px solid #CBD5E1; padding-top:10px;">
                            <span>Grand Total</span>
                            <span style="color:#155DFC;">${formatINR(totals.total)}</span>
                        </div>
                    </div>
                </div>

                <!-- Footer Actions -->
                <div style="background:#F8FAFC; border-top:1px solid #E2E8F0; padding:16px 24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <button type="button" class="btn" onclick="closeViewBillModal()" style="background:#fff; border:1px solid #CBD5E1; color:#475569; padding:8px 16px; border-radius:8px; font-weight:600; cursor:pointer;">Close</button>
                    
                    <div style="display:flex; gap:10px;">
                        <button type="button" onclick="window.NexCareInvoice.download('${escapeHtml(billId)}')" style="display:inline-flex; align-items:center; gap:6px; background:#0F172A; color:#fff; border:none; padding:8px 18px; border-radius:8px; font-weight:600; cursor:pointer; font-size:13px;">
                            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                                <path d="M14 10v3.333A1.333 1.333 0 0112.667 14.667H3.333A1.333 1.333 0 012 13.333V10" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M4.667 6.667L8 10l3.333-3.333M8 10V1.333" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Download PDF
                        </button>
                        ${!isPaid ? `
                            <button type="button" onclick="closeViewBillModal(); if(window.showPaymentForm) window.showPaymentForm();" style="background:#155DFC; color:#fff; border:none; padding:8px 18px; border-radius:8px; font-weight:600; cursor:pointer; font-size:13px;">
                                Pay Now
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeViewBillModal() {
        const modal = document.getElementById('viewBillModal');
        if (modal) modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Global Registry
    window.NexCareInvoice = {
        download: async function (billId) {
            try {
                const store = window.NexCareStore;
                const bills = store ? await store.listBills() : [];
                const bill = bills.find(b => String(b.id) === String(billId)) || bills[0];
                const patient = store?.getActivePatient ? await store.getActivePatient() : {};
                await downloadInvoicePDF(bill, patient);
            } catch (e) {
                console.error('Invoice download error:', e);
            }
        },
        view: async function (billId) {
            try {
                const store = window.NexCareStore;
                const bills = store ? await store.listBills() : [];
                const bill = bills.find(b => String(b.id) === String(billId)) || bills[0];
                const patient = store?.getActivePatient ? await store.getActivePatient() : {};
                openViewBillModal(bill, patient);
            } catch (e) {
                console.error('Invoice view error:', e);
            }
        },
        checkAmbulance: checkAmbulanceStatus,
        getTotals: getBillTotals,
        openModal: openViewBillModal,
        closeModal: closeViewBillModal
    };

    window.closeViewBillModal = closeViewBillModal;
})();
