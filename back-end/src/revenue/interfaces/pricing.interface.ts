/**
 * Pricing interfaces — the catalogue side of the revenue model.
 *
 * `revenue.interface.ts` describes what NexCare *earned*. This file describes
 * what NexCare *charges*, and to whom.
 *
 * There are TWO payers, and that is the whole point of the model:
 *
 *  1. HOSPITALS buy the platform, on a subscription priced by how many staff
 *     accounts they run on it. Doctors, nurses, administrative staff and
 *     ambulance staff are all employees of the hospital — the hospital is the
 *     customer, so the hospital is billed once for all of them. A small clinic
 *     with a dozen users pays a small plan; a large hospital with hundreds pays
 *     a large one.
 *  2. PATIENTS buy convenience — either per booking, or with a Care+
 *     membership that waives the per-booking fee and discounts ambulance
 *     dispatch.
 *
 * On top of those two subscriptions sit small per-transaction fees: bill
 * payments, appointment bookings and ambulance dispatches.
 *
 * ── What changed on 2026-09-01, and why ────────────────────────────────────
 *
 * DOCTORS ARE NO LONGER A PAYER. Doctor listing tiers and the commission on
 * each completed consultation are gone. A doctor is not a customer of NexCare;
 * they are a member of hospital staff, and billing them separately for a tool
 * their employer already pays for made no sense.
 *
 * THE COMMISSION ON HOSPITAL COLLECTIONS IS ALSO GONE. Taking a percentage of
 * what a hospital earns made NexCare's income swing with the hospital's, which
 * is neither predictable for them nor easy to explain. A per-user subscription
 * gives the hospital a fixed, forecastable cost and gives NexCare revenue that
 * tracks the thing it actually provides: seats on the platform.
 */

// ── Hospital subscription plans (staff/user based) ───────────────────────────
//
// The plan is chosen by how many staff accounts a hospital runs — a number the
// platform can count for itself out of `users.json`, so a plan is never merely
// declared. If a hospital grows past the seats its plan includes, the extra
// seats are billed at PlatformFeeConfig.extraStaffSeatFee until it moves up.

export type HospitalPlanId = 'HOSP-STARTER' | 'HOSP-GROWTH' | 'HOSP-ENTERPRISE';

/** A hospital subscription tier — what NexCare charges for platform access. */
export interface HospitalPlan {
  id: HospitalPlanId;
  name: string;
  tagline: string;
  /** Minimum staff accounts (inclusive) this plan is meant for. */
  minUsers: number;
  /** Maximum staff accounts (inclusive). null = no upper limit. */
  maxUsers: number | null;
  /** Recurring platform fee per month, in rupees. */
  monthlyFee: number;
  /** Staff accounts the fee covers. null = unlimited. */
  includedStaffSeats: number | null;
  features: string[];
  status: 'active' | 'retired';
  currency: string;
}

/** Which plan a given hospital is on. */
export interface HospitalSubscription {
  id: string;
  hospitalId: string;
  hospitalName: string;
  planId: HospitalPlanId;
  status: 'active' | 'suspended' | 'cancelled';
  billingCycle: 'monthly';
  /** Staff headcount when the plan was assigned — the basis for the tier. */
  staffAtSignup: number;
  startedAt: string;
  renewsOn: string;
  notes?: string;
}

/** A patient-facing membership tier. */
export interface PatientPlan {
  id: string;
  name: string;
  tagline: string;
  /** 0 for pay-as-you-go. */
  monthlyFee: number;
  /** Members skip the per-booking convenience fee. */
  waivesBookingFee: boolean;
  /** Discount on the ambulance dispatch fee, as a fraction (0.2 = 20% off). */
  ambulanceDiscount: number;
  /** How many people one membership covers — 1 for individual, 4 for family. */
  coversMembers: number;
  priorityQueue: boolean;
  features: string[];
  status: 'active' | 'retired';
  currency: string;
}

