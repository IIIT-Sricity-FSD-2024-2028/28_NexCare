import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { FileStore } from '../common/utils/file-store.util';
import {
  SubscriptionPlan,
  HospitalSubscription,
  HospitalRevenueLine,
  PlatformRevenueOverview,
  HospitalOperationalRevenue,
} from './interfaces/revenue.interface';
import {
  RevenueStreamLine,
  PlatformStreamsOverview,
  DoctorEarnings,
  PatientMembership,
} from './interfaces/pricing.interface';
import { PricingService } from './pricing.service';

/**
 * Revenue Service
 *
 * Computes both revenue streams described in revenue.interface.ts. Everything is
 * derived at read time from billing.json + the subscription files, so there is no
 * denormalised total to drift out of step with the underlying bills.
 */
@Injectable()
export class RevenueService {
  private readonly plansStore = new FileStore<SubscriptionPlan>(
    'subscription-plans.json',
    () => RevenueService.seedPlans(),
  );
  private readonly subsStore = new FileStore<HospitalSubscription>(
    'hospital-subscriptions.json',
    () => [],
  );
  // Read-only views of data other modules own.
  private readonly billsStore = new FileStore<any>('billing.json', () => []);
  private readonly hospitalsStore = new FileStore<any>('hospitals.json', () => []);
  private readonly usersStore = new FileStore<any>('users.json', () => []);
  private readonly appointmentsStore = new FileStore<any>('appointments.json', () => []);
  private readonly ambulanceStore = new FileStore<any>('ambulance.json', () => []);

  constructor(private readonly pricing: PricingService) {}

  private static seedPlans(): SubscriptionPlan[] {
    return [
      {
        id: 'PLAN-STARTER', name: 'Starter', tagline: 'Single-site clinics and small hospitals',
        monthlyFee: 15000, includedBeds: 50, perExtraBedFee: 120, commissionRate: 0.01,
        maxStaffAccounts: 15, supportSla: '48-hour email',
        features: ['Appointments & queue', 'Bed allocation', 'Inventory', 'Patient billing'],
        status: 'active', currency: '₹',
      },
    ];
  }

  // ── Plans ─────────────────────────────────────────────────────────────────

  async findPlans() {
    try {
      return ResponseUtil.success('Subscription plans retrieved successfully', this.plansStore.load());
    } catch {
      return ResponseUtil.serverError('Failed to retrieve subscription plans');
    }
  }

