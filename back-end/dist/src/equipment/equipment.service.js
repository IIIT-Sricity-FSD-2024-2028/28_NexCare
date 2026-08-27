"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var EquipmentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EquipmentService = void 0;
const common_1 = require("@nestjs/common");
const response_util_1 = require("../common/utils/response.util");
const file_store_util_1 = require("../common/utils/file-store.util");
let EquipmentService = EquipmentService_1 = class EquipmentService {
    constructor() {
        this.store = new file_store_util_1.FileStore('equipment.json', () => EquipmentService_1.seed());
    }
    static seed() {
        return [
            { id: 'EQ-001', name: 'MRI Scanner', type: 'Imaging', status: 'Active', hospitalId: 'H001' },
            { id: 'EQ-002', name: 'X-Ray Machine', type: 'Imaging', status: 'Maintenance', hospitalId: 'H001' },
        ];
    }
    async findAll(hospitalId) {
        try {
            let filtered = this.store.load();
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
exports.EquipmentService = EquipmentService = EquipmentService_1 = __decorate([
    (0, common_1.Injectable)()
], EquipmentService);
//# sourceMappingURL=equipment.service.js.map