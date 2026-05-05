import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { SystemModule } from '../system/system.module';

/**
 * Appointments Module
 * Manages doctor appointments and scheduling in the NexCare system
 * Provides CRUD operations and appointment management functionality
 */
@Module({
  imports: [SystemModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
