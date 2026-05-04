import { UserRole, UserStatus } from '../../common/interfaces/api-response.interface';

/**
 * Update User DTO - Simple data transfer object
 * Transfers user update data between client and server
 */
export class UpdateUserDto {
  name?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  password?: string;
  patientId?: string;
  dept?: string;
}
