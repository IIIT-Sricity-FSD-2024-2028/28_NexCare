"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const inventory_service_1 = require("./inventory.service");
const create_inventory_dto_1 = require("./dto/create-inventory.dto");
const update_inventory_dto_1 = require("./dto/update-inventory.dto");
const restock_inventory_dto_1 = require("./dto/restock-inventory.dto");
const inventory_audit_interceptor_1 = require("./interceptors/inventory-audit.interceptor");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const api_response_interface_1 = require("../common/interfaces/api-response.interface");
let InventoryController = class InventoryController {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    async findAll(category, status, location) {
        return this.inventoryService.findAll(category, status, location);
    }
    async create(createInventoryDto) {
        return this.inventoryService.create(createInventoryDto);
    }
    async getStats() {
        return this.inventoryService.getStats();
    }
    async getLowStockItems() {
        return this.inventoryService.getLowStockItems();
    }
    async getOutOfStockItems() {
        return this.inventoryService.getOutOfStockItems();
    }
    async findByCategory(category) {
        return this.inventoryService.findByCategory(category);
    }
    async findByLocation(location) {
        return this.inventoryService.findByLocation(location);
    }
    async search(query) {
        return this.inventoryService.search(query);
    }
    async getAuditTrail(itemId) {
        return this.inventoryService.getAuditTrail(itemId);
    }
    async findById(id) {
        return this.inventoryService.findById(id);
    }
    async update(id, updateInventoryDto) {
        return this.inventoryService.update(id, updateInventoryDto);
    }
    async patchUpdate(id, updateInventoryDto) {
        return this.inventoryService.update(id, updateInventoryDto);
    }
    async delete(id) {
        return this.inventoryService.delete(id);
    }
    async restock(id, restockDto) {
        return this.inventoryService.restock(id, restockDto);
    }
    async useItem(id, body) {
        const quantity = typeof body === 'number' ? body : Number(body?.quantity);
        return this.inventoryService.useItem(id, quantity, body?.notes);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF, api_response_interface_1.UserRole.REGIONAL_MANAGER),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all inventory items' }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: api_response_interface_1.InventoryStatus }),
    (0, swagger_1.ApiQuery)({ name: 'location', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of inventory items' }),
    __param(0, (0, common_1.Query)('category')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('location')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new inventory item' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Item creation result (check success field)' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_inventory_dto_1.CreateInventoryDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    (0, swagger_1.ApiOperation)({ summary: 'Get inventory statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Inventory statistics retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('low-stock'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all low stock items' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of low stock items' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getLowStockItems", null);
__decorate([
    (0, common_1.Get)('out-of-stock'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all out of stock items' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of out of stock items' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getOutOfStockItems", null);
__decorate([
    (0, common_1.Get)('category/:category'),
    (0, swagger_1.ApiOperation)({ summary: 'Get items by category' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of items in category' }),
    __param(0, (0, common_1.Param)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "findByCategory", null);
__decorate([
    (0, common_1.Get)('location/:location'),
    (0, swagger_1.ApiOperation)({ summary: 'Get items by location' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of items at location' }),
    __param(0, (0, common_1.Param)('location')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "findByLocation", null);
__decorate([
    (0, common_1.Get)('search/:query'),
    (0, swagger_1.ApiOperation)({ summary: 'Search inventory items' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Search results' }),
    __param(0, (0, common_1.Param)('query')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('audit/:itemId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get inventory audit trail for an item' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Audit trail retrieved' }),
    __param(0, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getAuditTrail", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get inventory item by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Item details retrieved' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an inventory item' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Item updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_inventory_dto_1.UpdateInventoryDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Partially update an inventory item' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Item updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_inventory_dto_1.UpdateInventoryDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "patchUpdate", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an inventory item' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Item deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "delete", null);
__decorate([
    (0, common_1.Patch)(':id/restock'),
    (0, common_1.UseInterceptors)(inventory_audit_interceptor_1.InventoryAuditInterceptor),
    (0, swagger_1.ApiOperation)({ summary: 'Restock an inventory item' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Item restocked successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, restock_inventory_dto_1.RestockInventoryDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "restock", null);
__decorate([
    (0, common_1.Patch)(':id/use'),
    (0, common_1.UseInterceptors)(inventory_audit_interceptor_1.InventoryAuditInterceptor),
    (0, swagger_1.ApiOperation)({ summary: 'Consume/use an inventory item' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Item consumed successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "useItem", null);
exports.InventoryController = InventoryController = __decorate([
    (0, swagger_1.ApiTags)('Inventory'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, roles_decorator_1.Roles)(api_response_interface_1.UserRole.SUPERUSER, api_response_interface_1.UserRole.ADMINISTRATIVE_STAFF),
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map