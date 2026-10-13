// Billing & Payment Page Functionality

function formatMoneyINR(amount) {
    const n = Number(amount) || 0;
    return `₹${n.toFixed(2)}`;
}

function computeBillTotal(bill) {
    const subtotal = Number(bill.subtotal) || 0;
    const cgst = subtotal * (Number(bill.cgstRate) || 0);
    const sgst = subtotal * (Number(bill.sgstRate) || 0);
    return { subtotal, cgst, sgst, total: subtotal + cgst + sgst };
}

function getSelectedBillId() {
    try {
        const id = sessionStorage.getItem('nexcare_selected_bill_id');
        return id ? String(id) : null;
    } catch (e) {
        return null;
    }
}

function setSelectedBillId(id) {
    try {
        if (id) sessionStorage.setItem('nexcare_selected_bill_id', String(id));
        else sessionStorage.removeItem('nexcare_selected_bill_id');
    } catch (e) {}
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

async function renderBillFromStore() {
    const store = window.NexCareStore;
    if (!store) return;

    const bills = await store.listBills();
    const pendingBills = bills.filter(b => String(b.status).toLowerCase() === 'pending');
    const paidBills = bills.filter(b => String(b.status).toLowerCase() === 'paid');

    // Render lists (all pending + payment history)
    renderPendingBillsList(pendingBills);
    renderPaidBillsHistory(paidBills);

    // Pick active bill for the details panel
    const selectedId = getSelectedBillId();
    let bill = selectedId ? bills.find(b => String(b.id) === String(selectedId)) : null;
    if (!bill) bill = pendingBills[0] || bills[0] || null;

    const patient = (await store.getActivePatient?.()) || {};

    // Update Top Branding & Header
    const nameDisplay = document.getElementById('activePatientNameDisplay');
    const headerName = document.getElementById('header-name');
    const headerId = document.getElementById('header-id');
    const headerAvatar = document.getElementById('header-avatar');

    if (nameDisplay) nameDisplay.textContent = patient.fullName || "Guest";
    if (headerName) headerName.textContent = patient.fullName || patient.name || 'Unknown Patient';
    if (headerId) headerId.textContent = `Patient ID: ${patient.patientId || patient.patientIdDisplay || patient.id || 'N/A'}`;
    if (headerAvatar && patient.fullName) {
        const initials = patient.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
        headerAvatar.textContent = initials;
    }
    
    // If no bill exists
    if (!bill) {
        const right = document.querySelector('.billing-right');
        if(right) right.style.display = 'none';
        const pendingAlert = document.getElementById('pendingBillAlert');
        if (pendingAlert) pendingAlert.style.display = 'none';
        return;
    }
    const right = document.querySelector('.billing-right');
    if(right) right.style.display = 'block';
    const pendingAlert = document.getElementById('pendingBillAlert');
    if (pendingAlert) pendingAlert.style.display = '';

    const totals = computeBillTotal(bill);

    // Patient info card (Main Page) - Targeted by IDs
    const fields = {
        'billing-patientName': patient.fullName,
        'billing-patientId': patient.patientId || patient.patientIdDisplay || patient.id,
        'billing-phone': patient.phone,
        'billing-email': patient.email,
        'billing-visitDate': bill.visitDate || bill.dueDate,
        'billing-billId': bill.id,
        'billing-dueDate': bill.dueDate,
        'billing-status': bill.status
    };

    for (const [id, val] of Object.entries(fields)) {
        const el = document.getElementById(id);
        if (el) el.textContent = val || "N/A";
    }

    // Pending alert
    if (pendingAlert) {
        const isPaid = bill.status === 'Paid';
        pendingAlert.style.borderLeft = isPaid ? '4px solid #00A63E' : '4px solid #F59E0B';
        pendingAlert.style.background = isPaid ? '#F0FDF4' : '#FFF7ED';
        
        const h3 = document.getElementById('pendingBillTitle');
        const p = document.getElementById('pendingBillText');
        const badge = document.getElementById('pendingBillBadge');
        
        if (h3) h3.textContent = isPaid ? 'Paid Invoice' : `${pendingBills.length || 1} Pending Invoice${(pendingBills.length || 1) > 1 ? 's' : ''}`;
        if (p) p.textContent = isPaid ? 'Thank you for your timely payment.' : `Amount ${formatMoneyINR(totals.total)} is due by ${bill.dueDate}`;
        if (badge) {
            badge.textContent = bill.status;
            badge.className = `badge ${isPaid ? 'badge-completed-lg' : 'badge-pending-lg'}`;
        }
    }

    // Itemized table row HTML generator
    const generateItemsHtml = (items) => {
        if(!items || items.length === 0) return '<tr><td colspan="4" style="text-align:center; padding:20px; color:#6B7280;">No items on this bill yet</td></tr>';
        return items.map(it => {
            const itemType = it.type ? (it.type.charAt(0).toUpperCase() + it.type.slice(1).toLowerCase()) : (it.department || 'Consultation');
            const isAmb = String(it.type || it.description || '').toLowerCase().includes('ambulance');
            const typeStyle = isAmb 
                ? 'background:#FEF3C7; color:#B45309;' 
                : 'background:#EFF6FF; color:#1D4ED8;';
            const ref = it.referenceId || '—';
            return `
            <tr>
                <td style="font-weight:500; color:#1E293B;">${escapeHtml(it.description)}</td>
                <td><span style="font-size:11px; padding:3px 8px; border-radius:6px; font-weight:600; ${typeStyle}">${escapeHtml(itemType)}</span></td>
                <td><span style="font-family:monospace; font-size:12px; color:#64748B;">${escapeHtml(ref)}</span></td>
                <td style="font-weight:600; color:#0F172A;">${formatMoneyINR(it.amount)}</td>
            </tr>
        `;
        }).join('');
    };

    // Itemized bill table
    const itemTableBody = document.getElementById('billItemsBody');
    if (itemTableBody) itemTableBody.innerHTML = generateItemsHtml(bill.items);

    // Ambulance Status Callout
    const ambCallout = document.getElementById('billingAmbulanceCallout');
    if (ambCallout && window.NexCareInvoice) {
        const ambStatus = window.NexCareInvoice.checkAmbulance(bill);
        const icon = document.getElementById('ambIcon');
        const title = document.getElementById('ambTitle');
        const sub = document.getElementById('ambSubtitle');
        const fee = document.getElementById('ambFeeDisplay');
        
        if (ambStatus.availed) {
            ambCallout.style.background = '#FFFBEB';
            ambCallout.style.border = '1px solid #FDE68A';
            if (icon) icon.textContent = '🚑';
            if (title) {
                title.textContent = 'Ambulance Service: Availed (Transport Charge Included)';
                title.style.color = '#92400E';
            }
            if (sub) {
                sub.textContent = `Emergency transport availed (${ambStatus.description}, Ref: ${ambStatus.referenceId})`;
                sub.style.color = '#B45309';
            }
            if (fee) {
                fee.textContent = formatMoneyINR(ambStatus.fee);
                fee.style.color = '#92400E';
            }
        } else {
            ambCallout.style.background = '#F8FAFC';
            ambCallout.style.border = '1px solid #E2E8F0';
            if (icon) icon.textContent = '🏥';
            if (title) {
                title.textContent = 'Ambulance Service: Not Availed';
                title.style.color = '#475569';
            }
            if (sub) {
                sub.textContent = 'No ambulance transport requested for this visit';
                sub.style.color = '#64748B';
            }
            if (fee) {
                fee.textContent = '₹0.00 (No fee)';
                fee.style.color = '#64748B';
            }
        }
    }

    // Summary values
    const summary = document.querySelector('.bill-summary');
    if (summary) {
        const rows = summary.querySelectorAll('.summary-row .amount');
        if (rows.length >= 4) {
            rows[0].textContent = formatMoneyINR(totals.subtotal);
            rows[1].textContent = formatMoneyINR(totals.cgst);
            rows[2].textContent = formatMoneyINR(totals.sgst);
            rows[3].textContent = formatMoneyINR(totals.total);
        }
    }

    // Payment sidebar total
    const amountValue = document.querySelector('.amount-value');
    if (amountValue) amountValue.textContent = formatMoneyINR(totals.total);
    
    // Hide proceed button if Paid
    const proceedBtn = document.querySelector('.btn-proceed-payment');
    if (proceedBtn) {
        if (bill.status === 'Paid') {
            proceedBtn.style.display = 'none';
            if (amountValue) {
                amountValue.textContent = 'PAID';
                amountValue.style.color = '#00A63E';
            }
        } else {
            proceedBtn.style.display = 'block';
            if (amountValue) amountValue.style.color = '#111827';
        }
    }

    // --- MODAL UPDATES ---
    const modalInfoValues = document.querySelectorAll('.modal-info-grid p');
    if (modalInfoValues.length >= 6) {
        modalInfoValues[0].textContent = patient.fullName || "N/A";
        modalInfoValues[1].textContent = patient.patientId || patient.patientIdDisplay || patient.id || "N/A";
        modalInfoValues[2].textContent = patient.phone || "N/A";
        modalInfoValues[3].textContent = patient.email || "N/A";
        modalInfoValues[4].textContent = bill.visitDate || bill.dueDate || "N/A";
        modalInfoValues[5].textContent = bill.id;
    }

    // Modal Tables & Summaries
    const modalTableBody = document.getElementById('modalBillItemsBody');
    if (modalTableBody) modalTableBody.innerHTML = generateItemsHtml(bill.items);

    const mSub = document.getElementById('modalSubtotal');
    const mCGST = document.getElementById('modalCGST');
    const mSGST = document.getElementById('modalSGST');
    const mTotal = document.getElementById('modalTotal');
    const mCharged = document.getElementById('modalAmountCharged');

    if (mSub) mSub.textContent = formatMoneyINR(totals.subtotal);
    if (mCGST) mCGST.textContent = formatMoneyINR(totals.cgst);
    if (mSGST) mSGST.textContent = formatMoneyINR(totals.sgst);
    if (mTotal) mTotal.textContent = formatMoneyINR(totals.total);
    if (mCharged) mCharged.textContent = formatMoneyINR(totals.total);
}

function downloadActiveBillPDF() {
    const selectedId = getSelectedBillId();
    if (window.NexCareInvoice) {
        window.NexCareInvoice.download(selectedId);
    }
}

function renderPendingBillsList(pendingBills) {
    const body = document.getElementById('pendingBillsBody');
    const count = document.getElementById('pendingBillsCount');
    if (count) count.textContent = String(pendingBills.length);
    if (!body) return;

    if (!pendingBills.length) {
        body.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:16px; color:#6A7282;">No pending bills.</td></tr>`;
        return;
    }

    body.innerHTML = pendingBills.map(b => {
        const totals = computeBillTotal(b);
        return `
            <tr data-id="${escapeHtml(b.id)}">
                <td><strong>${escapeHtml(b.id)}</strong></td>
                <td>${escapeHtml(b.visitDate || b.dueDate || '')}</td>
                <td><strong>${escapeHtml(formatMoneyINR(totals.total))}</strong></td>
                <td><span class="badge badge-pending">Pending</span></td>
                <td style="text-align:right; display:flex; justify-content:flex-end; gap:8px;">
                    <button class="btn-view-invoice" type="button" data-action="view">View</button>
                    <button class="btn-pay" type="button" data-action="pay">Pay Now</button>
                </td>
            </tr>
        `;
    }).join('');

    body.onclick = (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const tr = e.target.closest('tr[data-id]');
        if (!tr) return;
        const id = tr.dataset.id;
        setSelectedBillId(id);
        renderBillFromStore(); // refresh details

        if (btn.dataset.action === 'view') {
            if (window.NexCareInvoice) window.NexCareInvoice.view(id);
        } else if (btn.dataset.action === 'pay') {
            showPaymentForm();
        }
    };
}

function renderPaidBillsHistory(paidBills) {
    const body = document.getElementById('paidBillsBody');
    const count = document.getElementById('paidBillsCount');
    if (count) count.textContent = String(paidBills.length);
    if (!body) return;

    if (!paidBills.length) {
        body.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:16px; color:#6A7282;">No payment history yet.</td></tr>`;
        return;
    }

    body.innerHTML = paidBills.map(b => {
        const totals = computeBillTotal(b);
        return `
            <tr data-id="${escapeHtml(b.id)}">
                <td><strong>${escapeHtml(b.id)}</strong></td>
                <td>${escapeHtml(b.visitDate || b.dueDate || '')}</td>
                <td><strong>${escapeHtml(formatMoneyINR(totals.total))}</strong></td>
                <td><span class="badge badge-paid">Paid</span></td>
                <td style="text-align:right; display:flex; justify-content:flex-end; gap:8px;">
                    <button class="btn-view-invoice" type="button" data-action="receipt">View</button>
                    <button class="btn-outline-sm" type="button" data-action="download" style="padding:4px 10px; font-size:12px; border-radius:6px; font-weight:600; cursor:pointer; background:#F8FAFC; border:1px solid #CBD5E1; color:#0F172A;">PDF</button>
                </td>
            </tr>
        `;
    }).join('');

    body.onclick = (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const tr = e.target.closest('tr[data-id]');
        if (!tr) return;
        const id = tr.dataset.id;
        setSelectedBillId(id);
        renderBillFromStore();

        if (btn.dataset.action === 'receipt' || btn.dataset.action === 'view') {
            if (window.NexCareInvoice) window.NexCareInvoice.view(id);
        } else if (btn.dataset.action === 'download') {
            if (window.NexCareInvoice) window.NexCareInvoice.download(id);
        }
    };
}

function showPaymentForm() {
    document.getElementById('paymentModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

document.addEventListener('DOMContentLoaded', function() {
    const paymentForm = document.getElementById('paymentForm');
    
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePayment);
    }
    
    // Card number formatting
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
    }
    
    // Expiry date formatting
    const expiryInput = document.getElementById('expiryDate');
    if (expiryInput) {
        expiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                let month = parseInt(value.substring(0, 2));
                if (month > 12) month = 12;
                if (value.length >= 2 && month === 0) month = 1;
                
                let monthStr = month.toString().padStart(2, '0');
                value = monthStr + value.substring(2, 4);
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }
    
    // CVV validation
    const cvvInput = document.getElementById('cvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }
    
    // Close modal on background click
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closePaymentModal();
            }
        });
    }

    renderBillFromStore();
});

