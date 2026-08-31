import { Module, forwardRef } from '@nestjs/common';
import { RevenueController } from './revenue.controller';
import { RevenueService } from './revenue.service';
import { PricingModule } from './pricing.module';
import { HospitalsModule } from '../hospitals/hospitals.module';
import { HealthScoreService } from './health-score.service';

/**
 * Revenue Module
 *
 * Owns NexCare's subscription pricing and both revenue roll-ups. It reads
 * billing.json and hospitals.json rather than owning them, so nothing here can
 * drift out of step with the bills the front desk actually raises.
 *
 * forwardRef mirrors the UsersModule <-> HospitalsModule arrangement: HospitalsModule
 * pulls in other feature modules, so importing it directly risks a cycle.
 */
@Module({
  imports: [forwardRef(() => HospitalsModule), PricingModule],
  controllers: [RevenueController],
  providers: [RevenueService, HealthScoreService],
  exports: [RevenueService, HealthScoreService],
})
export class RevenueModule {}
