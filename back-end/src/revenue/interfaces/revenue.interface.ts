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

/** A subscription tier hospitals can be placed on. */
export interface SubscriptionPlan {
  id: string;
  name: string;
  tagline: string;
  /** Recurring base fee per billing cycle, in rupees. */
  monthlyFee: number;
  /** Beds covered by the base fee before per-bed overage applies. */
  includedBeds: number;
  perExtraBedFee: number;
  /** Share of the hospital's collections NexCare takes, as a fraction (0.015 = 1.5%). */
  commissionRate: number;
  maxStaffAccounts: number;
  supportSla: string;
  features: string[];
  status: 'active' | 'retired';
  currency: string;
}

/** Which plan a hospital is on. */
export interface HospitalSubscription {
  id: string;
  hospitalId: string;
  hospitalName: string;
  planId: string;
  status: 'active' | 'pending_activation' | 'suspended' | 'cancelled';
  billingCycle: 'monthly' | 'annual';
  contractedBeds: number;
  startedAt: string;
  renewsOn: string;
  notes?: string;
}

/** What one hospital contributes to platform revenue in a cycle. */
export interface HospitalRevenueLine {
  hospitalId: string;
  hospitalName: string;
  planId: string;
  planName: string;
  status: string;
  contractedBeds: number;
  /** monthlyFee for the plan. */
  baseFee: number;
  /** Charge for beds above the plan's included allowance. */
  bedOverageFee: number;
  /** What the hospital collected from patients (paid bills only). */
  collections: number;
  /** commissionRate applied to collections. */
  commission: number;
  /** baseFee + bedOverageFee + commission. */
  platformRevenue: number;
}

/** Platform-wide roll-up for the Admin. */
export interface PlatformRevenueOverview {
  currency: string;
  /** Recurring component only — base fees + bed overage. Commission is usage-based. */
  mrr: number;
  arr: number;
  /** Commission earned on hospital collections in the period. */
  commissionRevenue: number;
  /** mrr + commissionRevenue. */
  totalRevenue: number;
  activeSubscriptions: number;
  pendingActivations: number;
  averageRevenuePerHospital: number;
  /** Total the hospitals collected — the base the commission is charged on. */
  gatewayVolume: number;
  outstandingReceivables: number;
  byPlan: Array<{
    planId: string;
    planName: string;
    hospitals: number;
    monthlyFee: number;
    recurringRevenue: number;
    share: number;
  }>;
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
  /** What this hospital owes NexCare for the current cycle. */
  platformCharges: {
    planName: string;
    baseFee: number;
    bedOverageFee: number;
    commission: number;
    total: number;
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
