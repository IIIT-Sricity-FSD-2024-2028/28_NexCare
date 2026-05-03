/**
 * Create Appointment DTO - Placeholder for validation decorators
 * Teammates will add class-validator decorators here
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
