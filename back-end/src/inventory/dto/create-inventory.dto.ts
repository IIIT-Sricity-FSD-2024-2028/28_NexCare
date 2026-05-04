/**
 * Create Inventory DTO - Simple data transfer object
 * Transfers inventory item creation data between client and server
 */
export class CreateInventoryDto {
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  unit: string;
  location: string;
}
