import { UserRole } from '../../common/interfaces/api-response.interface';

/**
 * Login DTO - Simple data transfer object
 * Transfers login credentials between client and server
 */
export class LoginDto {
  email: string;
  password: string;
  role: UserRole;
}
