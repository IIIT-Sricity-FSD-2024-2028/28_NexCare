import { Module } from '@nestjs/common';
import { BedsController } from './beds.controller';
import { BedsService } from './beds.service';

/**
 * Beds Module
 * Manages hospital bed allocation and ward management in the NexCare system
 * Provides CRUD operations and bed management functionality
 */
@Module({
  controllers: [BedsController],
  providers: [BedsService],
  exports: [BedsService],
})
export class BedsModule {}
