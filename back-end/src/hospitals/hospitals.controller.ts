import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseInterceptors, Req } from '@nestjs/common';
import { HospitalsService } from './hospitals.service';
import { UsersService } from '../users/users.service';
import { CreateHospitalDto, UpdateHospitalDto } from './interfaces/hospital.interface';
import { VerificationStatus } from '../common/interfaces/api-response.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';
import { Public } from '../common/decorators/public.decorator';
import { HospitalQueryInterceptor } from './interceptors/hospital-query.interceptor';
import { ResponseUtil } from '../common/utils/response.util';

@Controller('hospitals')
export class HospitalsController {
  constructor(
    private readonly hospitalsService: HospitalsService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @UseInterceptors(HospitalQueryInterceptor)
  @Get()
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
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.hospitalsService.findById(id);
  }

  @Public()
  @Post('register')
  async register(@Body() data: CreateHospitalDto) {
    return this.hospitalsService.create(data);
  }

  @Roles(UserRole.SUPERUSER, UserRole.REGIONAL_MANAGER, UserRole.HOSPITAL_MANAGER)
  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateHospitalDto) {
    return this.hospitalsService.update(id, data);
  }

  @Roles(UserRole.SUPERUSER)
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
  @Patch(':id/reject')
  async reject(@Param('id') id: string, @Req() req: any, @Body('notes') notes?: string) {
    if (req.user?.role === UserRole.REGIONAL_MANAGER) {
      return this.hospitalsService.recordRegionalReview(id, req.user.id, 'rejected', notes);
    }
    return this.hospitalsService.update(id, { verificationStatus: VerificationStatus.REJECTED });
  }

  @Roles(UserRole.REGIONAL_MANAGER)
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

  // ========================================================================
  // Regional Manager Specific Endpoints
  // ========================================================================

  /**
   * Get hospitals assigned to the regional manager
   */
  @Roles(UserRole.REGIONAL_MANAGER)
  @Get('regional/my-hospitals')
  async getMyHospitals() {
    try {
      const hospitalsResult = await this.hospitalsService.findAll();
      const allHospitals = hospitalsResult.data || [];
      
      // For now, return all hospitals with assigned managers - RM ID will come from JWT token in production
      const myHospitals = allHospitals.filter((hospital: any) => 
        hospital.assignedManagerId
      );

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
  async getPendingVerifications() {
    try {
      const hospitalsResult = await this.hospitalsService.findAll();
      const allHospitals = hospitalsResult.data || [];
      
      // For now, return all pending hospitals - RM ID will come from JWT token in production
      const pendingHospitals = allHospitals.filter((hospital: any) => 
        hospital.assignedManagerId && 
        hospital.verificationStatus === 'pending_verification'
      );

      return ResponseUtil.success('Pending verifications retrieved successfully', pendingHospitals);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve pending verifications');
    }
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
  async getRegionalDashboard() {
    try {
      // For now, return a simplified dashboard - RM ID will come from JWT token in production
      const hospitalsResult = await this.hospitalsService.findAll();
      const allHospitals = hospitalsResult.data || [];
      
      const myHospitals = allHospitals.filter((hospital: any) => 
        hospital.assignedManagerId
      );

      const pendingHospitals = myHospitals.filter((hospital: any) => 
        hospital.verificationStatus === 'pending_verification'
      );

      const verifiedHospitals = myHospitals.filter((hospital: any) => 
        hospital.verificationStatus === 'verified'
      );

      const dashboard = {
        totalHospitals: myHospitals.length,
        pendingVerifications: pendingHospitals.length,
        verifiedHospitals: verifiedHospitals.length,
        rejectedHospitals: myHospitals.filter((h: any) => h.verificationStatus === 'rejected').length,
        activeHospitals: verifiedHospitals.length,
        hospitals: myHospitals
      };

      return ResponseUtil.success('Dashboard overview retrieved successfully', dashboard);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve dashboard overview');
    }
  }
}
