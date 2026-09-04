/**
 * Regenerates `billing.json` and the `payment_gateway_fee` rows of
 * `platform-transactions.json` from the appointments that already exist.
 *
 * Why this exists
 * ---------------
 * `generate-comprehensive-seed.js` raised a bill only for every fourth patient
 * (`if (pIdx % 4 === 0)`). The patient LOGIN accounts are patients 1–3 of each
 * hospital, so exactly one login account per hospital ever had a bill — 8 of
 * 24 — and only 3 had anything unpaid. Signing in as almost any patient showed
 * an empty "Billing & Payments" page with nothing to pay. The page was right;
 * the data was thin.
 *
 * It also fixes a second, older problem. The ledger carried 96 backfilled rows
 * whose `sourceId` matched NO bill in the repo, so `gatewayVolume` (the total
 * of currently paid bills) and `processingRevenue` (the total of ledger fees)
 * described different worlds and could never reconcile. Here every fee row is
 * derived from a bill that exists, at exactly the configured rate, so:
 *
 *     sum(paid bill totals) x paymentGatewayRate === processingRevenue
 *
 * Deterministic: no randomness, so a re-run reproduces the same file byte for
 * byte and a diff shows only what genuinely changed.
 *
 * Usage:  node scripts/generate-billing-seed.js
 */

const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data');
const read = f => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
const write = (f, v) => fs.writeFileSync(path.join(DATA, f), JSON.stringify(v, null, 2));

const GST_RATE = 0.09;                 // CGST and SGST each; 18% combined
const money = n => Math.round(n * 100) / 100;

const appointments = read('appointments.json');
const users        = read('users.json');
const hospitals    = read('hospitals.json');
const feeConfig    = read('platform-fee-config.json');
const dispatches   = read('ambulance.json');

const gatewayRate = Number(
  (Array.isArray(feeConfig) ? feeConfig[0] : feeConfig).paymentGatewayRate,
);
if (!(gatewayRate > 0 && gatewayRate < 1)) {
  throw new Error(`paymentGatewayRate looks wrong: ${gatewayRate}`);
}

const hospitalName = id => (hospitals.find(h => h.id === id) || {}).name || '';
const loginPatients = users.filter(u => u.role === 'patient' && u.patientId);

/**
 * Bills are dated across the last six months rather than all on one day, so the
 * six-month revenue trend has real shape instead of a flat line.
 */
const MONTHS = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
const dayFor = i => String((i % 26) + 1).padStart(2, '0');

const bills = [];
const seen = new Set();

/** One bill from one appointment. `paid` decides status and the ledger row. */
function addBill(appt, index, paid) {
  const fee = Number(appt.fee) || Number(appt.consultationFee) || 0;
  if (fee <= 0) return null;

  const month = MONTHS[index % MONTHS.length];
  const visitDate = `${month}-${dayFor(index)}`;
  const id = `BILL-${appt.hospitalId}-${appt.patientId}-${String(index + 1).padStart(2, '0')}`;
  if (seen.has(id)) return null;
  seen.add(id);

  const cgstAmount = money(fee * GST_RATE);
  const total = Math.round(fee * (1 + GST_RATE * 2));

  const bill = {
    id,
    patientId: appt.patientId,
    hospitalId: appt.hospitalId,
    hospitalName: appt.hospitalName || hospitalName(appt.hospitalId),
    visitDate,
    dueDate: `${month}-${String(Math.min(28, Number(dayFor(index)) + 14)).padStart(2, '0')}`,
    status: paid ? 'Paid' : 'Pending',
    currency: '₹',
    subtotal: fee,
    cgstRate: GST_RATE,
    sgstRate: GST_RATE,
    cgstAmount,
    sgstAmount: cgstAmount,
    total,
    items: [
      {
        description: `Consultation — ${appt.doctor} (${appt.department})`,
        department: appt.department,
        amount: fee,
        type: 'CONSULTATION',
        referenceId: appt.id,
      },
    ],
    createdAt: `${visitDate}T11:00:00.000Z`,
  };

  if (paid) {
    bill.paymentStatus = 'Paid';
    bill.paidAt = `${visitDate}T14:30:00.000Z`;
    bill.payments = [
      {
        id: `PAY-${id}`,
        amount: total,
        method: 'ONLINE (UPI/Card)',
        gatewayReference: `TXN-${id}`,
        createdAt: `${visitDate}T14:30:00.000Z`,
      },
    ];
  }

  bills.push(bill);
  return bill;
}

// ── Every patient who has appointments gets billed for them ──────────────────
// A cancelled visit is never billed. Alternating paid/unpaid gives every
// patient both a payment history and something outstanding to settle.
const byPatient = new Map();
for (const appt of appointments) {
  if (!appt.patientId || !appt.hospitalId) continue;
  if (String(appt.status || '').toLowerCase() === 'cancelled') continue;
  if (!byPatient.has(appt.patientId)) byPatient.set(appt.patientId, []);
  byPatient.get(appt.patientId).push(appt);
}

