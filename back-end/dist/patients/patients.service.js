"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientsService = void 0;
const common_1 = require("@nestjs/common");
const response_util_1 = require("../common/utils/response.util");
const id_generator_util_1 = require("../common/utils/id-generator.util");
const array_util_1 = require("../common/utils/array.util");
let PatientsService = class PatientsService {
    constructor() {
        this.patients = [
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
            },
            {
                id: 'P003',
                fullName: 'Ravi Kumar',
                phone: '9876543210',
                email: 'ravi.kumar@example.com',
                patientIdDisplay: 'PAT-2026-003',
                memberSince: 'February 2026',
                status: 'Active',
                bloodGroup: 'B+',
                age: 28,
                createdAt: '2026-02-01T00:00:00Z'
            },
            {
                id: 'P004',
                fullName: 'Anita Sharma',
                phone: '8765432109',
                email: 'anita.sharma@example.com',
                patientIdDisplay: 'PAT-2026-004',
                memberSince: 'February 2026',
                status: 'Critical',
                bloodGroup: 'A-',
                age: 35,
                createdAt: '2026-02-01T00:00:00Z'
            },
            {
                id: 'P005',
                fullName: 'Priya Singh',
                phone: '7654321098',
                email: 'priya.singh@example.com',
                patientIdDisplay: 'PAT-2026-005',
                memberSince: 'February 2026',
                status: 'Active',
                bloodGroup: 'O-',
                age: 31,
                createdAt: '2026-02-01T00:00:00Z'
            },
            {
                id: 'P006',
                fullName: 'Amit Verma',
                phone: '6543210987',
                email: 'amit.verma@example.com',
                patientIdDisplay: 'PAT-2026-006',
                memberSince: 'February 2026',
                status: 'Active',
                bloodGroup: 'B-',
                age: 42,
                createdAt: '2026-02-01T00:00:00Z'
            },
            {
                id: 'P007',
                fullName: 'Kiran Rao',
                phone: '5432109876',
                email: 'kiran.rao@example.com',
                patientIdDisplay: 'PAT-2026-007',
                memberSince: 'February 2026',
                status: 'Active',
                bloodGroup: 'AB+',
                age: 29,
                createdAt: '2026-02-01T00:00:00Z'
            },
            {
                id: 'P008',
                fullName: 'Rahul Jain',
                phone: '4321098765',
                email: 'rahul.jain@example.com',
                patientIdDisplay: 'PAT-2026-008',
                memberSince: 'February 2026',
                status: 'Active',
                bloodGroup: 'A+',
                age: 38,
                createdAt: '2026-02-01T00:00:00Z'
            },
            {
                id: 'P009',
                fullName: 'Deepak Kumar',
                phone: '3210987654',
                email: 'deepak.kumar@example.com',
                patientIdDisplay: 'PAT-2026-009',
                memberSince: 'February 2026',
                status: 'Active',
                bloodGroup: 'O+',
                age: 47,
                createdAt: '2026-02-01T00:00:00Z'
            },
            {
                id: 'P010',
                fullName: 'Arjun Reddy',
                phone: '2109876543',
                email: 'arjun.reddy@example.com',
                patientIdDisplay: 'PAT-2026-010',
                memberSince: 'February 2026',
                status: 'Active',
                bloodGroup: 'B+',
                age: 33,
                createdAt: '2026-02-01T00:00:00Z'
            },
            {
                id: 'P011',
                fullName: 'Neha Gupta',
                phone: '1098765432',
                email: 'neha.gupta@example.com',
                patientIdDisplay: 'PAT-2026-011',
                memberSince: 'February 2026',
                status: 'Active',
                bloodGroup: 'A-',
                age: 26,
                createdAt: '2026-02-01T00:00:00Z'
            },
            {
                id: 'P012',
                fullName: 'Kid A',
                phone: '9999000001',
                email: 'kid.a@example.com',
                patientIdDisplay: 'PAT-2026-012',
                memberSince: 'February 2026',
                status: 'Active',
                bloodGroup: 'O+',
                age: 8,
                createdAt: '2026-02-01T00:00:00Z'
            },
            {
                id: 'P013',
                fullName: 'Mother A',
                phone: '9999000002',
                email: 'mother.a@example.com',
                patientIdDisplay: 'PAT-2026-013',
                memberSince: 'February 2026',
                status: 'Active',
                bloodGroup: 'B-',
                age: 30,
                createdAt: '2026-02-01T00:00:00Z'
            },
            {
                id: 'P014',
                fullName: 'Mother B',
                phone: '9999000003',
                email: 'mother.b@example.com',
                patientIdDisplay: 'PAT-2026-014',
                memberSince: 'February 2026',
                status: 'Active',
                bloodGroup: 'AB-',
                age: 34,
                createdAt: '2026-02-01T00:00:00Z'
            },
            {
                id: 'P015',
                fullName: 'John Doe',
                phone: '9999000004',
                email: 'johndoe@example.com',
                patientIdDisplay: 'PAT-2026-015',
                memberSince: 'January 2026',
                status: 'Active',
                bloodGroup: 'O+',
                age: 32,
                createdAt: '2026-01-01T00:00:00Z'
            }
        ];
    }
    async findAll(status) {
        try {
            let filteredPatients = [...this.patients];
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
            const patient = array_util_1.ArrayUtil.findById(this.patients, id);
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
            const existingPatient = array_util_1.ArrayUtil.searchByText(this.patients, patientData.email, ['email']);
            if (existingPatient.length > 0) {
                return response_util_1.ResponseUtil.error('Email already exists');
            }
            const existingPhone = array_util_1.ArrayUtil.searchByText(this.patients, patientData.phone, ['phone']);
            if (existingPhone.length > 0) {
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
            this.patients.push(newPatient);
            return response_util_1.ResponseUtil.created('Patient created successfully', newPatient);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to create patient');
        }
    }
    async update(id, updateData) {
        try {
            const patient = array_util_1.ArrayUtil.findById(this.patients, id);
            if (!patient) {
                return response_util_1.ResponseUtil.notFound('Patient', id);
            }
            if (updateData.email) {
                const allPatientsWithEmail = array_util_1.ArrayUtil.searchByText(this.patients, updateData.email, ['email']);
                const existingPatient = allPatientsWithEmail.find(p => p.id !== id);
                if (existingPatient) {
                    return response_util_1.ResponseUtil.error('Email already exists');
                }
            }
            if (updateData.phone) {
                const allPatientsWithPhone = array_util_1.ArrayUtil.searchByText(this.patients, updateData.phone, ['phone']);
                const existingPhone = allPatientsWithPhone.find(p => p.id !== id);
                if (existingPhone) {
                    return response_util_1.ResponseUtil.error('Phone number already exists');
                }
            }
            const updatedPatient = array_util_1.ArrayUtil.updateById(this.patients, id, {
                ...updateData,
                updatedAt: new Date().toISOString()
            });
            if (!updatedPatient) {
                return response_util_1.ResponseUtil.notFound('Patient', id);
            }
            return response_util_1.ResponseUtil.updated('Patient updated successfully', updatedPatient);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update patient');
        }
    }
    async delete(id) {
        try {
            const patient = array_util_1.ArrayUtil.findById(this.patients, id);
            if (!patient) {
                return response_util_1.ResponseUtil.notFound('Patient', id);
            }
            array_util_1.ArrayUtil.removeById(this.patients, id);
            return response_util_1.ResponseUtil.deleted('Patient');
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to delete patient');
        }
    }
    async getStats() {
        try {
            const totalPatients = this.patients.length;
            const activePatients = this.patients.filter(p => p.status === 'Active').length;
            const criticalPatients = this.patients.filter(p => p.status === 'Critical').length;
            const totalAge = this.patients.reduce((sum, patient) => sum + patient.age, 0);
            const averageAge = totalPatients > 0 ? Math.round(totalAge / totalPatients) : 0;
            const bloodGroupDistribution = {};
            this.patients.forEach(patient => {
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
            const searchTerm = query.toLowerCase();
            const matchingPatients = this.patients.filter(patient => patient.fullName.toLowerCase().includes(searchTerm) ||
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
            const patients = this.patients.filter(p => p.bloodGroup === bloodGroup);
            return response_util_1.ResponseUtil.success(`Patients with blood group '${bloodGroup}' retrieved successfully`, patients);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve patients by blood group');
        }
    }
    async updateStatus(id, status) {
        try {
            const updatedPatient = array_util_1.ArrayUtil.updateById(this.patients, id, {
                status,
                updatedAt: new Date().toISOString()
            });
            if (!updatedPatient) {
                return response_util_1.ResponseUtil.notFound('Patient', id);
            }
            return response_util_1.ResponseUtil.updated('Patient status updated successfully', updatedPatient);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update patient status');
        }
    }
    async findByAgeRange(minAge, maxAge) {
        try {
            const patients = this.patients.filter(p => p.age >= minAge && p.age <= maxAge);
            return response_util_1.ResponseUtil.success(`Patients aged ${minAge}-${maxAge} retrieved successfully`, patients);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve patients by age range');
        }
    }
};
exports.PatientsService = PatientsService;
exports.PatientsService = PatientsService = __decorate([
    (0, common_1.Injectable)()
], PatientsService);
//# sourceMappingURL=patients.service.js.map