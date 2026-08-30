import { Module, MiddlewareConsumer, NestModule, RequestMethod, BadRequestException } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as crypto from 'crypto';
import { UploadsController } from './uploads.controller';
import { UploadsService, UPLOAD_DIR } from './uploads.service';
import { FileUploadMiddleware, MAX_UPLOAD_BYTES } from '../lodger.middleware';

/** Document types the hospital actually needs to store */
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

/**
 * Uploads Module
 *
 * Wires multer (the file upload middleware) through MulterModule, and binds
 * the router-level FileUploadMiddleware to POST /uploads.
 *
 * Stored filenames are generated, never taken from the client: an attacker
 * controls originalname and could otherwise send "../../etc/passwd".
 */
@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, callback) => {
          const ext = path.extname(file.originalname).slice(0, 10);
          const safeBase = path
            .basename(file.originalname, path.extname(file.originalname))
            .replace(/[^a-zA-Z0-9-_]/g, '_')
            .slice(0, 40);
          callback(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${safeBase}${ext}`);
        },
      }),
      limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              `Unsupported file type "${file.mimetype}". Allowed: PDF, JPEG, PNG, WEBP, TXT, CSV, DOC, DOCX.`,
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(FileUploadMiddleware).forRoutes({ path: 'uploads', method: RequestMethod.POST });
  }
}