let n = 0;
for (const [, appts] of [...byPatient.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  appts.forEach((appt, i) => {
    // First visit settled, the next outstanding, then alternating.
    addBill(appt, n++, i % 2 === 0);
  });
}

// ── Completed ambulance dispatches are billable too ──────────────────────────
// Several patients have no consultation at all — their only appointment was
// cancelled — but they were carried by an ambulance, which is a service the
// hospital rendered and can charge for. Without this they have no bill, and a
// patient portal with nothing in it is what this script exists to fix.
const AMBULANCE_CHARGE = 2500;

function addDispatchBill(trip, index, paid) {
  const month = MONTHS[index % MONTHS.length];
  const visitDate = `${month}-${dayFor(index)}`;
  const id = `BILL-${trip.hospitalId}-${trip.patientId}-AMB${String(index + 1).padStart(2, '0')}`;
  if (seen.has(id)) return null;
  seen.add(id);

  const cgstAmount = money(AMBULANCE_CHARGE * GST_RATE);
  const total = Math.round(AMBULANCE_CHARGE * (1 + GST_RATE * 2));

  const bill = {
    id,
    patientId: trip.patientId,
    hospitalId: trip.hospitalId,
    hospitalName: trip.hospitalName || hospitalName(trip.hospitalId),
    visitDate,
    dueDate: `${month}-${String(Math.min(28, Number(dayFor(index)) + 14)).padStart(2, '0')}`,
    status: paid ? 'Paid' : 'Pending',
    currency: '₹',
    subtotal: AMBULANCE_CHARGE,
    cgstRate: GST_RATE,
    sgstRate: GST_RATE,
    cgstAmount,
    sgstAmount: cgstAmount,
    total,
    items: [
      {
        description: `Emergency ambulance transfer — ${trip.vehicleNumber || trip.id}`,
        department: 'Emergency',
        amount: AMBULANCE_CHARGE,
        type: 'AMBULANCE',
        referenceId: trip.id,
      },
    ],
    createdAt: `${visitDate}T11:00:00.000Z`,
  };

  if (paid) {
    bill.paymentStatus = 'Paid';
    bill.paidAt = `${visitDate}T14:30:00.000Z`;
    bill.payments = [{
      id: `PAY-${id}`,
      amount: total,
      method: 'ONLINE (UPI/Card)',
      gatewayReference: `TXN-${id}`,
      createdAt: `${visitDate}T14:30:00.000Z`,
    }];
  }

  bills.push(bill);
  return bill;
}

const completedTrips = dispatches.filter(
  t => t.patientId && t.hospitalId && String(t.status || '').toLowerCase() === 'completed',
);
for (const trip of completedTrips) {
  const hasPending = bills.some(b => b.patientId === trip.patientId && b.status === 'Pending');
  addDispatchBill(trip, n++, hasPending);
}

// ── Every patient with a billable service gets both a paid and a pending bill ─
// A demo where the account you pick has nothing to settle is the bug this
// script exists to fix. A patient whose only visit was CANCELLED and who was
// never carried by an ambulance is left alone: nothing was rendered, so
// nothing is owed. Inventing a charge for them would be worse than an empty
// page — it would be a bill for a service that never happened.
for (const user of loginPatients) {
  const appts = byPatient.get(user.patientId) || [];
  if (!appts.length) continue;

  const mine = () => bills.filter(b => b.patientId === user.patientId);
  if (!mine().some(b => b.status === 'Paid')) addBill(appts[0], n++, true);
  if (!mine().some(b => b.status === 'Pending')) addBill(appts[appts.length - 1], n++, false);
}

bills.sort((a, b) => a.id.localeCompare(b.id));

// ── The ledger: one processing fee per paid bill, at the configured rate ─────
const ledger = read('platform-transactions.json')
  // Keep anything that is not a bill processing fee (Care+ membership rows the
  // running app has written), drop the orphaned backfill this replaces.
  .filter(row => row.stream !== 'payment_gateway_fee');

let seq = 0;
for (const bill of bills.filter(b => b.status === 'Paid')) {
  seq += 1;
  ledger.push({
    id: `TXN-GW${String(seq).padStart(5, '0')}`,
    stream: 'payment_gateway_fee',
    sourceType: 'bill',
    sourceId: bill.id,
    hospitalId: bill.hospitalId,
    patientId: bill.patientId,
    gross: bill.total,
    rate: gatewayRate,
    amount: money(bill.total * gatewayRate),
    currency: '₹',
    createdAt: bill.paidAt,
    origin: 'gateway',
  });
}

ledger.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));

write('billing.json', bills);
write('platform-transactions.json', ledger);

// ── Report and self-check ────────────────────────────────────────────────────
const paid = bills.filter(b => b.status === 'Paid');
const pending = bills.filter(b => b.status === 'Pending');
const gatewayVolume = paid.reduce((s, b) => s + b.total, 0);
const fees = ledger
  .filter(r => r.stream === 'payment_gateway_fee')
  .reduce((s, r) => s + r.amount, 0);

const covered = loginPatients.filter(u =>
  bills.some(b => b.patientId === u.patientId && b.status === 'Pending'),
);
const nothingBillable = loginPatients.filter(u => !covered.includes(u));
const coveredLogins = covered.length;

const orphans = ledger.filter(
  r => r.stream === 'payment_gateway_fee' && !bills.some(b => b.id === r.sourceId),
).length;

console.log(`bills            ${bills.length}  (${paid.length} paid, ${pending.length} pending)`);
console.log(`ledger fee rows  ${ledger.filter(r => r.stream === 'payment_gateway_fee').length}`);
console.log(`gatewayVolume    ₹${gatewayVolume.toLocaleString('en-IN')}`);
console.log(`processing fees  ₹${money(fees)}  (expected ₹${money(gatewayVolume * gatewayRate)})`);
console.log(`login patients with something to pay: ${coveredLogins}/${loginPatients.length}`);
console.log(`orphaned ledger rows: ${orphans}`);

if (orphans !== 0) throw new Error('a ledger fee row references a bill that does not exist');
if (Math.abs(fees - gatewayVolume * gatewayRate) > 0.5) throw new Error('ledger does not reconcile with paid bills');
if (nothingBillable.length) {
  console.log('\nNo billable service (cancelled visit, no dispatch) — correctly nothing to pay:');
  nothingBillable.forEach(u => console.log(`  ${u.patientId}  ${u.email}`));
}
console.log('\nAll checks passed.');
