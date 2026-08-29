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
