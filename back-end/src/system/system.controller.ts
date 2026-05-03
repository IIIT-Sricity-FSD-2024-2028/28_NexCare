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
import { SystemService } from './system.service';
import { CreateSystemActivityDto } from './dto/create-activity.dto';
import { UpdateSystemSettingsDto } from './dto/update-settings.dto';

/**
 * System Controller
 * Manages audit logs and system configuration in the NexCare system
 * Provides endpoints for system activity tracking and settings management
 */
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  /**
   * Get all system activity with optional filtering
   * @route GET /system/activity
   * @query userId Optional user filter
   * @query module Optional module filter
   * @query severity Optional severity filter
   * @access Private (Admin/Staff)
   */
  @Get('activity')
  async findAllActivity(
    @Query('userId') userId?: string,
    @Query('module') module?: string,
    @Query('severity') severity?: string
  ) {
    return this.systemService.findAllActivity(userId, module, severity);
  }

  /**
   * Create new system activity
   * @route POST /system/activity
   * @access Private (Admin/Staff)
   */
  @Post('activity')
  async createActivity(@Body() createActivityDto: CreateSystemActivityDto) {
    return this.systemService.createActivity(createActivityDto as any);
  }

  /**
   * Get all system settings with optional filtering
   * @route GET /system/settings
   * @query category Optional category filter
   * @access Private (Admin/Staff)
   */
  @Get('settings')
  async findAllSettings(@Query('category') category?: string) {
    return this.systemService.findAllSettings(category);
  }

  /**
   * Get system setting by key
   * @route GET /system/settings/key/:key
   * @access Private (Admin/Staff)
   */
  @Get('settings/key/:key')
  async findSettingByKey(@Param('key') key: string) {
    return this.systemService.findSettingByKey(key);
  }

  /**
   * Get system statistics
   * @route GET /system/stats
   * @access Private (Admin/Staff)
   */
  @Get('stats')
  async getStats() {
    return this.systemService.getStats();
  }

  /**
   * Get activities by date range
   * @route GET /system/activity/date-range
   * @query startDate Start date
   * @query endDate End date
   * @access Private (Admin/Staff)
   */
  @Get('activity/date-range')
  async getActivitiesByDateRange(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.systemService.getActivitiesByDateRange(startDate, endDate);
  }

  /**
   * Get activities by user
   * @route GET /system/activity/user/:userId
   * @access Private (Admin/Staff)
   */
  @Get('activity/user/:userId')
  async getActivitiesByUser(@Param('userId') userId: string) {
    return this.systemService.getActivitiesByUser(userId);
  }

  /**
   * Get recent activities
   * @route GET /system/activity/recent
   * @query limit Number of recent activities to return
   * @access Private (Admin/Staff)
   */
  @Get('activity/recent')
  async getRecentActivities(@Query('limit') limit?: number) {
    return this.systemService.getRecentActivities(limit ? parseInt(limit.toString()) : 10);
  }

  /**
   * Get settings by category
   * @route GET /system/settings/category/:category
   * @access Private (Admin/Staff)
   */
  @Get('settings/category/:category')
  async getSettingsByCategory(@Param('category') category: string) {
    return this.systemService.getSettingsByCategory(category);
  }

  /**
   * Search system activities
   * @route GET /system/activity/search/:query
   * @access Private (Admin/Staff)
   */
  @Get('activity/search/:query')
  async searchActivities(@Param('query') query: string) {
    return this.systemService.searchActivities(query);
  }

  /**
   * Get system activity by ID
   * @route GET /system/activity/:id
   * @access Private (Admin/Staff)
   */
  @Get('activity/:id')
  async findActivityById(@Param('id') id: string) {
    return this.systemService.findActivityById(id);
  }

  /**
   * Get system setting by ID
   * @route GET /system/settings/:id
   * @access Private (Admin/Staff)
   */
  @Get('settings/:id')
  async findSettingById(@Param('id') id: string) {
    return this.systemService.findSettingById(id);
  }

  /**
   * Update system setting
   * @route PUT /system/settings/:id
   * @access Private (Admin)
   */
  @Put('settings/:id')
  async updateSetting(@Param('id') id: string, @Body() updateSettingsDto: UpdateSystemSettingsDto) {
    return this.systemService.updateSetting(id, updateSettingsDto as any);
  }
}
