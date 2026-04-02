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

function renderBillFromStore() {
    const store = window.NexCareStore;
    if (!store) return;

    const bills = store.listBills();
    const bill = bills[0];
    
    // If no bill exists, we should probably hide payment stuff or show an empty state, but for now just clear them
    if (!bill) {
        document.querySelector('.billing-left').innerHTML = '<div class="billing-card" style="text-align: center; padding: 40px; color: #6A7282;">No pending or past bills found.</div>';
        const right = document.querySelector('.billing-right');
        if(right) right.style.display = 'none';
        return;
    }

    const totals = computeBillTotal(bill);
    const patient = store.getActivePatient?.() || {};

    // Patient info card (Main Page)
    const infoValues = document.querySelectorAll('.patient-info-grid .info-value');
    if (infoValues.length >= 8) {
        infoValues[0].textContent = patient.fullName || "N/A";
        infoValues[1].textContent = patient.patientIdDisplay || patient.id || "N/A";
        infoValues[2].textContent = patient.phone || "N/A";
        infoValues[3].textContent = patient.email || "N/A";
        infoValues[4].textContent = bill.visitDate || bill.dueDate || "N/A";
        infoValues[5].textContent = bill.id;
        infoValues[6].textContent = bill.dueDate || "N/A";
        infoValues[7].textContent = bill.status;
    }

    // Pending alert
    const pendingAlert = document.querySelector('.pending-bill-alert');
    if (pendingAlert) {
        pendingAlert.style.borderLeftColor = bill.status === 'Paid' ? '#00A63E' : '#F59E0B';
        const h3 = pendingAlert.querySelector('h3');
        const p = pendingAlert.querySelector('p');
        const badge = pendingAlert.querySelector('.badge');
        if (h3) h3.textContent = bill.status === 'Paid' ? '0 Pending Bills' : '1 Pending Bill';
        if (p) p.textContent = bill.status === 'Paid' ? 'All bills are paid' : `Due by ${bill.dueDate}`;
        if (badge) badge.textContent = bill.status;
    }

    // Itemized table row HTML generator
    const generateItemsHtml = (items) => {
        if(!items || items.length === 0) return '<tr><td colspan="4">No items listed</td></tr>';
        return items.map(it => `
            <tr>
                <td>${it.description}</td>
                <td><span class="dept-badge dept-${String(it.department || '').toLowerCase()}">${it.department || '-'}</span></td>
                <td>${it.date || bill.visitDate}</td>
                <td>${formatMoneyINR(it.amount)}</td>
            </tr>
        `).join('');
    };

    // Itemized bill table (Main Page)
    const itemTableBody = document.querySelector('.itemized-table tbody');
    if (itemTableBody) itemTableBody.innerHTML = generateItemsHtml(bill.items);

    // Summary values (Main Page)
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
    if (proceedBtn && bill.status === 'Paid') {
        proceedBtn.style.display = 'none';
        amountValue.textContent = 'PAID';
        amountValue.style.color = '#00A63E';
    } else if(proceedBtn) {
        proceedBtn.style.display = 'block';
    }

    // --- MODAL UPDATES ---

    // Patient info modal
    const modalInfoValues = document.querySelectorAll('.modal-info-grid p');
    if (modalInfoValues.length >= 6) {
        modalInfoValues[0].textContent = patient.fullName || "N/A";
        modalInfoValues[1].textContent = patient.patientIdDisplay || patient.id || "N/A";
        modalInfoValues[2].textContent = patient.phone || "N/A";
        modalInfoValues[3].textContent = patient.email || "N/A";
        modalInfoValues[4].textContent = bill.visitDate || bill.dueDate || "N/A";
        modalInfoValues[5].textContent = bill.id;
    }

    // Modal itemized table
    const modalTableBody = document.querySelector('.modal-table tbody');
    if (modalTableBody) modalTableBody.innerHTML = generateItemsHtml(bill.items);

    // Modal summary values
    const modalSummary = document.querySelector('.modal-summary');
    if (modalSummary) {
        const modalRows = modalSummary.querySelectorAll('.summary-row span:nth-child(2)');
        if (modalRows.length >= 4) {
            modalRows[0].textContent = formatMoneyINR(totals.subtotal);
            modalRows[1].textContent = formatMoneyINR(totals.cgst);
            modalRows[2].textContent = formatMoneyINR(totals.sgst);
            modalRows[3].textContent = formatMoneyINR(totals.total);
        }
    }

    // Modal form bill ID and totals
    const modalTotal = document.querySelector('.amount-charged strong');
    if (modalTotal) modalTotal.textContent = formatMoneyINR(totals.total);
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
            const bill = bills[0];
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
