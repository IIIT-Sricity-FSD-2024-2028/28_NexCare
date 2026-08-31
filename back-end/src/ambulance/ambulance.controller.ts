import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Req,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AmbulanceService } from './ambulance.service';
import { CreateAmbulanceRequestDto } from './dto/create-request.dto';
import { UpdateAmbulanceRequestDto } from './dto/update-request.dto';
import { DispatchAmbulanceDto } from './dto/dispatch-ambulance.dto';
import { DtoValidatorUtil } from '../common/validation/dto-validator.util';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, AmbulanceStatus } from '../common/interfaces/api-response.interface';

/**
 * Ambulance Controller
 * Manages emergency services and ambulance requests in the NexCare system.
 *
 * RBAC: staff/superuser/ambulance manage and dispatch. Patients may raise a
 * request and view/cancel their OWN requests only (enforced against
 * req.user.patientId). Dispatch/complete/status transitions are staff-only.
 */
@ApiTags('Ambulance')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.AMBULANCE, UserRole.HOSPITAL_MANAGER, UserRole.REGIONAL_MANAGER)
@Controller('ambulance')
export class AmbulanceController {
  constructor(private readonly ambulanceService: AmbulanceService) {}

  private isPatient(req: any): boolean {
    return req?.user?.role === UserRole.PATIENT;
  }

  /** Hospital to scope staff queries to (undefined for superuser/patient => no hospital filter). */
  private scopeHospitalId(req: any): string | undefined {
    const user = req?.user;
    if (user?.role === UserRole.SUPERUSER || user?.role === UserRole.PATIENT) return undefined;
    return user?.hospitalId;
  }

  /** For a patient caller, verify the request belongs to them (else 403). */
  private async assertOwnsRequest(req: any, id: string) {
    if (!this.isPatient(req)) return;
    const res: any = await this.ambulanceService.findById(id);
    if (res?.success && res.data && res.data.patientId !== req.user.patientId) {
      throw new ForbiddenException('You can only access your own ambulance requests.');
    }
  }

