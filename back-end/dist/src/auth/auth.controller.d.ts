import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterStaffDto } from './dto/register-staff.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    register(registerDto: RegisterDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    registerStaff(registerStaffDto: RegisterStaffDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    logout(req: any, userId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getCurrentUser(req: any, userId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getActiveSessions(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    changePassword(req: any, body: {
        currentPassword: string;
        newPassword: string;
    }): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
