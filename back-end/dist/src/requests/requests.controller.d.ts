import { RequestsService, CreateRequestDto, RequestStatus } from './requests.service';
import { HospitalsService } from '../hospitals/hospitals.service';
export declare class RequestsController {
    private readonly requestsService;
    private readonly hospitalsService;
    constructor(requestsService: RequestsService, hospitalsService: HospitalsService);
    getRequests(req: any): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    createRequest(req: any, data: CreateRequestDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    respondToRequest(id: string, response: string, status: RequestStatus): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
