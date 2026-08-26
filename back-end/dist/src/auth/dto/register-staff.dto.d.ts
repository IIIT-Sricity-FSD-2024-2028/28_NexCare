import { UserRole } from '../../common/interfaces/api-response.interface';
export declare class RegisterStaffDto {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    role: UserRole;
    hospitalId: string;
    dept?: string;
}
