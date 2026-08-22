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
exports.RequestsController = void 0;
const common_1 = require("@nestjs/common");
const requests_service_1 = require("./requests.service");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
const hospitals_service_1 = require("../hospitals/hospitals.service");
let RequestsController = class RequestsController {
    constructor(requestsService, hospitalsService) {
        this.requestsService = requestsService;
        this.hospitalsService = hospitalsService;
    }
    async getRequests(req) {
        const user = req.user;
        if (user.role === api_response_interface_1.UserRole.SUPERUSER || user.role === api_response_interface_1.UserRole.HOSPITAL_MANAGER) {
            return this.requestsService.findAllForManager(user.id);
        }
        return this.requestsService.findAllForHospital(user.hospitalId);
    }
    async createRequest(req, data) {
        const user = req.user;
        let managerId = undefined;
        if (user.hospitalId) {
            const hRes = await this.hospitalsService.findById(user.hospitalId);
            if (hRes.success && hRes.data) {
                managerId = hRes.data.assignedManagerId;
            }
        }
        return this.requestsService.create(user.hospitalId, user.id, data, managerId);
    }
    async respondToRequest(id, response, status) {
        return this.requestsService.respond(id, response, status);
    }
};
exports.RequestsController = RequestsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "getRequests", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "createRequest", null);
__decorate([
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.HOSPITAL_MANAGER),
    (0, common_1.Patch)(':id/respond'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('response')),
    __param(2, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "respondToRequest", null);
exports.RequestsController = RequestsController = __decorate([
    (0, swagger_1.ApiTags)('Requests'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('requests'),
    __metadata("design:paramtypes", [requests_service_1.RequestsService,
        hospitals_service_1.HospitalsService])
], RequestsController);
//# sourceMappingURL=requests.controller.js.map