import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { fileLogger } from '../logging/file-logger';

/** Requests allowed from one IP inside the window, for normal endpoints */
const GENERAL_LIMIT = Number(process.env.RATE_LIMIT_GENERAL) || 300;

/** Stricter budget for credential endpoints, to slow brute force attempts */
const AUTH_LIMIT = Number(process.env.RATE_LIMIT_AUTH) || 20;

/** Sliding window length */
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;

/** Paths that get the stricter budget */
const AUTH_PATHS = ['/api/auth/login', '/api/auth/register'];

/**
 * Security Middleware (application-level — applied to every route)
 *
 * Three jobs:
 *  1. Security response headers via helmet (nosniff, frameguard, HSTS,
 *     referrer policy, hidden x-powered-by …). The CSP is left off because
 *     this process serves a JSON API plus Swagger UI, not the site's HTML.
 *  2. Per-IP rate limiting with a sliding window, tighter on the login and
 *     register routes. Blocked requests answer 429 and are written to the
 *     error log so repeated attempts are auditable.
 *  3. Rejects requests whose declared body is larger than the configured
 *     limit before Express buffers them.
 *
 * The rate limit state is in-memory, which suits a single-process app; a
 * multi-instance deployment would move this to Redis.
 */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly helmetHandler = helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  });

  /** ip -> timestamps of recent requests inside the window */
  private readonly hits = new Map<string, number[]>();

  /** Max JSON body accepted, mirroring the body parser limit in main.ts */
  private readonly maxBodyBytes = Number(process.env.MAX_BODY_BYTES) || 1024 * 1024;

  private readonly disabled = process.env.RATE_LIMIT_DISABLED === 'true';

  constructor() {
    // Drop stale IP entries so the map cannot grow without bound
    const sweep = setInterval(() => this.sweep(), WINDOW_MS);
    sweep.unref?.();
  }

  use(req: Request, res: Response, next: NextFunction): void {
    this.helmetHandler(req, res, () => {
      const path = req.originalUrl.split('?')[0];

      // Belt and braces: the JSON parser in main.ts runs before this and
      // enforces the same limit, but that only covers parsed content types.
      // This catches anything else that declares an oversized body.
      // Uploads are multipart and legitimately larger — multer enforces theirs.
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
    });
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
