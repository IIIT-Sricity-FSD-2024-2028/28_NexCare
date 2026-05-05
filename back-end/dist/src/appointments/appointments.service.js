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
exports.AppointmentsService = void 0;
const fs = require("fs");
const path = require("path");
const common_1 = require("@nestjs/common");
const response_util_1 = require("../common/utils/response.util");
const id_generator_util_1 = require("../common/utils/id-generator.util");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
const system_service_1 = require("../system/system.service");
let AppointmentsService = class AppointmentsService {
    constructor(systemService) {
        this.systemService = systemService;
        this.appointmentsFilePath = path.join(process.cwd(), 'data', 'appointments.json');
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
    loadAppointments() {
        try {
            if (!fs.existsSync(this.appointmentsFilePath)) {
                const initial = this.getInitialMockData();
                this.saveAppointments(initial);
                return initial;
            }
            const raw = fs.readFileSync(this.appointmentsFilePath, 'utf-8');
            return JSON.parse(raw);
        }
        catch {
            return this.getInitialMockData();
        }
    }
    saveAppointments(appointments) {
        try {
            fs.mkdirSync(path.dirname(this.appointmentsFilePath), { recursive: true });
            fs.writeFileSync(this.appointmentsFilePath, JSON.stringify(appointments, null, 2), 'utf-8');
        }
        catch (err) {
            console.error('Failed to persist appointments:', err);
        }
    }
    getInitialMockData() {
        return [
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
            }
        ];
    }
    async findAll(patientId, status, department) {
        try {
            const appointments = this.loadAppointments();
            let filteredAppointments = [...appointments];
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
            const appointments = this.loadAppointments();
            const appointment = appointments.find(a => a.id === id);
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
            const appointments = this.loadAppointments();
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
            appointments.push(newAppointment);
            this.saveAppointments(appointments);
            this.systemService.createActivity({
                userId: newAppointment.patientId,
                action: 'Create',
                details: `New appointment scheduled for ${newAppointment.patientName} with ${newAppointment.doctor}`,
                module: 'Appointments',
                severity: 'INFO'
            });
            return response_util_1.ResponseUtil.created('Appointment created successfully', newAppointment);
        }
        catch (error) {
            console.error('Create appointment error:', error);
            return response_util_1.ResponseUtil.serverError('Failed to create appointment');
        }
    }
    async update(id, updateData) {
        try {
            const appointments = this.loadAppointments();
            const appointment = appointments.find(a => a.id === id);
            if (!appointment) {
                return response_util_1.ResponseUtil.notFound('Appointment', id);
            }
            const updatedIndex = appointments.findIndex(a => a.id === id);
            appointments[updatedIndex] = {
                ...appointments[updatedIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            this.saveAppointments(appointments);
            this.systemService.createActivity({
                userId: 'System',
                action: 'Update',
                details: `Appointment ${id} details updated`,
                module: 'Appointments',
                severity: 'INFO'
            });
            return response_util_1.ResponseUtil.updated('Appointment updated successfully', appointments[updatedIndex]);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update appointment');
        }
    }
    async delete(id) {
        try {
            const appointments = this.loadAppointments();
            const appointmentIndex = appointments.findIndex(a => a.id === id);
            if (appointmentIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Appointment', id);
            }
            const appointment = appointments[appointmentIndex];
            appointments.splice(appointmentIndex, 1);
            this.saveAppointments(appointments);
            this.systemService.createActivity({
                userId: appointment.patientId,
                action: 'Delete',
                details: `Appointment deleted: ${id}`,
                module: 'Appointments',
                severity: 'WARNING'
            });
            return response_util_1.ResponseUtil.deleted('Appointment');
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to delete appointment');
        }
    }
    async confirm(id) {
        try {
            const appointments = this.loadAppointments();
            const appointmentIndex = appointments.findIndex(a => a.id === id);
            if (appointmentIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Appointment', id);
            }
            appointments[appointmentIndex].status = api_response_interface_1.AppointmentStatus.CONFIRMED;
            appointments[appointmentIndex].updatedAt = new Date().toISOString();
            this.saveAppointments(appointments);
            const updatedAppointment = appointments[appointmentIndex];
            this.systemService.createActivity({
                userId: 'Admin',
                action: 'Confirm',
                details: `Appointment ${id} confirmed for ${updatedAppointment.patientName}`,
                module: 'Appointments',
                severity: 'SUCCESS'
            });
            return response_util_1.ResponseUtil.updated('Appointment confirmed successfully', updatedAppointment);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to confirm appointment');
        }
    }
    async complete(id) {
        try {
            const appointments = this.loadAppointments();
            const appointmentIndex = appointments.findIndex(a => a.id === id);
            if (appointmentIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Appointment', id);
            }
            appointments[appointmentIndex].status = api_response_interface_1.AppointmentStatus.COMPLETED;
            appointments[appointmentIndex].updatedAt = new Date().toISOString();
            this.saveAppointments(appointments);
            const updatedAppointment = appointments[appointmentIndex];
            this.systemService.createActivity({
                userId: 'Admin',
                action: 'Complete',
                details: `Appointment ${id} marked as completed for ${updatedAppointment.patientName}`,
                module: 'Appointments',
                severity: 'SUCCESS'
            });
            return response_util_1.ResponseUtil.updated('Appointment completed successfully', updatedAppointment);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to complete appointment');
        }
    }
    async cancel(id) {
        try {
            const appointments = this.loadAppointments();
            const appointmentIndex = appointments.findIndex(a => a.id === id);
            if (appointmentIndex === -1) {
                return response_util_1.ResponseUtil.notFound('Appointment', id);
            }
            appointments[appointmentIndex].status = api_response_interface_1.AppointmentStatus.CANCELLED;
            appointments[appointmentIndex].updatedAt = new Date().toISOString();
            this.saveAppointments(appointments);
            const updatedAppointment = appointments[appointmentIndex];
            this.systemService.createActivity({
                userId: updatedAppointment.patientId,
                action: 'Cancel',
                details: `Appointment ${id} cancelled`,
                module: 'Appointments',
                severity: 'WARNING'
            });
            return response_util_1.ResponseUtil.updated('Appointment cancelled successfully', updatedAppointment);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to cancel appointment');
        }
    }
    async getStats() {
        try {
            const appointments = this.loadAppointments();
            const totalAppointments = appointments.length;
            const pendingAppointments = appointments.filter(a => a.status === api_response_interface_1.AppointmentStatus.PENDING).length;
            const confirmedAppointments = appointments.filter(a => a.status === api_response_interface_1.AppointmentStatus.CONFIRMED).length;
            const completedAppointments = appointments.filter(a => a.status === api_response_interface_1.AppointmentStatus.COMPLETED).length;
            const cancelledAppointments = appointments.filter(a => a.status === api_response_interface_1.AppointmentStatus.CANCELLED).length;
            const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const todayAppointments = appointments.filter(a => a.dateLabel === today).length;
            const byDepartment = {};
            appointments.forEach(apt => {
                byDepartment[apt.department] = (byDepartment[apt.department] || 0) + 1;
            });
            const revenue = appointments
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
            const appointments = this.loadAppointments();
            const patientAppointments = appointments.filter(a => a.patientId === patientId);
            return response_util_1.ResponseUtil.success(`Appointments for patient ${patientId} retrieved successfully`, patientAppointments);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve patient appointments');
        }
    }
    async findByDepartment(department) {
        try {
            const appointments = this.loadAppointments().filter(a => a.department === department);
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
            const todayAppointments = this.loadAppointments().filter(a => a.dateLabel === today);
            return response_util_1.ResponseUtil.success('Today\'s appointments retrieved successfully', todayAppointments);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve today\'s appointments');
        }
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [system_service_1.SystemService])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map