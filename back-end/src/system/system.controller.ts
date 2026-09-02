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
import { Public } from '../common/decorators/public.decorator';
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log a new system activity' })
  @ApiResponse({ status: 200, description: 'Activity logging result (check success field)' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAllSettings(@Query('category') category?: string) {
    return this.systemService.findAllSettings(category);
  }

  /**
   * Get system setting by key
   */
  @Get('settings/key/:key')
  @ApiOperation({ summary: 'Get system setting by key' })
  @ApiResponse({ status: 200, description: 'System setting retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findSettingByKey(@Param('key') key: string) {
    return this.systemService.findSettingByKey(key);
  }

  /**
   * Get system statistics
   */
  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Get system statistics' })
  @ApiResponse({ status: 200, description: 'System statistics retrieved' })
  async getStats() {
    return this.systemService.getStats();
  }

  /**
   * Get system health and performance
   */
  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Get system health and performance' })
  @ApiResponse({ status: 200, description: 'System health retrieved' })
  async getHealth() {
    return this.systemService.getHealth();
  }

  @Public()
  @Get('performance')
  @ApiOperation({ summary: 'Get system performance metrics' })
  @ApiResponse({ status: 200, description: 'System performance retrieved' })
  async getPerformance() {
    return this.systemService.getHealth();
  }

  /**
   * Get activities by date range
   */
  @Get('activity/date-range')
  @ApiOperation({ summary: 'Get activities by date range' })
  @ApiQuery({ name: 'startDate', type: String })
  @ApiQuery({ name: 'endDate', type: String })
  @ApiResponse({ status: 200, description: 'Activities retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getActivitiesByDateRange(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.systemService.getActivitiesByDateRange(startDate, endDate);
  }

  /**
   * Get activities by user
   */
  @Get('activity/user/:userId')
  @ApiOperation({ summary: 'Get activities by user ID' })
  @ApiResponse({ status: 200, description: 'User activities retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getRecentActivities(@Query('limit') limit?: number) {
    return this.systemService.getRecentActivities(limit ? parseInt(limit.toString()) : 10);
  }

  /**
   * Get settings by category
   */
  @Get('settings/category/:category')
  @ApiOperation({ summary: 'Get settings by category' })
  @ApiResponse({ status: 200, description: 'Category settings retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getSettingsByCategory(@Param('category') category: string) {
    return this.systemService.getSettingsByCategory(category);
  }

  /**
   * Search system activities
   */
  @Get('activity/search/:query')
  @ApiOperation({ summary: 'Search system activities' })
  @ApiResponse({ status: 200, description: 'Search results' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async searchActivities(@Param('query') query: string) {
    return this.systemService.searchActivities(query);
  }

  /**
   * Get system activity by ID
   */
  @Get('activity/:id')
  @ApiOperation({ summary: 'Get activity by ID' })
  @ApiResponse({ status: 200, description: 'Activity details retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findActivityById(@Param('id') id: string) {
    return this.systemService.findActivityById(id);
  }

  /**
   * Get system setting by ID
   */
  @Get('settings/:id')
  @ApiOperation({ summary: 'Get setting by ID' })
  @ApiResponse({ status: 200, description: 'Setting details retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findSettingById(@Param('id') id: string) {
    return this.systemService.findSettingById(id);
  }

  /**
   * Bulk update system settings from a key→value map
   */
  @Put('settings')
  @ApiOperation({ summary: 'Bulk update system settings (key→value map)' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async updateSettingsBulk(@Body() settingsMap: Record<string, any>) {
    return this.systemService.updateSettingsBulk(settingsMap);
  }

  /**
   * Update system setting
   */
  @Put('settings/:id')
  @ApiOperation({ summary: 'Update system setting' })
  @ApiResponse({ status: 200, description: 'Setting updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async updateSetting(@Param('id') id: string, @Body() updateSettingsDto: UpdateSystemSettingsDto) {
    return this.systemService.updateSetting(id, updateSettingsDto as any);
  }
}
