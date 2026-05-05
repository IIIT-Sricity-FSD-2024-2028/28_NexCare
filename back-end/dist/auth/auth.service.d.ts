import { LoginRequest, RegisterRequest } from './interfaces/auth.interface';
export declare class AuthService {
    private readonly usersFilePath;
    private readonly jwtSecret;
    private readonly jwtExpiresInSeconds;
    private sessions;
    private loadUsers;
    private saveUsers;
    private b64url;
    private generateToken;
    verifyToken(token: string): Record<string, any> | null;
    login(loginRequest: LoginRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    register(registerRequest: RegisterRequest): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    logout(userId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getCurrentUser(userId: string): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
    getActiveSessions(): Promise<import("../common/interfaces/api-response.interface").ApiResponse<any>>;
}
