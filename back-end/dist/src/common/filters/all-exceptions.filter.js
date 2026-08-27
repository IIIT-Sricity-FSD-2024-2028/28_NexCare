"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const file_logger_1 = require("../logging/file-logger");
let AllExceptionsFilter = class AllExceptionsFilter {
    constructor() {
        this.logger = new common_1.Logger('ExceptionFilter');
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const isHttp = exception instanceof common_1.HttpException;
        const status = isHttp ? exception.getStatus() : this.statusFromError(exception);
        const exceptionResponse = isHttp ? exception.getResponse() : null;
        const message = this.resolveMessage(exception, exceptionResponse, status);
        const errors = exceptionResponse && typeof exceptionResponse === 'object' && 'errors' in exceptionResponse
            ? exceptionResponse.errors
            : undefined;
        const requestId = request.requestId;
        file_logger_1.fileLogger.write('error', status >= 500 ? 'error' : 'warn', `${request.method} ${request.originalUrl} -> ${status}: ${message}`, {
            requestId,
            statusCode: status,
            method: request.method,
            path: request.originalUrl,
            user: request.user?.id ?? 'anonymous',
            exception: exception instanceof Error ? exception.name : typeof exception,
            stack: exception instanceof Error ? exception.stack : undefined,
        });
        if (status >= 500) {
            this.logger.error(`${request.method} ${request.originalUrl} — ${message}`, exception instanceof Error ? exception.stack : undefined);
        }
        response.status(status).json({
            success: false,
            statusCode: status,
            message,
            errors,
            error: common_1.HttpStatus[status] ?? 'ERROR',
            requestId,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
    statusFromError(exception) {
        const candidate = Number(exception?.status ?? exception?.statusCode);
        if (Number.isInteger(candidate) && candidate >= 400 && candidate <= 599) {
            return candidate;
        }
        return common_1.HttpStatus.INTERNAL_SERVER_ERROR;
    }
    resolveMessage(exception, exceptionResponse, status) {
        const raw = exceptionResponse && typeof exceptionResponse === 'object' && 'message' in exceptionResponse
            ? exceptionResponse.message
            : typeof exceptionResponse === 'string'
                ? exceptionResponse
                : exception instanceof Error
                    ? exception.message
                    : null;
        const parserType = exception?.type ?? exception?.cause?.type;
        if (parserType === 'entity.too.large' || /entity too large/i.test(String(raw))) {
            return 'Request body too large.';
        }
        if (parserType === 'entity.parse.failed' || /JSON at position|Unexpected (token|end of JSON)/i.test(String(raw))) {
            return 'Malformed JSON in request body.';
        }
        if (status >= 500) {
            return 'Internal server error. The incident has been logged.';
        }
        return raw ?? 'Request failed';
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map