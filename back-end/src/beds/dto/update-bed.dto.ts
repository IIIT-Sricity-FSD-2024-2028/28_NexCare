import { BedStatus } from '../../common/interfaces/api-response.interface';

/**
 * Update Bed DTO - Simple data transfer object
 * Transfers bed update data between client and server
 */
export class UpdateBedDto {
  ward?: string;
  status?: BedStatus;
  patient?: string;
}
