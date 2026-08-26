"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var InventoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const response_util_1 = require("../common/utils/response.util");
const id_generator_util_1 = require("../common/utils/id-generator.util");
const file_store_util_1 = require("../common/utils/file-store.util");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
let InventoryService = InventoryService_1 = class InventoryService {
    constructor() {
        this.store = new file_store_util_1.FileStore('inventory.json', () => InventoryService_1.seed());
    }
    static seed() {
        return [
            { id: 'INV-001', name: 'Paracetamol', category: 'Medication', quantity: 500, minStock: 100, unit: 'tablets', location: 'Pharmacy', status: api_response_interface_1.InventoryStatus.IN_STOCK, lastRestocked: '2026-03-15T00:00:00Z', createdAt: '2026-01-01T00:00:00Z', hospitalId: 'H001' },
            { id: 'INV-002', name: 'Surgical Gloves', category: 'Medical Supplies', quantity: 2000, minStock: 500, unit: 'pairs', location: 'ER', status: api_response_interface_1.InventoryStatus.IN_STOCK, lastRestocked: '2026-03-20T00:00:00Z', createdAt: '2026-01-01T00:00:00Z', hospitalId: 'H001' },
            { id: 'INV-003', name: 'IV Catheters', category: 'Medical Supplies', quantity: 150, minStock: 200, unit: 'units', location: 'ER', status: api_response_interface_1.InventoryStatus.LOW_STOCK, lastRestocked: '2026-02-10T00:00:00Z', createdAt: '2026-01-01T00:00:00Z', hospitalId: 'H001' },
            { id: 'INV-004', name: 'Face Masks', category: 'PPE', quantity: 0, minStock: 1000, unit: 'units', location: 'Reception', status: api_response_interface_1.InventoryStatus.OUT_OF_STOCK, lastRestocked: '2026-01-15T00:00:00Z', createdAt: '2026-01-01T00:00:00Z', hospitalId: 'H001' },
            { id: 'INV-005', name: 'Bandages', category: 'Medical Supplies', quantity: 800, minStock: 300, unit: 'rolls', location: 'ER', status: api_response_interface_1.InventoryStatus.IN_STOCK, lastRestocked: '2026-03-25T00:00:00Z', createdAt: '2026-01-01T00:00:00Z', hospitalId: 'H001' },
            { id: 'INV-006', name: 'Syringes 5ml', category: 'Medical Supplies', quantity: 3000, minStock: 1000, unit: 'units', location: 'Pharmacy', status: api_response_interface_1.InventoryStatus.IN_STOCK, lastRestocked: '2026-03-22T00:00:00Z', createdAt: '2026-01-01T00:00:00Z', hospitalId: 'H001' },
            { id: 'INV-007', name: 'Antiseptic Solution', category: 'Medication', quantity: 50, minStock: 75, unit: 'bottles', location: 'ER', status: api_response_interface_1.InventoryStatus.LOW_STOCK, lastRestocked: '2026-02-28T00:00:00Z', createdAt: '2026-01-01T00:00:00Z', hospitalId: 'H001' },
            { id: 'INV-008', name: 'Thermometer', category: 'Equipment', quantity: 25, minStock: 10, unit: 'units', location: 'ER', status: api_response_interface_1.InventoryStatus.IN_STOCK, lastRestocked: '2026-01-10T00:00:00Z', createdAt: '2026-01-01T00:00:00Z', hospitalId: 'H001' },
            { id: 'INV-009', name: 'Blood Pressure Monitor', category: 'Equipment', quantity: 8, minStock: 5, unit: 'units', location: 'ER', status: api_response_interface_1.InventoryStatus.IN_STOCK, lastRestocked: '2026-01-05T00:00:00Z', createdAt: '2026-01-01T00:00:00Z', hospitalId: 'H001' },
            { id: 'INV-010', name: 'Stethoscope', category: 'Equipment', quantity: 15, minStock: 10, unit: 'units', location: 'General', status: api_response_interface_1.InventoryStatus.IN_STOCK, lastRestocked: '2026-02-15T00:00:00Z', createdAt: '2026-01-01T00:00:00Z', hospitalId: 'H001' },
        ];
    }
    computeStatus(item) {
        if (item.quantity === 0)
            return api_response_interface_1.InventoryStatus.OUT_OF_STOCK;
        if (item.quantity < item.minStock)
            return api_response_interface_1.InventoryStatus.LOW_STOCK;
        return api_response_interface_1.InventoryStatus.IN_STOCK;
    }
    async findAll(category, status, location, hospitalId) {
        try {
            let filteredInventory = [...this.store.load()];
            if (hospitalId)
                filteredInventory = filteredInventory.filter(item => item.hospitalId === hospitalId);
            if (category)
                filteredInventory = filteredInventory.filter(item => item.category === category);
            if (status)
                filteredInventory = filteredInventory.filter(item => item.status === status);
            if (location)
                filteredInventory = filteredInventory.filter(item => item.location === location);
            return response_util_1.ResponseUtil.success('Inventory retrieved successfully', filteredInventory);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve inventory');
        }
    }
    async findById(id) {
        try {
            const item = this.store.load().find(i => i.id === id);
            if (!item)
                return response_util_1.ResponseUtil.notFound('Inventory item', id);
            return response_util_1.ResponseUtil.success('Inventory item retrieved successfully', item);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve inventory item');
        }
    }
    async create(itemData) {
        try {
            const inventory = this.store.load();
            const newItem = {
                id: id_generator_util_1.IdGenerator.generateInventoryId(),
                name: itemData.name,
                category: itemData.category,
                quantity: itemData.quantity,
                minStock: itemData.minStock,
                unit: itemData.unit,
                location: itemData.location,
                status: this.computeStatus(itemData),
                lastRestocked: new Date().toISOString(),
                hospitalId: itemData.hospitalId || 'H001',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            inventory.push(newItem);
            this.store.save(inventory);
            return response_util_1.ResponseUtil.created('Inventory item created successfully', newItem);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to create inventory item');
        }
    }
    async update(id, updateData) {
        try {
            const inventory = this.store.load();
            const itemIndex = inventory.findIndex(i => i.id === id);
            if (itemIndex === -1)
                return response_util_1.ResponseUtil.notFound('Inventory item', id);
            const updatedItem = { ...inventory[itemIndex], ...updateData, updatedAt: new Date().toISOString() };
            if (updateData.quantity !== undefined || updateData.minStock !== undefined) {
                updatedItem.status = this.computeStatus(updatedItem);
            }
            inventory[itemIndex] = updatedItem;
            this.store.save(inventory);
            return response_util_1.ResponseUtil.updated('Inventory item updated successfully', updatedItem);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to update inventory item');
        }
    }
    async delete(id) {
        try {
            const inventory = this.store.load();
            const itemIndex = inventory.findIndex(i => i.id === id);
            if (itemIndex === -1)
                return response_util_1.ResponseUtil.notFound('Inventory item', id);
            inventory.splice(itemIndex, 1);
            this.store.save(inventory);
            return response_util_1.ResponseUtil.deleted('Inventory item');
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to delete inventory item');
        }
    }
    async restock(id, restockData) {
        try {
            const inventory = this.store.load();
            const itemIndex = inventory.findIndex(i => i.id === id);
            if (itemIndex === -1)
                return response_util_1.ResponseUtil.notFound('Inventory item', id);
            const item = inventory[itemIndex];
            item.quantity += restockData.quantity;
            item.lastRestocked = new Date().toISOString();
            item.updatedAt = new Date().toISOString();
            item.status = this.computeStatus(item);
            this.store.save(inventory);
            return response_util_1.ResponseUtil.updated('Item restocked successfully', item);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to restock item');
        }
    }
    async useItem(id, quantity) {
        try {
            const inventory = this.store.load();
            const itemIndex = inventory.findIndex(i => i.id === id);
            if (itemIndex === -1)
                return response_util_1.ResponseUtil.notFound('Inventory item', id);
            const item = inventory[itemIndex];
            if (item.quantity < quantity) {
                return response_util_1.ResponseUtil.error(`Insufficient quantity. Available: ${item.quantity}, Requested: ${quantity}`);
            }
            item.quantity -= quantity;
            item.updatedAt = new Date().toISOString();
            item.status = this.computeStatus(item);
            this.store.save(inventory);
            return response_util_1.ResponseUtil.updated('Item used successfully', item);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to use item');
        }
    }
    async getStats(hospitalId) {
        try {
            let inventory = this.store.load();
            if (hospitalId)
                inventory = inventory.filter(i => i.hospitalId === hospitalId);
            const totalItems = inventory.length;
            const inStockItems = inventory.filter(i => i.status === api_response_interface_1.InventoryStatus.IN_STOCK).length;
            const lowStockItems = inventory.filter(i => i.status === api_response_interface_1.InventoryStatus.LOW_STOCK).length;
            const outOfStockItems = inventory.filter(i => i.status === api_response_interface_1.InventoryStatus.OUT_OF_STOCK).length;
            const byCategory = {};
            inventory.forEach(item => { byCategory[item.category] = (byCategory[item.category] || 0) + 1; });
            const byLocation = {};
            inventory.forEach(item => { byLocation[item.location] = (byLocation[item.location] || 0) + 1; });
            const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * 10), 0);
            const stats = {
                total: totalItems,
                inStock: inStockItems,
                lowStock: lowStockItems,
                outOfStock: outOfStockItems,
                discontinued: 0,
                byCategory,
                byLocation,
                totalValue,
            };
            return response_util_1.ResponseUtil.success('Inventory statistics retrieved successfully', stats);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve inventory statistics');
        }
    }
    async getLowStockItems() {
        try {
            const lowStockItems = this.store.load().filter(i => i.status === api_response_interface_1.InventoryStatus.LOW_STOCK);
            return response_util_1.ResponseUtil.success('Low stock items retrieved successfully', lowStockItems);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve low stock items');
        }
    }
    async getOutOfStockItems() {
        try {
            const outOfStockItems = this.store.load().filter(i => i.status === api_response_interface_1.InventoryStatus.OUT_OF_STOCK);
            return response_util_1.ResponseUtil.success('Out of stock items retrieved successfully', outOfStockItems);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve out of stock items');
        }
    }
    async findByCategory(category) {
        try {
            const items = this.store.load().filter(i => i.category === category);
            return response_util_1.ResponseUtil.success(`Items in category '${category}' retrieved successfully`, items);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve category items');
        }
    }
    async findByLocation(location) {
        try {
            const items = this.store.load().filter(i => i.location === location);
            return response_util_1.ResponseUtil.success(`Items in location '${location}' retrieved successfully`, items);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to retrieve location items');
        }
    }
    async search(query) {
        try {
            const searchTerm = query.toLowerCase();
            const matchingItems = this.store.load().filter(item => item.name.toLowerCase().includes(searchTerm) ||
                item.category.toLowerCase().includes(searchTerm) ||
                item.location.toLowerCase().includes(searchTerm));
            return response_util_1.ResponseUtil.success('Search results retrieved successfully', matchingItems);
        }
        catch (error) {
            return response_util_1.ResponseUtil.serverError('Failed to search inventory');
        }
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = InventoryService_1 = __decorate([
    (0, common_1.Injectable)()
], InventoryService);
//# sourceMappingURL=inventory.service.js.map