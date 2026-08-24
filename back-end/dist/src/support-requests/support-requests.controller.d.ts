import { SupportRequestsService } from './support-requests.service';
import { CreateSupportRequestDto, UpdateSupportRequestDto } from './interfaces/support-request.interface';
export declare class SupportRequestsController {
    private readonly supportRequestsService;
    constructor(supportRequestsService: SupportRequestsService);
    findAll(req: any, hospitalId?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    create(req: any, data: CreateSupportRequestDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    update(id: string, data: UpdateSupportRequestDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
