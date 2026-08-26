import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { fileLogger } from '../logging/file-logger';

/** Bodies are logged for debugging — these keys are never written to disk */
const REDACTED_KEYS = ['password', 'confirmPassword', 'currentPassword', 'newPassword', 'token', 'authorization'];

/**
 * Request Logger Middleware (application-level — applied to every route)
 *
 * Gives each request an id, then records one access-log entry per request once
 * the response has been sent: method, path, status, duration, user, client ip.
 * Anything that answered 4xx or 5xx is copied into the error log as well.
 *
 * Entries are buffered by FileLogger and flushed to logs/access-<date>.log on
 * a timer, so logging never adds a disk write to the request path.
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

  /**
   * The AuthGuard has not run yet at middleware time, so request.user does not
   * exist. The token payload is unverified here and used for logging only.
   */
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

  /** Shallow copy with credentials masked */
  private redact(source: unknown): Record<string, unknown> | undefined {
    if (!source || typeof source !== 'object') return undefined;

    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
      out[key] = REDACTED_KEYS.includes(key) ? '[REDACTED]' : value;
    }
    return out;
  }
}
