import { AppointmentStatus } from '../../common/interfaces/api-response.interface';

/**
 * Update Appointment DTO - Simple data transfer object
 * Transfers appointment update data between client and server
 */
export class UpdateAppointmentDto {
  department?: string;
  doctor?: string;
  dateLabel?: string;
  timeLabel?: string;
  fee?: number;
  status?: AppointmentStatus;
  reason?: string;
}
