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
exports.SecurityMiddleware = void 0;
const common_1 = require("@nestjs/common");
const helmet_1 = require("helmet");
const file_logger_1 = require("../logging/file-logger");
const GENERAL_LIMIT = Number(process.env.RATE_LIMIT_GENERAL) || 300;
const AUTH_LIMIT = Number(process.env.RATE_LIMIT_AUTH) || 20;
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
const AUTH_PATHS = ['/api/auth/login', '/api/auth/register'];
let SecurityMiddleware = class SecurityMiddleware {
    constructor() {
        this.helmetHandler = (0, helmet_1.default)({
            contentSecurityPolicy: false,
            crossOriginResourcePolicy: { policy: 'cross-origin' },
            crossOriginEmbedderPolicy: false,
        });
        this.hits = new Map();
        this.maxBodyBytes = Number(process.env.MAX_BODY_BYTES) || 1024 * 1024;
        this.disabled = process.env.RATE_LIMIT_DISABLED === 'true';
        const sweep = setInterval(() => this.sweep(), WINDOW_MS);
        sweep.unref?.();
    }
    use(req, res, next) {
        this.helmetHandler(req, res, () => {
            const path = req.originalUrl.split('?')[0];
            const isUpload = path.startsWith('/api/uploads');
            const declared = Number(req.headers['content-length'] ?? 0);
            if (!isUpload && declared > this.maxBodyBytes) {
                file_logger_1.fileLogger.warn('error', 'Request body too large', {
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
                file_logger_1.fileLogger.warn('error', 'Rate limit exceeded', {
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
    sweep() {
        const cutoff = Date.now() - WINDOW_MS;
        for (const [key, times] of this.hits) {
            const fresh = times.filter((t) => t > cutoff);
            fresh.length ? this.hits.set(key, fresh) : this.hits.delete(key);
        }
    }
    clientIp(req) {
        const forwarded = req.headers['x-forwarded-for'];
        if (typeof forwarded === 'string' && forwarded.length > 0)
            return forwarded.split(',')[0].trim();
        return req.socket?.remoteAddress ?? 'unknown';
    }
};
exports.SecurityMiddleware = SecurityMiddleware;
exports.SecurityMiddleware = SecurityMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SecurityMiddleware);
//# sourceMappingURL=security.middleware.js.map