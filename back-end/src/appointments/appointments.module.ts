import { Module, forwardRef } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { SystemModule } from '../system/system.module';
import { PatientsModule } from '../patients/patients.module';
import { LeavesModule } from '../leaves/leaves.module';
import { UsersModule } from '../users/users.module';
import { SchedulesModule } from '../schedules/schedules.module';

/**
 * Appointments Module
 * Manages doctor appointments and scheduling in the NexCare system
 * Provides CRUD operations and appointment management functionality
 */
@Module({
  imports: [SystemModule, PatientsModule, forwardRef(() => LeavesModule), UsersModule, SchedulesModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