/** Which membership a given patient holds. */
export interface PatientSubscription {
  id: string;
  patientId: string;
  patientName: string;
  planId: string;
  status: 'active' | 'cancelled';
  startedAt: string;
  renewsOn: string;
}

/**
 * Rates that are not tied to any single plan. Editable by the Admin at runtime
 * so pricing experiments do not need a redeploy.
 *
 * `hospitalCommissionRate` was removed on 2026-09-01 along with the commission
 * on hospital collections — hospitals pay a subscription, not a share of what
 * they earn.
 */
export interface PlatformFeeConfig {
  id: string;
  currency: string;
  /** Charged to the patient on each appointment booked through NexCare. */
  patientBookingFee: number;
  /** Charged on each completed ambulance dispatch, discounted for members. */
  ambulanceDispatchFee: number;
  /** Taken on every bill settled through NexCare, as a fraction. */
  paymentGatewayRate: number;
  /** Per staff seat beyond the plan's allowance, per month. */
  extraStaffSeatFee: number;
  /** Per SMS/WhatsApp notification sent on a hospital's behalf. */
  notificationCreditFee: number;
  updatedAt: string;
  updatedBy?: string;
}

/** One line of the platform's income statement. */
export interface RevenueStreamLine {
  /** Machine key — stable, safe to switch on. */
  key: string;
  /** Human label for the dashboard. */
  label: string;
  /** Who actually pays this. Doctors stopped being a payer on 2026-09-01. */
  payer: 'hospital' | 'patient';
  /** Recurring subscription income vs. usage-based income. */
  type: 'recurring' | 'usage';
  amount: number;
  /** Share of total platform revenue, as a percentage. */
  share: number;
  /** How many billable events / subscribers produced `amount`. */
  units: number;
  unitLabel: string;
  /** One sentence explaining the charge, shown as help text in the UI. */
  basis: string;
}

/** The full multi-stream roll-up the Admin sees. */
export interface PlatformStreamsOverview {
  currency: string;
  periodFrom: string | null;
  periodTo: string | null;
  totalRevenue: number;
  recurringRevenue: number;
  usageRevenue: number;
  byStream: RevenueStreamLine[];
  byPayer: Array<{ payer: string; amount: number; share: number }>;
  /** Headline unit economics — what the Admin quotes to an investor. */
  unitEconomics: {
    hospitals: number;
    /** Billable staff accounts across every hospital — what the plans price. */
    staffSeats: number;
    patients: number;
    revenuePerHospital: number;
    /** Hospital subscription revenue divided by billable seats. */
    revenuePerStaffSeat: number;
    revenuePerPatient: number;
    /** Recurring revenue as a share of total — the stickiness number. */
    recurringShare: number;
  };
}

/**
 * What one doctor's consultations were worth.
 *
 * NexCare takes nothing from a doctor as of 2026-09-01, so there is no
 * commission and no listing fee here any more. The figure is the consultation
 * revenue the doctor generated for their hospital — their own contribution,
 * not a bill.
 */
export interface DoctorEarnings {
  doctorId: string;
  doctorName: string;
  hospitalId: string;
  currency: string;
  /** What the doctor charges per consultation. */
  consultationFee: number;
  appointmentsBooked: number;
  appointmentsCompleted: number;
  appointmentsCancelled: number;
  /** Sum of the fees on completed consultations. */
  grossEarnings: number;
  byMonth: Array<{ month: string; completed: number; gross: number }>;
}

/** What one patient's membership is worth to them. */
export interface PatientMembership {
  patientId: string;
  currency: string;
  planId: string;
  planName: string;
  monthlyFee: number;
  status: string;
  renewsOn: string | null;
  bookingsMade: number;
  /** Booking fees a member did not have to pay. */
  bookingFeesWaived: number;
  /** What the membership cost over the same period. */
  membershipPaid: number;
  /** bookingFeesWaived − membershipPaid. Negative means the plan is not paying off. */
  netBenefit: number;
}
