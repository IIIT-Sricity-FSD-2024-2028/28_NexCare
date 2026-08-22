import { WardsService } from './wards.service';
export declare class WardsController {
    private readonly wardsService;
    constructor(wardsService: WardsService);
    findAll(req: any, hospitalId?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
