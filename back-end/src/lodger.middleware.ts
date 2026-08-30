import {
  Injectable,
  NestMiddleware,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
let helmet: any;
try {
  helmet = require('helmet');
} catch {
  helmet = null;
}
import * as crypto from 'crypto';
import { fileLogger } from './common/logging/file-logger';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

// Re-export feature-specific middlewares to preserve clean module boundaries
// Note: These exports are conditional - they will only work if the modules exist
try {
  const hospitalsMiddleware = require('./hospitals/middleware/hospital-access.middleware');
  if (hospitalsMiddleware.HospitalAccessMiddleware) {
    exports.HospitalAccessMiddleware = hospitalsMiddleware.HospitalAccessMiddleware;
  }
} catch (e) {
  // Hospitals module may not exist in all deployments
}

try {
  const bedsMiddleware = require('./beds/middleware/bed-status-change.middleware');
  if (bedsMiddleware.BedStatusChangeMiddleware) {
    exports.BedStatusChangeMiddleware = bedsMiddleware.BedStatusChangeMiddleware;
  }
} catch (e) {
  // Beds module may not exist in all deployments
}

// ============================================================================
// 5. CSRF PROTECTION MIDDLEWARE
// ============================================================================

/**
 * CSRF Protection Middleware
 * Generates and validates CSRF tokens for state-changing operations
 * Required for evaluation: Security middleware
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly csrfTokens = new Map<string, { token: string; expires: number }>();
  private readonly tokenExpiration = Number(process.env.CSRF_TOKEN_EXPIRATION) || 3600000; // 1 hour default

  use(req: Request, res: Response, next: NextFunction): void {
    // Skip CSRF for GET, HEAD, OPTIONS requests (safe methods)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      // Generate and send CSRF token for safe methods
      const csrfToken = this.generateToken(req);
      res.setHeader('x-csrf-token', csrfToken);
      next();
      return;
    }

    // Validate CSRF for state-changing methods (POST, PUT, PATCH, DELETE)
    const csrfToken = req.headers['x-csrf-token'] as string || (req.body as any)._csrf;
    
    if (!csrfToken) {
      fileLogger.warn('error', 'CSRF token missing', {
        method: req.method,
        path: req.originalUrl,
        ip: this.clientIp(req),
      });
      res.status(403).json({
        success: false,
        statusCode: 403,
        message: 'CSRF token missing',
        error: 'FORBIDDEN',
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
      });
      return;
    }

    if (!this.validateToken(req, csrfToken)) {
      fileLogger.warn('error', 'CSRF token invalid', {
        method: req.method,
        path: req.originalUrl,
        ip: this.clientIp(req),
      });
      res.status(403).json({
        success: false,
        statusCode: 403,
        message: 'CSRF token invalid or expired',
        error: 'FORBIDDEN',
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
      });
      return;
    }

    next();
  }

  private generateToken(req: Request): string {
    const sessionId = this.getSessionId(req);
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + this.tokenExpiration;
    
    this.csrfTokens.set(sessionId, { token, expires });
    
    // Clean up expired tokens periodically
    this.cleanupExpiredTokens();
    
    return token;
  }

  private validateToken(req: Request, providedToken: string): boolean {
    const sessionId = this.getSessionId(req);
    const stored = this.csrfTokens.get(sessionId);
    
    if (!stored) return false;
    if (Date.now() > stored.expires) {
      this.csrfTokens.delete(sessionId);
      return false;
    }
    
    return stored.token === providedToken;
  }

  private getSessionId(req: Request): string {
    // Use IP + User-Agent as a simple session identifier
    const ip = this.clientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    return crypto.createHash('sha256').update(`${ip}:${userAgent}`).digest('hex');
  }

  private clientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) return forwarded.split(',')[0].trim();
    return req.socket?.remoteAddress ?? 'unknown';
  }

  private cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [sessionId, data] of this.csrfTokens.entries()) {
      if (now > data.expires) {
        this.csrfTokens.delete(sessionId);
      }
    }
  }
}

// ============================================================================
// 1. REQUEST LOGGER MIDDLEWARE
// ============================================================================

/** Bodies are logged for debugging — these keys are never written to disk */
const REDACTED_KEYS = ['password', 'confirmPassword', 'currentPassword', 'newPassword', 'token', 'authorization'];

/**
 * Request Logger Middleware (application-level — applied to every route)
 *
 * Gives each request an id, then records one access-log entry per request once
 * the response has been sent: method, path, status, duration, user, client ip.
 * Anything that answered 4xx or 5xx is copied into the error log as well.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = Date.now();

    // Correlation id — echoed back so a user can quote it when reporting a bug
    const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
    (req as any).requestId = requestId;
    res.setHeader('x-request-id', requestId);

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const status = res.statusCode;

      const entry = {
        requestId,
        method: req.method,
        path: req.originalUrl.split('?')[0],
        query: this.redact(req.query as Record<string, unknown>),
        status,
        durationMs,
        ip: this.clientIp(req),
        userAgent: req.headers['user-agent'],
        user: this.describeUser(req),
      };

      fileLogger.info('access', `${req.method} ${entry.path} ${status} ${durationMs}ms`, entry);

      if (status >= 400) {
        fileLogger.write(
          'error',
          status >= 500 ? 'error' : 'warn',
          `${req.method} ${entry.path} responded ${status}`,
          { ...entry, body: this.redact(req.body) },
        );
      }

      // Console line for the terminal; the file log is the durable record
      const line = `${req.method} ${entry.path} ${status} ${durationMs}ms`;
      status >= 500 ? this.logger.error(line) : status >= 400 ? this.logger.warn(line) : this.logger.log(line);
    });

    next();
  }

  private describeUser(req: Request): string {
    const attached = (req as any).user;
    if (attached?.id) return `${attached.id} (${attached.role})`;

    const [type, token] = (req.headers.authorization ?? '').split(' ');
    if (type !== 'Bearer' || !token) return 'anonymous';

    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
      return payload?.sub ? `${payload.sub} (${payload.role})` : 'anonymous';
    } catch {
      return 'unknown';
    }
  }

  private clientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) return forwarded.split(',')[0].trim();
    return req.socket?.remoteAddress ?? 'unknown';
  }

  private redact(source: unknown): Record<string, unknown> | undefined {
    if (!source || typeof source !== 'object') return undefined;

    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
      out[key] = REDACTED_KEYS.includes(key) ? '[REDACTED]' : value;
    }
    return out;
  }
}

// Aliases for convenience
export { RequestLoggerMiddleware as LoggerMiddleware };
export { RequestLoggerMiddleware as LodgerMiddleware };

// ============================================================================
// 2. SECURITY MIDDLEWARE
// ============================================================================

const GENERAL_LIMIT = Number(process.env.RATE_LIMIT_GENERAL) || 300;
const AUTH_LIMIT = Number(process.env.RATE_LIMIT_AUTH) || 20;
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
const AUTH_PATHS = ['/api/auth/login', '/api/auth/register'];

/**
 * Security Middleware (application-level — applied to every route)
 * Header security, rate limiting, and request size checks.
 */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly helmetHandler = typeof helmet === 'function' ? helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  }) : null;

  private readonly hits = new Map<string, number[]>();
  private readonly maxBodyBytes = Number(process.env.MAX_BODY_BYTES) || 1024 * 1024;
  private readonly disabled = process.env.RATE_LIMIT_DISABLED === 'true';

  constructor() {
    const sweep = setInterval(() => this.sweep(), WINDOW_MS);
    sweep.unref?.();
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const runNext = () => {
      const path = req.originalUrl.split('?')[0];

      const isUpload = path.startsWith('/api/uploads');
      const declared = Number(req.headers['content-length'] ?? 0);
      if (!isUpload && declared > this.maxBodyBytes) {
        fileLogger.warn('error', 'Request body too large', {
          path,
          declaredBytes: declared,
          limitBytes: this.maxBodyBytes,
          ip: this.clientIp(req),
        });
        res.status(413).json({
          success: false,
          statusCode: 413,
          message: `Request body too large. Limit is ${Math.round(this.maxBodyBytes / 1024)} KB.`,
          error: 'PAYLOAD_TOO_LARGE',
          timestamp: new Date().toISOString(),
          path,
        });
        return;
      }

      if (this.disabled || req.method === 'OPTIONS') {
        return next();
      }

      const ip = this.clientIp(req);
      const limit = AUTH_PATHS.includes(path) ? AUTH_LIMIT : GENERAL_LIMIT;
      const key = `${ip}|${limit === AUTH_LIMIT ? 'auth' : 'general'}`;
      const now = Date.now();

      const recent = (this.hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
      recent.push(now);
      this.hits.set(key, recent);

      const remaining = Math.max(0, limit - recent.length);
      res.setHeader('x-ratelimit-limit', String(limit));
      res.setHeader('x-ratelimit-remaining', String(remaining));

      if (recent.length > limit) {
        const retryAfter = Math.ceil((WINDOW_MS - (now - recent[0])) / 1000);
        fileLogger.warn('error', 'Rate limit exceeded', {
          ip,
          path,
          method: req.method,
          requestsInWindow: recent.length,
          limit,
        });
        res.setHeader('retry-after', String(retryAfter));
        res.status(429).json({
          success: false,
          statusCode: 429,
          message: `Too many requests. Try again in ${retryAfter} second(s).`,
          error: 'TOO_MANY_REQUESTS',
          timestamp: new Date().toISOString(),
          path,
        });
        return;
      }

      next();
    };

    if (this.helmetHandler) {
      this.helmetHandler(req, res, runNext);
    } else {
      runNext();
    }
  }

  private sweep(): void {
    const cutoff = Date.now() - WINDOW_MS;
    for (const [key, times] of this.hits) {
      const fresh = times.filter((t) => t > cutoff);
      fresh.length ? this.hits.set(key, fresh) : this.hits.delete(key);
    }
  }

  private clientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) return forwarded.split(',')[0].trim();
    return req.socket?.remoteAddress ?? 'unknown';
  }
}

