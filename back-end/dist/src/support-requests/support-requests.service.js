"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportRequestsService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
const support_request_interface_1 = require("./interfaces/support-request.interface");
const response_util_1 = require("../common/utils/response.util");
const id_generator_util_1 = require("../common/utils/id-generator.util");
let SupportRequestsService = class SupportRequestsService {
    constructor() {
        this.reqFilePath = path.join(process.cwd(), 'data', 'support-requests.json');
    }
    get requests() {
        try {
            const raw = fs.readFileSync(this.reqFilePath, 'utf-8');
            return JSON.parse(raw);
        }
        catch {
            return [];
        }
    }
    set requests(val) {
        try {
            fs.mkdirSync(path.dirname(this.reqFilePath), { recursive: true });
            fs.writeFileSync(this.reqFilePath, JSON.stringify(val, null, 2), 'utf-8');
        }
        catch (err) {
            console.error('Failed to persist requests to disk:', err);
        }
    }
    async findAll(hospitalId, managerId) {
        try {
            let result = this.requests;
            if (hospitalId)
                result = result.filter(r => r.hospitalId === hospitalId);
            if (managerId)
                result = result.filter(r => r.assignedManagerId === managerId);
            return response_util_1.ResponseUtil.success('Support requests retrieved successfully', result);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve requests');
        }
    }
    async create(data, userId) {
        try {
            const newReq = {
                ...data,
                id: id_generator_util_1.IdGenerator.generate('SR-'),
                createdBy: userId,
                status: support_request_interface_1.SupportRequestStatus.OPEN,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            const all = this.requests;
            all.push(newReq);
            this.requests = all;
            return response_util_1.ResponseUtil.created('Support request created successfully', newReq);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to create support request');
        }
    }
    async update(id, updateData) {
        try {
            const all = this.requests;
            const idx = all.findIndex(r => r.id === id);
            if (idx === -1)
                return response_util_1.ResponseUtil.notFound('Support Request', id);
            all[idx] = {
                ...all[idx],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            this.requests = all;
            return response_util_1.ResponseUtil.updated('Support request updated successfully', all[idx]);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update support request');
        }
    }
};
exports.SupportRequestsService = SupportRequestsService;
exports.SupportRequestsService = SupportRequestsService = __decorate([
    (0, common_1.Injectable)()
], SupportRequestsService);
//# sourceMappingURL=support-requests.service.js.map