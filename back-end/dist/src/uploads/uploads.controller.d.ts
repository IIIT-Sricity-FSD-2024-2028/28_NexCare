import { Response } from 'express';
import { UploadsService } from './uploads.service';
export declare class UploadsController {
    private readonly uploadsService;
    constructor(uploadsService: UploadsService);
    upload(file: any, body: {
        entityType?: string;
        entityId?: string;
        description?: string;
    }, req: any): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findAll(entityType?: string, entityId?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    download(id: string, res: Response): Promise<void>;
    findById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    remove(id: string, req: any): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
