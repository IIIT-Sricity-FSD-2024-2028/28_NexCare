/**
 * Revenue model interfaces.
 *
 * NexCare has two distinct revenue streams and they must not be conflated:
 *
 *  1. PLATFORM revenue — what NexCare earns from hospitals for using the
 *     platform: a monthly subscription priced by the number of staff accounts
 *     the hospital runs, plus the processing fee on bills settled through the
 *     gateway. This is the business's own revenue model and is visible only to
 *     the Admin/superuser.
 *
 *  2. OPERATIONAL revenue — what an individual hospital collects from patients
 *     through NexCare billing. It belongs to that hospital and its oversight
 *     chain (hospital manager, then the regional officer over their hospitals).
 */

/**
 * What one hospital contributed to platform revenue in a period.
 *
 * The COMMISSION on hospital collections was removed on 2026-09-01. NexCare no
 * longer takes a share of what a hospital earns; it charges a subscription for
 * the seats the hospital uses, so the hospital's cost is fixed and predictable
 * whatever its month looks like.
 */
export interface HospitalRevenueLine {
  hospitalId: string;
  hospitalName: string;
  status: string;
  /** Which staff-count plan this hospital is on. */
  planName: string;
  /** Billable staff accounts — the meter the plan is priced on. */
  staffSeats: number;
  /** What the hospital collected from patients (settled payments only). */
  collections: number;
  /** The monthly subscription, including any seats beyond the plan's allowance. */
  subscription: number;
  /** Processing fee taken on those payments. */
  processingFees: number;
  /** subscription + processingFees. */
  platformRevenue: number;
  paymentsProcessed: number;
}

/** Platform-wide roll-up for the Admin. */
export interface PlatformRevenueOverview {
  currency: string;
  /**
   * Recurring revenue — hospital staff-count subscriptions plus Care+
   * memberships. Doctor listing tiers used to sit here; they were removed on
   * 2026-09-01 along with the rest of the doctor-side billing.
   */
  mrr: number;
  arr: number;
  /** Hospital subscription revenue for the cycle. */
  subscriptionRevenue: number;
  /** Processing fees earned on those payments. */
  processingRevenue: number;
  /** Every stream added together, recurring and transactional. */
  totalRevenue: number;
  /** Hospitals that contributed revenue in the period. */
  earningHospitals: number;
  totalHospitals: number;
  averageRevenuePerHospital: number;
  /** Total the hospitals collected — the base the commission is charged on. */
  gatewayVolume: number;
  outstandingReceivables: number;
  byHospital: HospitalRevenueLine[];
}

/** One hospital's own collections, for its manager / regional officer. */
export interface HospitalOperationalRevenue {
  hospitalId: string;
  hospitalName: string;
  currency: string;
  collected: number;
  outstanding: number;
  billsIssued: number;
  billsPaid: number;
  billsPending: number;
  collectionRate: number;
  averageBillValue: number;
  gstCollected: number;
  byDepartment: Array<{ department: string; amount: number; share: number }>;
  byMonth: Array<{ month: string; collected: number; outstanding: number }>;
  /**
   * What this hospital owes NexCare for the period: the staff-count
   * subscription, plus the processing fee on the bills it actually settled.
   * Null when the hospital has no active subscription.
   */
  platformCharges: {
    planName: string;
    /** Billable staff accounts the plan is priced on. */
    staffSeats: number;
    /** Seats the plan covers. null = unlimited. */
    includedSeats: number | null;
    /** The plan's own monthly fee. */
    baseFee: number;
    /** Seats beyond the allowance, at the per-seat rate. */
    extraSeatFee: number;
    /** baseFee + extraSeatFee. */
    subscription: number;
    processingFees: number;
    total: number;
    paymentsProcessed: number;
  } | null;
}

/**
 * One regional officer's slice of the platform — what their hospitals collect,
 * what NexCare earns from them, and how much there is to look after.
 *
 * This is the Admin's answer to "which regions are actually carrying the
 * business, and is anyone overloaded?". Hospitals with no officer assigned are
 * reported under a synthetic UNASSIGNED row rather than dropped, because an
 * unassigned hospital is a gap in the review chain, not an absence of data.
 */
export interface RegionalOfficerRollup {
  officerId: string;
  officerName: string;
  officerEmail: string;
  areas: string[];
  /** False for the synthetic UNASSIGNED bucket. */
  isAssigned: boolean;

  // ── What there is to look after ──────────────────────────────────────────
  hospitals: number;
  pendingVerifications: number;
  verifiedHospitals: number;
  workloadLevel: 'low' | 'medium' | 'high';
  doctors: number;
  staff: number;
  totalBeds: number;
  availableBeds: number;
  occupancyRate: number;

  // ── Money ────────────────────────────────────────────────────────────────
  /** What the officer's hospitals collected from patients — their money. */
  collections: number;
  outstanding: number;
  billsIssued: number;
  collectionRate: number;
  /** What NexCare earns from those hospitals — the platform's money. */
  platformRevenue: number;
  /** Share of total platform revenue across all officers, as a percentage. */
  revenueShare: number;
  /** platformRevenue divided by hospitals, so small regions compare fairly. */
  revenuePerHospital: number;

  byHospital: Array<{
    hospitalId: string;
    hospitalName: string;
    city: string;
    verificationStatus: string;
    collections: number;
    outstanding: number;
    platformRevenue: number;
    doctors: number;
    availableBeds: number;
    totalBeds: number;
  }>;
}

/** The Admin's regional overview: every officer, plus platform-wide totals. */
export interface RegionalOfficerOverview {
  currency: string;
  officers: RegionalOfficerRollup[];
  totals: {
    officers: number;
    hospitals: number;
    unassignedHospitals: number;
    collections: number;
    platformRevenue: number;
    doctors: number;
    staff: number;
  };
}
