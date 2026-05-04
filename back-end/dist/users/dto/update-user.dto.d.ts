import { UserRole, UserStatus } from '../../common/interfaces/api-response.interface';
export declare class UpdateUserDto {
    name?: string;
    email?: string;
    role?: UserRole;
    status?: UserStatus;
    password?: string;
    patientId?: string;
    dept?: string;
}
