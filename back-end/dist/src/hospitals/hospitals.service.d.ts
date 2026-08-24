import { CreateHospitalDto, UpdateHospitalDto } from './interfaces/hospital.interface';
import { VerificationStatus } from '../common/interfaces/api-response.interface';
export declare class HospitalsService {
    private readonly hospitalsFilePath;
    private get hospitals();
    private set hospitals(value);
    findAll(status?: VerificationStatus): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    create(data: CreateHospitalDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    update(id: string, updateData: UpdateHospitalDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findNearby(city?: string, state?: string, pincode?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
