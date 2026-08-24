import { Module } from '@nestjs/common';
import { SupportRequestsController } from './support-requests.controller';
import { SupportRequestsService } from './support-requests.service';

@Module({
  controllers: [SupportRequestsController],
  providers: [SupportRequestsService]
})
export class SupportRequestsModule {}
