export declare enum UploadEntityType {
    PATIENT = "patient",
    HOSPITAL = "hospital",
    USER = "user",
    BED = "bed",
    GENERAL = "general"
}
export interface UploadRecord {
    id: string;
    originalName: string;
    storedName: string;
    mimeType: string;
    sizeBytes: number;
    entityType: UploadEntityType;
    entityId: string;
    description?: string;
    uploadedBy: string;
    uploadedAt: string;
}
export interface UploadQuery {
    entityType?: string;
    entityId?: string;
}
