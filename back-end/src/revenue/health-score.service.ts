import { Injectable, NotFoundException } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { TenantScopedRepository } from '../common/utils/tenant-scoped.repository';
import { PricingService } from './pricing.service';
import { BillStatus } from '../billing/interfaces/billing.interface';

@Injectable()
export class HealthScoreService {
  private readonly billRepo = new TenantScopedRepository<any>('bills.json');
  private readonly appointmentRepo = new TenantScopedRepository<any>('appointments.json');
  private readonly bedRepo = new TenantScopedRepository<any>('beds.json');

  constructor(private readonly pricingService: PricingService) {}

  /**
   * Calculate a 0-100 Health Score for a hospital and return internal flags.
   * This combines bed utilization, billing volume, no-show rate, and contract expiry.
   */
  async getHospitalHealthScore(hospitalId: string) {
    const bills = this.billRepo.findAll(hospitalId);
    const appointments = this.appointmentRepo.findAll(hospitalId);
    const beds = this.bedRepo.findAll(hospitalId);

    // 1. Bed Utilization (0-100)
    let bedUtilization = 0;
    if (beds.length > 0) {
      const occupied = beds.filter(b => b.status === 'occupied').length;
      bedUtilization = (occupied / beds.length) * 100;
    }

    // 2. Billing Volume (Monthly trajectory)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentBills = bills.filter(b => new Date(b.date) >= thirtyDaysAgo);
    const recentRevenue = recentBills
      .filter(b => b.status === BillStatus.PAID)
      .reduce((sum, b) => sum + b.total, 0);

    // 3. No-Show Rate (0-100)
    let noShowRate = 0;
    const recentAppointments = appointments.filter(a => new Date(a.date) >= thirtyDaysAgo);
    if (recentAppointments.length > 0) {
      const noShows = recentAppointments.filter(a => a.status === 'no_show').length;
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
