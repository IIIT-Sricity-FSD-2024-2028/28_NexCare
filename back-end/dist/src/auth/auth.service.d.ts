import { LoginRequest, RegisterRequest } from './interfaces/auth.interface';
import { UserRole } from '../common/interfaces/api-response.interface';
import { SystemService } from '../system/system.service';
import { PatientsService } from '../patients/patients.service';
export declare class AuthService {
    private readonly systemService;
    private readonly patientsService;
    constructor(systemService: SystemService, patientsService: PatientsService);
    private readonly usersFilePath;
    private readonly jwtSecret;
    private readonly jwtExpiresInSeconds;
    private sessions;
    private loadUsers;
    private saveUsers;
    private hashPassword;
    private isHashed;
    private verifyPassword;
    private b64url;
    private generateToken;
    verifyToken(token: string): Record<string, any> | null;
    login(loginRequest: LoginRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    register(registerRequest: RegisterRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    registerStaff(data: {
        fullName: string;
        email: string;
        password: string;
        phone: string;
        role: UserRole;
        hospitalId: string;
        dept?: string;
    }): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    logout(userId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getCurrentUser(userId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getActiveSessions(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    changePassword(data: {
        currentPassword: string;
        newPassword: string;
        userId?: string;
    }): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
