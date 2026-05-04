import { UserRole, UserStatus } from '../../common/interfaces/api-response.interface';

/**
 * Create User DTO - Simple data transfer object
 * Transfers user creation data between client and server
 */
export class CreateUserDto {
  name: string;
  email: string;
  role: UserRole;
  password: string;
  patientId?: string;
  dept?: string;
}
