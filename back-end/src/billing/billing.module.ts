import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillPdfService } from './bill-pdf.service';
import { SystemModule } from '../system/system.module';

/**
 * Billing Module
 * Manages patient billing and payments in the NexCare system
 * Provides CRUD operations and billing management functionality
 */
@Module({
  imports: [SystemModule],
  controllers: [BillingController],
  providers: [BillingService, BillPdfService],
  exports: [BillingService],
})
export class BillingModule {}
