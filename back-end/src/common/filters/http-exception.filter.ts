import { Catch } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

/**
 * Kept as an alias so existing imports keep working.
 *
 * The behaviour now lives in AllExceptionsFilter, which catches every
 * exception (not only HttpException) and writes it to the error log.
 * Prefer importing AllExceptionsFilter directly in new code.
 */
@Catch()
export class HttpExceptionFilter extends AllExceptionsFilter {}
