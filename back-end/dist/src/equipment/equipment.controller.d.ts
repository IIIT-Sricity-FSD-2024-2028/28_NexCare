import { EquipmentService } from './equipment.service';
export declare class EquipmentController {
    private readonly equipmentService;
    constructor(equipmentService: EquipmentService);
    findAll(req: any, hospitalId?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
