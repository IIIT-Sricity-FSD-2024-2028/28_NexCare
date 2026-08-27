import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { ArrayUtil } from '../common/utils/array.util';
import { FileStore } from '../common/utils/file-store.util';
import { SystemActivity, SystemSettings, CreateSystemActivityRequest, UpdateSystemSettingsRequest, SystemStats } from './interfaces/system.interface';

/**
 * System Service
 * Manages audit logs and system configuration in the NexCare system.
 * Activity logs and settings are persisted to disk so the audit trail and
 * configuration survive restarts.
 */
@Injectable()
export class SystemService {
  private readonly activityStore = new FileStore<SystemActivity>('system-activity.json', () => SystemService.seedActivity());
  private readonly settingsStore = new FileStore<SystemSettings>('system-settings.json', () => SystemService.seedSettings());

  private static seedActivity(): SystemActivity[] {
    return [
      { id: 'ACT-001', timestamp: '2026-04-02T10:15:00Z', userId: 'U002', action: 'Login', details: 'User logged in successfully', module: 'Authentication', severity: 'INFO', createdAt: '2026-04-02T10:15:00Z' },
      { id: 'ACT-002', timestamp: '2026-04-02T10:20:00Z', userId: 'U002', action: 'View', details: 'Viewed patient directory', module: 'Patients', severity: 'INFO', createdAt: '2026-04-02T10:20:00Z' },
      { id: 'ACT-003', timestamp: '2026-04-02T10:25:00Z', userId: 'U003', action: 'Dispatch', details: 'Ambulance dispatched to 742 Evergreen Terrace', module: 'Ambulance', severity: 'HIGH', createdAt: '2026-04-02T10:25:00Z' },
      { id: 'ACT-004', timestamp: '2026-04-02T11:00:00Z', userId: 'U005', action: 'Create', details: 'Created appointment for John Anderson', module: 'Appointments', severity: 'INFO', createdAt: '2026-04-02T11:00:00Z' },
      { id: 'ACT-005', timestamp: '2026-04-02T14:30:00Z', userId: 'U002', action: 'Create', details: 'Generated bill for Maria Garcia', module: 'Billing', severity: 'INFO', createdAt: '2026-04-02T14:30:00Z' },
    ];
  }

  private static seedSettings(): SystemSettings[] {
    return [
      { id: 'SET-001', key: 'hospitalName', value: 'NexCare Hospital', description: 'Hospital name for display purposes', category: 'General', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'SET-002', key: 'maxAppointmentsPerDay', value: '50', description: 'Maximum number of appointments allowed per day', category: 'Appointments', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'SET-003', key: 'emergencyContact', value: '911', description: 'Emergency contact number', category: 'Emergency', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'SET-004', key: 'appointmentReminderHours', value: '24', description: 'Hours before appointment to send reminder', category: 'Appointments', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'SET-005', key: 'lowStockThreshold', value: '20', description: 'Percentage threshold for low stock alerts', category: 'Inventory', updatedAt: '2026-01-01T00:00:00Z' },
    ];
  }

  async findAllActivity(userId?: string, module?: string, severity?: string) {
    try {
      let filteredActivity = [...this.activityStore.load()];
      if (userId) filteredActivity = filteredActivity.filter(a => a.userId === userId);
      if (module) filteredActivity = filteredActivity.filter(a => a.module === module);
      if (severity) filteredActivity = filteredActivity.filter(a => a.severity === severity);
      filteredActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return ResponseUtil.success('System activity retrieved successfully', filteredActivity);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve system activity');
    }
  }

  async findActivityById(id: string) {
    try {
      const activity = ArrayUtil.findById(this.activityStore.load(), id);
      if (!activity) return ResponseUtil.notFound('System activity', id);
      return ResponseUtil.success('System activity retrieved successfully', activity);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve system activity');
    }
  }

  async createActivity(activityData: CreateSystemActivityRequest) {
    try {
      const activities = this.activityStore.load();
      const newActivity: SystemActivity = {
        id: IdGenerator.generateSystemActivityId(),
        timestamp: new Date().toISOString(),
        userId: activityData.userId,
        action: activityData.action,
        details: activityData.details,
        module: activityData.module,
        severity: activityData.severity,
        createdAt: new Date().toISOString(),
      };
      activities.push(newActivity);
      this.activityStore.save(activities);
      return ResponseUtil.created('System activity created successfully', newActivity);
    } catch (error) {
      return ResponseUtil.serverError('Failed to create system activity');
    }
  }

  async findAllSettings(category?: string) {
    try {
      let filteredSettings = [...this.settingsStore.load()];
      if (category) filteredSettings = filteredSettings.filter(s => s.category === category);
      return ResponseUtil.success('System settings retrieved successfully', filteredSettings);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve system settings');
    }
  }

  async findSettingById(id: string) {
    try {
      const setting = ArrayUtil.findById(this.settingsStore.load(), id);
      if (!setting) return ResponseUtil.notFound('System setting', id);
      return ResponseUtil.success('System setting retrieved successfully', setting);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve system setting');
    }
  }

