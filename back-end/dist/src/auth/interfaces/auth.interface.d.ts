import { UserRole } from '../../common/interfaces/api-response.interface';
export interface LoginRequest {
    email: string;
    password: string;
    role: UserRole;
}
export interface RegisterRequest {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    bloodGroup?: string;
    age?: number;
}
export interface AuthResponse {
    user: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
        status: string;
        patientId?: string;
        hospitalId?: string;
    };
    token?: string;
}
export interface UserSession {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: string;
    loginTime: string;
    patientId?: string;
    hospitalId?: string;
}
