import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { SystemModule } from '../system/system.module';
import { PatientsModule } from '../patients/patients.module';
import { LeavesModule } from '../leaves/leaves.module';

/**
 * Appointments Module
 * Manages doctor appointments and scheduling in the NexCare system
 * Provides CRUD operations and appointment management functionality
 */
@Module({
  imports: [SystemModule, PatientsModule, LeavesModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
