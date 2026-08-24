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
exports.HospitalsController = void 0;
const common_1 = require("@nestjs/common");
const hospitals_service_1 = require("./hospitals.service");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const api_response_interface_2 = require("../common/interfaces/api-response.interface");
const public_decorator_1 = require("../common/decorators/public.decorator");
let HospitalsController = class HospitalsController {
    constructor(hospitalsService) {
        this.hospitalsService = hospitalsService;
    }
    async findAll(status) {
        return this.hospitalsService.findAll(status);
    }
    async findNearby(city, state, pincode) {
        return this.hospitalsService.findNearby(city, state, pincode);
    }
    async findById(id) {
        return this.hospitalsService.findById(id);
    }
    async register(data) {
        return this.hospitalsService.create(data);
    }
    async update(id, data) {
        return this.hospitalsService.update(id, data);
    }
    async verify(id) {
        return this.hospitalsService.update(id, { verificationStatus: api_response_interface_1.VerificationStatus.VERIFIED });
    }
    async reject(id) {
        return this.hospitalsService.update(id, { verificationStatus: api_response_interface_1.VerificationStatus.REJECTED });
    }
    async assignManager(id, managerId) {
        return this.hospitalsService.update(id, { assignedManagerId: managerId });
    }
};
exports.HospitalsController = HospitalsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HospitalsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('nearby'),
    __param(0, (0, common_1.Query)('city')),
    __param(1, (0, common_1.Query)('state')),
    __param(2, (0, common_1.Query)('pincode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], HospitalsController.prototype, "findNearby", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HospitalsController.prototype, "findById", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HospitalsController.prototype, "register", null);
__decorate([
    (0, roles_decorator_1.Roles)(api_response_interface_2.UserRole.SUPERUSER, api_response_interface_2.UserRole.REGIONAL_MANAGER, api_response_interface_2.UserRole.HOSPITAL_MANAGER),
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], HospitalsController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)(api_response_interface_2.UserRole.SUPERUSER, api_response_interface_2.UserRole.REGIONAL_MANAGER),
    (0, common_1.Patch)(':id/verify'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HospitalsController.prototype, "verify", null);
__decorate([
    (0, roles_decorator_1.Roles)(api_response_interface_2.UserRole.SUPERUSER, api_response_interface_2.UserRole.REGIONAL_MANAGER),
    (0, common_1.Patch)(':id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HospitalsController.prototype, "reject", null);
__decorate([
    (0, roles_decorator_1.Roles)(api_response_interface_2.UserRole.SUPERUSER),
    (0, common_1.Patch)(':id/assign-manager'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('managerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], HospitalsController.prototype, "assignManager", null);
exports.HospitalsController = HospitalsController = __decorate([
    (0, common_1.Controller)('hospitals'),
    __metadata("design:paramtypes", [hospitals_service_1.HospitalsService])
], HospitalsController);
//# sourceMappingURL=hospitals.controller.js.map