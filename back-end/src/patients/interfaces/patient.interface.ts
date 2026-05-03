/**
 * Patient Entity Interface
 * Represents a patient in the NexCare system
 */
export interface Patient {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  patientIdDisplay: string;
  memberSince: string;
  status: string;
  bloodGroup: string;
  age: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Patient Request Interface
 */
export interface CreatePatientRequest {
  fullName: string;
  phone: string;
  email: string;
  bloodGroup?: string;
  age?: number;
}

/**
 * Update Patient Request Interface
 */
export interface UpdatePatientRequest {
  fullName?: string;
  phone?: string;
  email?: string;
  status?: string;
  bloodGroup?: string;
  age?: number;
}

/**
 * Patient Statistics Interface
 */
export interface PatientStats {
  total: number;
  active: number;
  critical: number;
  averageAge: number;
  bloodGroupDistribution: Record<string, number>;
}