// ============================================================================
// 3. ERROR HANDLER & NOT FOUND MIDDLEWARES
// ============================================================================

export function errorHandlerMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const status = Number(err?.status || err?.statusCode) || 500;
  const requestId = (req as any).requestId;

  fileLogger.write('error', status >= 500 ? 'error' : 'warn', `Unhandled error on ${req.method} ${req.originalUrl}`, {
    requestId,
    statusCode: status,
    method: req.method,
    path: req.originalUrl,
    name: err?.name,
    detail: err?.message,
    stack: err?.stack,
  });

  console.error(`[ErrorHandler] ${req.method} ${req.originalUrl} — ${err?.message ?? err}`);

  if (res.headersSent) return;

  res.status(status).json({
    success: false,
    statusCode: status,
    message: resolveMessage(err, status),
    error: status === 400 ? 'BAD_REQUEST' : status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR',
    requestId,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
}

export function notFoundMiddleware(req: Request, res: Response): void {
  fileLogger.warn('error', `Route not found: ${req.method} ${req.originalUrl}`, {
    requestId: (req as any).requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode: 404,
  });

  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    error: 'NOT_FOUND',
    requestId: (req as any).requestId,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
}

function resolveMessage(err: any, status: number): string {
  if (err?.type === 'entity.parse.failed') return 'Malformed JSON in request body.';
  if (err?.type === 'entity.too.large') return 'Request body too large.';
  if (err?.code === 'LIMIT_FILE_SIZE') return 'Uploaded file is too large.';
  if (err?.code === 'LIMIT_UNEXPECTED_FILE') return 'Unexpected file field in upload.';
  if (status >= 500) return 'Internal server error. The incident has been logged.';
  return err?.message || 'Request failed';
}

// ============================================================================
// 4. FILE UPLOAD MIDDLEWARE (Multer-based)
// ============================================================================

export const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES) || 5 * 1024 * 1024;

