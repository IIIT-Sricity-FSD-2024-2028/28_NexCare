export interface Department {
    id: string;
    name: string;
    hospitalId: string;
}
export declare class DepartmentsService {
    private departments;
    findAll(hospitalId?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
