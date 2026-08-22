import { Module } from '@nestjs/common';
import { WardsController } from './wards.controller';
import { WardsService } from './wards.service';

@Module({
  controllers: [WardsController],
  providers: [WardsService]
})
export class WardsModule {}
