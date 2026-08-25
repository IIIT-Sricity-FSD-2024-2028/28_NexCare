import { CreateInventoryRequest, UpdateInventoryRequest, RestockRequest } from './interfaces/inventory.interface';
import { InventoryStatus } from '../common/interfaces/api-response.interface';
export declare class InventoryService {
    private readonly store;
    private static seed;
    private computeStatus;
    findAll(category?: string, status?: InventoryStatus, location?: string, hospitalId?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    create(itemData: CreateInventoryRequest & {
        hospitalId?: string;
    }): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    update(id: string, updateData: UpdateInventoryRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    delete(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    restock(id: string, restockData: RestockRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    useItem(id: string, quantity: number): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getStats(hospitalId?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getLowStockItems(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getOutOfStockItems(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByCategory(category: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByLocation(location: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    search(query: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
