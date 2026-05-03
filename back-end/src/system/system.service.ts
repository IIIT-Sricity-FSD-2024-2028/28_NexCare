import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { ArrayUtil } from '../common/utils/array.util';
import { SystemActivity, SystemSettings, CreateSystemActivityRequest, UpdateSystemSettingsRequest, SystemStats } from './interfaces/system.interface';

/**
 * System Service
 * Manages audit logs and system configuration in the NexCare system
 * Handles system activity tracking and settings management
 */
@Injectable()
export class SystemService {
  // In-memory mock system activity database (aligned with frontend db.js)
  private systemActivity: SystemActivity[] = [
    {
      id: 'ACT-001',
      timestamp: '2026-04-02T10:15:00Z',
      userId: 'U002',
      action: 'Login',
      details: 'User logged in successfully',
      module: 'Authentication',
      severity: 'INFO',
      createdAt: '2026-04-02T10:15:00Z'
    },
    {
      id: 'ACT-002',
      timestamp: '2026-04-02T10:20:00Z',
      userId: 'U002',
      action: 'View',
      details: 'Viewed patient directory',
      module: 'Patients',
      severity: 'INFO',
      createdAt: '2026-04-02T10:20:00Z'
    },
    {
      id: 'ACT-003',
      timestamp: '2026-04-02T10:25:00Z',
      userId: 'U003',
      action: 'Dispatch',
      details: 'Ambulance dispatched to 742 Evergreen Terrace',
      module: 'Ambulance',
      severity: 'HIGH',
      createdAt: '2026-04-02T10:25:00Z'
    },
    {
      id: 'ACT-004',
      timestamp: '2026-04-02T11:00:00Z',
      userId: 'U005',
      action: 'Create',
      details: 'Created appointment for John Anderson',
      module: 'Appointments',
      severity: 'INFO',
      createdAt: '2026-04-02T11:00:00Z'
    },
    {
      id: 'ACT-005',
      timestamp: '2026-04-02T14:30:00Z',
      userId: 'U002',
      action: 'Create',
      details: 'Generated bill for Maria Garcia',
      module: 'Billing',
      severity: 'INFO',
      createdAt: '2026-04-02T14:30:00Z'
    }
  ];

  // In-memory mock system settings database (aligned with frontend db.js)
  private systemSettings: SystemSettings[] = [
    {
      id: 'SET-001',
      key: 'hospitalName',
      value: 'NexCare Hospital',
      description: 'Hospital name for display purposes',
      category: 'General',
      updatedAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'SET-002',
      key: 'maxAppointmentsPerDay',
      value: '50',
      description: 'Maximum number of appointments allowed per day',
      category: 'Appointments',
      updatedAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'SET-003',
      key: 'emergencyContact',
      value: '911',
      description: 'Emergency contact number',
      category: 'Emergency',
      updatedAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'SET-004',
      key: 'appointmentReminderHours',
      value: '24',
      description: 'Hours before appointment to send reminder',
      category: 'Appointments',
      updatedAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'SET-005',
      key: 'lowStockThreshold',
      value: '20',
      description: 'Percentage threshold for low stock alerts',
      category: 'Inventory',
      updatedAt: '2026-01-01T00:00:00Z'
    }
  ];

  /**
   * Get all system activity with optional filtering
   * @param userId Optional user filter
   * @param module Optional module filter
   * @param severity Optional severity filter
   * @returns List of system activities
   */
  async findAllActivity(userId?: string, module?: string, severity?: string) {
    try {
      let filteredActivity = [...this.systemActivity];

      // Apply user filter
      if (userId) {
        filteredActivity = filteredActivity.filter(activity => activity.userId === userId);
      }

      // Apply module filter
      if (module) {
        filteredActivity = filteredActivity.filter(activity => activity.module === module);
      }

      // Apply severity filter
      if (severity) {
        filteredActivity = filteredActivity.filter(activity => activity.severity === severity);
      }

      // Sort by timestamp (newest first)
      filteredActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return ResponseUtil.success('System activity retrieved successfully', filteredActivity);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve system activity');
    }
  }

  /**
   * Get system activity by ID
   * @param id Activity ID
   * @returns Activity data
   */
  async findActivityById(id: string) {
    try {
      const activity = ArrayUtil.findById(this.systemActivity, id);
      
      if (!activity) {
        return ResponseUtil.notFound('System activity', id);
      }

      return ResponseUtil.success('System activity retrieved successfully', activity);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve system activity');
    }
  }

  /**
   * Create new system activity
   * @param activityData Activity creation data
   * @returns Created activity data
   */
  async createActivity(activityData: CreateSystemActivityRequest) {
    try {
      // Generate new activity ID
      const newActivityId = IdGenerator.generateSystemActivityId();

      // Create new activity
      const newActivity: SystemActivity = {
        id: newActivityId,
        timestamp: new Date().toISOString(),
        userId: activityData.userId,
        action: activityData.action,
        details: activityData.details,
        module: activityData.module,
        severity: activityData.severity,
        createdAt: new Date().toISOString()
      };

      // Add to activity array
      this.systemActivity.push(newActivity);

      return ResponseUtil.created('System activity created successfully', newActivity);
    } catch (error) {
      return ResponseUtil.serverError('Failed to create system activity');
    }
  }

  /**
   * Get all system settings with optional filtering
   * @param category Optional category filter
   * @returns List of system settings
   */
  async findAllSettings(category?: string) {
    try {
      let filteredSettings = [...this.systemSettings];

      // Apply category filter
      if (category) {
        filteredSettings = filteredSettings.filter(setting => setting.category === category);
      }

      return ResponseUtil.success('System settings retrieved successfully', filteredSettings);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve system settings');
    }
  }

