import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { CreateHospitalScheduleDto, UpdateHospitalScheduleDto } from './interfaces/schedule.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';

@ApiTags('Schedules')
@ApiBearerAuth('JWT-auth')
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @Roles(
    UserRole.SUPERUSER,
    UserRole.HOSPITAL_MANAGER,
    UserRole.ADMINISTRATIVE_STAFF,
    UserRole.DOCTOR,
    UserRole.PATIENT,
  )
  @ApiOperation({ summary: 'List hospital-wide schedules' })
  @ApiQuery({ name: 'hospitalId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 200, description: 'Success' })
  findAll(
    @Req() req: any,
    @Query('hospitalId') hospitalId?: string,
    @Query('status') status?: 'pending' | 'approved' | 'rejected',
  ) {
    const role = req.user?.role;
    const scopedHospital = req.user?.hospitalId;
    const effectiveHospital =
      role === UserRole.HOSPITAL_MANAGER || role === UserRole.ADMINISTRATIVE_STAFF
        ? scopedHospital || hospitalId
        : hospitalId;

    // Patients and doctors only see published (approved) rosters.
    const effectiveStatus =
      role === UserRole.PATIENT || role === UserRole.DOCTOR ? 'approved' : status;

    return this.schedulesService.findAll(effectiveHospital, effectiveStatus);
  }

  @Post()
  @Roles(UserRole.ADMINISTRATIVE_STAFF, UserRole.HOSPITAL_MANAGER, UserRole.SUPERUSER)
  @ApiOperation({ summary: 'Submit a hospital-wide schedule for manager approval' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  @ApiResponse({ status: 200, description: 'Success' })
  create(@Req() req: any, @Body() dto: CreateHospitalScheduleDto) {
    if (!dto.hospitalId) dto.hospitalId = req.user?.hospitalId;
    dto.submittedBy = req.user?.sub || req.user?.id || dto.submittedBy;
    return this.schedulesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.HOSPITAL_MANAGER, UserRole.SUPERUSER)
  @ApiOperation({ summary: 'Approve or reject a hospital-wide schedule' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  @ApiResponse({ status: 200, description: 'Success' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateHospitalScheduleDto) {
    dto.approvedBy = req.user?.sub || req.user?.id || dto.approvedBy;
    return this.schedulesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRATIVE_STAFF, UserRole.HOSPITAL_MANAGER, UserRole.SUPERUSER)
  @ApiOperation({ summary: 'Delete a hospital-wide schedule' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  @ApiResponse({ status: 200, description: 'Success' })
  remove(@Req() req: any, @Param('id') id: string) {
    const scopedHospital = req.user?.role === UserRole.SUPERUSER ? undefined : req.user?.hospitalId;
    return this.schedulesService.remove(id, scopedHospital);
  }
}
