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
      // Validate quantity is not negative
      if (itemData.quantity < 0) {
        return ResponseUtil.error('Quantity cannot be negative');
      }

      // Validate minStock is not negative
      if (itemData.minStock < 0) {
        return ResponseUtil.error('Minimum stock cannot be negative');
      }

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

      // Validate quantity is not negative if being updated
      if (updateData.quantity !== undefined && updateData.quantity < 0) {
        return ResponseUtil.error('Quantity cannot be negative');
      }

      // Validate minStock is not negative if being updated
      if (updateData.minStock !== undefined && updateData.minStock < 0) {
        return ResponseUtil.error('Minimum stock cannot be negative');
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
      const quantity = Number(restockData?.quantity);
      if (isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
        return ResponseUtil.error('Restock quantity must be a positive integer');
      }

      const itemIndex = this.inventory.findIndex(i => i.id === id);
      
      if (itemIndex === -1) {
        return ResponseUtil.notFound('Inventory item', id);
      }

      // Update quantity
      this.inventory[itemIndex].quantity += quantity;
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
      if (typeof quantity !== 'number' || isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
        return ResponseUtil.error('Quantity must be a positive integer');
      }

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

  // ==========================================
  // INVENTORY REQUIREMENT REQUESTS WORKFLOW
  // ==========================================
  private readonly requirementsFilePath = path.join(process.cwd(), 'data', 'inventory-requirements.json');

  private loadRequirements(): any[] {
    try {
      if (!fs.existsSync(this.requirementsFilePath)) {
        const initial = this.getInitialRequirements();
        this.saveRequirements(initial);
        return initial;
      }
      const raw = fs.readFileSync(this.requirementsFilePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return this.getInitialRequirements();
    }
  }

  private saveRequirements(reqs: any[]): void {
    try {
      fs.mkdirSync(path.dirname(this.requirementsFilePath), { recursive: true });
      fs.writeFileSync(this.requirementsFilePath, JSON.stringify(reqs, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist inventory requirements:', err);
    }
  }

  private getInitialRequirements(): any[] {
    return [
      {
        id: 'REQ-INV-101',
        hospitalId: 'H001',
        itemName: 'ECG Electrodes & Cables',
        category: 'Cardiology Supplies',
        currentQuantity: 15,
        requiredQuantity: 100,
        requestedQuantity: 85,
        unit: 'packs',
        department: 'Cardiology',
        requestedBy: 'Priya Reddy (Administrative Staff)',
        requestedById: 'U002',
        requestDate: '2026-08-28',
        priority: 'URGENT',
        reason: 'Cardiology ICU requires 85 additional electrode packs due to high patient intake',
        estimatedCost: 12500,
        status: 'PENDING',
        createdAt: '2026-08-28T09:30:00.000Z',
        updatedAt: '2026-08-28T09:30:00.000Z'
      },
      {
        id: 'REQ-INV-102',
        hospitalId: 'H001',
        itemName: 'Sterile Surgical Gloves (Size 7.5)',
        category: 'Surgical & PPE',
        currentQuantity: 200,
        requiredQuantity: 1000,
        requestedQuantity: 800,
        unit: 'pairs',
        department: 'Emergency & OT',
        requestedBy: 'Priya Reddy (Administrative Staff)',
        requestedById: 'U002',
        requestDate: '2026-08-29',
        priority: 'HIGH',
        reason: 'Weekly stock replenishment for general surgery and emergency OT suites',
        estimatedCost: 24000,
        status: 'PENDING',
        createdAt: '2026-08-29T11:15:00.000Z',
        updatedAt: '2026-08-29T11:15:00.000Z'
      },
      {
        id: 'REQ-INV-103',
        hospitalId: 'H001',
        itemName: 'IV Cannula 20G (Pink)',
        category: 'Medical Supplies',
        currentQuantity: 50,
        requiredQuantity: 300,
        requestedQuantity: 250,
        unit: 'units',
        department: 'General Medicine',
        requestedBy: 'Priya Reddy (Administrative Staff)',
        requestedById: 'U002',
        requestDate: '2026-08-25',
        priority: 'MEDIUM',
        reason: 'Inpatient ward buffer stock replenishment',
        estimatedCost: 7500,
        status: 'APPROVED',
        approvedBy: 'HM001',
        approvedByName: 'Srinivas Rao (Hospital Manager)',
        approvedAt: '2026-08-26T14:00:00.000Z',
        createdAt: '2026-08-25T10:00:00.000Z',
        updatedAt: '2026-08-26T14:00:00.000Z'
      },
      {
        id: 'REQ-INV-104',
        hospitalId: 'H002',
        itemName: 'N95 Respirator Masks',
        category: 'PPE',
        currentQuantity: 20,
        requiredQuantity: 500,
        requestedQuantity: 480,
        unit: 'units',
        department: 'Pulmonology',
        requestedBy: 'Lakshmi Menon (Administrative Staff)',
        requestedById: 'U020',
        requestDate: '2026-08-27',
        priority: 'HIGH',
        reason: 'Respiratory isolation ward stock replenishment',
        estimatedCost: 19200,
        status: 'PENDING',
        createdAt: '2026-08-27T08:45:00.000Z',
        updatedAt: '2026-08-27T08:45:00.000Z'
      }
    ];
  }

  /**
   * Find all inventory requirement requests with filtering
   */
  async findAllRequirements(hospitalId?: string, status?: string, priority?: string, department?: string) {
    try {
      let reqs = this.loadRequirements();

      if (hospitalId) {
        reqs = reqs.filter(r => r.hospitalId === hospitalId);
      }
      if (status && status !== 'ALL') {
        reqs = reqs.filter(r => r.status?.toUpperCase() === status.toUpperCase());
      }
      if (priority && priority !== 'ALL') {
        reqs = reqs.filter(r => r.priority?.toUpperCase() === priority.toUpperCase());
      }
      if (department && department !== 'ALL') {
        reqs = reqs.filter(r => r.department?.toLowerCase() === department.toLowerCase());
      }

      reqs.sort((a, b) => new Date(b.createdAt || b.requestDate).getTime() - new Date(a.createdAt || a.requestDate).getTime());

      return ResponseUtil.success('Inventory requirements retrieved successfully', reqs);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve inventory requirements');
    }
  }

  /**
   * Find a requirement by ID
   */
  async findRequirementById(id: string) {
    try {
      const reqs = this.loadRequirements();
      const item = reqs.find(r => r.id === id);
      if (!item) {
        return ResponseUtil.notFound('Inventory Requirement', id);
      }
      return ResponseUtil.success('Inventory requirement retrieved successfully', item);
    } catch (error) {
      return ResponseUtil.serverError('Failed to retrieve inventory requirement');
    }
  }

  /**
   * Create a new inventory requirement (Raised by Administrative Staff or Hospital Manager)
   */
  async createRequirement(data: any) {
    try {
      const reqs = this.loadRequirements();
      const newId = 'REQ-INV-' + (Math.floor(100 + Math.random() * 900));

      const newReq = {
        id: newId,
        hospitalId: data.hospitalId || 'H001',
        itemId: data.itemId,
        itemName: data.itemName,
        category: data.category || 'General Supplies',
        currentQuantity: Number(data.currentQuantity) || 0,
        requiredQuantity: Number(data.requiredQuantity) || Number(data.requestedQuantity) || 0,
        requestedQuantity: Number(data.requestedQuantity) || 1,
        unit: data.unit || 'units',
        department: data.department || 'General',
        requestedBy: data.requestedBy || 'Administrative Staff',
        requestedById: data.requestedById,
        requestDate: data.requestDate || new Date().toISOString().split('T')[0],
        priority: (data.priority || 'MEDIUM').toUpperCase(),
        reason: data.reason || 'General hospital replenishment',
        estimatedCost: Number(data.estimatedCost) || (Number(data.requestedQuantity || 1) * 150),
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      reqs.unshift(newReq);
      this.saveRequirements(reqs);

      return ResponseUtil.created('Inventory requirement submitted successfully', newReq);
    } catch (error) {
      return ResponseUtil.serverError('Failed to create inventory requirement');
    }
  }

  /**
   * Approve an inventory requirement (Hospital Manager action)
   */
  async approveRequirement(id: string, managerId: string, managerName: string, managerRemarks?: string) {
    try {
      const reqs = this.loadRequirements();
      const idx = reqs.findIndex(r => r.id === id);
      if (idx === -1) {
        return ResponseUtil.notFound('Inventory Requirement', id);
      }

      reqs[idx] = {
        ...reqs[idx],
        status: 'APPROVED',
        approvedBy: managerId,
        approvedByName: managerName,
        approvedAt: new Date().toISOString(),
        managerRemarks: managerRemarks || 'Approved by Hospital Manager',
        updatedAt: new Date().toISOString()
      };

      this.saveRequirements(reqs);

      return ResponseUtil.success('Inventory requirement approved successfully', reqs[idx]);
    } catch (error) {
      return ResponseUtil.serverError('Failed to approve inventory requirement');
    }
  }

  /**
   * Reject an inventory requirement (Hospital Manager action)
   */
  async rejectRequirement(id: string, managerId: string, managerName: string, rejectionReason: string) {
    try {
      const reqs = this.loadRequirements();
      const idx = reqs.findIndex(r => r.id === id);
      if (idx === -1) {
        return ResponseUtil.notFound('Inventory Requirement', id);
      }

      reqs[idx] = {
        ...reqs[idx],
        status: 'REJECTED',
        rejectedBy: managerId,
        rejectedByName: managerName,
        rejectedAt: new Date().toISOString(),
        rejectionReason: rejectionReason || 'Request rejected by Hospital Manager',
        updatedAt: new Date().toISOString()
      };

      this.saveRequirements(reqs);

      return ResponseUtil.success('Inventory requirement rejected successfully', reqs[idx]);
    } catch (error) {
      return ResponseUtil.serverError('Failed to reject inventory requirement');
    }
  }

  /**
   * Start Purchase for an approved requirement (Administrative Staff action)
   */
  async startPurchase(id: string, data: any, adminId: string, adminName: string) {
    try {
      const reqs = this.loadRequirements();
      const idx = reqs.findIndex(r => r.id === id);
      if (idx === -1) {
        return ResponseUtil.notFound('Inventory Requirement', id);
      }

      const req = reqs[idx];
      reqs[idx] = {
        ...req,
        status: 'PURCHASE_IN_PROGRESS',
        supplier: data.supplier || req.supplier || 'Standard Medical Supplies Ltd.',
        invoiceNumber: data.invoiceNumber || req.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
        purchaseDate: data.purchaseDate || new Date().toISOString().split('T')[0],
        quantityPurchased: Number(data.quantityPurchased) || Number(req.requestedQuantity) || 0,
        finalCost: Number(data.finalCost) || Number(req.estimatedCost) || 0,
        purchaseNotes: data.purchaseNotes || data.notes || req.purchaseNotes || '',
        purchasedBy: adminId,
        purchasedByName: adminName,
        updatedAt: new Date().toISOString()
      };

      this.saveRequirements(reqs);

      return ResponseUtil.success('Purchase initiated successfully', reqs[idx]);
    } catch (error) {
      return ResponseUtil.serverError('Failed to initiate purchase');
    }
  }

  /**
   * Mark item as purchased (Administrative Staff action)
   */
  async markPurchased(id: string, adminId: string, adminName: string) {
    try {
      const reqs = this.loadRequirements();
      const idx = reqs.findIndex(r => r.id === id);
      if (idx === -1) {
        return ResponseUtil.notFound('Inventory Requirement', id);
      }

      reqs[idx] = {
        ...reqs[idx],
        status: 'PURCHASED',
        purchasedAt: new Date().toISOString(),
        purchasedBy: adminId || reqs[idx].purchasedBy,
        purchasedByName: adminName || reqs[idx].purchasedByName,
        updatedAt: new Date().toISOString()
      };

      this.saveRequirements(reqs);

      return ResponseUtil.success('Requirement marked as purchased', reqs[idx]);
    } catch (error) {
      return ResponseUtil.serverError('Failed to mark requirement as purchased');
    }
  }

  /**
   * Mark restocked and update central inventory (Administrative Staff action)
   */
  async markRestocked(id: string, adminId: string, adminName: string) {
    try {
      const reqs = this.loadRequirements();
      const idx = reqs.findIndex(r => r.id === id);
      if (idx === -1) {
        return ResponseUtil.notFound('Inventory Requirement', id);
      }

      const req = reqs[idx];
      const qtyToAdd = Number(req.quantityPurchased) || Number(req.requestedQuantity) || 0;

      reqs[idx] = {
        ...req,
        status: 'RESTOCKED',
        restockedAt: new Date().toISOString(),
        restockedBy: adminId,
        restockedByName: adminName,
        fulfilledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.saveRequirements(reqs);

      // Auto-replenish central inventory stock
      let inventoryList = this.loadInventory();
      let matchedItem = inventoryList.find(i => (req.itemId && i.id === req.itemId) || i.name.toLowerCase() === req.itemName.toLowerCase());

      if (matchedItem) {
        const qtyBefore = matchedItem.quantity;
        matchedItem.quantity += qtyToAdd;
        matchedItem.lastRestocked = new Date().toISOString();
        if (matchedItem.quantity === 0) matchedItem.status = InventoryStatus.OUT_OF_STOCK;
        else if (matchedItem.quantity < matchedItem.minStock) matchedItem.status = InventoryStatus.LOW_STOCK;
        else matchedItem.status = InventoryStatus.IN_STOCK;
        
        this.saveInventory(inventoryList);
        this.inventory = inventoryList;

        // Log audit trail
        this.recordAuditEntry({
          id: 'AUD-' + Date.now(),
          itemId: matchedItem.id,
          action: 'restock',
          quantityBefore: qtyBefore,
          quantityAfter: matchedItem.quantity,
          userId: adminId || 'ADMIN',
          timestamp: new Date().toISOString(),
          notes: `Restocked via requirement ${req.id} (+${qtyToAdd} ${matchedItem.unit})`
        });
      } else {
        // Create new item in central inventory if it didn't exist
        const newItem: Inventory = {
          id: req.itemId || ('INV-' + String(inventoryList.length + 1).padStart(3, '0')),
          name: req.itemName,
          category: req.category || 'General Supplies',
          quantity: qtyToAdd,
          minStock: Math.max(10, Math.floor(qtyToAdd * 0.2)),
          unit: req.unit || 'units',
          location: req.department || 'Central Store',
          status: InventoryStatus.IN_STOCK,
          hospitalId: req.hospitalId,
          lastRestocked: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        inventoryList.push(newItem);
        this.saveInventory(inventoryList);
        this.inventory = inventoryList;
      }

      return ResponseUtil.success('Inventory requirement restocked and central stock increased', {
        requirement: reqs[idx],
        restockedQuantity: qtyToAdd
      });
    } catch (error) {
      return ResponseUtil.serverError('Failed to restock inventory requirement');
    }
  }

  /**
   * Alias for legacy fulfill
   */
  async fulfillRequirement(id: string) {
    return this.markRestocked(id, 'SYSTEM', 'System Administrator');
  }
}

