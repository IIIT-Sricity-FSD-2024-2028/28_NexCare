"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EquipmentService = void 0;
const common_1 = require("@nestjs/common");
const response_util_1 = require("../common/utils/response.util");
let EquipmentService = class EquipmentService {
    constructor() {
        this.equipment = [
            { id: 'EQ-001', name: 'MRI Scanner', type: 'Imaging', status: 'Active', hospitalId: 'H001' },
            { id: 'EQ-002', name: 'X-Ray Machine', type: 'Imaging', status: 'Maintenance', hospitalId: 'H001' }
        ];
    }
    async findAll(hospitalId) {
        try {
            let filtered = [...this.equipment];
            if (hospitalId) {
                filtered = filtered.filter(e => e.hospitalId === hospitalId);
            }
            return response_util_1.ResponseUtil.success('Equipment retrieved successfully', filtered);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve equipment');
        }
    }
};
exports.EquipmentService = EquipmentService;
exports.EquipmentService = EquipmentService = __decorate([
    (0, common_1.Injectable)()
], EquipmentService);
//# sourceMappingURL=equipment.service.js.map