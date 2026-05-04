import { InventoryStatus } from '../../common/interfaces/api-response.interface';

/**
 * Update Inventory DTO - Simple data transfer object
 * Transfers inventory item update data between client and server
 */
export class UpdateInventoryDto {
  name?: string;
  category?: string;
  quantity?: number;
  minStock?: number;
  unit?: string;
  location?: string;
  status?: InventoryStatus;
}
