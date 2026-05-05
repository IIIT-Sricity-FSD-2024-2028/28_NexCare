"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedsService = void 0;
const common_1 = require("@nestjs/common");
const response_util_1 = require("../common/utils/response.util");
const array_util_1 = require("../common/utils/array.util");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
let BedsService = class BedsService {
    constructor() {
        this.beds = [
            { id: 'E1', ward: 'Emergency', status: api_response_interface_1.BedStatus.AVAILABLE, patient: '' },
            { id: 'E2', ward: 'Emergency', status: api_response_interface_1.BedStatus.AVAILABLE, patient: '' },
            { id: 'E3', ward: 'Emergency', status: api_response_interface_1.BedStatus.AVAILABLE, patient: '' },
            { id: 'G1', ward: 'General', status: api_response_interface_1.BedStatus.AVAILABLE, patient: '' },
            { id: 'G2', ward: 'General', status: api_response_interface_1.BedStatus.AVAILABLE, patient: '' },
            { id: 'G3', ward: 'General', status: api_response_interface_1.BedStatus.AVAILABLE, patient: '' },
            { id: 'G4', ward: 'General', status: api_response_interface_1.BedStatus.AVAILABLE, patient: '' },
            { id: 'G5', ward: 'General', status: api_response_interface_1.BedStatus.AVAILABLE, patient: '' },
            { id: 'G6', ward: 'General', status: api_response_interface_1.BedStatus.AVAILABLE, patient: '' },
            { id: 'G7', ward: 'General', status: api_response_interface_1.BedStatus.AVAILABLE, patient: '' },
            { id: 'G8', ward: 'General', status: api_response_interface_1.BedStatus.AVAILABLE, patient: '' },
            { id: 'G9', ward: 'General', status: api_response_interface_1.BedStatus.AVAILABLE, patient: '' },
            { id: 'G10', ward: 'General', status: api_response_interface_1.BedStatus.AVAILABLE, patient: '' },
            { id: 'P1', ward: 'Pediatrics', status: api_response_interface_1.BedStatus.AVAILABLE, patient: '' },
            { id: 'P2', ward: 'Pediatrics', status: api_response_interface_1.BedStatus.AVAILABLE, patient: '' },
            { id: 'P3', ward: 'Pediatrics', status: api_response_interface_1.BedStatus.AVAILABLE, patient: '' },
            { id: 'M1', ward: 'Maternity', status: api_response_interface_1.BedStatus.AVAILABLE, patient: '' },
            { id: 'M2', ward: 'Maternity', status: api_response_interface_1.BedStatus.AVAILABLE, patient: '' },
            { id: 'M3', ward: 'Maternity', status: api_response_interface_1.BedStatus.AVAILABLE, patient: '' },
            { id: 'M4', ward: 'Maternity', status: api_response_interface_1.BedStatus.AVAILABLE, patient: '' }
        ];
    }
    async findAll(ward, status) {
        try {
            let filteredBeds = [...this.beds];
            if (ward) {
                filteredBeds = filteredBeds.filter(bed => bed.ward === ward);
            }
            if (status) {
                filteredBeds = filteredBeds.filter(bed => bed.status === status);
            }
            return response_util_1.ResponseUtil.success('Beds retrieved successfully', filteredBeds);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve beds');
        }
    }
    async findById(id) {
        try {
            const bed = array_util_1.ArrayUtil.findById(this.beds, id);
            if (!bed) {
                return response_util_1.ResponseUtil.notFound('Bed', id);
            }
            return response_util_1.ResponseUtil.success('Bed retrieved successfully', bed);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve bed');
        }
    }
    async create(bedData) {
        try {
            const existingBed = this.beds.find(b => b.id === bedData.id);
            if (existingBed) {
                return response_util_1.ResponseUtil.error('Bed ID already exists');
            }
            const newBed = {
                id: bedData.id,
                ward: bedData.ward,
                status: api_response_interface_1.BedStatus.AVAILABLE,
                patient: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.beds.push(newBed);
            return response_util_1.ResponseUtil.created('Bed created successfully', newBed);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to create bed');
        }
    }
    async update(id, updateData) {
        try {
            const bedIndex = this.beds.findIndex(b => b.id === id);
            if (bedIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Bed', id);
            }
            if (updateData.patient && updateData.status !== api_response_interface_1.BedStatus.OCCUPIED) {
                return response_util_1.ResponseUtil.error('Cannot assign patient to non-occupied bed');
            }
            if (updateData.status === api_response_interface_1.BedStatus.OCCUPIED && !updateData.patient) {
                return response_util_1.ResponseUtil.error('Occupied bed must have assigned patient');
            }
            if (updateData.status === api_response_interface_1.BedStatus.AVAILABLE && updateData.patient) {
                return response_util_1.ResponseUtil.error('Available bed cannot have assigned patient');
            }
            const updatedBed = {
                ...this.beds[bedIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            this.beds[bedIndex] = updatedBed;
            return response_util_1.ResponseUtil.updated('Bed updated successfully', updatedBed);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update bed');
        }
    }
    async delete(id) {
        try {
            const bedIndex = this.beds.findIndex(b => b.id === id);
            if (bedIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Bed', id);
            }
            const bed = this.beds[bedIndex];
            if (bed.status === api_response_interface_1.BedStatus.OCCUPIED || bed.status === api_response_interface_1.BedStatus.CRITICAL) {
                return response_util_1.ResponseUtil.error('Cannot delete occupied or critical beds');
            }
            this.beds.splice(bedIndex, 1);
            return response_util_1.ResponseUtil.deleted('Bed');
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to delete bed');
        }
    }
    async allocate(id, patient) {
        try {
            const bedIndex = this.beds.findIndex(b => b.id === id);
            if (bedIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Bed', id);
            }
            const bed = this.beds[bedIndex];
            if (bed.status !== api_response_interface_1.BedStatus.AVAILABLE) {
                return response_util_1.ResponseUtil.error('Cannot allocate bed that is not available');
            }
            const existingAllocation = this.beds.find(b => b.patient === patient);
            if (existingAllocation) {
                return response_util_1.ResponseUtil.error(`Patient ${patient} is already allocated to bed ${existingAllocation.id}`);
            }
            this.beds[bedIndex].status = api_response_interface_1.BedStatus.OCCUPIED;
            this.beds[bedIndex].patient = patient;
            this.beds[bedIndex].updatedAt = new Date().toISOString();
            const updatedBed = this.beds[bedIndex];
            return response_util_1.ResponseUtil.updated('Bed allocated successfully', updatedBed);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to allocate bed');
        }
    }
    async release(id) {
        try {
            const bedIndex = this.beds.findIndex(b => b.id === id);
            if (bedIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Bed', id);
            }
            const bed = this.beds[bedIndex];
            if (bed.status !== api_response_interface_1.BedStatus.OCCUPIED) {
                return response_util_1.ResponseUtil.error('Cannot release bed that is not occupied');
            }
            this.beds[bedIndex].status = api_response_interface_1.BedStatus.AVAILABLE;
            this.beds[bedIndex].patient = '';
            this.beds[bedIndex].updatedAt = new Date().toISOString();
            const updatedBed = this.beds[bedIndex];
            return response_util_1.ResponseUtil.updated('Bed released successfully', updatedBed);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to release bed');
        }
    }
    async getStats() {
        try {
            const totalBeds = this.beds.length;
            const availableBeds = this.beds.filter(b => b.status === api_response_interface_1.BedStatus.AVAILABLE).length;
            const occupiedBeds = this.beds.filter(b => b.status === api_response_interface_1.BedStatus.OCCUPIED).length;
            const criticalBeds = this.beds.filter(b => b.status === api_response_interface_1.BedStatus.CRITICAL).length;
            const maintenanceBeds = this.beds.filter(b => b.status === api_response_interface_1.BedStatus.MAINTENANCE).length;
            const byWard = {};
            this.beds.forEach(bed => {
                byWard[bed.ward] = (byWard[bed.ward] || 0) + 1;
            });
            const occupancyRate = totalBeds > 0 ? Math.round(((occupiedBeds + criticalBeds) / totalBeds) * 100) : 0;
            const stats = {
                total: totalBeds,
                available: availableBeds,
                occupied: occupiedBeds,
                critical: criticalBeds,
                maintenance: maintenanceBeds,
                byWard,
                occupancyRate
            };
            return response_util_1.ResponseUtil.success('Bed statistics retrieved successfully', stats);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve bed statistics');
        }
    }
    async findByWard(ward) {
        try {
            const beds = this.beds.filter(b => b.ward === ward);
            return response_util_1.ResponseUtil.success(`Beds in ${ward} ward retrieved successfully`, beds);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve ward beds');
        }
    }
    async getAvailableBeds() {
        try {
            const availableBeds = this.beds.filter(b => b.status === api_response_interface_1.BedStatus.AVAILABLE);
            return response_util_1.ResponseUtil.success('Available beds retrieved successfully', availableBeds);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve available beds');
        }
    }
    async findByPatient(patient) {
        try {
            const beds = this.beds.filter(b => b.patient === patient);
            return response_util_1.ResponseUtil.success(`Beds allocated to ${patient} retrieved successfully`, beds);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve patient bed allocation');
        }
    }
    async updateStatus(id, status) {
        try {
            const bedIndex = this.beds.findIndex(b => b.id === id);
            if (bedIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Bed', id);
            }
            const currentBed = this.beds[bedIndex];
            if (status === api_response_interface_1.BedStatus.AVAILABLE && currentBed.patient) {
                return response_util_1.ResponseUtil.error('Cannot set bed to available while patient is assigned');
            }
            if (status === api_response_interface_1.BedStatus.CRITICAL && !currentBed.patient) {
                return response_util_1.ResponseUtil.error('Critical status requires patient assignment');
            }
            this.beds[bedIndex].status = status;
            this.beds[bedIndex].updatedAt = new Date().toISOString();
            const updatedBed = this.beds[bedIndex];
            return response_util_1.ResponseUtil.updated('Bed status updated successfully', updatedBed);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update bed status');
        }
    }
    async getOccupancyByWard() {
        try {
            const wards = [...new Set(this.beds.map(b => b.ward))];
            const occupancyData = {};
            wards.forEach(ward => {
                const wardBeds = this.beds.filter(b => b.ward === ward);
                const total = wardBeds.length;
                const occupied = wardBeds.filter(b => b.status === api_response_interface_1.BedStatus.OCCUPIED || b.status === api_response_interface_1.BedStatus.CRITICAL).length;
                const available = wardBeds.filter(b => b.status === api_response_interface_1.BedStatus.AVAILABLE).length;
                const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
                occupancyData[ward] = { total, occupied, available, occupancyRate };
            });
            return response_util_1.ResponseUtil.success('Occupancy data by ward retrieved successfully', occupancyData);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve occupancy data');
        }
    }
};
exports.BedsService = BedsService;
exports.BedsService = BedsService = __decorate([
    (0, common_1.Injectable)()
], BedsService);
//# sourceMappingURL=beds.service.js.map