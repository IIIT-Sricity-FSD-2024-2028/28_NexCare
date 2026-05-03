import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
export declare class AppointmentsController {
    private readonly appointmentsService;
    constructor(appointmentsService: AppointmentsService);
    findAll(patientId?: string, status?: string, department?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    create(createAppointmentDto: CreateAppointmentDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getStats(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByPatient(patientId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByDepartment(department: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getTodayAppointments(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    update(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    patchUpdate(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    delete(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    confirm(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    complete(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    cancel(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
