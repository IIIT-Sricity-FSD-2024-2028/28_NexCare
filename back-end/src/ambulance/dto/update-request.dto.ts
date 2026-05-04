import { AmbulanceStatus } from '../../common/interfaces/api-response.interface';

/**
 * Update Ambulance Request DTO - Simple data transfer object
 * Transfers ambulance request update data between client and server
 */
export class UpdateAmbulanceRequestDto {
  pickupLocation?: string;
  contact?: string;
  notes?: string;
  status?: AmbulanceStatus;
  assignedTo?: string;
}
