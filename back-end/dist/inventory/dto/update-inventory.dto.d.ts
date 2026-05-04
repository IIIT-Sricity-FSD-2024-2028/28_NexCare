import { InventoryStatus } from '../../common/interfaces/api-response.interface';
export declare class UpdateInventoryDto {
    name?: string;
    category?: string;
    quantity?: number;
    minStock?: number;
    unit?: string;
    location?: string;
    status?: InventoryStatus;
}
