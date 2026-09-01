import { Controller, Get, Patch, Param, Query, Body, Req, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RevenueService } from './revenue.service';
import { PricingService } from './pricing.service';
import { HealthScoreService } from './health-score.service';
import { HospitalsService } from '../hospitals/hospitals.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';

/**
 * Revenue Controller
 *
 * The two streams have deliberately different audiences:
 *
 *  - /revenue/platform/*, /revenue/hospital-plans and /revenue/fees are
 *    NexCare's OWN commercials — superuser only. No hospital sees what the
 *    platform earns across every customer.
 *  - /revenue/hospital/:id is a hospital's own collections, plus what that one
 *    hospital owes NexCare. Its manager, the regional officer over it, and its
 *    administrative staff may read it; each is checked against the hospital
 *    they actually belong to.
 *
 * Doctor billing routes were removed on 2026-09-01. Doctors are hospital staff,
 * not customers: the hospital's staff-count subscription covers their seat, so
 * there is no listing tier to read and no commission to charge.
 */
@ApiTags('Revenue')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.SUPERUSER)
@Controller('revenue')
export class RevenueController {
  constructor(
    private readonly revenueService: RevenueService,
    private readonly pricingService: PricingService,
    private readonly healthScoreService: HealthScoreService,
    private readonly hospitalsService: HospitalsService,
  ) {}


  // ── Platform revenue — Admin only (inherits the class-level @Roles) ───────

