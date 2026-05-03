/**
 * Create Inventory DTO - Placeholder for validation decorators
 * Teammates will add class-validator decorators here
 */
export class CreateInventoryDto {
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  unit: string;
  location: string;
}
