import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { fileLogger } from '../logging/file-logger';

/**
 * Global Exception Filter
 *
 * `@Catch()` with no argument catches everything, not just HttpException, so a
 * stray TypeError in a service becomes a clean 500 JSON response instead of a
 * stack trace leaking to the client.
 *
 * Every exception is written to logs/error-<date>.log with its stack, the
 * request id, and the caller — the durable record required for error
 * management. Stack traces are logged, never returned to the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : this.statusFromError(exception);
    const exceptionResponse = isHttp ? exception.getResponse() : null;

    const message = this.resolveMessage(exception, exceptionResponse, status);
    const errors =
      exceptionResponse && typeof exceptionResponse === 'object' && 'errors' in exceptionResponse
        ? (exceptionResponse as any).errors
        : undefined;

    const requestId = (request as any).requestId;

    fileLogger.write(
      'error',
      status >= 500 ? 'error' : 'warn',
      `${request.method} ${request.originalUrl} -> ${status}: ${message}`,
      {
        requestId,
        statusCode: status,
        method: request.method,
        path: request.originalUrl,
        user: (request as any).user?.id ?? 'anonymous',
        exception: exception instanceof Error ? exception.name : typeof exception,
        stack: exception instanceof Error ? exception.stack : undefined,
      },
    );

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.originalUrl} — ${message}`, exception instanceof Error ? exception.stack : undefined);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      errors,
      error: HttpStatus[status] ?? 'ERROR',
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  /**
   * Errors raised outside Nest — the body parser's PayloadTooLargeError, for
   * one — carry their own HTTP status. Nest would otherwise report them as a
   * 500, which tells the client nothing about what to fix.
   */
  private statusFromError(exception: unknown): number {
    const candidate = Number((exception as any)?.status ?? (exception as any)?.statusCode);
    if (Number.isInteger(candidate) && candidate >= 400 && candidate <= 599) {
      return candidate;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private resolveMessage(exception: unknown, exceptionResponse: unknown, status: number): string {
    const raw =
      exceptionResponse && typeof exceptionResponse === 'object' && 'message' in exceptionResponse
        ? (exceptionResponse as any).message
        : typeof exceptionResponse === 'string'
          ? exceptionResponse
          : exception instanceof Error
            ? exception.message
            : null;

    // Body parser failures — Nest surfaces the raw V8 parse error, which is
    // noise to an API client. Say what is actually wrong instead.
    const parserType = (exception as any)?.type ?? (exception as any)?.cause?.type;
    if (parserType === 'entity.too.large' || /entity too large/i.test(String(raw))) {
      return 'Request body too large.';
    }
    if (parserType === 'entity.parse.failed' || /JSON at position|Unexpected (token|end of JSON)/i.test(String(raw))) {
      return 'Malformed JSON in request body.';
    }

    // Internal failures must not leak implementation detail to the caller
    if (status >= 500) {
      return 'Internal server error. The incident has been logged.';
    }
    return raw ?? 'Request failed';
  }
}
