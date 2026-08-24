export declare enum RequestPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH"
}
export declare enum RequestStatus {
    OPEN = "OPEN",
    IN_PROGRESS = "IN_PROGRESS",
    RESOLVED = "RESOLVED"
}
export interface SupportRequest {
    id: string;
    hospitalId: string;
    managerId?: string;
    createdBy: string;
    subject: string;
    message: string;
    priority: RequestPriority;
    status: RequestStatus;
    response?: string;
    createdAt: string;
}
export interface CreateRequestDto {
    subject: string;
    message: string;
    priority: RequestPriority;
}
export declare class RequestsService {
    private readonly requestsFilePath;
    private get requests();
    private set requests(value);
    findAllForHospital(hospitalId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findAllForManager(managerId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    create(hospitalId: string, createdBy: string, data: CreateRequestDto, managerId?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    respond(id: string, responseMessage: string, status: RequestStatus): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
