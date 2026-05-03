import { CreateAmbulanceRequest, UpdateAmbulanceRequest } from './interfaces/ambulance-request.interface';
import { AmbulanceStatus } from '../common/interfaces/api-response.interface';
export declare class AmbulanceService {
    private ambulanceRequests;
    findAll(patientId?: string, status?: AmbulanceStatus): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    create(requestData: CreateAmbulanceRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
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
