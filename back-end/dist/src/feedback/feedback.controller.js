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
exports.FeedbackController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const feedback_service_1 = require("./feedback.service");
const create_feedback_dto_1 = require("./dto/create-feedback.dto");
const update_feedback_dto_1 = require("./dto/update-feedback.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
let FeedbackController = class FeedbackController {
    constructor(feedbackService) {
        this.feedbackService = feedbackService;
    }
    isPatient(req) {
        return req?.user?.role === api_response_interface_1.UserRole.PATIENT;
    }
    async findAll(req, patientId, status, category) {
        if (this.isPatient(req)) {
            patientId = req.user.patientId;
        }
        return this.feedbackService.findAll(patientId, status, category);
    }
    async create(req, createFeedbackDto) {
        const dto = { ...createFeedbackDto };
        if (this.isPatient(req)) {
            dto.patientId = req.user.patientId;
        }
        return this.feedbackService.create(dto);
    }
    async getStats() {
        return this.feedbackService.getStats();
    }
    async findByPatient(req, patientId) {
        if (this.isPatient(req) && patientId !== req.user.patientId) {
            throw new common_1.ForbiddenException('You can only view your own feedback.');
        }
        return this.feedbackService.findByPatient(patientId);
    }
    async findByCategory(category) {
        return this.feedbackService.findByCategory(category);
    }
    async findByRating(rating) {
        return this.feedbackService.findByRating(rating);
    }
    async getUnresolvedFeedback() {
        return this.feedbackService.getUnresolvedFeedback();
    }
    async getHighPriorityFeedback() {
        return this.feedbackService.getHighPriorityFeedback();
    }
    async findById(id) {
        return this.feedbackService.findById(id);
    }
    async update(id, updateFeedbackDto) {
        return this.feedbackService.update(id, updateFeedbackDto);
    }
    async patchUpdate(id, updateFeedbackDto) {
        return this.feedbackService.update(id, updateFeedbackDto);
    }
    async delete(id) {
        return this.feedbackService.delete(id);
    }
    async updateStatus(id, status) {
        return this.feedbackService.updateStatus(id, status);
    }
};
exports.FeedbackController = FeedbackController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF, api_response_interface_1.UserRole.PATIENT),
    (0, swagger_1.ApiOperation)({ summary: 'Get all feedback (patients: only their own)' }),
    (0, swagger_1.ApiQuery)({ name: 'patientId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: api_response_interface_1.FeedbackStatus }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of feedback' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('patientId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF, api_response_interface_1.UserRole.PATIENT),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Submit new feedback' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Feedback submission result (check success field)' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_feedback_dto_1.CreateFeedbackDto]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    (0, swagger_1.ApiOperation)({ summary: 'Get feedback statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Feedback statistics retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('patient/:patientId'),
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF, api_response_interface_1.UserRole.PATIENT),
    (0, swagger_1.ApiOperation)({ summary: 'Get feedback by patient ID (patients: own only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Patient feedback retrieved' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "findByPatient", null);
__decorate([
    (0, common_1.Get)('category/:category'),
    (0, swagger_1.ApiOperation)({ summary: 'Get feedback by category' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Feedback retrieved by category' }),
    __param(0, (0, common_1.Param)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "findByCategory", null);
__decorate([
    (0, common_1.Get)('rating/:rating'),
    (0, swagger_1.ApiOperation)({ summary: 'Get feedback by rating (1-5)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Feedback retrieved by rating' }),
    __param(0, (0, common_1.Param)('rating')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "findByRating", null);
__decorate([
    (0, common_1.Get)('unresolved'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all unresolved feedback' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Unresolved feedback retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "getUnresolvedFeedback", null);
__decorate([
    (0, common_1.Get)('high-priority'),
    (0, swagger_1.ApiOperation)({ summary: 'Get high priority feedback (low ratings)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'High priority feedback retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "getHighPriorityFeedback", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get feedback by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Feedback details retrieved' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update feedback details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Feedback updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_feedback_dto_1.UpdateFeedbackDto]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Partially update feedback details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Feedback updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_feedback_dto_1.UpdateFeedbackDto]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "patchUpdate", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete feedback' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Feedback deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "delete", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update feedback status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Feedback status updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "updateStatus", null);
exports.FeedbackController = FeedbackController = __decorate([
    (0, swagger_1.ApiTags)('Feedback'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF),
    (0, common_1.Controller)('feedback'),
    __metadata("design:paramtypes", [feedback_service_1.FeedbackService])
], FeedbackController);
//# sourceMappingURL=feedback.controller.js.map