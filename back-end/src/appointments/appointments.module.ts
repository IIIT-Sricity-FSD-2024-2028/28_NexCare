import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

/**
 * Appointments Module
 * Manages appointment scheduling and status tracking in the NexCare system
 * Provides CRUD operations and appointment management functionality
 */
@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
