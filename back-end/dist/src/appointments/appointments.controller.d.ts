import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
export declare class AppointmentsController {
    private readonly appointmentsService;
    constructor(appointmentsService: AppointmentsService);
    private isPatient;
    private assertOwnsAppointment;
    findAll(req: any, patientId?: string, status?: string, department?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    create(req: any, createAppointmentDto: CreateAppointmentDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getStats(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByPatient(req: any, patientId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByDepartment(department: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getTodayAppointments(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findById(req: any, id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    update(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    patchUpdate(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    delete(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    confirm(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    complete(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    cancel(req: any, id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
