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
  dept?: string; // Department within the hospital (e.g. Front Desk, Cardiology)
  hospitalId?: string; // For any user scoped to a single hospital
  /** Local hospital areas/cities a regional manager may review. */
  areas?: string[];
  city?: string; // For patients
  state?: string; // For patients
  pincode?: string; // For patients
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
  hospitalId?: string;
  areas?: string[];
  city?: string; // For patients
  state?: string; // For patients
  pincode?: string; // For patients
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
  hospitalId?: string;
  areas?: string[];
  city?: string; // For patients
  state?: string; // For patients
  pincode?: string; // For patients
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
  areas?: string[]; // RM's assigned areas/cities
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
  areas?: string[]; // RM's assigned areas/cities
  currentWorkload: number;
  workloadLevel: 'low' | 'medium' | 'high';
  recommendation: string;
  reason: string;
}
