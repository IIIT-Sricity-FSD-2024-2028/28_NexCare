/**
 * Patient Entity Interface
 * Represents a patient in the NexCare system
 */
export interface InsuranceDetails {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  verifiedAt?: string;
  verificationStatus?: 'mock_verified' | 'pending' | 'real_verified';
}

export interface Patient {
  id: string;
  patientId?: string;
  fullName: string;
  phone: string;
  email: string;
  patientIdDisplay: string;
  memberSince: string;
  status: string;
  bloodGroup: string;
  age: number;
  // Location the patient registered with — drives the nearby-hospital filter.
  city?: string;
  state?: string;
  pincode?: string;
  insurance?: InsuranceDetails;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Patient Request Interface
 */
export interface CreatePatientRequest {
  /**
   * Optional caller-supplied id. Registration passes the same id it stored on the
   * user account so `user.patientId` and `patient.id` stay in step — without it
   * each side generates its own and the portal cannot find the patient.
   */
  id?: string;
  fullName: string;
  phone: string;
  email: string;
  bloodGroup?: string;
  age?: number;
  city?: string;
  state?: string;
  pincode?: string;
  insurance?: InsuranceDetails;
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
