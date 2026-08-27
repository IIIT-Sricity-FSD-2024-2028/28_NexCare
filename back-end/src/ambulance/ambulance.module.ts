import { Module } from '@nestjs/common';
import { AmbulanceController } from './ambulance.controller';
import { AmbulanceService } from './ambulance.service';
import { SystemModule } from '../system/system.module';
import { PatientsModule } from '../patients/patients.module';

/**
 * Ambulance Module
 * Manages emergency services and ambulance requests in the NexCare system
 * Provides CRUD operations and ambulance status management functionality
 */
@Module({
  imports: [SystemModule, PatientsModule],
  controllers: [AmbulanceController],
  providers: [AmbulanceService],
  exports: [AmbulanceService],
})
export class AmbulanceModule {}
