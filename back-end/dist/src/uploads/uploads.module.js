"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsModule = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path = require("path");
const crypto = require("crypto");
const uploads_controller_1 = require("./uploads.controller");
const uploads_service_1 = require("./uploads.service");
const lodger_middleware_1 = require("../lodger.middleware");
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
let UploadsModule = class UploadsModule {
    configure(consumer) {
        consumer.apply(lodger_middleware_1.FileUploadMiddleware).forRoutes({ path: 'uploads', method: common_1.RequestMethod.POST });
    }
};
exports.UploadsModule = UploadsModule;
exports.UploadsModule = UploadsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            platform_express_1.MulterModule.register({
                storage: (0, multer_1.diskStorage)({
                    destination: uploads_service_1.UPLOAD_DIR,
                    filename: (_req, file, callback) => {
                        const ext = path.extname(file.originalname).slice(0, 10);
                        const safeBase = path
                            .basename(file.originalname, path.extname(file.originalname))
                            .replace(/[^a-zA-Z0-9-_]/g, '_')
                            .slice(0, 40);
                        callback(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${safeBase}${ext}`);
                    },
                }),
                limits: { fileSize: lodger_middleware_1.MAX_UPLOAD_BYTES, files: 1 },
                fileFilter: (_req, file, callback) => {
                    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                        return callback(new common_1.BadRequestException(`Unsupported file type "${file.mimetype}". Allowed: PDF, JPEG, PNG, WEBP, TXT, CSV, DOC, DOCX.`), false);
                    }
                    callback(null, true);
                },
            }),
        ],
        controllers: [uploads_controller_1.UploadsController],
        providers: [uploads_service_1.UploadsService],
        exports: [uploads_service_1.UploadsService],
    })
], UploadsModule);
//# sourceMappingURL=uploads.module.js.map