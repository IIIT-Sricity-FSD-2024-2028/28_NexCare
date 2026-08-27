"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsService = exports.UPLOAD_DIR = void 0;
const fs = require("fs");
const path = require("path");
const common_1 = require("@nestjs/common");
const response_util_1 = require("../common/utils/response.util");
const id_generator_util_1 = require("../common/utils/id-generator.util");
const file_logger_1 = require("../common/logging/file-logger");
const upload_interface_1 = require("./interfaces/upload.interface");
exports.UPLOAD_DIR = path.join(process.cwd(), 'uploads');
let UploadsService = class UploadsService {
    constructor() {
        this.uploadsFilePath = path.join(process.cwd(), 'data', 'uploads.json');
        fs.mkdirSync(exports.UPLOAD_DIR, { recursive: true });
    }
    load() {
        try {
            if (!fs.existsSync(this.uploadsFilePath))
                return [];
            return JSON.parse(fs.readFileSync(this.uploadsFilePath, 'utf-8'));
        }
        catch {
            return [];
        }
    }
    save(records) {
        try {
            fs.mkdirSync(path.dirname(this.uploadsFilePath), { recursive: true });
            fs.writeFileSync(this.uploadsFilePath, JSON.stringify(records, null, 2), 'utf-8');
        }
        catch (err) {
            file_logger_1.fileLogger.error('Failed to persist upload metadata', { detail: String(err) });
        }
    }
    async create(file, meta) {
        try {
            const record = {
                id: id_generator_util_1.IdGenerator.generate('FILE-'),
                originalName: file.originalname,
                storedName: file.filename,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                entityType: meta.entityType || upload_interface_1.UploadEntityType.GENERAL,
                entityId: meta.entityId || '',
                description: meta.description,
                uploadedBy: meta.uploadedBy,
                uploadedAt: new Date().toISOString(),
            };
            const records = this.load();
            records.push(record);
            this.save(records);
            file_logger_1.fileLogger.info('app', 'File uploaded', {
                fileId: record.id,
                originalName: record.originalName,
                sizeBytes: record.sizeBytes,
                mimeType: record.mimeType,
                entityType: record.entityType,
                entityId: record.entityId,
                uploadedBy: record.uploadedBy,
            });
            return response_util_1.ResponseUtil.created('File', record);
        }
        catch (error) {
            file_logger_1.fileLogger.error('Failed to record upload', { detail: String(error) });
            return response_util_1.ResponseUtil.serverError('Failed to record uploaded file');
        }
    }
    async findAll(query = {}) {
        try {
            let records = this.load();
            if (query.entityType) {
                records = records.filter((r) => r.entityType === query.entityType);
            }
            if (query.entityId) {
                records = records.filter((r) => r.entityId === query.entityId);
            }
            records.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
            return response_util_1.ResponseUtil.success('Uploads retrieved successfully', records);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve uploads');
        }
    }
    async findById(id) {
        const record = this.load().find((r) => r.id === id);
        if (!record)
            return response_util_1.ResponseUtil.notFound('File', id);
        return response_util_1.ResponseUtil.success('File retrieved successfully', record);
    }
    getStoredFile(id) {
        const record = this.load().find((r) => r.id === id);
        if (!record)
            return null;
        const absolutePath = path.join(exports.UPLOAD_DIR, record.storedName);
        if (!fs.existsSync(absolutePath))
            return null;
        return { record, absolutePath };
    }
    async remove(id, deletedBy) {
        try {
            const records = this.load();
            const index = records.findIndex((r) => r.id === id);
            if (index === -1)
                return response_util_1.ResponseUtil.notFound('File', id);
            const [record] = records.splice(index, 1);
            this.save(records);
            const absolutePath = path.join(exports.UPLOAD_DIR, record.storedName);
            if (fs.existsSync(absolutePath))
                fs.unlinkSync(absolutePath);
            file_logger_1.fileLogger.info('app', 'File deleted', { fileId: record.id, originalName: record.originalName, deletedBy });
            return response_util_1.ResponseUtil.deleted('File');
        }
        catch (error) {
            file_logger_1.fileLogger.error('Failed to delete upload', { fileId: id, detail: String(error) });
            return response_util_1.ResponseUtil.serverError('Failed to delete file');
        }
    }
};
exports.UploadsService = UploadsService;
exports.UploadsService = UploadsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], UploadsService);
//# sourceMappingURL=uploads.service.js.map