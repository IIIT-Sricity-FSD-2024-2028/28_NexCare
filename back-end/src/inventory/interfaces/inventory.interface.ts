import { InventoryStatus } from '../../common/interfaces/api-response.interface';

/**
 * Inventory Entity Interface
 * Represents an inventory item in the NexCare system
 */
export interface Inventory {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  unit: string;
  location: string;
  status: InventoryStatus;
  lastRestocked?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Inventory Request Interface
 */
export interface CreateInventoryRequest {
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  unit: string;
  location: string;
}

/**
 * Update Inventory Request Interface
 */
export interface UpdateInventoryRequest {
  name?: string;
  category?: string;
  quantity?: number;
  minStock?: number;
  unit?: string;
  location?: string;
  status?: InventoryStatus;
}

/**
 * Restock Request Interface
 */
export interface RestockRequest {
  quantity: number;
  notes?: string;
}

/**
 * Inventory Statistics Interface
 */
export interface InventoryStats {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  discontinued: number;
  byCategory: Record<string, number>;
  byLocation: Record<string, number>;
  totalValue: number;
}
