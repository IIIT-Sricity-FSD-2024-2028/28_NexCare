"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HospitalsService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
const response_util_1 = require("../common/utils/response.util");
const id_generator_util_1 = require("../common/utils/id-generator.util");
let HospitalsService = class HospitalsService {
    constructor() {
        this.hospitalsFilePath = path.join(process.cwd(), 'data', 'hospitals.json');
    }
    get hospitals() {
        try {
            const raw = fs.readFileSync(this.hospitalsFilePath, 'utf-8');
            return JSON.parse(raw);
        }
        catch {
            return [];
        }
    }
    set hospitals(val) {
        try {
            fs.mkdirSync(path.dirname(this.hospitalsFilePath), { recursive: true });
            fs.writeFileSync(this.hospitalsFilePath, JSON.stringify(val, null, 2), 'utf-8');
        }
        catch (err) {
            console.error('Failed to persist hospitals to disk:', err);
        }
    }
    async findAll(status, speciality, city, pincode) {
        try {
            let result = this.hospitals;
            if (status) {
                result = result.filter(h => h.verificationStatus === status);
            }
            if (speciality && speciality.trim() !== '') {
                const targetSpec = speciality.trim().toLowerCase();
                result = result.filter((h) => {
                    const specsArray = Array.isArray(h.specialities)
                        ? h.specialities
                        : Array.isArray(h.specialties)
                            ? h.specialties
                            : null;
                    if (specsArray) {
                        const hasMatch = specsArray.some((s) => typeof s === 'string' && s.trim().toLowerCase() === targetSpec);
                        if (hasMatch)
                            return true;
                    }
                    if (typeof h.speciality === 'string' && h.speciality.trim().toLowerCase() === targetSpec) {
                        return true;
                    }
                    if (typeof h.specialty === 'string' && h.specialty.trim().toLowerCase() === targetSpec) {
                        return true;
                    }
                    if (Array.isArray(h.doctors)) {
                        const docMatch = h.doctors.some((d) => (typeof d.speciality === 'string' && d.speciality.trim().toLowerCase() === targetSpec) ||
                            (typeof d.specialty === 'string' && d.specialty.trim().toLowerCase() === targetSpec) ||
                            (typeof d.department === 'string' && d.department.trim().toLowerCase() === targetSpec));
                        if (docMatch)
                            return true;
                    }
                    if (Array.isArray(h.departments)) {
                        const deptMatch = h.departments.some((d) => (typeof d === 'string' && d.trim().toLowerCase() === targetSpec) ||
                            (typeof d?.name === 'string' && d.name.trim().toLowerCase() === targetSpec));
                        if (deptMatch)
                            return true;
                    }
                    return false;
                });
            }
            if (city && city.trim() !== '') {
                const targetCity = city.trim().toLowerCase();
                result = result.filter(h => h.city && h.city.trim().toLowerCase() === targetCity);
            }
            if (pincode && pincode.trim() !== '') {
                const targetPincode = pincode.trim();
                result = result.filter(h => h.pincode && h.pincode.trim() === targetPincode);
            }
            return response_util_1.ResponseUtil.success('Hospitals retrieved successfully', result);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve hospitals');
        }
    }
    async findById(id) {
        try {
            const hospital = this.hospitals.find(h => h.id === id);
            if (!hospital) {
                return response_util_1.ResponseUtil.notFound('Hospital', id);
            }
            return response_util_1.ResponseUtil.success('Hospital retrieved successfully', hospital);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve hospital');
        }
    }
    async create(data) {
        try {
            const existing = this.hospitals.find(h => h.registrationNumber === data.registrationNumber);
            if (existing) {
                return response_util_1.ResponseUtil.error('Hospital with this registration number already exists');
            }
            const newHospital = {
                ...data,
                id: id_generator_util_1.IdGenerator.generate('H'),
                verificationStatus: api_response_interface_1.VerificationStatus.PENDING_VERIFICATION,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            const all = this.hospitals;
            all.push(newHospital);
            this.hospitals = all;
            return response_util_1.ResponseUtil.created('Hospital registered successfully', newHospital);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to register hospital');
        }
    }
    async update(id, updateData) {
        try {
            const all = this.hospitals;
            const idx = all.findIndex(h => h.id === id);
            if (idx === -1)
                return response_util_1.ResponseUtil.notFound('Hospital', id);
            all[idx] = {
                ...all[idx],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            this.hospitals = all;
            return response_util_1.ResponseUtil.updated('Hospital updated successfully', all[idx]);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update hospital');
        }
    }
    async findNearby(city, state, pincode) {
        try {
            const verified = this.hospitals.filter((h) => !h.verificationStatus || h.verificationStatus === api_response_interface_1.VerificationStatus.VERIFIED);
            const targetCity = city ? city.trim().toLowerCase() : null;
            const targetState = state ? state.trim().toLowerCase() : null;
            const targetPincode = pincode ? pincode.trim() : null;
            verified.sort((a, b) => {
                let scoreA = 0;
                let scoreB = 0;
                if (targetPincode && String(a.pincode || '').trim() === targetPincode)
                    scoreA += 3;
                if (targetPincode && String(b.pincode || '').trim() === targetPincode)
                    scoreB += 3;
                if (targetCity && String(a.city || '').trim().toLowerCase() === targetCity)
                    scoreA += 2;
                if (targetCity && String(b.city || '').trim().toLowerCase() === targetCity)
                    scoreB += 2;
                if (targetState && String(a.state || '').trim().toLowerCase() === targetState)
                    scoreA += 1;
                if (targetState && String(b.state || '').trim().toLowerCase() === targetState)
                    scoreB += 1;
                return scoreB - scoreA;
            });
            return response_util_1.ResponseUtil.success('Nearby hospitals retrieved successfully', verified);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve nearby hospitals');
        }
    }
    async getHospitalPerformance(hospitalId) {
        try {
            const hospital = this.hospitals.find(h => h.id === hospitalId);
            if (!hospital) {
                return response_util_1.ResponseUtil.notFound('Hospital', hospitalId);
            }
            const performanceMetrics = {
                hospitalId: hospital.id,
                hospitalName: hospital.name,
                bedOccupancyRate: hospital.performanceMetrics?.bedOccupancyRate || 0,
                appointmentCompletionRate: hospital.performanceMetrics?.appointmentCompletionRate || 0,
                patientSatisfactionScore: hospital.performanceMetrics?.patientSatisfactionScore || 0,
                totalBeds: hospital.totalBeds,
                icuBeds: hospital.icuBeds,
                verificationStatus: hospital.verificationStatus,
                lastUpdated: hospital.performanceMetrics?.lastUpdated || hospital.updatedAt
            };
            return response_util_1.ResponseUtil.success('Hospital performance retrieved successfully', performanceMetrics);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve hospital performance');
        }
    }
    async updatePerformanceMetrics(hospitalId, metrics) {
        try {
            const all = this.hospitals;
            const idx = all.findIndex(h => h.id === hospitalId);
            if (idx === -1)
                return response_util_1.ResponseUtil.notFound('Hospital', hospitalId);
            all[idx] = {
                ...all[idx],
                performanceMetrics: {
                    ...all[idx].performanceMetrics,
                    ...metrics,
                    lastUpdated: new Date().toISOString()
                },
                updatedAt: new Date().toISOString()
            };
            this.hospitals = all;
            return response_util_1.ResponseUtil.updated('Hospital performance metrics updated successfully', all[idx].performanceMetrics);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update hospital performance metrics');
        }
    }
};
exports.HospitalsService = HospitalsService;
exports.HospitalsService = HospitalsService = __decorate([
    (0, common_1.Injectable)()
], HospitalsService);
//# sourceMappingURL=hospitals.service.js.map