import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { RestockInventoryDto } from './dto/restock-inventory.dto';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    private scopeHospitalId;
    findAll(req: any, category?: string, status?: string, location?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    create(req: any, createInventoryDto: CreateInventoryDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getStats(req: any): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getLowStockItems(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getOutOfStockItems(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByCategory(category: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByLocation(location: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    search(query: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    update(id: string, updateInventoryDto: UpdateInventoryDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    patchUpdate(id: string, updateInventoryDto: UpdateInventoryDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    delete(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    restock(id: string, restockDto: RestockInventoryDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    useItem(id: string, quantity: number): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
