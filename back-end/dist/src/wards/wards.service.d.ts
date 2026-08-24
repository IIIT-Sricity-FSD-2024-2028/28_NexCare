export interface Ward {
    id: string;
    name: string;
    hospitalId: string;
}
export declare class WardsService {
    private wards;
    findAll(hospitalId?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
