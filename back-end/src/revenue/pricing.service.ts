import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { FileStore } from '../common/utils/file-store.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import {
  DoctorPlan,
  DoctorSubscription,
  PatientPlan,
  PatientSubscription,
  PlatformFeeConfig,
  HospitalSubscriptionTier,
  HospitalSubscriptionContract,
  HospitalTierId,
} from './interfaces/pricing.interface';

/**
 * Pricing Service
 *
 * Owns the catalogue: what NexCare charges doctors and patients, plus the
 * cross-cutting fees. RevenueService reads from here and never writes to it —
 * pricing changes are an Admin action, not a side effect of a report.
 *
 * Every store seeds itself on first read, so a fresh checkout has a working
 * price list without a migration step.
 */
@Injectable()
export class PricingService {
  private readonly doctorPlansStore = new FileStore<DoctorPlan>(
    'doctor-plans.json',
    () => PricingService.seedDoctorPlans(),
  );
  private readonly doctorSubsStore = new FileStore<DoctorSubscription>(
    'doctor-subscriptions.json',
    () => [],
  );
  private readonly patientPlansStore = new FileStore<PatientPlan>(
    'patient-plans.json',
    () => PricingService.seedPatientPlans(),
  );
  private readonly patientSubsStore = new FileStore<PatientSubscription>(
    'patient-subscriptions.json',
    () => [],
  );
  /** Single-row store — an array of one so it can reuse FileStore. */
  private readonly feeConfigStore = new FileStore<PlatformFeeConfig>(
    'platform-fee-config.json',
    () => [PricingService.seedFeeConfig()],
  );
  private readonly hospitalTierStore = new FileStore<HospitalSubscriptionTier>(
    'hospital-subscription-tiers.json',
    () => PricingService.seedHospitalTiers(),
  );
  private readonly hospitalContractStore = new FileStore<HospitalSubscriptionContract>(
    'hospital-subscription-contracts.json',
    () => [],
  );

  // ── Seeds ─────────────────────────────────────────────────────────────────

  /**
   * Hospital subscription tiers, pegged to bed capacity.
   * Small/mid/large/enterprise — commission rate decreases as the hospital grows.
   */
  private static seedHospitalTiers(): HospitalSubscriptionTier[] {
    return [
      {
        id: 'CLINIC',
        name: 'Clinic',
        tagline: 'For small clinics and day-care centres',
        minBeds: 0,
        maxBeds: 50,
        annualFeeRupees: 60_000,
        hospitalCommissionRate: 0.025,  // 2.5% of collections
        includedStaffSeats: 10,
        includedDoctorSeats: 5,
        features: [
          'Up to 50 beds',
          'Up to 5 doctors, 10 staff seats',
          '2.5% platform commission on collections',
          'Patient appointment booking',
          'Billing & invoicing',
        ],
        status: 'active',
        currency: '₹',
      },
      {
        id: 'COMMUNITY',
        name: 'Community Hospital',
        tagline: 'For mid-sized community hospitals',
        minBeds: 51,
        maxBeds: 200,
        annualFeeRupees: 1_50_000,
        hospitalCommissionRate: 0.020,  // 2.0%
        includedStaffSeats: 40,
        includedDoctorSeats: 20,
        features: [
          '51 – 200 beds',
          'Up to 20 doctors, 40 staff seats',
          '2.0% platform commission',
          'Ambulance dispatch module',
          'Inventory management',
          'Bed & ward management',
        ],
        status: 'active',
        currency: '₹',
      },
      {
        id: 'REGIONAL',
        name: 'Regional Hospital',
        tagline: 'For large regional referral hospitals',
        minBeds: 201,
        maxBeds: 500,
        annualFeeRupees: 3_60_000,
        hospitalCommissionRate: 0.015,  // 1.5%
        includedStaffSeats: 100,
        includedDoctorSeats: 60,
        features: [
          '201 – 500 beds',
          'Up to 60 doctors, 100 staff seats',
          '1.5% platform commission',
          'Revenue analytics dashboard',
          'Staff leave management',
          'Multi-department scheduling',
        ],
        status: 'active',
        currency: '₹',
      },
      {
        id: 'ENTERPRISE',
        name: 'Enterprise / Super Speciality',
        tagline: 'For large teaching hospitals and hospital chains',
        minBeds: 501,
        maxBeds: null,
        annualFeeRupees: 7_20_000,
        hospitalCommissionRate: 0.010,  // 1.0% — negotiated floor
        includedStaffSeats: 500,
        includedDoctorSeats: 200,
        features: [
          '501+ beds',
          'Unlimited staff and doctor seats',
          '1.0% platform commission (negotiated)',
          'Dedicated account manager',
          'Custom SLA and uptime guarantee',
          'API access for EHR integration',
        ],
        status: 'active',
        currency: '₹',
      },
    ];
  }

