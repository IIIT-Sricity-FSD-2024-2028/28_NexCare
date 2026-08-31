import { Module } from '@nestjs/common';
import { SchedulesController } from './schedules.controller';
import { DoctorSchedulesController } from './doctor-schedules.controller';
import { SchedulesService } from './schedules.service';
import { DoctorScheduleService } from './doctor-schedule.service';

@Module({
  controllers: [SchedulesController, DoctorSchedulesController],
  providers: [SchedulesService, DoctorScheduleService],
  exports: [SchedulesService, DoctorScheduleService],
})
export class SchedulesModule {}
