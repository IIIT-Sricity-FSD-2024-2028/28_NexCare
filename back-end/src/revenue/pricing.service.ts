import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { FileStore } from '../common/utils/file-store.util';
import {
  HospitalPlan,
  HospitalPlanId,
  HospitalSubscription,
  PatientPlan,
  PatientSubscription,
  PlatformFeeConfig,
} from './interfaces/pricing.interface';

/**
 * Pricing Service
 *
 * Owns the catalogue: what NexCare charges hospitals and patients, plus the
 * cross-cutting per-transaction fees. RevenueService reads from here and never
 * writes to it — pricing changes are an Admin action, not a side effect of a
 * report.
 *
 * Every store seeds itself on first read, so a fresh checkout has a working
 * price list without a migration step.
 */
@Injectable()
export class PricingService {
  private readonly hospitalPlansStore = new FileStore<HospitalPlan>(
    'hospital-plans.json',
    () => PricingService.seedHospitalPlans(),
  );
  private readonly hospitalSubsStore = new FileStore<HospitalSubscription>(
    'hospital-subscriptions.json',
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
  /**
   * Read/write view of the user directory. The consultation fee a doctor
   * charges lives on their user record, and a doctor may edit their own — it is
   * the one price in the system NexCare does not set.
   */
  private readonly usersStore = new FileStore<any>('users.json', () => []);

  // ── Seeds ─────────────────────────────────────────────────────────────────

  /**
   * Hospital plans, priced by the number of staff accounts the hospital runs.
   *
   * The hospital is the customer: doctors, nurses, administrative staff and
   * ambulance staff are all its employees, so it is billed once for all of
   * them rather than each of them being billed separately. Seats are the right
   * meter because the platform can count them itself — a plan is never just a
   * line somebody typed into a file.
   */
  private static seedHospitalPlans(): HospitalPlan[] {
    return [
      {
        id: 'HOSP-STARTER',
        name: 'Starter',
        tagline: 'For clinics and small hospitals',
        minUsers: 1,
        maxUsers: 25,
        monthlyFee: 4_999,
        includedStaffSeats: 25,
        features: [
          'Up to 25 staff accounts',
          'Appointments, queues and billing',
          'Bed and ward management',
          'Email support',
        ],
        status: 'active',
        currency: '₹',
      },
      {
        id: 'HOSP-GROWTH',
        name: 'Growth',
        tagline: 'For mid-sized and community hospitals',
        minUsers: 26,
        maxUsers: 100,
        monthlyFee: 14_999,
        includedStaffSeats: 100,
        features: [
          'Up to 100 staff accounts',
          'Everything in Starter',
          'Ambulance dispatch coordination',
          'Inventory and equipment tracking',
          'Revenue and occupancy analytics',
        ],
        status: 'active',
        currency: '₹',
      },
      {
        id: 'HOSP-ENTERPRISE',
        name: 'Enterprise',
        tagline: 'For large and multi-speciality hospitals',
        minUsers: 101,
        maxUsers: null,
        monthlyFee: 39_999,
        includedStaffSeats: null,
        features: [
          'Unlimited staff accounts',
          'Everything in Growth',
          'Multi-department scheduling and rosters',
          'Dedicated account manager',
          'Priority support and uptime SLA',
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
      ambulanceDispatchFee: 149,
      paymentGatewayRate: 0.019,
      extraStaffSeatFee: 250,
      notificationCreditFee: 0.35,
      updatedAt: new Date().toISOString(),
    };
  }

  // ── Hospital plans ────────────────────────────────────────────────────────

  loadHospitalPlans(): HospitalPlan[] {
    return this.hospitalPlansStore.load();
  }

  async findHospitalPlans() {
    try {
      return ResponseUtil.success('Hospital plans retrieved successfully', this.loadHospitalPlans());
    } catch {
      return ResponseUtil.serverError('Failed to retrieve hospital plans');
    }
  }

  async updateHospitalPlan(planId: string, changes: Partial<HospitalPlan>) {
    try {
      const plans = this.hospitalPlansStore.load();
      const idx = plans.findIndex(p => p.id === planId);
      if (idx === -1) return ResponseUtil.notFound('Hospital plan', planId);

      if (typeof changes.monthlyFee === 'number' && changes.monthlyFee < 0) {
        return ResponseUtil.validationError('Monthly fee cannot be negative');
      }

      const { id, ...safe } = changes as any;
      plans[idx] = { ...plans[idx], ...safe };
      this.hospitalPlansStore.save(plans);
      return ResponseUtil.updated('Hospital plan', plans[idx]);
    } catch {
      return ResponseUtil.serverError('Failed to update hospital plan');
    }
  }

  /** The plan a hospital of this size belongs on. */
  resolveHospitalPlan(staffCount: number): HospitalPlan {
    const plans = this.loadHospitalPlans().filter(p => p.status === 'active');
    const match = plans.find(
      p => staffCount >= p.minUsers && (p.maxUsers === null || staffCount <= p.maxUsers),
    );
    // A hospital with no staff yet still sits on the smallest plan rather than
    // falling out of the model entirely.
    return match ?? plans[0];
  }

  // ── Hospital subscriptions ────────────────────────────────────────────────

  loadHospitalSubscriptions(): HospitalSubscription[] {
    return this.hospitalSubsStore.load();
  }

  /**
   * Every hospital on the platform is on a plan whether or not a row exists —
   * an unenrolled hospital is on the plan its current headcount puts it on.
   * Materialising the row on first read keeps the revenue roll-up from silently
   * skipping hospitals nobody has enrolled yet, exactly as
   * `ensureDoctorSubscription` used to do for doctors.
   */
  ensureHospitalSubscription(hospital: { id: string; name: string }, staffCount: number): HospitalSubscription {
    const subs = this.hospitalSubsStore.load();
    const existing = subs.find(s => s.hospitalId === hospital.id);
    if (existing) return existing;

    const plan = this.resolveHospitalPlan(staffCount);
    const now = new Date();
    const created: HospitalSubscription = {
      id: `HSUB-${hospital.id}`,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      planId: plan.id,
      status: 'active',
      billingCycle: 'monthly',
      staffAtSignup: staffCount,
      startedAt: now.toISOString(),
      renewsOn: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
      notes: `Auto-enrolled on ${plan.name} at ${staffCount} staff account${staffCount === 1 ? '' : 's'}.`,
    };
    subs.push(created);
    this.hospitalSubsStore.save(subs);
    return created;
  }

  async findHospitalSubscriptions(hospitalId?: string) {
    try {
      const subs = this.loadHospitalSubscriptions();
      return ResponseUtil.success(
        'Hospital subscriptions retrieved successfully',
        hospitalId ? subs.filter(s => s.hospitalId === hospitalId) : subs,
      );
    } catch {
      return ResponseUtil.serverError('Failed to retrieve hospital subscriptions');
    }
  }

  async updateHospitalSubscription(
    hospitalId: string,
    changes: { planId?: string; status?: string },
  ) {
    try {
      const subs = this.hospitalSubsStore.load();
      const idx = subs.findIndex(s => s.hospitalId === hospitalId);
      if (idx === -1) return ResponseUtil.notFound('Hospital subscription', hospitalId);

      if (changes.planId) {
        const plan = this.loadHospitalPlans().find(p => p.id === changes.planId);
        if (!plan) return ResponseUtil.error(`Unknown hospital plan '${changes.planId}'`);
        subs[idx].planId = changes.planId as HospitalPlanId;
      }
      if (changes.status) {
        subs[idx].status = changes.status as HospitalSubscription['status'];
      }

      this.hospitalSubsStore.save(subs);
      return ResponseUtil.updated('Hospital subscription', subs[idx]);
    } catch {
      return ResponseUtil.serverError('Failed to update hospital subscription');
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

  // ── Consultation fee ──────────────────────────────────────────────────────

  /**
   * The fee a doctor charges a patient per consultation. It is the hospital's
   * money, not NexCare's — the platform takes nothing from it — but the doctor
   * sets it, and the booking wizard quotes it, so it is edited here.
   */
  async setDoctorConsultationFee(doctorId: string, consultationFee: number) {
    try {
      if (!Number.isFinite(consultationFee) || consultationFee < 0) {
        return ResponseUtil.validationError('Consultation fee cannot be negative');
      }

      const users = this.usersStore.load();
      const idx = users.findIndex(u => u.id === doctorId && u.role === 'doctor');
      if (idx === -1) return ResponseUtil.notFound('Doctor', doctorId);

      users[idx].consultationFee = consultationFee;
      this.usersStore.save(users);

      return ResponseUtil.updated('Consultation fee', {
        doctorId,
        consultationFee,
      });
    } catch {
      return ResponseUtil.serverError('Failed to update the consultation fee');
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
      if (typeof (safe as any).paymentGatewayRate === 'number' && (safe as any).paymentGatewayRate > 1) {
        return ResponseUtil.validationError('paymentGatewayRate is a fraction — 0.019 means 1.9%');
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
}
