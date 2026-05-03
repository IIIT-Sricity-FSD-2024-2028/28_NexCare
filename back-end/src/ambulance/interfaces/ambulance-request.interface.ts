import { AmbulanceStatus } from '../../common/interfaces/api-response.interface';

/**
 * Ambulance Request Entity Interface
 * Represents an ambulance request in the NexCare system
 */
export interface AmbulanceRequest {
  id: string;
  patientId: string;
  patientName: string;
  pickupLocation: string;
  contact: string;
  notes: string;
  status: AmbulanceStatus;
  assignedTo?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Create Ambulance Request Interface
 */
export interface CreateAmbulanceRequest {
  patientId: string;
  pickupLocation: string;
  contact: string;
  notes?: string;
}

/**
 * Update Ambulance Request Interface
 */
export interface UpdateAmbulanceRequest {
  pickupLocation?: string;
  contact?: string;
  notes?: string;
  status?: AmbulanceStatus;
  assignedTo?: string;
}

/**
 * Ambulance Statistics Interface
 */
export interface AmbulanceStats {
  total: number;
  pending: number;
  dispatched: number;
  enRoute: number;
  pickedUp: number;
  atHospital: number;
  completed: number;
  averageResponseTime: number;
  byStatus: Record<AmbulanceStatus, number>;
}
