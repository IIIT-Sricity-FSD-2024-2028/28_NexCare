import { UserRole } from '../../common/interfaces/api-response.interface';
export declare class CreateUserDto {
    name: string;
    email: string;
    role: UserRole;
    password: string;
    patientId?: string;
    dept?: string;
}
