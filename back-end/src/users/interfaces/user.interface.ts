import { UserRole, UserStatus } from '../../common/interfaces/api-response.interface';

/**
 * User Entity Interface
 * Represents a user in the NexCare system
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  password: string;
  patientId?: string; // For patient users
  dept?: string; // For doctor/nurse users
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create User Request Interface
 */
export interface CreateUserRequest {
  name: string;
  email: string;
  role: UserRole;
  password: string;
  patientId?: string;
  dept?: string;
}

/**
 * Update User Request Interface
 */
export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  password?: string;
  patientId?: string;
  dept?: string;
}

/**
 * User Statistics Interface
 */
export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  onLeave: number;
  byRole: Record<UserRole, number>;
}
