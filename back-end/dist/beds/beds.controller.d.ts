import { BedsService } from './beds.service';
import { CreateBedDto } from './dto/create-bed.dto';
import { UpdateBedDto } from './dto/update-bed.dto';
export declare class BedsController {
    private readonly bedsService;
    constructor(bedsService: BedsService);
    findAll(ward?: string, status?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    create(createBedDto: CreateBedDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getStats(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByWard(ward: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getAvailableBeds(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByPatient(patient: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getOccupancyByWard(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    update(id: string, updateBedDto: UpdateBedDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    patchUpdate(id: string, updateBedDto: UpdateBedDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    delete(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    allocate(id: string, patient: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    release(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    updateStatus(id: string, status: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
