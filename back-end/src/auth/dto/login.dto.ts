import { UserRole } from '../../common/interfaces/api-response.interface';

/**
 * Login DTO - Placeholder for validation decorators
 * Teammates will add class-validator decorators here
 */
export class LoginDto {
  email: string;
  password: string;
  role?: UserRole;
}
