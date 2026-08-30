import { AppointmentStatus } from '../../common/interfaces/api-response.interface';

/**
 * Appointment Entity Interface
 * Represents an appointment in the NexCare system
 */
export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  department: string;
  doctor: string;
  /** User id of the doctor. Absent on rows booked before the doctor portal. */
  doctorId?: string;
  /** Hospital the appointment belongs to — drives per-hospital revenue reporting. */
  hospitalId?: string;
  hospitalName?: string;
  dateLabel: string;
  timeLabel: string;
  token: string;
  fee: number;
  status: AppointmentStatus;
  reason: string;
  referredByDoctorId?: string;
  parentAppointmentId?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Create Appointment Request Interface
 */
export interface CreateAppointmentRequest {
  patientId: string;
  department: string;
  doctor?: string;
  doctorId?: string;
  hospitalId?: string;
  hospitalName?: string;
  dateLabel: string;
  timeLabel: string;
  fee?: number;
  reason?: string;
  referredByDoctorId?: string;
  parentAppointmentId?: string;
  status?: AppointmentStatus;
}

/**
 * Update Appointment Request Interface
 */
export interface UpdateAppointmentRequest {
  department?: string;
  doctor?: string;
  doctorId?: string;
  hospitalId?: string;
  hospitalName?: string;
  dateLabel?: string;
  timeLabel?: string;
  fee?: number;
  status?: AppointmentStatus;
  reason?: string;
  referredByDoctorId?: string;
  parentAppointmentId?: string;
}

/**
 * Appointment Statistics Interface
 */
export interface AppointmentStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  today: number;
  byDepartment: Record<string, number>;
  revenue: number;
}
