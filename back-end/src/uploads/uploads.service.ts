import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { fileLogger } from '../common/logging/file-logger';
import { UploadEntityType, UploadQuery, UploadRecord } from './interfaces/upload.interface';

/** Where the uploaded bytes are kept */
export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

/**
 * Uploads Service
 * Keeps the metadata for every uploaded file in data/uploads.json and the
 * bytes themselves in back-end/uploads, and records each upload and deletion
 * in the application log.
 */
@Injectable()
export class UploadsService {
  private readonly uploadsFilePath = path.join(process.cwd(), 'data', 'uploads.json');

  constructor() {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  /** Load records from disk */
  private load(): UploadRecord[] {
    try {
      if (!fs.existsSync(this.uploadsFilePath)) return [];
      return JSON.parse(fs.readFileSync(this.uploadsFilePath, 'utf-8'));
    } catch {
      return [];
    }
  }

  /** Persist records to disk */
  private save(records: UploadRecord[]): void {
    try {
      fs.mkdirSync(path.dirname(this.uploadsFilePath), { recursive: true });
      fs.writeFileSync(this.uploadsFilePath, JSON.stringify(records, null, 2), 'utf-8');
    } catch (err) {
      fileLogger.error('Failed to persist upload metadata', { detail: String(err) });
    }
  }

  /**
   * Record a file multer has already written to disk.
   * @param file The multer file descriptor
   * @param meta What the file belongs to and who sent it
   */
  async create(
    file: { originalname: string; filename: string; mimetype: string; size: number; path: string },
    meta: { entityType?: string; entityId?: string; description?: string; uploadedBy: string },
  ) {
    try {
      const record: UploadRecord = {
        id: IdGenerator.generate('FILE-'),
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        entityType: (meta.entityType as UploadEntityType) || UploadEntityType.GENERAL,
        entityId: meta.entityId || '',
        description: meta.description,
        uploadedBy: meta.uploadedBy,
        uploadedAt: new Date().toISOString(),
      };

      const records = this.load();
      records.push(record);
      this.save(records);

      fileLogger.info('app', 'File uploaded', {
        fileId: record.id,
        originalName: record.originalName,
        sizeBytes: record.sizeBytes,
        mimeType: record.mimeType,
        entityType: record.entityType,
        entityId: record.entityId,
        uploadedBy: record.uploadedBy,
      });

      return ResponseUtil.created('File', record);
    } catch (error) {
      fileLogger.error('Failed to record upload', { detail: String(error) });
      return ResponseUtil.serverError('Failed to record uploaded file');
    }
  }

  /** List uploads, optionally filtered by what they are attached to */
  async findAll(query: UploadQuery = {}) {
    try {
      let records = this.load();

      if (query.entityType) {
        records = records.filter((r) => r.entityType === query.entityType);
      }
      if (query.entityId) {
        records = records.filter((r) => r.entityId === query.entityId);
      }

      records.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
      return ResponseUtil.success('Uploads retrieved successfully', records);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve uploads');
    }
  }

  /** Metadata for one upload */
  async findById(id: string) {
    const record = this.load().find((r) => r.id === id);
    if (!record) return ResponseUtil.notFound('File', id);
    return ResponseUtil.success('File retrieved successfully', record);
  }

  /** The record plus its absolute path, for the download route */
  getStoredFile(id: string): { record: UploadRecord; absolutePath: string } | null {
    const record = this.load().find((r) => r.id === id);
    if (!record) return null;

    const absolutePath = path.join(UPLOAD_DIR, record.storedName);
    if (!fs.existsSync(absolutePath)) return null;

    return { record, absolutePath };
  }

  /** Delete the record and the file behind it */
  async remove(id: string, deletedBy: string) {
    try {
      const records = this.load();
      const index = records.findIndex((r) => r.id === id);
      if (index === -1) return ResponseUtil.notFound('File', id);

      const [record] = records.splice(index, 1);
      this.save(records);

      const absolutePath = path.join(UPLOAD_DIR, record.storedName);
      if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);

      fileLogger.info('app', 'File deleted', { fileId: record.id, originalName: record.originalName, deletedBy });

      return ResponseUtil.deleted('File');
    } catch (error) {
      fileLogger.error('Failed to delete upload', { fileId: id, detail: String(error) });
      return ResponseUtil.serverError('Failed to delete file');
    }
  }
}
