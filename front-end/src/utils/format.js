// Formatting helpers, ported from front-end/shared/portal.js.

/** Rupees, Indian digit grouping, no decimals unless the value is small. */
export function money(value) {
  const n = Number(value) || 0;
  const decimals = Math.abs(n) > 0 && Math.abs(n) < 100 && !Number.isInteger(n) ? 2 : 0;
  return (
    '₹' +
    n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  );
}

/** Always two decimals — the bill and invoice figures (patient/billing.js formatMoneyINR). */
export function moneyFixed(value) {
  return `₹${(Number(value) || 0).toFixed(2)}`;
}

/** Initials for the header avatar — "Dr. Sunita Sharma" → "SS". */
export function initials(name) {
  return (
    String(name || '?')
      .replace(/^Dr\.?\s+/i, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('') || '?'
  );
}

/**
 * Today in the same format appointments store (`dateLabel`), so "today's
 * schedule" is a string comparison rather than a date parse of every row.
 */
export function todayLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
}

/** Sort key for an appointment's date + time labels. */
export function appointmentTime(apt) {
  const t = Date.parse(`${apt.dateLabel} ${apt.timeLabel}`);
  return Number.isNaN(t) ? 0 : t;
}

/** ISO or free-form date → "18 Sept 2026". */
export function formatDate(value) {
  const d = new Date(value);
  return isNaN(d.getTime())
    ? value
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** yyyy-mm-dd for <input type="date">. */
export function isoDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

// The fee quoted when a doctor has not set one. Must match the backend
// (auth.service.ts stamps it on a new doctor; revenue.service.ts falls back to it).
export const DEFAULT_CONSULTATION_FEE = 500;

/** A rate stored as a fraction, shown as a percentage — 0.019 → "1.9%". */
export function percent(fraction, digits = 1) {
  return `${(Number(fraction) * 100).toFixed(digits)}%`;
}
