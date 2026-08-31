import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DoctorScheduleService } from './doctor-schedule.service';
import {
  CreateScheduleBlockDto,
  CreateScheduleExceptionDto,
} from './interfaces/schedule.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';

/**
 * Doctor Schedules Controller
 *
 * HTTP surface for the two-layer doctor scheduling model in
 * DoctorScheduleService: recurring weekly availability blocks (layer 1) and
 * date-specific exceptions (layer 2), plus the computed slots that fall out of
 * the two and the atomic slot booking that respects per-slot capacity.
 *
 * The service was implemented and registered but never injected anywhere and
 * had no routes, so the feature did not exist from outside the process. These
 * are those routes.
 *
 * Scoping mirrors SchedulesController: everyone but the superuser is pinned to
 * their own hospital, and the service raises ForbiddenException on a
 * cross-hospital write.
 */
@ApiTags('Schedules')
@ApiBearerAuth('JWT-auth')
@Controller('doctor-schedules')
export class DoctorSchedulesController {
  constructor(private readonly doctorScheduleService: DoctorScheduleService) {}

  /** Hospital to scope to: undefined (all) for superuser, else the user's own. */
  private scopeHospitalId(req: any): string | undefined {
    return req?.user?.role === UserRole.SUPERUSER ? undefined : req?.user?.hospitalId;
  }

  // ── Layer 1: recurring weekly availability ────────────────────────────────

  @Get('blocks')
  @Roles(
    UserRole.SUPERUSER,
    UserRole.HOSPITAL_MANAGER,
    UserRole.ADMINISTRATIVE_STAFF,
    UserRole.DOCTOR,
  )
  @ApiOperation({ summary: "List a doctor's recurring weekly availability blocks" })
  @ApiQuery({ name: 'doctorId', required: false })
  @ApiResponse({ status: 200, description: 'Schedule blocks retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getBlocks(@Req() req: any, @Query('doctorId') doctorId?: string) {
    return this.doctorScheduleService.getBlocks(doctorId, this.scopeHospitalId(req));
  }

  @Post('blocks')
  @Roles(UserRole.SUPERUSER, UserRole.HOSPITAL_MANAGER, UserRole.ADMINISTRATIVE_STAFF)
  @ApiOperation({ summary: 'Create a recurring weekly availability block for a doctor' })
  @ApiResponse({ status: 201, description: 'Schedule block created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — block belongs to another hospital' })
  createBlock(@Req() req: any, @Body() dto: CreateScheduleBlockDto) {
    const scoped = this.scopeHospitalId(req);
    if (scoped && !dto.hospitalId) dto.hospitalId = scoped;
    return this.doctorScheduleService.createBlock(dto, scoped);
  }

  @Delete('blocks/:id')
  @Roles(UserRole.SUPERUSER, UserRole.HOSPITAL_MANAGER, UserRole.ADMINISTRATIVE_STAFF)
  @ApiOperation({ summary: 'Deactivate a recurring availability block' })
  @ApiResponse({ status: 200, description: 'Schedule block deactivated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — block belongs to another hospital' })
  @ApiResponse({ status: 404, description: 'Block not found' })
  deactivateBlock(@Req() req: any, @Param('id') id: string) {
    return this.doctorScheduleService.deactivateBlock(id, this.scopeHospitalId(req));
  }

  // ── Layer 2: date-specific overrides ──────────────────────────────────────

  @Get('exceptions')
  @Roles(
    UserRole.SUPERUSER,
    UserRole.HOSPITAL_MANAGER,
    UserRole.ADMINISTRATIVE_STAFF,
    UserRole.DOCTOR,
  )
  @ApiOperation({ summary: 'List date-specific schedule exceptions' })
  @ApiQuery({ name: 'doctorId', required: false })
  @ApiResponse({ status: 200, description: 'Schedule exceptions retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getExceptions(@Req() req: any, @Query('doctorId') doctorId?: string) {
    return this.doctorScheduleService.getExceptions(doctorId, this.scopeHospitalId(req));
  }

  @Post('exceptions')
  @Roles(UserRole.SUPERUSER, UserRole.HOSPITAL_MANAGER, UserRole.ADMINISTRATIVE_STAFF)
  @ApiOperation({
    summary: 'Create a date-specific exception (BLOCKED, MODIFIED_HOURS or EMERGENCY_HOLD)',
  })
  @ApiResponse({ status: 201, description: 'Schedule exception created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — exception belongs to another hospital' })
  createException(@Req() req: any, @Body() dto: CreateScheduleExceptionDto) {
    const scoped = this.scopeHospitalId(req);
    if (scoped && !dto.hospitalId) dto.hospitalId = scoped;
    return this.doctorScheduleService.createException(dto, scoped);
  }

  @Delete('exceptions/:id')
  @Roles(UserRole.SUPERUSER, UserRole.HOSPITAL_MANAGER, UserRole.ADMINISTRATIVE_STAFF)
  @ApiOperation({ summary: 'Delete a date-specific schedule exception' })
  @ApiResponse({ status: 200, description: 'Schedule exception deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — exception belongs to another hospital' })
  @ApiResponse({ status: 404, description: 'Exception not found' })
  deleteException(@Req() req: any, @Param('id') id: string) {
    return this.doctorScheduleService.deleteException(id, this.scopeHospitalId(req));
  }

  // ── Computed slots and booking ────────────────────────────────────────────

  @Get(':doctorId/slots')
  @Roles(
    UserRole.SUPERUSER,
    UserRole.HOSPITAL_MANAGER,
    UserRole.ADMINISTRATIVE_STAFF,
    UserRole.DOCTOR,
    UserRole.PATIENT,
  )
  @ApiOperation({
    summary: "Computed slots for a doctor on a date, with that date's exception applied",
  })
  @ApiQuery({ name: 'date', required: true, description: 'ISO date, e.g. 2026-09-20' })
  @ApiResponse({ status: 200, description: 'Computed slots retrieved' })
  @ApiResponse({ status: 400, description: 'Missing date' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getSlots(@Param('doctorId') doctorId: string, @Query('date') date?: string) {
    if (!date) {
      return { success: false, message: 'A date query parameter is required', statusCode: 400 };
    }
    const slots = this.doctorScheduleService.generateSlots(doctorId, date);
    return { success: true, message: 'Computed slots retrieved', data: slots };
  }

  @Post(':doctorId/slots/book')
  @Roles(
    UserRole.SUPERUSER,
    UserRole.HOSPITAL_MANAGER,
    UserRole.ADMINISTRATIVE_STAFF,
    UserRole.PATIENT,
  )
  @ApiOperation({ summary: 'Book one place in a computed slot (capacity-checked under a per-doctor lock)' })
  @ApiResponse({ status: 201, description: 'Slot booked' })
  @ApiResponse({ status: 400, description: 'Slot full, or no availability template for that day' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  bookSlot(
    @Param('doctorId') doctorId: string,
    @Body() body: { date: string; slotStartTime: string },
  ) {
    if (!body?.date || !body?.slotStartTime) {
      return { success: false, message: 'date and slotStartTime are required', statusCode: 400 };
    }
    return this.doctorScheduleService.bookSlot(doctorId, body.date, body.slotStartTime);
  }
}
