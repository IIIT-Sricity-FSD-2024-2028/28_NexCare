"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemService = void 0;
const common_1 = require("@nestjs/common");
const response_util_1 = require("../common/utils/response.util");
const id_generator_util_1 = require("../common/utils/id-generator.util");
const array_util_1 = require("../common/utils/array.util");
let SystemService = class SystemService {
    constructor() {
        this.systemActivity = [
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
        this.systemSettings = [
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
    }
    async findAllActivity(userId, module, severity) {
        try {
            let filteredActivity = [...this.systemActivity];
            if (userId) {
                filteredActivity = filteredActivity.filter(activity => activity.userId === userId);
            }
            if (module) {
                filteredActivity = filteredActivity.filter(activity => activity.module === module);
            }
            if (severity) {
                filteredActivity = filteredActivity.filter(activity => activity.severity === severity);
            }
            filteredActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            return response_util_1.ResponseUtil.success('System activity retrieved successfully', filteredActivity);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve system activity');
        }
    }
    async findActivityById(id) {
        try {
            const activity = array_util_1.ArrayUtil.findById(this.systemActivity, id);
            if (!activity) {
                return response_util_1.ResponseUtil.notFound('System activity', id);
            }
            return response_util_1.ResponseUtil.success('System activity retrieved successfully', activity);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve system activity');
        }
    }
    async createActivity(activityData) {
        try {
            const newActivityId = id_generator_util_1.IdGenerator.generateSystemActivityId();
            const newActivity = {
                id: newActivityId,
                timestamp: new Date().toISOString(),
                userId: activityData.userId,
                action: activityData.action,
                details: activityData.details,
                module: activityData.module,
                severity: activityData.severity,
                createdAt: new Date().toISOString()
            };
            this.systemActivity.push(newActivity);
            return response_util_1.ResponseUtil.created('System activity created successfully', newActivity);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to create system activity');
        }
    }
    async findAllSettings(category) {
        try {
            let filteredSettings = [...this.systemSettings];
            if (category) {
                filteredSettings = filteredSettings.filter(setting => setting.category === category);
            }
            return response_util_1.ResponseUtil.success('System settings retrieved successfully', filteredSettings);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve system settings');
        }
    }
    async findSettingById(id) {
        try {
            const setting = array_util_1.ArrayUtil.findById(this.systemSettings, id);
            if (!setting) {
                return response_util_1.ResponseUtil.notFound('System setting', id);
            }
            return response_util_1.ResponseUtil.success('System setting retrieved successfully', setting);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve system setting');
        }
    }
    async findSettingByKey(key) {
        try {
            const setting = this.systemSettings.find(s => s.key === key);
            if (!setting) {
                return response_util_1.ResponseUtil.notFound('System setting with key', key);
            }
            return response_util_1.ResponseUtil.success('System setting retrieved successfully', setting);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve system setting');
        }
    }
    async updateSetting(id, updateData) {
        try {
            const updatedSetting = array_util_1.ArrayUtil.updateById(this.systemSettings, id, {
                ...updateData,
                updatedAt: new Date().toISOString()
            });
            if (!updatedSetting) {
                return response_util_1.ResponseUtil.notFound('System setting', id);
            }
            return response_util_1.ResponseUtil.updated('System setting updated successfully', updatedSetting);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update system setting');
        }
    }
    async getStats() {
        try {
            const totalActivities = this.systemActivity.length;
            const today = new Date().toDateString();
            const activitiesToday = this.systemActivity.filter(a => new Date(a.timestamp).toDateString() === today).length;
            const activitiesByModule = {};
            this.systemActivity.forEach(activity => {
                activitiesByModule[activity.module] = (activitiesByModule[activity.module] || 0) + 1;
            });
            const activitiesBySeverity = {};
            this.systemActivity.forEach(activity => {
                activitiesBySeverity[activity.severity] = (activitiesBySeverity[activity.severity] || 0) + 1;
            });
            const totalSettings = this.systemSettings.length;
            const settingsByCategory = {};
            this.systemSettings.forEach(setting => {
                settingsByCategory[setting.category] = (settingsByCategory[setting.category] || 0) + 1;
            });
            const systemStartTime = new Date('2024-01-01T00:00:00Z');
            const currentTime = new Date();
            const systemUptime = Math.floor((currentTime.getTime() - systemStartTime.getTime()) / (1000 * 60 * 60 * 24));
            const lastActivity = this.systemActivity.length > 0
                ? this.systemActivity[this.systemActivity.length - 1].timestamp
                : undefined;
            const stats = {
                totalActivities,
                activitiesToday,
                activitiesByModule,
                activitiesBySeverity,
                totalSettings,
                settingsByCategory,
                systemUptime,
                lastActivity
            };
            return response_util_1.ResponseUtil.success('System statistics retrieved successfully', stats);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve system statistics');
        }
    }
    async getActivitiesByDateRange(startDate, endDate) {
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const activitiesInRange = this.systemActivity.filter(activity => {
                const activityDate = new Date(activity.timestamp);
                return activityDate >= start && activityDate <= end;
            });
            activitiesInRange.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            return response_util_1.ResponseUtil.success(`Activities from ${startDate} to ${endDate} retrieved successfully`, activitiesInRange);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve activities by date range');
        }
    }
    async getActivitiesByUser(userId) {
        try {
            const activities = this.systemActivity.filter(a => a.userId === userId);
            activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            return response_util_1.ResponseUtil.success(`Activities for user ${userId} retrieved successfully`, activities);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve user activities');
        }
    }
    async getRecentActivities(limit = 10) {
        try {
            const recentActivities = [...this.systemActivity]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, limit);
            return response_util_1.ResponseUtil.success('Recent activities retrieved successfully', recentActivities);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve recent activities');
        }
    }
    async getSettingsByCategory(category) {
        try {
            const settings = this.systemSettings.filter(s => s.category === category);
            return response_util_1.ResponseUtil.success(`Settings in category '${category}' retrieved successfully`, settings);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve category settings');
        }
    }
    async searchActivities(query) {
        try {
            const searchTerm = query.toLowerCase();
            const matchingActivities = this.systemActivity.filter(activity => activity.action.toLowerCase().includes(searchTerm) ||
                activity.details.toLowerCase().includes(searchTerm) ||
                activity.module.toLowerCase().includes(searchTerm) ||
                activity.severity.toLowerCase().includes(searchTerm));
            matchingActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            return response_util_1.ResponseUtil.success('Search results retrieved successfully', matchingActivities);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to search activities');
        }
    }
};
exports.SystemService = SystemService;
exports.SystemService = SystemService = __decorate([
    (0, common_1.Injectable)()
], SystemService);
//# sourceMappingURL=system.service.js.map