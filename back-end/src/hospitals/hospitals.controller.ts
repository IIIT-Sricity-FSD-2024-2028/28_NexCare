import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseInterceptors, Req } from '@nestjs/common';
import { HospitalsService } from './hospitals.service';
import { UsersService } from '../users/users.service';
import { CreateHospitalDto, UpdateHospitalDto } from './interfaces/hospital.interface';
import { VerificationStatus } from '../common/interfaces/api-response.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';
import { Public } from '../common/decorators/public.decorator';
import { HospitalQueryInterceptor } from './interceptors/hospital-query.interceptor';

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
}
