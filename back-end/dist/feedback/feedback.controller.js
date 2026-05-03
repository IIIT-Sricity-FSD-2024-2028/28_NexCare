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
const feedback_service_1 = require("./feedback.service");
const create_feedback_dto_1 = require("./dto/create-feedback.dto");
const update_feedback_dto_1 = require("./dto/update-feedback.dto");
let FeedbackController = class FeedbackController {
    constructor(feedbackService) {
        this.feedbackService = feedbackService;
    }
    async findAll(patientId, status, category) {
        return this.feedbackService.findAll(patientId, status, category);
    }
    async create(createFeedbackDto) {
        return this.feedbackService.create(createFeedbackDto);
    }
    async getStats() {
        return this.feedbackService.getStats();
    }
    async findByPatient(patientId) {
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
    __param(0, (0, common_1.Query)('patientId')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_feedback_dto_1.CreateFeedbackDto]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('patient/:patientId'),
    __param(0, (0, common_1.Param)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "findByPatient", null);
__decorate([
    (0, common_1.Get)('category/:category'),
    __param(0, (0, common_1.Param)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "findByCategory", null);
__decorate([
    (0, common_1.Get)('rating/:rating'),
    __param(0, (0, common_1.Param)('rating')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "findByRating", null);
__decorate([
    (0, common_1.Get)('unresolved'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "getUnresolvedFeedback", null);
__decorate([
    (0, common_1.Get)('high-priority'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "getHighPriorityFeedback", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_feedback_dto_1.UpdateFeedbackDto]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_feedback_dto_1.UpdateFeedbackDto]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "patchUpdate", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "delete", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "updateStatus", null);
exports.FeedbackController = FeedbackController = __decorate([
    (0, common_1.Controller)('feedback'),
    __metadata("design:paramtypes", [feedback_service_1.FeedbackService])
], FeedbackController);
//# sourceMappingURL=feedback.controller.js.map