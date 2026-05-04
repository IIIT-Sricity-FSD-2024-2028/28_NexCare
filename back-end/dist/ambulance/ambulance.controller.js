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
const ambulance_service_1 = require("./ambulance.service");
const create_request_dto_1 = require("./dto/create-request.dto");
const update_request_dto_1 = require("./dto/update-request.dto");
const dto_validator_util_1 = require("../common/validation/dto-validator.util");
let AmbulanceController = class AmbulanceController {
    constructor(ambulanceService) {
        this.ambulanceService = ambulanceService;
    }
    async findAll(patientId, status) {
        return this.ambulanceService.findAll(patientId, status);
    }
    async create(createRequestDto) {
        const validation = dto_validator_util_1.DtoValidatorUtil.validateAmbulanceRequest(createRequestDto);
        if (!validation.isValid) {
            throw new common_1.BadRequestException({
                message: 'Validation failed',
                errors: validation.errors,
                fieldErrors: validation.fieldErrors
            });
        }
        return this.ambulanceService.create(createRequestDto);
    }
    async getStats() {
        return this.ambulanceService.getStats();
    }
    async findByPatient(patientId) {
        return this.ambulanceService.findByPatient(patientId);
    }
    async getActiveRequests() {
        return this.ambulanceService.getActiveRequests();
    }
    async findByAssignedStaff(assignedTo) {
        return this.ambulanceService.findByAssignedStaff(assignedTo);
    }
    async findById(id) {
        return this.ambulanceService.findById(id);
    }
    async update(id, updateRequestDto) {
        return this.ambulanceService.update(id, updateRequestDto);
    }
    async patchUpdate(id, updateRequestDto) {
        return this.ambulanceService.update(id, updateRequestDto);
    }
    async delete(id) {
        return this.ambulanceService.delete(id);
    }
    async dispatch(id, assignedTo) {
        return this.ambulanceService.dispatch(id, assignedTo);
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
    __param(0, (0, common_1.Query)('patientId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_request_dto_1.CreateAmbulanceRequestDto]),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('patient/:patientId'),
    __param(0, (0, common_1.Param)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "findByPatient", null);
__decorate([
    (0, common_1.Get)('active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "getActiveRequests", null);
__decorate([
    (0, common_1.Get)('assigned/:assignedTo'),
    __param(0, (0, common_1.Param)('assignedTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "findByAssignedStaff", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_request_dto_1.UpdateAmbulanceRequestDto]),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_request_dto_1.UpdateAmbulanceRequestDto]),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "patchUpdate", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "delete", null);
__decorate([
    (0, common_1.Patch)(':id/dispatch'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('assignedTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "dispatch", null);
__decorate([
    (0, common_1.Patch)(':id/complete'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "complete", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AmbulanceController.prototype, "updateStatus", null);
exports.AmbulanceController = AmbulanceController = __decorate([
    (0, common_1.Controller)('ambulance'),
    __metadata("design:paramtypes", [ambulance_service_1.AmbulanceService])
], AmbulanceController);
//# sourceMappingURL=ambulance.controller.js.map