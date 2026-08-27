import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ResponseUtil } from '../utils/response.util';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../interfaces/api-response.interface';
import { fileLogger, LogStream } from './file-logger';

const STREAMS: LogStream[] = ['access', 'error', 'app'];

/**
 * Logs Controller
 * Read-only view over the log files for administrators, so the stored logs can
 * be inspected from the admin portal without shell access to the server.
 */
@ApiTags('Logs')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.SUPERUSER, UserRole.ADMINISTRATIVE_STAFF)
@Controller('logs')
export class LogsController {
  /**
   * Recent entries from one log stream, newest first
   */
  @Get()
  @ApiOperation({ summary: 'Read recent log entries' })
  @ApiQuery({ name: 'stream', required: false, enum: STREAMS })
  @ApiQuery({ name: 'limit', required: false, example: 100 })
  @ApiResponse({ status: 200, description: 'Recent log entries' })
  async read(@Query('stream') stream = 'access', @Query('limit') limit = '100') {
    if (!STREAMS.includes(stream as LogStream)) {
      return ResponseUtil.error(`Unknown log stream "${stream}". Valid streams: ${STREAMS.join(', ')}.`);
    }

    const parsedLimit = Math.min(Math.max(Number(limit) || 100, 1), 1000);
    const entries = fileLogger.readRecent(stream as LogStream, parsedLimit);

    return ResponseUtil.success(`${stream} log retrieved successfully`, entries);
  }

  /**
   * Log files currently on disk
   */
  @Get('files')
  @ApiOperation({ summary: 'List log files with sizes' })
  @ApiResponse({ status: 200, description: 'Log files on disk' })
  async files() {
    return ResponseUtil.success('Log files retrieved successfully', fileLogger.listFiles());
  }
}
