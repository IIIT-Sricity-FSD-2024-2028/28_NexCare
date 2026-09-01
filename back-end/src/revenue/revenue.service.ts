import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { FileStore } from '../common/utils/file-store.util';
import {
  HospitalRevenueLine,
  PlatformRevenueOverview,
  HospitalOperationalRevenue,
  RegionalOfficerRollup,
  RegionalOfficerOverview,
} from './interfaces/revenue.interface';
import {
  HospitalPlan,
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
  /**
   * The platform earnings ledger, written by PaymentsService at the moment a
   * fee is charged. Read-only here: reporting must never be able to change
   * what was earned.
   */
  private readonly ledgerStore = new FileStore<any>('platform-transactions.json', () => []);
  // Read-only views of data other modules own.
  private readonly billsStore = new FileStore<any>('billing.json', () => []);
  private readonly hospitalsStore = new FileStore<any>('hospitals.json', () => []);
  private readonly usersStore = new FileStore<any>('users.json', () => []);
  private readonly appointmentsStore = new FileStore<any>('appointments.json', () => []);
  private readonly ambulanceStore = new FileStore<any>('ambulance.json', () => []);
  private readonly bedsStore = new FileStore<any>('beds.json', () => []);

  constructor(private readonly pricing: PricingService) {}

  // ── The ledger ────────────────────────────────────────────────────────────

  /** Ledger rows in the period, optionally for one stream. */
  private ledger(from?: string, to?: string, stream?: string): any[] {
    let rows = this.ledgerStore.load();
    if (stream) rows = rows.filter(r => r.stream === stream);
    if (!from && !to) return rows;
    const start = from ? new Date(from).getTime() : -Infinity;
    const endAt = to ? new Date(to).getTime() : Infinity;
    return rows.filter(r => {
      const t = new Date(r.createdAt || 0).getTime();
      return !isNaN(t) && t >= start && t <= endAt;
    });
  }

  /** What one stream earned in the period, straight from the ledger. */
  private ledgerTotal(rows: any[], stream: string): number {
    return this.sum(rows.filter(r => r.stream === stream), r => r.amount);
  }

  // ── Platform revenue (Admin only) ─────────────────────────────────────────

  async getPlatformOverview(from?: string, to?: string) {
    try {
      const hospitals = this.hospitalsStore.load();
      const bills = this.inRange(this.billsStore.load(), from, to);
      const ledgerRows = this.ledger(from, to);
      const billing = this.hospitalBilling();

      // What a hospital pays is its staff-count subscription plus the fee on
      // processing the payments it actually took. The commission on
      // collections was removed on 2026-09-01 — NexCare no longer takes a
      // share of what a hospital earns, so a busy month and a quiet one cost
      // the hospital the same.
      const byHospital: HospitalRevenueLine[] = hospitals.map(hospital => {
        const own = ledgerRows.filter(r => r.hospitalId === hospital.id);
        const processing = this.ledgerTotal(own, 'payment_gateway_fee');
        const seat = billing.get(hospital.id);
        const subscription = seat ? seat.subscription : 0;
        const collections = this.sum(
          bills.filter(b => b.hospitalId === hospital.id && this.isPaid(b)),
          b => b.total,
        );

        return {
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          status: hospital.verificationStatus || 'unknown',
          planName: seat ? seat.plan.name : '—',
          staffSeats: seat ? seat.staffSeats : 0,
          collections: this.round(collections),
          subscription: this.round(subscription),
          processingFees: this.round(processing),
          platformRevenue: this.round(subscription + processing),
          paymentsProcessed: own.filter(r => r.stream === 'payment_gateway_fee').length,
        };
      })
      .filter(line => line.collections > 0 || line.platformRevenue > 0);

      byHospital.sort((a, b) => b.platformRevenue - a.platformRevenue);

      const subscriptionRevenue = this.round(this.sum(byHospital, l => l.subscription));
      const processingRevenue = this.round(this.sum(byHospital, l => l.processingFees));
      const earningHospitals = byHospital.length;

      // Recurring revenue is the hospital subscriptions plus Care+ memberships.
      const streams = this.computeStreams(from, to);
      const mrr = this.round(
        this.sum(streams.filter(l => l.type === 'recurring'), l => l.amount),
      );

      const overview: PlatformRevenueOverview = {
        currency: '₹',
        mrr,
        arr: this.round(mrr * 12),
        subscriptionRevenue,
        processingRevenue,
        totalRevenue: this.round(this.sum(streams, l => l.amount)),
        earningHospitals,
        totalHospitals: hospitals.length,
        averageRevenuePerHospital: earningHospitals
          ? this.round((subscriptionRevenue + processingRevenue) / earningHospitals)
          : 0,
        gatewayVolume: this.round(this.sum(bills.filter(b => this.isPaid(b)), b => b.total)),
        outstandingReceivables: this.round(this.sum(bills.filter(b => !this.isPaid(b)), b => b.total)),
        byHospital,
      };

      return ResponseUtil.success('Platform revenue overview retrieved successfully', overview);
    } catch (error) {
      console.error('Platform revenue error:', error);
      return ResponseUtil.serverError('Failed to compute platform revenue');
    }
  }

  /**
   * Month-by-month platform revenue, for the trend chart.
   *
   * The transactional line comes from the ledger, so a month shows what was
   * actually earned then — repricing today does not restate history. The
   * recurring line (hospital subscriptions, Care+) is the current run rate,
   * since those are billed per cycle rather than per event.
   */
  async getPlatformTrend(months = 6) {
    try {
      const ledgerRows = this.ledgerStore.load();
      const streams = this.computeStreams();
      const recurring = this.round(
        this.sum(streams.filter(l => l.type === 'recurring'), l => l.amount),
      );
      const subscriptions = this.round(this.streamAmount(streams, 'hospital_subscription'));

      const trend = this.monthKeys(months).map(({ key, label }) => {
        const inMonth = ledgerRows.filter(r => String(r.createdAt || '').slice(0, 7) === key);
        const processing = this.ledgerTotal(inMonth, 'payment_gateway_fee');
        const transactional = this.round(this.sum(inMonth, r => r.amount));

        return {
          month: label,
          recurring,
          subscriptions,
          processing: this.round(processing),
          transactional,
          collections: this.round(this.sum(
            inMonth.filter(r => r.stream === 'payment_gateway_fee'), r => r.gross,
          )),
          total: this.round(recurring + transactional),
        };
      });

      return ResponseUtil.success('Platform revenue trend retrieved successfully', trend);
    } catch (error) {
      console.error('Trend error:', error);
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

      // What this hospital owes NexCare: the staff-count subscription — a fixed,
      // predictable monthly cost — plus the processing fee actually charged on
      // the bills it settled. There is no commission on collections any more,
      // so a good month does not raise the hospital's bill.
      const own = this.ledger(from, to).filter(r => r.hospitalId === hospitalId);
      const processingFees = this.round(this.ledgerTotal(own, 'payment_gateway_fee'));
      const seat = this.hospitalBilling().get(hospitalId);
      const platformCharges: HospitalOperationalRevenue['platformCharges'] = seat
        ? {
            planName: seat.plan.name,
            staffSeats: seat.staffSeats,
            includedSeats: seat.plan.includedStaffSeats,
            baseFee: this.round(seat.plan.monthlyFee),
            extraSeatFee: this.round(seat.extraSeatFee),
            subscription: this.round(seat.subscription),
            processingFees,
            total: this.round(seat.subscription + processingFees),
            paymentsProcessed: own.filter(r => r.stream === 'payment_gateway_fee').length,
          }
        : null;

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

      // Doctors stopped being a payer on 2026-09-01 — they are hospital staff,
      // and the hospital's subscription already covers their seat.
      const byPayer = (['hospital', 'patient'] as const).map(payer => {
        const amount = this.round(this.sum(streams.filter(s => s.payer === payer), s => s.amount));
        return { payer, amount, share: total > 0 ? this.round((amount / total) * 100) : 0 };
      });

      const users = this.usersStore.load();
      const hospitals = this.hospitalsStore.load().length;
      const staffSeats = this.streamUnits(streams, 'hospital_subscription');
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
          staffSeats,
          patients,
          revenuePerHospital: hospitals ? this.round(this.payerTotal(streams, 'hospital') / hospitals) : 0,
          revenuePerStaffSeat: staffSeats
            ? this.round(this.streamAmount(streams, 'hospital_subscription') / staffSeats)
            : 0,
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
   * five lines are visibly built from the same inputs and cannot disagree with
   * each other about what happened in the period.
   *
   * Doctor listing fees and consultation commission were removed on
   * 2026-09-01, as was the commission on hospital collections. What is left is
   * two subscriptions and three small per-transaction fees.
   */
  private computeStreams(from?: string, to?: string): RevenueStreamLine[] {
    const fees = this.pricing.loadFeeConfig();
    const ledgerRows = this.ledger(from, to);
    const appointments = this.inRange(this.appointmentsStore.load(), from, to);

    // ── 1: the hospital subscription ──────────────────────────────────────
    // Priced by staff accounts, which the platform counts for itself out of
    // the user directory — so the figure moves when somebody is actually
    // hired or removed, not when a line in a config file is edited.
    const billing = this.hospitalBilling();
    const hospitalSubscriptions = this.sum([...billing.values()], b => b.subscription);
    const billableSeats = this.sum([...billing.values()], b => b.staffSeats);

    // ── 2: processing the bills a hospital settles ────────────────────────
    // Read from the ledger rather than recomputed, so a rate change today
    // cannot restate what was charged last month.
    const gatewayRevenue = this.ledgerTotal(ledgerRows, 'payment_gateway_fee');
    const settledPayments = ledgerRows.filter(r => r.stream === 'payment_gateway_fee').length;

    // ── 3 + 4: the patient side ───────────────────────────────────────────
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

    // ── 5: ambulance dispatch ─────────────────────────────────────────────
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

    return [
      {
        key: 'hospital_subscription',
        label: 'Hospital platform subscriptions',
        payer: 'hospital', type: 'recurring',
        amount: this.round(hospitalSubscriptions), share: 0,
        units: billableSeats, unitLabel: 'staff accounts billed',
        basis: `A monthly plan per hospital, priced by how many staff accounts it runs. Seats beyond the plan's allowance are ${fees.currency}${fees.extraStaffSeatFee} each.`,
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
        key: 'payment_gateway_fee',
        label: 'Bill payment processing',
        payer: 'hospital', type: 'usage',
        amount: this.round(gatewayRevenue), share: 0,
        units: settledPayments, unitLabel: 'payments processed',
        basis: `${this.round(fees.paymentGatewayRate * 100)}% of every bill payment taken through the NexCare gateway. Nothing is charged on an unpaid bill.`,
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
    ];
  }

  /**
   * What each hospital's subscription costs this cycle, keyed by hospital id.
   *
   * The meter is the hospital's own staff directory: doctors, nurses,
   * administrative staff, ambulance staff and the manager all hold a seat,
   * because they are all employees of the customer. A hospital that grows past
   * the seats its plan includes pays the per-seat rate for the overflow until
   * it moves up a plan — that keeps the plan honest without an upgrade being
   * forced through silently.
   *
   * Computed from ONE pass over the users file: the naive shape re-filters
   * every user for every hospital, which is O(hospitals x users).
   */
  private hospitalBilling(): Map<string, {
    plan: HospitalPlan;
    staffSeats: number;
    extraSeatFee: number;
    subscription: number;
  }> {
    const fees = this.pricing.loadFeeConfig();
    const hospitals = this.hospitalsStore.load();

    const seatsByHospital = new Map<string, number>();
    for (const user of this.usersStore.load()) {
      if (!user.hospitalId || user.role === 'patient') continue;
      if (String(user.status || '').toLowerCase() === 'inactive') continue;
      seatsByHospital.set(user.hospitalId, (seatsByHospital.get(user.hospitalId) || 0) + 1);
    }

    const out = new Map<string, {
      plan: HospitalPlan;
      staffSeats: number;
      extraSeatFee: number;
      subscription: number;
    }>();

    for (const hospital of hospitals) {
      const staffSeats = seatsByHospital.get(hospital.id) || 0;
      const sub = this.pricing.ensureHospitalSubscription(
        { id: hospital.id, name: hospital.name },
        staffSeats,
      );
      if (sub.status !== 'active') continue;

      const plans = this.pricing.loadHospitalPlans();
      const plan = plans.find(p => p.id === sub.planId) || this.pricing.resolveHospitalPlan(staffSeats);
      const included = plan.includedStaffSeats;
      const overflow = included === null ? 0 : Math.max(0, staffSeats - included);
      const extraSeatFee = overflow * fees.extraStaffSeatFee;

      out.set(hospital.id, {
        plan,
        staffSeats,
        extraSeatFee,
        subscription: plan.monthlyFee + extraSeatFee,
      });
    }

    return out;
  }

  /** One stream's amount by its stable machine key. */
  private streamAmount(streams: RevenueStreamLine[], key: string): number {
    return streams.find(s => s.key === key)?.amount || 0;
  }

  private payerTotal(streams: RevenueStreamLine[], payer: string): number {
    return this.sum(streams.filter(s => s.payer === payer), s => s.amount);
  }

  /** One stream's unit count by its stable machine key. */
  private streamUnits(streams: RevenueStreamLine[], key: string): number {
    return streams.find(s => s.key === key)?.units || 0;
  }

  // ── Doctor earnings ───────────────────────────────────────────────────────

  /**
   * A doctor's own statement: the consultation revenue their completed
   * bookings generated.
   *
   * NexCare takes nothing from a doctor as of 2026-09-01 — no listing fee, no
   * commission — so there is no tier to compare and no net figure to compute.
   * A doctor is hospital staff, and the hospital's subscription already covers
   * their seat on the platform. This page exists so a doctor can see their own
   * contribution, not a bill.
   */
  async getDoctorEarnings(doctorId: string, from?: string, to?: string) {
    try {
      const doctor = this.usersStore.load().find(u => u.id === doctorId && u.role === 'doctor');
      if (!doctor) return ResponseUtil.notFound('Doctor', doctorId);

      const consultationFee = Number(doctor.consultationFee) > 0 ? Number(doctor.consultationFee) : 500;

      const mine = this.inRange(this.appointmentsStore.load(), from, to)
        .filter(a => this.appointmentBelongsToDoctor(a, doctor));

      const statusIs = (a: any, s: string) => String(a.status || '').toLowerCase() === s;
      const completed = mine.filter(a => statusIs(a, 'completed'));
      const cancelled = mine.filter(a => statusIs(a, 'cancelled'));

      // The appointment's own fee is authoritative — it is what the patient was
      // quoted. The doctor's current fee is only the fallback for older rows
      // booked before per-appointment fees were captured.
      const feeOf = (a: any) => (Number(a.fee) > 0 ? Number(a.fee) : consultationFee);
      const grossEarnings = this.round(this.sum(completed, feeOf));

      const byMonth = this.monthKeys(6).map(({ key, label }) => {
        const monthly = completed.filter(a => this.monthKeyOf(a) === key);
        return {
          month: label,
          completed: monthly.length,
          gross: this.round(this.sum(monthly, feeOf)),
        };
      });

      const result: DoctorEarnings = {
        doctorId: doctor.id,
        doctorName: doctor.name,
        hospitalId: doctor.hospitalId || '',
        currency: '₹',
        consultationFee,
        appointmentsBooked: mine.length,
        appointmentsCompleted: completed.length,
        appointmentsCancelled: cancelled.length,
        grossEarnings,
        byMonth,
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
   * Appointments carry `doctorId` since the doctor portal landed, but older rows
   * only name the consultant. Match on the id when it is there and fall back to
   * the name so historical revenue is not silently dropped.
   */
  private appointmentBelongsToDoctor(appt: any, doctor: any): boolean {
    if (appt.doctorId) return appt.doctorId === doctor.id;
    return this.normaliseName(appt.doctor) === this.normaliseName(doctor.name);
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

  // ── Revenue and data per regional officer ─────────────────────────────────

  /**
   * The Admin's regional overview: for every regional officer, what their
   * hospitals collect, what NexCare earns from them, and how much there is to
   * look after.
   *
   * Everything is computed from ONE read of each file. The naive shape — loop
   * the officers, and for each one query hospitals/bills/users — turns into
   * O(officers x hospitals x bills) work and a file read per officer. Here the
   * bills and staff are bucketed by hospital once up front, so adding a
   * hundredth officer costs a map lookup rather than another full pass.
   */
  async getRegionalOfficerOverview(from?: string, to?: string) {
    try {
      const users = this.usersStore.load();
      const hospitals = this.hospitalsStore.load();
      const beds = this.bedsStore.load();
      const bills = this.inRange(this.billsStore.load(), from, to);
      const ledgerRows = this.ledger(from, to);

      // ── Bucket everything by hospital, once ──────────────────────────────
      const billsByHospital = this.groupBy(bills, b => b.hospitalId);
      const feesByHospital = this.groupBy(ledgerRows, r => r.hospitalId);
      const staffByHospital = this.groupBy(
        users.filter(u => u.hospitalId && u.role !== 'patient'),
        u => u.hospitalId,
      );
      const bedsByHospital = this.groupBy(beds, b => b.hospitalId);

      // The subscription each hospital pays, so a region's platform revenue is
      // the same figure the Admin overview reports for those hospitals.
      const billing = this.hospitalBilling();

      const officers = users.filter(u => u.role === 'regional_manager');
      const hospitalsByOfficer = this.groupBy(hospitals, h => h.assignedManagerId || 'UNASSIGNED');

      const rows: RegionalOfficerRollup[] = officers.map(officer =>
        this.rollupFor(
          {
            id: officer.id,
            name: officer.name,
            email: officer.email,
            areas: officer.areas || [],
            isAssigned: true,
          },
          hospitalsByOfficer.get(officer.id) || [],
          { billsByHospital, staffByHospital, bedsByHospital, feesByHospital, billing },
        ),
      );

      // Hospitals nobody oversees are a gap in the review chain — surface them.
      const orphans = hospitalsByOfficer.get('UNASSIGNED') || [];
      if (orphans.length) {
        rows.push(
          this.rollupFor(
            {
              id: 'UNASSIGNED',
              name: 'Unassigned hospitals',
              email: '—',
              areas: [],
              isAssigned: false,
            },
            orphans,
            { billsByHospital, staffByHospital, bedsByHospital, feesByHospital, billing },
          ),
        );
      }

      const totalPlatformRevenue = this.sum(rows, r => r.platformRevenue);
      for (const row of rows) {
        row.revenueShare = totalPlatformRevenue > 0
          ? this.round((row.platformRevenue / totalPlatformRevenue) * 100)
          : 0;
      }
      rows.sort((a, b) => b.platformRevenue - a.platformRevenue);

      const overview: RegionalOfficerOverview = {
        currency: '₹',
        officers: rows,
        totals: {
          officers: officers.length,
          hospitals: hospitals.length,
          unassignedHospitals: orphans.length,
          collections: this.round(this.sum(rows, r => r.collections)),
          platformRevenue: this.round(totalPlatformRevenue),
          doctors: this.sum(rows, r => r.doctors),
          staff: this.sum(rows, r => r.staff),
        },
      };

      return ResponseUtil.success(
        'Regional officer revenue overview retrieved successfully',
        overview,
      );
    } catch (error) {
      console.error('Regional officer overview error:', error);
      return ResponseUtil.serverError('Failed to compute the regional officer overview');
    }
  }

  /** One officer's row, built entirely from the pre-bucketed lookups. */
  private rollupFor(
    officer: { id: string; name: string; email: string; areas: string[]; isAssigned: boolean },
    ownHospitals: any[],
    idx: {
      billsByHospital: Map<string, any[]>;
      staffByHospital: Map<string, any[]>;
      bedsByHospital: Map<string, any[]>;
      feesByHospital: Map<string, any[]>;
      billing: Map<string, { subscription: number }>;
    },
  ): RegionalOfficerRollup {
    const byHospital = ownHospitals.map(h => {
      const hospitalBills = idx.billsByHospital.get(h.id) || [];
      const paid = hospitalBills.filter(b => this.isPaid(b));
      const staff = idx.staffByHospital.get(h.id) || [];
      const hospitalBeds = idx.bedsByHospital.get(h.id) || [];

      const collections = this.sum(paid, b => b.total);

      // The subscription plus the ledger rows — the same two figures the
      // platform overview adds up, so the two reports cannot disagree.
      const platformRevenue =
        (idx.billing.get(h.id)?.subscription || 0) +
        this.sum(idx.feesByHospital.get(h.id) || [], r => r.amount);

      return {
        hospitalId: h.id,
        hospitalName: h.name,
        city: h.city || '—',
        verificationStatus: h.verificationStatus || 'unknown',
        collections: this.round(collections),
        outstanding: this.round(this.sum(hospitalBills.filter(b => !this.isPaid(b)), b => b.total)),
        platformRevenue: this.round(platformRevenue),
        doctors: staff.filter(u => u.role === 'doctor').length,
        availableBeds: hospitalBeds.filter(b => b.status === 'available').length,
        totalBeds: hospitalBeds.length,
      };
    });

    byHospital.sort((a, b) => b.platformRevenue - a.platformRevenue);

    const allStaff = ownHospitals.flatMap(h => idx.staffByHospital.get(h.id) || []);
    const billsIssued = ownHospitals.reduce(
      (n, h) => n + (idx.billsByHospital.get(h.id) || []).length, 0,
    );
    const billsPaid = ownHospitals.reduce(
      (n, h) => n + (idx.billsByHospital.get(h.id) || []).filter(b => this.isPaid(b)).length, 0,
    );

    const pendingVerifications = ownHospitals.filter(
      h => h.verificationStatus === 'pending_verification',
    ).length;
    const verifiedHospitals = ownHospitals.filter(h => h.verificationStatus === 'verified').length;

    // Same pressure formula as UsersService.workloadFor — pending reviews weigh
    // more than a settled portfolio. Kept in step deliberately.
    const pressure = pendingVerifications * 3 + ownHospitals.length;
    const workloadLevel: 'low' | 'medium' | 'high' =
      pressure > 15 ? 'high' : pressure > 8 ? 'medium' : 'low';

    const totalBeds = this.sum(byHospital, h => h.totalBeds);
    const availableBeds = this.sum(byHospital, h => h.availableBeds);

    return {
      officerId: officer.id,
      officerName: officer.name,
      officerEmail: officer.email,
      areas: officer.areas,
      isAssigned: officer.isAssigned,

      hospitals: ownHospitals.length,
      pendingVerifications,
      verifiedHospitals,
      workloadLevel,
      doctors: allStaff.filter(u => u.role === 'doctor').length,
      staff: allStaff.filter(u => u.role !== 'doctor').length,
      totalBeds,
      availableBeds,
      occupancyRate: totalBeds ? this.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0,

      collections: this.round(this.sum(byHospital, h => h.collections)),
      outstanding: this.round(this.sum(byHospital, h => h.outstanding)),
      billsIssued,
      collectionRate: billsIssued ? this.round((billsPaid / billsIssued) * 100) : 0,
      platformRevenue: this.round(this.sum(byHospital, h => h.platformRevenue)),
      revenueShare: 0, // filled in by the caller, once the total is known
      revenuePerHospital: ownHospitals.length
        ? this.round(this.sum(byHospital, h => h.platformRevenue) / ownHospitals.length)
        : 0,

      byHospital,
    };
  }

  /** Bucket rows by a key, skipping rows whose key is missing. */
  private groupBy<T>(items: T[], key: (item: T) => string | undefined): Map<string, T[]> {
    const out = new Map<string, T[]>();
    for (const item of items) {
      const k = key(item);
      if (!k) continue;
      const bucket = out.get(k);
      if (bucket) bucket.push(item);
      else out.set(k, [item]);
    }
    return out;
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
