import { Module, OnApplicationShutdown } from '@nestjs/common';
import { LogsController } from './logs.controller';
import { fileLogger } from './file-logger';

/**
 * Logging Module
 * Exposes the stored logs to administrators and makes sure anything still
 * buffered is written to disk when the application shuts down.
 */
@Module({
  controllers: [LogsController],
})
export class LoggingModule implements OnApplicationShutdown {
  onApplicationShutdown(signal?: string) {
    fileLogger.info('app', 'Application shutting down', { signal });
    fileLogger.stop();
  }
}
