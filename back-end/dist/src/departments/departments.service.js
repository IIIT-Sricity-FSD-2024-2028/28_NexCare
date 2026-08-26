"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DepartmentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentsService = void 0;
const common_1 = require("@nestjs/common");
const response_util_1 = require("../common/utils/response.util");
const file_store_util_1 = require("../common/utils/file-store.util");
let DepartmentsService = DepartmentsService_1 = class DepartmentsService {
    constructor() {
        this.store = new file_store_util_1.FileStore('departments.json', () => DepartmentsService_1.seed());
    }
    static seed() {
        return [
            { id: 'D-001', name: 'Cardiology', hospitalId: 'H001' },
            { id: 'D-002', name: 'Neurology', hospitalId: 'H001' },
        ];
    }
    async findAll(hospitalId) {
        try {
            let filtered = this.store.load();
            if (hospitalId) {
                filtered = filtered.filter(d => d.hospitalId === hospitalId);
            }
            return response_util_1.ResponseUtil.success('Departments retrieved successfully', filtered);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve departments');
        }
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = DepartmentsService_1 = __decorate([
    (0, common_1.Injectable)()
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map