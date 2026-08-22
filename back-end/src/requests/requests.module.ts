import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { HospitalsModule } from '../hospitals/hospitals.module';

@Module({
  imports: [HospitalsModule],
  controllers: [RequestsController],
  providers: [RequestsService]
})
export class RequestsModule {}
