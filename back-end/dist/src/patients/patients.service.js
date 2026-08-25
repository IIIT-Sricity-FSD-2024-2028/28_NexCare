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
exports.PatientsService = void 0;
const fs = require("fs");
const path = require("path");
const common_1 = require("@nestjs/common");
const response_util_1 = require("../common/utils/response.util");
const id_generator_util_1 = require("../common/utils/id-generator.util");
const array_util_1 = require("../common/utils/array.util");
const system_service_1 = require("../system/system.service");
let PatientsService = class PatientsService {
    constructor(systemService) {
        this.systemService = systemService;
        this.patientsFilePath = path.join(process.cwd(), 'data', 'patients.json');
    }
    loadPatients() {
        try {
            if (!fs.existsSync(this.patientsFilePath)) {
                const initial = this.getInitialMockData();
                this.savePatients(initial);
                return initial;
            }
            const raw = fs.readFileSync(this.patientsFilePath, 'utf-8');
            return JSON.parse(raw);
        }
        catch {
            return this.getInitialMockData();
        }
    }
    savePatients(patients) {
        try {
            fs.mkdirSync(path.dirname(this.patientsFilePath), { recursive: true });
            fs.writeFileSync(this.patientsFilePath, JSON.stringify(patients, null, 2), 'utf-8');
        }
        catch (err) {
            console.error('Failed to persist patients:', err);
        }
    }
    getInitialMockData() {
        return [
            {
                id: 'P001',
                fullName: 'John Anderson',
                phone: '5551234567',
                email: 'patient@gmail.com',
                patientIdDisplay: 'PAT-2026-001',
                memberSince: 'January 2024',
                status: 'Active',
                bloodGroup: 'O+',
                age: 45,
                createdAt: '2024-01-01T00:00:00Z'
            },
            {
                id: 'P002',
                fullName: 'Maria Garcia',
                phone: '5559876543',
                email: 'maria@example.com',
                patientIdDisplay: 'PAT-2026-002',
                memberSince: 'March 2025',
                status: 'Critical',
                bloodGroup: 'AB-',
                age: 62,
                createdAt: '2025-03-01T00:00:00Z'
            }
        ];
    }
    async findAll(status) {
        try {
            const patients = this.loadPatients();
            let filteredPatients = [...patients];
            if (status) {
                filteredPatients = filteredPatients.filter(patient => patient.status === status);
            }
            return response_util_1.ResponseUtil.success('Patients retrieved successfully', filteredPatients);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve patients');
        }
    }
    async findById(id) {
        try {
            const patients = this.loadPatients();
            const patient = patients.find(p => p.id === id);
            if (!patient) {
                return response_util_1.ResponseUtil.notFound('Patient', id);
            }
            return response_util_1.ResponseUtil.success('Patient retrieved successfully', patient);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve patient');
        }
    }
    async create(patientData) {
        try {
            const patients = this.loadPatients();
            const existingPatient = patients.find(p => p.email.toLowerCase() === patientData.email.toLowerCase());
            if (existingPatient) {
                return response_util_1.ResponseUtil.error('Email already exists');
            }
            const existingPhone = patients.find(p => p.phone === patientData.phone);
            if (existingPhone) {
                return response_util_1.ResponseUtil.error('Phone number already exists');
            }
            const newPatientId = id_generator_util_1.IdGenerator.generatePatientId();
            const currentYear = new Date().getFullYear();
            const randomNumber = Math.floor(Math.random() * 9000 + 1000);
            const newPatient = {
                id: newPatientId,
                fullName: patientData.fullName,
                phone: patientData.phone,
                email: patientData.email,
                patientIdDisplay: `PAT-${currentYear}-${randomNumber}`,
                memberSince: new Date().toLocaleDateString('default', { month: 'long', year: 'numeric' }),
                status: 'Active',
                bloodGroup: patientData.bloodGroup || 'Unknown',
                age: patientData.age || 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            patients.push(newPatient);
            this.savePatients(patients);
            this.systemService.createActivity({
                userId: newPatient.id,
                action: 'Create',
                details: `New patient record created for ${newPatient.fullName}`,
                module: 'Patients',
                severity: 'INFO'
            });
            return response_util_1.ResponseUtil.created('Patient created successfully', newPatient);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to create patient');
        }
    }
    async update(id, updateData) {
        try {
            const patients = this.loadPatients();
            const patientIndex = patients.findIndex(p => p.id === id);
            if (patientIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Patient', id);
            }
            if (updateData.email) {
                const existing = patients.find(p => p.email.toLowerCase() === updateData.email.toLowerCase() && p.id !== id);
                if (existing) {
                    return response_util_1.ResponseUtil.error('Email already exists');
                }
            }
            patients[patientIndex] = {
                ...patients[patientIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            this.savePatients(patients);
            this.systemService.createActivity({
                userId: 'Admin',
                action: 'Update',
                details: `Patient record ${id} (${patients[patientIndex].fullName}) updated`,
                module: 'Patients',
                severity: 'INFO'
            });
            return response_util_1.ResponseUtil.updated('Patient updated successfully', patients[patientIndex]);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update patient');
        }
    }
    async delete(id) {
        try {
            const patients = this.loadPatients();
            const patientIndex = patients.findIndex(p => p.id === id);
            if (patientIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Patient', id);
            }
            const patient = patients[patientIndex];
            patients.splice(patientIndex, 1);
            this.savePatients(patients);
            this.systemService.createActivity({
                userId: 'Admin',
                action: 'Delete',
                details: `Patient record ${id} (${patient.fullName}) deleted`,
                module: 'Patients',
                severity: 'WARNING'
            });
            return response_util_1.ResponseUtil.deleted('Patient');
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to delete patient');
        }
    }
    async getStats() {
        try {
            const patients = this.loadPatients();
            const totalPatients = patients.length;
            const activePatients = patients.filter(p => p.status === 'Active').length;
            const criticalPatients = patients.filter(p => p.status === 'Critical').length;
            const totalAge = patients.reduce((sum, patient) => sum + patient.age, 0);
            const averageAge = totalPatients > 0 ? Math.round(totalAge / totalPatients) : 0;
            const bloodGroupDistribution = {};
            patients.forEach(patient => {
                bloodGroupDistribution[patient.bloodGroup] = (bloodGroupDistribution[patient.bloodGroup] || 0) + 1;
            });
            const stats = {
                total: totalPatients,
                active: activePatients,
                critical: criticalPatients,
                averageAge,
                bloodGroupDistribution
            };
            return response_util_1.ResponseUtil.success('Patient statistics retrieved successfully', stats);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve patient statistics');
        }
    }
    async search(query) {
        try {
            const patients = this.loadPatients();
            const searchTerm = query.toLowerCase();
            const matchingPatients = patients.filter(patient => patient.fullName.toLowerCase().includes(searchTerm) ||
                patient.email.toLowerCase().includes(searchTerm) ||
                patient.patientIdDisplay.toLowerCase().includes(searchTerm) ||
                patient.phone.includes(searchTerm));
            return response_util_1.ResponseUtil.success('Search results retrieved successfully', matchingPatients);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to search patients');
        }
    }
    async findByBloodGroup(bloodGroup) {
        try {
            const patients = this.loadPatients().filter(p => p.bloodGroup === bloodGroup);
            return response_util_1.ResponseUtil.success(`Patients with blood group '${bloodGroup}' retrieved successfully`, patients);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve patients by blood group');
        }
    }
    async updateStatus(id, status) {
        try {
            const patients = this.loadPatients();
            const updatedPatient = array_util_1.ArrayUtil.updateById(patients, id, {
                status,
                updatedAt: new Date().toISOString()
            });
            if (!updatedPatient) {
                return response_util_1.ResponseUtil.notFound('Patient', id);
            }
            this.savePatients(patients);
            return response_util_1.ResponseUtil.updated('Patient status updated successfully', updatedPatient);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update patient status');
        }
    }
    async findByAgeRange(minAge, maxAge) {
        try {
            const patients = this.loadPatients().filter(p => p.age >= minAge && p.age <= maxAge);
            return response_util_1.ResponseUtil.success(`Patients aged ${minAge}-${maxAge} retrieved successfully`, patients);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve patients by age range');
        }
    }
};
exports.PatientsService = PatientsService;
exports.PatientsService = PatientsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [system_service_1.SystemService])
], PatientsService);
//# sourceMappingURL=patients.service.js.map