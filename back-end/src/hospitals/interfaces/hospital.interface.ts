import { VerificationStatus, SubscriptionStatus } from '../../common/interfaces/api-response.interface';

export interface HospitalPaymentRecord {
  id: string;
  date: string;
  amount: number;
  paymentType: string;
  transactionId: string;
  previousExpiry: string;
  newExpiry: string;
  status: string;
}

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
  regionId?: string;
  code?: string;
  availableBeds?: number;
  occupiedBeds?: number;
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
  // Subscription fields
  subscriptionStartDate?: string;
  subscriptionExpiryDate?: string;
  lastPaymentDate?: string;
  amountPaid?: number;
  paymentStatus?: SubscriptionStatus | string;
  renewalStatus?: string;
  transactionId?: string;
  paymentHistory?: HospitalPaymentRecord[];
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
  subscriptionStartDate?: string;
  subscriptionExpiryDate?: string;
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
  subscriptionStartDate?: string;
  subscriptionExpiryDate?: string;
  lastPaymentDate?: string;
  amountPaid?: number;
  paymentStatus?: SubscriptionStatus | string;
  renewalStatus?: string;
  transactionId?: string;
  paymentHistory?: HospitalPaymentRecord[];
}

export interface RenewSubscriptionDto {
  paymentMethod: 'UPI' | 'Card' | 'Net Banking' | string;
  amount?: number;
  paymentDetails?: {
    upiId?: string;
    cardLast4?: string;
    bankName?: string;
  };
}