  /**
   * The ladder is deliberately inverted: the free tier has the HIGHEST
   * commission. A doctor with volume saves money by paying us more up front,
   * which is what makes the upgrade voluntary rather than coerced.
   */
  private static seedDoctorPlans(): DoctorPlan[] {
    return [
      {
        id: 'DOC-FREE',
        name: 'Practice Free',
        tagline: 'Get listed and take your first bookings',
        monthlyFee: 0,
        commissionRate: 0.12,
        monthlyBookingCap: 25,
        featuredPlacement: false,
        verifiedBadge: false,
        features: [
          'Listed in patient search',
          'Up to 25 bookings a month',
          'Own schedule and leave calendar',
          '12% platform commission per completed consultation',
        ],
        status: 'active',
        currency: '₹',
      },
      {
        id: 'DOC-VERIFIED',
        name: 'Practice Verified',
        tagline: 'For consultants with a steady clinic',
        monthlyFee: 999,
        commissionRate: 0.08,
        monthlyBookingCap: null,
        featuredPlacement: false,
        verifiedBadge: true,
        features: [
          'Everything in Practice Free',
          'Verified badge on your profile',
          'Unlimited bookings',
          '8% platform commission per completed consultation',
          'Earnings and payout statements',
        ],
        status: 'active',
        currency: '₹',
      },
      {
        id: 'DOC-FEATURED',
        name: 'Practice Featured',
        tagline: 'Top placement in patient search',
        monthlyFee: 2499,
        commissionRate: 0.05,
        monthlyBookingCap: null,
        featuredPlacement: true,
        verifiedBadge: true,
        features: [
          'Everything in Practice Verified',
          'Ranked first in department search',
          '5% platform commission — the lowest take rate',
          'Priority support',
        ],
        status: 'active',
        currency: '₹',
      },
    ];
  }

  private static seedPatientPlans(): PatientPlan[] {
    return [
      {
        id: 'CARE-PAYG',
        name: 'Pay as you go',
        tagline: 'No membership — pay the booking fee each time',
        monthlyFee: 0,
        waivesBookingFee: false,
        ambulanceDiscount: 0,
        coversMembers: 1,
        priorityQueue: false,
        features: ['Book at any listed hospital', 'Convenience fee charged per booking'],
        status: 'active',
        currency: '₹',
      },
      {
        id: 'CARE-PLUS',
        name: 'NexCare Care+',
        tagline: 'For anyone booking more than twice a month',
        monthlyFee: 199,
        waivesBookingFee: true,
        ambulanceDiscount: 0.2,
        coversMembers: 1,
        priorityQueue: true,
        features: [
          'No booking fee, ever',
          '20% off ambulance dispatch',
          'Priority slot in the appointment queue',
          'Bill history and payment reminders',
        ],
        status: 'active',
        currency: '₹',
      },
      {
        id: 'CARE-FAMILY',
        name: 'Care+ Family',
        tagline: 'One membership, up to four people',
        monthlyFee: 399,
        waivesBookingFee: true,
        ambulanceDiscount: 0.25,
        coversMembers: 4,
        priorityQueue: true,
        features: [
          'Everything in Care+ for up to 4 family members',
          '25% off ambulance dispatch',
          'Shared bill history',
        ],
        status: 'active',
        currency: '₹',
      },
    ];
  }

  private static seedFeeConfig(): PlatformFeeConfig {
    return {
      id: 'FEE-CONFIG',
      currency: '₹',
      patientBookingFee: 39,
      hospitalCommissionRate: 0.015,
      ambulanceDispatchFee: 149,
      paymentGatewayRate: 0.019,
      extraStaffSeatFee: 250,
      notificationCreditFee: 0.35,
      updatedAt: new Date().toISOString(),
    };
  }

  // ── Doctor plans ──────────────────────────────────────────────────────────

  loadDoctorPlans(): DoctorPlan[] {
    return this.doctorPlansStore.load();
  }

