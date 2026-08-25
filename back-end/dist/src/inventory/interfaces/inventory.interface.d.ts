import { InventoryStatus } from '../../common/interfaces/api-response.interface';
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
    hospitalId?: string;
    createdAt?: string;
    updatedAt?: string;
}
export interface CreateInventoryRequest {
    name: string;
    category: string;
    quantity: number;
    minStock: number;
    unit: string;
    location: string;
}
export interface UpdateInventoryRequest {
    name?: string;
    category?: string;
    quantity?: number;
    minStock?: number;
    unit?: string;
    location?: string;
    status?: InventoryStatus;
}
export interface RestockRequest {
    quantity: number;
    notes?: string;
}
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
