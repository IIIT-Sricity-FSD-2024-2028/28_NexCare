import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseInterceptors, Req, ForbiddenException, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { HospitalsService } from './hospitals.service';
import { UsersService } from '../users/users.service';
import { CreateHospitalDto, UpdateHospitalDto, RenewSubscriptionDto } from './interfaces/hospital.interface';
import { VerificationStatus } from '../common/interfaces/api-response.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';
import { Public } from '../common/decorators/public.decorator';
import { HospitalQueryInterceptor } from './interceptors/hospital-query.interceptor';
import { ResponseUtil } from '../common/utils/response.util';

@ApiTags('Hospitals')
@ApiBearerAuth('JWT-auth')
@Controller('hospitals')
export class HospitalsController {
  constructor(
    private readonly hospitalsService: HospitalsService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @UseInterceptors(HospitalQueryInterceptor)
  @Get()
  @ApiOperation({ summary: 'Find hospitals with filtering' })
  @ApiQuery({ name: 'status', required: false, enum: VerificationStatus, description: 'Filter by verification status', example: 'verified' })
  @ApiQuery({ name: 'speciality', required: false, type: String, description: 'Filter by speciality', example: 'Cardiology' })
  @ApiQuery({ name: 'city', required: false, type: String, description: 'Filter by city', example: 'Tirupati' })
  @ApiQuery({ name: 'pincode', required: false, type: String, description: 'Filter by pincode', example: '517501' })
  // x-query-timestamp is a RESPONSE header set by HospitalQueryInterceptor, not
  // something the caller sends. It was declared with @ApiHeader, which renders
  // it as a request input in Swagger UI — the opposite of what the interceptor
  // does. Declared on the response instead.
  @ApiResponse({
    status: 200,
    description: 'List of hospitals',
    headers: {
      'x-query-timestamp': {
        description: 'When HospitalQueryInterceptor normalised the query (ISO 8601).',
        schema: { type: 'string', format: 'date-time' },
      },
    },
  })
  async findAll(
    @Query('status') status?: VerificationStatus,
    @Query('speciality') speciality?: string,
    @Query('city') city?: string,
    @Query('pincode') pincode?: string
  ) {
    return this.hospitalsService.findAll(status, speciality, city, pincode);
  }

  @Public()
  @UseInterceptors(HospitalQueryInterceptor)
  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby hospitals' })
  @ApiQuery({ name: 'city', required: true, type: String, description: 'City name', example: 'Tirupati' })
  @ApiQuery({ name: 'state', required: true, type: String, description: 'State name', example: 'Andhra Pradesh' })
  @ApiQuery({ name: 'pincode', required: true, type: String, description: 'Pincode', example: '517501' })
  // x-query-timestamp is a RESPONSE header set by HospitalQueryInterceptor, not
  // something the caller sends. It was declared with @ApiHeader, which renders
  // it as a request input in Swagger UI — the opposite of what the interceptor
  // does. Declared on the response instead.
  @ApiResponse({
    status: 200,
    description: 'List of nearby hospitals',
    headers: {
      'x-query-timestamp': {
        description: 'When HospitalQueryInterceptor normalised the query (ISO 8601).',
        schema: { type: 'string', format: 'date-time' },
      },
    },
  })
  async findNearby(
    @Query('city') city: string,
    @Query('state') state: string,
    @Query('pincode') pincode: string
  ) {
    return this.hospitalsService.findNearby(city, state, pincode);
  }

  /** Registrations assigned to the signed-in regional manager only. */
  @Roles(UserRole.REGIONAL_MANAGER)
  @Get('review-queue')
  async reviewQueue(@Req() req: any) {
    const result: any = await this.hospitalsService.findAll();
    return {
      ...result,
      data: (result.data || []).filter((hospital: any) => hospital.assignedManagerId === req.user.id),
    };
  }

  @Public()
  @ApiOperation({ summary: 'Get one hospital by ID' })
  @ApiResponse({ status: 200, description: 'Hospital retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — HospitalAccessMiddleware: you are not assigned to this hospital' })
  @ApiResponse({ status: 404, description: 'Hospital not found' })
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.hospitalsService.findById(id);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new hospital' })
  @ApiResponse({ status: 201, description: 'Hospital registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Hospital with this registration number already exists' })
  async register(@Body() data: CreateHospitalDto, @Res() res: Response) {
    const result = await this.hospitalsService.create(data);
    
    // Return proper HTTP status code based on success
    const statusCode = result.success ? HttpStatus.CREATED : 
                       (result.message?.includes('already exists') ? HttpStatus.CONFLICT :
                        HttpStatus.BAD_REQUEST);
    
    return res.status(statusCode).json(result);
  }

  @Roles(UserRole.SUPERUSER, UserRole.REGIONAL_MANAGER, UserRole.HOSPITAL_MANAGER)
  @Put(':id')
  @ApiOperation({ summary: 'Update hospital by ID' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Hospital updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - User not assigned to this hospital' })
  @ApiResponse({ status: 404, description: 'Hospital not found' })
  async update(@Param('id') id: string, @Req() req: any, @Body() data: UpdateHospitalDto) {
    if (req.user?.role === UserRole.HOSPITAL_MANAGER && req.user.hospitalId && req.user.hospitalId !== id) {
      throw new ForbiddenException('Cross-hospital access denied. You can only update your assigned hospital.');
    }
    return this.hospitalsService.update(id, data);
  }

  /**
   * Get subscription & renewal status for a hospital
   */
  @Roles(UserRole.SUPERUSER, UserRole.REGIONAL_MANAGER, UserRole.HOSPITAL_MANAGER)
  @Get(':id/subscription')
  async getSubscription(@Param('id') id: string, @Req() req: any) {
    if (req.user?.role === UserRole.HOSPITAL_MANAGER && req.user.hospitalId && req.user.hospitalId !== id) {
      throw new ForbiddenException('Cross-hospital access denied. You can only view subscription details for your assigned hospital.');
    }
    return this.hospitalsService.getSubscriptionDetails(id);
  }

  /**
   * Renew hospital registration (mock payment flow with automatic 12-month extension)
   */
  @Roles(UserRole.SUPERUSER, UserRole.HOSPITAL_MANAGER)
  @Post(':id/renew-subscription')
  async renewSubscription(@Param('id') id: string, @Req() req: any, @Body() renewalDto: RenewSubscriptionDto) {
    if (req.user?.role === UserRole.HOSPITAL_MANAGER && req.user.hospitalId && req.user.hospitalId !== id) {
      throw new ForbiddenException('Cross-hospital access denied. You can only renew subscription for your assigned hospital.');
    }
    return this.hospitalsService.renewSubscription(id, renewalDto);
  }

  /**
   * Get payment history for a hospital
   */
  @Roles(UserRole.SUPERUSER, UserRole.REGIONAL_MANAGER, UserRole.HOSPITAL_MANAGER)
  @Get(':id/payment-history')
  async getPaymentHistory(@Param('id') id: string, @Req() req: any) {
    if (req.user?.role === UserRole.HOSPITAL_MANAGER && req.user.hospitalId && req.user.hospitalId !== id) {
      throw new ForbiddenException('Cross-hospital access denied. You can only view payment history for your assigned hospital.');
    }
    return this.hospitalsService.getPaymentHistory(id);
  }

  @Roles(UserRole.SUPERUSER)
  @ApiOperation({
    summary: 'Give a hospital registration final approval',
    description: 'Requires an assigned manager and a cleared regional review first.',
  })
  @ApiResponse({ status: 200, description: 'Approval result (check success field)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — HospitalAccessMiddleware: you are not assigned to this hospital' })
  @ApiResponse({ status: 404, description: 'Hospital not found' })
  @Patch(':id/verify')
  async verify(@Param('id') id: string) {
    const hospital: any = (await this.hospitalsService.findById(id)).data;
    if (!hospital) return this.hospitalsService.findById(id);
    if (!hospital.assignedManagerId || hospital.regionalReviewStatus !== 'cleared') {
      return { success: false, message: 'A regional manager must clear this registration before final approval' };
    }
    return this.hospitalsService.update(id, { verificationStatus: VerificationStatus.VERIFIED });
  }

  @Roles(UserRole.SUPERUSER, UserRole.REGIONAL_MANAGER)
  @ApiOperation({ summary: 'Reject a hospital registration (regional managers record a regional rejection)' })
  @ApiResponse({ status: 200, description: 'Rejection recorded' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — HospitalAccessMiddleware: you are not assigned to this hospital' })
  @ApiResponse({ status: 404, description: 'Hospital not found' })
  @Patch(':id/reject')
  async reject(@Param('id') id: string, @Req() req: any, @Body('notes') notes?: string) {
    if (req.user?.role === UserRole.REGIONAL_MANAGER) {
      return this.hospitalsService.recordRegionalReview(id, req.user.id, 'rejected', notes);
    }
    return this.hospitalsService.update(id, { verificationStatus: VerificationStatus.REJECTED });
  }

  @Roles(UserRole.REGIONAL_MANAGER)
  @ApiOperation({ summary: 'Record the regional officer review decision (cleared or rejected)' })
  @ApiResponse({ status: 200, description: 'Review recorded (check success field)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — HospitalAccessMiddleware: you are not assigned to this hospital' })
  @ApiResponse({ status: 404, description: 'Hospital not found' })
  @Patch(':id/regional-review')
  async regionalReview(
    @Param('id') id: string,
    @Req() req: any,
    @Body('decision') decision: 'cleared' | 'rejected',
    @Body('notes') notes?: string,
  ) {
    if (decision !== 'cleared' && decision !== 'rejected') {
      return { success: false, message: 'Decision must be cleared or rejected' };
    }
    return this.hospitalsService.recordRegionalReview(id, req.user.id, decision, notes);
  }

  @Roles(UserRole.SUPERUSER)
  @ApiOperation({
    summary: 'Assign a regional manager to a hospital',
    description: 'The manager must be active and cover the hospital city in their areas.',
  })
  @ApiResponse({ status: 200, description: 'Assignment result (check success field)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — HospitalAccessMiddleware: you are not assigned to this hospital' })
  @ApiResponse({ status: 404, description: 'Hospital not found' })
  @Patch(':id/assign-manager')
  async assignManager(@Param('id') id: string, @Body('managerId') managerId: string) {
    const [hospitalResult, managerResult]: any = await Promise.all([
      this.hospitalsService.findById(id), this.usersService.findById(managerId),
    ]);
    const hospital = hospitalResult.data;
    const manager = managerResult.data;
    if (!hospital) return hospitalResult;
    if (!manager || manager.role !== UserRole.REGIONAL_MANAGER || manager.status !== 'Active') {
      return { success: false, message: 'Select an active regional manager' };
    }
    const managerAreas = Array.isArray(manager.areas) ? manager.areas : [];
    const hospitalArea = String(hospital.city || '').trim().toLowerCase();
    if (!hospitalArea || !managerAreas.some((area: string) => area.trim().toLowerCase() === hospitalArea)) {
      return { success: false, message: 'The regional manager must cover the hospital\'s local area/city' };
    }
    if (hospital.verificationStatus !== VerificationStatus.PENDING_VERIFICATION) {
      return { success: false, message: 'Only pending registrations can be assigned for review' };
    }
    return this.hospitalsService.update(id, {
      assignedManagerId: managerId,
      regionalReviewStatus: 'pending',
      regionalReviewedAt: undefined,
      regionalReviewNotes: undefined,
    });
  }

  /**
   * Superadmin Final Approval
   * Automatically generates a hospital_manager account for the contact person.
   */
  @Roles(UserRole.SUPERUSER)
  @Post(':id/approve')
  async approveHospital(@Param('id') id: string) {
    const hospitalResult = await this.hospitalsService.findById(id);
    if (!hospitalResult.success || !hospitalResult.data) {
      return hospitalResult;
    }

    const hospital = hospitalResult.data;
    
    // Update status to Approved
    await this.hospitalsService.update(id, {
      verificationStatus: VerificationStatus.VERIFIED,
      regionalReviewStatus: 'cleared'
    });

    // Auto-generate hospital manager credentials
    const contactName = hospital.adminName || 'admin';
    const nameParts = contactName.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ');
    let emailPrefix = nameParts[0] || 'admin'; // just use first name
    
    const shortId = id.toLowerCase();
    const generatedEmail = `${emailPrefix}.${shortId}@nexcare.com`;
    const generatedPassword = 'Patient123';

    // Create the user
    await this.usersService.create({
      name: hospital.adminName || 'Hospital Admin',
      email: generatedEmail,
      password: generatedPassword,
      role: UserRole.HOSPITAL_MANAGER,
      status: 'Active',
      hospitalId: id
    } as any);

    return ResponseUtil.success('Hospital approved and manager account created', {
      email: generatedEmail,
      password: generatedPassword
    });
  }

  // ========================================================================
  // Regional Manager Specific Endpoints
  // ========================================================================

  /**
   * Get hospitals assigned to the regional manager
   */
  @Roles(UserRole.REGIONAL_MANAGER)
  @Get('regional/my-hospitals')
  async getMyHospitals(@Req() req: any) {
    try {
      const myHospitals = this.hospitalsService.getHospitalsForManager(req.user.id);
      return ResponseUtil.success('Assigned hospitals retrieved successfully', myHospitals);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve assigned hospitals');
    }
  }

  /**
   * Get pending verifications for regional manager
   */
  @Roles(UserRole.REGIONAL_MANAGER)
  @Get('regional/pending-verifications')
  async getPendingVerifications(@Req() req: any) {
    try {
      const pendingHospitals = this.hospitalsService.getHospitalsForManager(req.user.id).filter(
        hospital => hospital.verificationStatus === 'pending_verification',
      );
      return ResponseUtil.success('Pending verifications retrieved successfully', pendingHospitals);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve pending verifications');
    }
  }

  @Roles(UserRole.REGIONAL_MANAGER)
  @Get('regional/overview')
  async getRegionalOverview(@Req() req: any) {
    return this.hospitalsService.getRegionalOverview(req.user.id);
  }

  @Roles(UserRole.REGIONAL_MANAGER)
  @Get('regional/performance-alerts')
  async getPerformanceAlerts(@Req() req: any) {
    return this.hospitalsService.getPerformanceAlerts(req.user.id);
  }

  @Roles(UserRole.REGIONAL_MANAGER)
  @Get('regional/comparison')
  async getHospitalComparison(@Req() req: any, @Query('ids') ids?: string) {
    const hospitalIds = ids ? ids.split(',').map(id => id.trim()).filter(Boolean) : undefined;
    return this.hospitalsService.getHospitalComparison(req.user.id, hospitalIds);
  }

  /**
   * Verify hospital with comments (enhanced from basic verify)
   */
  @Roles(UserRole.REGIONAL_MANAGER)
  @Patch(':id/verify-detailed')
  async verifyHospitalDetailed(
    @Param('id') hospitalId: string,
    @Body() body: { comments?: string; suggestedChanges?: string[] }
  ) {
    try {
      const updateData: any = {
        verificationStatus: 'verified',
      };

      if (body.comments) {
        updateData.verificationComments = body.comments;
      }

      if (body.suggestedChanges && body.suggestedChanges.length > 0) {
        updateData.suggestedChanges = body.suggestedChanges;
      }

      return await this.hospitalsService.update(hospitalId, updateData);
    } catch (error) {
      return ResponseUtil.serverError('Failed to verify hospital');
    }
  }

  /**
   * Reject hospital with comments (enhanced from basic reject)
   */
  @Roles(UserRole.REGIONAL_MANAGER)
  @Patch(':id/reject-detailed')
  async rejectHospitalDetailed(
    @Param('id') hospitalId: string,
    @Body() body: { comments?: string; rejectionReason?: string }
  ) {
    try {
      const updateData: any = {
        verificationStatus: 'rejected',
      };

      if (body.comments) {
        updateData.verificationComments = body.comments;
      }

      if (body.rejectionReason) {
        updateData.rejectionReason = body.rejectionReason;
      }

      return await this.hospitalsService.update(hospitalId, updateData);
    } catch (error) {
      return ResponseUtil.serverError('Failed to reject hospital');
    }
  }

  /**
   * Get hospital verification history
   */
  @Roles(UserRole.REGIONAL_MANAGER)
  @Get(':id/verification-history')
  async getVerificationHistory(@Param('id') hospitalId: string) {
    try {
      const hospitalResult = await this.hospitalsService.findById(hospitalId);
      const hospital = hospitalResult.data;

      if (!hospital) {
        return ResponseUtil.notFound('Hospital', hospitalId);
      }

      // Create a simple verification history based on current status
      const history = [
        {
          status: 'registered',
          date: hospital.createdAt,
          description: 'Hospital registered'
        },
        {
          status: hospital.verificationStatus,
          date: hospital.updatedAt,
          description: `Current status: ${hospital.verificationStatus}`,
          comments: hospital.verificationComments || null
        }
      ];

      return ResponseUtil.success('Verification history retrieved successfully', history);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve verification history');
    }
  }

  /**
   * Get hospital performance metrics
   */
  @Roles(UserRole.REGIONAL_MANAGER)
  @Get(':id/performance')
  async getHospitalPerformance(@Param('id') hospitalId: string) {
    return await this.hospitalsService.getHospitalPerformance(hospitalId);
  }

  /**
   * Get regional manager dashboard overview
   */
  @Roles(UserRole.REGIONAL_MANAGER)
  @Get('regional/dashboard')
  async getRegionalDashboard(@Req() req: any) {
    return this.hospitalsService.getRegionalOverview(req.user.id);
  }
}
