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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
const response_util_1 = require("../common/utils/response.util");
const id_generator_util_1 = require("../common/utils/id-generator.util");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
const system_service_1 = require("../system/system.service");
let FeedbackService = class FeedbackService {
    constructor(systemService) {
        this.systemService = systemService;
        this.feedbackFilePath = path.join(process.cwd(), 'data', 'feedback.json');
        this.seedData = [
            {
                id: 'FB-001',
                patientId: 'P001',
                sender: 'John Anderson',
                type: 'Patient',
                category: 'service',
                subject: 'Great doctors',
                summary: 'Dr. Smith was incredibly thorough and attentive.',
                rating: 5,
                status: api_response_interface_1.FeedbackStatus.RESOLVED,
                createdAt: '2026-03-15T10:00:00Z'
            },
            {
                id: 'FB-002',
                patientId: 'P002',
                sender: 'Maria Garcia',
                type: 'Patient',
                category: 'facilities',
                subject: 'Wait times in ER',
                summary: 'Waiting room was cold and wait was an hour.',
                rating: 2,
                status: api_response_interface_1.FeedbackStatus.OPEN,
                createdAt: '2026-04-02T14:30:00Z'
            },
            {
                id: 'FB-003',
                patientId: 'U005',
                sender: 'Dr. Sarah Smith',
                type: 'Staff',
                category: 'software',
                subject: 'System crash',
                summary: 'EHR system frequently times out on large files.',
                rating: 3,
                status: api_response_interface_1.FeedbackStatus.IN_PROGRESS,
                createdAt: '2026-04-01T09:15:00Z'
            }
        ];
    }
    loadFeedback() {
        try {
            const raw = fs.readFileSync(this.feedbackFilePath, 'utf-8');
            return JSON.parse(raw);
        }
        catch {
            this.saveFeedback(this.seedData);
            return [...this.seedData];
        }
    }
    saveFeedback(feedback) {
        try {
            fs.mkdirSync(path.dirname(this.feedbackFilePath), { recursive: true });
            fs.writeFileSync(this.feedbackFilePath, JSON.stringify(feedback, null, 2), 'utf-8');
        }
        catch (err) {
            console.error('Failed to persist feedback to disk:', err);
        }
    }
    async findAll(patientId, status, category) {
        try {
            let filteredFeedback = [...this.loadFeedback()];
            if (patientId) {
                filteredFeedback = filteredFeedback.filter(f => f.patientId === patientId);
            }
            if (status) {
                filteredFeedback = filteredFeedback.filter(f => f.status === status);
            }
            if (category) {
                filteredFeedback = filteredFeedback.filter(f => f.category === category);
            }
            return response_util_1.ResponseUtil.success('Feedback retrieved successfully', filteredFeedback);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve feedback');
        }
    }
    async findById(id) {
        try {
            const feedbackItem = this.loadFeedback().find(f => f.id === id);
            if (!feedbackItem) {
                return response_util_1.ResponseUtil.notFound('Feedback', id);
            }
            return response_util_1.ResponseUtil.success('Feedback retrieved successfully', feedbackItem);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve feedback');
        }
    }
    async create(feedbackData) {
        try {
            if (feedbackData.rating < 1 || feedbackData.rating > 5) {
                return response_util_1.ResponseUtil.error('Rating must be between 1 and 5');
            }
            const feedback = this.loadFeedback();
            const newFeedbackId = id_generator_util_1.IdGenerator.generateFeedbackId();
            const newFeedback = {
                id: newFeedbackId,
                patientId: feedbackData.patientId,
                sender: feedbackData.sender || `User ${feedbackData.patientId}`,
                type: feedbackData.type,
                category: feedbackData.category,
                subject: feedbackData.subject,
                summary: feedbackData.summary,
                rating: feedbackData.rating,
                status: api_response_interface_1.FeedbackStatus.OPEN,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            feedback.push(newFeedback);
            this.saveFeedback(feedback);
            this.systemService.createActivity({
                userId: feedbackData.patientId,
                action: 'Submit',
                details: `${newFeedback.type} feedback ${newFeedbackId} submitted: ${newFeedback.subject}`,
                module: 'Feedback',
                severity: newFeedback.rating <= 2 ? 'WARNING' : 'INFO'
            });
            return response_util_1.ResponseUtil.created('Feedback created successfully', newFeedback);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to create feedback');
        }
    }
    async update(id, updateData) {
        try {
            const feedback = this.loadFeedback();
            const feedbackIndex = feedback.findIndex(f => f.id === id);
            if (feedbackIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Feedback', id);
            }
            if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
                return response_util_1.ResponseUtil.error('Rating must be between 1 and 5');
            }
            const updatedFeedback = {
                ...feedback[feedbackIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            feedback[feedbackIndex] = updatedFeedback;
            this.saveFeedback(feedback);
            this.systemService.createActivity({
                userId: 'System',
                action: 'Update',
                details: `Feedback ${id} updated`,
                module: 'Feedback',
                severity: 'INFO'
            });
            return response_util_1.ResponseUtil.updated('Feedback updated successfully', updatedFeedback);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update feedback');
        }
    }
    async delete(id) {
        try {
            const feedback = this.loadFeedback();
            const feedbackIndex = feedback.findIndex(f => f.id === id);
            if (feedbackIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Feedback', id);
            }
            feedback.splice(feedbackIndex, 1);
            this.saveFeedback(feedback);
            this.systemService.createActivity({
                userId: 'Admin',
                action: 'Delete',
                details: `Feedback ${id} deleted`,
                module: 'Feedback',
                severity: 'WARNING'
            });
            return response_util_1.ResponseUtil.deleted('Feedback');
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to delete feedback');
        }
    }
    async getStats() {
        try {
            const feedback = this.loadFeedback();
            const totalFeedback = feedback.length;
            const openFeedback = feedback.filter(f => f.status === api_response_interface_1.FeedbackStatus.OPEN).length;
            const inProgressFeedback = feedback.filter(f => f.status === api_response_interface_1.FeedbackStatus.IN_PROGRESS).length;
            const resolvedFeedback = feedback.filter(f => f.status === api_response_interface_1.FeedbackStatus.RESOLVED).length;
            const totalRating = feedback.reduce((sum, f) => sum + f.rating, 0);
            const averageRating = totalFeedback > 0 ? Math.round((totalRating / totalFeedback) * 10) / 10 : 0;
            const byCategory = {};
            feedback.forEach(f => {
                byCategory[f.category] = (byCategory[f.category] || 0) + 1;
            });
            const byType = {};
            feedback.forEach(f => {
                byType[f.type] = (byType[f.type] || 0) + 1;
            });
            const byRating = {};
            feedback.forEach(f => {
                byRating[f.rating] = (byRating[f.rating] || 0) + 1;
            });
            const stats = {
                total: totalFeedback,
                open: openFeedback,
                inProgress: inProgressFeedback,
                resolved: resolvedFeedback,
                averageRating,
                byCategory,
                byType,
                byRating
            };
            return response_util_1.ResponseUtil.success('Feedback statistics retrieved successfully', stats);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve feedback statistics');
        }
    }
    async findByPatient(patientId) {
        try {
            const feedbackItems = this.loadFeedback().filter(f => f.patientId === patientId);
            return response_util_1.ResponseUtil.success(`Feedback for patient ${patientId} retrieved successfully`, feedbackItems);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve patient feedback');
        }
    }
    async findByCategory(category) {
        try {
            const feedbackItems = this.loadFeedback().filter(f => f.category === category);
            return response_util_1.ResponseUtil.success(`Feedback in category '${category}' retrieved successfully`, feedbackItems);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve category feedback');
        }
    }
    async findByRating(rating) {
        try {
            if (rating < 1 || rating > 5) {
                return response_util_1.ResponseUtil.error('Rating must be between 1 and 5');
            }
            const feedbackItems = this.loadFeedback().filter(f => f.rating === rating);
            return response_util_1.ResponseUtil.success(`Feedback with rating ${rating} retrieved successfully`, feedbackItems);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve rating feedback');
        }
    }
    async updateStatus(id, status) {
        try {
            const feedback = this.loadFeedback();
            const feedbackIndex = feedback.findIndex(f => f.id === id);
            if (feedbackIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Feedback', id);
            }
            feedback[feedbackIndex].status = status;
            feedback[feedbackIndex].updatedAt = new Date().toISOString();
            const updatedFeedback = feedback[feedbackIndex];
            this.saveFeedback(feedback);
            this.systemService.createActivity({
                userId: 'Admin',
                action: 'Resolve',
                details: `Feedback ${id} status updated to ${status}`,
                module: 'Feedback',
                severity: status === api_response_interface_1.FeedbackStatus.RESOLVED ? 'SUCCESS' : 'INFO'
            });
            return response_util_1.ResponseUtil.updated('Feedback status updated successfully', updatedFeedback);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update feedback status');
        }
    }
    async getUnresolvedFeedback() {
        try {
            const unresolvedFeedback = this.loadFeedback().filter(f => f.status !== api_response_interface_1.FeedbackStatus.RESOLVED);
            return response_util_1.ResponseUtil.success('Unresolved feedback retrieved successfully', unresolvedFeedback);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve unresolved feedback');
        }
    }
    async getHighPriorityFeedback() {
        try {
            const highPriorityFeedback = this.loadFeedback().filter(f => f.rating <= 2 && f.status !== api_response_interface_1.FeedbackStatus.RESOLVED);
            return response_util_1.ResponseUtil.success('High priority feedback retrieved successfully', highPriorityFeedback);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve high priority feedback');
        }
    }
};
exports.FeedbackService = FeedbackService;
exports.FeedbackService = FeedbackService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [system_service_1.SystemService])
], FeedbackService);
//# sourceMappingURL=feedback.service.js.map