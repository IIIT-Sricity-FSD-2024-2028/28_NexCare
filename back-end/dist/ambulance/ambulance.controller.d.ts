import { AmbulanceService } from './ambulance.service';
import { CreateAmbulanceRequestDto } from './dto/create-request.dto';
import { UpdateAmbulanceRequestDto } from './dto/update-request.dto';
export declare class AmbulanceController {
    private readonly ambulanceService;
    constructor(ambulanceService: AmbulanceService);
    findAll(patientId?: string, status?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    create(createRequestDto: CreateAmbulanceRequestDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getStats(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByPatient(patientId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getActiveRequests(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByAssignedStaff(assignedTo: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    update(id: string, updateRequestDto: UpdateAmbulanceRequestDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    patchUpdate(id: string, updateRequestDto: UpdateAmbulanceRequestDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    delete(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    dispatch(id: string, assignedTo?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    complete(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    updateStatus(id: string, status: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
