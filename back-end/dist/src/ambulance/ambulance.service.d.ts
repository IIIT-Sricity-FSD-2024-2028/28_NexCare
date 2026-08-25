import { CreateAmbulanceRequest, UpdateAmbulanceRequest } from './interfaces/ambulance-request.interface';
import { AmbulanceStatus } from '../common/interfaces/api-response.interface';
import { SystemService } from '../system/system.service';
import { PatientsService } from '../patients/patients.service';
export declare class AmbulanceService {
    private readonly systemService;
    private readonly patientsService;
    constructor(systemService: SystemService, patientsService: PatientsService);
    private readonly store;
    private static seed;
    private resolvePatientName;
    findAll(patientId?: string, status?: AmbulanceStatus, hospitalId?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    create(requestData: CreateAmbulanceRequest & {
        hospitalId?: string;
    }): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    update(id: string, updateData: UpdateAmbulanceRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    delete(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    dispatch(id: string, assignedTo?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    complete(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    updateStatus(id: string, status: AmbulanceStatus): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getStats(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByPatient(patientId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getActiveRequests(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByAssignedStaff(assignedTo: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    private isValidStatusTransition;
}
