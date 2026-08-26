import { Module } from '@nestjs/common';
import { HospitalsController } from './hospitals.controller';
import { HospitalsService } from './hospitals.service';
import { HospitalQueryInterceptor } from './interceptors/hospital-query.interceptor';

@Module({
  controllers: [HospitalsController],
  providers: [HospitalsService, HospitalQueryInterceptor],
  exports: [HospitalsService]
})
export class HospitalsModule {}
