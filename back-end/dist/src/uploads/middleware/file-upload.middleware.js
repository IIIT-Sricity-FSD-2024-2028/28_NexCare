"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadMiddleware = exports.MAX_UPLOAD_BYTES = void 0;
const common_1 = require("@nestjs/common");
const file_logger_1 = require("../../common/logging/file-logger");
exports.MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES) || 5 * 1024 * 1024;
let FileUploadMiddleware = class FileUploadMiddleware {
    use(req, res, next) {
        const contentType = String(req.headers['content-type'] ?? '');
        const declaredBytes = Number(req.headers['content-length'] ?? 0);
        file_logger_1.fileLogger.info('app', 'Upload attempt', {
            requestId: req.requestId,
            contentType: contentType.split(';')[0],
            declaredBytes,
        });
        if (!contentType.startsWith('multipart/form-data')) {
            return this.reject(req, res, 400, 'BAD_REQUEST', 'Uploads must be sent as multipart/form-data with a "file" field.');
        }
        if (declaredBytes > exports.MAX_UPLOAD_BYTES) {
            return this.reject(req, res, 413, 'PAYLOAD_TOO_LARGE', `File is too large. Maximum size is ${Math.round(exports.MAX_UPLOAD_BYTES / (1024 * 1024))} MB.`);
        }
        next();
    }
    reject(req, res, status, error, message) {
        file_logger_1.fileLogger.warn('error', `Upload rejected: ${message}`, {
            requestId: req.requestId,
            statusCode: status,
            path: req.originalUrl,
        });
        res.status(status).json({
            success: false,
            statusCode: status,
            message,
            error,
            requestId: req.requestId,
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
        });
    }
};
exports.FileUploadMiddleware = FileUploadMiddleware;
exports.FileUploadMiddleware = FileUploadMiddleware = __decorate([
    (0, common_1.Injectable)()
], FileUploadMiddleware);
//# sourceMappingURL=file-upload.middleware.js.map