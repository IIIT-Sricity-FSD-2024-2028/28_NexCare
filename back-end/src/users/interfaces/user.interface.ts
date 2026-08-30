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
  phone?: string;
  dob?: string;
  gender?: string;
  employeeId?: string;
  dept?: string;
  designation?: string;
  joiningDate?: string;
  employmentType?: string;
  hospitalId?: string;
  hospitalName?: string;
  // Doctor clinical directory fields
  specialization?: string;
  medicalRegNumber?: string;
  qualification?: string;
  experienceYears?: number | string;
  consultationTiming?: string;
  // Ambulance staff fields
  driverLicense?: string;
  assignedVehicle?: string;
  shift?: string;
  // Administrative staff fields
  responsibilities?: string[] | string;
  // Patient fields
  patientId?: string;
  city?: string;
  state?: string;
  pincode?: string;
  // Regional manager fields
  areas?: string[];
  mustChangePassword?: boolean;
  regionId?: string;
  address?: string;
  consultationFee?: number | string;
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
  password?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  employeeId?: string;
  dept?: string;
  designation?: string;
  joiningDate?: string;
  employmentType?: string;
  hospitalId?: string;
  hospitalName?: string;
  specialization?: string;
  medicalRegNumber?: string;
  qualification?: string;
  experienceYears?: number | string;
  consultationTiming?: string;
  driverLicense?: string;
  assignedVehicle?: string;
  shift?: string;
  responsibilities?: string[] | string;
  patientId?: string;
  areas?: string[];
  mustChangePassword?: boolean;
  regionId?: string;
  address?: string;
  consultationFee?: number | string;
  status?: UserStatus;
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
  phone?: string;
  dob?: string;
  gender?: string;
  employeeId?: string;
  dept?: string;
  designation?: string;
  joiningDate?: string;
  employmentType?: string;
  hospitalId?: string;
  hospitalName?: string;
  specialization?: string;
  medicalRegNumber?: string;
  qualification?: string;
  experienceYears?: number | string;
  consultationTiming?: string;
  driverLicense?: string;
  assignedVehicle?: string;
  shift?: string;
  responsibilities?: string[] | string;
  patientId?: string;
  areas?: string[];
  mustChangePassword?: boolean;
  regionId?: string;
  address?: string;
  consultationFee?: number | string;
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
