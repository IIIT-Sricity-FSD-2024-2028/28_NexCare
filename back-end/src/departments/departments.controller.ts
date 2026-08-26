import { Controller, Get, Req, Query } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';

@ApiTags('Departments')
@ApiBearerAuth('JWT-auth')
// Regional Officers get read-only oversight across the hospitals they manage.
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.REGIONAL_MANAGER)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  async findAll(@Req() req: any, @Query('hospitalId') hospitalId?: string) {
    const user = req.user;
    const targetHospitalId = user.role === UserRole.SUPERUSER ? hospitalId : user.hospitalId;
    return this.departmentsService.findAll(targetHospitalId);
  }
}
