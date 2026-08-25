import { Controller, Get, Post, Put, Patch, Body, Param, Query } from '@nestjs/common';
import { HospitalsService } from './hospitals.service';
import { CreateHospitalDto, UpdateHospitalDto } from './interfaces/hospital.interface';
import { VerificationStatus } from '../common/interfaces/api-response.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';
import { Public } from '../common/decorators/public.decorator';

@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @Public()
  @Get()
  async findAll(@Query('status') status?: VerificationStatus) {
    return this.hospitalsService.findAll(status);
  }

  @Public()
  @Get('nearby')
  async findNearby(
    @Query('city') city: string,
    @Query('state') state: string,
    @Query('pincode') pincode: string
  ) {
    return this.hospitalsService.findNearby(city, state, pincode);
  }

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

  @Roles(UserRole.SUPERUSER, UserRole.REGIONAL_MANAGER)
  @Patch(':id/verify')
  async verify(@Param('id') id: string) {
    return this.hospitalsService.update(id, { verificationStatus: VerificationStatus.VERIFIED });
  }

  @Roles(UserRole.SUPERUSER, UserRole.REGIONAL_MANAGER)
  @Patch(':id/reject')
  async reject(@Param('id') id: string) {
    return this.hospitalsService.update(id, { verificationStatus: VerificationStatus.REJECTED });
  }

  @Roles(UserRole.SUPERUSER)
  @Patch(':id/assign-manager')
  async assignManager(@Param('id') id: string, @Body('managerId') managerId: string) {
    return this.hospitalsService.update(id, { assignedManagerId: managerId });
  }
}
