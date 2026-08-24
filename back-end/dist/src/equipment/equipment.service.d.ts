export interface Equipment {
    id: string;
    name: string;
    type: string;
    status: string;
    hospitalId: string;
}
export declare class EquipmentService {
    private equipment;
    findAll(hospitalId?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
