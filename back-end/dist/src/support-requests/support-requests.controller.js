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
exports.SupportRequestsController = void 0;
const common_1 = require("@nestjs/common");
const support_requests_service_1 = require("./support-requests.service");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let SupportRequestsController = class SupportRequestsController {
    constructor(supportRequestsService) {
        this.supportRequestsService = supportRequestsService;
    }
    async findAll(req, hospitalId) {
        const user = req.user;
        if (user.role === api_response_interface_1.UserRole.HOSPITAL_MANAGER || user.role === api_response_interface_1.UserRole.REGIONAL_MANAGER) {
            return this.supportRequestsService.findAll(hospitalId, user.id);
        }
        else if (user.role === api_response_interface_1.UserRole.SUPERUSER) {
            return this.supportRequestsService.findAll(hospitalId);
        }
        else {
            return this.supportRequestsService.findAll(user.hospitalId);
        }
    }
    async create(req, data) {
        const user = req.user;
        if (!data.hospitalId)
            data.hospitalId = user.hospitalId;
        return this.supportRequestsService.create(data, user.id);
    }
    async update(id, data) {
        return this.supportRequestsService.update(id, data);
    }
};
exports.SupportRequestsController = SupportRequestsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('hospitalId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SupportRequestsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SupportRequestsController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.REGIONAL_MANAGER, api_response_interface_1.UserRole.HOSPITAL_MANAGER),
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SupportRequestsController.prototype, "update", null);
exports.SupportRequestsController = SupportRequestsController = __decorate([
    (0, common_1.Controller)('support-requests'),
    __metadata("design:paramtypes", [support_requests_service_1.SupportRequestsService])
], SupportRequestsController);
//# sourceMappingURL=support-requests.controller.js.map