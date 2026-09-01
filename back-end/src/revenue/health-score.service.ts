import { Injectable, NotFoundException } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { TenantScopedRepository } from '../common/utils/tenant-scoped.repository';
import { PricingService } from './pricing.service';
import { AppointmentStatus, BedStatus, BillStatus } from '../common/interfaces/api-response.interface';

@Injectable()
export class HealthScoreService {
  // The bills collection is data/billing.json — there is no bills.json, and
  // TenantScopedRepository returns [] for a missing file without complaining,
  // so the wrong name here silently zeroed recentRevenue for every hospital.
  private readonly billRepo = new TenantScopedRepository<any>('billing.json');
  private readonly appointmentRepo = new TenantScopedRepository<any>('appointments.json');
  private readonly bedRepo = new TenantScopedRepository<any>('beds.json');
  // The staff directory — the meter the hospital's subscription is priced on.
  private readonly userRepo = new TenantScopedRepository<any>('users.json');

  constructor(private readonly pricingService: PricingService) {}

  /**
   * Date comparison that fails closed on missing or unparseable values.
   * Returns false rather than letting an Invalid Date silently drop (or keep)
   * a record.
   */
  private static isOnOrAfter(value: unknown, cutoff: Date): boolean {
    if (!value) return false;
    const parsed = new Date(value as string);
    return !Number.isNaN(parsed.getTime()) && parsed >= cutoff;
  }

  /**
   * Calculate a 0-100 Health Score for a hospital and return internal flags.
   * This combines bed utilization, billing volume, no-show rate, subscription
   * renewal, and how the hospital sits against its plan's seat allowance.
   */
  async getHospitalHealthScore(hospitalId: string) {
    const bills = this.billRepo.findAll(hospitalId);
    const appointments = this.appointmentRepo.findAll(hospitalId);
    const beds = this.bedRepo.findAll(hospitalId);

    // 1. Bed Utilization (0-100)
    // Read through the same lens as beds.service.getStats(): a critical bed is
    // an occupied bed, and stored statuses are compared case-insensitively so
    // records persisted by older builds ('OCCUPIED') still count.
    let bedUtilization = 0;
    if (beds.length > 0) {
      const occupied = beds.filter(b => {
        const status = String(b.status ?? '').toLowerCase();
        return status === BedStatus.OCCUPIED || status === BedStatus.CRITICAL;
      }).length;
      bedUtilization = (occupied / beds.length) * 100;
    }

    // 2. Billing Volume (Monthly trajectory)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    // Bills carry visitDate (and createdAt); there is no `date` field, and
    // new Date(undefined) is an Invalid Date that fails every comparison, so
    // the 30-day window used to be permanently empty.
    const recentBills = bills.filter(b => HealthScoreService.isOnOrAfter(b.visitDate ?? b.createdAt, thirtyDaysAgo));
    const recentRevenue = recentBills
      .filter(b => b.status === BillStatus.PAID)
      .reduce((sum, b) => sum + b.total, 0);

    // 3. No-Show Rate (0-100)
    let noShowRate = 0;
    // Appointments carry dateLabel ('September 20, 2026'); same Invalid Date
    // problem as the bills above.
    const recentAppointments = appointments.filter(a => HealthScoreService.isOnOrAfter(a.dateLabel ?? a.createdAt, thirtyDaysAgo));
    if (recentAppointments.length > 0) {
      // Compared against the enum, not the string 'no_show' that nothing ever
      // wrote — staff mark a no-show via PATCH /api/appointments/:id/no-show.
      const noShows = recentAppointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length;
      noShowRate = (noShows / recentAppointments.length) * 100;
    }

    // 4. Subscription renewal
    // Hospital subscriptions are billed monthly now, so the date that matters
    // is the next renewal rather than the end of an annual contract.
    const subscription = this.pricingService
      .loadHospitalSubscriptions()
      .find(s => s.hospitalId === hospitalId && s.status === 'active');

    let daysToRenewal = 999;
    if (subscription?.renewsOn) {
      const renews = new Date(subscription.renewsOn);
      if (!Number.isNaN(renews.getTime())) {
        daysToRenewal = Math.max(0, Math.floor((renews.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      }
    }

    // 5. Seat pressure
    // The plan is priced by staff accounts, so a hospital sitting above its
    // allowance is the one that should be moved up a plan. That is a far more
    // direct upgrade signal than bed occupancy, which the plan never priced.
    const plan = this.pricingService
      .loadHospitalPlans()
      .find(p => p.id === subscription?.planId);
    const staffSeats = this.userRepo
      .findAll(hospitalId)
      .filter(u => u.role !== 'patient' && String(u.status ?? '').toLowerCase() !== 'inactive')
      .length;
    const includedSeats = plan?.includedStaffSeats ?? null;
    const seatsOverAllowance = includedSeats === null ? 0 : Math.max(0, staffSeats - includedSeats);

    // Aggregate Score Calculation (Higher is better)
    // Base 100
    // - High no-show rate penalises up to 30 points
    // - Low bed utilization penalises 15 points
    // - Renewal inside 7 days penalises 20 points
    let score = 100;
    score -= Math.min(30, noShowRate); // No-show penalty
    if (bedUtilization < 30) score -= 15; // Low utilization penalty
    if (daysToRenewal < 7) score -= 20; // Renewal risk

    score = Math.max(0, Math.round(score));

    // Internal Flags
    const upgradeRecommended = seatsOverAllowance > 0;
    const churnRisk = score < 40 || !subscription;

    return ResponseUtil.success('Hospital health score retrieved', {
      hospitalId,
      score,
      metrics: {
        bedUtilization: Math.round(bedUtilization),
        recentRevenue,
        noShowRate: Math.round(noShowRate),
        daysToRenewal,
        staffSeats,
        includedSeats,
        seatsOverAllowance,
      },
      flags: {
        upgradeRecommended,
        churnRisk,
      },
    });
  }
}
