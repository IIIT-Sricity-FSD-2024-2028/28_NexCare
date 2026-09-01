import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';

/**
 * Pricing Module
 *
 * Split out from RevenueModule because RevenueModule imports HospitalsModule,
 * and PaymentsModule needs the fee rates too — importing RevenueModule from
 * PaymentsModule would close a cycle. PricingService has no dependencies of its
 * own, so this module is safe to import from anywhere.
 */
@Module({
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
