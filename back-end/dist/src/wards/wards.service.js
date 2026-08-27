"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WardsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WardsService = void 0;
const common_1 = require("@nestjs/common");
const response_util_1 = require("../common/utils/response.util");
const file_store_util_1 = require("../common/utils/file-store.util");
let WardsService = WardsService_1 = class WardsService {
    constructor() {
        this.store = new file_store_util_1.FileStore('wards.json', () => WardsService_1.seed());
    }
    static seed() {
        return [
            { id: 'W-001', name: 'Emergency', hospitalId: 'H001' },
            { id: 'W-002', name: 'General', hospitalId: 'H001' },
        ];
    }
    async findAll(hospitalId) {
        try {
            let filtered = this.store.load();
            if (hospitalId) {
                filtered = filtered.filter(w => w.hospitalId === hospitalId);
            }
            return response_util_1.ResponseUtil.success('Wards retrieved successfully', filtered);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve wards');
        }
    }
};
exports.WardsService = WardsService;
exports.WardsService = WardsService = WardsService_1 = __decorate([
    (0, common_1.Injectable)()
], WardsService);
//# sourceMappingURL=wards.service.js.map