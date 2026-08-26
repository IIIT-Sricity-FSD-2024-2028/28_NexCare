import { UsersService } from '../users/users.service';
import { BedsService } from '../beds/beds.service';
import { InventoryService } from '../inventory/inventory.service';
import { AmbulanceService } from '../ambulance/ambulance.service';
export declare class HospitalDetailsController {
    private readonly usersService;
    private readonly bedsService;
    private readonly inventoryService;
    private readonly ambulanceService;
    constructor(usersService: UsersService, bedsService: BedsService, inventoryService: InventoryService, ambulanceService: AmbulanceService);
    getDoctors(hospitalId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getBeds(hospitalId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getInventory(hospitalId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getAmbulances(hospitalId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