  async findDoctorPlans() {
    try {
      return ResponseUtil.success('Doctor plans retrieved successfully', this.loadDoctorPlans());
    } catch {
      return ResponseUtil.serverError('Failed to retrieve doctor plans');
    }
  }

  async updateDoctorPlan(planId: string, changes: Partial<DoctorPlan>) {
    try {
      const plans = this.doctorPlansStore.load();
      const idx = plans.findIndex(p => p.id === planId);
      if (idx === -1) return ResponseUtil.notFound('Doctor plan', planId);

      const { id, ...safe } = changes as any;
      plans[idx] = { ...plans[idx], ...safe };
      this.doctorPlansStore.save(plans);
      return ResponseUtil.updated('Doctor plan', plans[idx]);
    } catch {
      return ResponseUtil.serverError('Failed to update doctor plan');
    }
  }

  // ── Doctor subscriptions ──────────────────────────────────────────────────

  loadDoctorSubscriptions(): DoctorSubscription[] {
    return this.doctorSubsStore.load();
  }

  async findDoctorSubscriptions(doctorId?: string) {
    try {
      const subs = this.loadDoctorSubscriptions();
      return ResponseUtil.success(
        'Doctor subscriptions retrieved successfully',
        doctorId ? subs.filter(s => s.doctorId === doctorId) : subs,
      );
    } catch {
      return ResponseUtil.serverError('Failed to retrieve doctor subscriptions');
    }
  }

  /**
   * Every doctor has a subscription whether or not a row exists — an unenrolled
   * doctor is on the free tier. Materialising the row on first read keeps the
   * revenue roll-up from silently skipping doctors nobody has enrolled yet.
   */
  ensureDoctorSubscription(doctor: {
    id: string;
    name: string;
    hospitalId?: string;
    consultationFee?: number;
  }): DoctorSubscription {
    const subs = this.doctorSubsStore.load();
    const existing = subs.find(s => s.doctorId === doctor.id);
    if (existing) return existing;

    const now = new Date();
    const created: DoctorSubscription = {
      id: `DSUB-${doctor.id}`,
      doctorId: doctor.id,
      doctorName: doctor.name,
      hospitalId: doctor.hospitalId || '',
      planId: 'DOC-FREE',
      status: 'active',
      consultationFee: doctor.consultationFee || 500,
      startedAt: now.toISOString(),
      renewsOn: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
      notes: 'Auto-enrolled on the free listing tier.',
    };
    subs.push(created);
    this.doctorSubsStore.save(subs);
    return created;
  }

  async updateDoctorSubscription(
    doctorId: string,
    changes: { planId?: string; status?: string; consultationFee?: number },
  ) {
    try {
      const subs = this.doctorSubsStore.load();
      const idx = subs.findIndex(s => s.doctorId === doctorId);
      if (idx === -1) return ResponseUtil.notFound('Doctor subscription', doctorId);

      if (changes.planId) {
        const plan = this.loadDoctorPlans().find(p => p.id === changes.planId);
        if (!plan) return ResponseUtil.error(`Unknown doctor plan '${changes.planId}'`);
        subs[idx].planId = changes.planId;
      }
      if (changes.status) subs[idx].status = changes.status as DoctorSubscription['status'];
      if (typeof changes.consultationFee === 'number') {
        if (changes.consultationFee < 0) {
          return ResponseUtil.validationError('Consultation fee cannot be negative');
        }
        subs[idx].consultationFee = changes.consultationFee;
      }

      this.doctorSubsStore.save(subs);
      return ResponseUtil.updated('Doctor subscription', subs[idx]);
    } catch {
      return ResponseUtil.serverError('Failed to update doctor subscription');
    }
  }

  // ── Patient plans ─────────────────────────────────────────────────────────

  loadPatientPlans(): PatientPlan[] {
    return this.patientPlansStore.load();
  }

  async findPatientPlans() {
    try {
      return ResponseUtil.success('Patient plans retrieved successfully', this.loadPatientPlans());
    } catch {
      return ResponseUtil.serverError('Failed to retrieve patient plans');
    }
  }

  async updatePatientPlan(planId: string, changes: Partial<PatientPlan>) {
    try {
      const plans = this.patientPlansStore.load();
      const idx = plans.findIndex(p => p.id === planId);
      if (idx === -1) return ResponseUtil.notFound('Patient plan', planId);

      const { id, ...safe } = changes as any;
      plans[idx] = { ...plans[idx], ...safe };
      this.patientPlansStore.save(plans);
      return ResponseUtil.updated('Patient plan', plans[idx]);
    } catch {
      return ResponseUtil.serverError('Failed to update patient plan');
    }
  }

