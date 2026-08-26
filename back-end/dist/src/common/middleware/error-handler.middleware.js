"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandlerMiddleware = errorHandlerMiddleware;
exports.notFoundMiddleware = notFoundMiddleware;
const file_logger_1 = require("../logging/file-logger");
function errorHandlerMiddleware(err, req, res, next) {
    const status = Number(err?.status || err?.statusCode) || 500;
    const requestId = req.requestId;
    file_logger_1.fileLogger.write('error', status >= 500 ? 'error' : 'warn', `Unhandled error on ${req.method} ${req.originalUrl}`, {
        requestId,
        statusCode: status,
        method: req.method,
        path: req.originalUrl,
        name: err?.name,
        detail: err?.message,
        stack: err?.stack,
    });
    console.error(`[ErrorHandler] ${req.method} ${req.originalUrl} — ${err?.message ?? err}`);
    if (res.headersSent)
        return;
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
function notFoundMiddleware(req, res) {
    file_logger_1.fileLogger.warn('error', `Route not found: ${req.method} ${req.originalUrl}`, {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: 404,
    });
    res.status(404).json({
        success: false,
        statusCode: 404,
        message: `Cannot ${req.method} ${req.originalUrl}`,
        error: 'NOT_FOUND',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
    });
}
function resolveMessage(err, status) {
    if (err?.type === 'entity.parse.failed')
        return 'Malformed JSON in request body.';
    if (err?.type === 'entity.too.large')
        return 'Request body too large.';
    if (err?.code === 'LIMIT_FILE_SIZE')
        return 'Uploaded file is too large.';
    if (err?.code === 'LIMIT_UNEXPECTED_FILE')
        return 'Unexpected file field in upload.';
    if (status >= 500)
        return 'Internal server error. The incident has been logged.';
    return err?.message || 'Request failed';
}
//# sourceMappingURL=error-handler.middleware.js.map