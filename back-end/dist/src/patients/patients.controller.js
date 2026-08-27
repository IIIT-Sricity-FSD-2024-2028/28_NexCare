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
exports.PatientsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const patients_service_1 = require("./patients.service");
const create_patient_dto_1 = require("./dto/create-patient.dto");
const update_patient_dto_1 = require("./dto/update-patient.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
let PatientsController = class PatientsController {
    constructor(patientsService) {
        this.patientsService = patientsService;
    }
    assertOwnRecord(req, id) {
        const user = req?.user;
        if (user?.role === api_response_interface_1.UserRole.PATIENT && user?.patientId !== id) {
            throw new common_1.ForbiddenException('You can only access your own patient record.');
        }
    }
    async findAll(status) {
        return this.patientsService.findAll(status);
    }
    async create(createPatientDto) {
        return this.patientsService.create(createPatientDto);
    }
    async getStats() {
        return this.patientsService.getStats();
    }
    async search(query) {
        return this.patientsService.search(query);
    }
    async findByBloodGroup(bloodGroup) {
        return this.patientsService.findByBloodGroup(bloodGroup);
    }
    async findByAgeRange(minAge, maxAge) {
        return this.patientsService.findByAgeRange(minAge, maxAge);
    }
    async findById(req, id) {
        this.assertOwnRecord(req, id);
        return this.patientsService.findById(id);
    }
    async update(req, id, updatePatientDto) {
        this.assertOwnRecord(req, id);
        return this.patientsService.update(id, updatePatientDto);
    }
    async patchUpdate(req, id, updatePatientDto) {
        this.assertOwnRecord(req, id);
        return this.patientsService.update(id, updatePatientDto);
    }
    async delete(id) {
        return this.patientsService.delete(id);
    }
    async updateStatus(id, status) {
        return this.patientsService.updateStatus(id, status);
    }
};
exports.PatientsController = PatientsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all patients' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filter by patient status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of patients' }),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new patient record' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Patient creation result (check success field)' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_patient_dto_1.CreatePatientDto]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    (0, swagger_1.ApiOperation)({ summary: 'Get patient statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Patient statistics retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('search/:query'),
    (0, swagger_1.ApiOperation)({ summary: 'Search patients by name, email, or phone' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Search results' }),
    __param(0, (0, common_1.Param)('query')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('blood-group/:bloodGroup'),
    (0, swagger_1.ApiOperation)({ summary: 'Get patients by blood group' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of patients matching blood group' }),
    __param(0, (0, common_1.Param)('bloodGroup')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "findByBloodGroup", null);
__decorate([
    (0, common_1.Get)('age-range'),
    (0, swagger_1.ApiOperation)({ summary: 'Get patients by age range' }),
    (0, swagger_1.ApiQuery)({ name: 'minAge', type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'maxAge', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of patients in age range' }),
    __param(0, (0, common_1.Query)('minAge')),
    __param(1, (0, common_1.Query)('maxAge')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "findByAgeRange", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF, api_response_interface_1.UserRole.PATIENT),
    (0, swagger_1.ApiOperation)({ summary: 'Get patient by ID (patients: own record only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Patient details (check success field for not-found)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF, api_response_interface_1.UserRole.PATIENT),
    (0, swagger_1.ApiOperation)({ summary: 'Update patient details (patients: own record only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Patient updated successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_patient_dto_1.UpdatePatientDto]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF, api_response_interface_1.UserRole.PATIENT),
    (0, swagger_1.ApiOperation)({ summary: 'Partially update patient details (patients: own record only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Patient updated successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_patient_dto_1.UpdatePatientDto]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "patchUpdate", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a patient record' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Patient deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "delete", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update patient status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Patient status updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "updateStatus", null);
exports.PatientsController = PatientsController = __decorate([
    (0, swagger_1.ApiTags)('Patients'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF),
    (0, common_1.Controller)('patients'),
    __metadata("design:paramtypes", [patients_service_1.PatientsService])
], PatientsController);
//# sourceMappingURL=patients.controller.js.map