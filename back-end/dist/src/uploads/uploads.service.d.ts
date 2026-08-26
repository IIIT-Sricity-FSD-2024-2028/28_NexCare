import { UploadQuery, UploadRecord } from './interfaces/upload.interface';
export declare const UPLOAD_DIR: string;
export declare class UploadsService {
    private readonly uploadsFilePath;
    constructor();
    private load;
    private save;
    create(file: {
        originalname: string;
        filename: string;
        mimetype: string;
        size: number;
        path: string;
    }, meta: {
        entityType?: string;
        entityId?: string;
        description?: string;
        uploadedBy: string;
    }): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findAll(query?: UploadQuery): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getStoredFile(id: string): {
        record: UploadRecord;
        absolutePath: string;
    } | null;
    remove(id: string, deletedBy: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
