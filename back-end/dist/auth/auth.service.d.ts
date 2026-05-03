import { LoginRequest, RegisterRequest, UserSession } from './interfaces/auth.interface';
export declare class AuthService {
    private users;
    private sessions;
    login(loginRequest: LoginRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    register(registerRequest: RegisterRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    logout(userId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getCurrentUser(userId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    private generateToken;
    validateToken(token: string): Promise<UserSession | null>;
    getActiveSessions(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
