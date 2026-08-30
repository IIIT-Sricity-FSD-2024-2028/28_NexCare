import { Controller, Get, Patch, Param, Query, Body, Req, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RevenueService } from './revenue.service';
import { PricingService } from './pricing.service';
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
    private readonly pricingService: PricingService,
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

  // Hospital subscription plans were removed on 2026-08-30. What a hospital
  // pays is now transactional and lives in the platform fee config, so
  // /revenue/plans and /revenue/subscriptions no longer exist.

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

  // ── Multi-stream roll-up and pricing controls — Admin only ───────────────

  @Get('platform/streams')
  @ApiOperation({
    summary: 'Every revenue stream — hospital licence, doctor listings, patient memberships and per-transaction fees',
  })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async platformStreams(@Query('from') from?: string, @Query('to') to?: string) {
    return this.revenueService.getPlatformStreams(from, to);
  }

  @Get('regional-officers')
  @ApiOperation({
    summary: 'Revenue and operational data per regional officer, plus an unassigned-hospitals bucket',
  })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async regionalOfficerOverview(@Query('from') from?: string, @Query('to') to?: string) {
    return this.revenueService.getRegionalOfficerOverview(from, to);
  }

  @Get('fees')
  @ApiOperation({ summary: 'The cross-cutting fee rates (booking, ambulance, gateway, seats, notifications)' })
  async findFees() {
    return this.pricingService.findFeeConfig();
  }

  @Patch('fees')
  @ApiOperation({ summary: 'Reprice the cross-cutting fees' })
  async updateFees(@Req() req: any, @Body() body: any) {
    return this.pricingService.updateFeeConfig(body, req.user?.id);
  }

  @Patch('doctor-plans/:id')
  @ApiOperation({ summary: 'Reprice a doctor listing tier' })
  async updateDoctorPlan(@Param('id') id: string, @Body() body: any) {
    return this.pricingService.updateDoctorPlan(id, body);
  }

  @Patch('patient-plans/:id')
  @ApiOperation({ summary: 'Reprice a patient membership tier' })
  async updatePatientPlan(@Param('id') id: string, @Body() body: any) {
    return this.pricingService.updatePatientPlan(id, body);
  }

  @Get('doctor-subscriptions')
  @ApiOperation({ summary: 'Which listing tier every doctor is on' })
  @ApiQuery({ name: 'doctorId', required: false })
  async findDoctorSubscriptions(@Query('doctorId') doctorId?: string) {
    return this.pricingService.findDoctorSubscriptions(doctorId);
  }

  @Get('patient-subscriptions')
  @ApiOperation({ summary: 'Every active patient membership' })
  async findPatientSubscriptions() {
    return this.pricingService.findPatientSubscriptions();
  }

  // ── Plan catalogues — readable by the people who buy them ────────────────

  @Roles(UserRole.SUPERUSER, UserRole.DOCTOR, UserRole.HOSPITAL_MANAGER, UserRole.ADMINISTRATIVE_STAFF)
  @Get('doctor-plans')
  @ApiOperation({ summary: 'The doctor listing tiers on offer' })
  async findDoctorPlans() {
    return this.pricingService.findDoctorPlans();
  }

  @Roles(UserRole.SUPERUSER, UserRole.PATIENT, UserRole.ADMINISTRATIVE_STAFF)
  @Get('patient-plans')
  @ApiOperation({ summary: 'The patient membership tiers on offer' })
  async findPatientPlans() {
    return this.pricingService.findPatientPlans();
  }

  // ── A doctor's own statement ─────────────────────────────────────────────

  @Roles(UserRole.DOCTOR)
  @Get('doctor/me')
  @ApiOperation({ summary: 'The signed-in doctor’s own earnings and platform charges' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async myDoctorEarnings(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.revenueService.getDoctorEarnings(req.user.id, from, to);
  }

  @Roles(UserRole.DOCTOR)
  @Get('doctor/me/subscription')
  @ApiOperation({ summary: 'The signed-in doctor’s listing tier' })
  async myDoctorSubscription(@Req() req: any) {
    return this.pricingService.findDoctorSubscriptions(req.user.id);
  }

  /**
   * A doctor may change their own tier and consultation fee — that is the
   * self-serve upgrade path. Everything else about the subscription is ours.
   */
  @Roles(UserRole.DOCTOR)
  @Patch('doctor/me/subscription')
  @ApiOperation({ summary: 'Change your own listing tier or consultation fee' })
  async updateMyDoctorSubscription(
    @Req() req: any,
    @Body() body: { planId?: string; consultationFee?: number },
  ) {
    return this.pricingService.updateDoctorSubscription(req.user.id, {
      planId: body.planId,
      consultationFee: body.consultationFee,
    });
  }

  @Roles(UserRole.SUPERUSER, UserRole.HOSPITAL_MANAGER, UserRole.REGIONAL_MANAGER)
  @Patch('doctor-subscriptions/:doctorId')
  @ApiOperation({ summary: 'Move a doctor onto a different listing tier, or suspend them' })
  async updateDoctorSubscription(
    @Param('doctorId') doctorId: string,
    @Body() body: { planId?: string; status?: string; consultationFee?: number },
  ) {
    return this.pricingService.updateDoctorSubscription(doctorId, body);
  }

  @Roles(UserRole.SUPERUSER, UserRole.HOSPITAL_MANAGER, UserRole.REGIONAL_MANAGER)
  @Get('doctor/:doctorId')
  @ApiOperation({ summary: 'One doctor’s earnings and what the platform took' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
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
  async myMembership(@Req() req: any) {
    return this.revenueService.getPatientMembership(this.patientKey(req.user));
  }

  @Roles(UserRole.PATIENT)
  @Patch('patient/me/membership')
  @ApiOperation({ summary: 'Join, switch or cancel a Care+ membership' })
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
