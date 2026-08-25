import { CreateAppointmentRequest, UpdateAppointmentRequest } from './interfaces/appointment.interface';
import { AppointmentStatus } from '../common/interfaces/api-response.interface';
import { SystemService } from '../system/system.service';
import { PatientsService } from '../patients/patients.service';
export declare class AppointmentsService {
    private readonly systemService;
    private readonly patientsService;
    constructor(systemService: SystemService, patientsService: PatientsService);
    private resolvePatientName;
    private isToday;
    private readonly appointmentsFilePath;
    private loadAppointments;
    private saveAppointments;
    private getInitialMockData;
    findAll(patientId?: string, status?: AppointmentStatus, department?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    create(appointmentData: CreateAppointmentRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    update(id: string, updateData: UpdateAppointmentRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    delete(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    confirm(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    complete(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    cancel(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getStats(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByPatient(patientId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByDepartment(department: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    private generateToken;
    getTodayAppointments(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
