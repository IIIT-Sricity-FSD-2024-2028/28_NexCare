/**
 * Restock Inventory DTO - Simple data transfer object
 * Transfers inventory restocking data between client and server
 */
export class RestockInventoryDto {
  quantity: number;
  supplier?: string;
  batchNumber?: string;
  expiryDate?: string;
  restockedBy: string;
  notes?: string;
}
