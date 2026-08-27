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
exports.HospitalDetailsController = void 0;
const common_1 = require("@nestjs/common");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
const users_service_1 = require("../users/users.service");
const beds_service_1 = require("../beds/beds.service");
const inventory_service_1 = require("../inventory/inventory.service");
const ambulance_service_1 = require("../ambulance/ambulance.service");
const response_util_1 = require("../common/utils/response.util");
let HospitalDetailsController = class HospitalDetailsController {
    constructor(usersService, bedsService, inventoryService, ambulanceService) {
        this.usersService = usersService;
        this.bedsService = bedsService;
        this.inventoryService = inventoryService;
        this.ambulanceService = ambulanceService;
    }
    async getDoctors(hospitalId) {
        const result = await this.usersService.findAll(api_response_interface_1.UserRole.DOCTOR);
        const doctors = (result.data || []).filter((user) => !user.hospitalId || user.hospitalId === hospitalId);
        return response_util_1.ResponseUtil.success('Doctors retrieved successfully', doctors);
    }
    async getBeds(hospitalId) {
        const result = await this.bedsService.findAll();
        const beds = (result.data || []).filter((bed) => !bed.hospitalId || bed.hospitalId === hospitalId);
        return response_util_1.ResponseUtil.success('Beds retrieved successfully', beds);
    }
    async getInventory(hospitalId) {
        const result = await this.inventoryService.findAll();
        const items = (result.data || []).filter((item) => !item.hospitalId || item.hospitalId === hospitalId);
        return response_util_1.ResponseUtil.success('Inventory retrieved successfully', items);
    }
    async getAmbulances(hospitalId) {
        const result = await this.ambulanceService.findAll();
        const requests = (result.data || []).filter((req) => !req.hospitalId || req.hospitalId === hospitalId);
        return response_util_1.ResponseUtil.success('Ambulance records retrieved successfully', requests);
    }
};
exports.HospitalDetailsController = HospitalDetailsController;
__decorate([
    (0, common_1.Get)(':id/doctors'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HospitalDetailsController.prototype, "getDoctors", null);
__decorate([
    (0, common_1.Get)(':id/beds'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HospitalDetailsController.prototype, "getBeds", null);
__decorate([
    (0, common_1.Get)(':id/inventory'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HospitalDetailsController.prototype, "getInventory", null);
__decorate([
    (0, common_1.Get)(':id/ambulances'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HospitalDetailsController.prototype, "getAmbulances", null);
exports.HospitalDetailsController = HospitalDetailsController = __decorate([
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.REGIONAL_MANAGER, api_response_interface_1.UserRole.HOSPITAL_MANAGER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF),
    (0, common_1.Controller)('hospitals'),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        beds_service_1.BedsService,
        inventory_service_1.InventoryService,
        ambulance_service_1.AmbulanceService])
], HospitalDetailsController);
//# sourceMappingURL=hospital-details.controller.js.map