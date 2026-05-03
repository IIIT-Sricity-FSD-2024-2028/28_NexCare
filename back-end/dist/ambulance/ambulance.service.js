"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmbulanceService = void 0;
const common_1 = require("@nestjs/common");
const response_util_1 = require("../common/utils/response.util");
const id_generator_util_1 = require("../common/utils/id-generator.util");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
let AmbulanceService = class AmbulanceService {
    constructor() {
        this.ambulanceRequests = [
            {
                id: 'AMB-001',
                patientId: 'P002',
                patientName: 'Maria Garcia',
                pickupLocation: '742 Evergreen Terrace, Springfield',
                contact: '+1 (555) 987-6543',
                notes: 'Patient is experiencing severe chest pains and shortness of breath.',
                status: api_response_interface_1.AmbulanceStatus.DISPATCHED,
                assignedTo: 'U003',
                createdAt: '2026-04-02T10:15:00Z',
                updatedAt: '2026-04-02T10:20:00Z'
            },
            {
                id: 'AMB-002',
                patientId: 'P001',
                patientName: 'John Anderson',
                pickupLocation: '123 Main Street, Downtown',
                contact: '+1 (555) 123-4567',
                notes: 'Mild concussion from a fall.',
                status: api_response_interface_1.AmbulanceStatus.COMPLETED,
                assignedTo: 'U003',
                createdAt: '2026-03-25T14:20:00Z',
                updatedAt: '2026-03-25T16:45:00Z'
            }
        ];
    }
    async findAll(patientId, status) {
        try {
            let filteredRequests = [...this.ambulanceRequests];
            if (patientId) {
                filteredRequests = filteredRequests.filter(req => req.patientId === patientId);
            }
            if (status) {
                filteredRequests = filteredRequests.filter(req => req.status === status);
            }
            return response_util_1.ResponseUtil.success('Ambulance requests retrieved successfully', filteredRequests);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve ambulance requests');
        }
    }
    async findById(id) {
        try {
            const request = this.ambulanceRequests.find(r => r.id === id);
            if (!request) {
                return response_util_1.ResponseUtil.notFound('Ambulance request', id);
            }
            return response_util_1.ResponseUtil.success('Ambulance request retrieved successfully', request);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve ambulance request');
        }
    }
    async create(requestData) {
        try {
            const newRequestId = id_generator_util_1.IdGenerator.generateAmbulanceId();
            const newRequest = {
                id: newRequestId,
                patientId: requestData.patientId,
                patientName: `Patient ${requestData.patientId}`,
                pickupLocation: requestData.pickupLocation,
                contact: requestData.contact,
                notes: requestData.notes || '',
                status: api_response_interface_1.AmbulanceStatus.PENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.ambulanceRequests.push(newRequest);
            return response_util_1.ResponseUtil.created('Ambulance request created successfully', newRequest);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to create ambulance request');
        }
    }
    async update(id, updateData) {
        try {
            const requestIndex = this.ambulanceRequests.findIndex(r => r.id === id);
            if (requestIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Ambulance request', id);
            }
            const updatedRequest = {
                ...this.ambulanceRequests[requestIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            this.ambulanceRequests[requestIndex] = updatedRequest;
            return response_util_1.ResponseUtil.updated('Ambulance request updated successfully', updatedRequest);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update ambulance request');
        }
    }
    async delete(id) {
        try {
            const requestIndex = this.ambulanceRequests.findIndex(r => r.id === id);
            if (requestIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Ambulance request', id);
            }
            const request = this.ambulanceRequests[requestIndex];
            if (request.status === api_response_interface_1.AmbulanceStatus.COMPLETED) {
                return response_util_1.ResponseUtil.error('Cannot delete completed ambulance requests');
            }
            this.ambulanceRequests.splice(requestIndex, 1);
            return response_util_1.ResponseUtil.deleted('Ambulance request');
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to delete ambulance request');
        }
    }
    async dispatch(id, assignedTo) {
        try {
            const requestIndex = this.ambulanceRequests.findIndex(r => r.id === id);
            if (requestIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Ambulance request', id);
            }
            const request = this.ambulanceRequests[requestIndex];
            if (request.status !== api_response_interface_1.AmbulanceStatus.PENDING) {
                return response_util_1.ResponseUtil.error('Cannot dispatch request that is not pending');
            }
            this.ambulanceRequests[requestIndex].status = api_response_interface_1.AmbulanceStatus.DISPATCHED;
            this.ambulanceRequests[requestIndex].assignedTo = assignedTo || 'U003';
            this.ambulanceRequests[requestIndex].updatedAt = new Date().toISOString();
            const updatedRequest = this.ambulanceRequests[requestIndex];
            return response_util_1.ResponseUtil.updated('Ambulance dispatched successfully', updatedRequest);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to dispatch ambulance');
        }
    }
    async complete(id) {
        try {
            const requestIndex = this.ambulanceRequests.findIndex(r => r.id === id);
            if (requestIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Ambulance request', id);
            }
            const request = this.ambulanceRequests[requestIndex];
            if (request.status !== api_response_interface_1.AmbulanceStatus.AT_HOSPITAL) {
                return response_util_1.ResponseUtil.error('Cannot complete request that has not reached hospital');
            }
            this.ambulanceRequests[requestIndex].status = api_response_interface_1.AmbulanceStatus.COMPLETED;
            this.ambulanceRequests[requestIndex].updatedAt = new Date().toISOString();
            const updatedRequest = this.ambulanceRequests[requestIndex];
            return response_util_1.ResponseUtil.updated('Ambulance request completed successfully', updatedRequest);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to complete ambulance request');
        }
    }
    async updateStatus(id, status) {
        try {
            const requestIndex = this.ambulanceRequests.findIndex(r => r.id === id);
            if (requestIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Ambulance request', id);
            }
            if (!this.isValidStatusTransition(this.ambulanceRequests[requestIndex].status, status)) {
                return response_util_1.ResponseUtil.error(`Invalid status transition from ${this.ambulanceRequests[requestIndex].status} to ${status}`);
            }
            this.ambulanceRequests[requestIndex].status = status;
            this.ambulanceRequests[requestIndex].updatedAt = new Date().toISOString();
            const updatedRequest = this.ambulanceRequests[requestIndex];
            return response_util_1.ResponseUtil.updated('Request status updated successfully', updatedRequest);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update request status');
        }
    }
    async getStats() {
        try {
            const totalRequests = this.ambulanceRequests.length;
            const pendingRequests = this.ambulanceRequests.filter(r => r.status === api_response_interface_1.AmbulanceStatus.PENDING).length;
            const dispatchedRequests = this.ambulanceRequests.filter(r => r.status === api_response_interface_1.AmbulanceStatus.DISPATCHED).length;
            const enRouteRequests = this.ambulanceRequests.filter(r => r.status === api_response_interface_1.AmbulanceStatus.EN_ROUTE).length;
            const pickedUpRequests = this.ambulanceRequests.filter(r => r.status === api_response_interface_1.AmbulanceStatus.PICKED_UP).length;
            const atHospitalRequests = this.ambulanceRequests.filter(r => r.status === api_response_interface_1.AmbulanceStatus.AT_HOSPITAL).length;
            const completedRequests = this.ambulanceRequests.filter(r => r.status === api_response_interface_1.AmbulanceStatus.COMPLETED).length;
            const averageResponseTime = 15;
            const byStatus = {
                [api_response_interface_1.AmbulanceStatus.PENDING]: pendingRequests,
                [api_response_interface_1.AmbulanceStatus.DISPATCHED]: dispatchedRequests,
                [api_response_interface_1.AmbulanceStatus.EN_ROUTE]: enRouteRequests,
                [api_response_interface_1.AmbulanceStatus.PICKED_UP]: pickedUpRequests,
                [api_response_interface_1.AmbulanceStatus.AT_HOSPITAL]: atHospitalRequests,
                [api_response_interface_1.AmbulanceStatus.COMPLETED]: completedRequests
            };
            const stats = {
                total: totalRequests,
                pending: pendingRequests,
                dispatched: dispatchedRequests,
                enRoute: enRouteRequests,
                pickedUp: pickedUpRequests,
                atHospital: atHospitalRequests,
                completed: completedRequests,
                averageResponseTime,
                byStatus
            };
            return response_util_1.ResponseUtil.success('Ambulance statistics retrieved successfully', stats);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve ambulance statistics');
        }
    }
    async findByPatient(patientId) {
        try {
            const requests = this.ambulanceRequests.filter(r => r.patientId === patientId);
            return response_util_1.ResponseUtil.success(`Ambulance requests for patient ${patientId} retrieved successfully`, requests);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve patient ambulance requests');
        }
    }
    async getActiveRequests() {
        try {
            const activeRequests = this.ambulanceRequests.filter(r => r.status !== api_response_interface_1.AmbulanceStatus.COMPLETED);
            return response_util_1.ResponseUtil.success('Active ambulance requests retrieved successfully', activeRequests);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve active ambulance requests');
        }
    }
    async findByAssignedStaff(assignedTo) {
        try {
            const requests = this.ambulanceRequests.filter(r => r.assignedTo === assignedTo);
            return response_util_1.ResponseUtil.success(`Ambulance requests assigned to ${assignedTo} retrieved successfully`, requests);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve assigned ambulance requests');
        }
    }
    isValidStatusTransition(currentStatus, newStatus) {
        const validTransitions = {
            [api_response_interface_1.AmbulanceStatus.PENDING]: [api_response_interface_1.AmbulanceStatus.DISPATCHED],
            [api_response_interface_1.AmbulanceStatus.DISPATCHED]: [api_response_interface_1.AmbulanceStatus.EN_ROUTE],
            [api_response_interface_1.AmbulanceStatus.EN_ROUTE]: [api_response_interface_1.AmbulanceStatus.PICKED_UP],
            [api_response_interface_1.AmbulanceStatus.PICKED_UP]: [api_response_interface_1.AmbulanceStatus.AT_HOSPITAL],
            [api_response_interface_1.AmbulanceStatus.AT_HOSPITAL]: [api_response_interface_1.AmbulanceStatus.COMPLETED],
            [api_response_interface_1.AmbulanceStatus.COMPLETED]: []
        };
        return validTransitions[currentStatus]?.includes(newStatus) || false;
    }
};
exports.AmbulanceService = AmbulanceService;
exports.AmbulanceService = AmbulanceService = __decorate([
    (0, common_1.Injectable)()
], AmbulanceService);
//# sourceMappingURL=ambulance.service.js.map