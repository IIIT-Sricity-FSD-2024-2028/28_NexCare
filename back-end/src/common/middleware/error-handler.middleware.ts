import { Request, Response, NextFunction } from 'express';
import { fileLogger } from '../logging/file-logger';

/**
 * Express-level error handling middleware.
 *
 * Nest's exception filter only wraps route handlers, so failures that happen
 * earlier — a malformed JSON body rejected by the body parser, a middleware
 * that threw, a multer upload error — never reach it and would otherwise be
 * answered with Express's default HTML error page.
 *
 * Registered in main.ts after the routes are mounted, which is what puts it
 * last in the chain where an error handler has to sit. The four-argument
 * signature is what marks it as an error handler to Express; `next` is unused
 * but must stay in the list.
 */
export function errorHandlerMiddleware(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

/**
 * Unknown-route handler. Sits just before the error handler so a request for a
 * route that does not exist gets the same JSON envelope as every other error.
 */
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

/** Keep parser and upload failures readable; hide internals for 5xx */
function resolveMessage(err: any, status: number): string {
  if (err?.type === 'entity.parse.failed') return 'Malformed JSON in request body.';
  if (err?.type === 'entity.too.large') return 'Request body too large.';
  if (err?.code === 'LIMIT_FILE_SIZE') return 'Uploaded file is too large.';
  if (err?.code === 'LIMIT_UNEXPECTED_FILE') return 'Unexpected file field in upload.';
  if (status >= 500) return 'Internal server error. The incident has been logged.';
  return err?.message || 'Request failed';
}
