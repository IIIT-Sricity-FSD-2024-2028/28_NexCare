"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const response_util_1 = require("../common/utils/response.util");
const id_generator_util_1 = require("../common/utils/id-generator.util");
const array_util_1 = require("../common/utils/array.util");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
let AppointmentsService = class AppointmentsService {
    constructor() {
        this.appointments = [
            {
                id: 'APT-001',
                patientId: 'P001',
                patientName: 'John Anderson',
                department: 'Cardiology',
                doctor: 'Dr. Sarah Smith',
                dateLabel: 'March 15, 2026',
                timeLabel: '10:00 AM',
                token: 'TKN-1234',
                fee: 150,
                status: api_response_interface_1.AppointmentStatus.CONFIRMED,
                reason: 'Routine heart checkup',
                createdAt: '2026-03-01T00:00:00Z'
            },
            {
                id: 'APT-002',
                patientId: 'P002',
                patientName: 'Maria Garcia',
                department: 'Orthopedics',
                doctor: 'Dr. Vikram Patel',
                dateLabel: 'April 02, 2026',
                timeLabel: '02:30 PM',
                token: 'TKN-5678',
                fee: 200,
                status: api_response_interface_1.AppointmentStatus.PENDING,
                reason: 'Severe knee pain - Emergency Consult',
                createdAt: '2026-03-25T00:00:00Z'
            },
            {
                id: 'APT-003',
                patientId: 'P001',
                patientName: 'John Anderson',
                department: 'General Medicine',
                doctor: 'Dr. Anjali Desai',
                dateLabel: 'March 01, 2026',
                timeLabel: '11:00 AM',
                token: 'TKN-9012',
                fee: 100,
                status: api_response_interface_1.AppointmentStatus.COMPLETED,
                reason: 'Annual physical',
                createdAt: '2026-02-15T00:00:00Z'
            },
            {
                id: 'APT-004',
                patientId: 'P001',
                patientName: 'John Anderson',
                department: 'Pediatrics',
                doctor: 'Dr. Maya Rao',
                dateLabel: 'April 05, 2026',
                timeLabel: '09:30 AM',
                token: 'TKN-1456',
                fee: 120,
                status: api_response_interface_1.AppointmentStatus.CONFIRMED,
                reason: 'Child wellness consultation (family)',
                createdAt: '2026-03-20T00:00:00Z'
            },
            {
                id: 'APT-005',
                patientId: 'P002',
                patientName: 'Maria Garcia',
                department: 'Neurology',
                doctor: 'Dr. Ethan Brown',
                dateLabel: 'April 08, 2026',
                timeLabel: '01:00 PM',
                token: 'TKN-2789',
                fee: 220,
                status: api_response_interface_1.AppointmentStatus.PENDING,
                reason: 'Recurring headaches - evaluation',
                createdAt: '2026-03-28T00:00:00Z'
            },
            {
                id: 'APT-006',
                patientId: 'P001',
                patientName: 'John Anderson',
                department: 'Dermatology',
                doctor: 'Dr. Aisha Khan',
                dateLabel: 'April 10, 2026',
                timeLabel: '04:00 PM',
                token: 'TKN-3301',
                fee: 140,
                status: api_response_interface_1.AppointmentStatus.CONFIRMED,
                reason: 'Skin allergy follow-up',
                createdAt: '2026-03-30T00:00:00Z'
            },
            {
                id: 'APT-007',
                patientId: 'P002',
                patientName: 'Maria Garcia',
                department: 'Emergency',
                doctor: 'Dr. Liam Chen',
                dateLabel: 'April 02, 2026',
                timeLabel: '06:15 PM',
                token: 'TKN-7721',
                fee: 250,
                status: api_response_interface_1.AppointmentStatus.CONFIRMED,
                reason: 'ER triage follow-up',
                createdAt: '2026-04-01T00:00:00Z'
            }
        ];
    }
    async findAll(patientId, status, department) {
        try {
            let filteredAppointments = [...this.appointments];
            if (patientId) {
                filteredAppointments = filteredAppointments.filter(apt => apt.patientId === patientId);
            }
            if (status) {
                filteredAppointments = filteredAppointments.filter(apt => apt.status === status);
            }
            if (department) {
                filteredAppointments = filteredAppointments.filter(apt => apt.department === department);
            }
            return response_util_1.ResponseUtil.success('Appointments retrieved successfully', filteredAppointments);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve appointments');
        }
    }
    async findById(id) {
        try {
            const appointment = this.appointments.find(a => a.id === id);
            if (!appointment) {
                return response_util_1.ResponseUtil.notFound('Appointment', id);
            }
            return response_util_1.ResponseUtil.success('Appointment retrieved successfully', appointment);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve appointment');
        }
    }
    async create(appointmentData) {
        try {
            const newAppointmentId = id_generator_util_1.IdGenerator.generateAppointmentId();
            const token = id_generator_util_1.IdGenerator.generateTokenId();
            const newAppointment = {
                id: newAppointmentId,
                patientId: appointmentData.patientId,
                patientName: `Patient ${appointmentData.patientId}`,
                department: appointmentData.department,
                doctor: appointmentData.doctor || 'TBD',
                dateLabel: appointmentData.dateLabel,
                timeLabel: appointmentData.timeLabel,
                token,
                fee: appointmentData.fee || 100,
                status: api_response_interface_1.AppointmentStatus.CONFIRMED,
                reason: appointmentData.reason || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.appointments.push(newAppointment);
            return response_util_1.ResponseUtil.created('Appointment created successfully', newAppointment);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to create appointment');
        }
    }
    async update(id, updateData) {
        try {
            const appointment = array_util_1.ArrayUtil.findById(this.appointments, id);
            if (!appointment) {
                return response_util_1.ResponseUtil.notFound('Appointment', id);
            }
            const updatedAppointment = array_util_1.ArrayUtil.updateById(this.appointments, id, {
                ...updateData,
                updatedAt: new Date().toISOString()
            });
            if (!updatedAppointment) {
                return response_util_1.ResponseUtil.notFound('Appointment', id);
            }
            return response_util_1.ResponseUtil.updated('Appointment updated successfully', updatedAppointment);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update appointment');
        }
    }
    async delete(id) {
        try {
            const appointmentIndex = this.appointments.findIndex(a => a.id === id);
            if (appointmentIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Appointment', id);
            }
            this.appointments.splice(appointmentIndex, 1);
            return response_util_1.ResponseUtil.deleted('Appointment');
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to delete appointment');
        }
    }
    async confirm(id) {
        try {
            const appointmentIndex = this.appointments.findIndex(a => a.id === id);
            if (appointmentIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Appointment', id);
            }
            this.appointments[appointmentIndex].status = api_response_interface_1.AppointmentStatus.CONFIRMED;
            this.appointments[appointmentIndex].updatedAt = new Date().toISOString();
            const updatedAppointment = this.appointments[appointmentIndex];
            return response_util_1.ResponseUtil.updated('Appointment confirmed successfully', updatedAppointment);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to confirm appointment');
        }
    }
    async complete(id) {
        try {
            const appointmentIndex = this.appointments.findIndex(a => a.id === id);
            if (appointmentIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Appointment', id);
            }
            this.appointments[appointmentIndex].status = api_response_interface_1.AppointmentStatus.COMPLETED;
            this.appointments[appointmentIndex].updatedAt = new Date().toISOString();
            const updatedAppointment = this.appointments[appointmentIndex];
            return response_util_1.ResponseUtil.updated('Appointment completed successfully', updatedAppointment);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to complete appointment');
        }
    }
    async cancel(id) {
        try {
            const appointmentIndex = this.appointments.findIndex(a => a.id === id);
            if (appointmentIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Appointment', id);
            }
            this.appointments[appointmentIndex].status = api_response_interface_1.AppointmentStatus.CANCELLED;
            this.appointments[appointmentIndex].updatedAt = new Date().toISOString();
            const updatedAppointment = this.appointments[appointmentIndex];
            return response_util_1.ResponseUtil.updated('Appointment cancelled successfully', updatedAppointment);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to cancel appointment');
        }
    }
    async getStats() {
        try {
            const totalAppointments = this.appointments.length;
            const pendingAppointments = this.appointments.filter(a => a.status === api_response_interface_1.AppointmentStatus.PENDING).length;
            const confirmedAppointments = this.appointments.filter(a => a.status === api_response_interface_1.AppointmentStatus.CONFIRMED).length;
            const completedAppointments = this.appointments.filter(a => a.status === api_response_interface_1.AppointmentStatus.COMPLETED).length;
            const cancelledAppointments = this.appointments.filter(a => a.status === api_response_interface_1.AppointmentStatus.CANCELLED).length;
            const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const todayAppointments = this.appointments.filter(a => a.dateLabel === today).length;
            const byDepartment = {};
            this.appointments.forEach(apt => {
                byDepartment[apt.department] = (byDepartment[apt.department] || 0) + 1;
            });
            const revenue = this.appointments
                .filter(a => a.status === api_response_interface_1.AppointmentStatus.COMPLETED)
                .reduce((sum, apt) => sum + apt.fee, 0);
            const stats = {
                total: totalAppointments,
                pending: pendingAppointments,
                confirmed: confirmedAppointments,
                completed: completedAppointments,
                cancelled: cancelledAppointments,
                today: todayAppointments,
                byDepartment,
                revenue
            };
            return response_util_1.ResponseUtil.success('Appointment statistics retrieved successfully', stats);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve appointment statistics');
        }
    }
    async findByPatient(patientId) {
        try {
            const appointments = this.appointments.filter(a => a.patientId === patientId);
            return response_util_1.ResponseUtil.success(`Appointments for patient ${patientId} retrieved successfully`, appointments);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve patient appointments');
        }
    }
    async findByDepartment(department) {
        try {
            const appointments = this.appointments.filter(a => a.department === department);
            return response_util_1.ResponseUtil.success(`Appointments for ${department} department retrieved successfully`, appointments);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve department appointments');
        }
    }
    generateToken() {
        return 'TKN-' + Math.floor(Math.random() * 90000 + 10000);
    }
    async getTodayAppointments() {
        try {
            const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const todayAppointments = this.appointments.filter(a => a.dateLabel === today);
            return response_util_1.ResponseUtil.success('Today\'s appointments retrieved successfully', todayAppointments);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve today\'s appointments');
        }
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)()
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map