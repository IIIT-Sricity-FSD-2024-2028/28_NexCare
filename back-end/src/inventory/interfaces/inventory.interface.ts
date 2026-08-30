import { InventoryStatus, InventoryRequirementStatus, InventoryPriority } from '../../common/interfaces/api-response.interface';

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
  hospitalId?: string;
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
  hospitalId?: string;
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
  hospitalId?: string;
}

/**
 * Restock Request Interface
 */
export interface RestockRequest {
  quantity: number;
  notes?: string;
  supplier?: string;
  batchNumber?: string;
  expiryDate?: string;
  restockedBy?: string;
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

/**
 * Inventory Audit Log Interface
 */
export interface InventoryAudit {
  id: string;
  itemId: string;
  action: 'restock' | 'use';
  quantityBefore: number;
  quantityAfter: number;
  statusBefore?: InventoryStatus;
  statusAfter?: InventoryStatus;
  userId: string;
  timestamp: string;
  notes?: string;
}

/**
 * Inventory Requirement Request Interface
 * Raised by Administrative Staff, approved/rejected by Hospital Manager
 */
export interface InventoryRequirement {
  id: string;
  hospitalId: string;
  itemId?: string;
  itemName: string;
  category: string;
  currentQuantity: number;
  requiredQuantity: number;
  requestedQuantity: number;
  unit: string;
  department: string;
  requestedBy: string;
  requestedById?: string;
  requestDate: string;
  priority: InventoryPriority | string;
  reason: string;
  estimatedCost: number;
  status: InventoryRequirementStatus | string;
  // Hospital Manager Review
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  managerRemarks?: string;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  // Admin Staff Purchasing
  supplier?: string;
  invoiceNumber?: string;
  purchaseDate?: string;
  quantityPurchased?: number;
  finalCost?: number;
  purchaseNotes?: string;
  purchasedAt?: string;
  purchasedBy?: string;
  purchasedByName?: string;
  // Restocking
  restockedAt?: string;
  restockedBy?: string;
  restockedByName?: string;
  fulfilledAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Inventory Requirement DTO
 */
export interface CreateInventoryRequirementDto {
  hospitalId?: string;
  itemId?: string;
  itemName: string;
  category: string;
  currentQuantity?: number;
  requiredQuantity?: number;
  requestedQuantity: number;
  unit: string;
  department: string;
  requestedBy?: string;
  requestedById?: string;
  requestDate?: string;
  priority: InventoryPriority | string;
  reason: string;
  estimatedCost?: number;
}

/**
 * Update / Decision DTO for Inventory Requirement (Hospital Manager)
 */
export interface DecideInventoryRequirementDto {
  status?: InventoryRequirementStatus | string;
  rejectionReason?: string;
  managerRemarks?: string;
}

/**
 * Start / Update Purchase DTO (Administrative Staff)
 */
export interface StartPurchaseDto {
  supplier: string;
  invoiceNumber?: string;
  purchaseDate?: string;
  quantityPurchased?: number;
  finalCost?: number;
  purchaseNotes?: string;
}