  /**
   * Get system setting by ID
   * @param id Setting ID
   * @returns Setting data
   */
  async findSettingById(id: string) {
    try {
      const setting = ArrayUtil.findById(this.systemSettings, id);
      
      if (!setting) {
        return ResponseUtil.notFound('System setting', id);
      }

      return ResponseUtil.success('System setting retrieved successfully', setting);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve system setting');
    }
  }

  /**
   * Get system setting by key
   * @param key Setting key
   * @returns Setting data
   */
  async findSettingByKey(key: string) {
    try {
      const setting = this.systemSettings.find(s => s.key === key);
      
      if (!setting) {
        return ResponseUtil.notFound('System setting with key', key);
      }

      return ResponseUtil.success('System setting retrieved successfully', setting);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve system setting');
    }
  }

  /**
   * Update system setting
   * @param id Setting ID
   * @param updateData Setting update data
   * @returns Updated setting data
   */
  async updateSetting(id: string, updateData: UpdateSystemSettingsRequest) {
    try {
      const updatedSetting = ArrayUtil.updateById(this.systemSettings, id, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });

      if (!updatedSetting) {
        return ResponseUtil.notFound('System setting', id);
      }

      return ResponseUtil.updated('System setting updated successfully', updatedSetting);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update system setting');
    }
  }

  /**
   * Get system statistics
   * @returns System statistics
   */
  async getStats() {
    try {
      const totalActivities = this.systemActivity.length;
      
      // Activities today
      const today = new Date().toDateString();
      const activitiesToday = this.systemActivity.filter(a => 
        new Date(a.timestamp).toDateString() === today
      ).length;

      // Activities by module
      const activitiesByModule: Record<string, number> = {};
      this.systemActivity.forEach(activity => {
        activitiesByModule[activity.module] = (activitiesByModule[activity.module] || 0) + 1;
      });

      // Activities by severity
      const activitiesBySeverity: Record<string, number> = {};
      this.systemActivity.forEach(activity => {
        activitiesBySeverity[activity.severity] = (activitiesBySeverity[activity.severity] || 0) + 1;
      });

      // Settings statistics
      const totalSettings = this.systemSettings.length;
      const settingsByCategory: Record<string, number> = {};
      this.systemSettings.forEach(setting => {
        settingsByCategory[setting.category] = (settingsByCategory[setting.category] || 0) + 1;
      });

      // System uptime (actual calculation)
      const systemStartTime = new Date('2024-01-01T00:00:00Z'); // System start date
      const currentTime = new Date();
      const systemUptime = Math.floor((currentTime.getTime() - systemStartTime.getTime()) / (1000 * 60 * 60 * 24)); // days

      // Last activity
      const lastActivity = this.systemActivity.length > 0 
        ? this.systemActivity[this.systemActivity.length - 1].timestamp
        : undefined;

      const stats: SystemStats = {
        totalActivities,
        activitiesToday,
        activitiesByModule,
        activitiesBySeverity,
        totalSettings,
        settingsByCategory,
        systemUptime,
        lastActivity
      };

      return ResponseUtil.success('System statistics retrieved successfully', stats);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve system statistics');
    }
  }

  /**
   * Get activities by date range
   * @param startDate Start date
   * @param endDate End date
   * @returns Activities in date range
   */
  async getActivitiesByDateRange(startDate: string, endDate: string) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const activitiesInRange = this.systemActivity.filter(activity => {
        const activityDate = new Date(activity.timestamp);
        return activityDate >= start && activityDate <= end;
      });

      // Sort by timestamp (newest first)
      activitiesInRange.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return ResponseUtil.success(`Activities from ${startDate} to ${endDate} retrieved successfully`, activitiesInRange);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve activities by date range');
    }
  }

  /**
   * Get activities by user
   * @param userId User ID
   * @returns User activities
   */
  async getActivitiesByUser(userId: string) {
    try {
      const activities = this.systemActivity.filter(a => a.userId === userId);
      
      // Sort by timestamp (newest first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return ResponseUtil.success(`Activities for user ${userId} retrieved successfully`, activities);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve user activities');
    }
  }

  /**
   * Get recent activities
   * @param limit Number of recent activities to return
   * @returns Recent activities
   */
  async getRecentActivities(limit: number = 10) {
    try {
      // Sort by timestamp (newest first) and limit
      const recentActivities = [...this.systemActivity]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      return ResponseUtil.success('Recent activities retrieved successfully', recentActivities);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve recent activities');
    }
  }

  /**
   * Get settings by category
   * @param category Category name
   * @returns Category settings
   */
  async getSettingsByCategory(category: string) {
    try {
      const settings = this.systemSettings.filter(s => s.category === category);
      
      return ResponseUtil.success(`Settings in category '${category}' retrieved successfully`, settings);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve category settings');
    }
  }

  /**
   * Search system activities
   * @param query Search query
   * @returns Matching activities
   */
  async searchActivities(query: string) {
    try {
      const searchTerm = query.toLowerCase();
      const matchingActivities = this.systemActivity.filter(activity => 
        activity.action.toLowerCase().includes(searchTerm) ||
        activity.details.toLowerCase().includes(searchTerm) ||
        activity.module.toLowerCase().includes(searchTerm) ||
        activity.severity.toLowerCase().includes(searchTerm)
      );

      // Sort by timestamp (newest first)
      matchingActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return ResponseUtil.success('Search results retrieved successfully', matchingActivities);
    } catch (error) {
      return ResponseUtil.serverError('Failed to search activities');
    }
  }
}
