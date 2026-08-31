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

  // Descriptive fields carried by the seeded dataset and rendered by the
  // portals. The service reads `ward`/`patient` above; these are the richer
  // values behind them, and BedsService.load() derives `ward`/`patient` from
  // wardName/wardId/patientId when a record predates that convention.
  bedNumber?: string;
  wardId?: string;
  wardName?: string;
  type?: string;
  patientId?: string | null;
  dailyRate?: number;
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
