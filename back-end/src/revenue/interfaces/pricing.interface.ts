/**
 * Pricing interfaces — the catalogue side of the revenue model.
 *
 * `revenue.interface.ts` describes what NexCare *earned*. This file describes
 * what NexCare *charges*, and to whom. There are three payers, deliberately kept
 * separate because they buy different things:
 *
 *  1. HOSPITALS buy the platform itself — a per-site SaaS licence, tiered by
 *     bed capacity at signup with annual MAP reconciliation for upgrades.
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

// ── Hospital Subscription Tiers (Bed-Based) ──────────────────────────────────
//
// Tier assignment is based on bed capacity at signup (simple, verifiable).
// An annual reconciliation job checks actual MAP (Monthly Active Patients)
// and flags hospitals that have grown past their tier for an upgrade prompt.
// This gives simplicity now with a growth path to usage-based tiers in v2.

export type HospitalTierId = 'CLINIC' | 'COMMUNITY' | 'REGIONAL' | 'ENTERPRISE';

/**
 * A hospital subscription tier — what NexCare charges a hospital for the
 * platform licence, based on bed capacity.
 */
export interface HospitalSubscriptionTier {
  id: HospitalTierId;
  name: string;
  tagline: string;
  /** Minimum bed count (inclusive) for this tier. */
  minBeds: number;
  /** Maximum bed count (inclusive). null = no upper limit (ENTERPRISE). */
  maxBeds: number | null;
  /** Annual subscription fee in rupees. */
  annualFeeRupees: number;
  /**
   * Share of what this hospital collects that NexCare takes, as a fraction.
   * Larger hospitals negotiate a lower rate — mirrors real B2B SaaS economics.
   */
  hospitalCommissionRate: number;
  /** Maximum staff accounts included before per-seat charges apply. */
  includedStaffSeats: number;
  /** Maximum doctor registrations included in the tier. */
  includedDoctorSeats: number;
  features: string[];
  status: 'active' | 'retired';
  currency: string;
}

/**
 * The subscription contract for a specific hospital.
 * Created/updated when a hospital registers or renews.
 */
export interface HospitalSubscriptionContract {
  id: string;
  hospitalId: string;
  tierId: HospitalTierId;
  /**
   * The basis used to assign the tier — 'beds' for initial signup.
   * Future: 'map' for usage-based tiers after annual reconciliation.
   */
  tierBasis: 'beds' | 'map' | 'negotiated';
  /** Bed count recorded at contract creation — the basis for tier assignment. */
  bedsAtSignup: number;
  /** Commission rate locked in at contract creation (may differ from tier default if negotiated). */
  commissionRate: number;
  billingCycle: 'annual' | 'monthly';
  annualFeeRupees: number;
  contractStartDate: string;
  contractEndDate: string;
  /**
   * MAP measured during last reconciliation run.
   * Populated by the billing-reconciliation job, not at signup.
   */
  lastMeasuredMAP?: number;
  lastReconciliationDate?: string;
  /** Set by reconciliation if the hospital has grown past its contracted tier. */
  upgradeRecommendedTierId?: HospitalTierId;
  status: 'active' | 'suspended' | 'expired' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

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
  /**
   * Share of what a hospital collects that NexCare takes, as a fraction.
   *
   * This used to live on the hospital's subscription plan. Hospital
   * subscriptions were removed from the revenue model on 2026-08-30, so the
   * rate is now a single platform-wide term — every hospital is charged the
   * same percentage of what it actually collects, and nothing is billed to a
   * hospital that collects nothing.
   */
  hospitalCommissionRate: number;
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
