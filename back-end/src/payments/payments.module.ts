import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PricingModule } from '../revenue/pricing.module';

/**
 * Payments Module
 *
 * Imports PricingModule for the fee rates only. It deliberately does NOT import
 * RevenueModule: revenue reads the ledger this module writes, so a dependency
 * the other way would be a cycle — and would also invert the responsibility,
 * since reporting must never be able to change what was earned.
 */
@Module({
  imports: [PricingModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
