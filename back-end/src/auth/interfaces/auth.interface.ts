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
  city?: string;
  state?: string;
  pincode?: string;
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
    // Optional profile fields the login response copies across when the user
    // record has them. They were being assigned without being declared here,
    // which broke `npm run build` with ten TS2339 errors — the object literal
    // was cast `as any` so construction passed, but the later property
    // assignments still type-checked against this interface.
    mustChangePassword?: boolean;
    phone?: string;
    employeeId?: string;
    areas?: string[];
    area?: string;
    regionName?: string;
    regionId?: string;
    designation?: string;
    hospitalName?: string;
    responsibilities?: string[] | string;
    gender?: string;
  };
  token?: string; // Placeholder for future JWT implementation
  csrfToken?: string; // CSRF token for post-authentication requests
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
