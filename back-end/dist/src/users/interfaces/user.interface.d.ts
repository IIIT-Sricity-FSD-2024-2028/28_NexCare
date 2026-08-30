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
    hospitalId?: string;
    city?: string;
    state?: string;
    pincode?: string;
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
    hospitalId?: string;
    city?: string;
    state?: string;
    pincode?: string;
}
export interface UpdateUserRequest {
    name?: string;
    email?: string;
    role?: UserRole;
    status?: UserStatus;
    password?: string;
    patientId?: string;
    dept?: string;
    hospitalId?: string;
    city?: string;
    state?: string;
    pincode?: string;
}
export interface UserStats {
    total: number;
    active: number;
    inactive: number;
    onLeave: number;
    byRole: Record<UserRole, number>;
}
export interface RMWorkload {
    regionalManagerId: string;
    regionalManagerName: string;
    regionalManagerEmail: string;
    city: string;
    state?: string;
    totalHospitals: number;
    pendingVerifications: number;
    verifiedHospitals: number;
    rejectedHospitals: number;
    activeHospitals: number;
    workloadLevel: 'low' | 'medium' | 'high';
    lastActivity?: string;
}
export interface RMSuggestion {
    regionalManagerId: string;
    regionalManagerName: string;
    regionalManagerEmail: string;
    city: string;
    state?: string;
    currentWorkload: number;
    workloadLevel: 'low' | 'medium' | 'high';
    recommendation: string;
    reason: string;
}