  /**
   * Get all ambulance requests with optional filtering
   */
  @Get()
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.AMBULANCE, UserRole.PATIENT, UserRole.REGIONAL_MANAGER, UserRole.HOSPITAL_MANAGER)
  @ApiOperation({ summary: 'Get all ambulance requests (patients: only their own, staff: only their hospital)' })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: AmbulanceStatus })
  @ApiResponse({ status: 200, description: 'List of ambulance requests' })
  @ApiResponse({ status: 403, description: 'Forbidden - User not assigned to any hospital' })
  async findAll(
    @Req() req: any,
    @Query('patientId') patientId?: string,
    @Query('status') status?: string
  ) {
    if (this.isPatient(req)) {
      patientId = req.user.patientId;
    }
    return this.ambulanceService.findAll(patientId, status as any, this.scopeHospitalId(req));
  }

  /**
   * Create new ambulance request
   */
  @Post()
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.AMBULANCE, UserRole.PATIENT, UserRole.HOSPITAL_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create an ambulance request' })
  @ApiResponse({ status: 403, description: 'Forbidden — AmbulanceAccessMiddleware: no hospital assignment, or the request belongs to another hospital' })
  @ApiResponse({ status: 200, description: 'Request creation result (check success field)' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Req() req: any, @Body() createRequestDto: CreateAmbulanceRequestDto) {
    // Validate DTO before processing
    const validation = DtoValidatorUtil.validateAmbulanceRequest(createRequestDto);

    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: validation.errors,
        fieldErrors: validation.fieldErrors
      });
    }

    const dto: any = { ...createRequestDto };
    // A patient can only raise a request for themselves.
    if (this.isPatient(req)) {
      dto.patientId = req.user.patientId;
    }
    // Stamp the staff member's hospital when available (patients default in-service).
    const scopedHospital = this.scopeHospitalId(req);
    if (scopedHospital) dto.hospitalId = scopedHospital;
    return this.ambulanceService.create(dto);
  }

  /**
   * Get ambulance statistics
   */
  @Get('stats/overview')
  @ApiOperation({ summary: 'Get ambulance statistics' })
  @ApiResponse({ status: 403, description: 'Forbidden — AmbulanceAccessMiddleware: no hospital assignment, or the request belongs to another hospital' })
  @ApiResponse({ status: 200, description: 'Ambulance statistics retrieved' })
  async getStats(@Req() req: any) {
    return this.ambulanceService.getStats(this.scopeHospitalId(req));
  }

  /**
   * Get requests by patient
   */
  @Get('patient/:patientId')
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.AMBULANCE, UserRole.PATIENT)
  @ApiOperation({ summary: 'Get ambulance requests by patient ID (patients: own only)' })
  @ApiResponse({ status: 200, description: 'Patient requests retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden - Patient attempting to access another patient records, or staff accessing wrong hospital' })
  async findByPatient(@Req() req: any, @Param('patientId') patientId: string) {
    if (this.isPatient(req) && patientId !== req.user.patientId) {
      throw new ForbiddenException('You can only view your own ambulance requests.');
    }
    return this.ambulanceService.findByPatient(patientId);
  }

  /**
   * Get active requests
   */
  @Get('active')
  @ApiOperation({ summary: 'Get all active ambulance requests' })
  @ApiResponse({ status: 403, description: 'Forbidden — AmbulanceAccessMiddleware: no hospital assignment, or the request belongs to another hospital' })
  @ApiResponse({ status: 200, description: 'Active requests retrieved' })
  async getActiveRequests(@Req() req: any) {
    return this.ambulanceService.getActiveRequests(this.scopeHospitalId(req));
  }

  /**
   * Get requests by assigned staff
   */
  @Get('assigned/:assignedTo')
  @ApiOperation({ summary: 'Get ambulance requests by assigned staff' })
  @ApiResponse({ status: 403, description: 'Forbidden — AmbulanceAccessMiddleware: no hospital assignment, or the request belongs to another hospital' })
  @ApiResponse({ status: 200, description: 'Staff assigned requests retrieved' })
  async findByAssignedStaff(@Param('assignedTo') assignedTo: string, @Req() req: any) {
    return this.ambulanceService.findByAssignedStaff(assignedTo, this.scopeHospitalId(req));
  }

  /**
   * Get ambulance request by ID
   */
  @Get(':id')
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.AMBULANCE, UserRole.PATIENT)
  @ApiOperation({ summary: 'Get ambulance request by ID (patients: own only)' })
  @ApiResponse({ status: 200, description: 'Request details retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden - Unauthorized cross-hospital or cross-patient access' })
  async findById(@Req() req: any, @Param('id') id: string) {
    await this.assertOwnsRequest(req, id);
    return this.ambulanceService.findById(id);
  }

  /**
   * Update ambulance request
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update an ambulance request' })
  @ApiResponse({ status: 403, description: 'Forbidden — AmbulanceAccessMiddleware: no hospital assignment, or the request belongs to another hospital' })
  @ApiResponse({ status: 200, description: 'Request updated successfully' })
  async update(@Param('id') id: string, @Body() updateRequestDto: UpdateAmbulanceRequestDto) {
    return this.ambulanceService.update(id, updateRequestDto as any);
  }

  /**
   * Partial update ambulance request
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Partially update an ambulance request' })
  @ApiResponse({ status: 403, description: 'Forbidden — AmbulanceAccessMiddleware: no hospital assignment, or the request belongs to another hospital' })
  @ApiResponse({ status: 200, description: 'Request updated successfully' })
  async patchUpdate(@Param('id') id: string, @Body() updateRequestDto: UpdateAmbulanceRequestDto) {
    return this.ambulanceService.update(id, updateRequestDto as any);
  }

  /**
   * Delete ambulance request
   */
  /**
   * Cancel a request. This is what the portals' "Cancel" button should call —
   * it keeps the record. DELETE below destroys it and is staff-only.
   */
  @Patch(':id/cancel')
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.AMBULANCE, UserRole.PATIENT)
  @ApiOperation({ summary: 'Cancel an ambulance request (patients: own only)' })
  @ApiResponse({ status: 200, description: 'Ambulance request cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Cannot cancel a completed request or one in transit' })
  async cancel(@Req() req: any, @Param('id') id: string, @Body() body: { reason?: string } = {}) {
    await this.assertOwnsRequest(req, id);
    return this.ambulanceService.cancel(id, req.user?.id, body?.reason);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF)
  @ApiOperation({ summary: 'Delete/cancel an ambulance request (patients: own only)' })
  @ApiResponse({ status: 403, description: 'Forbidden — AmbulanceAccessMiddleware: no hospital assignment, or the request belongs to another hospital' })
  @ApiResponse({ status: 200, description: 'Request deleted successfully' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.assertOwnsRequest(req, id);
    return this.ambulanceService.delete(id);
  }

  /**
   * Dispatch ambulance
   */
  @Patch(':id/dispatch')
  @ApiOperation({ summary: 'Dispatch an ambulance' })
  @ApiResponse({ status: 200, description: 'Ambulance dispatched successfully' })
  async dispatch(@Param('id') id: string, @Body() dispatchDto: DispatchAmbulanceDto, @Req() req: any) {
    const dispatchedBy = req?.user?.id || dispatchDto.dispatchedBy;
    return this.ambulanceService.dispatch(id, dispatchDto.assignedTo, dispatchedBy);
  }

  /**
   * Complete ambulance request
   */
  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark an ambulance request as completed' })
  @ApiResponse({ status: 200, description: 'Request completed successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Request must be in an active state (e.g. dispatched)' })
  async complete(@Param('id') id: string) {
    return this.ambulanceService.complete(id);
  }

  /**
   * Update request status
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update ambulance request status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid status transition' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.ambulanceService.updateStatus(id, status as any);
  }
}
