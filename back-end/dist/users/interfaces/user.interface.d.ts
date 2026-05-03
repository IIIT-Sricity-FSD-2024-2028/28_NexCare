import { UserRole, UserStatus } from '../../common/interfaces/api-response.interface';
export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    password: string;
    patientId?: string;
    dept?: string;
    createdAt?: string;
    updatedAt?: string;
}
export interface CreateUserRequest {
    name: string;
    email: string;
    role: UserRole;
    password: string;
    patientId?: string;
    dept?: string;
}
export interface UpdateUserRequest {
    name?: string;
    email?: string;
    role?: UserRole;
    status?: UserStatus;
    password?: string;
    patientId?: string;
    dept?: string;
}
export interface UserStats {
    total: number;
    active: number;
    inactive: number;
    onLeave: number;
    byRole: Record<UserRole, number>;
}
