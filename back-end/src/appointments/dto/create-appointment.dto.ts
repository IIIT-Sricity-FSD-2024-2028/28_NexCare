/**
 * Create Appointment DTO - Simple data transfer object
 * Transfers appointment creation data between client and server
 */
export class CreateAppointmentDto {
  patientId: string;
  department: string;
  doctor?: string;
  dateLabel: string;
  timeLabel: string;
  fee?: number;
  reason?: string;
}
