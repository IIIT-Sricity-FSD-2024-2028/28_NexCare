import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { IdGenerator } from '../common/utils/id-generator.util';
import { ArrayUtil } from '../common/utils/array.util';
import { Inventory, CreateInventoryRequest, UpdateInventoryRequest, RestockRequest, InventoryStats, InventoryAudit } from './interfaces/inventory.interface';
import { InventoryStatus } from '../common/interfaces/api-response.interface';


/**
 * Inventory Service
 * Manages supply chain and inventory tracking in the NexCare system
 * Handles CRUD operations for inventory with stock management
 */
@Injectable()
export class InventoryService {
  private readonly inventoryFilePath = path.join(process.cwd(), 'data', 'inventory.json');
  private inventory: Inventory[] = [];

  constructor() {
    this.inventory = this.loadInventory();
  }

  /** Load inventory from disk */
  private loadInventory(): Inventory[] {
    try {
      if (!fs.existsSync(this.inventoryFilePath)) {
        const initial = this.getInitialMockData();
        this.saveInventory(initial);
        return initial;
      }
      const raw = fs.readFileSync(this.inventoryFilePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return this.getInitialMockData();
    }
  }

  /** Persist inventory to disk */
  private saveInventory(items: Inventory[]): void {
    try {
      fs.mkdirSync(path.dirname(this.inventoryFilePath), { recursive: true });
      fs.writeFileSync(this.inventoryFilePath, JSON.stringify(items, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist inventory:', err);
    }
  }

  // In-memory mock inventory database (aligned with frontend db.js)
  private getInitialMockData(): Inventory[] {
    return [
      {
        id: 'INV-001',
        name: 'Paracetamol',
        category: 'Medication',
        quantity: 500,
        minStock: 100,
        unit: 'tablets',
        location: 'Pharmacy',
        status: InventoryStatus.IN_STOCK,
        lastRestocked: '2026-03-15T00:00:00Z',
        createdAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'INV-002',
        name: 'Surgical Gloves',
        category: 'Medical Supplies',
        quantity: 2000,
        minStock: 500,
        unit: 'pairs',
        location: 'ER',
        status: InventoryStatus.IN_STOCK,
        lastRestocked: '2026-03-20T00:00:00Z',
        createdAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'INV-003',
        name: 'IV Catheters',
        category: 'Medical Supplies',
        quantity: 150,
        minStock: 200,
        unit: 'units',
        location: 'ER',
        status: InventoryStatus.LOW_STOCK,
        lastRestocked: '2026-02-10T00:00:00Z',
        createdAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'INV-004',
        name: 'Face Masks',
        category: 'PPE',
        quantity: 0,
        minStock: 1000,
        unit: 'units',
        location: 'Reception',
        status: InventoryStatus.OUT_OF_STOCK,
        lastRestocked: '2026-01-15T00:00:00Z',
        createdAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'INV-005',
        name: 'Bandages',
        category: 'Medical Supplies',
        quantity: 800,
        minStock: 300,
        unit: 'rolls',
        location: 'ER',
        status: InventoryStatus.IN_STOCK,
        lastRestocked: '2026-03-25T00:00:00Z',
        createdAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'INV-006',
        name: 'Syringes 5ml',
        category: 'Medical Supplies',
        quantity: 3000,
        minStock: 1000,
        unit: 'units',
        location: 'Pharmacy',
        status: InventoryStatus.IN_STOCK,
        lastRestocked: '2026-03-22T00:00:00Z',
        createdAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'INV-007',
        name: 'Antiseptic Solution',
        category: 'Medication',
        quantity: 50,
        minStock: 75,
        unit: 'bottles',
        location: 'ER',
        status: InventoryStatus.LOW_STOCK,
        lastRestocked: '2026-02-28T00:00:00Z',
        createdAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'INV-008',
        name: 'Thermometer',
        category: 'Equipment',
        quantity: 25,
        minStock: 10,
        unit: 'units',
        location: 'ER',
        status: InventoryStatus.IN_STOCK,
        lastRestocked: '2026-01-10T00:00:00Z',
        createdAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'INV-009',
        name: 'Blood Pressure Monitor',
        category: 'Equipment',
        quantity: 8,
        minStock: 5,
        unit: 'units',
        location: 'ER',
        status: InventoryStatus.IN_STOCK,
        lastRestocked: '2026-01-05T00:00:00Z',
        createdAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'INV-010',
        name: 'Stethoscope',
        category: 'Equipment',
        quantity: 15,
        minStock: 10,
        unit: 'units',
        location: 'General',
        status: InventoryStatus.IN_STOCK,
        lastRestocked: '2026-02-15T00:00:00Z',
        createdAt: '2026-01-01T00:00:00Z'
      }
    ];
  }


  /**
   * Get all inventory with optional filtering
   * @param category Optional category filter
   * @param status Optional status filter
   * @param location Optional location filter
   * @returns List of inventory items
   */
  async findAll(category?: string, status?: InventoryStatus, location?: string) {
    try {
      let filteredInventory = [...this.inventory];

      // Apply category filter
      if (category) {
        filteredInventory = filteredInventory.filter(item => item.category === category);
      }

      // Apply status filter
      if (status) {
        filteredInventory = filteredInventory.filter(item => item.status === status);
      }

      // Apply location filter
      if (location) {
        filteredInventory = filteredInventory.filter(item => item.location === location);
      }

      return ResponseUtil.success('Inventory retrieved successfully', filteredInventory);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve inventory');
    }
  }

  /**
   * Get inventory item by ID
   * @param id Item ID
   * @returns Inventory item data
   */
  async findById(id: string) {
    try {
      const item = this.inventory.find(i => i.id === id);
      
      if (!item) {
        return ResponseUtil.notFound('Inventory item', id);
      }

      return ResponseUtil.success('Inventory item retrieved successfully', item);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve inventory item');
    }
  }

  /**
   * Create new inventory item
   * @param itemData Item creation data
   * @returns Created item data
   */
  async create(itemData: CreateInventoryRequest) {
    try {
      // Generate new item ID
      const newItemId = IdGenerator.generateInventoryId();

      // Determine status based on quantity
      let status: InventoryStatus;
      if (itemData.quantity === 0) {
        status = InventoryStatus.OUT_OF_STOCK;
      } else if (itemData.quantity < itemData.minStock) {
        status = InventoryStatus.LOW_STOCK;
      } else {
        status = InventoryStatus.IN_STOCK;
      }

      // Create new item
      const newItem: Inventory = {
        id: newItemId,
        name: itemData.name,
        category: itemData.category,
        quantity: itemData.quantity,
        minStock: itemData.minStock,
        unit: itemData.unit,
        location: itemData.location,
        status,
        lastRestocked: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to inventory array
      this.inventory.push(newItem);
      this.saveInventory(this.inventory);

      return ResponseUtil.created('Inventory item created successfully', newItem);
    } catch (error) {
      return ResponseUtil.serverError('Failed to create inventory item');
    }
  }

  /**
   * Update inventory item
   * @param id Item ID
   * @param updateData Item update data
   * @returns Updated item data
   */
  async update(id: string, updateData: UpdateInventoryRequest) {
    try {
      const itemIndex = this.inventory.findIndex(i => i.id === id);
      
      if (itemIndex === -1) {
        return ResponseUtil.notFound('Inventory item', id);
      }

      // Update item
      let updatedItem = {
        ...this.inventory[itemIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      // Recalculate status if quantity or minStock is updated
      if (updateData.quantity !== undefined || updateData.minStock !== undefined) {
        if (updatedItem.quantity === 0) {
          updatedItem.status = InventoryStatus.OUT_OF_STOCK;
        } else if (updatedItem.quantity < updatedItem.minStock) {
          updatedItem.status = InventoryStatus.LOW_STOCK;
        } else {
          updatedItem.status = InventoryStatus.IN_STOCK;
        }
      }

      this.inventory[itemIndex] = updatedItem;
      this.saveInventory(this.inventory);

      return ResponseUtil.updated('Inventory item updated successfully', updatedItem);
    } catch (error) {
      return ResponseUtil.serverError('Failed to update inventory item');
    }
  }

  /**
   * Delete inventory item
   * @param id Item ID
   * @returns Deletion confirmation
   */
  async delete(id: string) {
    try {
      const itemIndex = this.inventory.findIndex(i => i.id === id);
      
      if (itemIndex === -1) {
        return ResponseUtil.notFound('Inventory item', id);
      }

      // Remove item
      this.inventory.splice(itemIndex, 1);
      this.saveInventory(this.inventory);

      return ResponseUtil.deleted('Inventory item');
    } catch (error) {
      return ResponseUtil.serverError('Failed to delete inventory item');
    }
  }

  /**
   * Restock inventory item
   * @param id Item ID
   * @param restockData Restock data
   * @returns Updated item data
   */
  async restock(id: string, restockData: RestockRequest) {
    try {
      const itemIndex = this.inventory.findIndex(i => i.id === id);
      
      if (itemIndex === -1) {
        return ResponseUtil.notFound('Inventory item', id);
      }

      // Update quantity
      this.inventory[itemIndex].quantity += restockData.quantity;
      this.inventory[itemIndex].lastRestocked = new Date().toISOString();
      this.inventory[itemIndex].updatedAt = new Date().toISOString();

      // Update status
      const item = this.inventory[itemIndex];
      if (item.quantity === 0) {
        item.status = InventoryStatus.OUT_OF_STOCK;
      } else if (item.quantity < item.minStock) {
        item.status = InventoryStatus.LOW_STOCK;
      } else {
        item.status = InventoryStatus.IN_STOCK;
      }

      this.saveInventory(this.inventory);

      return ResponseUtil.updated('Item restocked successfully', item);
    } catch (error) {
      return ResponseUtil.serverError('Failed to restock item');
    }
  }

  /**
   * Use inventory item (decrease quantity)
   * @param id Item ID
   * @param quantity Quantity to use
   * @param notes Optional usage notes
   * @returns Updated item data
   */
  async useItem(id: string, quantity: number, notes?: string) {
    try {
      const itemIndex = this.inventory.findIndex(i => i.id === id);

      
      if (itemIndex === -1) {
        return ResponseUtil.notFound('Inventory item', id);
      }

      const item = this.inventory[itemIndex];

      // Check if enough quantity is available
      if (item.quantity < quantity) {
        return ResponseUtil.error(`Insufficient quantity. Available: ${item.quantity}, Requested: ${quantity}`);
      }

      // Update quantity
      this.inventory[itemIndex].quantity -= quantity;
      this.inventory[itemIndex].updatedAt = new Date().toISOString();

      // Update status
      if (item.quantity === 0) {
        item.status = InventoryStatus.OUT_OF_STOCK;
      } else if (item.quantity < item.minStock) {
        item.status = InventoryStatus.LOW_STOCK;
      } else {
        item.status = InventoryStatus.IN_STOCK;
      }

      this.saveInventory(this.inventory);

      return ResponseUtil.updated('Item used successfully', item);
    } catch (error) {
      return ResponseUtil.serverError('Failed to use item');
    }
  }

  /**
   * Get inventory statistics
   * @returns Inventory statistics
   */
  async getStats() {
    try {
      const totalItems = this.inventory.length;
      const inStockItems = this.inventory.filter(i => i.status === InventoryStatus.IN_STOCK).length;
      const lowStockItems = this.inventory.filter(i => i.status === InventoryStatus.LOW_STOCK).length;
      const outOfStockItems = this.inventory.filter(i => i.status === InventoryStatus.OUT_OF_STOCK).length;
      const discontinuedItems = 0; // Placeholder for discontinued items count

      // By category
      const byCategory: Record<string, number> = {};
      this.inventory.forEach(item => {
        byCategory[item.category] = (byCategory[item.category] || 0) + 1;
      });

      // By location
      const byLocation: Record<string, number> = {};
      this.inventory.forEach(item => {
        byLocation[item.location] = (byLocation[item.location] || 0) + 1;
      });

      // Total value (placeholder calculation)
      const totalValue = this.inventory.reduce((sum, item) => sum + (item.quantity * 10), 0); // Assuming $10 per unit

      const stats: InventoryStats = {
        total: totalItems,
        inStock: inStockItems,
        lowStock: lowStockItems,
        outOfStock: outOfStockItems,
        discontinued: discontinuedItems,
        byCategory,
        byLocation,
        totalValue
      };

      return ResponseUtil.success('Inventory statistics retrieved successfully', stats);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve inventory statistics');
    }
  }

  /**
   * Get low stock items
   * @returns Low stock items
   */
  async getLowStockItems() {
    try {
      const lowStockItems = this.inventory.filter(i => i.status === InventoryStatus.LOW_STOCK);
      
      return ResponseUtil.success('Low stock items retrieved successfully', lowStockItems);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve low stock items');
    }
  }

  /**
   * Get out of stock items
   * @returns Out of stock items
   */
  async getOutOfStockItems() {
    try {
      const outOfStockItems = this.inventory.filter(i => i.status === InventoryStatus.OUT_OF_STOCK);
      
      return ResponseUtil.success('Out of stock items retrieved successfully', outOfStockItems);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve out of stock items');
    }
  }

  /**
   * Get items by category
   * @param category Category name
   * @returns Category items
   */
  async findByCategory(category: string) {
    try {
      const items = this.inventory.filter(i => i.category === category);
      
      return ResponseUtil.success(`Items in category '${category}' retrieved successfully`, items);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve category items');
    }
  }

  /**
   * Get items by location
   * @param location Location name
   * @returns Location items
   */
  async findByLocation(location: string) {
    try {
      const items = this.inventory.filter(i => i.location === location);
      
      return ResponseUtil.success(`Items in location '${location}' retrieved successfully`, items);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve location items');
    }
  }

  /**
   * Search inventory items
   * @param query Search query
   * @returns Matching items
   */
  async search(query: string) {
    try {
      const searchTerm = query.toLowerCase();
      const matchingItems = this.inventory.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm) ||
        item.location.toLowerCase().includes(searchTerm)
      );

      return ResponseUtil.success('Search results retrieved successfully', matchingItems);
    } catch (error) {
      return ResponseUtil.serverError('Failed to search inventory');
    }
  }

  // ==================== AUDIT TRAIL PERSISTENCE & RETRIEVAL ====================

  private readonly auditFilePath = path.join(process.cwd(), 'data', 'inventory-audit.json');

  /**
   * Load audit logs from disk
   */
  private loadAuditLogs(): InventoryAudit[] {
    try {
      if (!fs.existsSync(this.auditFilePath)) {
        return [];
      }
      const raw = fs.readFileSync(this.auditFilePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Persist audit logs to disk
   */
  private saveAuditLogs(logs: InventoryAudit[]): void {
    try {
      fs.mkdirSync(path.dirname(this.auditFilePath), { recursive: true });
      fs.writeFileSync(this.auditFilePath, JSON.stringify(logs, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist inventory audit logs:', err);
    }
  }

  /**
   * Record a new audit log entry
   * @param entry Audit entry object
   */
  recordAuditEntry(entry: InventoryAudit): void {
    const logs = this.loadAuditLogs();
    logs.push(entry);
    this.saveAuditLogs(logs);
  }

  /**
   * Get audit trail for a specific inventory item
   * @param itemId Inventory item ID
   * @returns Audit trail history for the item
   */
  async getAuditTrail(itemId: string) {
    try {
      const logs = this.loadAuditLogs();
      const itemLogs = logs
        .filter(entry => entry.itemId === itemId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return ResponseUtil.success('Inventory audit trail retrieved successfully', itemLogs);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve inventory audit trail');
    }
  }

  /**
   * Helper method to get raw inventory item state
   * @param id Inventory item ID
   * @returns Inventory item or undefined
   */
  getRawItem(id: string): Inventory | undefined {
    return this.inventory.find(i => i.id === id);
  }
}

