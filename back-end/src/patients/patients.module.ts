import { Module } from '@nestjs/common';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';

/**
 * Patients Module
 * Manages patient records and profiles in the NexCare system
 * Provides CRUD operations and patient management functionality
 */
@Module({
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
