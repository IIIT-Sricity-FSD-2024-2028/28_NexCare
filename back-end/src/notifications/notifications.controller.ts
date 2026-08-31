import { Controller, Get, Post, Patch, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './interfaces/notification.interface';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user notifications' })
  @ApiResponse({ status: 200, description: 'List of notifications' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Req() req: any) {
    return this.notificationsService.findAll(req.user);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count for current user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 200, description: 'Success' })
  getUnreadCount(@Req() req: any) {
    return this.notificationsService.getUnreadCount(req.user);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  @ApiResponse({ status: 200, description: 'Success' })
  markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, req.user);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  @ApiResponse({ status: 200, description: 'Success' })
  markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a notification' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  @ApiResponse({ status: 200, description: 'Success' })
  create(@Body() dto: CreateNotificationDto) {
    const created = this.notificationsService.create(dto);
    return {
      success: true,
      message: 'Notification created successfully',
      data: created,
    };
  }
}