  async updatePlan(planId: string, changes: Partial<SubscriptionPlan>) {
    try {
      const plans = this.plansStore.load();
      const idx = plans.findIndex(p => p.id === planId);
      if (idx === -1) return ResponseUtil.notFound('Subscription plan');

      // Pricing fields only — the id is never reassigned.
      const { id, ...safe } = changes as any;
      plans[idx] = { ...plans[idx], ...safe };
      this.plansStore.save(plans);
      return ResponseUtil.updated('Subscription plan', plans[idx]);
    } catch {
      return ResponseUtil.serverError('Failed to update subscription plan');
    }
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────

  async findSubscriptions() {
    try {
      return ResponseUtil.success('Subscriptions retrieved successfully', this.subsStore.load());
    } catch {
      return ResponseUtil.serverError('Failed to retrieve subscriptions');
    }
  }

  /** Move a hospital onto a different plan, or change its subscription status. */
  async updateSubscription(hospitalId: string, changes: { planId?: string; status?: string }) {
    try {
      const subs = this.subsStore.load();
      const idx = subs.findIndex(s => s.hospitalId === hospitalId);
      if (idx === -1) return ResponseUtil.notFound('Subscription');

      if (changes.planId) {
        const plan = this.plansStore.load().find(p => p.id === changes.planId);
        if (!plan) return ResponseUtil.error(`Unknown plan '${changes.planId}'`);
        subs[idx].planId = changes.planId;
      }
      if (changes.status) subs[idx].status = changes.status as HospitalSubscription['status'];

      this.subsStore.save(subs);
      return ResponseUtil.updated('Subscription', subs[idx]);
    } catch {
      return ResponseUtil.serverError('Failed to update subscription');
    }
  }

  // ── Platform revenue (Admin only) ─────────────────────────────────────────

  async getPlatformOverview(from?: string, to?: string) {
    try {
      const plans = this.plansStore.load();
      const subs = this.subsStore.load();
      const bills = this.inRange(this.billsStore.load(), from, to);

      const planById = new Map(plans.map(p => [p.id, p]));
      const byHospital: HospitalRevenueLine[] = [];

      for (const sub of subs) {
        const plan = planById.get(sub.planId);
        if (!plan) continue;

        const hospitalBills = bills.filter(b => b.hospitalId === sub.hospitalId);
        const collections = this.sum(hospitalBills.filter(b => this.isPaid(b)), b => b.total);

        // A subscription that is not active bills nothing this cycle.
        const billable = sub.status === 'active';
        const baseFee = billable ? plan.monthlyFee : 0;
        const extraBeds = Math.max(0, (sub.contractedBeds || 0) - plan.includedBeds);
        const bedOverageFee = billable ? extraBeds * plan.perExtraBedFee : 0;
        const commission = billable ? this.round(collections * plan.commissionRate) : 0;

        byHospital.push({
          hospitalId: sub.hospitalId,
          hospitalName: sub.hospitalName,
          planId: plan.id,
          planName: plan.name,
          status: sub.status,
          contractedBeds: sub.contractedBeds || 0,
          baseFee,
          bedOverageFee,
          collections: this.round(collections),
          commission,
          platformRevenue: this.round(baseFee + bedOverageFee + commission),
        });
      }

      byHospital.sort((a, b) => b.platformRevenue - a.platformRevenue);

      const mrr = this.round(this.sum(byHospital, l => l.baseFee + l.bedOverageFee));
      const commissionRevenue = this.round(this.sum(byHospital, l => l.commission));
      const activeSubscriptions = subs.filter(s => s.status === 'active').length;

      const byPlan = plans.map(plan => {
        const lines = byHospital.filter(l => l.planId === plan.id);
        const recurringRevenue = this.round(this.sum(lines, l => l.baseFee + l.bedOverageFee));
        return {
          planId: plan.id,
          planName: plan.name,
          hospitals: lines.length,
          monthlyFee: plan.monthlyFee,
          recurringRevenue,
          share: mrr > 0 ? this.round((recurringRevenue / mrr) * 100) : 0,
        };
      });

      const overview: PlatformRevenueOverview = {
        currency: '₹',
        mrr,
        arr: this.round(mrr * 12),
        commissionRevenue,
        totalRevenue: this.round(mrr + commissionRevenue),
        activeSubscriptions,
        pendingActivations: subs.filter(s => s.status === 'pending_activation').length,
        averageRevenuePerHospital: activeSubscriptions
          ? this.round((mrr + commissionRevenue) / activeSubscriptions)
          : 0,
        gatewayVolume: this.round(this.sum(bills.filter(b => this.isPaid(b)), b => b.total)),
        outstandingReceivables: this.round(this.sum(bills.filter(b => !this.isPaid(b)), b => b.total)),
        byPlan,
        byHospital,
      };

      return ResponseUtil.success('Platform revenue overview retrieved successfully', overview);
    } catch (error) {
      console.error('Platform revenue error:', error);
      return ResponseUtil.serverError('Failed to compute platform revenue');
    }
  }

  /** Month-by-month platform revenue, for the trend chart. */
  async getPlatformTrend(months = 6) {
    try {
      const bills = this.billsStore.load();
      const plans = new Map(this.plansStore.load().map(p => [p.id, p]));
      const subs = this.subsStore.load().filter(s => s.status === 'active');

      const recurring = this.sum(subs, s => {
        const plan = plans.get(s.planId);
        if (!plan) return 0;
        return plan.monthlyFee + Math.max(0, (s.contractedBeds || 0) - plan.includedBeds) * plan.perExtraBedFee;
      });

      const commissionFor = (hospitalId: string, amount: number) => {
        const sub = subs.find(s => s.hospitalId === hospitalId);
        const plan = sub ? plans.get(sub.planId) : null;
        return plan ? amount * plan.commissionRate : 0;
      };

      const buckets = this.monthKeys(months);
      const trend = buckets.map(({ key, label }) => {
        const monthBills = bills.filter(
          b => this.isPaid(b) && String(b.createdAt || '').slice(0, 7) === key,
        );
        const collections = this.sum(monthBills, b => b.total);
        const commission = this.sum(monthBills, b => commissionFor(b.hospitalId, b.total));
        return {
          month: label,
          recurring: this.round(recurring),
          commission: this.round(commission),
          collections: this.round(collections),
          total: this.round(recurring + commission),
        };
      });

      return ResponseUtil.success('Platform revenue trend retrieved successfully', trend);
    } catch {
      return ResponseUtil.serverError('Failed to compute revenue trend');
    }
  }

  // ── Hospital operational revenue ──────────────────────────────────────────

  async getHospitalRevenue(hospitalId: string, from?: string, to?: string) {
    try {
      const hospital = this.hospitalsStore.load().find(h => h.id === hospitalId);
      if (!hospital) return ResponseUtil.notFound('Hospital');

      const bills = this.inRange(this.billsStore.load(), from, to)
        .filter(b => b.hospitalId === hospitalId);

      const paid = bills.filter(b => this.isPaid(b));
      const pending = bills.filter(b => !this.isPaid(b));
      const collected = this.round(this.sum(paid, b => b.total));
      const outstanding = this.round(this.sum(pending, b => b.total));

      // Department split comes off the line items, not the bill total, so a bill
      // spanning two departments is attributed to both.
      const deptTotals = new Map<string, number>();
      for (const b of paid) {
        for (const item of b.items || []) {
          const dept = item.department || 'Other';
          deptTotals.set(dept, (deptTotals.get(dept) || 0) + (item.amount || 0));
        }
      }
      const deptSum = Array.from(deptTotals.values()).reduce((a, b) => a + b, 0);
      const byDepartment = Array.from(deptTotals.entries())
        .map(([department, amount]) => ({
          department,
          amount: this.round(amount),
          share: deptSum ? this.round((amount / deptSum) * 100) : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      const byMonth = this.monthKeys(6).map(({ key, label }) => ({
        month: label,
        collected: this.round(this.sum(
          paid.filter(b => String(b.createdAt || '').slice(0, 7) === key), b => b.total)),
        outstanding: this.round(this.sum(
          pending.filter(b => String(b.createdAt || '').slice(0, 7) === key), b => b.total)),
      }));

      const sub = this.subsStore.load().find(s => s.hospitalId === hospitalId);
      const plan = sub ? this.plansStore.load().find(p => p.id === sub.planId) : null;
      let platformCharges: HospitalOperationalRevenue['platformCharges'] = null;
      if (sub && plan && sub.status === 'active') {
        const bedOverageFee = Math.max(0, (sub.contractedBeds || 0) - plan.includedBeds) * plan.perExtraBedFee;
        const commission = this.round(collected * plan.commissionRate);
        platformCharges = {
          planName: plan.name,
          baseFee: plan.monthlyFee,
          bedOverageFee,
          commission,
          total: this.round(plan.monthlyFee + bedOverageFee + commission),
        };
      }

      const result: HospitalOperationalRevenue = {
        hospitalId,
        hospitalName: hospital.name,
        currency: '₹',
        collected,
        outstanding,
        billsIssued: bills.length,
        billsPaid: paid.length,
        billsPending: pending.length,
        collectionRate: bills.length ? this.round((paid.length / bills.length) * 100) : 0,
        averageBillValue: bills.length ? this.round(this.sum(bills, b => b.total) / bills.length) : 0,
        gstCollected: this.round(this.sum(paid, b => (b.cgstAmount || 0) + (b.sgstAmount || 0))),
        byDepartment,
        byMonth,
        platformCharges,
      };

      return ResponseUtil.success('Hospital revenue retrieved successfully', result);
    } catch (error) {
      console.error('Hospital revenue error:', error);
      return ResponseUtil.serverError('Failed to compute hospital revenue');
    }
  }

  /** Comparison across a set of hospitals — used by the Regional Officer. */
  async compareHospitals(hospitalIds: string[], from?: string, to?: string) {
    try {
      const bills = this.inRange(this.billsStore.load(), from, to);
      const hospitals = this.hospitalsStore.load();

      const rows = hospitalIds.map(id => {
        const hospital = hospitals.find(h => h.id === id);
        const own = bills.filter(b => b.hospitalId === id);
        const paid = own.filter(b => this.isPaid(b));
        return {
          hospitalId: id,
          hospitalName: hospital ? hospital.name : id,
          collected: this.round(this.sum(paid, b => b.total)),
          outstanding: this.round(this.sum(own.filter(b => !this.isPaid(b)), b => b.total)),
          billsIssued: own.length,
          collectionRate: own.length ? this.round((paid.length / own.length) * 100) : 0,
        };
      });

      rows.sort((a, b) => b.collected - a.collected);
      return ResponseUtil.success('Hospital revenue comparison retrieved successfully', rows);
    } catch {
      return ResponseUtil.serverError('Failed to compare hospital revenue');
    }
  }

  // ── Multi-stream platform revenue ─────────────────────────────────────────

  /**
   * The full income statement — every way NexCare makes money, not just the
   * hospital licence.
   *
   * `getPlatformOverview` above answers "what do our hospital customers pay us".
   * This answers "what does the business earn", which now includes the doctor
   * listing ladder, patient memberships, and the per-transaction fees. Recurring
   * lines are quoted per month; usage lines are whatever actually happened in
   * the requested window.
   */
  async getPlatformStreams(from?: string, to?: string) {
    try {
      const streams = this.computeStreams(from, to);
      const total = this.round(this.sum(streams, s => s.amount));

      for (const line of streams) {
        line.share = total > 0 ? this.round((line.amount / total) * 100) : 0;
      }
      streams.sort((a, b) => b.amount - a.amount);

      const recurringRevenue = this.round(
        this.sum(streams.filter(s => s.type === 'recurring'), s => s.amount),
      );
      const usageRevenue = this.round(total - recurringRevenue);

      const byPayer = (['hospital', 'doctor', 'patient'] as const).map(payer => {
        const amount = this.round(this.sum(streams.filter(s => s.payer === payer), s => s.amount));
        return { payer, amount, share: total > 0 ? this.round((amount / total) * 100) : 0 };
      });

      const users = this.usersStore.load();
      const hospitals = this.subsStore.load().filter(s => s.status === 'active').length;
      const doctors = users.filter(u => u.role === 'doctor' && u.status !== 'Inactive').length;
      const patients = users.filter(u => u.role === 'patient').length;

      const overview: PlatformStreamsOverview = {
        currency: '₹',
        periodFrom: from || null,
        periodTo: to || null,
        totalRevenue: total,
        recurringRevenue,
        usageRevenue,
        byStream: streams,
        byPayer,
        unitEconomics: {
          hospitals,
          doctors,
          patients,
          revenuePerHospital: hospitals ? this.round(this.payerTotal(streams, 'hospital') / hospitals) : 0,
          revenuePerDoctor: doctors ? this.round(this.payerTotal(streams, 'doctor') / doctors) : 0,
          revenuePerPatient: patients ? this.round(this.payerTotal(streams, 'patient') / patients) : 0,
          recurringShare: total > 0 ? this.round((recurringRevenue / total) * 100) : 0,
        },
      };

      return ResponseUtil.success('Platform revenue streams retrieved successfully', overview);
    } catch (error) {
      console.error('Platform streams error:', error);
      return ResponseUtil.serverError('Failed to compute platform revenue streams');
    }
  }

  /**
   * Every stream, computed from the source records. Kept as one method so the
   * eight lines are visibly built from the same inputs and cannot disagree with
   * each other about what happened in the period.
   */
  private computeStreams(from?: string, to?: string): RevenueStreamLine[] {
    const fees = this.pricing.loadFeeConfig();
    const hospitalPlans = new Map(this.plansStore.load().map(p => [p.id, p]));
    const hospitalSubs = this.subsStore.load().filter(s => s.status === 'active');
    const bills = this.inRange(this.billsStore.load(), from, to);
    const paidBills = bills.filter(b => this.isPaid(b));

    // ── 1 + 2: the hospital licence ───────────────────────────────────────
    let hospitalRecurring = 0;
    let hospitalCommission = 0;
    for (const sub of hospitalSubs) {
      const plan = hospitalPlans.get(sub.planId);
      if (!plan) continue;
      const extraBeds = Math.max(0, (sub.contractedBeds || 0) - plan.includedBeds);
      hospitalRecurring += plan.monthlyFee + extraBeds * plan.perExtraBedFee;
      const collections = this.sum(
        paidBills.filter(b => b.hospitalId === sub.hospitalId),
        b => b.total,
      );
      hospitalCommission += collections * plan.commissionRate;
    }

    // ── 3 + 4: the doctor listing ladder ──────────────────────────────────
    const doctorPlans = new Map(this.pricing.loadDoctorPlans().map(p => [p.id, p]));
    const doctorSubs = this.doctorSubscriptionsForAllDoctors();
    const appointments = this.inRange(this.appointmentsStore.load(), from, to);
    const completed = appointments.filter(a => String(a.status || '').toLowerCase() === 'completed');

    let doctorRecurring = 0;
    for (const sub of doctorSubs) {
      if (sub.status !== 'active') continue;
      doctorRecurring += doctorPlans.get(sub.planId)?.monthlyFee || 0;
    }

    let doctorCommission = 0;
    for (const appt of completed) {
      const sub = this.subscriptionForAppointment(appt, doctorSubs);
      const plan = sub ? doctorPlans.get(sub.planId) : null;
      if (!plan) continue;
      // The appointment's own fee is authoritative — it is what the patient was
      // quoted. The subscription's consultationFee is only the fallback for
      // rows booked before per-appointment fees were captured.
      const base = Number(appt.fee) > 0 ? Number(appt.fee) : sub!.consultationFee;
      doctorCommission += base * plan.commissionRate;
    }

    // ── 5 + 6: the patient side ───────────────────────────────────────────
    const patientPlans = new Map(this.pricing.loadPatientPlans().map(p => [p.id, p]));
    const patientSubs = this.pricing.loadPatientSubscriptions().filter(s => s.status === 'active');
    const membershipRevenue = this.sum(
      patientSubs,
      s => patientPlans.get(s.planId)?.monthlyFee || 0,
    );

    const waivedPatientIds = new Set(
      patientSubs
        .filter(s => patientPlans.get(s.planId)?.waivesBookingFee)
        .map(s => s.patientId),
    );
    const chargeableBookings = appointments.filter(
      a => !waivedPatientIds.has(a.patientId) &&
           String(a.status || '').toLowerCase() !== 'cancelled',
    );
    const bookingFeeRevenue = chargeableBookings.length * fees.patientBookingFee;

    // ── 7: ambulance dispatch ─────────────────────────────────────────────
    const trips = this.inRange(this.ambulanceStore.load(), from, to).filter(
      t => String(t.status || '').toLowerCase() === 'completed',
    );
    const ambulanceRevenue = this.sum(trips, t => {
      const plan = patientPlans.get(
        patientSubs.find(s => s.patientId === t.patientId)?.planId || '',
      );
      const discount = plan?.ambulanceDiscount || 0;
      return fees.ambulanceDispatchFee * (1 - discount);
    });

    // ── 8: payment gateway ────────────────────────────────────────────────
    const gatewayVolume = this.sum(paidBills, b => b.total);
    const gatewayRevenue = gatewayVolume * fees.paymentGatewayRate;

    return [
      {
        key: 'hospital_subscription',
        label: 'Hospital SaaS subscriptions',
        payer: 'hospital', type: 'recurring',
        amount: this.round(hospitalRecurring), share: 0,
        units: hospitalSubs.length, unitLabel: 'hospitals',
        basis: 'Plan base fee plus a per-bed charge for beds above the plan allowance.',
      },
      {
        key: 'hospital_commission',
        label: 'Commission on hospital collections',
        payer: 'hospital', type: 'usage',
        amount: this.round(hospitalCommission), share: 0,
        units: paidBills.length, unitLabel: 'bills settled',
        basis: 'A percentage of what each hospital collected through NexCare billing.',
      },
      {
        key: 'doctor_subscription',
        label: 'Doctor listing subscriptions',
        payer: 'doctor', type: 'recurring',
        amount: this.round(doctorRecurring), share: 0,
        units: doctorSubs.filter(s => s.status === 'active').length, unitLabel: 'doctors listed',
        basis: 'Monthly listing fee for Verified and Featured practitioners. The free tier pays nothing here.',
      },
      {
        key: 'doctor_commission',
        label: 'Commission on consultations',
        payer: 'doctor', type: 'usage',
        amount: this.round(doctorCommission), share: 0,
        units: completed.length, unitLabel: 'consultations completed',
        basis: 'A share of each consultation fee, taken only when the appointment is completed. The free tier pays the highest rate.',
      },
      {
        key: 'patient_membership',
        label: 'Care+ patient memberships',
        payer: 'patient', type: 'recurring',
        amount: this.round(membershipRevenue), share: 0,
        units: patientSubs.length, unitLabel: 'members',
        basis: 'Monthly membership that waives booking fees and discounts ambulance dispatch.',
      },
      {
        key: 'patient_booking_fee',
        label: 'Booking convenience fee',
        payer: 'patient', type: 'usage',
        amount: this.round(bookingFeeRevenue), share: 0,
        units: chargeableBookings.length, unitLabel: 'bookings charged',
        basis: `${fees.currency}${fees.patientBookingFee} per appointment booked, waived for Care+ members.`,
      },
      {
        key: 'ambulance_dispatch_fee',
        label: 'Ambulance dispatch fee',
        payer: 'patient', type: 'usage',
        amount: this.round(ambulanceRevenue), share: 0,
        units: trips.length, unitLabel: 'trips completed',
        basis: `${fees.currency}${fees.ambulanceDispatchFee} per completed dispatch, discounted for Care+ members.`,
      },
      {
        key: 'payment_gateway_fee',
        label: 'Payment processing',
        payer: 'hospital', type: 'usage',
        amount: this.round(gatewayRevenue), share: 0,
        units: paidBills.length, unitLabel: 'payments processed',
        basis: `${this.round(fees.paymentGatewayRate * 100)}% of every bill settled through NexCare.`,
      },
    ];
  }

  private payerTotal(streams: RevenueStreamLine[], payer: string): number {
    return this.sum(streams.filter(s => s.payer === payer), s => s.amount);
  }

  // ── Doctor earnings ───────────────────────────────────────────────────────

  /**
   * A doctor's own statement: what they earned, what NexCare took, and whether
   * a different tier would cost them less at their current booking volume.
   */
  async getDoctorEarnings(doctorId: string, from?: string, to?: string) {
    try {
      const doctor = this.usersStore.load().find(u => u.id === doctorId && u.role === 'doctor');
      if (!doctor) return ResponseUtil.notFound('Doctor', doctorId);

      const sub = this.pricing.ensureDoctorSubscription({
        id: doctor.id,
        name: doctor.name,
        hospitalId: doctor.hospitalId,
      });
      const plans = this.pricing.loadDoctorPlans();
      const plan = plans.find(p => p.id === sub.planId) || plans[0];

      const mine = this.inRange(this.appointmentsStore.load(), from, to)
        .filter(a => this.appointmentBelongsToDoctor(a, doctor));

      const statusIs = (a: any, s: string) => String(a.status || '').toLowerCase() === s;
      const completed = mine.filter(a => statusIs(a, 'completed'));
      const cancelled = mine.filter(a => statusIs(a, 'cancelled'));

      const feeOf = (a: any) => (Number(a.fee) > 0 ? Number(a.fee) : sub.consultationFee);
      const grossEarnings = this.round(this.sum(completed, feeOf));
      const platformCommission = this.round(grossEarnings * plan.commissionRate);
      const platformListingFee = sub.status === 'active' ? plan.monthlyFee : 0;

      const byMonth = this.monthKeys(6).map(({ key, label }) => {
        const monthly = completed.filter(a => this.monthKeyOf(a) === key);
        const gross = this.round(this.sum(monthly, feeOf));
        return {
          month: label,
          completed: monthly.length,
          gross,
          net: this.round(gross - gross * plan.commissionRate - platformListingFee),
        };
      });

      // Would another tier cost this doctor less at this volume? Compare the
      // full cost of each active plan against the same gross earnings.
      const costOf = (p: typeof plan) => grossEarnings * p.commissionRate + p.monthlyFee;
      const currentCost = costOf(plan);
      const cheaper = plans
        .filter(p => p.status === 'active' && p.id !== plan.id)
        .map(p => ({ plan: p, cost: costOf(p) }))
        .filter(c => c.cost < currentCost - 1)
        .sort((a, b) => a.cost - b.cost)[0];

      const result: DoctorEarnings = {
        doctorId: doctor.id,
        doctorName: doctor.name,
        hospitalId: doctor.hospitalId || '',
        currency: '₹',
        planId: plan.id,
        planName: plan.name,
        consultationFee: sub.consultationFee,
        commissionRate: plan.commissionRate,
        appointmentsBooked: mine.length,
        appointmentsCompleted: completed.length,
        appointmentsCancelled: cancelled.length,
        grossEarnings,
        platformCommission,
        platformListingFee,
        netEarnings: this.round(grossEarnings - platformCommission - platformListingFee),
        byMonth,
        recommendedPlanId: cheaper ? cheaper.plan.id : null,
        recommendationReason: cheaper
          ? `At this volume ${cheaper.plan.name} would cost you ₹${this.round(currentCost - cheaper.cost)} less per cycle.`
          : null,
      };

      return ResponseUtil.success('Doctor earnings retrieved successfully', result);
    } catch (error) {
      console.error('Doctor earnings error:', error);
      return ResponseUtil.serverError('Failed to compute doctor earnings');
    }
  }

  // ── Patient membership ────────────────────────────────────────────────────

  /** What a patient's membership has actually saved them. */
  async getPatientMembership(patientId: string, from?: string, to?: string) {
    try {
      const plan = this.pricing.planForPatient(patientId);
      const sub = this.pricing
        .loadPatientSubscriptions()
        .find(s => s.patientId === patientId && s.status === 'active');
      const fees = this.pricing.loadFeeConfig();

      const bookings = this.inRange(this.appointmentsStore.load(), from, to).filter(
        a => a.patientId === patientId && String(a.status || '').toLowerCase() !== 'cancelled',
      );

      // Months elapsed on the plan, so a one-week-old membership is not charged
      // as if it had run all period.
      const monthsHeld = sub ? Math.max(1, this.monthsSince(sub.startedAt)) : 0;
      const bookingFeesWaived = plan.waivesBookingFee
        ? this.round(bookings.length * fees.patientBookingFee)
        : 0;
      const membershipPaid = this.round(plan.monthlyFee * monthsHeld);

      const result: PatientMembership = {
        patientId,
        currency: '₹',
        planId: plan.id,
        planName: plan.name,
        monthlyFee: plan.monthlyFee,
        status: sub ? sub.status : 'none',
        renewsOn: sub ? sub.renewsOn : null,
        bookingsMade: bookings.length,
        bookingFeesWaived,
        membershipPaid,
        netBenefit: this.round(bookingFeesWaived - membershipPaid),
      };

      return ResponseUtil.success('Patient membership retrieved successfully', result);
    } catch (error) {
      console.error('Patient membership error:', error);
      return ResponseUtil.serverError('Failed to retrieve patient membership');
    }
  }

  // ── Doctor/appointment matching ───────────────────────────────────────────

  /**
   * Every active doctor, with a subscription row materialised if they had none.
   * A doctor nobody enrolled is on the free tier, not absent from the model.
   */
  private doctorSubscriptionsForAllDoctors() {
    const doctors = this.usersStore.load().filter(u => u.role === 'doctor');
    for (const d of doctors) {
      this.pricing.ensureDoctorSubscription({ id: d.id, name: d.name, hospitalId: d.hospitalId });
    }
    const enrolled = new Set(doctors.map(d => d.id));
    return this.pricing.loadDoctorSubscriptions().filter(s => enrolled.has(s.doctorId));
  }

  /**
   * Appointments carry `doctorId` since the doctor portal landed, but older rows
   * only name the consultant. Match on the id when it is there and fall back to
   * the name so historical revenue is not silently dropped.
   */
  private appointmentBelongsToDoctor(appt: any, doctor: any): boolean {
    if (appt.doctorId) return appt.doctorId === doctor.id;
    return this.normaliseName(appt.doctor) === this.normaliseName(doctor.name);
  }

  private subscriptionForAppointment(appt: any, subs: Array<{ doctorId: string; doctorName: string; planId: string; consultationFee: number; status: string }>) {
    if (appt.doctorId) {
      const byId = subs.find(s => s.doctorId === appt.doctorId);
      if (byId) return byId;
    }
    const name = this.normaliseName(appt.doctor);
    return subs.find(s => this.normaliseName(s.doctorName) === name) || null;
  }

  /** "Dr. Sarah Smith" and "dr sarah smith" are the same consultant. */
  private normaliseName(name: any): string {
    return String(name || '')
      .toLowerCase()
      .replace(/^dr\.?\s+/, '')
      .replace(/[^a-z0-9]/g, '');
  }

  private monthKeyOf(row: any): string {
    return String(row?.createdAt || '').slice(0, 7);
  }

  private monthsSince(iso: string): number {
    const start = new Date(iso);
    if (isNaN(start.getTime())) return 1;
    const now = new Date();
    return (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** A bill counts as revenue only once it is actually paid. */
  private isPaid(bill: any): boolean {
    return String(bill?.status || '').toLowerCase() === 'paid';
  }

  private sum<T>(items: T[], pick: (item: T) => number): number {
    return items.reduce((total, item) => total + (pick(item) || 0), 0);
  }

  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private inRange(bills: any[], from?: string, to?: string): any[] {
    if (!from && !to) return bills;
    const start = from ? new Date(from).getTime() : -Infinity;
    const end = to ? new Date(to).getTime() : Infinity;
    return bills.filter(b => {
      const t = new Date(b.createdAt || 0).getTime();
      return !isNaN(t) && t >= start && t <= end;
    });
  }

  /** Last `count` months as { key: 'YYYY-MM', label: 'Mar 2026' }, oldest first. */
  private monthKeys(count: number): Array<{ key: string; label: string }> {
    const out: Array<{ key: string; label: string }> = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      });
    }
    return out;
  }
}
