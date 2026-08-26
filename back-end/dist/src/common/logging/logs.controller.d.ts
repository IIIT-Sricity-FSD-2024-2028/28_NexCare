export declare class LogsController {
    read(stream?: string, limit?: string): Promise<import("../interfaces/api-response.interface").ApiResponse<unknown>>;
    files(): Promise<import("../interfaces/api-response.interface").ApiResponse<{
        name: string;
        sizeBytes: number;
        modifiedAt: string;
    }[]>>;
}
