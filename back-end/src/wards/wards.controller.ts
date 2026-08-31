import { Controller, Get, Req, Query } from '@nestjs/common';
import { WardsService } from './wards.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';

@ApiTags('Wards')
@ApiBearerAuth('JWT-auth')
// Regional Officers get read-only oversight across the hospitals they manage.
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF, UserRole.REGIONAL_MANAGER)
@Controller('wards')
export class WardsController {
  constructor(private readonly wardsService: WardsService) {}

  @Get()
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 200, description: 'Success' })
  async findAll(@Req() req: any, @Query('hospitalId') hospitalId?: string) {
    const user = req.user;
    const targetHospitalId = user.role === UserRole.SUPERUSER ? hospitalId : user.hospitalId;
    return this.wardsService.findAll(targetHospitalId);
  }
}