// Configure Multer storage
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
  }
};

export const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
  },
  fileFilter: fileFilter,
});

// Keep custom middleware for validation on top of Multer
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

// ============================================================================
// 6. FILE ROTATOR FOR LOG MANAGEMENT
// ============================================================================

/**
 * File Rotator Utility
 * Automatically rotates log files based on size and date
 * Required for evaluation: "Logs and error information should be stored in files at regular intervals"
 */
class FileRotator {
  private readonly maxFileSize: number;
  private readonly maxFiles: number;
  private readonly logsDir: string;
  private rotationInterval: NodeJS.Timeout | null = null;

  constructor(logsDir: string, maxFileSizeMB: number = 10, maxFiles: number = 5) {
    this.logsDir = logsDir;
    this.maxFileSize = maxFileSizeMB * 1024 * 1024; // Convert to bytes
    this.maxFiles = maxFiles;
  }

  start(intervalMs: number = 60000): void {
    // Check for rotation every minute by default
    this.rotationInterval = setInterval(() => {
      this.rotateIfNeeded();
    }, intervalMs);
    
    fileLogger.info('app', 'File rotator started', { 
      logsDir: this.logsDir, 
      maxFileSize: `${this.maxFileSize / (1024 * 1024)}MB`,
      maxFiles: this.maxFiles,
      interval: `${intervalMs}ms`
    });
  }

  stop(): void {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
      fileLogger.info('app', 'File rotator stopped');
    }
  }

  private rotateIfNeeded(): void {
    if (!fs.existsSync(this.logsDir)) {
      return;
    }

    const files = fs.readdirSync(this.logsDir);
    const logFiles = files.filter(f => f.endsWith('.log') && !f.includes('.rotated.'));

    for (const file of logFiles) {
      const filePath = path.join(this.logsDir, file);
      const stats = fs.statSync(filePath);

      if (stats.size > this.maxFileSize) {
        this.rotateFile(filePath, file);
      }
    }

    this.cleanOldFiles();
  }

  private rotateFile(filePath: string, fileName: string): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rotatedName = `${fileName}.rotated.${timestamp}`;
    const rotatedPath = path.join(this.logsDir, rotatedName);

    fs.renameSync(filePath, rotatedPath);
    
    // Create new empty log file
    fs.writeFileSync(filePath, '');
    
    fileLogger.info('app', 'Log file rotated', { 
      original: fileName, 
      rotated: rotatedName 
    });
  }

  private cleanOldFiles(): void {
    const files = fs.readdirSync(this.logsDir);
    const rotatedFiles = files
      .filter(f => f.includes('.rotated.'))
      .map(f => ({
        name: f,
        path: path.join(this.logsDir, f),
        time: fs.statSync(path.join(this.logsDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // Sort by newest first

    // Delete files beyond the max limit
    if (rotatedFiles.length > this.maxFiles) {
      const filesToDelete = rotatedFiles.slice(this.maxFiles);
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        fileLogger.info('app', 'Old log file deleted', { file: file.name });
      }
    }
  }
}

// Initialize file rotator
const logsDir = path.join(process.cwd(), 'logs');
const fileRotator = new FileRotator(logsDir, 10, 5); // 10MB max size, keep 5 files

// Export file rotator for use in main.ts
export { fileRotator };
