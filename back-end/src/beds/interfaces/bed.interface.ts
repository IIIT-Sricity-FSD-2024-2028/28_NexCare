import { BedStatus } from '../../common/interfaces/api-response.interface';

/**
 * Bed Entity Interface
 * Represents a hospital bed in the NexCare system
 */
export interface Bed {
  id: string;
  ward: string;
  status: BedStatus;
  patient?: string;
  hospitalId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Bed Request Interface
 */
export interface CreateBedRequest {
  id: string;
  ward: string;
}

/**
 * Update Bed Request Interface
 */
export interface UpdateBedRequest {
  ward?: string;
  status?: BedStatus;
  patient?: string;
}

/**
 * Bed Statistics Interface
 */
export interface BedStats {
  total: number;
  available: number;
  occupied: number;
  critical: number;
  maintenance: number;
  byWard: Record<string, number>;
  occupancyRate: number;
}
