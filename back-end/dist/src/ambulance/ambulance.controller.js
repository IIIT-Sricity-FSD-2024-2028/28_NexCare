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
exports.AmbulanceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ambulance_service_1 = require("./ambulance.service");
const create_request_dto_1 = require("./dto/create-request.dto");
const update_request_dto_1 = require("./dto/update-request.dto");
const dispatch_ambulance_dto_1 = require("./dto/dispatch-ambulance.dto");
const dto_validator_util_1 = require("../common/validation/dto-validator.util");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
let AmbulanceController = class AmbulanceController {
    constructor(ambulanceService) {
        this.ambulanceService = ambulanceService;
    }
    isPatient(req) {
        return req?.user?.role === api_response_interface_1.UserRole.PATIENT;
    }
    scopeHospitalId(req) {
        const user = req?.user;
        if (user?.role === api_response_interface_1.UserRole.SUPERUSER || user?.role === api_response_interface_1.UserRole.PATIENT)
            return undefined;
        return user?.hospitalId;
    }
    async assertOwnsRequest(req, id) {
        if (!this.isPatient(req))
            return;
        const res = await this.ambulanceService.findById(id);
        if (res?.success && res.data && res.data.patientId !== req.user.patientId) {
            throw new common_1.ForbiddenException('You can only access your own ambulance requests.');
        }
    }
    async findAll(req, patientId, status) {
        if (this.isPatient(req)) {
            patientId = req.user.patientId;
        }
        return this.ambulanceService.findAll(patientId, status, this.scopeHospitalId(req));
    }
    async create(req, createRequestDto) {
        const validation = dto_validator_util_1.DtoValidatorUtil.validateAmbulanceRequest(createRequestDto);
        if (!validation.isValid) {
            throw new common_1.BadRequestException({
                message: 'Validation failed',
                errors: validation.errors,
                fieldErrors: validation.fieldErrors
            });
        }
        const dto = { ...createRequestDto };
        if (this.isPatient(req)) {
            dto.patientId = req.user.patientId;
        }
        const scopedHospital = this.scopeHospitalId(req);
        if (scopedHospital)
            dto.hospitalId = scopedHospital;
        return this.ambulanceService.create(dto);
    }
    async getStats() {
        return this.ambulanceService.getStats();
    }
    async findByPatient(req, patientId) {
        if (this.isPatient(req) && patientId !== req.user.patientId) {
            throw new common_1.ForbiddenException('You can only view your own ambulance requests.');
        }
        return this.ambulanceService.findByPatient(patientId);
    }
    async getActiveRequests() {
        return this.ambulanceService.getActiveRequests();
    }
    async findByAssignedStaff(assignedTo) {
        return this.ambulanceService.findByAssignedStaff(assignedTo);
    }
    async findById(req, id) {
        await this.assertOwnsRequest(req, id);
        return this.ambulanceService.findById(id);
    }
    async update(id, updateRequestDto) {
        return this.ambulanceService.update(id, updateRequestDto);
    }
    async patchUpdate(id, updateRequestDto) {
        return this.ambulanceService.update(id, updateRequestDto);
    }
    async delete(req, id) {
        await this.assertOwnsRequest(req, id);
        return this.ambulanceService.delete(id);
    }
    async dispatch(id, dispatchDto) {
        return this.ambulanceService.dispatch(id, dispatchDto.assignedTo);
    }
    async complete(id) {
        return this.ambulanceService.complete(id);
    }
    async updateStatus(id, status) {
        return this.ambulanceService.updateStatus(id, status);
    }
};
exports.AmbulanceController = AmbulanceController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF, api_response_interface_1.UserRole.AMBULANCE, api_response_interface_1.UserRole.PATIENT, api_response_interface_1.UserRole.REGIONAL_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Get all ambulance requests (patients: only their own)' }),
    (0, swagger_1.ApiQuery)({ name: 'patientId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: api_response_interface_1.AmbulanceStatus }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of ambulance requests' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('patientId')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF, api_response_interface_1.UserRole.AMBULANCE, api_response_interface_1.UserRole.PATIENT),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Create an ambulance request' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request creation result (check success field)' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_request_dto_1.CreateAmbulanceRequestDto]),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    (0, swagger_1.ApiOperation)({ summary: 'Get ambulance statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Ambulance statistics retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('patient/:patientId'),
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF, api_response_interface_1.UserRole.AMBULANCE, api_response_interface_1.UserRole.PATIENT),
    (0, swagger_1.ApiOperation)({ summary: 'Get ambulance requests by patient ID (patients: own only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Patient requests retrieved' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "findByPatient", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all active ambulance requests' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Active requests retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "getActiveRequests", null);
__decorate([
    (0, common_1.Get)('assigned/:assignedTo'),
    (0, swagger_1.ApiOperation)({ summary: 'Get ambulance requests by assigned staff' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Staff assigned requests retrieved' }),
    __param(0, (0, common_1.Param)('assignedTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "findByAssignedStaff", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF, api_response_interface_1.UserRole.AMBULANCE, api_response_interface_1.UserRole.PATIENT),
    (0, swagger_1.ApiOperation)({ summary: 'Get ambulance request by ID (patients: own only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request details retrieved' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an ambulance request' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_request_dto_1.UpdateAmbulanceRequestDto]),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Partially update an ambulance request' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_request_dto_1.UpdateAmbulanceRequestDto]),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "patchUpdate", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF, api_response_interface_1.UserRole.AMBULANCE, api_response_interface_1.UserRole.PATIENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete/cancel an ambulance request (patients: own only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request deleted successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "delete", null);
__decorate([
    (0, common_1.Patch)(':id/dispatch'),
    (0, swagger_1.ApiOperation)({ summary: 'Dispatch an ambulance' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Ambulance dispatched successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dispatch_ambulance_dto_1.DispatchAmbulanceDto]),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "dispatch", null);
__decorate([
    (0, common_1.Patch)(':id/complete'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark an ambulance request as completed' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request completed successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "complete", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update ambulance request status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "updateStatus", null);
exports.AmbulanceController = AmbulanceController = __decorate([
    (0, swagger_1.ApiTags)('Ambulance'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF, api_response_interface_1.UserRole.AMBULANCE),
    (0, common_1.Controller)('ambulance'),
    __metadata("design:paramtypes", [ambulance_service_1.AmbulanceService])
], AmbulanceController);
//# sourceMappingURL=ambulance.controller.js.map