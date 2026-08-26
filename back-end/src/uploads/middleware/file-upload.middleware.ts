import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { fileLogger } from '../../common/logging/file-logger';

/** Largest upload accepted, mirrored by the multer limit in uploads.module.ts */
export const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES) || 5 * 1024 * 1024;

/**
 * File Upload Middleware (router-level — bound to POST /uploads only)
 *
 * Runs ahead of multer and does the cheap checks first:
 *  - the request really is multipart/form-data
 *  - the declared size is within the limit, so an oversized upload is refused
 *    before a single byte is written to disk
 *
 * Multer still enforces the limit itself (a client can lie about
 * content-length) and applies the MIME allowlist; this middleware is the early
 * exit and the place where every upload attempt is logged.
 */
@Injectable()
export class FileUploadMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const contentType = String(req.headers['content-type'] ?? '');
    const declaredBytes = Number(req.headers['content-length'] ?? 0);

    fileLogger.info('app', 'Upload attempt', {
      requestId: (req as any).requestId,
      contentType: contentType.split(';')[0],
      declaredBytes,
    });

    if (!contentType.startsWith('multipart/form-data')) {
      return this.reject(
        req,
        res,
        400,
        'BAD_REQUEST',
        'Uploads must be sent as multipart/form-data with a "file" field.',
      );
    }

    if (declaredBytes > MAX_UPLOAD_BYTES) {
      return this.reject(
        req,
        res,
        413,
        'PAYLOAD_TOO_LARGE',
        `File is too large. Maximum size is ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.`,
      );
    }

    next();
  }

  private reject(req: Request, res: Response, status: number, error: string, message: string): void {
    fileLogger.warn('error', `Upload rejected: ${message}`, {
      requestId: (req as any).requestId,
      statusCode: status,
      path: req.originalUrl,
    });

    res.status(status).json({
      success: false,
      statusCode: status,
      message,
      error,
      requestId: (req as any).requestId,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }
}
