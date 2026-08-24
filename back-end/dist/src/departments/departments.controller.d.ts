import { DepartmentsService } from './departments.service';
export declare class DepartmentsController {
    private readonly departmentsService;
    constructor(departmentsService: DepartmentsService);
    findAll(req: any, hospitalId?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
