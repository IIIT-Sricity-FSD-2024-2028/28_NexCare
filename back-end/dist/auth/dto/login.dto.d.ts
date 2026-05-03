import { UserRole } from '../../common/interfaces/api-response.interface';
export declare class LoginDto {
    email: string;
    password: string;
    role?: UserRole;
}
