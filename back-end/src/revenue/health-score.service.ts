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
   * This combines bed utilization, billing volume, no-show rate, and contract expiry.
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

    // 4. Contract Expiration
    const contracts = this.pricingService.loadHospitalContracts();
    const contract = contracts.find(c => c.hospitalId === hospitalId && c.status === 'active');
    
    let daysToExpiry = 999;
    if (contract?.contractEndDate) {
      const end = new Date(contract.contractEndDate);
      daysToExpiry = Math.max(0, Math.floor((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    }

    // Aggregate Score Calculation (Higher is better)
    // Base 100
    // - High no-show rate penalises up to 30 points
    // - Low bed utilization penalises up to 20 points
    // - Contract expiring < 30 days penalises 20 points
    let score = 100;
    score -= Math.min(30, noShowRate); // No-show penalty
    if (bedUtilization < 30) score -= 15; // Low utilization penalty
    if (daysToExpiry < 30) score -= 20; // Renewal risk

    score = Math.max(0, Math.round(score));

    // Internal Flags
    const upgradeRecommended = bedUtilization > 85;
    const churnRisk = score < 40 || daysToExpiry < 15;

    return ResponseUtil.success('Hospital health score retrieved', {
      hospitalId,
      score,
      metrics: {
        bedUtilization: Math.round(bedUtilization),
        recentRevenue,
        noShowRate: Math.round(noShowRate),
        daysToExpiry,
      },
      flags: {
        upgradeRecommended,
        churnRisk,
      },
    });
  }
}
