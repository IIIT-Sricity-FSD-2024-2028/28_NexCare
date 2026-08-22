import { Controller, Get, Post, Patch, Body, Param, Req } from '@nestjs/common';
import { RequestsService, CreateRequestDto, RequestStatus } from './requests.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';
import { HospitalsService } from '../hospitals/hospitals.service';

@ApiTags('Requests')
@ApiBearerAuth('JWT-auth')
@Controller('requests')
export class RequestsController {
  constructor(
    private readonly requestsService: RequestsService,
    private readonly hospitalsService: HospitalsService
  ) {}

  @Get()
  async getRequests(@Req() req: any) {
    const user = req.user;
    if (user.role === UserRole.SUPERUSER || user.role === UserRole.HOSPITAL_MANAGER) {
      return this.requestsService.findAllForManager(user.id);
    }
    return this.requestsService.findAllForHospital(user.hospitalId);
  }

  @Post()
  async createRequest(@Req() req: any, @Body() data: CreateRequestDto) {
    const user = req.user;
    let managerId = undefined;
    
    // Find the manager for this hospital
    if (user.hospitalId) {
      const hRes = await this.hospitalsService.findById(user.hospitalId);
      if (hRes.success && hRes.data) {
        managerId = hRes.data.assignedManagerId;
      }
    }
    
    return this.requestsService.create(user.hospitalId, user.id, data, managerId);
  }

  @Roles(UserRole.SUPERUSER, UserRole.HOSPITAL_MANAGER)
  @Patch(':id/respond')
  async respondToRequest(
    @Param('id') id: string, 
    @Body('response') response: string, 
    @Body('status') status: RequestStatus
  ) {
    return this.requestsService.respond(id, response, status);
  }
}
