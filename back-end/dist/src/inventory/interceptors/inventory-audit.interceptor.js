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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryAuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const inventory_service_1 = require("../inventory.service");
const id_generator_util_1 = require("../../common/utils/id-generator.util");
let InventoryAuditInterceptor = class InventoryAuditInterceptor {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    intercept(context, next) {
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest();
        const response = httpContext.getResponse();
        const itemId = request.params?.id;
        const itemBefore = itemId ? this.inventoryService.getRawItem(itemId) : undefined;
        const quantityBefore = itemBefore ? itemBefore.quantity : 0;
        const statusBefore = itemBefore?.status;
        const url = request.url || request.originalUrl || '';
        const action = url.includes('/use') ? 'use' : 'restock';
        const userId = request.user?.id ||
            request.user?.email ||
            request.body?.restockedBy ||
            'ADMIN';
        const auditId = id_generator_util_1.IdGenerator.generateAuditId();
        if (response && typeof response.setHeader === 'function') {
            response.setHeader('x-audit-id', auditId);
            response.setHeader('Access-Control-Expose-Headers', 'x-audit-id');
        }
        else if (response && typeof response.header === 'function') {
            response.header('x-audit-id', auditId);
            response.header('Access-Control-Expose-Headers', 'x-audit-id');
        }
        return next.handle().pipe((0, operators_1.tap)((resData) => {
            if (!resData || resData.success === false || !itemId || !itemBefore) {
                return;
            }
            const afterItem = resData?.data || this.inventoryService.getRawItem(itemId);
            if (!afterItem || typeof afterItem.quantity !== 'number') {
                return;
            }
            const quantityAfter = afterItem.quantity;
            const statusAfter = afterItem.status || statusBefore;
            const auditEntry = {
                id: auditId,
                itemId,
                action,
                quantityBefore,
                quantityAfter,
                statusBefore,
                statusAfter,
                userId,
                timestamp: new Date().toISOString(),
                notes: request.body?.notes || undefined,
            };
            this.inventoryService.recordAuditEntry(auditEntry);
        }));
    }
};
exports.InventoryAuditInterceptor = InventoryAuditInterceptor;
exports.InventoryAuditInterceptor = InventoryAuditInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryAuditInterceptor);
//# sourceMappingURL=inventory-audit.interceptor.js.map