import { Controller, Get, Req, Query } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';

@ApiTags('Equipment')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF)
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  async findAll(@Req() req: any, @Query('hospitalId') hospitalId?: string) {
    const user = req.user;
    const targetHospitalId = user.role === UserRole.SUPERUSER ? hospitalId : user.hospitalId;
    return this.equipmentService.findAll(targetHospitalId);
  }
}
