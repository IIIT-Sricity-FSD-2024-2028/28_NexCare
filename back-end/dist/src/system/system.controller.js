"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const system_service_1 = require("./system.service");
const create_activity_dto_1 = require("./dto/create-activity.dto");
const update_settings_dto_1 = require("./dto/update-settings.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
let SystemController = class SystemController {
    constructor(systemService) {
        this.systemService = systemService;
    }
    async findAllActivity(userId, module, severity) {
        return this.systemService.findAllActivity(userId, module, severity);
    }
    async createActivity(createActivityDto) {
        return this.systemService.createActivity(createActivityDto);
    }
    async findAllSettings(category) {
        return this.systemService.findAllSettings(category);
    }
    async findSettingByKey(key) {
        return this.systemService.findSettingByKey(key);
    }
    async getStats() {
        return this.systemService.getStats();
    }
    async getActivitiesByDateRange(startDate, endDate) {
        return this.systemService.getActivitiesByDateRange(startDate, endDate);
    }
    async getActivitiesByUser(userId) {
        return this.systemService.getActivitiesByUser(userId);
    }
    async getRecentActivities(limit) {
        return this.systemService.getRecentActivities(limit ? parseInt(limit.toString()) : 10);
    }
    async getSettingsByCategory(category) {
        return this.systemService.getSettingsByCategory(category);
    }
    async searchActivities(query) {
        return this.systemService.searchActivities(query);
    }
    async findActivityById(id) {
        return this.systemService.findActivityById(id);
    }
    async findSettingById(id) {
        return this.systemService.findSettingById(id);
    }
    async updateSettingsBulk(settingsMap) {
        return this.systemService.updateSettingsBulk(settingsMap);
    }
    async updateSetting(id, updateSettingsDto) {
        return this.systemService.updateSetting(id, updateSettingsDto);
    }
};
exports.SystemController = SystemController;
__decorate([
    (0, common_1.Get)('activity'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system audit logs' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'module', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'severity', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of audit logs' }),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('module')),
    __param(2, (0, common_1.Query)('severity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], SystemController.prototype, "findAllActivity", null);
__decorate([
    (0, common_1.Post)('activity'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Log a new system activity' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Activity logging result (check success field)' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_activity_dto_1.CreateSystemActivityDto]),
    __metadata("design:returntype", Promise)
], SystemController.prototype, "createActivity", null);
__decorate([
    (0, common_1.Get)('settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all system settings' }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of system settings' }),
    __param(0, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SystemController.prototype, "findAllSettings", null);
__decorate([
    (0, common_1.Get)('settings/key/:key'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system setting by key' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'System setting retrieved' }),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SystemController.prototype, "findSettingByKey", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'System statistics retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SystemController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('activity/date-range'),
    (0, swagger_1.ApiOperation)({ summary: 'Get activities by date range' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', type: String }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Activities retrieved' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SystemController.prototype, "getActivitiesByDateRange", null);
__decorate([
    (0, common_1.Get)('activity/user/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get activities by user ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User activities retrieved' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SystemController.prototype, "getActivitiesByUser", null);
__decorate([
    (0, common_1.Get)('activity/recent'),
    (0, swagger_1.ApiOperation)({ summary: 'Get recent activities' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', type: Number, required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Recent activities retrieved' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SystemController.prototype, "getRecentActivities", null);
__decorate([
    (0, common_1.Get)('settings/category/:category'),
    (0, swagger_1.ApiOperation)({ summary: 'Get settings by category' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Category settings retrieved' }),
    __param(0, (0, common_1.Param)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SystemController.prototype, "getSettingsByCategory", null);
__decorate([
    (0, common_1.Get)('activity/search/:query'),
    (0, swagger_1.ApiOperation)({ summary: 'Search system activities' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Search results' }),
    __param(0, (0, common_1.Param)('query')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SystemController.prototype, "searchActivities", null);
__decorate([
    (0, common_1.Get)('activity/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get activity by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Activity details retrieved' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SystemController.prototype, "findActivityById", null);
__decorate([
    (0, common_1.Get)('settings/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get setting by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Setting details retrieved' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SystemController.prototype, "findSettingById", null);
__decorate([
    (0, common_1.Put)('settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk update system settings (key→value map)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Settings updated successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SystemController.prototype, "updateSettingsBulk", null);
__decorate([
    (0, common_1.Put)('settings/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update system setting' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Setting updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_settings_dto_1.UpdateSystemSettingsDto]),
    __metadata("design:returntype", Promise)
], SystemController.prototype, "updateSetting", null);
exports.SystemController = SystemController = __decorate([
    (0, swagger_1.ApiTags)('System'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF),
    (0, common_1.Controller)('system'),
    __metadata("design:paramtypes", [system_service_1.SystemService])
], SystemController);
//# sourceMappingURL=system.controller.js.map