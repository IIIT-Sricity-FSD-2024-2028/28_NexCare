import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
export declare class PatientsController {
    private readonly patientsService;
    constructor(patientsService: PatientsService);
    findAll(status?: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    create(createPatientDto: CreatePatientDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getStats(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    search(query: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByBloodGroup(bloodGroup: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByAgeRange(minAge: number, maxAge: number): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    update(id: string, updatePatientDto: UpdatePatientDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    patchUpdate(id: string, updatePatientDto: UpdatePatientDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    delete(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    updateStatus(id: string, status: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