  // ── Patient subscriptions ─────────────────────────────────────────────────

  loadPatientSubscriptions(): PatientSubscription[] {
    return this.patientSubsStore.load();
  }

  /** The plan a patient is actually on. Absent row means pay-as-you-go. */
  planForPatient(patientId: string): PatientPlan {
    const plans = this.loadPatientPlans();
    const payg = plans.find(p => p.id === 'CARE-PAYG') || plans[0];
    const sub = this.loadPatientSubscriptions().find(
      s => s.patientId === patientId && s.status === 'active',
    );
    if (!sub) return payg;
    return plans.find(p => p.id === sub.planId) || payg;
  }

  async findPatientSubscriptions() {
    try {
      return ResponseUtil.success(
        'Patient memberships retrieved successfully',
        this.loadPatientSubscriptions(),
      );
    } catch {
      return ResponseUtil.serverError('Failed to retrieve patient memberships');
    }
  }

  async findPatientSubscription(patientId: string) {
    try {
      const sub = this.loadPatientSubscriptions().find(s => s.patientId === patientId);
      return ResponseUtil.success('Patient subscription retrieved successfully', sub || null);
    } catch {
      return ResponseUtil.serverError('Failed to retrieve patient subscription');
    }
  }

  /**
   * Subscribe or switch a patient's membership. Selecting the pay-as-you-go tier
   * is how a patient cancels — there is no separate cancel endpoint.
   */
  async setPatientSubscription(
    patientId: string,
    patientName: string,
    planId: string,
  ) {
    try {
      const plan = this.loadPatientPlans().find(p => p.id === planId);
      if (!plan) return ResponseUtil.error(`Unknown patient plan '${planId}'`);

      const subs = this.patientSubsStore.load();
      const idx = subs.findIndex(s => s.patientId === patientId);
      const now = new Date();
      const renewsOn = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString();

      const row: PatientSubscription = {
        id: idx === -1 ? `PSUB-${patientId}` : subs[idx].id,
        patientId,
        patientName,
        planId,
        status: planId === 'CARE-PAYG' ? 'cancelled' : 'active',
        startedAt: idx === -1 ? now.toISOString() : subs[idx].startedAt,
        renewsOn,
      };

      if (idx === -1) subs.push(row);
      else subs[idx] = row;
      this.patientSubsStore.save(subs);

      return ResponseUtil.success(
        planId === 'CARE-PAYG'
          ? 'Membership cancelled — you are back on pay as you go'
          : `You are now on ${plan.name}`,
        row,
      );
    } catch {
      return ResponseUtil.serverError('Failed to update patient membership');
    }
  }

  // ── Cross-cutting fee config ──────────────────────────────────────────────

  loadFeeConfig(): PlatformFeeConfig {
    const rows = this.feeConfigStore.load();
    return rows[0] || PricingService.seedFeeConfig();
  }

  async findFeeConfig() {
    try {
      return ResponseUtil.success('Platform fee configuration retrieved successfully', this.loadFeeConfig());
    } catch {
      return ResponseUtil.serverError('Failed to retrieve platform fee configuration');
    }
  }

  async updateFeeConfig(changes: Partial<PlatformFeeConfig>, updatedBy?: string) {
    try {
      const current = this.loadFeeConfig();
      const { id, updatedAt, ...safe } = changes as any;

      // Rates are fractions and fees are rupees — both refuse to go negative,
      // and a rate above 1 would mean charging more than the transaction.
      for (const [key, value] of Object.entries(safe)) {
        if (typeof value === 'number' && value < 0) {
          return ResponseUtil.validationError(`${key} cannot be negative`);
        }
      }
      for (const rateKey of ['paymentGatewayRate', 'hospitalCommissionRate']) {
        const value = (safe as any)[rateKey];
        if (typeof value === 'number' && value > 1) {
          return ResponseUtil.validationError(`${rateKey} is a fraction — 0.019 means 1.9%`);
        }
      }

      const next: PlatformFeeConfig = {
        ...current,
        ...safe,
        id: current.id,
        updatedAt: new Date().toISOString(),
        updatedBy: updatedBy || current.updatedBy,
      };
      this.feeConfigStore.save([next]);
      return ResponseUtil.updated('Platform fee configuration', next);
    } catch {
      return ResponseUtil.serverError('Failed to update platform fee configuration');
    }
  }

