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
exports.BedsController = void 0;
const common_1 = require("@nestjs/common");
const beds_service_1 = require("./beds.service");
const create_bed_dto_1 = require("./dto/create-bed.dto");
const update_bed_dto_1 = require("./dto/update-bed.dto");
let BedsController = class BedsController {
    constructor(bedsService) {
        this.bedsService = bedsService;
    }
    async findAll(ward, status) {
        return this.bedsService.findAll(ward, status);
    }
    async create(createBedDto) {
        return this.bedsService.create(createBedDto);
    }
    async getStats() {
        return this.bedsService.getStats();
    }
    async findByWard(ward) {
        return this.bedsService.findByWard(ward);
    }
    async getAvailableBeds() {
        return this.bedsService.getAvailableBeds();
    }
    async findByPatient(patient) {
        return this.bedsService.findByPatient(patient);
    }
    async getOccupancyByWard() {
        return this.bedsService.getOccupancyByWard();
    }
    async findById(id) {
        return this.bedsService.findById(id);
    }
    async update(id, updateBedDto) {
        return this.bedsService.update(id, updateBedDto);
    }
    async patchUpdate(id, updateBedDto) {
        return this.bedsService.update(id, updateBedDto);
    }
    async delete(id) {
        return this.bedsService.delete(id);
    }
    async allocate(id, patient) {
        return this.bedsService.allocate(id, patient);
    }
    async release(id) {
        return this.bedsService.release(id);
    }
    async updateStatus(id, status) {
        return this.bedsService.updateStatus(id, status);
    }
};
exports.BedsController = BedsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('ward')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BedsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_bed_dto_1.CreateBedDto]),
    __metadata("design:returntype", Promise)
], BedsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BedsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('ward/:ward'),
    __param(0, (0, common_1.Param)('ward')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BedsController.prototype, "findByWard", null);
__decorate([
    (0, common_1.Get)('available'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BedsController.prototype, "getAvailableBeds", null);
__decorate([
    (0, common_1.Get)('patient/:patient'),
    __param(0, (0, common_1.Param)('patient')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BedsController.prototype, "findByPatient", null);
__decorate([
    (0, common_1.Get)('occupancy'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BedsController.prototype, "getOccupancyByWard", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BedsController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_bed_dto_1.UpdateBedDto]),
    __metadata("design:returntype", Promise)
], BedsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_bed_dto_1.UpdateBedDto]),
    __metadata("design:returntype", Promise)
], BedsController.prototype, "patchUpdate", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BedsController.prototype, "delete", null);
__decorate([
    (0, common_1.Patch)(':id/allocate'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('patient')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BedsController.prototype, "allocate", null);
__decorate([
    (0, common_1.Patch)(':id/release'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BedsController.prototype, "release", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BedsController.prototype, "updateStatus", null);
exports.BedsController = BedsController = __decorate([
    (0, common_1.Controller)('beds'),
    __metadata("design:paramtypes", [beds_service_1.BedsService])
], BedsController);
//# sourceMappingURL=beds.controller.js.map