  async findSettingByKey(key: string) {
    try {
      const setting = this.settingsStore.load().find(s => s.key === key);
      if (!setting) return ResponseUtil.notFound('System setting with key', key);
      return ResponseUtil.success('System setting retrieved successfully', setting);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve system setting');
    }
  }

  async updateSetting(id: string, updateData: UpdateSystemSettingsRequest) {
    try {
      const settings = this.settingsStore.load();
      const updatedSetting = ArrayUtil.updateById(settings, id, {
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
      if (!updatedSetting) return ResponseUtil.notFound('System setting', id);
      this.settingsStore.save(settings);
      return ResponseUtil.updated('System setting updated successfully', updatedSetting);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update system setting');
    }
  }

  /**
   * Bulk upsert settings from a plain key→value map.
   * Existing keys are updated; unknown keys are created.
   */
  async updateSettingsBulk(settingsMap: Record<string, any>) {
    try {
      if (!settingsMap || typeof settingsMap !== 'object' || Array.isArray(settingsMap)) {
        return ResponseUtil.error('Settings payload must be a key-value object');
      }

      const settings = this.settingsStore.load();
      const now = new Date().toISOString();
      for (const [key, value] of Object.entries(settingsMap)) {
        const existing = settings.find(s => s.key === key);
        if (existing) {
          existing.value = String(value);
          existing.updatedAt = now;
        } else {
          settings.push({
            id: IdGenerator.generate('SET-'),
            key,
            value: String(value),
            description: '',
            category: 'General',
            updatedAt: now,
          });
        }
      }
      this.settingsStore.save(settings);
      return ResponseUtil.updated('System settings updated successfully', settings);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update system settings');
    }
  }

  async getStats() {
    try {
      const systemActivity = this.activityStore.load();
      const systemSettings = this.settingsStore.load();
      const totalActivities = systemActivity.length;

      const today = new Date().toDateString();
      const activitiesToday = systemActivity.filter(a => new Date(a.timestamp).toDateString() === today).length;

      const activitiesByModule: Record<string, number> = {};
      systemActivity.forEach(a => { activitiesByModule[a.module] = (activitiesByModule[a.module] || 0) + 1; });

      const activitiesBySeverity: Record<string, number> = {};
      systemActivity.forEach(a => { activitiesBySeverity[a.severity] = (activitiesBySeverity[a.severity] || 0) + 1; });

      const totalSettings = systemSettings.length;
      const settingsByCategory: Record<string, number> = {};
      systemSettings.forEach(s => { settingsByCategory[s.category] = (settingsByCategory[s.category] || 0) + 1; });

      const systemStartTime = new Date('2024-01-01T00:00:00Z');
      const systemUptime = Math.floor((Date.now() - systemStartTime.getTime()) / (1000 * 60 * 60 * 24));

      const lastActivity = systemActivity.length > 0
        ? systemActivity[systemActivity.length - 1].timestamp
        : undefined;

      const stats: SystemStats = {
        totalActivities,
        activitiesToday,
        activitiesByModule,
        activitiesBySeverity,
        totalSettings,
        settingsByCategory,
        systemUptime,
        lastActivity,
      };
      return ResponseUtil.success('System statistics retrieved successfully', stats);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve system statistics');
    }
  }

  async getActivitiesByDateRange(startDate: string, endDate: string) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const activitiesInRange = this.activityStore.load().filter(activity => {
        const activityDate = new Date(activity.timestamp);
        return activityDate >= start && activityDate <= end;
      });
      activitiesInRange.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return ResponseUtil.success(`Activities from ${startDate} to ${endDate} retrieved successfully`, activitiesInRange);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve activities by date range');
    }
  }

  async getActivitiesByUser(userId: string) {
    try {
      const activities = this.activityStore.load().filter(a => a.userId === userId);
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return ResponseUtil.success(`Activities for user ${userId} retrieved successfully`, activities);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve user activities');
    }
  }

  async getRecentActivities(limit: number = 10) {
    try {
      const recentActivities = [...this.activityStore.load()]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
      return ResponseUtil.success('Recent activities retrieved successfully', recentActivities);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve recent activities');
    }
  }

  async getSettingsByCategory(category: string) {
    try {
      const settings = this.settingsStore.load().filter(s => s.category === category);
      return ResponseUtil.success(`Settings in category '${category}' retrieved successfully`, settings);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve category settings');
    }
  }

  async searchActivities(query: string) {
    try {
      const searchTerm = query.toLowerCase();
      const matchingActivities = this.activityStore.load().filter(activity =>
        activity.action.toLowerCase().includes(searchTerm) ||
        activity.details.toLowerCase().includes(searchTerm) ||
        activity.module.toLowerCase().includes(searchTerm) ||
        activity.severity.toLowerCase().includes(searchTerm)
      );
      matchingActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return ResponseUtil.success('Search results retrieved successfully', matchingActivities);
    } catch (error) {
      return ResponseUtil.serverError('Failed to search activities');
    }
  }
}
