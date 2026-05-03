import { Module } from '@nestjs/common';
import { AmbulanceController } from './ambulance.controller';
import { AmbulanceService } from './ambulance.service';

/**
 * Ambulance Module
 * Manages emergency services and ambulance requests in the NexCare system
 * Provides CRUD operations and ambulance status management functionality
 */
@Module({
  controllers: [AmbulanceController],
  providers: [AmbulanceService],
  exports: [AmbulanceService],
})
export class AmbulanceModule {}
