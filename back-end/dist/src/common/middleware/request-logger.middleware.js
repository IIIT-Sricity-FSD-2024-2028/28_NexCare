"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestLoggerMiddleware = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
const file_logger_1 = require("../logging/file-logger");
const REDACTED_KEYS = ['password', 'confirmPassword', 'currentPassword', 'newPassword', 'token', 'authorization'];
let RequestLoggerMiddleware = class RequestLoggerMiddleware {
    constructor() {
        this.logger = new common_1.Logger('HTTP');
    }
    use(req, res, next) {
        const startedAt = Date.now();
        const requestId = req.headers['x-request-id'] || crypto.randomUUID();
        req.requestId = requestId;
        res.setHeader('x-request-id', requestId);
        res.on('finish', () => {
            const durationMs = Date.now() - startedAt;
            const status = res.statusCode;
            const entry = {
                requestId,
                method: req.method,
                path: req.originalUrl.split('?')[0],
                query: this.redact(req.query),
                status,
                durationMs,
                ip: this.clientIp(req),
                userAgent: req.headers['user-agent'],
                user: this.describeUser(req),
            };
            file_logger_1.fileLogger.info('access', `${req.method} ${entry.path} ${status} ${durationMs}ms`, entry);
            if (status >= 400) {
                file_logger_1.fileLogger.write('error', status >= 500 ? 'error' : 'warn', `${req.method} ${entry.path} responded ${status}`, { ...entry, body: this.redact(req.body) });
            }
            const line = `${req.method} ${entry.path} ${status} ${durationMs}ms`;
            status >= 500 ? this.logger.error(line) : status >= 400 ? this.logger.warn(line) : this.logger.log(line);
        });
        next();
    }
    describeUser(req) {
        const attached = req.user;
        if (attached?.id)
            return `${attached.id} (${attached.role})`;
        const [type, token] = (req.headers.authorization ?? '').split(' ');
        if (type !== 'Bearer' || !token)
            return 'anonymous';
        try {
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
            return payload?.sub ? `${payload.sub} (${payload.role})` : 'anonymous';
        }
        catch {
            return 'unknown';
        }
    }
    clientIp(req) {
        const forwarded = req.headers['x-forwarded-for'];
        if (typeof forwarded === 'string' && forwarded.length > 0)
            return forwarded.split(',')[0].trim();
        return req.socket?.remoteAddress ?? 'unknown';
    }
    redact(source) {
        if (!source || typeof source !== 'object')
            return undefined;
        const out = {};
        for (const [key, value] of Object.entries(source)) {
            out[key] = REDACTED_KEYS.includes(key) ? '[REDACTED]' : value;
        }
        return out;
    }
};
exports.RequestLoggerMiddleware = RequestLoggerMiddleware;
exports.RequestLoggerMiddleware = RequestLoggerMiddleware = __decorate([
    (0, common_1.Injectable)()
], RequestLoggerMiddleware);
//# sourceMappingURL=request-logger.middleware.js.map