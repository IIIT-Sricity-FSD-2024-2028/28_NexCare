export interface Ward {
    id: string;
    name: string;
    hospitalId: string;
}
export declare class WardsService {
    private readonly store;
    private static seed;
    findAll(hospitalId?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
