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

function renderBillFromStore() {
    const store = window.NexCareStore;
    if (!store) return;

    const bills = store.listBills();
    const pendingBills = bills.filter(b => String(b.status).toLowerCase() === 'pending');
    const paidBills = bills.filter(b => String(b.status).toLowerCase() === 'paid');

    // Render lists (all pending + payment history)
    renderPendingBillsList(pendingBills);
    renderPaidBillsHistory(paidBills);

    // Pick active bill for the details panel
    const selectedId = getSelectedBillId();
    let bill = selectedId ? bills.find(b => String(b.id) === String(selectedId)) : null;
    if (!bill) bill = pendingBills[0] || bills[0] || null;

    const patient = store.getActivePatient?.() || {};

    // Update Top Branding
    const nameDisplay = document.getElementById('activePatientNameDisplay');
    if (nameDisplay) nameDisplay.textContent = patient.fullName || "Guest";
    
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
        'billing-patientId': patient.patientIdDisplay || patient.id,
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
        if(!items || items.length === 0) return '<tr><td colspan="4" style="text-align:center; padding:20px;">No items listed</td></tr>';
        return items.map(it => `
            <tr>
                <td>${it.description}</td>
                <td><span class="dept-badge dept-${String(it.department || '').toLowerCase()}">${it.department || '-'}</span></td>
                <td>${it.date || bill.visitDate}</td>
                <td style="font-weight: 600;">${formatMoneyINR(it.amount)}</td>
            </tr>
        `).join('');
    };

    // Itemized bill table
    const itemTableBody = document.getElementById('billItemsBody');
    if (itemTableBody) itemTableBody.innerHTML = generateItemsHtml(bill.items);

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
        modalInfoValues[1].textContent = patient.patientIdDisplay || patient.id || "N/A";
        modalInfoValues[2].textContent = patient.phone || "N/A";
        modalInfoValues[3].textContent = patient.email || "N/A";
        modalInfoValues[4].textContent = bill.visitDate || bill.dueDate || "N/A";
        modalInfoValues[5].textContent = bill.id;
    }

    const modalTableBody = document.querySelector('.modal-table tbody');
    if (modalTableBody) modalTableBody.innerHTML = generateItemsHtml(bill.items);

    const modalTotal = document.querySelector('.amount-charged strong');
    if (modalTotal) modalTotal.textContent = formatMoneyINR(totals.total);
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
        if (btn.dataset.action === 'pay') {
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
                <td style="text-align:right;">
                    <button class="btn-view-invoice" type="button" data-action="receipt">View</button>
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
        alert(`Receipt ready for ${id}.`);
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

function handlePayment(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const cardNumber = formData.get('cardNumber');
    const cardholderName = formData.get('cardholderName');
    const expiryDate = formData.get('expiryDate');
    const cvv = formData.get('cvv');
    
    // Basic validation
    if (!cardNumber || !cardholderName || !expiryDate || !cvv) {
        alert('Please fill in all payment details');
        return;
    }
    
    // Validate card number length
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
        alert('Please enter a valid card number');
        return;
    }
    
    // Validate CVV
    if (cvv.length < 3) {
        alert('Please enter a valid CVV');
        return;
    }
    
    // Show processing
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;
    
    // Simulate payment processing
    setTimeout(function() {
        closePaymentModal();

        // Persist paid status (Update)
        const store = window.NexCareStore;
        if (store) {
            const bills = store.listBills();
            const selectedId = getSelectedBillId();
            const bill = selectedId ? bills.find(b => String(b.id) === String(selectedId)) : bills[0];
            if (bill) {
                const totals = computeBillTotal(bill);
                store.markBillPaid(bill.id, {
                    method: String(formData.get('paymentMethod') || 'CARD').toUpperCase(),
                    amount: totals.total,
                    transactionId: 'TXN' + Date.now().toString().slice(-10)
                });
            }
        }
        
        // Show success message
        alert('✓ Payment Successful!\n\n' +
              'Amount: ₹4366.00\n' +
              'Transaction ID: TXN' + Date.now().toString().slice(-10) + '\n' +
              'Payment Method: ' + formData.get('paymentMethod').toUpperCase() + '\n\n' +
              'A confirmation has been sent to your email.');
        
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        // Clear form
        e.target.reset();

        renderBillFromStore();
        
        // Redirect to dashboard or show receipt
        setTimeout(function() {
            if (confirm('Would you like to download the payment receipt?')) {
                alert('Receipt download started...');
            }
        }, 500);
    }, 2000);
}
