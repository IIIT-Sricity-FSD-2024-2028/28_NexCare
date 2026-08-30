import { CreateUserRequest, UpdateUserRequest, RMWorkload, RMSuggestion } from './interfaces/user.interface';
import { UserRole, UserStatus } from '../common/interfaces/api-response.interface';
export declare class UsersService {
    private readonly usersFilePath;
    private readonly hospitalsFilePath;
    private get users();
    private set users(value);
    private get hospitals();
    findAll(role?: UserRole, status?: UserStatus): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findById(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    create(userData: CreateUserRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    update(id: string, updateData: UpdateUserRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    delete(id: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getStats(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    findByRole(role: UserRole): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    updateStatus(id: string, status: UserStatus): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    search(query: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getRegionalManagersByCity(city: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getRMWorkload(managerId: string): Promise<RMWorkload>;
    suggestRMForHospital(hospitalCity: string): Promise<RMSuggestion[]>;
    getAllRMWorkloads(): Promise<RMWorkload[]>;
}
