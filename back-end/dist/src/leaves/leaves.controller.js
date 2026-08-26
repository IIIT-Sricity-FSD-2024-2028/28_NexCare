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
exports.LeavesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const leaves_service_1 = require("./leaves.service");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
const leave_request_guard_1 = require("./guards/leave-request.guard");
let LeavesController = class LeavesController {
    constructor(leavesService) {
        this.leavesService = leavesService;
    }
    async findAll(doctorId, hospitalId, status) {
        return this.leavesService.findAll(doctorId, hospitalId, status);
    }
    async getCalendarView(hospitalId, startDate, endDate) {
        return this.leavesService.getCalendarView(hospitalId, startDate, endDate);
    }
    async findById(id) {
        return this.leavesService.findById(id);
    }
    async create(createLeaveDto) {
        return this.leavesService.create(createLeaveDto);
    }
    async update(id, updateLeaveDto) {
        return this.leavesService.update(id, updateLeaveDto);
    }
    async delete(id) {
        return this.leavesService.delete(id);
    }
};
exports.LeavesController = LeavesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all leaves' }),
    (0, swagger_1.ApiQuery)({ name: 'doctorId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'hospitalId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: api_response_interface_1.LeaveStatus }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of leaves' }),
    __param(0, (0, common_1.Query)('doctorId')),
    __param(1, (0, common_1.Query)('hospitalId')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], LeavesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('calendar'),
    (0, swagger_1.ApiOperation)({ summary: 'Get calendar view of approved leaves' }),
    (0, swagger_1.ApiQuery)({ name: 'hospitalId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Calendar view of approved leaves' }),
    __param(0, (0, common_1.Query)('hospitalId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], LeavesController.prototype, "getCalendarView", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get leave by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Leave details' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LeavesController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(leave_request_guard_1.LeaveRequestGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Apply for leave' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Leave request submitted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Conflict - overlapping approved leave' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LeavesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(leave_request_guard_1.LeaveRequestGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Approve or reject leave request' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Leave status updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - insufficient permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Leave not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LeavesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a leave request' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Leave deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Leave not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LeavesController.prototype, "delete", null);
exports.LeavesController = LeavesController = __decorate([
    (0, swagger_1.ApiTags)('Leaves'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.HOSPITAL_MANAGER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF),
    (0, common_1.Controller)('leaves'),
    (0, common_1.UseGuards)(leave_request_guard_1.LeaveRequestGuard),
    __metadata("design:paramtypes", [leaves_service_1.LeavesService])
], LeavesController);
//# sourceMappingURL=leaves.controller.js.map