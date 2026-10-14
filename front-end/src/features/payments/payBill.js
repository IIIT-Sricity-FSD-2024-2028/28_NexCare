// Take a payment through the simulated NexCare gateway (patient/billing.js
// handlePayment): the server creates an intent — the amount comes from the
// BILL, never from the form — the gateway authorises it, and only on approval
// is the bill settled and the platform fee written to the ledger.
//
// A decline is a normal outcome: it arrives as an ApiError whose message says
// why, and the bill stays open.
import { Payments } from '../../api';

/** "1234 5678 …" as typed → groups of four. */
export function formatCardNumber(value) {
  const digits = String(value || '').replace(/\s/g, '');
  return digits.match(/.{1,4}/g)?.join(' ') || digits;
}

/** Digits as typed → "MM/YY", clamping the month to 01–12. */
export function formatExpiry(value) {
  let v = String(value || '').replace(/\D/g, '');
  if (v.length >= 2) {
    let month = parseInt(v.substring(0, 2), 10);
    if (month > 12) month = 12;
    if (month === 0) month = 1;
    v = `${String(month).padStart(2, '0')}/${v.substring(2, 4)}`;
  }
  return v;
}

export function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

/**
 * Validate the form fields the way the HTML page did. Returns an error message
 * or null; the card details are then sent to the gateway as-is.
 */
export function validateCard({ cardNumber, cardholderName, expiryDate, cvv }) {
  if (!cardNumber || !cardholderName || !expiryDate || !cvv) return 'Please fill in all payment details';
  if (!expiryDate.includes('/')) return 'Enter the expiry as MM/YY';
  return null;
}

/** Resolves to the confirmed payment (`data`, incl. platformFees); throws on decline. */
export async function payBill(billId, { cardNumber, expiryDate, cvv }) {
  const [rawMonth, rawYear] = expiryDate.split('/');
  const expiryMonth = parseInt(rawMonth, 10);
  // The form collects a two-digit year; the API wants four.
  const expiryYear = 2000 + parseInt(rawYear, 10);

  const intentRes = await Payments.createIntent(billId);
  // One key per intent, so a double-clicked Pay replays instead of charging twice.
  const idempotencyKey = `${intentRes.data.id}-attempt`;
  const result = await Payments.confirm(intentRes.data.id, { cardNumber, expiryMonth, expiryYear, cvv }, idempotencyKey);
  return result.data;
}
