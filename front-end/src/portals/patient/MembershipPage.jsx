import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Revenue } from '../../api';
import { useToast } from '../../context/ToastContext';
import useStylesheet from '../../hooks/useStylesheet';
import membershipCss from '../../styles/membership.css?url';
import { formatDate, money, percent } from '../../utils/format';
import PatientHeader from './PatientHeader';
import { usePatient } from './PatientContext';

// patient/membership.html + membership.js.
//
// The page is honest about which is cheaper for THIS patient: it shows the fees
// waived against the membership paid, not just the marketing copy. Joining goes
// through a simulated gateway (UPI / card / net banking) whose only real effect
// is PATCH /revenue/patient/me/membership.

export default function MembershipPage() {
  useStylesheet(membershipCss);
  const { notify } = useToast();
  const { membership, refreshMembership } = usePatient();

  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null); // { plan, step, txnId }
  const [cancelOpen, setCancelOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const planRes = await Revenue.getPatientPlans();
      setPlans(planRes.data || []);
      await refreshMembership();
      setError('');
    } catch (err) {
      console.error('Membership load failed:', err);
      setError('Could not load your membership. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [refreshMembership]);

  useEffect(() => { load(); }, [load]);

  function choosePlan(plan) {
    if (plan.id === 'CARE-PAYG') { setCancelOpen(true); return; }
    setPayment({ plan, step: 1, method: 'upi', upiApp: 'Google Pay', txnId: null });
  }

  async function processPayment(methodDetails) {
    const plan = payment.plan;
    const txnId = `TXN-MEM-${Math.floor(100000 + Math.random() * 900000)}`;
    setPayment((p) => ({ ...p, step: 2 }));
    // The 1.2s wait is the original's gateway animation, kept so the flow reads the same.
    await new Promise((r) => { setTimeout(r, 1200); });
    try {
      await Revenue.setMyMembership(plan.id, { method: methodDetails, transactionId: txnId, amount: plan.monthlyFee });
      setPayment((p) => ({ ...p, step: 3, txnId }));
    } catch (err) {
      console.error('Payment processing failed:', err);
      setPayment((p) => ({ ...p, step: 1 }));
      notify(err.message || 'Payment simulation could not complete', 'error');
    }
  }

  async function finishPayment() {
    setPayment(null);
    notify('Care+ Membership successfully activated!', 'success');
    await load();
  }

  async function confirmCancel() {
    setCancelOpen(false);
    try {
      await Revenue.setMyMembership('CARE-PAYG');
      notify('Membership cancelled. You are now on Pay As You Go.', 'info');
      await load();
    } catch (err) {
      console.error('Cancel membership failed:', err);
      notify(err.message || 'Could not cancel membership', 'error');
    }
  }

  const currentId = membership ? membership.planId : 'CARE-PAYG';

  // The per-booking fee is what the membership is measured against, and it comes
  // back on the membership payload rather than the plan list.
  const perBooking = membership && membership.bookingsMade > 0 && membership.bookingFeesWaived > 0
    ? membership.bookingFeesWaived / membership.bookingsMade
    : null;
  const plusPlan = plans.find((p) => p.waivesBookingFee) || null;
  const feeRows = [
    ['Booking convenience fee', perBooking !== null ? `${money(perBooking)} per appointment` : 'charged per appointment'],
    ['Ambulance dispatch fee', plusPlan ? `discounted ${percent(plusPlan.ambulanceDiscount, 0)} on ${plusPlan.name}` : 'charged per completed trip'],
    ['Queue position', plusPlan && plusPlan.priorityQueue ? `priority on ${plusPlan.name}` : 'standard'],
  ];

  return (
    <main className="main-content">
      <PatientHeader />

      <div className="billing-page">
        <div className="billing-header">
          <div className="billing-title">
            <h1>Care+ Membership</h1>
            <p>NexCare charges a small convenience fee each time you book. A membership waives it, discounts ambulance dispatch, and puts you ahead in the queue.</p>
          </div>
        </div>

        <div id="membershipStatus" className="billing-card" style={{ marginBottom: 20 }}>
          {loading && 'Loading your membership…'}
          {!loading && error && <p style={{ color: '#DC2626' }}>{error}</p>}
          {!loading && !error && <MembershipStatus membership={membership} />}
        </div>

        <div className="billing-card" style={{ marginBottom: 20 }}>
          <h2>Choose a plan</h2>
          <p style={{ color: '#6A7282', fontSize: 13, margin: '6px 0 18px' }}>
            Switch or cancel whenever you like — cancelling puts you back on pay as you go.
          </p>
          <div id="planGrid" className="membership-grid">
            {loading && 'Loading plans…'}
            {!loading && !plans.length && <p style={{ color: '#6A7282' }}>No plans available.</p>}
            {plans.map((p) => {
              const current = p.id === currentId;
              const isFree = p.monthlyFee === 0;
              return (
                <div className={`m-card${current ? ' current' : ''}`} key={p.id}>
                  {current && <span className="m-badge">Current plan</span>}
                  <h3>{p.name}</h3>
                  <div className="tag">{p.tagline || ''}</div>
                  <div className="price">{money(p.monthlyFee)}<small>{isFree ? '' : ' / month'}</small></div>
                  <div className="tag">{p.coversMembers > 1 ? `Covers up to ${p.coversMembers} people` : 'Individual'}</div>
                  <ul>{(p.features || []).map((f) => <li key={f}>{f}</li>)}</ul>
                  <div className="cta">
                    {current
                      ? <button type="button" className="m-btn" disabled>Your current plan</button>
                      : <button type="button" className={`m-btn${isFree ? ' secondary' : ''}`} onClick={() => choosePlan(p)}>{isFree ? 'Cancel membership' : `Switch to ${p.name}`}</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="billing-card">
          <h2>What you pay without a membership</h2>
          <div id="feeList" style={{ marginTop: 12 }}>
            {loading && 'Loading…'}
            {!loading && feeRows.map(([label, value]) => (
              <div className="fee-row" key={label}><span>{label}</span><strong>{value}</strong></div>
            ))}
            {!loading && (
              <p style={{ color: '#6A7282', fontSize: 12, marginTop: 14 }}>
                Your hospital bills are separate — those are the hospital&rsquo;s charges, not NexCare&rsquo;s.
                See <Link to="/patient/billing">Billing &amp; Payments</Link>.
              </p>
            )}
          </div>
        </div>
      </div>

      {payment && <PaymentModal payment={payment} setPayment={setPayment} onPay={processPayment} onFinish={finishPayment} onClose={() => setPayment(null)} />}

      {cancelOpen && (
        <div id="cancelModal" className="modal-overlay" style={{ display: 'flex' }} onMouseDown={(e) => { if (e.target === e.currentTarget) setCancelOpen(false); }}>
          <div className="modal-card" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚠️</div>
                <h3 style={{ margin: 0, fontSize: 17 }}>Cancel Care+ Membership?</h3>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setCancelOpen(false)} aria-label="Close">&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.5, margin: '0 0 14px' }}>
                Are you sure you want to switch back to <strong>Pay As You Go (₹0)</strong>?
              </p>
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: 12, fontSize: 12.5, color: '#92400E', marginBottom: 20 }}>
                ● You will be charged ₹39 convenience fee on every new appointment.<br />
                ● You will lose up to 25% ambulance discount and priority queue benefits.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="m-btn" style={{ flex: 1 }} onClick={() => setCancelOpen(false)}>Keep Membership</button>
                <button type="button" className="m-btn secondary" style={{ flex: 1, color: '#DC2626', borderColor: '#FECACA' }} onClick={confirmCancel}>Confirm Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function MembershipStatus({ membership }) {
  if (!membership) {
    return <><h2>Your membership</h2><p style={{ color: '#6A7282' }}>You are on pay as you go.</p></>;
  }
  const m = membership;
  const worthIt = m.netBenefit >= 0;
  const verdict = m.monthlyFee === 0
    ? 'You pay the booking fee on each appointment. A membership would waive it.'
    : worthIt
      ? `Your membership has saved you ${money(m.netBenefit)} more than it cost.`
      : `Your membership has cost ${money(Math.abs(m.netBenefit))} more than it has saved so far — at your booking rate, pay as you go may be cheaper.`;

  return (
    <>
      <h2>Your membership</h2>
      <p style={{ color: '#6A7282', fontSize: 13, margin: '6px 0 0' }}>
        <strong style={{ color: '#101828', fontSize: 15 }}>{m.planName}</strong>
        {m.renewsOn ? ` · renews ${formatDate(m.renewsOn)}` : ''}
      </p>
      <div className="m-stat-grid">
        <div className="m-stat"><p className="label">Bookings made</p><p className="value">{m.bookingsMade}</p></div>
        <div className="m-stat"><p className="label">Booking fees waived</p><p className="value">{money(m.bookingFeesWaived)}</p></div>
        <div className="m-stat"><p className="label">Membership paid</p><p className="value">{money(m.membershipPaid)}</p></div>
        <div className="m-stat">
          <p className="label">Net benefit</p>
          <p className="value" style={{ color: worthIt ? '#047857' : '#B91C1C' }}>{money(m.netBenefit)}</p>
        </div>
      </div>
      <p style={{ color: '#6A7282', fontSize: 13, margin: '14px 0 0' }}>{verdict}</p>
    </>
  );
}

function PaymentModal({ payment, setPayment, onPay, onFinish, onClose }) {
  const { plan, step, method, upiApp, txnId } = payment;
  const [upiId, setUpiId] = useState('patient@okhdfcbank');
  const [card, setCard] = useState({ number: '4242 4242 4242 4242', expiry: '12/28', cvv: '123', name: 'Raghav Rao' });
  const [bank, setBank] = useState('HDFC Bank');

  const ambDisc = plan.id === 'CARE-FAMILY' ? '25% off emergency dispatch' : '20% off emergency dispatch';
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  function pay() {
    let details = '';
    if (method === 'upi') details = `UPI (${upiApp} / ${upiId.trim() || 'patient@okhdfcbank'})`;
    else if (method === 'card') details = `Card (•••• ${card.number.replace(/\s+/g, '').slice(-4) || '4242'})`;
    else details = `Net Banking (${bank})`;
    onPay(details);
  }

  const setMethod = (m) => setPayment((p) => ({ ...p, method: m }));

  return (
    <div id="paymentModal" className="modal-overlay" style={{ display: 'flex' }} onMouseDown={(e) => { if (e.target === e.currentTarget && step !== 2) onClose(); }}>
      <div className="modal-card">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
            </div>
            <div>
              <h3 id="modalPlanTitle">Join {plan.name}</h3>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Secure Simulated Gateway</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <div className="modal-body" id="modalPaymentBody">
          {step === 1 && (
            <div id="paymentStep1">
              <div className="order-summary-box">
                <div className="order-summary-row"><span>Selected Membership</span><strong id="summaryPlanName">{plan.name}</strong></div>
                <div className="order-summary-row"><span>Billing Cycle</span><span>Monthly Auto-Renew</span></div>
                <div className="order-summary-row"><span>Convenience Fee Waived</span><span style={{ color: '#059669', fontWeight: 600 }}>₹39 / appointment</span></div>
                <div className="order-summary-row"><span>Ambulance Discount</span><span style={{ color: '#059669', fontWeight: 600 }} id="summaryAmbulanceDisc">{ambDisc}</span></div>
                <div className="order-summary-row total"><span>Total Payable Now</span><span style={{ color: '#2563EB' }} id="summaryTotalPayable">{money(plan.monthlyFee)}</span></div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Choose Payment Method</label>
                <div className="method-tabs">
                  <button type="button" className={`method-tab${method === 'upi' ? ' active' : ''}`} onClick={() => setMethod('upi')}>UPI Apps &amp; ID</button>
                  <button type="button" className={`method-tab${method === 'card' ? ' active' : ''}`} onClick={() => setMethod('card')}>Debit / Credit Card</button>
                  <button type="button" className={`method-tab${method === 'netbanking' ? ' active' : ''}`} onClick={() => setMethod('netbanking')}>Net Banking</button>
                </div>
              </div>

              {method === 'upi' && (
                <div id="methodUpi" className="pay-method-panel">
                  <div className="upi-app-grid">
                    {[['Google Pay', '📱'], ['PhonePe', '⚡'], ['Paytm UPI', '💳']].map(([name, icon]) => (
                      <div key={name} className={`upi-app-card${upiApp === name ? ' selected' : ''}`} onClick={() => setPayment((p) => ({ ...p, upiApp: name }))}>
                        <div style={{ fontSize: 18 }}>{icon}</div>
                        <div>{name === 'Paytm UPI' ? 'Paytm' : name}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Or Enter UPI ID</label>
                    <input type="text" id="upiIdInput" className="form-control-styled" placeholder="e.g. mobile@okaxis / patient@okhdfc" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                  </div>
                </div>
              )}

              {method === 'card' && (
                <div id="methodCard" className="pay-method-panel">
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Card Number</label>
                    <input type="text" id="cardNumberInput" className="form-control-styled" maxLength={19} value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Expiry (MM/YY)</label>
                      <input type="text" id="cardExpiryInput" className="form-control-styled" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>CVV</label>
                      <input type="password" id="cardCvvInput" className="form-control-styled" maxLength={4} value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Cardholder Name</label>
                    <input type="text" id="cardNameInput" className="form-control-styled" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                  </div>
                </div>
              )}

              {method === 'netbanking' && (
                <div id="methodNetbanking" className="pay-method-panel">
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Select Popular Indian Bank</label>
                  <select id="netBankSelect" className="form-control-styled" value={bank} onChange={(e) => setBank(e.target.value)}>
                    {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank'].map((b) => (
                      <option key={b} value={b}>{b === 'State Bank of India' ? 'State Bank of India (SBI)' : b}</option>
                    ))}
                  </select>
                </div>
              )}

              <button type="button" id="paySubmitBtn" className="m-btn" style={{ marginTop: 20, padding: 13, fontSize: 15 }} onClick={pay}>
                Pay <span id="btnPayAmount">{money(plan.monthlyFee)}</span> Securely &amp; Activate Plan &rarr;
              </button>
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <span style={{ fontSize: 11.5, color: '#64748B' }}>🔒 256-bit encrypted simulated transaction · Instant activation</span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div id="paymentStep2" style={{ textAlign: 'center', padding: '30px 10px' }}>
              <div style={{ width: 50, height: 50, border: '4px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 18px' }} />
              <h3 style={{ fontSize: 18, color: '#0F172A', margin: '0 0 6px' }}>Processing Payment...</h3>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }} id="processingSubtext">Verifying with payment network &amp; activating benefits...</p>
            </div>
          )}

          {step === 3 && (
            <div id="paymentStep3" style={{ textAlign: 'center', padding: '20px 10px' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 30 }}>✓</div>
              <h3 style={{ fontSize: 20, color: '#0F172A', margin: '0 0 6px' }}>Membership Activated!</h3>
              <p style={{ fontSize: 13.5, color: '#475569', margin: '0 0 16px' }} id="successPlanMsg">
                You are now subscribed to <strong>{plan.name}</strong>.
              </p>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, textAlign: 'left', fontSize: 12.5, color: '#475569', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Transaction ID:</span><strong style={{ color: '#0F172A' }} id="successTxnId">{txnId}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Amount Paid:</span><strong style={{ color: '#059669' }} id="successAmountPaid">{money(plan.monthlyFee)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Next Billing Date:</span><span id="successRenewsOn">{formatDate(nextMonth.toISOString())}</span></div>
              </div>
              <button type="button" className="m-btn" onClick={onFinish} style={{ width: '100%', padding: 12 }}>Done &amp; View Membership Benefits</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
