import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryAuditInterceptor } from './interceptors/inventory-audit.interceptor';

/**
 * Inventory Module
 * Manages supply chain and inventory tracking in the NexCare system
 * Provides CRUD operations and inventory management functionality
 */
@Module({
  controllers: [InventoryController],
  providers: [InventoryService, InventoryAuditInterceptor],
  exports: [InventoryService, InventoryAuditInterceptor],
})
export class InventoryModule {}

