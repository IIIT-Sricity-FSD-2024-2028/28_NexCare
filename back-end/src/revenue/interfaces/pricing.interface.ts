/**
 * Pricing interfaces — the catalogue side of the revenue model.
 *
 * `revenue.interface.ts` describes what NexCare *earned*. This file describes
 * what NexCare *charges*, and to whom. There are three payers, deliberately kept
 * separate because they buy different things:
 *
 *  1. HOSPITALS buy the platform itself (see SubscriptionPlan in
 *     revenue.interface.ts) — a per-site SaaS licence.
 *  2. DOCTORS buy visibility and booking volume — a per-practitioner listing
 *     plan. A doctor on the free tier still earns NexCare money, because the
 *     free tier carries the highest per-booking commission. That is the whole
 *     point of the ladder: the cheaper the subscription, the higher the take
 *     rate, so a busy doctor upgrades because it is cheaper for them, not
 *     because we forced them.
 *  3. PATIENTS buy convenience — either per booking, or with a membership that
 *     waives the per-booking fee.
 *
 * Rates that apply to everybody (booking fee, ambulance dispatch fee, gateway
 * fee) live in PlatformFeeConfig, which the Admin can reprice at runtime.
 */

/** A listing tier a doctor can be placed on. */
export interface DoctorPlan {
  id: string;
  name: string;
  tagline: string;
  /** Recurring listing fee per month, in rupees. 0 for the free tier. */
  monthlyFee: number;
  /**
   * Share of each consultation fee NexCare takes when a booking made through
   * the platform is completed, as a fraction (0.08 = 8%).
   */
  commissionRate: number;
  /** Bookings the tier carries per month before the doctor is asked to upgrade. */
  monthlyBookingCap: number | null;
  /** Ranked above lower tiers in patient-facing doctor search. */
  featuredPlacement: boolean;
  verifiedBadge: boolean;
  features: string[];
  status: 'active' | 'retired';
  currency: string;
}

/** Which listing tier a given doctor is on. */
export interface DoctorSubscription {
  id: string;
  doctorId: string;
  doctorName: string;
  hospitalId: string;
  planId: string;
  status: 'active' | 'pending_activation' | 'suspended' | 'cancelled';
  /** What the doctor charges per consultation. The commission base. */
  consultationFee: number;
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
 */
export interface PlatformFeeConfig {
  id: string;
  currency: string;
  /** Charged to the patient on each appointment booked through NexCare. */
  patientBookingFee: number;
  /** Charged to the hospital on each completed ambulance dispatch. */
  ambulanceDispatchFee: number;
  /** Taken on every bill settled through NexCare, as a fraction. */
  paymentGatewayRate: number;
  /** Per extra staff seat beyond the plan's allowance, per month. */
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
  /** Who actually pays this. */
  payer: 'hospital' | 'doctor' | 'patient';
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
    doctors: number;
    patients: number;
    revenuePerHospital: number;
    revenuePerDoctor: number;
    revenuePerPatient: number;
    /** Recurring revenue as a share of total — the stickiness number. */
    recurringShare: number;
  };
}

/** What one doctor earned, and what the platform took. */
export interface DoctorEarnings {
  doctorId: string;
  doctorName: string;
  hospitalId: string;
  currency: string;
  planId: string;
  planName: string;
  consultationFee: number;
  commissionRate: number;
  appointmentsBooked: number;
  appointmentsCompleted: number;
  appointmentsCancelled: number;
  /** consultationFee × completed appointments. */
  grossEarnings: number;
  /** What NexCare took in commission. */
  platformCommission: number;
  /** The recurring listing fee for the cycle. */
  platformListingFee: number;
  /** grossEarnings − commission − listing fee. */
  netEarnings: number;
  byMonth: Array<{ month: string; completed: number; gross: number; net: number }>;
  /** Cheaper alternative tier, if one exists at this booking volume. */
  recommendedPlanId: string | null;
  recommendationReason: string | null;
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
