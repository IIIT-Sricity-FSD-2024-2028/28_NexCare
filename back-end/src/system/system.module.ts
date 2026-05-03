import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';

/**
 * System Module
 * Manages audit logs and system configuration in the NexCare system
 * Provides CRUD operations and system management functionality
 */
@Module({
  controllers: [SystemController],
  providers: [SystemService],
  exports: [SystemService],
})
export class SystemModule {}