/**
 * Take a payment through the NexCare gateway.
 *
 * This used to validate the card in the browser and then just flip the bill to
 * Paid on a setTimeout — nothing was authorised and no fee was ever recorded.
 * It now goes through /payments: the server creates an intent (taking the
 * amount from the BILL, not from this form), the simulated gateway authorises
 * it, and only on approval is the bill settled and the platform's fee written
 * to the ledger.
 *
 * The gateway is a SIMULATION. Use 4242 4242 4242 4242 to approve;
 * 4000 0000 0000 0002 is declined on purpose so the failure path can be shown.
 */
async function handlePayment(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const cardNumber = String(formData.get('cardNumber') || '');
    const cardholderName = String(formData.get('cardholderName') || '');
    const expiryDate = String(formData.get('expiryDate') || '');
    const cvv = String(formData.get('cvv') || '');

    if (!cardNumber || !cardholderName || !expiryDate || !cvv) {
        showPaymentError('Please fill in all payment details');
        return;
    }
    if (!expiryDate.includes('/')) {
        showPaymentError('Enter the expiry as MM/YY');
        return;
    }

    const [rawMonth, rawYear] = expiryDate.split('/');
    const expiryMonth = parseInt(rawMonth, 10);
    // The form collects a two-digit year; the API wants four.
    const expiryYear = 2000 + parseInt(rawYear, 10);

    const bill = await getSelectedBill();
    if (!bill) {
        showPaymentError('Could not work out which bill you are paying');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Processing…';
    submitBtn.disabled = true;

    try {
        const intentRes = await window.NexCareAPI.Payments.createIntent(bill.id);
        if (!intentRes.success) {
            showPaymentError(intentRes.message || 'Could not start the payment');
            return;
        }

        // One key per intent, so a double-clicked Pay replays instead of
        // charging twice.
        const idempotencyKey = `${intentRes.data.id}-attempt`;
        const result = await window.NexCareAPI.Payments.confirm(
            intentRes.data.id,
            { cardNumber, expiryMonth, expiryYear, cvv },
            idempotencyKey,
        );

        if (!result.success) {
            // A decline is a normal outcome, not a crash — show why.
            showPaymentError(result.message || 'The payment was declined');
            return;
        }

        closePaymentModal();
        const fees = (result.data && result.data.platformFees) || [];
        console.info('[NexCare] Platform fees recorded:', fees);
        if (window.NexCareUI && typeof window.NexCareUI.showToast === 'function') {
            window.NexCareUI.showToast(`Payment of ${formatMoneyINR(bill.total)} approved for ${bill.id}.`, 'success');
        }
        setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
        console.error('Payment failed:', err);
        showPaymentError(err.message || 'The payment could not be processed');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

/** The bill the modal was opened for, straight from the API. */
async function getSelectedBill() {
    try {
        const selectedId = getSelectedBillId();
        const res = await window.NexCareAPI.Billing.getAll();
        const bills = (res.success ? res.data : []) || [];
        if (selectedId) {
            const match = bills.find(b => String(b.id) === String(selectedId));
            if (match) return match;
        }
        return bills.find(b => String(b.status).toLowerCase() !== 'paid') || null;
    } catch (err) {
        console.error('Could not load the bill:', err);
        return null;
    }
}

function showPaymentError(message) {
    let el = document.getElementById('paymentError');
    if (!el) {
        el = document.createElement('p');
        el.id = 'paymentError';
        el.style.cssText = 'color:#DC2626;font-size:13px;margin:8px 0 0;font-weight:600;';
        const form = document.getElementById('paymentForm');
        if (form) form.prepend(el);
    }
    el.textContent = message;
}

