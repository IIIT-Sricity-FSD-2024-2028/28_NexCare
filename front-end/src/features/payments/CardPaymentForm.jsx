import { useEffect, useState } from 'react';
import { Payments } from '../../api';
import { digitsOnly, formatCardNumber, formatExpiry, validateCard } from './payBill';

// The card form from patient/billing.html's payment modal. The parent owns the
// gateway call: `onSubmit(card)` receives { cardNumber, cardholderName,
// expiryDate, cvv } once the fields pass the same checks the HTML page made.
// Test cards are listed from /payments/test-cards when the backend answers.
export default function CardPaymentForm({ amountLabel, busy, error, onSubmit, onCancel }) {
  const [form, setForm] = useState({ paymentMethod: 'credit', cardholderName: '', cardNumber: '', expiryDate: '', cvv: '' });
  const [localError, setLocalError] = useState('');
  const [testCards, setTestCards] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Payments.getTestCards()
      .then((res) => { if (!cancelled && Array.isArray(res.data?.cards)) setTestCards(res.data.cards); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const set = (k, fmt = (v) => v) => (e) => setForm((f) => ({ ...f, [k]: fmt(e.target.value) }));

  function submit(e) {
    e.preventDefault();
    const err = validateCard(form);
    setLocalError(err || '');
    if (err) return;
    onSubmit(form);
  }

  const message = localError || error;

  return (
    <div className="payment-form-card">
      <h3>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="2" y="4" width="14" height="10" rx="2" stroke="#0F172A" strokeWidth="1.5" />
          <path d="M2 7h14" stroke="#0F172A" strokeWidth="1.5" />
        </svg>{' '}
        Payment
      </h3>
      <p>Complete your payment securely</p>

      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', borderRadius: 8, padding: '10px 12px', fontSize: 12, lineHeight: 1.5, marginBottom: 14 }}>
        <strong>Simulated gateway.</strong> No real card is accepted or stored.
        {testCards && testCards.length ? (
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {testCards.map((c) => (
              <li key={c.number}><code>{formatCardNumber(c.number)}</code> — {c.message || c.outcome}</li>
            ))}
          </ul>
        ) : (
          <> Use <code>4242 4242 4242 4242</code> to approve, or <code>4000 0000 0000 0002</code> to see a decline. Any future expiry, any CVV.</>
        )}
      </div>

      <form id="paymentForm" className="payment-form" onSubmit={submit}>
        {message && <p id="paymentError" style={{ color: '#DC2626', fontSize: 13, margin: '8px 0 0', fontWeight: 600 }}>{message}</p>}

        <div className="form-group">
          <label htmlFor="paymentMethod">Payment Method</label>
          <select id="paymentMethod" name="paymentMethod" value={form.paymentMethod} onChange={set('paymentMethod')}>
            <option value="credit">Credit Card</option>
            <option value="debit">Debit Card</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="cardholderName">Cardholder Name</label>
          <input type="text" id="cardholderName" name="cardholderName" placeholder="Rajesh" required value={form.cardholderName} onChange={set('cardholderName')} />
        </div>

        <div className="form-group">
          <label htmlFor="cardNumber">Card Number</label>
          <input type="text" id="cardNumber" name="cardNumber" placeholder="1234 6789 0123 4567" maxLength={19} required value={form.cardNumber} onChange={set('cardNumber', formatCardNumber)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="expiryDate">Expiry Date</label>
            <input type="text" id="expiryDate" name="expiryDate" placeholder="12/30" maxLength={5} required value={form.expiryDate} onChange={set('expiryDate', formatExpiry)} />
          </div>
          <div className="form-group">
            <label htmlFor="cvv">CVV</label>
            <input type="text" id="cvv" name="cvv" placeholder="123" maxLength={3} required value={form.cvv} onChange={set('cvv', digitsOnly)} />
          </div>
        </div>

        <div className="amount-charged">
          Amount to be charged: <strong id="modalAmountCharged">{amountLabel}</strong>
        </div>

        <button type="submit" className="btn-pay-now" disabled={busy}>{busy ? 'Processing…' : 'Pay Now'}</button>
        <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>

        <p className="payment-info">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1L1 3.5v3a4.5 4.5 0 004.5 4.5h.5a4.5 4.5 0 004.5-4.5v-3L6 1z" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4.5 6l1 1L7.5 5" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>{' '}
          Your payment information is encrypted and secure
        </p>
      </form>
    </div>
  );
}
