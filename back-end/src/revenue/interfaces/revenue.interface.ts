/**
 * Revenue model interfaces.
 *
 * NexCare has two distinct revenue streams and they must not be conflated:
 *
 *  1. PLATFORM revenue — what NexCare earns from hospitals for using the
 *     platform (subscription base fee + per-bed overage + a commission on what
 *     the hospital collects). This is the business's own revenue model and is
 *     visible only to the Admin/superuser.
 *
 *  2. OPERATIONAL revenue — what an individual hospital collects from patients
 *     through NexCare billing. It belongs to that hospital and its oversight
 *     chain (hospital manager, then the regional officer over their hospitals).
 */

/**
 * What one hospital contributed to platform revenue in a period.
 *
 * Hospital SUBSCRIPTIONS were removed from the model on 2026-08-30, so there is
 * no plan, no base fee and no bed overage here any more. A hospital pays only
 * on what it actually collects, which means a hospital that collects nothing
 * owes nothing.
 */
export interface HospitalRevenueLine {
  hospitalId: string;
  hospitalName: string;
  status: string;
  /** What the hospital collected from patients (settled payments only). */
  collections: number;
  /** Commission taken on those collections. */
  commission: number;
  /** Processing fee taken on those payments. */
  processingFees: number;
  /** commission + processingFees. */
  platformRevenue: number;
  paymentsProcessed: number;
}

/** Platform-wide roll-up for the Admin. */
export interface PlatformRevenueOverview {
  currency: string;
  /**
   * Recurring revenue — doctor listing tiers and Care+ memberships only. The
   * hospital licence used to sit here; it was removed on 2026-08-30.
   */
  mrr: number;
  arr: number;
  /** Commission earned on hospital collections in the period. */
  commissionRevenue: number;
  /** Processing fees earned on those payments. */
  processingRevenue: number;
  /** Every stream added together, recurring and transactional. */
  totalRevenue: number;
  /** Hospitals that actually generated revenue in the period. */
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
   * What this hospital owes NexCare for the period — transactional only, since
   * the subscription was removed. Null when nothing was settled.
   */
  platformCharges: {
    commission: number;
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