  // ── Hospital Subscription Tiers & Contracts ────────────────────────────────

  loadHospitalTiers(): HospitalSubscriptionTier[] {
    return this.hospitalTierStore.load();
  }

  async findHospitalTiers() {
    try {
      return ResponseUtil.success('Hospital tiers retrieved', this.loadHospitalTiers());
    } catch {
      return ResponseUtil.serverError('Failed to retrieve hospital tiers');
    }
  }

  /**
   * Resolve which tier applies for a given bed count.
   * Returns the matching tier or COMMUNITY as a safe default.
   */
  resolveHospitalTier(totalBeds: number): HospitalSubscriptionTier {
    const tiers = this.loadHospitalTiers().filter(t => t.status === 'active');
    const match = tiers.find(t =>
      totalBeds >= t.minBeds && (t.maxBeds === null || totalBeds <= t.maxBeds),
    );
    return match ?? tiers.find(t => t.id === 'COMMUNITY') ?? tiers[0];
  }

  /**
   * Create or replace the subscription contract for a hospital.
   * Call this when a hospital is approved/verified, or when it renews.
   *
   * The tier is resolved automatically from totalBeds — callers do not
   * pick the tier themselves.
   */
  assignHospitalContract(hospitalId: string, totalBeds: number): HospitalSubscriptionContract {
    const tier = this.resolveHospitalTier(totalBeds);
    const now = new Date();
    const endDate = new Date(now);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const contracts = this.hospitalContractStore.load();
    const existingIdx = contracts.findIndex(c => c.hospitalId === hospitalId && c.status === 'active');

    const contract: HospitalSubscriptionContract = {
      id: existingIdx >= 0 ? contracts[existingIdx].id : IdGenerator.generate('HSC'),
      hospitalId,
      tierId: tier.id as HospitalTierId,
      tierBasis: 'beds',
      bedsAtSignup: totalBeds,
      commissionRate: tier.hospitalCommissionRate,
      billingCycle: 'annual',
      annualFeeRupees: tier.annualFeeRupees,
      contractStartDate: now.toISOString(),
      contractEndDate: endDate.toISOString(),
      status: 'active',
      createdAt: existingIdx >= 0 ? contracts[existingIdx].createdAt : now.toISOString(),
      updatedAt: now.toISOString(),
    };

    if (existingIdx >= 0) {
      contracts[existingIdx] = contract;
    } else {
      contracts.push(contract);
    }
    this.hospitalContractStore.save(contracts);
    return contract;
  }

  loadHospitalContracts(): HospitalSubscriptionContract[] {
    return this.hospitalContractStore.load();
  }

  async findHospitalContracts(hospitalId?: string) {
    try {
      let contracts = this.loadHospitalContracts();
      if (hospitalId) contracts = contracts.filter(c => c.hospitalId === hospitalId);
      return ResponseUtil.success('Hospital contracts retrieved', contracts);
    } catch {
      return ResponseUtil.serverError('Failed to retrieve hospital contracts');
    }
  }

  /**
   * Annual reconciliation: measure actual MAP against contracted tier.
   * Flags hospitals that have grown past their tier with an upgradeRecommendedTierId.
   * Does NOT automatically charge — a human reviews and approves the upgrade.
   */
  runTierReconciliation(hospitalId: string, measuredMAP: number): HospitalSubscriptionContract | null {
    const contracts = this.hospitalContractStore.load();
    const idx = contracts.findIndex(c => c.hospitalId === hospitalId && c.status === 'active');
    if (idx === -1) return null;

    const currentTier = this.resolveHospitalTier(contracts[idx].bedsAtSignup);
    // Use MAP * 30 as a rough "bed equivalent" to check if they've outgrown their tier
    const tiers = this.loadHospitalTiers().filter(t => t.status === 'active');
    const betterTier = tiers.find(t =>
      t.id !== currentTier.id &&
      t.annualFeeRupees > currentTier.annualFeeRupees &&
      measuredMAP > (currentTier.maxBeds ?? Infinity) * 0.8, // 80% utilisation threshold
    );

    contracts[idx] = {
      ...contracts[idx],
      lastMeasuredMAP: measuredMAP,
      lastReconciliationDate: new Date().toISOString(),
      upgradeRecommendedTierId: betterTier ? (betterTier.id as HospitalTierId) : undefined,
      updatedAt: new Date().toISOString(),
    };
    this.hospitalContractStore.save(contracts);
    return contracts[idx];
  }
}
