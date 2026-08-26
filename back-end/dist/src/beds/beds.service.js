"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BedsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedsService = void 0;
const common_1 = require("@nestjs/common");
const response_util_1 = require("../common/utils/response.util");
const array_util_1 = require("../common/utils/array.util");
const file_store_util_1 = require("../common/utils/file-store.util");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
let BedsService = BedsService_1 = class BedsService {
    constructor() {
        this.store = new file_store_util_1.FileStore('beds.json', () => BedsService_1.seed());
    }
    static seed() {
        const mk = (id, ward) => ({
            id, ward, status: api_response_interface_1.BedStatus.AVAILABLE, patient: '', hospitalId: 'H001',
        });
        return [
            mk('E1', 'Emergency'), mk('E2', 'Emergency'), mk('E3', 'Emergency'),
            mk('G1', 'General'), mk('G2', 'General'), mk('G3', 'General'), mk('G4', 'General'),
            mk('G5', 'General'), mk('G6', 'General'), mk('G7', 'General'), mk('G8', 'General'),
            mk('G9', 'General'), mk('G10', 'General'),
            mk('P1', 'Pediatrics'), mk('P2', 'Pediatrics'), mk('P3', 'Pediatrics'),
            mk('M1', 'Maternity'), mk('M2', 'Maternity'), mk('M3', 'Maternity'), mk('M4', 'Maternity'),
        ];
    }
    async findAll(ward, status, hospitalId) {
        try {
            let filteredBeds = [...this.store.load()];
            if (hospitalId)
                filteredBeds = filteredBeds.filter(bed => bed.hospitalId === hospitalId);
            if (ward)
                filteredBeds = filteredBeds.filter(bed => bed.ward === ward);
            if (status)
                filteredBeds = filteredBeds.filter(bed => bed.status === status);
            return response_util_1.ResponseUtil.success('Beds retrieved successfully', filteredBeds);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve beds');
        }
    }
    async findById(id) {
        try {
            const bed = array_util_1.ArrayUtil.findById(this.store.load(), id);
            if (!bed)
                return response_util_1.ResponseUtil.notFound('Bed', id);
            return response_util_1.ResponseUtil.success('Bed retrieved successfully', bed);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve bed');
        }
    }
    getBedById(id) {
        return this.store.load().find(b => b.id === id);
    }
    async create(bedData) {
        try {
            const beds = this.store.load();
            if (beds.find(b => b.id === bedData.id)) {
                return response_util_1.ResponseUtil.error('Bed ID already exists');
            }
            const newBed = {
                id: bedData.id,
                ward: bedData.ward,
                status: api_response_interface_1.BedStatus.AVAILABLE,
                patient: '',
                hospitalId: bedData.hospitalId || 'H001',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            beds.push(newBed);
            this.store.save(beds);
            return response_util_1.ResponseUtil.created('Bed created successfully', newBed);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to create bed');
        }
    }
    async update(id, updateData) {
        try {
            const beds = this.store.load();
            const bedIndex = beds.findIndex(b => b.id === id);
            if (bedIndex === -1)
                return response_util_1.ResponseUtil.notFound('Bed', id);
            const patientStatuses = [api_response_interface_1.BedStatus.OCCUPIED, api_response_interface_1.BedStatus.CRITICAL];
            if (updateData.patient && !patientStatuses.includes(updateData.status)) {
                return response_util_1.ResponseUtil.error('Cannot assign patient to a bed that is not occupied or critical');
            }
            if (patientStatuses.includes(updateData.status) && !updateData.patient) {
                return response_util_1.ResponseUtil.error(`${updateData.status} bed must have an assigned patient`);
            }
            if (updateData.status === api_response_interface_1.BedStatus.AVAILABLE && updateData.patient) {
                return response_util_1.ResponseUtil.error('Available bed cannot have assigned patient');
            }
            const updatedBed = { ...beds[bedIndex], ...updateData, updatedAt: new Date().toISOString() };
            beds[bedIndex] = updatedBed;
            this.store.save(beds);
            return response_util_1.ResponseUtil.updated('Bed', updatedBed);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update bed');
        }
    }
    async delete(id) {
        try {
            const beds = this.store.load();
            const bedIndex = beds.findIndex(b => b.id === id);
            if (bedIndex === -1)
                return response_util_1.ResponseUtil.notFound('Bed', id);
            const bed = beds[bedIndex];
            if (bed.status === api_response_interface_1.BedStatus.OCCUPIED || bed.status === api_response_interface_1.BedStatus.CRITICAL) {
                return response_util_1.ResponseUtil.error('Cannot delete occupied or critical beds');
            }
            beds.splice(bedIndex, 1);
            this.store.save(beds);
            return response_util_1.ResponseUtil.deleted('Bed');
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to delete bed');
        }
    }
    async allocate(id, patient) {
        try {
            const beds = this.store.load();
            const bedIndex = beds.findIndex(b => b.id === id);
            if (bedIndex === -1)
                return response_util_1.ResponseUtil.notFound('Bed', id);
            const bed = beds[bedIndex];
            if (bed.status !== api_response_interface_1.BedStatus.AVAILABLE) {
                return response_util_1.ResponseUtil.error('Cannot allocate bed that is not available');
            }
            const existingAllocation = beds.find(b => b.patient && b.patient === patient);
            if (existingAllocation) {
                return response_util_1.ResponseUtil.error(`Patient ${patient} is already allocated to bed ${existingAllocation.id}`);
            }
            beds[bedIndex].status = api_response_interface_1.BedStatus.OCCUPIED;
            beds[bedIndex].patient = patient;
            beds[bedIndex].updatedAt = new Date().toISOString();
            this.store.save(beds);
            return response_util_1.ResponseUtil.success('Bed allocated successfully', beds[bedIndex]);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to allocate bed');
        }
    }
    async release(id) {
        try {
            const beds = this.store.load();
            const bedIndex = beds.findIndex(b => b.id === id);
            if (bedIndex === -1)
                return response_util_1.ResponseUtil.notFound('Bed', id);
            const bed = beds[bedIndex];
            if (bed.status !== api_response_interface_1.BedStatus.OCCUPIED && bed.status !== api_response_interface_1.BedStatus.CRITICAL) {
                return response_util_1.ResponseUtil.error('Cannot release bed that is not occupied');
            }
            beds[bedIndex].status = api_response_interface_1.BedStatus.AVAILABLE;
            beds[bedIndex].patient = '';
            beds[bedIndex].updatedAt = new Date().toISOString();
            this.store.save(beds);
            return response_util_1.ResponseUtil.success('Bed released successfully', beds[bedIndex]);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to release bed');
        }
    }
    async getStats(hospitalId) {
        try {
            let beds = this.store.load();
            if (hospitalId)
                beds = beds.filter(b => b.hospitalId === hospitalId);
            const totalBeds = beds.length;
            const availableBeds = beds.filter(b => b.status === api_response_interface_1.BedStatus.AVAILABLE).length;
            const occupiedBeds = beds.filter(b => b.status === api_response_interface_1.BedStatus.OCCUPIED).length;
            const criticalBeds = beds.filter(b => b.status === api_response_interface_1.BedStatus.CRITICAL).length;
            const maintenanceBeds = beds.filter(b => b.status === api_response_interface_1.BedStatus.MAINTENANCE).length;
            const byWard = {};
            beds.forEach(bed => { byWard[bed.ward] = (byWard[bed.ward] || 0) + 1; });
            const occupancyRate = totalBeds > 0 ? Math.round(((occupiedBeds + criticalBeds) / totalBeds) * 100) : 0;
            const stats = {
                total: totalBeds,
                available: availableBeds,
                occupied: occupiedBeds,
                critical: criticalBeds,
                maintenance: maintenanceBeds,
                byWard,
                occupancyRate,
            };
            return response_util_1.ResponseUtil.success('Bed statistics retrieved successfully', stats);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve bed statistics');
        }
    }
    async findByWard(ward) {
        try {
            const beds = this.store.load().filter(b => b.ward === ward);
            return response_util_1.ResponseUtil.success(`Beds in ${ward} ward retrieved successfully`, beds);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve ward beds');
        }
    }
    async getAvailableBeds() {
        try {
            const availableBeds = this.store.load().filter(b => b.status === api_response_interface_1.BedStatus.AVAILABLE);
            return response_util_1.ResponseUtil.success('Available beds retrieved successfully', availableBeds);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve available beds');
        }
    }
    async findByPatient(patient) {
        try {
            const beds = this.store.load().filter(b => b.patient === patient);
            return response_util_1.ResponseUtil.success(`Beds allocated to ${patient} retrieved successfully`, beds);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve patient bed allocation');
        }
    }
    async updateStatus(id, status) {
        try {
            const beds = this.store.load();
            const bedIndex = beds.findIndex(b => b.id === id);
            if (bedIndex === -1)
                return response_util_1.ResponseUtil.notFound('Bed', id);
            const currentBed = beds[bedIndex];
            if (status === api_response_interface_1.BedStatus.AVAILABLE && currentBed.patient) {
                return response_util_1.ResponseUtil.error('Cannot set bed to available while patient is assigned');
            }
            if (status === api_response_interface_1.BedStatus.CRITICAL && !currentBed.patient) {
                return response_util_1.ResponseUtil.error('Critical status requires patient assignment');
            }
            beds[bedIndex].status = status;
            beds[bedIndex].updatedAt = new Date().toISOString();
            this.store.save(beds);
            return response_util_1.ResponseUtil.updated('Bed status', beds[bedIndex]);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update bed status');
        }
    }
    async getOccupancyByWard() {
        try {
            const beds = this.store.load();
            const wards = [...new Set(beds.map(b => b.ward))];
            const occupancyData = {};
            wards.forEach(ward => {
                const wardBeds = beds.filter(b => b.ward === ward);
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
exports.BedsService = BedsService = BedsService_1 = __decorate([
    (0, common_1.Injectable)()
], BedsService);
//# sourceMappingURL=beds.service.js.map