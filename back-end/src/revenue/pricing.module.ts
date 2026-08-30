import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';

/**
 * Pricing Module
 *
 * Split out from RevenueModule because RevenueModule imports HospitalsModule,
 * and AuthModule needs the price list too — importing RevenueModule from
 * AuthModule would close a cycle. PricingService has no dependencies of its own,
 * so this module is safe to import from anywhere.
 */
@Module({
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
