import { Module } from '@nestjs/common';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { SystemModule } from '../system/system.module';

/**
 * Patients Module
 * Manages patient profiles and records in the NexCare system
 * Provides CRUD operations and patient data management functionality
 */
@Module({
  imports: [SystemModule],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
