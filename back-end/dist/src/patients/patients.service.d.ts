import { CreatePatientRequest, UpdatePatientRequest } from './interfaces/patient.interface';
import { SystemService } from '../system/system.service';
export declare class PatientsService {
    private readonly systemService;
    constructor(systemService: SystemService);
    private readonly patientsFilePath;
    private loadPatients;
    private savePatients;
    private getInitialMockData;
    findAll(status?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    create(patientData: CreatePatientRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    update(id: string, updateData: UpdatePatientRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    delete(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getStats(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    search(query: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByBloodGroup(bloodGroup: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    updateStatus(id: string, status: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByAgeRange(minAge: number, maxAge: number): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
