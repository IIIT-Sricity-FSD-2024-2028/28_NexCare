/**
 * Payment and platform-earnings interfaces.
 *
 * Two different records live here and they must not be confused:
 *
 *  - PaymentIntent  — a PATIENT paying a HOSPITAL's bill. The money is the
 *                     hospital's; NexCare only moves it.
 *  - PlatformTransaction — the fee NexCare took out of that movement. This is
 *                     the platform's own money, and it is the ledger the
 *                     revenue reports are built from.
 *
 * The ledger exists because deriving fees at read time gets the HISTORY wrong.
 * If the Admin raises the processing rate from 1.9% to 2.2% today, a derived
 * report would silently restate every payment ever taken as though it had been
 * charged 2.2%. Recording the fee at the moment it is charged means repricing
 * changes what happens NEXT, and last month stays what it actually was.
 */

/** Where a payment attempt has got to. */
export type PaymentStatus =
  | 'requires_confirmation'
  | 'succeeded'
  | 'declined'
  | 'failed';

/** One attempt to settle one bill. */
export interface PaymentIntent {
  id: string;
  billId: string;
  patientId: string;
  hospitalId: string;
  /** In rupees, taken from the bill — never from the client. */
  amount: number;
  currency: string;
  status: PaymentStatus;
  /** Last four digits only. A full card number is never stored. */
  cardLast4?: string;
  cardBrand?: string;
  /** The simulated processor's own reference. */
  gatewayReference?: string;
  failureCode?: string;
  failureMessage?: string;
  /** Replaying this key returns the original outcome instead of charging again. */
  idempotencyKey?: string;
  createdAt: string;
  confirmedAt?: string;
}

/**
 * One fee NexCare earned. `stream` matches RevenueStreamLine.key so the ledger
 * and the dashboard cannot disagree about what a line is called.
 */
export interface PlatformTransaction {
  id: string;
  stream:
    | 'payment_gateway_fee'
    | 'hospital_commission'
    | 'patient_booking_fee'
    | 'ambulance_dispatch_fee'
    | 'doctor_commission';
  sourceType: 'bill' | 'appointment' | 'ambulance';
  /** The bill / appointment / dispatch this fee came out of. */
  sourceId: string;
  hospitalId?: string;
  patientId?: string;
  doctorId?: string;
  /** The amount the fee was charged on. */
  gross: number;
  /** Rate applied as a fraction, or null for a flat per-event fee. */
  rate: number | null;
  /** What NexCare earned. */
  amount: number;
  currency: string;
  createdAt: string;
  /** How the row got here — useful when auditing seeded history. */
  origin: 'gateway' | 'backfill';
}

/** What the gateway hands back for one authorisation attempt. */
export interface GatewayResult {
  approved: boolean;
  reference: string;
  code: string;
  message: string;
  cardBrand: string;
  last4: string;
}
