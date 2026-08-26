import { UserRole } from '../../common/interfaces/api-response.interface';

/**
 * Login Request Interface
 */
export interface LoginRequest {
  email: string;
  password: string;
  role: UserRole;
}

/**
 * Register Request Interface (for patient registration)
 */
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  bloodGroup?: string;
  age?: number;
}

/**
 * Authentication Response Interface
 */
export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: string;
    patientId?: string;
    hospitalId?: string;
  };
  token?: string; // Placeholder for future JWT implementation
}

/**
 * User Session Interface
 */
export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  loginTime: string;
  patientId?: string;
  hospitalId?: string;
}
