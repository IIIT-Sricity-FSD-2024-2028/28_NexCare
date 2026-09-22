import { useEffect, useState } from 'react';
import { Hospitals } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useHm } from './HmContext';
import { HmModal } from './hmShared';

// MODAL 2 from dashboard.html: the 12-month registration renewal with the
// simulated payment. openRenewalModal() computed the new expiry (+12 months
// from the current expiry, or from today once expired) exactly as
// HospitalsService.renewSubscription() does.
export const RENEWAL_FEE = 50000;
const BANKS = ['State Bank of India (Corporate)', 'HDFC Bank Commercial', 'ICICI Bank Corporate', 'Axis Bank'];

export function plusTwelveMonths(currentExpiry) {
  const now = new Date();
  let base = now;
  if (currentExpiry) {
    const cur = new Date(currentExpiry);
    if (cur > now) base = cur;
  }
  const next = new Date(base);
  next.setFullYear(next.getFullYear() + 1);
  return next.toISOString().split('T')[0];
}

export default function RenewalModal() {
  const { renewalModal, closeRenewalModal, hospitalId, hospitalName, subscription, reloadSubscription, refresh } = useHm();
  const { notify } = useToast();
  const [tab, setTab] = useState('upi');
  const [upi, setUpi] = useState('admin.aiims@icici');
  const [card, setCard] = useState({ number: '4111 •••• •••• 9921', expiry: '08/29', cvv: '882' });
  const [bank, setBank] = useState(BANKS[0]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (renewalModal) setTab('upi'); }, [renewalModal]);

  const currentExpiry = subscription?.subscriptionExpiryDate || new Date().toISOString().split('T')[0];
  const name = subscription?.hospitalName || hospitalName || 'Hospital';

  async function pay() {
    // processMockRenewalPayment() always sent "UPI (admin.aiims@icici)" whatever
    // tab was open; the chosen method is recorded now.
    const paymentMethod = tab === 'upi'
      ? `UPI (${upi.trim() || 'upi'})`
      : tab === 'card'
        ? `Card (•••• ${card.number.replace(/\D/g, '').slice(-4) || '0000'})`
        : `Net Banking (${bank})`;
    setBusy(true);
    try {
      await Hospitals.renewSubscription(hospitalId, { paymentMethod, amount: RENEWAL_FEE });
      notify('Payment successful! Hospital subscription extended by 12 Months.', 'success');
      closeRenewalModal();
      await reloadSubscription();
      refresh();
    } catch (err) {
      notify(err?.message || 'Payment processing failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <HmModal
      open={renewalModal}
      onClose={closeRenewalModal}
      title="Hospital Registration Renewal (12 Months)"
      size="medium"
      footer={(
        <>
          <button type="button" className="btn-secondary" onClick={closeRenewalModal} disabled={busy}>Cancel</button>
          <button type="button" className="btn-primary" onClick={pay} disabled={busy}>
            <span>{busy ? 'Processing Secure Payment...' : 'Pay ₹50,000 & Extend 12 Months'}</span>
          </button>
        </>
      )}
    >
      <div className="renewal-summary-card">
        <div className="renewal-info-row"><span>Hospital:</span><strong>{name} ({hospitalId})</strong></div>
        <div className="renewal-info-row"><span>Current Expiry:</span><span>{currentExpiry}</span></div>
        <div className="renewal-info-row text-success"><span>New Extended Expiry (+12 Months):</span><strong>{plusTwelveMonths(subscription?.subscriptionExpiryDate)} (+12 Months)</strong></div>
        <div className="renewal-amount-banner"><span>Renewal Fee:</span><strong className="renewal-price">₹50,000.00</strong></div>
      </div>

      <div className="payment-method-selector mt-16">
        <label className="font-600">Select Payment Method</label>
        <div className="payment-tabs">
          <button type="button" className={`pay-tab${tab === 'upi' ? ' active' : ''}`} onClick={() => setTab('upi')}><span>📱 UPI / QR</span></button>
          <button type="button" className={`pay-tab${tab === 'card' ? ' active' : ''}`} onClick={() => setTab('card')}><span>💳 Card</span></button>
          <button type="button" className={`pay-tab${tab === 'netbanking' ? ' active' : ''}`} onClick={() => setTab('netbanking')}><span>🏦 Net Banking</span></button>
        </div>

        {tab === 'upi' && (
          <div className="pay-form-content active">
            <div className="form-group mt-12">
              <label>Virtual Payment Address (VPA) / UPI ID</label>
              <input className="form-control" placeholder="hospital@icici / manager@okhdfcbank" value={upi} onChange={(e) => setUpi(e.target.value)} />
              <small className="form-hint">Simulated secure payment via UPI 2.0 Gateway</small>
            </div>
          </div>
        )}
        {tab === 'card' && (
          <div className="pay-form-content active">
            <div className="form-group mt-12">
              <label>Card Number</label>
              <input className="form-control" placeholder="4111 2222 3333 4444" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} />
            </div>
            <div className="form-row mt-8">
              <div className="form-group flex-1"><label>Expiry Date</label><input className="form-control" placeholder="MM/YY" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} /></div>
              <div className="form-group flex-1"><label>CVV</label><input type="password" className="form-control" placeholder="•••" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} /></div>
            </div>
          </div>
        )}
        {tab === 'netbanking' && (
          <div className="pay-form-content active">
            <div className="form-group mt-12">
              <label>Select Bank</label>
              <select className="form-control" value={bank} onChange={(e) => setBank(e.target.value)}>{BANKS.map((b) => <option key={b}>{b}</option>)}</select>
            </div>
          </div>
        )}
      </div>
    </HmModal>
  );
}
