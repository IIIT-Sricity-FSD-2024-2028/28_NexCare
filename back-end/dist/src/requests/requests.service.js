"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestsService = exports.RequestStatus = exports.RequestPriority = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
const response_util_1 = require("../common/utils/response.util");
const id_generator_util_1 = require("../common/utils/id-generator.util");
var RequestPriority;
(function (RequestPriority) {
    RequestPriority["LOW"] = "LOW";
    RequestPriority["MEDIUM"] = "MEDIUM";
    RequestPriority["HIGH"] = "HIGH";
})(RequestPriority || (exports.RequestPriority = RequestPriority = {}));
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["OPEN"] = "OPEN";
    RequestStatus["IN_PROGRESS"] = "IN_PROGRESS";
    RequestStatus["RESOLVED"] = "RESOLVED";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
let RequestsService = class RequestsService {
    constructor() {
        this.requestsFilePath = path.join(process.cwd(), 'data', 'requests.json');
    }
    get requests() {
        try {
            const raw = fs.readFileSync(this.requestsFilePath, 'utf-8');
            return JSON.parse(raw);
        }
        catch {
            return [];
        }
    }
    set requests(val) {
        try {
            fs.mkdirSync(path.dirname(this.requestsFilePath), { recursive: true });
            fs.writeFileSync(this.requestsFilePath, JSON.stringify(val, null, 2), 'utf-8');
        }
        catch (err) {
            console.error('Failed to persist requests to disk:', err);
        }
    }
    async findAllForHospital(hospitalId) {
        try {
            const result = this.requests.filter(r => r.hospitalId === hospitalId);
            return response_util_1.ResponseUtil.success('Requests retrieved successfully', result);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve requests');
        }
    }
    async findAllForManager(managerId) {
        try {
            const result = this.requests.filter(r => r.managerId === managerId);
            return response_util_1.ResponseUtil.success('Requests retrieved successfully', result);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve requests');
        }
    }
    async create(hospitalId, createdBy, data, managerId) {
        try {
            const newRequest = {
                ...data,
                id: id_generator_util_1.IdGenerator.generate('REQ'),
                hospitalId,
                managerId,
                createdBy,
                status: RequestStatus.OPEN,
                createdAt: new Date().toISOString()
            };
            const all = this.requests;
            all.push(newRequest);
            this.requests = all;
            return response_util_1.ResponseUtil.created('Request submitted successfully', newRequest);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to submit request');
        }
    }
    async respond(id, responseMessage, status) {
        try {
            const all = this.requests;
            const idx = all.findIndex(r => r.id === id);
            if (idx === -1)
                return response_util_1.ResponseUtil.notFound('Request', id);
            all[idx] = {
                ...all[idx],
                response: responseMessage,
                status
            };
            this.requests = all;
            return response_util_1.ResponseUtil.updated('Request updated successfully', all[idx]);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update request');
        }
    }
};
exports.RequestsService = RequestsService;
exports.RequestsService = RequestsService = __decorate([
    (0, common_1.Injectable)()
], RequestsService);
//# sourceMappingURL=requests.service.js.map