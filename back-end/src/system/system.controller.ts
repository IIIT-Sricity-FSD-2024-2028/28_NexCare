import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Put, 
  Patch, 
  Delete, 
  Param, 
  Query,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SystemService } from './system.service';
import { CreateSystemActivityDto } from './dto/create-activity.dto';
import { UpdateSystemSettingsDto } from './dto/update-settings.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/api-response.interface';

/**
 * System Controller
 * Manages audit logs and system configuration in the NexCare system
 * Provides endpoints for system activity tracking and settings management
 */
@ApiTags('System')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF)
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  /**
   * Get all system activity with optional filtering
   */
  @Get('activity')
  @ApiOperation({ summary: 'Get system audit logs' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'module', required: false })
  @ApiQuery({ name: 'severity', required: false })
  @ApiResponse({ status: 200, description: 'List of audit logs' })
  async findAllActivity(
    @Query('userId') userId?: string,
    @Query('module') module?: string,
    @Query('severity') severity?: string
  ) {
    return this.systemService.findAllActivity(userId, module, severity);
  }

  /**
   * Create new system activity
   */
  @Post('activity')
  @ApiOperation({ summary: 'Log a new system activity' })
  @ApiResponse({ status: 201, description: 'Activity logged successfully' })
  async createActivity(@Body() createActivityDto: CreateSystemActivityDto) {
    return this.systemService.createActivity(createActivityDto as any);
  }

  /**
   * Get all system settings with optional filtering
   */
  @Get('settings')
  @ApiOperation({ summary: 'Get all system settings' })
  @ApiQuery({ name: 'category', required: false })
  @ApiResponse({ status: 200, description: 'List of system settings' })
  async findAllSettings(@Query('category') category?: string) {
    return this.systemService.findAllSettings(category);
  }

  /**
   * Get system setting by key
   */
  @Get('settings/key/:key')
  @ApiOperation({ summary: 'Get system setting by key' })
  @ApiResponse({ status: 200, description: 'System setting retrieved' })
  async findSettingByKey(@Param('key') key: string) {
    return this.systemService.findSettingByKey(key);
  }

  /**
   * Get system statistics
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get system statistics' })
  @ApiResponse({ status: 200, description: 'System statistics retrieved' })
  async getStats() {
    return this.systemService.getStats();
  }

  /**
   * Get activities by date range
   */
  @Get('activity/date-range')
  @ApiOperation({ summary: 'Get activities by date range' })
  @ApiQuery({ name: 'startDate', type: String })
  @ApiQuery({ name: 'endDate', type: String })
  @ApiResponse({ status: 200, description: 'Activities retrieved' })
  async getActivitiesByDateRange(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.systemService.getActivitiesByDateRange(startDate, endDate);
  }

  /**
   * Get activities by user
   */
  @Get('activity/user/:userId')
  @ApiOperation({ summary: 'Get activities by user ID' })
  @ApiResponse({ status: 200, description: 'User activities retrieved' })
  async getActivitiesByUser(@Param('userId') userId: string) {
    return this.systemService.getActivitiesByUser(userId);
  }

  /**
   * Get recent activities
   */
  @Get('activity/recent')
  @ApiOperation({ summary: 'Get recent activities' })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Recent activities retrieved' })
  async getRecentActivities(@Query('limit') limit?: number) {
    return this.systemService.getRecentActivities(limit ? parseInt(limit.toString()) : 10);
  }

  /**
   * Get settings by category
   */
  @Get('settings/category/:category')
  @ApiOperation({ summary: 'Get settings by category' })
  @ApiResponse({ status: 200, description: 'Category settings retrieved' })
  async getSettingsByCategory(@Param('category') category: string) {
    return this.systemService.getSettingsByCategory(category);
  }

  /**
   * Search system activities
   */
  @Get('activity/search/:query')
  @ApiOperation({ summary: 'Search system activities' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchActivities(@Param('query') query: string) {
    return this.systemService.searchActivities(query);
  }

  /**
   * Get system activity by ID
   */
  @Get('activity/:id')
  @ApiOperation({ summary: 'Get activity by ID' })
  @ApiResponse({ status: 200, description: 'Activity details retrieved' })
  async findActivityById(@Param('id') id: string) {
    return this.systemService.findActivityById(id);
  }

  /**
   * Get system setting by ID
   */
  @Get('settings/:id')
  @ApiOperation({ summary: 'Get setting by ID' })
  @ApiResponse({ status: 200, description: 'Setting details retrieved' })
  async findSettingById(@Param('id') id: string) {
    return this.systemService.findSettingById(id);
  }

  /**
   * Update system setting
   */
  @Put('settings/:id')
  @ApiOperation({ summary: 'Update system setting' })
  @ApiResponse({ status: 200, description: 'Setting updated successfully' })
  async updateSetting(@Param('id') id: string, @Body() updateSettingsDto: UpdateSystemSettingsDto) {
    return this.systemService.updateSetting(id, updateSettingsDto as any);
  }
}
