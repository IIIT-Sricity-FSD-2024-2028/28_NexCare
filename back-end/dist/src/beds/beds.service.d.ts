import { CreateBedRequest, UpdateBedRequest } from './interfaces/bed.interface';
import { BedStatus } from '../common/interfaces/api-response.interface';
export declare class BedsService {
    private readonly store;
    private static seed;
    findAll(ward?: string, status?: BedStatus, hospitalId?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    create(bedData: CreateBedRequest & {
        hospitalId?: string;
    }): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    update(id: string, updateData: UpdateBedRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    delete(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    allocate(id: string, patient: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    release(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getStats(hospitalId?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByWard(ward: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getAvailableBeds(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByPatient(patient: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    updateStatus(id: string, status: BedStatus): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getOccupancyByWard(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
