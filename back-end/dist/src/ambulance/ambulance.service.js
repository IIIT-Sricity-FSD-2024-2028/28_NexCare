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
var AmbulanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmbulanceService = void 0;
const common_1 = require("@nestjs/common");
const response_util_1 = require("../common/utils/response.util");
const id_generator_util_1 = require("../common/utils/id-generator.util");
const file_store_util_1 = require("../common/utils/file-store.util");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
const system_service_1 = require("../system/system.service");
const patients_service_1 = require("../patients/patients.service");
let AmbulanceService = AmbulanceService_1 = class AmbulanceService {
    constructor(systemService, patientsService) {
        this.systemService = systemService;
        this.patientsService = patientsService;
        this.store = new file_store_util_1.FileStore('ambulance.json', () => AmbulanceService_1.seed());
    }
    static seed() {
        return [
            {
                id: 'AMB-001', patientId: 'P002', patientName: 'Maria Garcia',
                pickupLocation: '742 Evergreen Terrace, Springfield', contact: '+1 (555) 987-6543',
                notes: 'Patient is experiencing severe chest pains and shortness of breath.',
                status: api_response_interface_1.AmbulanceStatus.DISPATCHED, assignedTo: 'U003',
                createdAt: '2026-04-02T10:15:00Z', updatedAt: '2026-04-02T10:20:00Z', hospitalId: 'H001',
            },
            {
                id: 'AMB-002', patientId: 'P001', patientName: 'John Anderson',
                pickupLocation: '123 Main Street, Downtown', contact: '+1 (555) 123-4567',
                notes: 'Mild concussion from a fall.',
                status: api_response_interface_1.AmbulanceStatus.COMPLETED, assignedTo: 'U003',
                createdAt: '2026-03-25T14:20:00Z', updatedAt: '2026-03-25T16:45:00Z', hospitalId: 'H001',
            },
        ];
    }
    async resolvePatientName(patientId, supplied) {
        try {
            const res = await this.patientsService.findById(patientId);
            if (res?.success && res.data?.fullName)
                return res.data.fullName;
        }
        catch {
        }
        return supplied || `Patient ${patientId}`;
    }
    async findAll(patientId, status, hospitalId) {
        try {
            let filteredRequests = [...this.store.load()];
            if (hospitalId)
                filteredRequests = filteredRequests.filter(req => req.hospitalId === hospitalId);
            if (patientId)
                filteredRequests = filteredRequests.filter(req => req.patientId === patientId);
            if (status)
                filteredRequests = filteredRequests.filter(req => req.status === status);
            return response_util_1.ResponseUtil.success('Ambulance requests retrieved successfully', filteredRequests);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve ambulance requests');
        }
    }
    async findById(id) {
        try {
            const request = this.store.load().find(r => r.id === id);
            if (!request)
                return response_util_1.ResponseUtil.notFound('Ambulance request', id);
            return response_util_1.ResponseUtil.success('Ambulance request retrieved successfully', request);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve ambulance request');
        }
    }
    async create(requestData) {
        try {
            const requests = this.store.load();
            const newRequestId = id_generator_util_1.IdGenerator.generateAmbulanceId();
            const patientName = await this.resolvePatientName(requestData.patientId, requestData.patientName);
            const newRequest = {
                id: newRequestId,
                patientId: requestData.patientId,
                patientName,
                pickupLocation: requestData.pickupLocation,
                contact: requestData.contact,
                notes: requestData.notes || '',
                status: api_response_interface_1.AmbulanceStatus.PENDING,
                hospitalId: requestData.hospitalId || 'H001',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            requests.push(newRequest);
            this.store.save(requests);
            this.systemService.createActivity({
                userId: requestData.patientId,
                action: 'Create',
                details: `Ambulance request ${newRequestId} created for ${newRequest.patientName}`,
                module: 'Ambulance',
                severity: 'INFO',
            });
            return response_util_1.ResponseUtil.created('Ambulance request created successfully', newRequest);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to create ambulance request');
        }
    }
    async update(id, updateData) {
        try {
            const requests = this.store.load();
            const requestIndex = requests.findIndex(r => r.id === id);
            if (requestIndex === -1)
                return response_util_1.ResponseUtil.notFound('Ambulance request', id);
            const updatedRequest = { ...requests[requestIndex], ...updateData, updatedAt: new Date().toISOString() };
            requests[requestIndex] = updatedRequest;
            this.store.save(requests);
            const isCompleted = updateData.status === api_response_interface_1.AmbulanceStatus.COMPLETED;
            this.systemService.createActivity({
                userId: updatedRequest.assignedTo || 'System',
                action: isCompleted ? 'Complete' : 'Update',
                details: isCompleted
                    ? `Ambulance transport ${id} completed for ${updatedRequest.patientName}`
                    : `Ambulance request ${id} updated to ${updatedRequest.status}`,
                module: 'Ambulance',
                severity: isCompleted ? 'SUCCESS' : 'INFO',
            });
            return response_util_1.ResponseUtil.updated('Ambulance request updated successfully', updatedRequest);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update ambulance request');
        }
    }
    async delete(id) {
        try {
            const requests = this.store.load();
            const requestIndex = requests.findIndex(r => r.id === id);
            if (requestIndex === -1)
                return response_util_1.ResponseUtil.notFound('Ambulance request', id);
            const request = requests[requestIndex];
            if (request.status === api_response_interface_1.AmbulanceStatus.COMPLETED) {
                return response_util_1.ResponseUtil.error('Cannot delete completed ambulance requests');
            }
            requests.splice(requestIndex, 1);
            this.store.save(requests);
            this.systemService.createActivity({
                userId: 'Admin',
                action: 'Delete',
                details: `Ambulance request ${id} deleted`,
                module: 'Ambulance',
                severity: 'WARNING',
            });
            return response_util_1.ResponseUtil.success('Ambulance request deleted successfully');
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to delete ambulance request');
        }
    }
    async dispatch(id, assignedTo) {
        try {
            const requests = this.store.load();
            const requestIndex = requests.findIndex(r => r.id === id);
            if (requestIndex === -1)
                return response_util_1.ResponseUtil.notFound('Ambulance request', id);
            const request = requests[requestIndex];
            if (request.status !== api_response_interface_1.AmbulanceStatus.PENDING) {
                return response_util_1.ResponseUtil.error('Cannot dispatch request that is not pending');
            }
            requests[requestIndex].status = api_response_interface_1.AmbulanceStatus.DISPATCHED;
            requests[requestIndex].assignedTo = assignedTo || 'U003';
            requests[requestIndex].updatedAt = new Date().toISOString();
            this.store.save(requests);
            return response_util_1.ResponseUtil.updated('Ambulance dispatched successfully', requests[requestIndex]);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to dispatch ambulance');
        }
    }
    async complete(id) {
        try {
            const requests = this.store.load();
            const requestIndex = requests.findIndex(r => r.id === id);
            if (requestIndex === -1)
                return response_util_1.ResponseUtil.notFound('Ambulance request', id);
            const request = requests[requestIndex];
            if (request.status !== api_response_interface_1.AmbulanceStatus.AT_HOSPITAL) {
                return response_util_1.ResponseUtil.error('Cannot complete request that has not reached hospital');
            }
            requests[requestIndex].status = api_response_interface_1.AmbulanceStatus.COMPLETED;
            requests[requestIndex].updatedAt = new Date().toISOString();
            this.store.save(requests);
            return response_util_1.ResponseUtil.updated('Ambulance request completed successfully', requests[requestIndex]);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to complete ambulance request');
        }
    }
    async updateStatus(id, status) {
        try {
            const requests = this.store.load();
            const requestIndex = requests.findIndex(r => r.id === id);
            if (requestIndex === -1)
                return response_util_1.ResponseUtil.notFound('Ambulance request', id);
            if (!this.isValidStatusTransition(requests[requestIndex].status, status)) {
                return response_util_1.ResponseUtil.error(`Invalid status transition from ${requests[requestIndex].status} to ${status}`);
            }
            requests[requestIndex].status = status;
            requests[requestIndex].updatedAt = new Date().toISOString();
            this.store.save(requests);
            return response_util_1.ResponseUtil.updated('Request status updated successfully', requests[requestIndex]);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update request status');
        }
    }
    async getStats() {
        try {
            const requests = this.store.load();
            const count = (s) => requests.filter(r => r.status === s).length;
            const byStatus = {
                [api_response_interface_1.AmbulanceStatus.PENDING]: count(api_response_interface_1.AmbulanceStatus.PENDING),
                [api_response_interface_1.AmbulanceStatus.DISPATCHED]: count(api_response_interface_1.AmbulanceStatus.DISPATCHED),
                [api_response_interface_1.AmbulanceStatus.EN_ROUTE]: count(api_response_interface_1.AmbulanceStatus.EN_ROUTE),
                [api_response_interface_1.AmbulanceStatus.PICKED_UP]: count(api_response_interface_1.AmbulanceStatus.PICKED_UP),
                [api_response_interface_1.AmbulanceStatus.AT_HOSPITAL]: count(api_response_interface_1.AmbulanceStatus.AT_HOSPITAL),
                [api_response_interface_1.AmbulanceStatus.COMPLETED]: count(api_response_interface_1.AmbulanceStatus.COMPLETED),
            };
            const stats = {
                total: requests.length,
                pending: byStatus[api_response_interface_1.AmbulanceStatus.PENDING],
                dispatched: byStatus[api_response_interface_1.AmbulanceStatus.DISPATCHED],
                enRoute: byStatus[api_response_interface_1.AmbulanceStatus.EN_ROUTE],
                pickedUp: byStatus[api_response_interface_1.AmbulanceStatus.PICKED_UP],
                atHospital: byStatus[api_response_interface_1.AmbulanceStatus.AT_HOSPITAL],
                completed: byStatus[api_response_interface_1.AmbulanceStatus.COMPLETED],
                averageResponseTime: 15,
                byStatus,
            };
            return response_util_1.ResponseUtil.success('Ambulance statistics retrieved successfully', stats);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve ambulance statistics');
        }
    }
    async findByPatient(patientId) {
        try {
            const requests = this.store.load().filter(r => r.patientId === patientId);
            return response_util_1.ResponseUtil.success(`Ambulance requests for patient ${patientId} retrieved successfully`, requests);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve patient ambulance requests');
        }
    }
    async getActiveRequests() {
        try {
            const activeRequests = this.store.load().filter(r => r.status !== api_response_interface_1.AmbulanceStatus.COMPLETED);
            return response_util_1.ResponseUtil.success('Active ambulance requests retrieved successfully', activeRequests);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve active ambulance requests');
        }
    }
    async findByAssignedStaff(assignedTo) {
        try {
            const requests = this.store.load().filter(r => r.assignedTo === assignedTo);
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
            [api_response_interface_1.AmbulanceStatus.COMPLETED]: [],
        };
        return validTransitions[currentStatus]?.includes(newStatus) || false;
    }
};
exports.AmbulanceService = AmbulanceService;
exports.AmbulanceService = AmbulanceService = AmbulanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [system_service_1.SystemService,
        patients_service_1.PatientsService])
], AmbulanceService);
//# sourceMappingURL=ambulance.service.js.map