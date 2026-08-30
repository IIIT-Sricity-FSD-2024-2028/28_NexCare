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
  hospitalId?: string; // For hospital managers - their assigned hospital
  city?: string; // For regional managers and patients
  state?: string; // For regional managers and patients
  pincode?: string; // For regional managers and patients
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
  hospitalId?: string; // For hospital managers
  city?: string; // For regional managers and patients
  state?: string; // For regional managers and patients
  pincode?: string; // For regional managers and patients
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
  hospitalId?: string; // For hospital managers
  city?: string; // For regional managers and patients
  state?: string; // For regional managers and patients
  pincode?: string; // For regional managers and patients
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

/**
 * Regional Manager Workload Interface
 */
export interface RMWorkload {
  regionalManagerId: string;
  regionalManagerName: string;
  regionalManagerEmail: string;
  city: string; // RM's assigned city
  state?: string;
  totalHospitals: number;
  pendingVerifications: number;
  verifiedHospitals: number;
  rejectedHospitals: number;
  activeHospitals: number;
  workloadLevel: 'low' | 'medium' | 'high';
  lastActivity?: string;
}

/**
 * RM Suggestion Interface
 */
export interface RMSuggestion {
  regionalManagerId: string;
  regionalManagerName: string;
  regionalManagerEmail: string;
  city: string; // RM's assigned city
  state?: string;
  currentWorkload: number;
  workloadLevel: 'low' | 'medium' | 'high';
  recommendation: string;
  reason: string;
}
