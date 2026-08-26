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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveRequestGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const leaves_service_1 = require("../leaves.service");
const api_response_interface_1 = require("../../common/interfaces/api-response.interface");
let LeaveRequestGuard = class LeaveRequestGuard {
    constructor(reflector, leavesService) {
        this.reflector = reflector;
        this.leavesService = leavesService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const method = request.method;
        if (method === 'POST') {
            return this.validateLeaveApplication(request);
        }
        if (method === 'PATCH') {
            return this.validateLeaveApproval(request);
        }
        return true;
    }
    async validateLeaveApplication(request) {
        const { doctorId, startDate, endDate } = request.body || {};
        const effectiveDoctorId = doctorId || request.user?.sub || request.user?.id || request.user?.userId;
        if (!effectiveDoctorId || !startDate || !endDate) {
            return true;
        }
        const hasOverlap = await this.leavesService.hasOverlappingLeave(effectiveDoctorId, startDate, endDate);
        if (hasOverlap) {
            throw new common_1.ConflictException('You already have an approved leave during this period. Please choose different dates.');
        }
        return true;
    }
    validateLeaveApproval(request) {
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('Authentication required');
        }
        if (user.role !== api_response_interface_1.UserRole.HOSPITAL_MANAGER && user.role !== api_response_interface_1.UserRole.SUPERUSER) {
            throw new common_1.ForbiddenException('Only hospital managers and superusers can approve or reject leave requests');
        }
        return true;
    }
};
exports.LeaveRequestGuard = LeaveRequestGuard;
exports.LeaveRequestGuard = LeaveRequestGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        leaves_service_1.LeavesService])
], LeaveRequestGuard);
//# sourceMappingURL=leave-request.guard.js.map