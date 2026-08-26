export interface Equipment {
    id: string;
    name: string;
    type: string;
    status: string;
    hospitalId: string;
}
export declare class EquipmentService {
    private readonly store;
    private static seed;
    findAll(hospitalId?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