  @Get('platform/overview')
  @ApiOperation({ summary: 'Platform revenue overview — MRR, ARR, subscriptions, per-hospital breakdown' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiResponse({ status: 200, description: 'Platform revenue overview' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async platformOverview(@Query('from') from?: string, @Query('to') to?: string) {
    return this.revenueService.getPlatformOverview(from, to);
  }

  @Get('platform/trend')
  @ApiOperation({ summary: 'Month-by-month platform revenue' })
  @ApiQuery({ name: 'months', required: false })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 200, description: 'Success' })
  async platformTrend(@Query('months') months?: string) {
    const n = Number(months);
    return this.revenueService.getPlatformTrend(Number.isFinite(n) && n > 0 ? Math.min(n, 24) : 6);
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 200, description: 'Success' })
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 200, description: 'Success' })
  async compareMyHospitals(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const ids = await this.hospitalIdsFor(req.user);
    return this.revenueService.compareHospitals(ids, from, to);
  }

  @Roles(UserRole.SUPERUSER, UserRole.REGIONAL_MANAGER)
  @Get('health-score/:hospitalId')
  @ApiOperation({ summary: 'Internal NexCare health score combining bed use, revenue, no-shows, renewal and seat pressure' })
  async getHealthScore(
    @Req() req: any,
    @Param('hospitalId') hospitalId: string,
  ) {
    await this.assertMayReadHospital(req.user, hospitalId);
    return this.healthScoreService.getHospitalHealthScore(hospitalId);
  }


  // ── Multi-stream roll-up and pricing controls — Admin only ───────────────

  @Get('platform/streams')
  @ApiOperation({
    summary: 'Every revenue stream — hospital subscriptions, patient memberships and per-transaction fees',
  })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 200, description: 'Success' })
  async platformStreams(@Query('from') from?: string, @Query('to') to?: string) {
    return this.revenueService.getPlatformStreams(from, to);
  }

  @Get('regional-officers')
  @ApiOperation({
    summary: 'Revenue and operational data per regional officer, plus an unassigned-hospitals bucket',
  })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 200, description: 'Success' })
  async regionalOfficerOverview(@Query('from') from?: string, @Query('to') to?: string) {
    return this.revenueService.getRegionalOfficerOverview(from, to);
  }

  @Get('fees')
  @ApiOperation({ summary: 'The cross-cutting fee rates (booking, ambulance, gateway, seats, notifications)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 200, description: 'Success' })
  async findFees() {
    return this.pricingService.findFeeConfig();
  }

  @Patch('fees')
  @ApiOperation({ summary: 'Reprice the cross-cutting fees' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  @ApiResponse({ status: 200, description: 'Success' })
  async updateFees(@Req() req: any, @Body() body: any) {
    return this.pricingService.updateFeeConfig(body, req.user?.id);
  }

  @Patch('hospital-plans/:id')
  @ApiOperation({ summary: 'Reprice a hospital subscription plan' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  @ApiResponse({ status: 200, description: 'Success' })
  async updateHospitalPlan(@Param('id') id: string, @Body() body: any) {
    return this.pricingService.updateHospitalPlan(id, body);
  }

  @Patch('patient-plans/:id')
  @ApiOperation({ summary: 'Reprice a patient membership tier' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  @ApiResponse({ status: 200, description: 'Success' })
  async updatePatientPlan(@Param('id') id: string, @Body() body: any) {
    return this.pricingService.updatePatientPlan(id, body);
  }

  @Get('hospital-subscriptions')
  @ApiOperation({ summary: 'Which subscription plan every hospital is on' })
  @ApiQuery({ name: 'hospitalId', required: false })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 200, description: 'Success' })
  async findHospitalSubscriptions(@Query('hospitalId') hospitalId?: string) {
    return this.pricingService.findHospitalSubscriptions(hospitalId);
  }

  @Get('patient-subscriptions')
  @ApiOperation({ summary: 'Every active patient membership' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 200, description: 'Success' })
  async findPatientSubscriptions() {
    return this.pricingService.findPatientSubscriptions();
  }

  // ── Plan catalogues — readable by the people who buy them ────────────────

  @Roles(UserRole.SUPERUSER, UserRole.HOSPITAL_MANAGER, UserRole.REGIONAL_MANAGER)
  @Get('hospital-plans')
  @ApiOperation({ summary: 'The hospital subscription plans on offer, priced by staff headcount' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 200, description: 'Success' })
  async findHospitalPlans() {
    return this.pricingService.findHospitalPlans();
  }

  @Roles(UserRole.SUPERUSER, UserRole.PATIENT, UserRole.ADMINISTRATIVE_STAFF)
  @Get('patient-plans')
  @ApiOperation({ summary: 'The patient membership tiers on offer' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 200, description: 'Success' })
  async findPatientPlans() {
    return this.pricingService.findPatientPlans();
  }

  // ── A doctor's own statement — informational, never a bill ───────────────

  @Roles(UserRole.DOCTOR)
  @Get('doctor/me')
  @ApiOperation({ summary: 'The signed-in doctor’s own consultation revenue' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 200, description: 'Success' })
  async myDoctorEarnings(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.revenueService.getDoctorEarnings(req.user.id, from, to);
  }

  /**
   * A doctor sets their own consultation fee — the one price in the system
   * NexCare does not set. It is the hospital's money, not the platform's;
   * nothing is taken out of it.
   */
  @Roles(UserRole.DOCTOR)
  @Patch('doctor/me/consultation-fee')
  @ApiOperation({ summary: 'Change your own consultation fee' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  @ApiResponse({ status: 200, description: 'Success' })
  async updateMyConsultationFee(@Req() req: any, @Body() body: { consultationFee?: number }) {
    if (typeof body?.consultationFee !== 'number') {
      throw new BadRequestException('consultationFee is required');
    }
    return this.pricingService.setDoctorConsultationFee(req.user.id, body.consultationFee);
  }

  @Roles(UserRole.SUPERUSER, UserRole.HOSPITAL_MANAGER, UserRole.REGIONAL_MANAGER)
  @Patch('hospital-subscriptions/:hospitalId')
  @ApiOperation({ summary: 'Move a hospital onto a different plan, or suspend it' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  @ApiResponse({ status: 200, description: 'Success' })
  async updateHospitalSubscription(
    @Req() req: any,
    @Param('hospitalId') hospitalId: string,
    @Body() body: { planId?: string; status?: string },
  ) {
    await this.assertMayReadHospital(req.user, hospitalId);
    return this.pricingService.updateHospitalSubscription(hospitalId, body);
  }

  @Roles(UserRole.SUPERUSER, UserRole.HOSPITAL_MANAGER, UserRole.REGIONAL_MANAGER)
  @Get('doctor/:doctorId')
  @ApiOperation({ summary: 'One doctor’s consultation revenue' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 200, description: 'Success' })
  async doctorEarnings(
    @Param('doctorId') doctorId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.revenueService.getDoctorEarnings(doctorId, from, to);
  }

  // ── A patient's own membership ───────────────────────────────────────────

  @Roles(UserRole.PATIENT)
  @Get('patient/me/membership')
  @ApiOperation({ summary: 'Your membership, and what it has saved you' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 200, description: 'Success' })
  async myMembership(@Req() req: any) {
    return this.revenueService.getPatientMembership(this.patientKey(req.user));
  }

  @Roles(UserRole.PATIENT)
  @Patch('patient/me/membership')
  @ApiOperation({ summary: 'Join, switch or cancel a Care+ membership' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  @ApiResponse({ status: 200, description: 'Success' })
  async setMyMembership(@Req() req: any, @Body() body: { planId: string }) {
    if (!body?.planId) {
      throw new BadRequestException('planId is required');
    }
    return this.pricingService.setPatientSubscription(
      this.patientKey(req.user),
      req.user.name,
      body.planId,
    );
  }

  /**
   * Appointments and bills are keyed on the patient record id (P001), not the
   * login account id (U020), so memberships are keyed the same way — otherwise
   * a member's own bookings would never match their waiver.
   */
  private patientKey(user: any): string {
    return user?.patientId || user?.id;
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
