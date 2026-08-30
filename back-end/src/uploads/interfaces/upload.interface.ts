/**
 * What an uploaded file is attached to.
 * Keeps one upload store usable by every module instead of a table per feature.
 */
export enum UploadEntityType {
  PATIENT = 'patient',
  HOSPITAL = 'hospital',
  USER = 'user',
  BED = 'bed',
  GENERAL = 'general',
}

/**
 * Stored metadata for one uploaded file.
 * The bytes live in back-end/uploads; this record lives in data/uploads.json.
 */
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

/** Filters accepted by GET /uploads */
export interface UploadQuery {
  entityType?: string;
  entityId?: string;
}
