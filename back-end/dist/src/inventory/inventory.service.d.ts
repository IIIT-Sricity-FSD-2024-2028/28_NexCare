import { Inventory, CreateInventoryRequest, UpdateInventoryRequest, RestockRequest, InventoryAudit } from './interfaces/inventory.interface';
import { InventoryStatus } from '../common/interfaces/api-response.interface';
export declare class InventoryService {
    private readonly inventoryFilePath;
    private inventory;
    constructor();
    private loadInventory;
    private saveInventory;
    private getInitialMockData;
    findAll(category?: string, status?: InventoryStatus, location?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    create(itemData: CreateInventoryRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    update(id: string, updateData: UpdateInventoryRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    delete(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    restock(id: string, restockData: RestockRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    useItem(id: string, quantity: number, notes?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getStats(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getLowStockItems(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getOutOfStockItems(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByCategory(category: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByLocation(location: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    search(query: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    private readonly auditFilePath;
    private loadAuditLogs;
    private saveAuditLogs;
    recordAuditEntry(entry: InventoryAudit): void;
    getAuditTrail(itemId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getRawItem(id: string): Inventory | undefined;
}
