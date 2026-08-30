import { VerificationStatus } from '../../common/interfaces/api-response.interface';

export interface Hospital {
  id: string;
  name: string;
  registrationNumber: string;
  type: string;
  ownershipType: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website?: string;
  totalBeds: number;
  icuBeds: number;
  specialities: string[];
  emergency24x7: boolean;
  ambulanceService: boolean;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  verificationStatus: VerificationStatus;
  assignedManagerId?: string;
  verificationComments?: string; // Comments from regional manager
  rejectionReason?: string; // Reason for rejection
  suggestedChanges?: string[]; // Suggested changes for hospital
  performanceMetrics?: {
    bedOccupancyRate?: number;
    appointmentCompletionRate?: number;
    patientSatisfactionScore?: number;
    lastUpdated?: string;
  };
  regionalReviewStatus?: 'pending' | 'cleared' | 'rejected';
  regionalReviewedAt?: string;
  regionalReviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHospitalDto {
  name: string;
  registrationNumber: string;
  type: string;
  ownershipType: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website?: string;
  totalBeds: number;
  icuBeds: number;
  specialities: string[];
  emergency24x7: boolean;
  ambulanceService: boolean;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
}

export interface UpdateHospitalDto {
  name?: string;
  type?: string;
  ownershipType?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  website?: string;
  totalBeds?: number;
  icuBeds?: number;
  specialities?: string[];
  emergency24x7?: boolean;
  ambulanceService?: boolean;
  adminName?: string;
  adminEmail?: string;
  adminPhone?: string;
  verificationStatus?: VerificationStatus;
  assignedManagerId?: string;
  verificationComments?: string;
  rejectionReason?: string;
  suggestedChanges?: string[];
  performanceMetrics?: {
    bedOccupancyRate?: number;
    appointmentCompletionRate?: number;
    patientSatisfactionScore?: number;
    lastUpdated?: string;
  };
  regionalReviewStatus?: 'pending' | 'cleared' | 'rejected';
  regionalReviewedAt?: string;
  regionalReviewNotes?: string;
}
