import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: any): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    register(registerDto: RegisterDto): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    logout(userId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getCurrentUser(userId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getActiveSessions(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
