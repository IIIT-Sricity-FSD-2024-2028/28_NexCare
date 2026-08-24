import { CreateSupportRequestDto, UpdateSupportRequestDto } from './interfaces/support-request.interface';
export declare class SupportRequestsService {
    private readonly reqFilePath;
    private get requests();
    private set requests(value);
    findAll(hospitalId?: string, managerId?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    create(data: CreateSupportRequestDto, userId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    update(id: string, updateData: UpdateSupportRequestDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
