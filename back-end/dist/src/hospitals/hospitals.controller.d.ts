import { HospitalsService } from './hospitals.service';
import { CreateHospitalDto, UpdateHospitalDto } from './interfaces/hospital.interface';
import { VerificationStatus } from '../common/interfaces/api-response.interface';
export declare class HospitalsController {
    private readonly hospitalsService;
    constructor(hospitalsService: HospitalsService);
    findAll(status?: VerificationStatus, speciality?: string, city?: string, pincode?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findNearby(city: string, state: string, pincode: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    register(data: CreateHospitalDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    update(id: string, data: UpdateHospitalDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    verify(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    reject(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    assignManager(id: string, managerId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getMyHospitals(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getPendingVerifications(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    verifyHospitalDetailed(hospitalId: string, body: {
        comments?: string;
        suggestedChanges?: string[];
    }): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    rejectHospitalDetailed(hospitalId: string, body: {
        comments?: string;
        rejectionReason?: string;
    }): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getVerificationHistory(hospitalId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getHospitalPerformance(hospitalId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getRegionalDashboard(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
