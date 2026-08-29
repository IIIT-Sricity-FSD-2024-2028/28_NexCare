import { Controller, Get, Patch, Param, Query, Body, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RevenueService } from './revenue.service';
import { HospitalsService } from '../hospitals/hospitals.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';

/**
 * Revenue Controller
 *
 * The two streams have deliberately different audiences:
 *
 *  - /revenue/platform/* and /revenue/plans|subscriptions are NexCare's OWN
 *    commercials — superuser only. No hospital sees what the platform earns.
 *  - /revenue/hospital/:id is a hospital's own collections. Its manager, the
 *    regional officer over it, and its administrative staff may read it; each is
 *    checked against the hospital they actually belong to.
 */
@ApiTags('Revenue')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.SUPERUSER)
@Controller('revenue')
export class RevenueController {
  constructor(
    private readonly revenueService: RevenueService,
    private readonly hospitalsService: HospitalsService,
  ) {}

  // ── Platform revenue — Admin only (inherits the class-level @Roles) ───────

  @Get('platform/overview')
  @ApiOperation({ summary: 'Platform revenue overview — MRR, ARR, commission, per-hospital breakdown' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiResponse({ status: 200, description: 'Platform revenue overview' })
  async platformOverview(@Query('from') from?: string, @Query('to') to?: string) {
    return this.revenueService.getPlatformOverview(from, to);
  }

  @Get('platform/trend')
  @ApiOperation({ summary: 'Month-by-month platform revenue' })
  @ApiQuery({ name: 'months', required: false })
  async platformTrend(@Query('months') months?: string) {
    const n = Number(months);
    return this.revenueService.getPlatformTrend(Number.isFinite(n) && n > 0 ? Math.min(n, 24) : 6);
  }

  @Get('plans')
  @ApiOperation({ summary: 'List subscription plans' })
  async findPlans() {
    return this.revenueService.findPlans();
  }

  @Patch('plans/:id')
  @ApiOperation({ summary: 'Update a subscription plan’s pricing' })
  async updatePlan(@Param('id') id: string, @Body() body: any) {
    return this.revenueService.updatePlan(id, body);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'List hospital subscriptions' })
  async findSubscriptions() {
    return this.revenueService.findSubscriptions();
  }

  @Patch('subscriptions/:hospitalId')
  @ApiOperation({ summary: 'Move a hospital onto a different plan, or change its status' })
  async updateSubscription(
    @Param('hospitalId') hospitalId: string,
    @Body() body: { planId?: string; status?: string },
  ) {
    return this.revenueService.updateSubscription(hospitalId, body);
  }

  // ── Hospital operational revenue — scoped per caller ─────────────────────

  @Roles(
    UserRole.SUPERUSER,
    UserRole.REGIONAL_MANAGER,
    UserRole.HOSPITAL_MANAGER,
    UserRole.ADMINISTRATIVE_STAFF,
  )
  @Get('hospital/:hospitalId')
  @ApiOperation({ summary: 'A single hospital’s collections, outstanding and department split' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async hospitalRevenue(
    @Req() req: any,
    @Param('hospitalId') hospitalId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    await this.assertMayReadHospital(req.user, hospitalId);
    return this.revenueService.getHospitalRevenue(hospitalId, from, to);
  }

  /**
   * Comparison across the caller's own hospitals. A regional officer gets the
   * ones assigned to them; a superuser gets every hospital.
   */
  @Roles(UserRole.SUPERUSER, UserRole.REGIONAL_MANAGER)
  @Get('my-hospitals/compare')
  @ApiOperation({ summary: 'Compare revenue across the hospitals the caller oversees' })
  async compareMyHospitals(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const ids = await this.hospitalIdsFor(req.user);
    return this.revenueService.compareHospitals(ids, from, to);
  }

  // ── Scoping helpers ───────────────────────────────────────────────────────

  /** Hospitals this user is entitled to see revenue for. */
  private async hospitalIdsFor(user: any): Promise<string[]> {
    const res: any = await this.hospitalsService.findAll();
    const all = res?.data || [];

    if (user?.role === UserRole.SUPERUSER) {
      return all.map((h: any) => h.id);
    }
    if (user?.role === UserRole.REGIONAL_MANAGER) {
      return all.filter((h: any) => h.assignedManagerId === user.id).map((h: any) => h.id);
    }
    // Hospital manager and administrative staff are pinned to their own hospital.
    return user?.hospitalId ? [user.hospitalId] : [];
  }

  private async assertMayReadHospital(user: any, hospitalId: string): Promise<void> {
    const allowed = await this.hospitalIdsFor(user);
    if (!allowed.includes(hospitalId)) {
      throw new ForbiddenException(
        `Access denied. ${hospitalId} is not one of the hospitals you oversee.`,
      );
    }
  }
}
