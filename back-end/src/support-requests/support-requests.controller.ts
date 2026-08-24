import { Controller, Get, Post, Put, Body, Param, Query, Req } from '@nestjs/common';
import { SupportRequestsService } from './support-requests.service';
import { CreateSupportRequestDto, UpdateSupportRequestDto } from './interfaces/support-request.interface';
import { UserRole } from '../common/interfaces/api-response.interface';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('support-requests')
export class SupportRequestsController {
  constructor(private readonly supportRequestsService: SupportRequestsService) {}

  @Get()
  async findAll(@Req() req: any, @Query('hospitalId') hospitalId?: string) {
    const user = req.user;
    if (user.role === UserRole.HOSPITAL_MANAGER || user.role === UserRole.REGIONAL_MANAGER) {
      return this.supportRequestsService.findAll(hospitalId, user.id);
    } else if (user.role === UserRole.SUPERUSER) {
      return this.supportRequestsService.findAll(hospitalId);
    } else {
      // Normal hospital staff can only see their own hospital's requests
      return this.supportRequestsService.findAll(user.hospitalId);
    }
  }

  @Post()
  async create(@Req() req: any, @Body() data: CreateSupportRequestDto) {
    const user = req.user;
    if (!data.hospitalId) data.hospitalId = user.hospitalId;
    return this.supportRequestsService.create(data, user.id);
  }

  @Roles(UserRole.SUPERUSER, UserRole.REGIONAL_MANAGER, UserRole.HOSPITAL_MANAGER)
  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateSupportRequestDto) {
    return this.supportRequestsService.update(id, data);
  }
}
